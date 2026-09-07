import type { Metadata } from "next";
import "./globals.css";
import Nav from "./components/Nav";
import AccountProvider from "./components/AccountProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <TooltipProvider>
            <SidebarProvider
              style={{ "--sidebar-width": "17.5rem" } as React.CSSProperties}
            >
              <Nav />
              <div className="shadcn-main-shell">
                <div className="sidebar-toolbar">
                  <SidebarTrigger aria-label="Toggle navigation" />
                </div>
                <div className="content">{children}</div>
              </div>
            </SidebarProvider>
          </TooltipProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
