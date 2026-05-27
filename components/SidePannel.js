import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FiX } from "react-icons/fi";
import {
  Home,
  ShoppingBag,
  Tag,
  Users,
  TrendingUp,
  Percent,
  FileText,
  Globe,
  Landmark,
  BarChart2,
  Monitor,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  // ChevronDown kept for store header
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logoutUser } from "@/redux/slices/userSlice";
import LogoutModal from "./LogoutModal";
import { isModuleEnabled, MODULE_IDS as M } from "@/lib/modules";

const productsRoutes = [
  "/products",
  "/collections",
  "/inventory",
  "/purchase-orders",
  "/transfers",
  "/gift-cards",
];

const productsSubItems = [
  { href: "/collections", title: "Collections", module: M.COLLECTIONS },
  { href: "/inventory", title: "Inventory", module: M.INVENTORY },
  { href: "/purchase-orders", title: "Purchase orders", module: M.PURCHASE_ORDERS },
  { href: "/transfers", title: "Transfers", module: M.TRANSFERS },
  { href: "/gift-cards", title: "Gift cards", module: M.GIFT_CARDS },
];

const salesChannelItems = [
  { href: "/online-store", title: "Online Store", icon: Monitor },
];

function NavItem({ href, icon: Icon, title, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-1 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-white shadow-sm font-medium text-gray-900"
          : "text-gray-600 hover:bg-black/8"
      }`}
    >
      <Icon size={16} className={active ? "text-gray-800" : "text-gray-500"} />
      {title}
    </Link>
  );
}

function SidePannel({ open, setOpen }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { pathname } = router;

  const inProductsSection = productsRoutes.includes(pathname);
  const [salesOpen, setSalesOpen] = useState(pathname === "/online-store");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const visibleProductSubs = productsSubItems.filter((item) =>
    isModuleEnabled(item.module),
  );
  const showProducts =
    isModuleEnabled(M.PRODUCTS) || visibleProductSubs.length > 0;

  const close = () => setOpen(false);

  const confirmLogout = () => {
    localStorage.removeItem("userDetail");
    localStorage.removeItem("token");
    dispatch(logoutUser());
    router.push("/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={close}
        />
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <aside
        className={`fixed left-0 w-54 bg-[#E8E8E8] z-40 flex flex-col
          transition-transform duration-300 overflow-hidden
          top-0 h-full md:top-12 md:h-[calc(100vh-48px)]
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Store header */}
        <div className="px-2 pt-2 pb-1 flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-black/8 cursor-pointer flex-1 min-w-0">
            <div className="w-6 h-6 bg-[#008060] rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              2D
            </div>
            <span className="text-[13px] font-medium text-gray-800 truncate flex-1">
              2 Digit Admin
            </span>
            <ChevronDown size={14} className="text-gray-500 shrink-0" />
          </div>
          <button
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 shrink-0"
            onClick={close}
          >
            <FiX size={17} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 no-scrollbar">
          <NavItem
            href="/"
            icon={Home}
            title="Home"
            active={pathname === "/"}
            onClick={close}
          />
          {isModuleEnabled(M.ORDERS) && (
            <NavItem
              href="/orders"
              icon={ShoppingBag}
              title="Orders"
              active={pathname === "/orders"}
              onClick={close}
            />
          )}

          {showProducts && (
            <div>
              {isModuleEnabled(M.PRODUCTS) && (
                <Link
                  href="/products"
                  onClick={close}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.75 rounded-lg text-[13px] transition-colors ${
                    pathname === "/products"
                      ? "bg-white shadow-sm font-medium text-gray-900"
                      : inProductsSection
                        ? "font-medium text-gray-900 hover:bg-black/8"
                        : "text-gray-600 hover:bg-black/8"
                  }`}
                >
                  <Tag
                    size={16}
                    className={
                      inProductsSection ? "text-gray-800" : "text-gray-500"
                    }
                  />
                  <span className="flex-1 text-left">Products</span>
                </Link>
              )}

              {visibleProductSubs.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleProductSubs.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className={`flex items-center pl-7.5 pr-2.5 py-1 rounded-lg text-[13px] transition-colors ${
                        pathname === item.href
                          ? "bg-white shadow-sm font-medium text-gray-900"
                          : "text-gray-600 hover:bg-black/8"
                      }`}
                    >
                      {pathname === item.href && (
                        <ChevronRight
                          size={11}
                          className="text-gray-400 mr-1 shrink-0 -ml-3.5"
                        />
                      )}
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {isModuleEnabled(M.CUSTOMERS) && (
            <NavItem
              href="/customers"
              icon={Users}
              title="Customers"
              active={pathname === "/customers"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.MARKETING) && (
            <NavItem
              href="/marketing"
              icon={TrendingUp}
              title="Marketing"
              active={pathname === "/marketing"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.DISCOUNTS) && (
            <NavItem
              href="/discounts"
              icon={Percent}
              title="Discounts"
              active={pathname === "/discounts"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.CONTENT) && (
            <NavItem
              href="/content"
              icon={FileText}
              title="Content"
              active={pathname === "/content"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.MARKETS) && (
            <NavItem
              href="/markets"
              icon={Globe}
              title="Markets"
              active={pathname === "/markets"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.FINANCE) && (
            <NavItem
              href="/finance"
              icon={Landmark}
              title="Finance"
              active={pathname === "/finance"}
              onClick={close}
            />
          )}
          {isModuleEnabled(M.ANALYTICS) && (
            <NavItem
              href="/analytics"
              icon={BarChart2}
              title="Analytics"
              active={pathname === "/analytics"}
              onClick={close}
            />
          )}

          {isModuleEnabled(M.ONLINE_STORE) && (
            <>
          <div className="my-2 border-t border-gray-300/60" />

          {/* Sales channels */}
          <button
            className="w-full flex items-center justify-between px-2.5 py-1.75 rounded-lg text-[13px] font-semibold text-gray-700 hover:bg-black/8 transition-colors"
            onClick={() => setSalesOpen((v) => !v)}
          >
            Sales channels
            <ChevronRight
              size={14}
              className={`text-gray-500 transition-transform duration-200 ${salesOpen ? "rotate-90" : ""}`}
            />
          </button>

          {salesOpen && (
            <div className="space-y-0.5">
              {salesChannelItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  active={pathname === item.href}
                  onClick={close}
                />
              ))}
            </div>
          )}
            </>
          )}
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="px-2 pb-2 pt-1 border-t border-gray-300/60 space-y-0.5 shrink-0">
          {isModuleEnabled(M.SETTINGS) && (
            <NavItem
              href="/Settings"
              icon={Settings}
              title="Settings"
              active={pathname === "/Settings"}
              onClick={close}
            />
          )}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.75 rounded-lg text-[13px] text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} className="text-red-400" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default SidePannel;
