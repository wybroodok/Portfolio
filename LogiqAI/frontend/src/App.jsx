import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "./store";
import { getHealth } from "./api";
import Sidebar from "./components/Sidebar";
import Register from "./components/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Insights from "./pages/Insights";

const PAGES = {
  dashboard: Dashboard,
  analytics: Analytics,
  insights: Insights,
};

export default function App() {
  const tab = useStore((s) => s.tab);
  const user = useStore((s) => s.user);
  const authReady = useStore((s) => s.authReady);
  const init = useStore((s) => s.init);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    init();
    getHealth().then(setHealth);
  }, [init]);

  // Wait until any saved session is validated to avoid a flash of the register screen.
  if (!authReady) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  if (!user) {
    return <Register />;
  }

  const Page = PAGES[tab] || Dashboard;

  return (
    <div className="app">
      <Sidebar health={health} />
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
          >
            <Page />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
