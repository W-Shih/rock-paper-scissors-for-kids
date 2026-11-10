import { formatBilingualText as bilingual } from './bilingual-text';
import type { RoundMedia } from './round-controller';

// Only anonymous, identical placeholders travel before the central reveal.
// Real character/gesture content belongs to the renderer's reveal phase.
function neutralVehicles(screen: HTMLElement) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 480 140');
  svg.setAttribute('aria-label', bilingual('兩位選手前往中央', 'Both players approach the centre'));
  svg.setAttribute('role', 'img'); svg.classList.add('together-track');
  const vehicles = [30, 370].map(x => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('transform', `translate(${x},40)`);
    const body = document.createElementNS(ns, 'rect');
    body.setAttribute('width', '80'); body.setAttribute('height', '45'); body.setAttribute('rx', '12'); body.setAttribute('fill', '#9b8d7b');
    g.append(body);
    for (const cx of [18, 62]) {
      const wheel = document.createElementNS(ns, 'circle');
      wheel.setAttribute('cx', String(cx)); wheel.setAttribute('cy', '48'); wheel.setAttribute('r', '12'); wheel.setAttribute('fill', '#51483d'); g.append(wheel);
    }
    svg.append(g); return g;
  });
  screen.append(svg); return vehicles;
}

export function createTogetherMedia(screen: HTMLElement): RoundMedia {
  return { play(effect, notify) {
    let active = true;
    const timers: number[] = [];
    const animations: Animation[] = [];
    const settle = (type: 'MEDIA_FINISHED' | 'MEDIA_FAILED') => {
      if (!active) return;
      active = false;
      notify({ type, roundId: effect.roundId, phase: effect.phase });
    };
    const later = (callback: () => void, delay: number) => timers.push(window.setTimeout(() => { if (active) callback(); }, delay));
    if (effect.phase === 'countdown') {
      const beat = document.createElement('p'); beat.className = 'countdown-beat countdown-beat--pop'; beat.setAttribute('aria-hidden', 'true'); beat.textContent = '3'; screen.append(beat);
      const showBeat = (text: string) => {
        beat.textContent = text;
        beat.classList.toggle('countdown-beat--pop');
      };
      later(() => { showBeat('2'); }, 1000);
      later(() => { showBeat('1'); }, 2000);
      later(() => { showBeat(bilingual('準備，開始！', 'Ready, Set, Go!')); }, 2500);
      later(() => settle('MEDIA_FINISHED'), 3000);
    } else if (effect.phase === 'approach') {
      try {
        const vehicles = neutralVehicles(screen);
        let completed = 0;
        for (const [index, vehicle] of vehicles.entries()) {
          const animation = vehicle.animate([
            { transform: `translate(${index === 0 ? 30 : 370}px, 40px)` },
            { transform: `translate(${index === 0 ? 155 : 245}px, 40px)` },
          ], { duration: 1000, fill: 'forwards', easing: 'ease-in-out' });
          animations.push(animation);
          // Attach immediately: a later animate() call may throw, and cancelling
          // an already-started animation rejects its finished promise.
          void animation.finished.then(() => {
            if (++completed === vehicles.length) settle('MEDIA_FINISHED');
          }, () => settle('MEDIA_FAILED'));
        }
      } catch { settle('MEDIA_FAILED'); }
    } else if (effect.phase === 'reveal') later(() => settle('MEDIA_FINISHED'), 1800);
    // Handoff is an explicit P2 ready acknowledgement, never an auto timer.
    return () => {
      active = false;
      timers.forEach(timer => window.clearTimeout(timer));
      animations.forEach(animation => { try { animation.cancel(); } catch { /* Best-effort browser cleanup. */ } });
    };
  } };
}
