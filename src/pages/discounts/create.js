import { useRouter } from "next/router";
import isAuth from "@/components/isAuth";
import DiscountForm from "@/components/DiscountForm";

function CreateDiscount({ toaster }) {
  const router = useRouter();
  const { type = "amount_off_products", id } = router.query;

  if (!router.isReady) return null;

  if (id) {
    return (
      <DiscountForm
        type={type}
        mode="edit"
        id={String(id)}
        toaster={toaster}
      />
    );
  }

  return <DiscountForm type={type} mode="add" toaster={toaster} />;
}

export default isAuth(CreateDiscount);
