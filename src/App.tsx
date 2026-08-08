import { FormEvent, useMemo, useState } from "react";
import { PaperField, PaperSection, WarrantyNotePreview } from "./components/WarrantyPreview";

type FormData = {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  warehouseAddress: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  purchaseDate: string;
  expiryDate: string;
  note: string;
  products: Product[];
};

type Product = { id: string; watchType: string; color: string };

const BRAND_NAME = "Nhật Thành Watch Luxury";

const DEFAULT_WARRANTY_NOTE = `LƯU Ý QUAN TRỌNG:
• Đồng hồ chỉ phù hợp khi đi mưa nhẹ hoặc rửa tay nhanh.
• Không sử dụng khi tắm, bơi, xông hơi hoặc ngâm nước để hạn chế hấp hơi và bảo đảm độ bền.
PHẠM VI BẢO HÀNH:
• Lỗi kỹ thuật của bộ máy.
• Sản phẩm không hoạt động đúng chức năng.
• Pin bị lỗi, chai pin hoặc hết pin ngay khi mới sử dụng.
TRƯỜNG HỢP KHÔNG BẢO HÀNH:
• Sản phẩm bị rơi, vỡ hoặc vào nước.
• Sản phẩm đã bị tự ý tháo mở hoặc sửa chữa.
• Hư hỏng do sử dụng sai hướng dẫn.
• Pin hết do hao mòn trong quá trình sử dụng thông thường.`;

const initialData: FormData = {
  storeName: BRAND_NAME,
  storePhone: "0862780551",
  storeAddress: "Cầu Giấy, Hà Nội",
  warehouseAddress: "Lạng Giang, Bắc Ninh",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
  note: DEFAULT_WARRANTY_NOTE,
  products: [{ id: "product-1", watchType: "", color: "" }],
};

