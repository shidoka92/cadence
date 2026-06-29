"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, FileText, CalendarRange, Euro, MessageSquare, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useSidebarCollapse } from "@/lib/use-sidebar-collapse";

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
  const { collapsed, toggle } = useSidebarCollapse("cadence-sidebar-coach");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [path]);

  return (
    <>
      <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-line bg-[#0A0C0F] shrink-0">
        <button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu" className="flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70">
          <Menu size={20} />
        </button>
        <div className="w-6 h-6 rounded-md bg-acid shrink-0" />
        <span className="font-display font-bold text-lg uppercase tracking-wider">Cadence</span>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside className={cn(
        "fixed md:relative inset-y-0 left-0 md:inset-auto md:left-auto z-50 md:z-auto",
        "w-[226px] shrink-0 bg-[#0A0C0F] border-r border-line flex flex-col p-3.5",
        "transition-transform duration-200 md:transition-[width]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-[72px]" : "md:w-[226px]"
      )}>
        <button
          onClick={toggle}
          aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
          title={collapsed ? "Déplier" : "Réduire"}
          className="hidden md:flex absolute -right-3 top-16 z-10 items-center justify-center w-6 h-6 rounded-full bg-surf2 border border-line2 text-muted shadow-md hover:text-acid hover:border-acid/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className="flex items-center gap-2.5 px-2 pt-1 pb-5">
          <div className="w-7 h-7 rounded-md bg-acid shrink-0" />
          {!collapsed && <span className="font-display font-bold text-xl uppercase tracking-wider truncate">Cadence</span>}
          <button onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" className="md:hidden ml-auto flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-text hover:bg-surf transition">
            <X size={18} />
          </button>
        </div>
        {sections.map((sec) => (
          <div key={sec.group}>
            {!collapsed && <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ghost px-2 mt-3 mb-1.5">{sec.group}</div>}
            <nav>
              {sec.items.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                  <Link key={href} href={href} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2.5 rounded-md font-display font-medium text-sm uppercase tracking-wide mb-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70",
                      collapsed && "md:justify-center",
                      active ? "bg-acid text-on-acid" : "text-muted hover:bg-surf hover:text-text"
                    )}>
                    <Icon size={16} className="shrink-0" /> <span className={cn(collapsed && "md:hidden")}>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
        <div className={cn("mt-auto flex items-center gap-2.5 px-2 pt-3 border-t border-line", collapsed && "md:flex-col md:gap-3")}>
          <Avatar initials={initialsFrom(coachName)} className="w-8 h-8 shrink-0" />
          <div className={cn("min-w-0", collapsed && "md:hidden")}>
            <div className="text-xs font-semibold truncate">{coachName}</div>
            <div className="font-mono text-[10px] text-ghost uppercase">Coach</div>
          </div>
          <form action="/auth/signout" method="post" className={cn("ml-auto", collapsed && "md:ml-0")}>
            <button type="submit" aria-label="Se déconnecter" className="flex items-center justify-center w-9 h-9 rounded-md text-ghost hover:text-risk hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
