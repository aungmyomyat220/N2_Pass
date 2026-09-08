import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export default function PageHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  descriptionLang,
  stat,
  statLabel,
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  descriptionLang?: string;
  stat: ReactNode;
  statLabel: string;
  action?: ReactNode;
}) {
  return (
    <header className="starred-hero shared-page-hero">
      <div className="starred-hero-main">
        <span className="starred-hero-icon" aria-hidden="true"><Icon /></span>
        <div>
          <span className="grammar-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p lang={descriptionLang}>{description}</p>
        </div>
      </div>
      <div className="shared-page-hero-aside">
        <div className="starred-total"><strong>{stat}</strong><span>{statLabel}</span></div>
        {action && <div className="shared-page-hero-action">{action}</div>}
      </div>
    </header>
  );
}
