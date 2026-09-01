"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenText,
  ClipboardCheck,
  Languages,
  Sparkles,
  Star,
} from "lucide-react";
import { loadStarred, STARRED_CHANGE_EVENT } from "@/lib/starred";

const MOTTOES = [
  { japanese: "継続は力なり。", english: "Perseverance becomes strength." },
  {
    japanese: "七転び八起き。",
    english: "Fall seven times, stand up eight.",
  },
  {
    japanese: "千里の道も一歩から。",
    english: "A long journey begins with a single step.",
  },
  {
    japanese: "努力は裏切らない。",
    english: "Hard work will not betray you.",
  },
  {
    japanese: "今日の努力は、明日の自信になる。",
    english: "Today's effort becomes tomorrow's confidence.",
  },
] as const;

const NAV_SECTIONS = [
  {
    label: "Study",
    items: [
      { href: "/", label: "Kanji", icon: Languages },
      { href: "/starred", label: "Starred", icon: Star },
      { href: "/grammar", label: "Grammar", icon: BookOpenText },
    ],
  },
  {
    label: "Practice",
    items: [{ href: "/exam", label: "Exam", icon: ClipboardCheck }],
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [starredCount, setStarredCount] = useState(0);
  const [motto, setMotto] = useState<(typeof MOTTOES)[number]>(MOTTOES[0]);

  useEffect(() => {
    setMotto(MOTTOES[Math.floor(Math.random() * MOTTOES.length)]);
  }, []);

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
        {NAV_SECTIONS.map((section) => (
          <div
            className="nav-section"
            aria-label={section.label}
            key={section.label}
          >
            <div className="nav-section-label">{section.label}</div>
            <div className="tab-list">
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? "tab active" : "tab"}
                  >
                    <Icon className="tab-icon" aria-hidden="true" />
                    <span className="tab-label">{item.label}</span>
                    {item.href === "/starred" && starredCount > 0 && (
                      <span className="tab-badge">{starredCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <footer className="sidebar-footer">
        <div className="motto-heading">
          <Sparkles aria-hidden="true" />
          <span>今日の言葉</span>
        </div>
        <p className="motto-japanese" lang="ja">
          {motto.japanese}
        </p>
        <p className="motto-english">{motto.english}</p>
      </footer>
    </aside>
  );
}
