import { Api } from "./service";

export function fetchMyNotifications(params = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.type) qs.set("type", params.type);
  const query = qs.toString();
  return Api("get", `notifications/my${query ? `?${query}` : ""}`);
}

export function fetchUnreadNotificationCount() {
  return Api("get", "notifications/unread-count");
}

export function markAllNotificationsRead() {
  return Api("patch", "notifications/read-all");
}

export function markNotificationRead(id) {
  return Api("patch", `notifications/${id}/read`);
}
