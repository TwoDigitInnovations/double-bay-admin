import isAuth from "@/components/isAuth";
import ProductForm from "@/components/ProductForm";

function AddProduct({ toaster, loader }) {
  return <ProductForm mode="add" toaster={toaster} loader={loader} />;
}

export default isAuth(AddProduct);
