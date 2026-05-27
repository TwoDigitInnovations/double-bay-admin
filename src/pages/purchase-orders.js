import isAuth from "@/components/isAuth";
import { ClipboardList } from "lucide-react";

// ── Illustration ──────────────────────────────────────────────────────────────

function PurchaseOrderIllustration() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Orange circle */}
      <circle cx="90" cy="88" r="52" fill="#F59E0B" opacity="0.85" />

      {/* Document shadow */}
      <rect x="52" y="30" width="72" height="96" rx="5" fill="#e5e7eb" />

      {/* Main document */}
      <rect x="44" y="24" width="72" height="96" rx="5" fill="white" stroke="#e5e7eb" strokeWidth="1" />

      {/* Row 1 */}
      <rect x="56" y="40" width="20" height="16" rx="3" fill="#6EE7B7" />
      {/* Shoe shape */}
      <ellipse cx="66" cy="51" rx="7" ry="4" fill="#0D9488" />
      <rect x="62" y="44" width="8" height="5" rx="2" fill="#0D9488" />

      <rect x="82" y="43" width="24" height="3" rx="1.5" fill="#D1D5DB" />
      <rect x="82" y="50" width="16" height="2.5" rx="1.25" fill="#E5E7EB" />

      {/* Divider */}
      <line x1="56" y1="64" x2="104" y2="64" stroke="#F3F4F6" strokeWidth="1" />

      {/* Row 2 */}
      <rect x="56" y="70" width="20" height="16" rx="3" fill="#6EE7B7" />
      {/* T-shirt shape */}
      <path d="M60 74 L63 72 L66 74 L69 72 L72 74 L72 83 L60 83 Z" fill="#0D9488" />
      <path d="M60 74 L63 72 L66 74" stroke="#0D9488" strokeWidth="0.5" />

      <rect x="82" y="73" width="24" height="3" rx="1.5" fill="#D1D5DB" />
      <rect x="82" y="80" width="16" height="2.5" rx="1.25" fill="#E5E7EB" />

      {/* Divider */}
      <line x1="56" y1="94" x2="104" y2="94" stroke="#F3F4F6" strokeWidth="1" />

      {/* Row 3 */}
      <rect x="56" y="100" width="20" height="16" rx="3" fill="#6EE7B7" />
      {/* Hat shape */}
      <ellipse cx="66" cy="113" rx="8" ry="2.5" fill="#0D9488" />
      <rect x="61" y="103" width="10" height="9" rx="5" fill="#0D9488" />

      <rect x="82" y="103" width="24" height="3" rx="1.5" fill="#D1D5DB" />
      <rect x="82" y="110" width="16" height="2.5" rx="1.25" fill="#E5E7EB" />

      {/* Box on right (orange) */}
      <rect x="92" y="70" width="32" height="32" rx="3" fill="#D97706" />
      <rect x="92" y="70" width="32" height="10" rx="3" fill="#B45309" />
      <rect x="103" y="70" width="10" height="32" fill="#D97706" opacity="0.5" />
      <rect x="104" y="78" width="8" height="3" rx="1.5" fill="#FEF3C7" opacity="0.7" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PurchaseOrders() {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <ClipboardList size={18} className="text-gray-700" />
          Purchase orders
        </h1>
      </div>

      {/* Empty state card */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 px-6 text-center min-h-105">
        <PurchaseOrderIllustration />
        <h2 className="mt-6 text-base font-semibold text-gray-900">
          No purchase orders created
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 max-w-xs">
          You can view purchase orders once they&apos;re created in this store.
        </p>
      </div>

      <p className="text-center mt-6 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
        Learn more about purchase orders
      </p>
    </div>
  );
}

export default isAuth(PurchaseOrders);
