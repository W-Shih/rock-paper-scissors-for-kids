import { createLearnApp } from './learn-ui';
import { createTogetherApp } from './together-ui';
import { formatBilingualText as bilingual } from './bilingual-text';

type Screen = 'home' | 'play' | 'computer' | 'garage' | 'parent' | 'learn' | 'together';

// The shell owns navigation only. Each playable prototype owns and disposes its
// own controller so a new visit always starts with a fresh round.
export function createPrototypeApp() {
  const element = document.createElement('div');
  const screenRoot = document.createElement('main');
  let screen: Screen = 'home';
  let parentConfirmed = false;
  let current: { element: HTMLElement; dispose(): void } | undefined;
  let disposed = false;

  function clearCurrent() {
    current?.dispose();
    current = undefined;
    screenRoot.replaceChildren();
  }
  function button(label: string, action: () => void, subtle = false) {
    const control = document.createElement('button');
    control.type = 'button'; control.textContent = label;
    if (subtle) control.className = 'parent-entry';
    control.addEventListener('click', action, { once: true });
    screenRoot.append(control);
  }
  function message(text: string, status = false) {
    const p = document.createElement('p'); p.textContent = text;
    if (status) p.setAttribute('role', 'status');
    screenRoot.append(p);
  }
  function home() { screen = 'home'; render(); }
  function render() {
    if (disposed) return;
    clearCurrent();
    const heading = document.createElement('h1');
    heading.textContent = bilingual('工地猜拳大賽', 'Construction Site RPS Adventure');
    screenRoot.append(heading);
    if (screen === 'home') {
      button(bilingual('學習', 'Learn'), () => { screen = 'learn'; render(); });
      button(bilingual('比賽', 'Play'), () => { screen = 'play'; render(); });
      button(bilingual('收藏館', 'Garage'), () => { screen = 'garage'; render(); });
      button(bilingual('家長設定', 'Parent settings'), () => { screen = 'parent'; parentConfirmed = false; render(); }, true);
    } else if (screen === 'play') {
      screenRoot.append(Object.assign(document.createElement('h2'), { textContent: bilingual('選擇比賽模式', 'Choose a play mode') }));
      button(bilingual('電腦', 'Computer'), () => { screen = 'computer'; render(); });
      button(bilingual('親子', 'Together'), () => { screen = 'together'; render(); });
      button(bilingual('返回', 'Back'), home);
    } else if (screen === 'computer' || screen === 'garage') {
      message(screen === 'computer'
        ? bilingual('電腦對戰目前為原型，尚未提供遊玩。', 'Computer play is a prototype and is not available yet.')
        : bilingual('收藏館目前為原型，尚未提供瀏覽。', 'Garage is a prototype and is not available yet.'), true);
      button(bilingual('返回', 'Back'), () => { screen = screen === 'computer' ? 'play' : 'home'; render(); });
      button(bilingual('回首頁', 'Home'), home);
    } else if (screen === 'parent') {
      if (!parentConfirmed) {
        message(bilingual('家長設定入口。請確認由家長繼續。', 'Parent settings. Confirm that a parent is continuing.'));
        button(bilingual('繼續', 'Continue'), () => { parentConfirmed = true; render(); });
        button(bilingual('取消', 'Cancel'), home);
      } else {
        const dialog = document.createElement('section');
        dialog.setAttribute('aria-label', bilingual('家長設定', 'Parent settings'));
        const note = document.createElement('p');
        note.textContent = bilingual('家長設定目前尚未提供。', 'Parent settings are not available yet.');
        dialog.append(note); screenRoot.append(dialog);
        button(bilingual('知道了', 'Got it'), home);
      }
    } else if (screen === 'learn') {
      current = createLearnApp({}, () => { screen = 'together'; render(); }, home);
      screenRoot.append(current.element);
    } else if (screen === 'together') {
      current = createTogetherApp({}, home);
      screenRoot.append(current.element);
    }
    element.replaceChildren(screenRoot);
  }
  function pagehide() { clearCurrent(); screen = 'home'; }
  function pageshow() { if (!current && !disposed) render(); }
  function popstate() { home(); }
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  window.addEventListener('popstate', popstate);
  element.append(screenRoot);
  render();
  return { element, dispose() {
    disposed = true; clearCurrent();
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
    window.removeEventListener('popstate', popstate);
  } };
}
