import type { Metadata } from "next";
import "./globals.css";
import "./typography-fixes.css";

export const metadata: Metadata = {
  title: "Phiếu Bảo Hành | Nhật Thành Watch Luxury",
  description: "Tạo và tải xuống phiếu bảo hành PDF chuyên nghiệp.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
