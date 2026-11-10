import { formatBilingualText as bilingual } from './bilingual-text';
import { learnRuleContent } from './learn-domain';
import { gestures, playableCharacters, type Gesture } from './rps-domain';
import { createRoundController, type RoundControllerOptions, type RoundEvent } from './round-controller';
import { createTogetherMedia } from './together-media';
import { createGestureSelection } from './gesture-selection';

function gestureLabel(gesture: Gesture) {
  const character = playableCharacters[gesture];
  return `${character.symbol} ${bilingual(character.nameZh, character.nameEn)} · ${bilingual(character.vehicleZh, character.vehicleEn)}`;
}

export function createComputerApp(options: Partial<RoundControllerOptions> = {}, onHome?: () => void) {
  const element = document.createElement('section');
  element.setAttribute('aria-label', bilingual('電腦對戰原型', 'Computer play spike'));
  const controller = createRoundController({
    clock: { schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: handle => window.clearTimeout(handle as number) },
    media: createTogetherMedia(element), ...options,
  });

  function button(value: string, action: string) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = value;
    b.dataset.action = action; element.append(b); return b;
  }
  function render() {
    const hadFocus = element.contains(document.activeElement);
    const action = hadFocus && document.activeElement instanceof HTMLElement ? document.activeElement.dataset.action : undefined;
    element.replaceChildren();
    const state = controller.getState();
    const heading = document.createElement('h2'); heading.tabIndex = -1;
    heading.textContent = bilingual('電腦對戰原型', 'Computer play spike'); element.append(heading);
    if (state.phase === 'choosing-p1') {
      const prompt = document.createElement('p'); prompt.textContent = bilingual('選擇你的手勢', 'Choose your gesture'); element.append(prompt);
      element.append(createGestureSelection(state.player1Selection));
    } else if (state.phase === 'countdown') {
      const status = document.createElement('p'); status.setAttribute('role', 'status');
      status.textContent = bilingual('3、2、1，準備，開始！', '3, 2, 1 — Ready, Set, Go!'); element.append(status);
    } else if (state.phase === 'approach') {
      const status = document.createElement('p'); status.setAttribute('role', 'status');
      status.textContent = bilingual('雙方前往中央！', 'Both players meet in the centre!'); element.append(status);
    } else if (state.result) {
      const result = state.result;
      const figure = document.createElement('figure'); figure.setAttribute('aria-label', bilingual('中央揭曉結果', 'Central reveal'));
      const outcome = document.createElement('p');
      outcome.textContent = result.outcome === 'win' ? bilingual('你贏了！', 'You win!')
        : result.outcome === 'lose' ? bilingual('這次電腦贏了。再試一次吧！', 'The computer wins this time. Try again!')
          : bilingual('平手！', "It's a tie!");
      const hands = document.createElement('p'); hands.textContent = `${bilingual('你', 'Player 1')}: ${gestureLabel(result.player1Gesture)} ↔ ${bilingual('電腦', 'Computer')}: ${gestureLabel(result.player2Gesture)}`;
      const caption = document.createElement('figcaption');
      if (result.ruleId === 'tie') caption.textContent = bilingual('平手！一起開心揮手。', "It's a tie! Wave happily together.");
      else { const rule = learnRuleContent[result.ruleId]; caption.textContent = `${bilingual(rule.zh, rule.en)} ${bilingual(rule.causeZh, rule.causeEn)}`; }
      figure.append(outcome, hands, caption); element.append(figure);
      if (state.phase === 'reveal' && state.presentation === 'static') button(bilingual('看完了', 'Finished watching'), 'finish');
      if (state.phase === 'complete') {
        const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = bilingual('完成一局！', 'Round complete!'); element.append(status);
        button(bilingual('再玩一次', 'Play again'), 'replay');
      }
    }
    button(bilingual('回首頁', 'Home'), 'home');
    if (hadFocus) (Array.from(element.querySelectorAll('button')).find(b => b.dataset.action === action) ?? heading).focus();
  }
  function onClick(event: Event) {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest('button');
    if (!control || !element.contains(control) || control.disabled) return;
    const state = controller.getState(); const action = control.dataset.action;
    if (action === 'home') { controller.dispatch({ type: 'HOME' }); onHome?.(); return; }
    const events: Record<string, RoundEvent> = {
      confirm: { type: 'CONFIRM_SELECTION', player: 1 },
      finish: { type: 'MEDIA_FINISHED', roundId: state.roundId, phase: 'reveal' },
      replay: { type: 'REPLAY' },
    };
    const gesture = gestures.find(candidate => action === `select-${candidate}`);
    if (gesture) controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture });
    else if (action && events[action]) controller.dispatch(events[action]);
  }
  element.addEventListener('click', onClick);
  const unsubscribe = controller.subscribe(render);
  controller.dispatch({ type: 'START', mode: 'computer' });
  render();
  return { element, dispose() { element.removeEventListener('click', onClick); unsubscribe(); controller.dispose(); element.replaceChildren(); } };
}
