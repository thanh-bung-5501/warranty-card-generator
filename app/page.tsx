"use client";

import { FormEvent, useMemo, useState } from "react";

type FormData = {
  storeName: string; storePhone: string; storeAddress: string;
  customerName: string; customerPhone: string; customerAddress: string;
  purchaseDate: string; expiryDate: string; note: string;
};

const DEFAULT_WARRANTY_NOTE = `📌 Lưu ý quan trọng:
Đồng hồ chỉ phù hợp đeo khi đi mưa nhẹ, rửa tay nhanh.
Không sử dụng khi tắm, bơi, xông hơi hoặc ngâm nước để đảm bảo độ bền và tránh hấp hơi.
✅ Shop bảo hành khi:
Máy bị lỗi kỹ thuật
Máy không hoạt động đúng chức năng
Pin bị lỗi (chai pin, hết pin khi mới sử dụng)
❌ Shop Không bảo hành khi:
Làm rơi, vỡ
Vào nước
Tự ý tháo máy
Hỏng do sử dụng sai cách
Pin hết do sử dụng bình thường`;

const initialData: FormData = {
  storeName: "WATCH LUXURY", storePhone: "0901 234 567",
  storeAddress: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  customerName: "", customerPhone: "", customerAddress: "",
  purchaseDate: new Date().toISOString().slice(0, 10), expiryDate: "", note: DEFAULT_WARRANTY_NOTE,
};

