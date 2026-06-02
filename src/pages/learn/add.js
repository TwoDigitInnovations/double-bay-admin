import isAuth from "@/components/isAuth";
import LearnBlogForm from "@/components/LearnBlogForm";

function LearnAdd({ toaster, loader }) {
  return <LearnBlogForm mode="create" toaster={toaster} loader={loader} />;
}

export default isAuth(LearnAdd);
