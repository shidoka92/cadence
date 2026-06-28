"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, NotebookPen, CalendarRange, MessageSquare, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { useSidebarCollapse } from "@/lib/use-sidebar-collapse";

const items = [
  { href: "/eleve/accueil", label: "Accueil", icon: LayoutGrid },
  { href: "/eleve/programme", label: "Mon programme", icon: FileText },
  { href: "/eleve/journal", label: "Journal", icon: NotebookPen },
  { href: "/eleve/planning", label: "Planning", icon: CalendarRange },
  { href: "/eleve/messagerie", label: "Messagerie", icon: MessageSquare },
];

function initialsFrom(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function StudentSidebar({ studentName = "Élève", coachName }: { studentName?: string; coachName?: string }) {
  const path = usePathname();
  const { collapsed, toggle } = useSidebarCollapse("cadence-sidebar-eleve");

  return (
    <aside className={cn("shrink-0 bg-[#0A0C0F] border-r border-line flex flex-col p-3.5 transition-[width] duration-200", collapsed ? "w-[72px]" : "w-[226px]")}>
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-5">
        <div className="w-7 h-7 rounded-md bg-acid shrink-0" />
        {!collapsed && <span className="font-display font-bold text-xl uppercase tracking-wider truncate">Cadence</span>}
        <button
          onClick={toggle}
          aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
          className={cn("flex items-center justify-center w-7 h-7 rounded-md text-ghost hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70", !collapsed && "ml-auto")}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>
      </div>
      <nav>
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-md font-display font-medium text-sm uppercase tracking-wide mb-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70",
                collapsed && "justify-center",
                active ? "bg-acid text-on-acid" : "text-muted hover:bg-surf hover:text-text"
              )}>
              <Icon size={16} className="shrink-0" /> {!collapsed && label}
            </Link>
          );
        })}
      </nav>
      <div className={cn("mt-auto flex items-center gap-2.5 px-2 pt-3 border-t border-line", collapsed && "flex-col gap-3")}>
        <Avatar initials={initialsFrom(studentName)} className="w-8 h-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{studentName}</div>
            <div className="font-mono text-[10px] text-ghost uppercase truncate">{coachName ? `Coach : ${coachName}` : "Élève"}</div>
          </div>
        )}
        <form action="/auth/signout" method="post" className={collapsed ? "" : "ml-auto"}>
          <button type="submit" aria-label="Se déconnecter" className="flex items-center justify-center w-9 h-9 rounded-md text-ghost hover:text-risk hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </aside>
  );
}
