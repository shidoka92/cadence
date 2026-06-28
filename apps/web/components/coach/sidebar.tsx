"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText, CalendarRange, Euro, MessageSquare, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";

const sections = [
  { group: "Pilotage", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { href: "/eleves", label: "Élèves", icon: Users },
    { href: "/programmes", label: "Programmes", icon: FileText },
    { href: "/planning", label: "Planning", icon: CalendarRange },
  ]},
  { group: "Activité", items: [
    { href: "/revenus", label: "Revenus", icon: Euro },
    { href: "/messagerie", label: "Messagerie", icon: MessageSquare },
    { href: "/parametres", label: "Paramètres", icon: Settings },
  ]},
];

function initialsFrom(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function Sidebar({ coachName = "Coach" }: { coachName?: string }) {
  const path = usePathname();
  return (
    <aside className="w-[226px] shrink-0 bg-[#0A0C0F] border-r border-line flex flex-col p-3.5">
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-5">
        <div className="w-7 h-7 rounded-md bg-acid" />
        <span className="font-display font-bold text-xl uppercase tracking-wider">Cadence</span>
      </div>
      {sections.map((sec) => (
        <div key={sec.group}>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ghost px-2 mt-3 mb-1.5">{sec.group}</div>
          <nav>
            {sec.items.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2.5 rounded-md font-display font-medium text-sm uppercase tracking-wide mb-0.5 transition",
                    active ? "bg-acid text-on-acid" : "text-muted hover:bg-surf hover:text-text"
                  )}>
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="mt-auto flex items-center gap-2.5 px-2 pt-3 border-t border-line">
        <Avatar initials={initialsFrom(coachName)} className="w-8 h-8" />
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">{coachName}</div>
          <div className="font-mono text-[10px] text-ghost uppercase">Coach</div>
        </div>
        <form action="/auth/signout" method="post" className="ml-auto">
          <button type="submit" aria-label="Se déconnecter" className="text-ghost hover:text-risk transition p-1">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
