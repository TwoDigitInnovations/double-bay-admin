import isAuth from "@/components/isAuth";

function Analytics() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Analytics will appear here.</p>
      </div>
    </div>
  );
}

export default isAuth(Analytics);
