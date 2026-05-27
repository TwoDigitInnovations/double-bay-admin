import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MdEmail, MdPhone, MdPerson, MdEdit, MdCheck, MdClose } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateProfile } from "@/redux/actions/userActions";
import isAuth from "@/components/isAuth";

function Profile(props) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [profile, setProfile] = useState({ fullname: "", email: "", phone: "" });
  const [form, setForm] = useState({ fullname: "", email: "", phone: "" });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile(router));
  }, []);

  useEffect(() => {
    if (user) {
      const data = {
        fullname: user.fullname || "",
        email: user.email || "",
        phone: user.phone || "",
      };
      setProfile(data);
      setForm(data);
    }
  }, [user]);

  const validate = (data = form) => {
    const errs = {};
    if (!data.fullname.trim()) errs.fullname = "Full name is required";
    if (!data.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Enter a valid email";
    if (!data.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[0-9\s\-]{7,15}$/.test(data.phone)) errs.phone = "Enter a valid phone number";
    return errs;
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (submitted) setErrors(validate(updated));
  };

  const handleSave = async () => {
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      props.toaster({ type: "error", message: "Please fix the errors below" });
      return;
    }

    try {
      props.loader(true);
      const payload = new FormData();
      payload.append("fullname", form.fullname);
      payload.append("email", form.email);
      payload.append("phone", form.phone);

      const res = await dispatch(updateProfile(payload, router));

      if (res?.status) {
        setProfile({ ...form });
        setEditMode(false);
        setSubmitted(false);
        props.toaster({ type: "success", message: "Profile updated successfully!" });
      } else {
        props.toaster({ type: "error", message: res?.message || "Update failed." });
      }
    } catch (err) {
      props.toaster({ type: "error", message: err?.message || "Something went wrong." });
    } finally {
      props.loader(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...profile });
    setErrors({});
    setSubmitted(false);
    setEditMode(false);
  };

  const inputCls = (hasError) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
      hasError
        ? "border-red-300 bg-red-50"
        : editMode
        ? "border-gray-200 bg-white focus-within:border-[#008060]"
        : "border-transparent bg-gray-50"
    }`;

  const initial = profile.fullname
    ? profile.fullname.charAt(0).toUpperCase()
    : user?.name?.charAt(0).toUpperCase() || "A";

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Green banner */}
          <div className="h-24 w-full bg-[#008060]" />

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-10 mb-4 w-fit">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-[#008060] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initial}</span>
              </div>
            </div>

            {/* Name + email display */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                {profile.fullname || "Your Name"}
              </h2>
              <p className="text-sm text-gray-400">{profile.email || "your@email.com"}</p>
            </div>

            <div className="h-px bg-gray-100 mb-5" />

            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold text-[#008060] uppercase tracking-widest">
                Personal Information
              </p>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg bg-[#008060] hover:bg-[#006b50] transition-colors"
                >
                  <MdEdit size={14} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MdClose size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg bg-[#008060] hover:bg-[#006b50] transition-colors"
                  >
                    <MdCheck size={14} />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <div className={inputCls(submitted && errors.fullname)}>
                  <MdPerson className="text-[#008060] text-lg flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-300"
                    value={form.fullname}
                    disabled={!editMode}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                  />
                </div>
                {submitted && errors.fullname && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullname}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className={inputCls(submitted && errors.email)}>
                  <MdEmail className="text-[#008060] text-lg flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-300"
                    value={form.email}
                    disabled={!editMode}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                {submitted && errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Phone Number
                </label>
                <div className={inputCls(submitted && errors.phone)}>
                  <MdPhone className="text-[#008060] text-lg flex-shrink-0" />
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-300"
                    value={form.phone}
                    disabled={!editMode}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                {submitted && errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default isAuth(Profile);
