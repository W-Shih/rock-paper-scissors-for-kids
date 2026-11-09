import './style.css';
import { createPrototypeApp } from './prototype-app';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');
const prototypeApp = createPrototypeApp();
app.replaceChildren(prototypeApp.element);
