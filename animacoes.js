/* Animações em JS: números dos KPIs contam de 0 até o valor.
   O resto (entrada dos cards, barras, gráfico) é CSS puro em animacoes.css. */

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function contar(el) {
  const txt = el.firstChild;
  if (!txt || txt.nodeType !== 3) return;                       // só valores que começam com texto
  const m = txt.nodeValue.trim().match(/^\d+(?:\.(\d+))?$/);   // ex.: "2", "87", "100.0"
  if (!m) return;                                               // ignora "–", "▲ +5", "2/3"...

  const fim = parseFloat(txt.nodeValue), dec = m[1] ? m[1].length : 0, dur = 900, t0 = performance.now();
  txt.nodeValue = (0).toFixed(dec);

  const passo = t => {
    const p = Math.min(1, (t - t0) / dur), suave = 1 - Math.pow(1 - p, 3);   // desacelera no final
    txt.nodeValue = (fim * suave).toFixed(dec);
    if (p < 1) requestAnimationFrame(passo); else txt.nodeValue = fim.toFixed(dec);
  };
  requestAnimationFrame(passo);
}

// roda quando o conteúdo principal troca (nova tela); filtros e digitação não disparam
export function observarAnimacoes(app) {
  if (reduzido()) return;
  new MutationObserver(() => app.querySelectorAll(".kpi").forEach(contar)).observe(app, { childList: true });
}