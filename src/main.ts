import './style.css';
import { createLearnApp } from './learn-ui';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');
const learnApp = createLearnApp();
app.replaceChildren(learnApp.element);
window.addEventListener('pagehide', (event) => { if (!event.persisted) learnApp.dispose(); });
