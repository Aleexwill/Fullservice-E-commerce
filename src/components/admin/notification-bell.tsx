'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, ShoppingCart, Calculator, Users } from 'lucide-react';
import { fetchJson } from '@/lib/utils';

interface NotificationItem {
  id: string;
  type: 'pedido' | 'presupuesto' | 'lead';
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
}

const LAST_SEEN_KEY = 'fsc-admin-notifications-last-seen';
const POLL_MS = 30000;

const ICONS: Record<NotificationItem['type'], typeof ShoppingCart> = {
  pedido: ShoppingCart,
  presupuesto: Calculator,
  lead: Users,
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY) || '';
    const data = await fetchJson<{ items: NotificationItem[]; unreadCount: number }>(
      `/api/notifications${lastSeen ? `?since=${encodeURIComponent(lastSeen)}` : ''}`
    );
    if (data) {
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        setUnreadCount(0);
      }
      return next;
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-steel-300 transition-colors hover:bg-steel-900 hover:text-arctic"
        aria-label="Notificaciones"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-body text-[0.6rem] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-steel-900/60 bg-carbon-light shadow-xl">
          <div className="border-b border-steel-900/40 px-4 py-3">
            <h3 className="font-display text-body-sm font-semibold text-arctic">Notificaciones</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center font-body text-body-sm text-steel-500">
                Sin novedades por el momento.
              </p>
            ) : (
              items.map((item) => {
                const Icon = ICONS[item.type];
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 border-b border-steel-900/30 px-4 py-3 transition-colors last:border-0 hover:bg-steel-900/50"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-muted text-blue-bright">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-body-sm font-medium text-arctic">{item.title}</p>
                      <p className="truncate font-body text-caption text-steel-500">{item.subtitle}</p>
                    </div>
                    <span className="shrink-0 font-body text-[0.6rem] text-steel-700">
                      {timeAgo(item.createdAt)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
