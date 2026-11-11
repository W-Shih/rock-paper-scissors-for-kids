import { formatBilingualText as bilingual } from './bilingual-text';
import { learnRuleContent } from './learn-domain';
import { gestures, playableCharacters, type Gesture, type RoundResult } from './rps-domain';
import { createRoundController, type RoundControllerOptions, type RoundEvent } from './round-controller';
import { createTogetherMedia } from './together-media';
import { createGestureSelection } from './gesture-selection';
import { characterArtwork, constructionSceneArtwork } from './character-assets';

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
  let characterArtworkFailed = false;

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
    heading.textContent = state.phase === 'complete' ? bilingual('完成一局！', 'Round complete!')
      : bilingual('電腦對戰原型', 'Computer play spike'); element.append(heading);
    const scene = document.createElement('img');
    scene.className = 'construction-scene';
    scene.src = constructionSceneArtwork;
    scene.dataset.scene = 'construction-site';
    scene.alt = '';
    scene.setAttribute('aria-hidden', 'true');
    if (state.phase !== 'complete') element.append(scene);
    if (state.phase === 'complete') {
      button(bilingual('再玩一次', 'Play again'), 'replay');
      button(bilingual('回首頁', 'Home'), 'home');
    }
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
      const winnerPosition = result.outcome === 'win' ? 'left' : result.outcome === 'lose' ? 'right' : null;
      const figure = document.createElement('figure'); figure.setAttribute('aria-label', bilingual('中央揭曉結果', 'Central reveal'));
      const outcome = document.createElement('p');
      outcome.textContent = result.outcome === 'win' ? bilingual('你贏了！', 'You win!')
        : result.outcome === 'lose' ? bilingual('這次電腦贏了。再試一次吧！', 'The computer wins this time. Try again!')
          : bilingual('平手！', "It's a tie!");
      const characters = document.createElement('div');
      const hasRockScissorsStoryboard = result.ruleId === 'rock-beats-scissors';
      characters.className = hasRockScissorsStoryboard
        ? 'reveal-characters causal-storyboard' : 'reveal-characters';
      if (winnerPosition) characters.dataset.winnerPosition = winnerPosition;
      if (!characterArtworkFailed) {
        [result.player1Gesture, result.player2Gesture].forEach((gesture, index) => {
          const artwork = document.createElement('img');
          artwork.src = characterArtwork[gesture];
          artwork.dataset.characterKey = gesture;
          artwork.alt = '';
          artwork.setAttribute('aria-hidden', 'true');
          artwork.addEventListener('error', () => { characterArtworkFailed = true; render(); }, { once: true });
          if (hasRockScissorsStoryboard) {
            const position = document.createElement('span'); position.className = 'causal-character-position';
            position.classList.add(index === (winnerPosition === 'left' ? 0 : 1) ? 'causal-character--winner' : 'causal-character--loser');
            position.append(artwork); characters.append(position);
          } else characters.append(artwork);
        });
      }
      if (hasRockScissorsStoryboard) {
        const completeStoryboard = state.phase === 'complete' || state.presentation === 'static' || characterArtworkFailed;
        if (completeStoryboard) characters.classList.add('causal-storyboard--complete');
        characters.append(createRockScissorsStoryboard(winnerPosition, completeStoryboard));
      }
      const largeGestures = document.createElement('div'); largeGestures.className = 'result-gestures';
      for (const gesture of [result.player1Gesture, result.player2Gesture]) {
        const hand = document.createElement('span'); hand.className = 'result-gesture'; hand.textContent = playableCharacters[gesture].symbol;
        hand.setAttribute('aria-label', bilingual(playableCharacters[gesture].nameZh, playableCharacters[gesture].nameEn));
        largeGestures.append(hand);
      }
      const hands = document.createElement('p'); hands.textContent = `${bilingual('你', 'Player 1')}: ${gestureLabel(result.player1Gesture)} ↔ ${bilingual('電腦', 'Computer')}: ${gestureLabel(result.player2Gesture)}`;
      const caption = document.createElement('figcaption');
      const cause = document.createElement('p'); cause.className = 'causal-explanation';
      if (result.ruleId === 'tie') caption.textContent = bilingual('平手！一起開心揮手。', "It's a tie! Wave happily together.");
      else {
        const rule = learnRuleContent[result.ruleId];
        caption.textContent = bilingual(rule.zh, rule.en);
        cause.textContent = bilingual(rule.causeZh, rule.causeEn);
      }
      caption.classList.add('static-causal-explanation');
      const causalDiagram = createCausalDiagram(result, winnerPosition);
      const restored = state.phase === 'complete' || state.presentation === 'static' || characterArtworkFailed;
      figure.append(largeGestures, outcome, caption, createFriendlyFeedback(result, winnerPosition, restored, characterArtworkFailed), characters, hands);
      if (cause.textContent) figure.append(cause);
      figure.append(causalDiagram); element.append(figure);
      if (state.phase === 'reveal' && state.presentation === 'static') button(bilingual('看完了', 'Finished watching'), 'finish');
      if (state.phase === 'complete') {
        const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = bilingual('完成一局！', 'Round complete!'); element.append(status);
      }
    }
    if (state.phase !== 'complete') button(bilingual('回首頁', 'Home'), 'home');
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

