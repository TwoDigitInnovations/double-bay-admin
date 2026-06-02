import isAuth from "@/components/isAuth";
import ConcernForm from "@/components/ConcernForm";

function ShopConcernsAdd({ toaster, loader }) {
  return <ConcernForm mode="create" toaster={toaster} loader={loader} />;
}

export default isAuth(ShopConcernsAdd);
