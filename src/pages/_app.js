import "../styles/globals.css";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import Layout from "@/components/layouts";
import Toaster from "@/components/toaster";
import { Provider, useDispatch } from "react-redux";
import { store } from "../redux/store";
import { setUser } from "../redux/slices/userSlice";

export default function AppWrapper(props) {
  return (
    <Provider store={store}>
      <InnerApp {...props} />
    </Provider>
  );
}

function InnerApp({ Component, pageProps }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState({
    type: "",
    message: "",
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (toast.message) {
      setTimeout(() => {
        setToast({ type: "", message: "" });
      }, 5000);
    }
  }, [toast]);

  useEffect(() => {
    const user = localStorage.getItem("userDetail");

    if (user) {
      dispatch(setUser(JSON.parse(user)));
    }
  }, [dispatch]);

  return (
    <>
      <Loader open={open} />

      <div className="fixed right-5 top-20 min-w-max z-50">
        {!!toast.message && (
          <Toaster type={toast.type} message={toast.message} />
        )}
      </div>

      <Layout>
        <Component
          {...pageProps}
          loader={setOpen}
          toaster={setToast}
        />
      </Layout>
    </>
  );
}