function createFriendlyFeedback(result: RoundResult, winnerPosition: 'left' | 'right' | null, restored: boolean, artworkFailed: boolean) {
  const feedback = document.createElement('section');
  feedback.className = `friendly-feedback${restored ? ' friendly-feedback--restored' : ''}`;
  feedback.setAttribute('aria-label', bilingual('友善回饋', 'Friendly feedback'));
  const message = document.createElement('p');
  message.textContent = result.outcome === 'win' ? bilingual('你贏了！太棒了！', 'You won! Great job!')
    : result.outcome === 'lose' ? bilingual('沒關係，我們幫車車整理好。', "It's okay. Let's help our truck.")
      : bilingual('平手！再來一次！', "It's a tie! Let's play again!");
  const friends = document.createElement('div'); friends.className = 'friendly-friends';
  friends.setAttribute('role', 'img');
  friends.setAttribute('aria-label', restored
    ? bilingual('兩位朋友都恢復正常、開心的狀態', 'Both friends are okay and happy')
    : result.outcome === 'tie' ? bilingual('兩位朋友一起開心揮手', 'Both friends wave happily together')
      : bilingual('朋友送上關心，幫失利車扶正、恢復笑容', 'A friend offers care and helps the other truck straighten up and smile'));
  [result.player1Gesture, result.player2Gesture].forEach((gesture, index) => {
    const friend = document.createElement('span'); friend.className = 'friendly-friend';
    const loser = winnerPosition !== null && index === (winnerPosition === 'left' ? 1 : 0);
    if (loser) friend.classList.add('friendly-friend--recovering');
    friend.setAttribute('aria-hidden', 'true');
    if (!artworkFailed) {
      const artwork = document.createElement('img'); artwork.src = characterArtwork[gesture]; artwork.alt = '';
      artwork.addEventListener('error', () => artwork.remove(), { once: true });
      friend.append(artwork);
    }
    const smile = document.createElement('span'); smile.textContent = `${playableCharacters[gesture].symbol} 🙂`; friend.append(smile);
    if (!loser && result.outcome !== 'tie') {
      const celebration = document.createElement('span'); celebration.className = 'friendly-celebration'; celebration.textContent = '✨'; friend.append(celebration);
    }
    if (index === 1) {
      const care = document.createElement('span'); care.className = 'friendly-care'; care.setAttribute('aria-hidden', 'true');
      care.textContent = result.outcome === 'tie' ? '👋' : '💛'; friends.append(care);
    }
    friends.append(friend);
  });
  const ending = document.createElement('p');
  ending.textContent = result.outcome === 'tie' ? bilingual('一起開心揮手', 'Wave happily together')
    : bilingual('朋友幫忙扶正，大家都好好的', 'A friend helps straighten it; everyone is okay');
  feedback.append(message, friends, ending);
  return feedback;
}

function createRockScissorsStoryboard(winnerPosition: 'left' | 'right' | null, complete: boolean) {
  const story = document.createElement('div'); story.className = `rock-scissors-story${complete ? ' rock-scissors-story--complete' : ''}`;
  if (winnerPosition) story.dataset.winnerPosition = winnerPosition;
  story.setAttribute('aria-label', bilingual('推土機輕推剪切附件，剪刀彈開，朋友幫忙扶正。', 'The dozer gently nudges the shear open, then a friend helps straighten it.'));
  const steps = [
    ['✊ 靠近剪刀', 'Rock approaches scissors'],
    ['推土機輕輕一推，剪刀彈開', 'The dozer gives a gentle nudge; the shears open'],
    ['朋友幫忙扶正，大家都好好的', 'A friend helps straighten it; everyone is okay'],
  ];
  steps.forEach(([zh, en], index) => {
    const step = document.createElement('div'); step.className = `storyboard-step storyboard-step--${index + 1}`;
    const icons = document.createElement('span'); icons.className = 'storyboard-action-icons';
    icons.setAttribute('aria-hidden', 'true'); icons.textContent = index === 1 ? '✊ ➜ ✌️' : index === 2 ? '✌️ → 🙂' : '✊ ✌️';
    const caption = document.createElement('p'); caption.textContent = bilingual(zh, en);
    step.append(icons, caption); story.append(step);
  });
  const action = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  action.classList.add('storyboard-action'); action.setAttribute('viewBox', '0 0 320 88'); action.setAttribute('aria-hidden', 'true');
  action.innerHTML = '<rect class="storyboard-blade" x="16" y="28" width="84" height="36" rx="12"/><path class="storyboard-blade-edge" d="M92 37h21v25H92z"/><circle class="storyboard-hinge" cx="210" cy="45" r="8"/><path class="storyboard-shear storyboard-shear--top" d="M210 45 270 17 280 27 216 49Z"/><path class="storyboard-shear storyboard-shear--bottom" d="M210 45 270 73 280 63 216 41Z"/><path class="storyboard-nudge" d="M126 45h48m-11-10 11 10-11 10"/>';
  story.append(action);
  return story;
}

