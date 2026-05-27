import { LogOut } from "lucide-react";

export default function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center">

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <LogOut size={24} className="text-red-500" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">Log out?</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Are you sure you want to log out of your admin account?
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Log out
          </button>
        </div>

      </div>
    </div>
  );
}
