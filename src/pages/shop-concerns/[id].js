import { useRouter } from "next/router";
import isAuth from "@/components/isAuth";
import ConcernForm from "@/components/ConcernForm";

function ShopConcernsEdit({ toaster, loader }) {
  const router = useRouter();
  const { id } = router.query;

  return <ConcernForm mode="edit" id={id} toaster={toaster} loader={loader} />;
}

export default isAuth(ShopConcernsEdit);
