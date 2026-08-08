# Warranty Card Generator

Ứng dụng React tạo phiếu bảo hành cho Nhật Thành Watch Luxury, xem trước theo thời gian thực và tải xuống PDF khổ A4.

## Chạy trên máy

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal.

## Kiểm tra bản production

```bash
npm run build
npm run preview
```

Website tĩnh được tạo trong thư mục `dist`.

## Cấu trúc mã nguồn

```text
src/
├── components/       # Component giao diện có thể tái sử dụng
├── styles/           # CSS toàn cục và CSS theo nhóm component
├── App.tsx           # Component ứng dụng chính
└── main.tsx          # Entry point của Vite
```

## GitHub Pages

Mỗi lần có commit mới trên nhánh `main`, workflow `.github/workflows/deploy-pages.yml` sẽ build và triển khai website lên:

https://thanh-bung-5501.github.io/warranty-card-generator/
