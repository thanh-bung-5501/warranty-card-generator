import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";

type WarrantyProduct = {
  watchType: string;
  color: string;
};

export type WarrantyPdfData = {
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
  products: WarrantyProduct[];
};

type DrawContext = {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  pageHeight: number;
  scale: number;
};

const navy = rgb(16 / 255, 36 / 255, 62 / 255);
const gold = rgb(181 / 255, 144 / 255, 79 / 255);
const ink = rgb(39 / 255, 51 / 255, 70 / 255);
const muted = rgb(105 / 255, 115 / 255, 134 / 255);
const cream = rgb(251 / 255, 250 / 255, 247 / 255);
const lineColor = rgb(217 / 255, 213 / 255, 203 / 255);

function formatDate(date: string) {
  return date ? new Intl.DateTimeFormat("vi-VN").format(new Date(`${date}T00:00:00`)) : "—";
}

function drawText(
  context: DrawContext,
  text: string,
  x: number,
  baseline: number,
  size: number,
  options: { bold?: boolean; color?: ReturnType<typeof rgb>; center?: boolean } = {},
) {
  const font = options.bold ? context.bold : context.regular;
  const scaledSize = size * context.scale;
  const scaledX = x * context.scale;
  const width = font.widthOfTextAtSize(text, scaledSize);
  context.page.drawText(text, {
    x: options.center ? scaledX - width / 2 : scaledX,
    y: context.pageHeight - baseline * context.scale,
    size: scaledSize,
    font,
    color: options.color ?? ink,
  });
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of (text || "—").split("\n")) {
    let current = "";
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current || " ");
  }
  return lines;
}

function drawWrappedField(
  context: DrawContext,
  label: string,
  value: string,
  x: number,
  baseline: number,
  width = 470,
) {
  drawText(context, label.toUpperCase(), x, baseline, 15, { color: muted });
  const size = 23 * context.scale;
  const lines = wrapText(context.bold, value, size, width * context.scale).slice(0, 3);
  lines.forEach((line, index) =>
    drawText(context, line, x, baseline + 37 + index * 30, 23, { bold: true }),
  );
}

function drawSection(context: DrawContext, title: string, baseline: number) {
  drawText(context, title.toUpperCase(), 86, baseline, 18, { bold: true, color: gold });
  context.page.drawLine({
    start: { x: 86 * context.scale, y: context.pageHeight - (baseline + 20) * context.scale },
    end: { x: 1154 * context.scale, y: context.pageHeight - (baseline + 20) * context.scale },
    thickness: 0.5,
    color: lineColor,
  });
}

