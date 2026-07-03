import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store";

const ACCEPT = ".json,.csv,.txt,.pdf,.md,.py,.js,.ts";

export default function Dropzone() {
  const analyze = useStore((s) => s.analyze);
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const onFiles = (files) => {
    if (files && files.length) analyze(files[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <div className="dz-icon">↑</div>
        <h3>Drop a file to audit</h3>
        <p>Source code, a spend export, or a résumé — LogiqAI detects the type.</p>
        <div className="formats">.json · .csv · .txt · .pdf · .py · .js · .ts · .md</div>
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept={ACCEPT}
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
    </motion.div>
  );
}
