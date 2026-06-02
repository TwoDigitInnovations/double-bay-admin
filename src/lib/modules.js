/**
 * Feature modules via NEXT_PUBLIC_ENABLED_MODULES (comma-separated).
 * Set in .env.local, then restart `npm run dev`.
 *
 * If empty / unset → all modules enabled.
 */

export const MODULE_IDS = {
  HOME: "home",
  ORDERS: "orders",
  PRODUCTS: "products",
  PRODUCT_TAXONOMY: "product-taxonomy",
  COLLECTIONS: "collections",
  INVENTORY: "inventory",
  PURCHASE_ORDERS: "purchase-orders",
  TRANSFERS: "transfers",
  GIFT_CARDS: "gift-cards",
  CUSTOMERS: "customers",
  MARKETING: "marketing",
  DISCOUNTS: "discounts",
  CONTENT: "content",
  LEGAL_PAGES: "legal-pages",
  LEARN: "learn",
  SHOP_CONCERNS: "shop-concerns",
  MARKETS: "markets",
  FINANCE: "finance",
  ANALYTICS: "analytics",
  ONLINE_STORE: "online-store",
  SETTINGS: "settings",
  PROFILE: "profile",
};

const ALL_MODULE_IDS = Object.values(MODULE_IDS);

const ALWAYS_ON = new Set([MODULE_IDS.HOME, MODULE_IDS.PROFILE]);

function readModulesEnvString() {
  const pub = process.env.NEXT_PUBLIC_ENABLED_MODULES;
  const alt = process.env.ENABLED_MODULES;
  return (pub && String(pub).trim()) || (alt && String(alt).trim()) || "";
}

export function getEnabledModules() {
  const raw = readModulesEnvString();

  if (!raw) {
    return new Set(ALL_MODULE_IDS);
  }

  const enabled = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );

  ALWAYS_ON.forEach((id) => enabled.add(id));
  return enabled;
}

export function isModuleEnabled(moduleId) {
  if (!moduleId) return true;
  return getEnabledModules().has(moduleId);
}

export function getModuleForPath(pathname = "") {
  const path = String(pathname).split("?")[0].toLowerCase();

  if (!path || path === "/") return MODULE_IDS.HOME;
  if (path === "/profile") return MODULE_IDS.PROFILE;
  if (path === "/settings") return MODULE_IDS.SETTINGS;

  if (path.startsWith("/orders")) return MODULE_IDS.ORDERS;
  if (path.startsWith("/product-taxonomy")) return MODULE_IDS.PRODUCT_TAXONOMY;
  if (path.startsWith("/products")) return MODULE_IDS.PRODUCTS;
  if (path.startsWith("/collections")) return MODULE_IDS.COLLECTIONS;
  if (path.startsWith("/inventory")) return MODULE_IDS.INVENTORY;
  if (path.startsWith("/purchase-orders")) return MODULE_IDS.PURCHASE_ORDERS;
  if (path.startsWith("/transfers")) return MODULE_IDS.TRANSFERS;
  if (path.startsWith("/gift-cards")) return MODULE_IDS.GIFT_CARDS;
  if (path.startsWith("/customers")) return MODULE_IDS.CUSTOMERS;
  if (path.startsWith("/marketing")) return MODULE_IDS.MARKETING;
  if (path.startsWith("/discounts")) return MODULE_IDS.DISCOUNTS;
  if (path.startsWith("/content")) return MODULE_IDS.CONTENT;
  if (path.startsWith("/legal-pages")) return MODULE_IDS.LEGAL_PAGES;
  if (path.startsWith("/learn")) return MODULE_IDS.LEARN;
  if (path.startsWith("/shop-concerns")) return MODULE_IDS.SHOP_CONCERNS;
  if (path.startsWith("/markets")) return MODULE_IDS.MARKETS;
  if (path.startsWith("/finance")) return MODULE_IDS.FINANCE;
  if (path.startsWith("/analytics")) return MODULE_IDS.ANALYTICS;
  if (path.startsWith("/online-store")) return MODULE_IDS.ONLINE_STORE;

  return null;
}

export function isPathAllowed(pathname) {
  const moduleId = getModuleForPath(pathname);
  if (!moduleId) return true;
  return isModuleEnabled(moduleId);
}

/** Filter nav/search items by enabled modules. */
export function filterRoutesByModules(routes) {
  return routes.filter((route) => isPathAllowed(route.href));
}
