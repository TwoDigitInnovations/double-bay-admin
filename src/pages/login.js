import { useState } from "react";
import { useRouter } from "next/router";
import { MdEmail, MdPassword } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useAppDispatch } from "@/redux/hooks";
import { loginUser } from "@/redux/actions/userActions";

export default function Login(props) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [submitted, setSubmitted] = useState(false);
  const [userDetail, setUserDetail] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setSubmitted(true);
    if (!userDetail.username || !userDetail.password) {
      props.toaster({ type: "error", message: "Missing credentials" });
      return;
    }
    try {
      props.loader(true);
      const res = await dispatch(
        loginUser({ email: userDetail.username, password: userDetail.password }, router)
      );
      if (res?.success) {
        setUserDetail({ username: "", password: "" });
        props.toaster({ type: "success", message: "Login successful" });
      } else {
        props.toaster({ type: "error", message: res?.message || "You are not authorized" });
      }
    } catch (err) {
      props.toaster({ type: "error", message: err?.message || "Login failed" });
    } finally {
      props.loader(false);
    }
  };

  const inputCls = (hasError) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
      hasError
        ? "border-red-300 bg-red-50"
        : "border-gray-200 bg-gray-50 focus-within:border-[#008060] focus-within:bg-white"
    }`;

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Brand */}
        

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-center mb-0 bg-white  rounded-2xl ">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-doublebay.png" alt="Logo" className="h-24 object-contain" />
          </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-7">Sign in to your admin account</p>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <div className={inputCls(submitted && !userDetail.username)}>
                <MdEmail className="text-gray-400 text-lg shrink-0" />
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400"
                  value={userDetail.username}
                  onChange={(e) => setUserDetail({ ...userDetail, username: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {submitted && !userDetail.username && (
                <p className="text-red-500 text-xs mt-1">Email is required</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className={inputCls(submitted && !userDetail.password)}>
                <MdPassword className="text-gray-400 text-lg shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400 pr-2"
                  value={userDetail.password}
                  onChange={(e) =>
                    setUserDetail({ ...userDetail, password: e.target.value.trim() })
                  }
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <IoEyeOutline size={17} /> : <IoEyeOffOutline size={17} />}
                </button>
              </div>
              {submitted && !userDetail.password && (
                <p className="text-red-500 text-xs mt-1">Password is required</p>
              )}
            </div>

            {/* Forgot */}
            <div className="flex justify-end mt-2 mb-6">
              <button
                className="text-xs text-[#008060] font-semibold hover:underline"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              className="w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006b50] text-white text-sm font-semibold transition-colors"
            >
              Sign in
            </button>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 py-5 px-4 text-center">
        <p className="text-gray-700 text-sm font-semibold mb-1.5">Need Help?</p>
        <p className="text-gray-400 text-xs leading-relaxed max-w-lg mx-auto">
          By continuing, you agree to the{" "}
          <button
            className="text-gray-600 font-semibold hover:underline"
            onClick={() => router.push("/termsAndConditions")}
          >
            Terms
          </button>{" "}
          and{" "}
          <button
            className="text-gray-600 font-semibold hover:underline"
            onClick={() => router.push("/privacyPolicy")}
          >
            Privacy Policy
          </button>
          , and to receive updates from DoubleBay.{" "}
          <button className="text-gray-400 hover:underline">Unsubscribe anytime.</button>
        </p>
      </div>

    </div>
  );
}