const formatDate = (date: string) =>
  date ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T00:00:00`)) : "—";

function escapeFilename(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "khach-hang"
  );
}

export default function App() {
  const [data, setData] = useState<FormData>(initialData);
  const [downloading, setDownloading] = useState(false);
  const warrantyCode = useMemo(
    () => `BH-${(data.purchaseDate || "000000").replaceAll("-", "").slice(2)}-001`,
    [data.purchaseDate],
  );

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((current) => ({ ...current, [key]: value }));
  const addProduct = () =>
    update("products", [...data.products, { id: crypto.randomUUID(), watchType: "", color: "" }]);
  const updateProduct = (id: string, key: "watchType" | "color", value: string) =>
    update(
      "products",
      data.products.map((product) => (product.id === id ? { ...product, [key]: value } : product)),
    );
  const removeProduct = (id: string) =>
    update(
      "products",
      data.products.filter((product) => product.id !== id),
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDownloading(true);

    try {
      const { createWarrantyPdf } = await import("./lib/createWarrantyPdf");
      const pdf = await createWarrantyPdf(data, warrantyCode, BRAND_NAME);
      const pdfBuffer = new ArrayBuffer(pdf.byteLength);
      new Uint8Array(pdfBuffer).set(pdf);
      const blob = new Blob([pdfBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `phieu-bao-hanh-${escapeFilename(data.customerName)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">N</span>
          <span>
            <b>NHẬT THÀNH WATCH LUXURY</b>
            <small>Warranty Studio</small>
          </span>
        </div>
        <span className="secure">● Dữ liệu chỉ lưu trên thiết bị</span>
      </header>
      <section className="hero">
        <span className="eyebrow">QUẢN LÝ BẢO HÀNH</span>
        <h1>
          Tạo phiếu bảo hành
          <br />
          <em>chỉ trong vài phút.</em>
        </h1>
        <p>
          Điền thông tin, xem trước và tải xuống bản PDF chuyên nghiệp sẵn sàng để in hoặc gửi cho
          khách hàng.
        </p>
      </section>
      <form onSubmit={submit} className="workspace">
        <div className="formPanel">
          <div className="panelTitle">
            <span>01</span>
            <div>
              <h2>Thông tin phiếu</h2>
              <p>Điền đầy đủ các trường bên dưới</p>
            </div>
          </div>
          <fieldset>
            <legend>Thông tin cửa hàng</legend>
            <div className="grid two">
              <label>
                Tên cửa hàng
                <input
                  required
                  value={data.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  placeholder="VD: Nhật Thành Watch Luxury"
                />
              </label>
              <label>
                Số điện thoại
                <input
                  required
                  type="tel"
                  value={data.storePhone}
                  onChange={(e) => update("storePhone", e.target.value)}
                  placeholder="0901 234 567"
                />
              </label>
            </div>
            <div className="grid two">
              <label>
                Địa chỉ cửa hàng
                <textarea
                  required
                  rows={2}
                  value={data.storeAddress}
                  onChange={(e) => update("storeAddress", e.target.value)}
                  placeholder="Địa chỉ đầy đủ"
                />
              </label>
              <label>
                Địa chỉ kho
                <textarea
                  required
                  rows={2}
                  value={data.warehouseAddress}
                  onChange={(e) => update("warehouseAddress", e.target.value)}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Thông tin khách hàng</legend>
            <div className="grid two">
              <label>
                Tên khách hàng
                <input
                  required
                  value={data.customerName}
                  onChange={(e) => update("customerName", e.target.value)}
                  placeholder="Nguyễn Văn An"
                />
              </label>
              <label>
                Số điện thoại
                <input
                  required
                  type="tel"
                  value={data.customerPhone}
                  onChange={(e) => update("customerPhone", e.target.value)}
                  placeholder="0987 654 321"
                />
              </label>
            </div>
            <label>
              Địa chỉ khách hàng
              <textarea
                required
                rows={2}
                value={data.customerAddress}
                onChange={(e) => update("customerAddress", e.target.value)}
                placeholder="Địa chỉ đầy đủ"
              />
            </label>
          </fieldset>
          <fieldset className="productsFieldset">
            <legend>Thông tin sản phẩm</legend>
            <div className="productList">
              {data.products.length === 0 && (
                <p className="emptyProducts">Chưa có sản phẩm. Nhấn “Thêm sản phẩm” để bắt đầu.</p>
              )}
              {data.products.map((product, index) => (
                <div className="productRow" key={product.id}>
                  <span className="productNumber">{index + 1}</span>
                  <label>
                    Loại đồng hồ
                    <input
                      required
                      value={product.watchType}
                      onChange={(e) => updateProduct(product.id, "watchType", e.target.value)}
                      placeholder="VD: Đồng hồ cơ"
                    />
                  </label>
                  <label>
                    Màu
                    <input
                      required
                      value={product.color}
                      onChange={(e) => updateProduct(product.id, "color", e.target.value)}
                      placeholder="VD: Bạc"
                    />
                  </label>
                  <button
                    type="button"
                    className="removeProduct"
                    onClick={() => removeProduct(product.id)}
                    aria-label={`Xóa sản phẩm ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="addProduct" onClick={addProduct}>
              ＋ Thêm sản phẩm
            </button>
          </fieldset>
          <fieldset>
            <legend>Thời hạn &amp; điều khoản</legend>
            <div className="grid two">
              <label>
                Ngày mua
                <input
                  required
                  type="date"
                  value={data.purchaseDate}
                  onChange={(e) => update("purchaseDate", e.target.value)}
                />
              </label>
              <label>
                Ngày hết hạn
                <input
                  required
                  type="date"
                  min={data.purchaseDate}
                  value={data.expiryDate}
                  onChange={(e) => update("expiryDate", e.target.value)}
                />
              </label>
            </div>
            <label>
              Lưu ý bảo hành
              <textarea
                rows={14}
                value={data.note}
                onChange={(e) => update("note", e.target.value)}
              />
            </label>
          </fieldset>
          <button className="download" type="submit" disabled={downloading}>
            <span>⇩</span>
            {downloading ? "Đang tạo PDF..." : "Tải xuống PDF"}
          </button>
          <p className="hint">PDF khổ A4 • Sẵn sàng để in • Không cần đăng nhập</p>
        </div>
        <aside className="previewPanel">
          <div className="previewHeading">
            <div>
              <span>02</span>
              <div>
                <h2>Xem trước</h2>
                <p>Cập nhật theo thời gian thực</p>
              </div>
            </div>
            <b>KHỔ A4</b>
          </div>
          <div className="paper">
            <div className="paperHead">
              <strong>{data.storeName || "TÊN CỬA HÀNG"}</strong>
              <small>UY TÍN TẠO NÊN GIÁ TRỊ</small>
              <h3>PHIẾU BẢO HÀNH</h3>
              <p>MÃ PHIẾU: {warrantyCode}</p>
            </div>
            <div className="paperBody">
              <PaperSection title="Thông tin cửa hàng">
                <PaperField label="Tên cửa hàng" value={data.storeName} />
                <PaperField label="Số điện thoại" value={data.storePhone} />
                <PaperField label="Địa chỉ cửa hàng" value={data.storeAddress} />
                <PaperField label="Địa chỉ kho" value={data.warehouseAddress} />
              </PaperSection>
              <PaperSection title="Thông tin khách hàng">
                <PaperField label="Tên khách hàng" value={data.customerName} />
                <PaperField label="Số điện thoại" value={data.customerPhone} />
                <PaperField wide label="Địa chỉ" value={data.customerAddress} />
              </PaperSection>
              <PaperSection title="Thông tin sản phẩm">
                <div className="previewProducts">
                  <div className="previewProductHead">
                    <b>STT</b>
                    <b>Loại đồng hồ</b>
                    <b>Màu</b>
                  </div>
                  {data.products.length === 0 ? (
                    <div className="previewProductEmpty">Chưa có sản phẩm</div>
                  ) : (
                    data.products.slice(0, 4).map((product, index) => (
                      <div className="previewProductRow" key={product.id}>
                        <span>{index + 1}</span>
                        <b>{product.watchType || "—"}</b>
                        <span>{product.color || "—"}</span>
                      </div>
                    ))
                  )}
                  {data.products.length > 4 && (
                    <div className="previewProductMore">
                      + {data.products.length - 4} sản phẩm khác
                    </div>
                  )}
                </div>
              </PaperSection>
              <PaperSection title="Thời hạn bảo hành">
                <PaperField label="Ngày mua" value={formatDate(data.purchaseDate)} />
                <PaperField label="Ngày hết hạn" value={formatDate(data.expiryDate)} />
              </PaperSection>
              <PaperSection title="Lưu ý bảo hành">
                <WarrantyNotePreview text={data.note || DEFAULT_WARRANTY_NOTE} />
              </PaperSection>
              <div className="sign">
                <div>
                  <b>KHÁCH HÀNG</b>
                  <small>(Ký và ghi rõ họ tên)</small>
                </div>
                <div>
                  <b>ĐẠI DIỆN CỬA HÀNG</b>
                  <small>(Ký và ghi rõ họ tên)</small>
                </div>
              </div>
            </div>
            <div className="paperFoot">
              {BRAND_NAME} • {data.storePhone || "—"} • {data.storeAddress || "—"}
            </div>
          </div>
        </aside>
      </form>
      <footer>
        © {new Date().getFullYear()} Nhật Thành Watch Luxury <span>•</span> Thiết kế cho trải nghiệm
        chuyên nghiệp
      </footer>
    </main>
  );
}
