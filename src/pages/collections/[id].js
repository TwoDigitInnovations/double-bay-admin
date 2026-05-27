import { useRouter } from "next/router";
import isAuth from "@/components/isAuth";
import CollectionForm from "@/components/CollectionForm";

function EditCollection({ toaster, loader }) {
  const router = useRouter();
  const { id } = router.query;

  return <CollectionForm mode="edit" id={id} toaster={toaster} loader={loader} />;
}

export default isAuth(EditCollection);
