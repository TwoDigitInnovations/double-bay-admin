import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Bell, ShoppingBag } from "lucide-react";
import isAuth from "@/components/isAuth";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import { timeSince } from "@/services/service";

function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(() => {
    setLoading(true);
    fetchMyNotifications({ limit: 50 })
      .then((res) => {
        const list = res?.data?.data;
        if (res?.status && Array.isArray(list)) {
          setItems(list);
        } else {
          setItems([]);
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    markAllNotificationsRead()
      .then(() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("admin-notifications-updated"));
        }
      })
      .catch(() => {})
      .finally(() => loadNotifications());
  }, [loadNotifications]);

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await markNotificationRead(item._id);
        window.dispatchEvent(new Event("admin-notifications-updated"));
      } catch {
        /* ignore */
      }
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Order and store alerts. Opening this page marks all as seen.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell className="mx-auto size-10 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-700">No notifications yet</p>
            <p className="mt-1 text-xs text-gray-400">
              New orders will appear here when customers checkout.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item._id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                    !item.isRead ? "bg-[#f0faf7]" : ""
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e8f5f3] text-[#008060]">
                    <ShoppingBag size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.title}</span>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {timeSince(item.createdAt)}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-gray-600 leading-relaxed">
                      {item.message}
                    </span>
                    {!item.isRead && (
                      <span className="mt-2 inline-block rounded-full bg-[#008060] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        New
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default isAuth(NotificationsPage);
