import { useState } from "react";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Info,
  Pencil,
  Plus,
  Type as TypeIcon,
  X,
} from "lucide-react";

// ── Metafield types ───────────────────────────────────────────────────────────

export const METAFIELD_TYPES = [
  { value: "single_line_text", label: "Single line text" },
  { value: "multi_line_text", label: "Multi-line text" },
  { value: "rich_text", label: "Rich text" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "True or false" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "color", label: "Color" },
  { value: "json", label: "JSON" },
];

const TEXT_TYPES = ["single_line_text", "multi_line_text", "rich_text", "url", "json"];
const NUMBER_TYPES = ["integer", "decimal"];

export const fullKey = (def) => `${def?.namespace || "custom"}.${def?.key || ""}`;

// "Bottle size (ml)" → "bottle_size_ml"
export function slugifyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function isBlank(value) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.filter((v) => !isBlank(v)).length === 0;
  return false;
}

// ── Value → payload ───────────────────────────────────────────────────────────

/**
 * Build the `metafields` array sent with the product.
 * Only definitions the admin actually filled in are included — everything else
 * stays absent so the storefront keeps using its default content.
 * `extras` are values whose definition no longer exists; they are preserved
 * rather than silently dropped.
 */
export function buildMetafieldsPayload(definitions, values, extras = []) {
  const entries = (definitions || [])
    .map((def) => {
      const raw = values?.[fullKey(def)];
      if (isBlank(raw)) return null;

      let value = raw;
      if (def.list) {
        value = (Array.isArray(raw) ? raw : [raw]).filter((v) => !isBlank(v));
      }
      if (def.type === "boolean") {
        value = def.list
          ? value.map((v) => v === "true" || v === true)
          : raw === "true" || raw === true;
      }
      if (NUMBER_TYPES.includes(def.type)) {
        value = def.list ? value.map((v) => Number(v)) : Number(raw);
      }

      return {
        namespace: def.namespace || "custom",
        key: def.key,
        name: def.name,
        type: def.type,
        list: !!def.list,
        value,
      };
    })
    .filter(Boolean);

  const known = new Set(entries.map((e) => `${e.namespace}.${e.key}`));
  const preserved = (extras || []).filter(
    (e) => e?.key && !known.has(`${e.namespace || "custom"}.${e.key}`),
  );

  return [...entries, ...preserved];
}

/** Turn a saved product's metafield array back into the form's value map. */
export function metafieldsToValues(metafields) {
  const values = {};
  (metafields || []).forEach((mf) => {
    if (!mf?.key) return;
    const key = `${mf.namespace || "custom"}.${mf.key}`;
    if (Array.isArray(mf.value)) values[key] = mf.value.map((v) => String(v));
    else if (typeof mf.value === "boolean") values[key] = String(mf.value);
    else values[key] = mf.value === undefined || mf.value === null ? "" : String(mf.value);
  });
  return values;
}

/** Returns an error message for the first invalid metafield, or null. */
export function validateMetafields(definitions, values) {
  for (const def of definitions || []) {
    const raw = values?.[fullKey(def)];
    const v = def.validation || {};
    const items = def.list
      ? (Array.isArray(raw) ? raw : []).filter((x) => !isBlank(x))
      : isBlank(raw)
        ? []
        : [raw];

    if (v.required && items.length === 0) return `${def.name} is required`;

    for (const item of items) {
      const text = String(item);

      if (TEXT_TYPES.includes(def.type)) {
        if (v.minLength && text.length < Number(v.minLength))
          return `${def.name} must be at least ${v.minLength} characters`;
        if (v.maxLength && text.length > Number(v.maxLength))
          return `${def.name} must be at most ${v.maxLength} characters`;
        if (v.regex) {
          try {
            if (!new RegExp(v.regex).test(text))
              return `${def.name} does not match the required format`;
          } catch {
            /* an invalid stored pattern should not block saving */
          }
        }
      }

      if (NUMBER_TYPES.includes(def.type)) {
        const num = Number(text);
        if (Number.isNaN(num)) return `${def.name} must be a number`;
        if (def.type === "integer" && !Number.isInteger(num))
          return `${def.name} must be a whole number`;
        if (v.min !== undefined && v.min !== null && v.min !== "" && num < Number(v.min))
          return `${def.name} must be ${v.min} or more`;
        if (v.max !== undefined && v.max !== null && v.max !== "" && num > Number(v.max))
          return `${def.name} must be ${v.max} or less`;
      }

      if (def.type === "json") {
        try {
          JSON.parse(text);
        } catch {
          return `${def.name} must be valid JSON`;
        }
      }

      if (Array.isArray(v.choices) && v.choices.length && !v.choices.includes(text))
        return `${def.name} must be one of: ${v.choices.join(", ")}`;
    }
  }
  return null;
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={!!checked}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Value input ───────────────────────────────────────────────────────────────

function SingleValueInput({ def, value, onChange, autoFocus }) {
  const base =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400";
  const choices = def.validation?.choices || [];

  if (choices.length) {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} bg-white`}
      >
        <option value="">Select</option>
        {choices.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  switch (def.type) {
    case "multi_line_text":
    case "rich_text":
    case "json":
      return (
        <textarea
          autoFocus={autoFocus}
          rows={def.type === "json" ? 4 : 3}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.type === "json" ? '{ "key": "value" }' : def.name}
          className={`${base} resize-y`}
        />
      );
    case "integer":
    case "decimal":
      return (
        <input
          autoFocus={autoFocus}
          type="number"
          step={def.type === "integer" ? "1" : "0.01"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={base}
        />
      );
    case "boolean":
      return (
        <select
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} bg-white`}
        >
          <option value="">Select</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    case "date":
      return (
        <input
          autoFocus={autoFocus}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 w-10 rounded border border-gray-300 bg-white p-1"
          />
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className={base}
          />
        </div>
      );
    case "url":
      return (
        <input
          autoFocus={autoFocus}
          type="url"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://"
          className={base}
        />
      );
    default:
      return (
        <input
          autoFocus={autoFocus}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.name}
          className={base}
        />
      );
  }
}

