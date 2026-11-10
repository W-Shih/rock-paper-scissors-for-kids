// @vitest-environment jsdom
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';
import { afterEach, expect, test, vi } from 'vitest';
import { createComputerApp } from './computer-ui';
import type { RoundControllerOptions, RoundEvent } from './round-controller';

const apps: ReturnType<typeof createComputerApp>[] = [];
afterEach(() => { apps.forEach(app => app.dispose()); apps.length = 0; document.body.replaceChildren(); vi.useRealTimers(); });
function mount(options: Partial<RoundControllerOptions> = {}) {
  const app = createComputerApp(options); apps.push(app); document.body.append(app.element);
  const click = (name: string | RegExp) => fireEvent.click(getByRole(app.element, 'button', { name }));
  return { app, screen: app.element, click };
}

test('Computer shares gesture cards and keeps the opponent neutral until reveal', async () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const { screen, click } = mount({ random: () => 0.4, media: { play(_effect, notify) { notifications.push(notify); } } });
  expect(screen.getAttribute('aria-label')).toBe('電腦對戰原型 / Computer play spike');
  click(/^✊/); click('確認 / Confirm');
  expect(screen.textContent).toContain('3、2、1');
  expect(screen.innerHTML).not.toMatch(/✌️|剪刀|Scissors|Snip|rock|paper|Dozer|Crane|aria-label=".*(?:scissors|paper)/i);
  notifications[0]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(screen.innerHTML).not.toMatch(/✌️|剪刀|Scissors|Snip|rock|paper|Dozer|Crane/);
  expect(screen.textContent).toContain('Both players meet in the centre!');
  notifications[1]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'approach' });
  expect(getByRole(screen, 'figure').textContent).toContain('Player 1: ✊ 石頭 / Rock');
  expect(getByRole(screen, 'figure').textContent).toContain('Computer: ✌️ 剪刀 / Scissors');
  expect(getByRole(screen, 'figure').textContent).toContain('Rock beats scissors!');
  expect(queryByRole(screen, 'button', { name: '再玩一次 / Play again' })).toBeNull();
  notifications[2]!({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'reveal' });
  expect(screen.textContent).toContain('Round complete!');
  expect(queryByRole(screen, 'button', { name: '再玩一次 / Play again' })).toBeTruthy();
});

test('Computer draws only once on confirmation and exposes no opponent card while choosing', () => {
  const random = vi.fn(() => 0.8);
  const { screen, click } = mount({ random });
  click(/^✋/);
  expect(random).not.toHaveBeenCalled();
  expect(queryByRole(screen, 'figure')).toBeNull();
  click('確認 / Confirm');
  expect(random).toHaveBeenCalledOnce();
});

test('Home and dispose discard a locked choice mid-countdown without restoring a secret', () => {
  const notifications: Array<(event: RoundEvent) => void> = [];
  const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.8);
  const { app, screen, click } = mount({ random, media: { play(_effect, notify) { notifications.push(notify); } } });
  click(/^✊/); click('確認 / Confirm');
  const staleCountdown = notifications[0]!;
  expect(random).toHaveBeenCalledOnce();
  click('回首頁 / Home');
  staleCountdown({ type: 'MEDIA_FINISHED', roundId: 1, phase: 'countdown' });
  expect(queryByRole(screen, 'figure')).toBeNull();

  app.dispose();
  expect(screen.innerHTML).toBe('');
});
