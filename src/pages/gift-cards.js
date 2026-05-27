import isAuth from "@/components/isAuth";

function GiftCards() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gift Cards</h1>
        <p className="text-gray-500 mt-1 text-sm">Gift cards will appear here.</p>
      </div>
    </div>
  );
}

export default isAuth(GiftCards);
