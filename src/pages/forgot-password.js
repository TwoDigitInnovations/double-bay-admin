import { useState, useRef } from "react";
import { useRouter } from "next/router";
import { MdEmail, MdLock, MdCheckCircle } from "react-icons/md";
import { IoEyeOffOutline, IoEyeOutline, IoArrowBack } from "react-icons/io5";
import { Api } from "@/services/service";

export default function ForgotPassword(props) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [token, setToken] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef([]);

  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateEmail = (val = email) => {
    if (!val.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address";
    return "";
  };

  const validateOtp = () => {
    if (otp.join("").length < 6) return "Please enter the complete 6-digit OTP";
    return "";
  };

  const validatePasswords = (data = passwords) => {
    const errs = {};
    if (!data.newPassword) errs.newPassword = "Password is required";
    else if (data.newPassword.length < 8) errs.newPassword = "Must be at least 8 characters";
    else if (!/[A-Z]/.test(data.newPassword)) errs.newPassword = "Must contain an uppercase letter";
    else if (!/[0-9]/.test(data.newPassword)) errs.newPassword = "Must contain a number";
    if (!data.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (data.newPassword !== data.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const arr = pasted.split("");
      setOtp([...arr, ...Array(6 - arr.length).fill("")]);
      otpRefs.current[Math.min(arr.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleSendOtp = () => {
    setSubmitted(true);
    const err = validateEmail();
    setEmailError(err);
    if (err) return;

    props.loader(true);
    Api("post", "auth/send-otp", { email }, router).then(
      (res) => {
        props.loader(false);
        if (res?.status) {
          props.toaster({ type: "success", message: "OTP sent to your email!" });
          setToken(res.data.token);
          setSubmitted(false);
          setStep(2);
        } else {
          props.toaster({ type: "error", message: res?.message || "Failed to send OTP." });
        }
      },
      (err) => {
        props.loader(false);
        props.toaster({ type: "error", message: err?.message || "Something went wrong." });
      }
    );
  };

  const handleResendOtp = () => {
    props.loader(true);
    Api("post", "auth/resend-otp", { email }, router).then(
      (res) => {
        props.loader(false);
        if (res?.status) {
          props.toaster({ type: "success", message: "OTP resent!" });
          setToken(res.data.token);
          setOtp(["", "", "", "", "", ""]);
          setOtpError("");
          setSubmitted(false);
        } else {
          props.toaster({ type: "error", message: res?.message || "Failed to resend OTP." });
        }
      },
      (err) => {
        props.loader(false);
        props.toaster({ type: "error", message: err?.message || "Something went wrong." });
      }
    );
  };

  const handleVerifyOtp = () => {
    setSubmitted(true);
    const err = validateOtp();
    setOtpError(err);
    if (err) return;

    props.loader(true);
    Api("post", "auth/verify-otp", { token, otp: otp.join("") }, router).then(
      (res) => {
        props.loader(false);
        if (res?.status) {
          props.toaster({ type: "success", message: "OTP verified!" });
          setSubmitted(false);
          setStep(3);
        } else {
          props.toaster({ type: "error", message: res?.message || "Invalid OTP." });
        }
      },
      (err) => {
        props.loader(false);
        props.toaster({ type: "error", message: err?.message || "Something went wrong." });
      }
    );
  };

  const handleResetPassword = () => {
    setSubmitted(true);
    const errs = validatePasswords();
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    props.loader(true);
    Api("post", "auth/change-password", { token, password: passwords.newPassword }, router).then(
      (res) => {
        props.loader(false);
        if (res?.status) {
          props.toaster({ type: "success", message: "Password reset successfully!" });
          router.push("/login");
        } else {
          props.toaster({ type: "error", message: res?.message || "Failed to reset password." });
        }
      },
      (err) => {
        props.loader(false);
        props.toaster({ type: "error", message: err?.message || "Something went wrong." });
      }
    );
  };

  const inputCls = (hasError) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
      hasError
        ? "border-red-300 bg-red-50"
        : "border-gray-200 bg-gray-50 focus-within:border-[#008060] focus-within:bg-white"
    }`;

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-7">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              step > s
                ? "bg-[#008060] border-[#008060] text-white"
                : step === s
                ? "bg-white border-[#008060] text-[#008060]"
                : "bg-gray-100 border-gray-200 text-gray-400"
            }`}
          >
            {step > s ? <MdCheckCircle className="text-sm" /> : s}
          </div>
          {s < 3 && (
            <div
              className={`h-px w-8 transition-all ${step > s ? "bg-[#008060]" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const stepTitles = ["Forgot Password", "Verify OTP", "New Password"];
  const stepDesc = [
    "Enter your email and we'll send you a reset OTP.",
    `We've sent a 6-digit OTP to ${email}.`,
    "Create a strong new password for your account.",
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-[#008060] rounded-lg flex items-center justify-center text-white text-xs font-bold">
            2D
          </div>
          <span className="text-lg font-semibold text-gray-900">2 Digit Admin</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {/* Back */}
          <button
            onClick={() => (step === 1 ? router.push("/login") : setStep((s) => s - 1))}
            className="flex items-center gap-1.5 text-xs text-[#008060] font-semibold mb-6 hover:underline"
          >
            <IoArrowBack size={13} />
            {step === 1 ? "Back to Login" : "Back"}
          </button>

          <StepIndicator />

          <h1 className="text-xl font-bold text-gray-900 mb-1">{stepTitles[step - 1]}</h1>
          <p className="text-sm text-gray-500 mb-6">{stepDesc[step - 1]}</p>

          {/* Step 1 — Email */}
          {step === 1 && (
            <>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <div className={inputCls(submitted && emailError)}>
                <MdEmail className="text-gray-400 text-lg shrink-0" />
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (submitted) setEmailError(validateEmail(e.target.value));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              {submitted && emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}

              <button
                onClick={handleSendOtp}
                className="mt-6 w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006b50] text-white text-sm font-semibold transition-colors"
              >
                Send OTP
              </button>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Enter 6-digit OTP
              </label>

              <div className="flex gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`flex-1 h-12 text-center text-gray-900 text-lg font-bold rounded-xl outline-none border-2 transition-all ${
                      submitted && otpError
                        ? "border-red-300 bg-red-50"
                        : digit
                        ? "border-[#008060] bg-[#008060]/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  />
                ))}
              </div>

              {submitted && otpError && (
                <p className="text-red-500 text-xs mt-2">{otpError}</p>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  className="text-[#008060] font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              </p>

              <button
                onClick={handleVerifyOtp}
                className="mt-6 w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006b50] text-white text-sm font-semibold transition-colors"
              >
                Verify OTP
              </button>
            </>
          )}

          {/* Step 3 — New Password */}
          {step === 3 && (
            <>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  New Password
                </label>
                <div className={inputCls(submitted && passwordErrors.newPassword)}>
                  <MdLock className="text-gray-400 text-lg shrink-0" />
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400"
                    value={passwords.newPassword}
                    onChange={(e) => {
                      const updated = { ...passwords, newPassword: e.target.value };
                      setPasswords(updated);
                      if (submitted) setPasswordErrors(validatePasswords(updated));
                    }}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    {showNew ? <IoEyeOutline size={17} /> : <IoEyeOffOutline size={17} />}
                  </button>
                </div>
                {submitted && passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <div className={inputCls(submitted && passwordErrors.confirmPassword)}>
                  <MdLock className="text-gray-400 text-lg shrink-0" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    className="bg-transparent outline-none w-full text-sm text-gray-800 placeholder-gray-400"
                    value={passwords.confirmPassword}
                    onChange={(e) => {
                      const updated = { ...passwords, confirmPassword: e.target.value };
                      setPasswords(updated);
                      if (submitted) setPasswordErrors(validatePasswords(updated));
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <IoEyeOutline size={17} /> : <IoEyeOffOutline size={17} />}
                  </button>
                </div>
                {submitted && passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Password rules */}
              <div className="space-y-1.5 mt-3">
                {[
                  { label: "At least 8 characters", test: passwords.newPassword.length >= 8 },
                  { label: "One uppercase letter", test: /[A-Z]/.test(passwords.newPassword) },
                  { label: "One number", test: /[0-9]/.test(passwords.newPassword) },
                ].map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${rule.test ? "bg-[#008060]" : "bg-gray-300"}`} />
                    <span className={`text-xs transition-colors ${rule.test ? "text-[#008060]" : "text-gray-400"}`}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleResetPassword}
                className="mt-6 w-full py-3 rounded-xl bg-[#008060] hover:bg-[#006b50] text-white text-sm font-semibold transition-colors"
              >
                Reset Password
              </button>
            </>
          )}

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
          , and to receive updates from 2 Digit.{" "}
          <button className="text-gray-400 hover:underline">Unsubscribe anytime.</button>
        </p>
      </div>

    </div>
  );
}
