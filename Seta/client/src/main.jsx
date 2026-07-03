import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Always start at the top. Disable the browser's scroll restoration and strip
// any leftover #hash (e.g. an old "#collection" from a prior in-page link) so
// the browser can't jump the page down on reload. Runs before React mounts.
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
if (window.location.hash) {
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search
  );
}
window.scrollTo(0, 0);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
