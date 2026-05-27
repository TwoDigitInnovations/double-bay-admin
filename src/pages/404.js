import Link from "next/link";
import { useRouter } from "next/router";
import { Home, ArrowLeft, SearchX } from "lucide-react";

export default function Custom404() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <SearchX size={36} className="text-gray-300" />
          </div>
        </div>

        {/* 404 number */}
        <div className="text-[96px] font-bold leading-none text-gray-900 tracking-tight mb-3">
          404
        </div>

        {/* Text */}
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or head back to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={15} />
            Go back
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-sm text-white hover:bg-gray-700 transition-colors shadow-sm"
          >
            <Home size={15} />
            Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
