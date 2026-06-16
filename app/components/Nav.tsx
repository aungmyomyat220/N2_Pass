"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Kanji", icon: "✍️" },
  { href: "/grammar", label: "Grammar", icon: "📖" },
  { href: "/exam", label: "Exam", icon: "🎯" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">N2 学習</div>
      <nav className="tabs">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={active ? "tab active" : "tab"}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sticker" title="がんばって！">
        <span className="sticker-emoji">🎴</span>
        <span className="sticker-text">がんばって！</span>
      </div>
    </aside>
  );
}
