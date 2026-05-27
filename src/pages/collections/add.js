import isAuth from "@/components/isAuth";
import CollectionForm from "@/components/CollectionForm";

function AddCollection({ toaster, loader }) {
  return <CollectionForm mode="add" toaster={toaster} loader={loader} />;
}

export default isAuth(AddCollection);
