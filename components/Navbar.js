import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { FiMenu, FiBell, FiSearch, FiX } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { logoutUser } from "@/redux/slices/userSlice";
import {
  User,
  Settings,
  LogOut,
  Home,
  ShoppingBag,
  Tag,
  Users,
  TrendingUp,
  Percent,
  FileText,
  Scale,
  BookOpen,
  Layers,
  Globe,
  Landmark,
  BarChart2,
  Monitor,
  Package,
  LayoutGrid,
  ArrowLeftRight,
  Gift,
  MessageCircleQuestion,
} from "lucide-react";
import Link from "next/link";
import {
  fetchUnreadNotificationCount,
} from "@/services/notificationService";
import LogoutModal from "./LogoutModal";
import {
  filterRoutesByModules,
  isModuleEnabled,
  MODULE_IDS as M,
} from "@/lib/modules";

const ALL_NAV_ROUTES = [
  { title: "Home", href: "/", icon: Home },
  { title: "Orders", href: "/orders", icon: ShoppingBag },
  { title: "Products", href: "/products", icon: Tag },
  { title: "Collections", href: "/collections", icon: LayoutGrid },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Purchase Orders", href: "/purchase-orders", icon: FileText },
  { title: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { title: "Gift Cards", href: "/gift-cards", icon: Gift },
  { title: "Customers", href: "/customers", icon: Users },
  {
    title: "Customer questions",
    href: "/faq-questions",
    icon: MessageCircleQuestion,
  },
  { title: "Marketing", href: "/marketing", icon: TrendingUp },
  { title: "Discounts", href: "/discounts", icon: Percent },
  { title: "Content", href: "/content", icon: FileText },
  { title: "Legal pages", href: "/legal-pages", icon: Scale },
  { title: "Learn", href: "/learn", icon: BookOpen },
  { title: "Shop concerns", href: "/shop-concerns", icon: Layers },
  { title: "Markets", href: "/markets", icon: Globe },
  { title: "Finance", href: "/finance", icon: Landmark },
  { title: "Analytics", href: "/analytics", icon: BarChart2 },
  { title: "Online Store", href: "/online-store", icon: Monitor },
  { title: "Settings", href: "/Settings", icon: Settings },
  { title: "Profile", href: "/profile", icon: User },
];

export default function Navbar({ setOpen }) {
  const allRoutes = useMemo(() => filterRoutesByModules(ALL_NAV_ROUTES), []);
  const defaultRoutes = useMemo(() => allRoutes.slice(0, 5), [allRoutes]);
  const user = useSelector((state) => state.user.user) || {};
  const dispatch = useDispatch();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "A";

  const filteredRoutes = searchQuery.trim()
    ? allRoutes.filter((r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : defaultRoutes;

  const refreshUnreadCount = useCallback(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadNotificationCount()
      .then((res) => {
        const count = res?.data?.data?.unreadCount ?? res?.data?.unreadCount ?? 0;
        setUnreadCount(Number(count) || 0);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const onUpdate = () => refreshUnreadCount();
    window.addEventListener("admin-notifications-updated", onUpdate);
    const interval = setInterval(refreshUnreadCount, 45000);
    return () => {
      window.removeEventListener("admin-notifications-updated", onUpdate);
      clearInterval(interval);
    };
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (router.pathname === "/notifications") {
      refreshUnreadCount();
    }
  }, [router.pathname, refreshUnreadCount]);

  /* ── outside click: user dropdown ── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── outside click: search dropdown ── */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Ctrl+K / ⌘K global shortcut ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setDropdownOpen(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── keyboard navigation inside search ── */
  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredRoutes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const target = filteredRoutes[selectedIndex] ?? filteredRoutes[0];
      if (target) navigateTo(target.href);
    }
  };

  const navigateTo = (href) => {
    if (!filterRoutesByModules([{ href }]).length) return;
    router.push(href);
    setSearchOpen(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  };

  const confirmLogout = () => {
    localStorage.removeItem("userDetail");
    localStorage.removeItem("token");
    dispatch(logoutUser());
    setDropdownOpen(false);
    router.push("/login");
  };

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
      <nav className="fixed top-0 left-0 right-0 h-13 bg-[#1C1C1C] z-50 flex items-center px-4">
        {/* Left — brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="md:hidden text-gray-300 hover:text-white p-1 transition-colors"
            onClick={() => setOpen(true)}
          >
            <FiMenu size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo12.png" alt="Logo" className="h-10 object-contain" />
        </div>

        {/* Center — search (absolutely centered) */}
        <div
          ref={searchRef}
          className="absolute left-1/2 -translate-x-1/2 hidden sm:block w-72 lg:w-115"
        >
          {/* Input bar */}
          <div
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition-colors rounded-lg px-3 py-2 cursor-text"
            onClick={() => {
              setSearchOpen(true);
              inputRef.current?.focus();
            }}
          >
            <FiSearch size={13} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(-1);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search pages..."
              className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-gray-400 min-w-0"
            />
            {searchQuery ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <FiX size={12} />
              </button>
            ) : (
              <kbd className="bg-white/10 text-gray-400 text-[10px] px-1.5 py-1 rounded font-mono leading-none shrink-0">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              {filteredRoutes.length > 0 ? (
                <>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {searchQuery.trim() ? "Results" : "Quick links"}
                  </p>
                  <div className="pb-1.5">
                    {filteredRoutes.map((route, i) => {
                      const Icon = route.icon;
                      return (
                        <button
                          key={route.href}
                          onMouseEnter={() => setSelectedIndex(i)}
                          onClick={() => navigateTo(route.href)}
                          className={`w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${selectedIndex === i
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <Icon size={15} className="text-gray-400 shrink-0" />
                          <span className="flex-1">{route.title}</span>
                          <span className="text-[12px] text-gray-500 font-mono shrink-0">
                            {route.href}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    No results for &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    This page doesn&apos;t exist.
                  </p>
                  <button
                    onClick={() => navigateTo("/404")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
                  >
                    View 404 page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — actions + avatar */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <Link
            href="/notifications"
            className="relative text-gray-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <FiBell size={16} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#ec4899] px-1 text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold select-none transition-all bg-[#008060]
              ${dropdownOpen ? "opacity-80 ring-2 ring-white/30" : "hover:opacity-90"}`}
            >
              {initial}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#008060] rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email || ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={15} className="text-gray-400 shrink-0" />
                    Profile
                  </Link>
                  {isModuleEnabled(M.SETTINGS) && (
                    <Link
                      href="/Settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={15} className="text-gray-400 shrink-0" />
                      Settings
                    </Link>
                  )}
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} className="text-red-500 shrink-0" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
