import { mount } from 'svelte';
import './app.css';
import { loadRules } from './lib/game';

const target = document.getElementById('app');

// As regras do jogo vêm do WASM: carrega antes de montar as telas.
async function start() {
  if (!target) return;
  await loadRules();
  const [{ default: App }, { app }] = await Promise.all([import('./App.svelte'), import('./lib/app.svelte')]);
  app.start();
  mount(App, { target });
}

start().catch((error) => {
  console.error(error);
  if (target) target.textContent = 'Não foi possível carregar o jogo. Recarregue a página.';
});
