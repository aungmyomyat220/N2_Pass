"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Kanji" },
  { href: "/grammar", label: "Grammar" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={active ? "tab active" : "tab"}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
