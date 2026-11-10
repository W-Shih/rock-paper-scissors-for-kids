import { formatBilingualText as bilingual } from './bilingual-text';
import { hasMixedQuestions, learnRuleContent } from './learn-domain';
import { createPlaceholder } from './placeholder';
import { masteryRuleIds } from './rps-domain';
import { createRoundController, type RoundControllerOptions, type RoundEvent } from './round-controller';
import { gestures, playableCharacters, type Gesture } from './rps-domain';
import { createGestureCard } from './gesture-card';

function gestureLabel(gesture: Gesture): string {
  const character = playableCharacters[gesture];
  return `${character.symbol} ${bilingual(character.nameZh, character.nameEn)}`;
}

export function createLearnApp(options: Partial<RoundControllerOptions> = {}, onTogether?: () => void, onHome?: () => void) {
  const controller = createRoundController({
    clock: { schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: (handle) => window.clearTimeout(handle as number) },
    // There are no animation assets in this spike. Exercise the same static
    // demonstration boundary used when production media cannot be played.
    media: { play(effect, notify) { notify({ type: 'MEDIA_FAILED', roundId: effect.roundId, phase: effect.phase }); } },
    ...options,
  });
  const element = createPlaceholder(bilingual('教學流程原型：使用簡化圖文示範。', 'Learn flow spike: simplified visual demonstrations.'));
  const screen = document.createElement('section');
  screen.setAttribute('aria-label', bilingual('教學', 'Learn'));
  element.append(screen);

  function paragraph(text: string, live = false) {
    const p = document.createElement('p');
    p.textContent = text;
    if (live) p.setAttribute('role', 'status');
    screen.append(p);
    return p;
  }
  function button(text: string, action: string, disabled = false) {
    const control = document.createElement('button');
    control.type = 'button';
    control.textContent = text;
    control.dataset.action = action;
    control.disabled = disabled;
    screen.append(control);
    return control;
  }
  function render() {
    const shouldRestoreFocus = element.contains(document.activeElement);
    const focusedAction = shouldRestoreFocus && document.activeElement instanceof HTMLElement
      ? document.activeElement.dataset.action : undefined;
    screen.replaceChildren();
    const state = controller.getState();
    const progress = controller.getProgress();
    const title = document.createElement('h2');
    title.tabIndex = -1;
    title.textContent = bilingual('學習', 'Learn');
    screen.append(title);
    if (state.phase === 'home') {
      button(bilingual('學習', 'Learn'), 'start');
      if (onTogether) button(bilingual('親子原型', 'Together spike'), 'together');
      if (onHome) button(bilingual('回首頁', 'Home'), 'home');
    } else {
      const opponent = state.opponentGesture!;
      paragraph(bilingual(`什麼能贏${playableCharacters[opponent].nameZh}？`, `What beats ${playableCharacters[opponent].nameEn.toLowerCase()}?`));
      paragraph(`${bilingual('對手手勢', 'Opponent gesture')}: ${gestureLabel(opponent)}`);
      if (state.phase === 'choosing-p1') {
        paragraph(hasMixedQuestions(progress.masteryCountsByRuleId) ? bilingual('混合題', 'Mixed questions') : bilingual('依序練習三條規則', 'Practise the three rules in order'));
        if (state.learnAttempts > 0) {
          paragraph(state.learnAttempts === 1
            ? bilingual('再看看三種手勢，試試別的選擇。', 'Look at the three gestures and try another choice.')
            : bilingual('慢慢想，哪個手勢能贏對手呢？', 'Take your time. Which gesture can beat the opponent?'), true);
        }
        const choices = document.createElement('div');
        choices.className = 'gesture-selection';
        choices.setAttribute('aria-label', bilingual('選擇手勢', 'Choose a gesture'));
        for (const gesture of gestures) choices.append(createGestureCard(gesture, state.player1Selection === gesture));
        const confirm = document.createElement('button');
        confirm.type = 'button'; confirm.textContent = bilingual('確認', 'Confirm');
        confirm.dataset.action = 'confirm'; confirm.disabled = !state.player1Selection;
        choices.append(confirm);
        const showDemo = document.createElement('button');
        showDemo.type = 'button'; showDemo.textContent = bilingual('直接看示範', 'Show demonstration');
        showDemo.dataset.action = 'demo'; choices.append(showDemo);
        screen.append(choices);
      } else if (state.phase === 'reveal' || state.phase === 'complete') {
        const result = state.result!;
        if (result.ruleId !== 'tie') {
          const content = learnRuleContent[result.ruleId];
          const demonstration = document.createElement('figure');
          demonstration.setAttribute('aria-label', bilingual('正確規則示範', 'Correct rule demonstration'));
          const hands = document.createElement('p');
          hands.textContent = `${gestureLabel(result.player1Gesture)} → ${gestureLabel(result.player2Gesture)}`;
          const caption = document.createElement('figcaption');
          caption.textContent = `${bilingual(content.zh, content.en)} ${bilingual(content.causeZh, content.causeEn)}`;
          demonstration.append(hands, caption);
          screen.append(demonstration);
        }
        paragraph(bilingual('一起學習，做得好！', 'Well done learning together!'), true);
        if (state.phase === 'reveal') button(bilingual('示範看完了', 'Demonstration finished'), 'acknowledge');
        else {
          paragraph(bilingual('本題完成', 'Question complete'), true);
          button(bilingual('下一題', 'Next question'), 'next');
        }
      } else {
        paragraph(bilingual('準備觀看正確示範。', 'Getting ready for the correct demonstration.'), true);
      }
      if (state.learnDemonstration === null || state.phase === 'complete') button(bilingual('回首頁', 'Home'), 'home');
    }
    const progressList = document.createElement('ul');
    progressList.setAttribute('aria-label', bilingual('學習進度', 'Learning progress'));
    for (const [index, ruleId] of masteryRuleIds.entries()) {
      const item = document.createElement('li');
      // Neutral labels keep the progress display from revealing the answer to
      // the current question before the child has confirmed it.
      item.textContent = `${bilingual(`規則 ${index + 1}`, `Rule ${index + 1}`)} ${progress.masteryCountsByRuleId[ruleId]}/3`;
      progressList.append(item);
    }
    screen.append(progressList);
    paragraph(bilingual(`已解鎖收藏：${progress.unlockedCollectibleIds.length}/3`, `Collectibles unlocked: ${progress.unlockedCollectibleIds.length}/3`));
    const warning = controller.getStorageWarning();
    if (warning) paragraph(bilingual(warning.zh, warning.en), true);
    if (shouldRestoreFocus) {
      const replacement = Array.from(screen.querySelectorAll('button')).find((control) => control.dataset.action === focusedAction);
      (replacement ?? title).focus();
    }
  }

  function onClick(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const control = target.closest('button');
    if (!control || !screen.contains(control) || control.disabled) return;
    const action = control.dataset.action;
    if (action === 'together') { onTogether?.(); return; }
    if (action === 'home' && onHome) { onHome(); return; }
    const events: Record<string, RoundEvent> = {
      start: { type: 'START', mode: 'learn' }, confirm: { type: 'CONFIRM_SELECTION', player: 1 },
      demo: { type: 'SHOW_DEMONSTRATION' }, next: { type: 'REPLAY' }, home: { type: 'HOME' },
      acknowledge: { type: 'MEDIA_FINISHED', roundId: controller.getState().roundId, phase: 'reveal' },
    };
    if (action?.startsWith('select-')) {
      const gesture = gestures.find((value) => action === `select-${value}`);
      if (gesture) controller.dispatch({ type: 'SELECT_GESTURE', player: 1, gesture });
    } else if (action && events[action]) controller.dispatch(events[action]);
  }
  screen.addEventListener('click', onClick);
  const unsubscribe = controller.subscribe(render);
  render();
  return { element, dispose() { screen.removeEventListener('click', onClick); unsubscribe(); controller.dispose(); } };
}
