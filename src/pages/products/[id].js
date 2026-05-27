import { useRouter } from "next/router";
import isAuth from "@/components/isAuth";
import ProductForm from "@/components/ProductForm";

function EditProduct({ toaster, loader }) {
  const router = useRouter();
  const { id } = router.query;

  return <ProductForm mode="edit" id={id} toaster={toaster} loader={loader} />;
}

export default isAuth(EditProduct);
