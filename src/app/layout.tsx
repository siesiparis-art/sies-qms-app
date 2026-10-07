import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QmsProvider } from "@/context/QmsContext";

export const metadata: Metadata = {
  title: "SIES ERP & QMS - Sipariş ve Kalite Yönetim Sistemi",
  description: "Yapay Zeka Destekli Sipariş Takip, İrsaliye ve Kalite Yönetim Sistemi (ISO 9001 & TS EN 61537)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIES ERP",
  },
  applicationName: "SIES ERP",
  icons: {
    icon: "/sies_logo.png",
    apple: "/sies_logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800" style={{ fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        <QmsProvider>
          {children}
        </QmsProvider>
      </body>
    </html>
  );
}
