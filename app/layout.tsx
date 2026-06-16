import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "N2 Kanji & Grammar",
  description: "Study JLPT N2 kanji and grammar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <Nav />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
