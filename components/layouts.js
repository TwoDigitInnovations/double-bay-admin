import { useEffect, useState } from "react";
import SidePannel from "./SidePannel";
import Navbar from "./Navbar";
import { useRouter } from "next/router";
import { isPathAllowed } from "@/lib/modules";

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const publicPages = ["/login", "/forgot-password", "/privacyPolicy", "/termsAndConditions"];
  const isPublicPage = publicPages.includes(router.pathname);

  useEffect(() => {
    if (isPublicPage) return;
    if (!isPathAllowed(router.pathname)) {
      router.replace("/");
    }
  }, [router.pathname, isPublicPage, router]);

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {!isPublicPage && <Navbar setOpen={setOpen} />}
      {!isPublicPage && <SidePannel open={open} setOpen={setOpen} />}
      <main className={isPublicPage ? "" : "pt-12 md:ml-54 min-h-screen"}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
