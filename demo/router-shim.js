// GitHub Pages has no SPA fallback, so the demo swaps BrowserRouter for HashRouter (#/trends, ...).
export * from "react-router-dom-real";
export { HashRouter as BrowserRouter } from "react-router-dom-real";
