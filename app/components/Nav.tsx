"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadStarred, STARRED_CHANGE_EVENT } from "@/lib/starred";

const TABS = [
  { href: "/", label: "Kanji", icon: "✍️" },
  { href: "/starred", label: "Starred", icon: "⭐" },
  { href: "/grammar", label: "Grammar", icon: "📖" },
  { href: "/exam", label: "Exam", icon: "🎯" },
];

export default function Nav() {
  const pathname = usePathname();
  const [starredCount, setStarredCount] = useState(0);

  useEffect(() => {
    const refreshCount = () => setStarredCount(loadStarred().length);
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>;
      setStarredCount(customEvent.detail?.length ?? loadStarred().length);
    };

    refreshCount();
    window.addEventListener(STARRED_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", refreshCount);
    return () => {
      window.removeEventListener(STARRED_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", refreshCount);
    };
  }, []);

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
              {t.href === "/starred" && starredCount > 0 && (
                <span className="tab-badge">{starredCount}</span>
              )}
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
