import { useStore } from "../store";
import Logo from "./Logo";

const NAV = [
  { id: "dashboard", label: "Dashboard", ico: "▤" },
  { id: "analytics", label: "Analytics", ico: "◫" },
  { id: "insights", label: "AI Insights", ico: "◇" },
];

export default function Sidebar({ health }) {
  const { tab, setTab, history, user, logout } = useStore();
  const locked = history.length === 0;

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={30} />
        <div>
          <div className="brand-name">
            Logiq<b>AI</b>
          </div>
          <div className="brand-sub">AUDIT INTELLIGENCE</div>
        </div>
      </div>

      {NAV.map((item) => {
        const disabled = locked && item.id !== "dashboard";
        return (
          <div
            key={item.id}
            className={`nav-item ${tab === item.id ? "active" : ""} ${disabled ? "disabled" : ""}`}
            onClick={() => !disabled && setTab(item.id)}
          >
            <span className="ico">{item.ico}</span>
            <span>{item.label}</span>
          </div>
        );
      })}

      <div className="sidebar-user">
        <div className="user-row">
          <div className="user-avatar">
            {(user?.username || "?").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{user?.username}</div>
            <div className="user-id">#{(user?.id || "").slice(0, 8)}</div>
          </div>
        </div>
        <span className="user-logout" onClick={logout}>
          Sign out
        </span>
        <div className="status-line">
          <span className={`status-dot ${health?.ai_enabled ? "ai" : "off"}`} />
          {health?.ai_enabled ? "AI engine online" : "Service unavailable"}
        </div>
      </div>
    </aside>
  );
}
