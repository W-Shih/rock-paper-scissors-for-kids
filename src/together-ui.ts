import { formatBilingualText as bilingual } from './bilingual-text';
import { learnRuleContent } from './learn-domain';
import { gestures, playableCharacters, type Gesture } from './rps-domain';
import { createRoundController, type RoundControllerOptions, type RoundEvent } from './round-controller';
import { createTogetherMedia } from './together-media';
import { createGestureCard } from './gesture-card';

function label(gesture: Gesture) {
  const c = playableCharacters[gesture];
  return `${c.symbol} ${bilingual(c.nameZh, c.nameEn)} · ${bilingual(c.vehicleZh, c.vehicleEn)}`;
}

export function createTogetherApp(options: Partial<RoundControllerOptions> = {}, onHome?: () => void) {
  const element = document.createElement('section');
  element.setAttribute('aria-label', bilingual('親子流程原型', 'Together flow spike'));
  const controller = createRoundController({
    clock: { schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: handle => window.clearTimeout(handle as number) },
    media: createTogetherMedia(element), ...options,
  });
  function text(value: string, status = false) {
    const p = document.createElement('p'); p.textContent = value;
    if (status) p.setAttribute('role', 'status'); element.append(p); return p;
  }
  function button(value: string, action: string, disabled = false) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = value;
    b.dataset.action = action; b.disabled = disabled; element.append(b); return b;
  }
  function render() {
    const hadFocus = element.contains(document.activeElement);
    const action = hadFocus && document.activeElement instanceof HTMLElement ? document.activeElement.dataset.action : undefined;
    element.replaceChildren();
    const s = controller.getState();
    const heading = document.createElement('h2'); heading.tabIndex = -1;
    heading.textContent = s.phase === 'handoff' ? bilingual('玩家 1 已準備，請交給玩家 2。', 'Player 1 is ready. Pass to Player 2.')
      : s.phase === 'choosing-p2' ? bilingual('玩家 2 選擇手勢', 'Player 2 chooses a gesture')
      : bilingual('親子流程原型', 'Together flow spike');
    element.append(heading);
    if (s.phase === 'home') button(bilingual('親子', 'Together'), 'start');
    else if (s.phase === 'choosing-p1' || s.phase === 'choosing-p2') {
      if (s.phase === 'choosing-p1') text(bilingual('玩家 1 選擇手勢', 'Player 1 chooses a gesture'));
      const selection = s.phase === 'choosing-p1' ? s.player1Selection : s.player2Selection;
      const choices = document.createElement('div');
      choices.className = 'gesture-selection';
      choices.setAttribute('aria-label', bilingual('選擇手勢', 'Choose a gesture'));
      for (const gesture of gestures) choices.append(createGestureCard(gesture, selection === gesture));
      const confirm = document.createElement('button');
      confirm.type = 'button'; confirm.textContent = bilingual('確認', 'Confirm');
      confirm.dataset.action = 'confirm'; confirm.disabled = !selection;
      choices.append(confirm);
      element.append(choices);
    } else if (s.phase === 'handoff') button(bilingual('玩家 2 準備好了', 'Player 2 is ready'), 'ready');
    else if (s.phase === 'countdown') text(bilingual('3、2、1，準備，開始！', '3, 2, 1 — Ready, Set, Go!'), true);
    else if (s.phase === 'approach') text(bilingual('一起到中央揭曉！', 'Meet in the centre to reveal!'), true);
    else {
      const r = s.result!;
      const figure = document.createElement('figure'); figure.setAttribute('aria-label', bilingual('中央共同揭曉', 'Central simultaneous reveal'));
      const hands = document.createElement('p'); hands.textContent = `${bilingual('玩家 1', 'Player 1')}: ${label(r.player1Gesture)} ↔ ${bilingual('玩家 2', 'Player 2')}: ${label(r.player2Gesture)}`;
      const caption = document.createElement('figcaption');
      if (r.ruleId === 'tie') caption.textContent = bilingual('平手！一起開心揮手。', "It's a tie! Wave happily together.");
      else { const c = learnRuleContent[r.ruleId]; caption.textContent = `${bilingual(c.zh, c.en)} ${bilingual(c.causeZh, c.causeEn)}`; }
      figure.append(hands, caption); element.append(figure);
      if (s.phase === 'reveal' && s.presentation === 'static') button(bilingual('看完了', 'Finished watching'), 'finish');
      if (s.phase === 'complete') { text(bilingual('完成一局！', 'Round complete!'), true); button(bilingual('再玩一次', 'Play again'), 'replay'); }
    }
    if (s.phase !== 'home') button(bilingual('回首頁', 'Home'), 'home');
    if (hadFocus) {
      const next = Array.from(element.querySelectorAll('button')).find(b => b.dataset.action === action);
      (next ?? heading).focus();
    }
  }
  function onClick(event: Event) {
    if (!(event.target instanceof Element)) return;
    const b = event.target.closest('button'); if (!b || !element.contains(b) || b.disabled) return;
    const s = controller.getState(); const action = b.dataset.action;
    if (action === 'home') { controller.dispatch({ type: 'HOME' }); onHome?.(); return; }
    const events: Record<string, RoundEvent> = {
      start: { type: 'START', mode: 'together' }, confirm: { type: 'CONFIRM_SELECTION', player: s.phase === 'choosing-p2' ? 2 : 1 },
      ready: { type: 'MEDIA_FINISHED', roundId: s.roundId, phase: 'handoff' },
      finish: { type: 'MEDIA_FINISHED', roundId: s.roundId, phase: 'reveal' }, replay: { type: 'REPLAY' },
    };
    const gesture = gestures.find(g => action === `select-${g}`);
    if (gesture) controller.dispatch({ type: 'SELECT_GESTURE', player: s.phase === 'choosing-p2' ? 2 : 1, gesture });
    else if (action && events[action]) controller.dispatch(events[action]);
  }
  element.addEventListener('click', onClick);
  const unsubscribe = controller.subscribe(render);
  controller.dispatch({ type: 'START', mode: 'together' });
  return { element, dispose() { element.removeEventListener('click', onClick); unsubscribe(); controller.dispose(); element.replaceChildren(); } };
}
