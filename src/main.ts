import './style.css';
import { createPlaceholder } from './placeholder';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app mount point');
app.replaceChildren(createPlaceholder());
