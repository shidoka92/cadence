"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";

export type NotificationItem = { id: string; title: string; href?: string; read: boolean; time: string };

export function NotificationBell({ unreadCount, items }: { unreadCount: number; items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : "Notifications"}
        className="relative flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"
      >
        <Bell size={16} />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-risk" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full mt-2 w-72 max-h-96 overflow-y-auto bg-surf border border-line rounded-lg shadow-xl z-50">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-line">
              <span className="font-display text-xs font-semibold uppercase tracking-wide">Notifications</span>
              {unreadCount > 0 && (
                <form action={markAllNotificationsRead} className="ml-auto">
                  <button type="submit" className="font-mono text-[10px] uppercase tracking-wider text-acid">Tout lire</button>
                </form>
              )}
            </div>
            {items.length === 0 ? (
              <div className="px-3.5 py-6 text-center text-xs text-muted">Aucune notification.</div>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.href ?? "#"}
                  onClick={() => { setOpen(false); if (!n.read) markNotificationRead(n.id); }}
                  className={cn("flex items-start gap-2 px-3.5 py-2.5 border-b border-line last:border-0 hover:bg-hover transition", !n.read && "bg-acid/5")}
                >
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-acid mt-1.5 shrink-0" />}
                  <span className="flex-1 text-xs">{n.title}</span>
                  <span className="font-mono text-[9px] text-ghost whitespace-nowrap">{n.time}</span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