function createCausalDiagram(result: RoundResult, winnerPosition: 'left' | 'right' | null) {
  const diagram = document.createElement('div'); diagram.className = 'causal-diagram';
  diagram.setAttribute('aria-label', bilingual('簡化因果圖', 'Simplified cause diagram'));
  const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 320 88'); svg.setAttribute('role', 'img');
  const title = document.createElementNS(ns, 'title'); title.textContent = bilingual(
    `${playableCharacters[result.player1Gesture].nameZh}／${playableCharacters[result.player2Gesture].nameZh}`,
    `${playableCharacters[result.player1Gesture].nameEn} / ${playableCharacters[result.player2Gesture].nameEn}`,
  );
  const left = document.createElementNS(ns, 'text'); left.setAttribute('x', '36'); left.setAttribute('y', '52'); left.setAttribute('class', 'causal-diagram-hand'); left.textContent = playableCharacters[result.player1Gesture].symbol;
  const right = document.createElementNS(ns, 'text'); right.setAttribute('x', '284'); right.setAttribute('y', '52'); right.setAttribute('class', 'causal-diagram-hand'); right.textContent = playableCharacters[result.player2Gesture].symbol;
  if (winnerPosition) diagram.dataset.winnerPosition = winnerPosition;
  if (winnerPosition) {
    const direction = winnerPosition === 'left' ? 'M104 30h112m-14-10 14 10-14 10' : 'M216 30H104m14-10-14 10 14 10';
    const arrow = document.createElementNS(ns, 'path'); arrow.setAttribute('d', direction); arrow.setAttribute('class', 'causal-diagram-arrow'); svg.append(arrow);
  } else {
    const equals = document.createElementNS(ns, 'text'); equals.setAttribute('x', '160'); equals.setAttribute('y', '42'); equals.setAttribute('text-anchor', 'middle'); equals.setAttribute('class', 'causal-diagram-equals'); equals.textContent = '='; svg.append(equals);
  }
  const action = document.createElementNS(ns, 'g'); action.setAttribute('class', `causal-diagram-action causal-diagram-action--${result.ruleId}`);
  if (result.ruleId === 'rock-beats-scissors') action.innerHTML = '<rect x="123" y="48" width="26" height="14" rx="4"/><path d="M155 53l17-7 5 5-17 8m-5-6 17 7 5-4-17-8"/>';
  else if (result.ruleId === 'scissors-beats-paper') action.innerHTML = '<path d="M141 51h38M160 46v13m-17-8 17 7m17-7-17 7"/><path d="M126 68h28m12 0h28"/>';
  else if (result.ruleId === 'paper-beats-rock') action.innerHTML = '<path d="M132 59q28 10 56 0v10q-28 10-56 0Z"/><circle cx="160" cy="72" r="8"/>';
  else action.innerHTML = '<path d="M145 66q15-16 30 0m-26 2 2 2m18-2-2 2"/>';
  svg.append(action);
  const cause = document.createElementNS(ns, 'text'); cause.setAttribute('x', '160'); cause.setAttribute('y', '86'); cause.setAttribute('text-anchor', 'middle'); cause.setAttribute('class', 'causal-diagram-label');
  const rule = result.ruleId === 'rock-beats-scissors' ? '推開剪刀／Opens shears'
    : result.ruleId === 'scissors-beats-paper' ? '剪開布帶／Cuts cloth'
      : result.ruleId === 'paper-beats-rock' ? '布蓋住石頭／Covers rock' : '一起揮手／Wave together';
  cause.textContent = rule;
  svg.prepend(title, left, right); svg.append(cause); diagram.append(svg); return diagram;
}
