import { useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store";
import Logo from "./Logo";

export default function Register() {
  const register = useStore((s) => s.register);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setErr(null);
    try {
      await register(trimmed);
    } catch (e2) {
      setErr(e2.message || "Could not register");
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <motion.form
        className="panel auth-card"
        onSubmit={submit}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="auth-brand">
          <Logo size={34} />
          <div>
            <div className="brand-name">
              Logiq<b>AI</b>
            </div>
            <div className="brand-sub">AUDIT INTELLIGENCE</div>
          </div>
        </div>

        <h2>Create your workspace</h2>
        <p>
          Pick a username to get started. You'll receive a unique ID, and every audit
          you run stays private to your account.
        </p>

        <label className="field-label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          className="input"
          placeholder="e.g. violet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoFocus
        />

        {err && <div className="error-banner">{err}</div>}

        <button className="btn primary" type="submit" disabled={busy || !name.trim()}>
          {busy ? "Setting up…" : "Enter LogiqAI"}
        </button>
      </motion.form>
    </div>
  );
}
