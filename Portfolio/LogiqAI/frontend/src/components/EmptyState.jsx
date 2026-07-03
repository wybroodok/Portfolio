import { useStore } from "../store";

export default function EmptyState() {
  const setTab = useStore((s) => s.setTab);
  return (
    <div className="empty-state">
      <div className="es-icon">◇</div>
      <h2>No audit yet</h2>
      <p style={{ marginTop: 8 }}>Upload a document from the Dashboard to unlock this view.</p>
      <button className="btn" style={{ marginTop: 18 }} onClick={() => setTab("dashboard")}>
        Go to Dashboard
      </button>
    </div>
  );
}
