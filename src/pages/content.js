import isAuth from "@/components/isAuth";
import HomeContentPanel from "@/components/HomeContentPanel";

function Content({ toaster }) {
  return <HomeContentPanel toaster={toaster} />;
}

export default isAuth(Content);
