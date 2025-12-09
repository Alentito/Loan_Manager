import { matchPath } from 'react-router-dom';
import { pageMeta } from "../config/pageMeta";


export function getPageMeta(pathname) {
  // Sort routes longest to shortest to avoid "/" catching everything first
  const routes = Object.keys(pageMeta).sort((a, b) => b.length - a.length);

  for (const route of routes) {
    const match = matchPath({ path: route, end: false }, pathname);
    if (match) return pageMeta[route];
  }

  return { title: "Page", description: "" }; // default fallback
}
