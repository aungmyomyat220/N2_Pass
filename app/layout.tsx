import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import AccountProvider from "./components/AccountProvider";

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
        <AccountProvider>
          <div className="layout">
            <Nav />
            <div className="content">{children}</div>
          </div>
        </AccountProvider>
      </body>
    </html>
  );
}