function MetafieldValueField({ def, value, onChange }) {
  if (!def.list) {
    return <SingleValueInput def={def} value={value} onChange={onChange} />;
  }

  const items = Array.isArray(value) ? value : [];
  const setItem = (i, val) => onChange(items.map((x, idx) => (idx === i ? val : x)));

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <SingleValueInput def={def} value={item} onChange={(val) => setItem(i, val)} />
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="pt-2 text-gray-300 transition-colors hover:text-red-500"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-900"
      >
        <Plus size={12} /> Add value
      </button>
    </div>
  );
}

// ── Add definition modal ──────────────────────────────────────────────────────

const DEFAULT_DEFINITION = {
  name: "",
  key: "",
  keyEdited: false,
  namespace: "custom",
  description: "",
  type: "single_line_text",
  list: false,
  validation: {
    required: false,
    minLength: "",
    maxLength: "",
    min: "",
    max: "",
    regex: "",
    choices: [],
  },
  options: {
    filterable: false,
    collectionCondition: false,
    storefrontAccess: true,
    analytics: false,
  },
};

function DefinitionModal({ onSave, onClose, saving }) {
  const [def, setDef] = useState(DEFAULT_DEFINITION);
  const [showDescription, setShowDescription] = useState(false);
  const [editingKey, setEditingKey] = useState(false);
  const [validationOpen, setValidationOpen] = useState(false);
  const [choiceInput, setChoiceInput] = useState("");
  const [error, setError] = useState("");

  const setField = (key, val) => setDef((p) => ({ ...p, [key]: val }));
  const setValidation = (key, val) =>
    setDef((p) => ({ ...p, validation: { ...p.validation, [key]: val } }));
  const setOption = (key, val) =>
    setDef((p) => ({ ...p, options: { ...p.options, [key]: val } }));

  // The key tracks the name until the admin edits it by hand
  const key = def.keyEdited ? def.key : slugifyKey(def.name);

  const submit = () => {
    if (!def.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!key) {
      setError("Key is required — use letters or numbers in the name");
      return;
    }
    setError("");
    onSave({
      name: def.name.trim(),
      key,
      namespace: def.namespace || "custom",
      description: def.description.trim(),
      type: def.type,
      list: def.list,
      validation: def.validation,
      options: def.options,
    });
  };

  const addChoice = () => {
    const val = choiceInput.trim();
    if (!val || def.validation.choices.includes(val)) return;
    setValidation("choices", [...def.validation.choices, val]);
    setChoiceInput("");
  };

  const isText = TEXT_TYPES.includes(def.type);
  const isNumber = NUMBER_TYPES.includes(def.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-gray-600 shadow-sm">
              <Archive size={15} />
            </span>
            <h2 className="text-base font-semibold text-gray-900">
              Add product metafield definition
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-lg bg-gray-700 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Name + type */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              autoFocus
              value={def.name}
              onChange={(e) => setField("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
            />
            <div className="mt-1.5 flex items-center gap-1.5">
              {editingKey ? (
                <>
                  <span className="text-xs text-gray-400">{def.namespace}.</span>
                  <input
                    autoFocus
                    value={key}
                    onChange={(e) =>
                      setDef((p) => ({
                        ...p,
                        key: slugifyKey(e.target.value),
                        keyEdited: true,
                      }))
                    }
                    onBlur={() => setEditingKey(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingKey(false)}
                    className="w-48 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-400">
                    {def.namespace}.{key || "…"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingKey(true)}
                    title="Edit key"
                    className="text-gray-400 transition-colors hover:text-gray-700"
                  >
                    <Pencil size={11} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <div className="flex items-stretch gap-2">
              <select
                value={def.list ? "list" : "one"}
                onChange={(e) => setField("list", e.target.value === "list")}
                className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="one">One</option>
                <option value="list">List of</option>
              </select>
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3">
                <TypeIcon size={14} className="shrink-0 text-gray-400" />
                <select
                  value={def.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="flex-1 bg-transparent py-2 text-sm text-gray-700 outline-none"
                >
                  {METAFIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showDescription ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                autoFocus
                rows={2}
                value={def.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Helps staff understand what to enter here"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDescription(true)}
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Add description
            </button>
          )}
        </div>

        {/* Validation */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <button
            type="button"
            onClick={() => setValidationOpen((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-sm font-semibold text-gray-900">Validation</span>
            {validationOpen ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          {validationOpen && (
            <div className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={def.validation.required}
                  onChange={(e) => setValidation("required", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-gray-900"
                />
                <span className="text-sm text-gray-700">
                  Require a value for every product
                </span>
              </label>

              {isText && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Minimum characters
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={def.validation.minLength}
                      onChange={(e) => setValidation("minLength", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Maximum characters
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={def.validation.maxLength}
                      onChange={(e) => setValidation("maxLength", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                </div>
              )}

              {isNumber && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Minimum value
                    </label>
                    <input
                      type="number"
                      value={def.validation.min}
                      onChange={(e) => setValidation("min", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Maximum value
                    </label>
                    <input
                      type="number"
                      value={def.validation.max}
                      onChange={(e) => setValidation("max", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                    />
                  </div>
                </div>
              )}

              {isText && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Regular expression (optional)
                  </label>
                  <input
                    value={def.validation.regex}
                    onChange={(e) => setValidation("regex", e.target.value)}
                    placeholder="^[A-Z]{2}-\d+$"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Limit to preset choices (optional)
                </label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {def.validation.choices.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() =>
                          setValidation(
                            "choices",
                            def.validation.choices.filter((x) => x !== c),
                          )
                        }
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={choiceInput}
                    onChange={(e) => setChoiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addChoice();
                      }
                    }}
                    placeholder="Add a choice and press Enter"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:ring-1 focus:ring-gray-400"
                  />
                  <button
                    type="button"
                    onClick={addChoice}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900">Options</h3>
            <span
              title="Control where this metafield can be used"
              className="text-gray-300"
            >
              <Info size={13} />
            </span>
          </div>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {[
              ["filterable", "Filter on the product list and in the Admin API"],
              ["collectionCondition", "Use as a condition in collections"],
              ["storefrontAccess", "Storefront API access"],
              ["analytics", "Filter or group data in Analytics"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between px-4 py-3.5">
                <span className="pr-4 text-sm text-gray-700">{label}</span>
                <Toggle
                  checked={def.options[key]}
                  onChange={(val) => setOption(key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

/**
 * "Product metafields" card. Renders one input per admin-created definition and
 * lets the admin add a new definition without leaving the product form.
 */
export default function ProductMetafieldsSection({
  definitions,
  values,
  onChange,
  onCreateDefinition,
  loading,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const setValue = (def, val) => onChange({ ...values, [fullKey(def)]: val });

  const handleCreate = async (payload) => {
    setSaving(true);
    const created = await onCreateDefinition(payload);
    setSaving(false);
    if (created) setModalOpen(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Product metafields</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Add definition
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-xs text-gray-400">Loading metafields…</p>
        ) : definitions.length === 0 ? (
          <p className="text-xs text-gray-400">
            No metafield definitions yet. Add one to store extra product details —
            until then the website shows its default content.
          </p>
        ) : (
          definitions.map((def) => (
            <div
              key={fullKey(def)}
              className="grid grid-cols-1 items-start gap-1 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4"
            >
              <div className="pt-2">
                <p className="truncate text-sm text-[#0A4D91]" title={fullKey(def)}>
                  {def.name}
                  {def.validation?.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </p>
                {def.description && (
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                    {def.description}
                  </p>
                )}
              </div>
              <MetafieldValueField
                def={def}
                value={values?.[fullKey(def)]}
                onChange={(val) => setValue(def, val)}
              />
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <DefinitionModal
          saving={saving}
          onSave={handleCreate}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
