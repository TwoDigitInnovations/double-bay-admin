import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  Pencil,
  Check,
  CheckCircle2,
  Tag,
  Palette,
  Package,
  Store,
  ArrowRight,
  X,
} from "lucide-react";
import isAuth from "@/components/isAuth";

// ── Time-based greeting ───────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

// ── Store name (persisted in localStorage) ────────────────────────────────────

function StoreNameEditor() {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("storeName");
    if (saved) setName(saved);
  }, []);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      localStorage.setItem("storeName", trimmed);
      setName(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder="My Store"
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-gray-400 w-48"
        />
        <button
          onClick={save}
          className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Check size={13} />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      className="flex items-center gap-1.5 group"
    >
      <span className="text-base font-semibold text-gray-900">
        {name || "Add store name"}
      </span>
      <Pencil
        size={14}
        className="text-gray-400 group-hover:text-gray-700 transition-colors"
      />
    </button>
  );
}

// ── Quick action cards ────────────────────────────────────────────────────────

function ProductIllustration() {
  return (
    <div className="relative h-32 flex items-center justify-center">
      {/* Back cards */}
      <div className="absolute w-24 h-24 rounded-xl bg-gray-200 rotate-6 translate-x-4 -translate-y-1" />
      <div className="absolute w-24 h-24 rounded-xl bg-gray-300 -rotate-3 -translate-x-2" />
      {/* Front card */}
      <div className="relative w-24 h-24 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
        <Tag size={28} className="text-gray-300" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function ThemeIllustration() {
  return (
    <div className="relative h-32 flex items-center justify-center">
      <div className="absolute w-28 h-20 rounded-xl bg-blue-100 rotate-3 translate-x-3" />
      <div className="relative w-28 h-20 rounded-xl bg-white border border-gray-200 shadow-sm p-2.5 overflow-hidden">
        {/* Mini website mockup */}
        <div className="h-3 w-full bg-gray-100 rounded mb-2 flex items-center gap-1 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="flex-1 h-1 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="space-y-1 flex-1">
            <div className="h-1.5 bg-gray-200 rounded w-full" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-[7px] font-bold text-gray-400">Aa</span>
          </div>
        </div>
        <div className="mt-1.5 h-1 bg-blue-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function ActionCard({ illustration, title, description, actions }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-gray-50 p-5 flex flex-col">
      {illustration}
      <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-4 flex-1">{description}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a, i) =>
          a.href ? (
            <a
              key={i}
              href={a.href}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                a.primary
                  ? "bg-gray-900 hover:bg-gray-700 text-white"
                  : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              {a.label}
            </a>
          ) : (
            <button
              key={i}
              onClick={a.onClick}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                a.primary
                  ? "bg-gray-900 hover:bg-gray-700 text-white"
                  : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              {a.label}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

// ── Setup tasks ───────────────────────────────────────────────────────────────

const TASKS = [
  {
    id: "store_name",
    label: "Add your store name",
    description: "Give your store a name that customers will recognize.",
    icon: Store,
    action: null,
  },
  {
    id: "first_product",
    label: "Add your first product",
    description: "Start stocking your store with products.",
    icon: Package,
    action: "/products",
  },
  {
    id: "customize_store",
    label: "Customize your store",
    description: "Add your logo, colors, and make it feel like yours.",
    icon: Palette,
    action: "/online-store",
  },
  {
    id: "review_settings",
    label: "Review your store settings",
    description: "Configure taxes, shipping, and other preferences.",
    icon: Store,
    action: "/Settings",
  },
];

function TaskItem({ task, done, onToggle, router }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
        done ? "opacity-50" : "hover:bg-gray-50"
      }`}
      onClick={() => {
        onToggle(task.id);
        if (!done && task.action) router.push(task.action);
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          done
            ? "bg-gray-900 border-gray-900"
            : "border-gray-300 hover:border-gray-500"
        }`}
      >
        {done && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${done ? "line-through text-gray-400" : "text-gray-900"}`}
        >
          {task.label}
        </p>
        {!done && (
          <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
        )}
      </div>
      {!done && task.action && (
        <ArrowRight size={14} className="text-gray-400 mt-0.5 shrink-0" />
      )}
    </div>
  );
}

function ProgressRing({ done, total }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? (done / total) * circ : 0;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#111827"
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={circ - progress}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

function Dashboard() {
  const router = useRouter();
  const user = useSelector((s) => s.user.user);

  const [doneTasks, setDoneTasks] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("setupTasks") || "{}");
    } catch {
      return {};
    }
  });

  const toggleTask = (id) => {
    setDoneTasks((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("setupTasks", JSON.stringify(next));
      return next;
    });
  };

  const doneCount = TASKS.filter((t) => doneTasks[t.id]).length;
  const allDone = doneCount === TASKS.length;
  const name = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="pb-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          {getGreeting()}, {name}!
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Store setup card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <StoreNameEditor />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            illustration={<ProductIllustration />}
            title="Add your products"
            description="Not ready to import? Add a product manually to get started."
            actions={[
              {
                label: "Add product",
                primary: true,
                onClick: () => router.push("/products/add"),
              },
              {
                label: "Import products",
                onClick: () => router.push("/products"),
              },
            ]}
          />
          <ActionCard
            illustration={<ThemeIllustration />}
            title="Customize your store"
            description="Add your logo, choose colors, and make your store feel like home."
            actions={[
              {
                label: "Customize store",
                onClick: () => router.push("/online-store"),
              },
            ]}
          />
        </div>
      </div>

      {/* Setup checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          {allDone ? (
            <CheckCircle2 size={36} className="text-green-500 shrink-0" />
          ) : (
            <ProgressRing done={doneCount} total={TASKS.length} />
          )}
          <div>
            <p className="text-xs text-gray-400">
              {doneCount} of {TASKS.length} tasks complete
            </p>
            <h2 className="text-sm font-semibold text-gray-900">
              {allDone ? "Store is all set up!" : "Set up your store"}
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {TASKS.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              done={!!doneTasks[task.id]}
              onToggle={toggleTask}
              router={router}
            />
          ))}
        </div>
      </div>

      {/* All caught up */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CheckCircle2 size={14} />
          All caught up
        </div>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    </div>
  );
}

export default isAuth(Dashboard);
