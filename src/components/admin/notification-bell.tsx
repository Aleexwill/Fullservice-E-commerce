'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, ShoppingCart, Calculator, Users, X, Trash2 } from 'lucide-react';
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
const DISMISSED_KEY = 'fsc-admin-notifications-dismissed';
const POLL_MS = 30000;

const ICONS: Record<NotificationItem['type'], typeof ShoppingCart> = {
  pedido: ShoppingCart,
  presupuesto: Calculator,
  lead: Users,
};

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {}
}

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
  const [allItems, setAllItems] = useState<NotificationItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = allItems.filter((i) => !dismissed.has(`${i.type}-${i.id}`));

  const load = useCallback(async () => {
    const lastSeen = localStorage.getItem(LAST_SEEN_KEY) || '';
    const data = await fetchJson<{ items: NotificationItem[]; unreadCount: number }>(
      `/api/notifications${lastSeen ? `?since=${encodeURIComponent(lastSeen)}` : ''}`
    );
    if (data) {
      const currentDismissed = getDismissed();
      const visible = data.items.filter((i) => !currentDismissed.has(`${i.type}-${i.id}`));
      setAllItems(data.items);
      setDismissed(currentDismissed);
      // recount unread against visible items only
      const sinceDate = lastSeen ? new Date(lastSeen) : null;
      const unread = sinceDate
        ? visible.filter((i) => new Date(i.createdAt) > sinceDate).length
        : visible.length;
      setUnreadCount(unread);
    }
  }, []);

  useEffect(() => {
    setDismissed(getDismissed());
    load();
    const interval = setInterval(load, POLL_MS);
    // refresh when tab regains focus (catches deletes made in other tabs)
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

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

  function dismiss(item: NotificationItem, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const key = `${item.type}-${item.id}`;
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveDismissed(next);
      return next;
    });
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function dismissAll(e: React.MouseEvent) {
    e.preventDefault();
    const next = new Set(allItems.map((i) => `${i.type}-${i.id}`));
    saveDismissed(next);
    setDismissed(next);
    setUnreadCount(0);
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
          <div className="flex items-center justify-between border-b border-steel-900/40 px-4 py-3">
            <h3 className="font-display text-body-sm font-semibold text-arctic">Notificaciones</h3>
            {items.length > 0 && (
              <button
                type="button"
                onClick={dismissAll}
                className="flex items-center gap-1 rounded px-2 py-1 font-body text-[0.65rem] text-steel-500 transition-colors hover:bg-steel-900/50 hover:text-danger"
                title="Limpiar todas"
              >
                <Trash2 className="h-3 w-3" />
                Limpiar todo
              </button>
            )}
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
                  <div key={`${item.type}-${item.id}`} className="group relative border-b border-steel-900/30 last:border-0">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 pr-8 transition-colors hover:bg-steel-900/50"
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
                    <button
                      type="button"
                      onClick={(e) => dismiss(item, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-steel-700 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-steel-900 hover:text-danger"
                      title="Descartar"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
