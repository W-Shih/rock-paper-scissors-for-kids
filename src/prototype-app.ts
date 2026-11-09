import { createLearnApp } from './learn-ui';
import { createTogetherApp } from './together-ui';

// Minimal spike launcher; full product navigation remains M1-01.
export function createPrototypeApp() {
  const element = document.createElement('div');
  let current: { element: HTMLElement; dispose(): void } | undefined;
  let disposed = false;
  function clear() { current?.dispose(); current = undefined; element.replaceChildren(); }
  function learn() {
    if (disposed) return;
    clear(); current = createLearnApp({}, together); element.append(current.element);
  }
  function together() {
    if (disposed) return;
    clear(); current = createTogetherApp({}, learn); element.append(current.element);
  }
  // A cached document must not retain its secret DOM, controller or callbacks.
  function pagehide() { clear(); }
  function pageshow() { if (!current) learn(); }
  function popstate() { learn(); }
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  window.addEventListener('popstate', popstate);
  learn();
  return { element, dispose() {
    disposed = true; clear();
    window.removeEventListener('pagehide', pagehide); window.removeEventListener('pageshow', pageshow); window.removeEventListener('popstate', popstate);
  } };
}
