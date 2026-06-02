import isAuth from "@/components/isAuth";
import LegalPagesPanel from "@/components/LegalPagesPanel";

function LegalPages({ toaster }) {
  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <h1 className="text-lg font-semibold text-gray-900">Legal pages</h1>
      <p className="mt-1 text-sm text-gray-500">
        Edit footer policy content shown on the storefront.
      </p>
      <div className="mt-6">
        <LegalPagesPanel toaster={toaster} />
      </div>
    </div>
  );
}

export default isAuth(LegalPages);