export async function createWarrantyPdf(
  data: WarrantyPdfData,
  warrantyCode: string,
  brandName: string,
) {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}fonts/NotoSerif-Regular.ttf`).then((response) =>
      response.arrayBuffer(),
    ),
    fetch(`${import.meta.env.BASE_URL}fonts/NotoSerif-Bold.ttf`).then((response) =>
      response.arrayBuffer(),
    ),
  ]);
  const [regular, bold] = await Promise.all([
    document.embedFont(regularBytes, { subset: true }),
    document.embedFont(boldBytes, { subset: true }),
  ]);

  const page = document.addPage([595.28, 841.89]);
  const scale = page.getWidth() / 1240;
  const context: DrawContext = { page, regular, bold, pageHeight: page.getHeight(), scale };

  page.drawRectangle({
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
    color: cream,
  });
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 175 * scale,
    width: page.getWidth(),
    height: 175 * scale,
    color: navy,
  });
  page.drawRectangle({
    x: 0,
    y: page.getHeight() - 184 * scale,
    width: page.getWidth(),
    height: 9 * scale,
    color: gold,
  });

  drawText(context, data.storeName || "TÊN CỬA HÀNG", 620, 38, 27, {
    bold: true,
    color: rgb(1, 1, 1),
    center: true,
  });
  drawText(context, "UY TÍN TẠO NÊN GIÁ TRỊ", 620, 64, 16, {
    color: rgb(215 / 255, 196 / 255, 157 / 255),
    center: true,
  });
  drawText(context, "PHIẾU BẢO HÀNH", 620, 116, 40, {
    bold: true,
    color: rgb(1, 1, 1),
    center: true,
  });
  drawText(context, `MÃ PHIẾU: ${warrantyCode}`, 620, 148, 16, {
    color: rgb(223 / 255, 229 / 255, 236 / 255),
    center: true,
  });

  drawSection(context, "Thông tin cửa hàng", 253);
  drawWrappedField(context, "Tên cửa hàng", data.storeName, 86, 313);
  drawWrappedField(context, "Số điện thoại", data.storePhone, 670, 313);
  drawWrappedField(context, "Địa chỉ cửa hàng", data.storeAddress, 86, 410);
  drawWrappedField(context, "Địa chỉ kho", data.warehouseAddress, 670, 410);

  drawSection(context, "Thông tin khách hàng", 522);
  drawWrappedField(context, "Tên khách hàng", data.customerName, 86, 582);
  drawWrappedField(context, "Số điện thoại", data.customerPhone, 670, 582);
  drawWrappedField(context, "Địa chỉ", data.customerAddress, 86, 679, 1068);

  drawSection(context, "Thông tin sản phẩm", 765);
  drawText(context, "STT", 86, 808, 14, { bold: true, color: muted });
  drawText(context, "LOẠI ĐỒNG HỒ", 165, 808, 14, { bold: true, color: muted });
  drawText(context, "MÀU", 770, 808, 14, { bold: true, color: muted });
  data.products.slice(0, 4).forEach((product, index) => {
    const y = 840 + index * 27;
    drawText(context, String(index + 1), 96, y, 16);
    drawText(context, product.watchType || "—", 165, y, 16);
    drawText(context, product.color || "—", 770, y, 16);
  });
  if (data.products.length > 4) {
    drawText(context, `+ ${data.products.length - 4} sản phẩm khác`, 165, 948, 14, {
      color: muted,
    });
  }

  drawSection(context, "Thời hạn bảo hành", 965);
  drawWrappedField(context, "Ngày mua", formatDate(data.purchaseDate), 86, 1008);
  drawWrappedField(context, "Ngày hết hạn", formatDate(data.expiryDate), 670, 1008);

  drawSection(context, "Lưu ý bảo hành", 1090);
  let noteY = 1130;
  for (const noteLine of data.note.split("\n").slice(0, 15)) {
    const heading = noteLine.trim().endsWith(":");
    drawText(context, noteLine, 86, noteY, heading ? 13 : 12, {
      bold: heading,
      color: heading ? gold : ink,
    });
    noteY += heading ? 19 : 17;
  }

  page.drawLine({
    start: { x: 86 * scale, y: context.pageHeight - 1400 * scale },
    end: { x: 1154 * scale, y: context.pageHeight - 1400 * scale },
    thickness: 0.5,
    color: lineColor,
  });
  drawText(context, "KHÁCH HÀNG", 300, 1442, 17, { bold: true, center: true });
  drawText(context, "ĐẠI DIỆN CỬA HÀNG", 940, 1442, 17, { bold: true, center: true });
  drawText(context, "(Ký và ghi rõ họ tên)", 300, 1472, 15, { color: muted, center: true });
  drawText(context, "(Ký và ghi rõ họ tên)", 940, 1472, 15, { color: muted, center: true });

  page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: 96 * scale, color: navy });
  drawText(
    context,
    `${brandName}  •  ${data.storePhone || "—"}  •  ${data.storeAddress || "—"}`,
    620,
    1708,
    16,
    { color: rgb(1, 1, 1), center: true },
  );

  document.setTitle(`Phiếu bảo hành - ${data.customerName || "Khách hàng"}`);
  document.setAuthor(brandName);
  document.setCreator("Warranty Studio");
  return document.save();
}
