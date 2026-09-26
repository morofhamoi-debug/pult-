import { setState } from './state.js';

const routes = new Map();
let currentCleanup = null;

export function registerRoute(name, renderFn) {
  routes.set(name, renderFn);
}

export function navigate(screen, params = {}) {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  setState({ screen, error: null, ...params });
  const render = routes.get(screen);
  const container = document.getElementById('screen-container');
  if (render && container) {
    container.innerHTML = '';
    currentCleanup = render(container) || null;
  }
}

export function getCurrentRoute() {
  return routes;
}