const formatDate = (date: string) => date
  ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T00:00:00`))
  : "—";

function escapeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "khach-hang";
}

function createPdfFromJpeg(jpeg: Uint8Array, width: number, height: number) {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const add = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    parts.push(bytes); length += bytes.length;
  };
  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const object = (id: number, body: string | Uint8Array, suffix = "") => {
    offsets[id] = length; add(`${id} 0 obj\n`); add(body); add(`${suffix}\nendobj\n`);
  };
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>");
  offsets[4] = length;
  add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  add(jpeg); add("\nendstream\nendobj\n");
  const stream = "q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ";
  object(5, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const xref = length;
  add("xref\n0 6\n0000000000 65535 f \n");
  for (let i = 1; i <= 5; i++) add(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result = new Uint8Array(length); let cursor = 0;
  parts.forEach((part) => { result.set(part, cursor); cursor += part.length; });
  return result;
}

export default function Home() {
  const [data, setData] = useState<FormData>(initialData);
  const [downloading, setDownloading] = useState(false);
  const warrantyCode = useMemo(() => `BH-${(data.purchaseDate || "000000").replaceAll("-", "").slice(2)}-001`, [data.purchaseDate]);

  const update = (key: keyof FormData, value: string) => setData((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setDownloading(true);
    await document.fonts.ready;
    const canvas = document.createElement("canvas"); canvas.width = 1240; canvas.height = 1754;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const navy = "#10243e", gold = "#b5904f", ink = "#273346", muted = "#697386";
    ctx.fillStyle = "#fbfaf7"; ctx.fillRect(0, 0, 1240, 1754);
    ctx.fillStyle = navy; ctx.fillRect(0, 0, 1240, 292);
    ctx.fillStyle = gold; ctx.fillRect(0, 292, 1240, 9);
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = '700 31px "Times New Roman"'; ctx.fillText(data.storeName || "TÊN CỬA HÀNG", 620, 78);
    ctx.fillStyle = "#d7c49d"; ctx.font = '16px "Times New Roman"'; ctx.fillText("UY TÍN TẠO NÊN GIÁ TRỊ", 620, 111);
    ctx.font = '700 52px "Times New Roman"'; ctx.fillStyle = "#fff"; ctx.fillText("PHIẾU BẢO HÀNH", 620, 190);
    ctx.font = '18px "Times New Roman"'; ctx.fillStyle = "#dfe5ec"; ctx.fillText(`MÃ PHIẾU: ${warrantyCode}`, 620, 234);
    const line = (y: number) => { ctx.strokeStyle = "#d9d5cb"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(86, y); ctx.lineTo(1154, y); ctx.stroke(); };
    const wrap = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) => {
      let row = 0;
      for (const paragraph of (text || "—").split("\n")) {
        const words = paragraph.split(" "); let current = "";
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && current) {
            ctx.fillText(current, x, y + row * lineHeight); row++;
            if (row >= maxLines) return;
            current = word;
          } else current = test;
        }
        if (row >= maxLines) return;
        ctx.fillText(current, x, y + row * lineHeight); row++;
      }
    };
    const section = (title: string, y: number) => { ctx.textAlign = "left"; ctx.fillStyle = gold; ctx.font = '700 18px "Times New Roman"'; ctx.fillText(title.toUpperCase(), 86, y); line(y + 20); };
    const field = (label: string, value: string, x: number, y: number, width = 470) => {
      ctx.fillStyle = muted; ctx.font = '15px "Times New Roman"'; ctx.fillText(label.toUpperCase(), x, y);
      ctx.fillStyle = ink; ctx.font = '700 23px "Times New Roman"'; wrap(value, x, y + 37, width, 30);
    };
    section("Thông tin cửa hàng", 363);
    field("Tên cửa hàng", data.storeName, 86, 423); field("Số điện thoại", data.storePhone, 670, 423);
    field("Địa chỉ", data.storeAddress, 86, 520, 1068); section("Thông tin khách hàng", 632);
    field("Tên khách hàng", data.customerName, 86, 692); field("Số điện thoại", data.customerPhone, 670, 692);
    field("Địa chỉ", data.customerAddress, 86, 789, 1068); section("Thời hạn bảo hành", 901);
    field("Ngày mua", formatDate(data.purchaseDate), 86, 961); field("Ngày hết hạn", formatDate(data.expiryDate), 670, 961);
    section("Lưu ý bảo hành", 1081); ctx.fillStyle = ink; ctx.font = '14px "Times New Roman", "Segoe UI Emoji"'; wrap(data.note || DEFAULT_WARRANTY_NOTE, 86, 1132, 1068, 22, 17);
    ctx.fillStyle = "#f1ede4"; ctx.fillRect(86, 1510, 1068, 1);
    ctx.textAlign = "center"; ctx.fillStyle = ink; ctx.font = '700 17px "Times New Roman"'; ctx.fillText("KHÁCH HÀNG", 300, 1552); ctx.fillText("ĐẠI DIỆN CỬA HÀNG", 940, 1552);
    ctx.fillStyle = muted; ctx.font = 'italic 15px "Times New Roman"'; ctx.fillText("(Ký và ghi rõ họ tên)", 300, 1582); ctx.fillText("(Ký, đóng dấu)", 940, 1582);
    ctx.fillStyle = navy; ctx.fillRect(0, 1658, 1240, 96); ctx.fillStyle = "#fff"; ctx.font = '16px "Times New Roman"';
    ctx.fillText(`${data.storePhone || "—"}  •  ${data.storeAddress || "—"}`, 620, 1708);
    const uri = canvas.toDataURL("image/jpeg", .95); const raw = atob(uri.split(",")[1]); const jpeg = Uint8Array.from(raw, c => c.charCodeAt(0));
    const pdf = createPdfFromJpeg(jpeg, canvas.width, canvas.height); const blob = new Blob([pdf], { type: "application/pdf" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `phieu-bao-hanh-${escapeFilename(data.customerName)}.pdf`; link.click(); URL.revokeObjectURL(link.href); setDownloading(false);
  };

  return (
    <main>
      <header className="topbar"><div className="brand"><span className="brandMark">W</span><span><b>WATCH LUXURY</b><small>Warranty Studio</small></span></div><span className="secure">● Dữ liệu chỉ lưu trên thiết bị</span></header>
      <section className="hero"><span className="eyebrow">QUẢN LÝ BẢO HÀNH</span><h1>Tạo phiếu bảo hành<br /><em>chỉ trong vài phút.</em></h1><p>Điền thông tin, xem trước và tải xuống bản PDF chuyên nghiệp sẵn sàng để in hoặc gửi cho khách hàng.</p></section>
      <form onSubmit={submit} className="workspace">
        <div className="formPanel">
          <div className="panelTitle"><span>01</span><div><h2>Thông tin phiếu</h2><p>Điền đầy đủ các trường bên dưới</p></div></div>
          <fieldset><legend>Thông tin cửa hàng</legend><div className="grid two"><label>Tên cửa hàng<input required value={data.storeName} onChange={e => update("storeName", e.target.value)} placeholder="VD: Watch Luxury" /></label><label>Số điện thoại<input required type="tel" value={data.storePhone} onChange={e => update("storePhone", e.target.value)} placeholder="0901 234 567" /></label></div><label>Địa chỉ cửa hàng<textarea required rows={2} value={data.storeAddress} onChange={e => update("storeAddress", e.target.value)} placeholder="Địa chỉ đầy đủ" /></label></fieldset>
          <fieldset><legend>Thông tin khách hàng</legend><div className="grid two"><label>Tên khách hàng<input required value={data.customerName} onChange={e => update("customerName", e.target.value)} placeholder="Nguyễn Văn An" /></label><label>Số điện thoại<input required type="tel" value={data.customerPhone} onChange={e => update("customerPhone", e.target.value)} placeholder="0987 654 321" /></label></div><label>Địa chỉ khách hàng<textarea required rows={2} value={data.customerAddress} onChange={e => update("customerAddress", e.target.value)} placeholder="Địa chỉ đầy đủ" /></label></fieldset>
          <fieldset><legend>Thời hạn &amp; điều khoản</legend><div className="grid two"><label>Ngày mua<input required type="date" value={data.purchaseDate} onChange={e => update("purchaseDate", e.target.value)} /></label><label>Ngày hết hạn<input required type="date" min={data.purchaseDate} value={data.expiryDate} onChange={e => update("expiryDate", e.target.value)} /></label></div><label>Lưu ý bảo hành<textarea rows={14} value={data.note} onChange={e => update("note", e.target.value)} /></label></fieldset>
          <button className="download" type="submit" disabled={downloading}><span>⇩</span>{downloading ? "Đang tạo PDF..." : "Tải xuống PDF"}</button><p className="hint">PDF khổ A4 • Sẵn sàng để in • Không cần đăng nhập</p>
        </div>
        <aside className="previewPanel"><div className="previewHeading"><div><span>02</span><div><h2>Xem trước</h2><p>Cập nhật theo thời gian thực</p></div></div><b>KHỔ A4</b></div>
          <div className="paper"><div className="paperHead"><strong>{data.storeName || "TÊN CỬA HÀNG"}</strong><small>UY TÍN TẠO NÊN GIÁ TRỊ</small><h3>PHIẾU BẢO HÀNH</h3><p>MÃ PHIẾU: {warrantyCode}</p></div>
            <div className="paperBody"><PaperSection title="Thông tin cửa hàng"><PaperField label="Tên cửa hàng" value={data.storeName} /><PaperField label="Số điện thoại" value={data.storePhone} /><PaperField wide label="Địa chỉ" value={data.storeAddress} /></PaperSection><PaperSection title="Thông tin khách hàng"><PaperField label="Tên khách hàng" value={data.customerName} /><PaperField label="Số điện thoại" value={data.customerPhone} /><PaperField wide label="Địa chỉ" value={data.customerAddress} /></PaperSection><PaperSection title="Thời hạn bảo hành"><PaperField label="Ngày mua" value={formatDate(data.purchaseDate)} /><PaperField label="Ngày hết hạn" value={formatDate(data.expiryDate)} /></PaperSection><PaperSection title="Lưu ý bảo hành"><p className="note">{data.note || DEFAULT_WARRANTY_NOTE}</p></PaperSection><div className="sign"><div><b>KHÁCH HÀNG</b><small>(Ký và ghi rõ họ tên)</small></div><div><b>ĐẠI DIỆN CỬA HÀNG</b><small>(Ký, đóng dấu)</small></div></div></div><div className="paperFoot">{data.storePhone || "—"} • {data.storeAddress || "—"}</div></div>
        </aside>
      </form>
      <footer>© {new Date().getFullYear()} Watch Luxury Warranty Studio <span>•</span> Thiết kế cho trải nghiệm chuyên nghiệp</footer>
    </main>
  );
}

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="paperSection"><h4>{title}</h4><div className="paperGrid">{children}</div></section>; }
function PaperField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) { return <div className={wide ? "paperField wide" : "paperField"}><small>{label}</small><b>{value || "—"}</b></div>; }
