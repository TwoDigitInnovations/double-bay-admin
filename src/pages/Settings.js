import isAuth from "@/components/isAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";
import { Api } from "@/services/service";

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-gray-900" : "bg-gray-200"
        }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"
          }`}
      />
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";

// The backend returns saved secrets as this placeholder and ignores it on save,
// so an untouched secret field never overwrites the real value.
const SECRET_KEYS = [
  "afterpaySecretKey",
  "auspostApiKey",
  "auspostPassword",
];
// An empty secret means "not edited" — never send it, or it would erase the saved one.
const withoutEmptySecrets = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([k, v]) => !(SECRET_KEYS.includes(k) && !v)),
  );

/** A key/password field with a show/hide toggle. A saved secret shows as dots;
 *  type a new value to replace it, leave it alone to keep it. */
function SecretField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Not set"
          className={`${inputClass} pr-9`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, description, children, onSave, saving }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </div>
  );
}

const emptyPayment = {
  minimumOrderAmount: 0,
  stripeEnabled: false,
  afterpayEnabled: false,
  afterpayEnv: "sandbox",
  afterpayMerchantId: "",
  afterpaySecretKey: "",
};

const emptyShipping = {
  auspostEnabled: false,
  auspostEnv: "test",
  warehousePostcode: "",
  warehouseName: "",
  warehouseLine1: "",
  warehouseLine2: "",
  warehouseSuburb: "",
  warehouseState: "",
  warehousePhone: "",
  auspostApiKey: "",
  auspostPassword: "",
  enableStandard: true,
  accountNumberStandard: "",
  enableSameday: true,
  accountNumberSameday: "",
  enableStartrack: true,
  accountNumberStartrack: "",
};

function Settings({ toaster, loader }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [payment, setPayment] = useState(emptyPayment);
  const [shipping, setShipping] = useState(emptyShipping);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loader?.(true);

    Api("get", "settings", "", router)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data;
        if (!data) return;

        setPayment({ ...emptyPayment, ...data.payment });
        setShipping({ ...emptyShipping, ...data.shipping });
      })
      .catch((err) => {
        if (!cancelled) {
          toaster?.({ type: "error", message: err?.message || "Failed to load settings" });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoaded(true);
          loader?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePayment = async () => {
    setSavingPayment(true);
    try {
      const res = await Api("put", "settings/payment", withoutEmptySecrets(payment), router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Payment settings saved" });
      } else {
        toaster?.({ type: "error", message: res?.message || "Could not save" });
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not save" });
    } finally {
      setSavingPayment(false);
    }
  };

  const saveShipping = async () => {
    setSavingShipping(true);
    try {
      const res = await Api("put", "settings/shipping", withoutEmptySecrets(shipping), router);
      if (res?.status) {
        toaster?.({ type: "success", message: "Shipping settings saved" });
      } else {
        toaster?.({ type: "error", message: res?.message || "Could not save" });
      }
    } catch (err) {
      toaster?.({ type: "error", message: err?.message || "Could not save" });
    } finally {
      setSavingShipping(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <SectionCard
        title="Payment Gateways"
        description="Stripe and Afterpay."
        onSave={savePayment}
        saving={savingPayment}
      >
        <div className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-800">Stripe</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Key is set in the backend .env, not editable here — this only turns it on/off.
              </p>
            </div>
            <Toggle
              checked={payment.stripeEnabled}
              onChange={(v) => setPayment((p) => ({ ...p, stripeEnabled: v }))}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-800">Afterpay</span>
            <Toggle
              checked={payment.afterpayEnabled}
              onChange={(v) => setPayment((p) => ({ ...p, afterpayEnabled: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Environment</label>
              <select
                className={inputClass}
                value={payment.afterpayEnv}
                onChange={(e) => setPayment((p) => ({ ...p, afterpayEnv: e.target.value }))}
              >
                <option value="sandbox">Sandbox</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Merchant ID</label>
              <input
                className={inputClass}
                value={payment.afterpayMerchantId || ""}
                onChange={(e) =>
                  setPayment((p) => ({ ...p, afterpayMerchantId: e.target.value }))
                }
                placeholder="Afterpay Merchant ID"
              />
            </div>
            <div className="col-span-2">
              <SecretField
                label="Secret key"
                value={payment.afterpaySecretKey}
                onChange={(v) => setPayment((p) => ({ ...p, afterpaySecretKey: v }))}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Shipping — Australia Post"
        description="Live domestic parcel rates at checkout."
        onSave={saveShipping}
        saving={savingShipping}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">Enable live Australia Post rates</span>
          <Toggle
            checked={shipping.auspostEnabled}
            onChange={(v) => setShipping((s) => ({ ...s, auspostEnabled: v }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Environment</label>
            <select
              className={inputClass}
              value={shipping.auspostEnv}
              onChange={(e) => setShipping((s) => ({ ...s, auspostEnv: e.target.value }))}
            >
              <option value="test">Test / sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Warehouse postcode</label>
            <input
              className={inputClass}
              value={shipping.warehousePostcode || ""}
              onChange={(e) =>
                setShipping((s) => ({ ...s, warehousePostcode: e.target.value }))
              }
              placeholder="e.g. 3000"
            />
          </div>
          <SecretField
            label="API key"
            value={shipping.auspostApiKey}
            onChange={(v) => setShipping((s) => ({ ...s, auspostApiKey: v }))}
          />
          <SecretField
            label="Password"
            value={shipping.auspostPassword}
            onChange={(v) => setShipping((s) => ({ ...s, auspostPassword: v }))}
          />
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Warehouse / sender address
          </p>
          <p className="text-xs text-gray-500 mb-3">
            The &quot;from&quot; address a created shipment is despatched from — required
            alongside the postcode above to create a real Australia Post shipment/label.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Business / warehouse name</label>
              <input
                className={inputClass}
                value={shipping.warehouseName || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehouseName: e.target.value }))
                }
                placeholder="e.g. Double Bay Cosmeceuticals"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address line 1</label>
              <input
                className={inputClass}
                value={shipping.warehouseLine1 || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehouseLine1: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Address line 2 (optional)</label>
              <input
                className={inputClass}
                value={shipping.warehouseLine2 || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehouseLine2: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass}>Suburb</label>
              <input
                className={inputClass}
                value={shipping.warehouseSuburb || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehouseSuburb: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                className={inputClass}
                value={shipping.warehouseState || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehouseState: e.target.value }))
                }
                placeholder="e.g. NSW"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Phone</label>
              <input
                className={inputClass}
                value={shipping.warehousePhone || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, warehousePhone: e.target.value }))
                }
                placeholder="e.g. 0412345678"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Account numbers (per Australia Post product)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{marginBottom: 0}}>Domestic & International</label>
                <Toggle
                  checked={shipping.enableStandard !== false}
                  onChange={(v) => setShipping((s) => ({ ...s, enableStandard: v }))}
                />
              </div>
              <input
                className={inputClass}
                value={shipping.accountNumberStandard || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, accountNumberStandard: e.target.value }))
                }
                disabled={shipping.enableStandard === false}
                style={{ opacity: shipping.enableStandard === false ? 0.5 : 1 }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{marginBottom: 0}}>Same Day</label>
                <Toggle
                  checked={shipping.enableSameday !== false}
                  onChange={(v) => setShipping((s) => ({ ...s, enableSameday: v }))}
                />
              </div>
              <input
                className={inputClass}
                value={shipping.accountNumberSameday || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, accountNumberSameday: e.target.value }))
                }
                disabled={shipping.enableSameday === false}
                style={{ opacity: shipping.enableSameday === false ? 0.5 : 1 }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass} style={{marginBottom: 0}}>StarTrack Express/Premium</label>
                <Toggle
                  checked={shipping.enableStartrack !== false}
                  onChange={(v) => setShipping((s) => ({ ...s, enableStartrack: v }))}
                />
              </div>
              <input
                className={inputClass}
                value={shipping.accountNumberStartrack || ""}
                onChange={(e) =>
                  setShipping((s) => ({ ...s, accountNumberStartrack: e.target.value }))
                }
                disabled={shipping.enableStartrack === false}
                style={{ opacity: shipping.enableStartrack === false ? 0.5 : 1 }}
              />
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default isAuth(Settings);
