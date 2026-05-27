import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { isPathAllowed } from "@/lib/modules";

// Pages that don't require authentication
const AUTH_FREE_PAGES = ["/login", "/forgot-password", "/privacyPolicy", "/termsAndConditions"];

const isAuth = (Component) => {
  return function IsAuth(props) {
    const router = useRouter();
    const { pathname } = router;
    const [auth, setAuth] = useState(null);

    useEffect(() => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("userDetail");
      const isPublic = AUTH_FREE_PAGES.includes(pathname);

      if (token && user) {
        if (isPublic) {
          router.replace("/");
          return;
        }
        if (!isPathAllowed(pathname)) {
          router.replace("/");
          return;
        }
        setAuth(true);
      } else if (isPublic) {
        setAuth(true);
      } else {
        localStorage.clear();
        router.replace("/login");
      }
    }, [pathname, router]);

    if (auth === null) return null;

    return <Component {...props} />;
  };
};

export default isAuth;
