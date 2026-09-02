import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "伴宠公益｜让每个生命都有回家的路",
  description: "连接救助人、志愿者和领养家庭的宠物公益社区。",
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
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
