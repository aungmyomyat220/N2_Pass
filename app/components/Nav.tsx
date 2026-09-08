"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AudioLines,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronsUpDown,
  ClipboardCheck,
  Languages,
  Sparkles,
  Star,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { loadStarred, STARRED_CHANGE_EVENT } from "@/lib/starred";
import { AccountControls } from "./AccountProvider";

const MOTTOES = [
  { japanese: "継続は力なり。", english: "Perseverance becomes strength." },
  { japanese: "七転び八起き。", english: "Fall seven times, stand up eight." },
  { japanese: "千里の道も一歩から。", english: "A long journey begins with a single step." },
  { japanese: "努力は裏切らない。", english: "Hard work will not betray you." },
  { japanese: "今日の努力は、明日の自信になる。", english: "Today's effort becomes tomorrow's confidence." },
] as const;

const STUDY_ITEMS = [
  { href: "/starred", label: "Starred", icon: Star },
  { href: "/grammar", label: "Grammar", icon: BookOpenText },
  { href: "/mimetic", label: "Mimetic Words", icon: AudioLines },
];

export default function Nav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [starredCount, setStarredCount] = useState(0);
  const [kanjiOpen, setKanjiOpen] = useState(false);
  const [motto, setMotto] = useState<(typeof MOTTOES)[number]>(MOTTOES[0]);
  const kanjiActive = pathname === "/" || pathname.startsWith("/kanji/");

  useEffect(() => {
    setMotto(MOTTOES[Math.floor(Math.random() * MOTTOES.length)]);
  }, []);

  useEffect(() => {
    if (kanjiActive) setKanjiOpen(true);
  }, [kanjiActive]);

  useEffect(() => {
    const refreshCount = () => setStarredCount(loadStarred().length);
    refreshCount();
    window.addEventListener(STARRED_CHANGE_EVENT, refreshCount);
    window.addEventListener("storage", refreshCount);
    return () => {
      window.removeEventListener(STARRED_CHANGE_EVENT, refreshCount);
      window.removeEventListener("storage", refreshCount);
    };
  }, []);

  const closeMobile = () => setOpenMobile(false);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<SidebarMenuButton size="lg" className="sidebar-app-switcher" tooltip="Switch JLPT app" />}
              >
                <span className="sidebar-brand-logo" aria-hidden="true">
                  <Image src="/torii-gate-logo.jpeg" alt="" width={64} height={64} priority />
                </span>
                <span className="sidebar-app-copy group-data-[collapsible=icon]:hidden">
                  <strong><span className="sidebar-app-level">N2</span><span className="sidebar-app-japanese" lang="ja">学習</span></strong>
                  <small>JLPT Study App</small>
                </span>
                <ChevronsUpDown className="sidebar-app-chevron ml-auto group-data-[collapsible=icon]:hidden" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="sidebar-app-menu" side="bottom" align="start" sideOffset={8}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Switch JLPT app</DropdownMenuLabel>
                  <DropdownMenuItem className="sidebar-level-option" render={<Link href="/" onClick={closeMobile} />}>
                    <span className="sidebar-level-mark">N2</span>
                    <span className="sidebar-level-copy"><strong>N2 Study</strong><small>Current app</small></span>
                    <Check className="sidebar-level-check" aria-hidden="true" />
                  </DropdownMenuItem>
                  {(["N1", "N3", "N5"] as const).map((level) => (
                    <DropdownMenuItem className="sidebar-level-option" disabled key={level}>
                      <span className="sidebar-level-mark is-muted">{level}</span>
                      <span className="sidebar-level-copy"><strong>{level} Study</strong><small>Coming soon</small></span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Study</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={kanjiActive}
                  tooltip="Kanji"
                  aria-expanded={kanjiOpen}
                  onClick={() => setKanjiOpen((open) => !open)}
                >
                  <Languages />
                  <span>Kanji</span>
                  <ChevronDown className={`ml-auto transition-transform${kanjiOpen ? " rotate-180" : ""}`} />
                </SidebarMenuButton>
                {kanjiOpen && (
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={pathname === "/"} render={<Link href="/" onClick={closeMobile} />}>
                        <span>Normal</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive={pathname === "/kanji/same-pattern"} render={<Link href="/kanji/same-pattern" onClick={closeMobile} />}>
                        <span>Same Pattern</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {STUDY_ITEMS.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton isActive={active} tooltip={item.label} render={<Link href={item.href} onClick={closeMobile} />}>
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.href === "/starred" && starredCount > 0 && (
                      <SidebarMenuBadge>{starredCount}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Practice</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/exam" || pathname.startsWith("/exam/")} tooltip="Exam" render={<Link href="/exam" onClick={closeMobile} />}>
                  <ClipboardCheck />
                  <span>Exam</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="group-data-[collapsible=icon]:hidden">
          <AccountControls />
        </div>
        <SidebarSeparator />
        <div className="sidebar-footer group-data-[collapsible=icon]:hidden">
          <div className="motto-heading">
            <Sparkles aria-hidden="true" />
            <span>今日の言葉</span>
          </div>
          <p className="motto-japanese" lang="ja">{motto.japanese}</p>
          <p className="motto-english">{motto.english}</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
