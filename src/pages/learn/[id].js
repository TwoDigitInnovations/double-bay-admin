import { useRouter } from "next/router";
import isAuth from "@/components/isAuth";
import LearnBlogForm from "@/components/LearnBlogForm";

function LearnEdit({ toaster, loader }) {
  const router = useRouter();
  const { id } = router.query;

  return <LearnBlogForm mode="edit" id={id} toaster={toaster} loader={loader} />;
}

export default isAuth(LearnEdit);
