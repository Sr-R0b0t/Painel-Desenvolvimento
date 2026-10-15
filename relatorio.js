/* Envio de relatório (gestor): resultados da turma + percepção individual + considerações finais.
   Gera o e-mail pronto (HTML rico para colar no Outlook/Gmail, texto puro e PDF). */
import { esc } from "./ipo.js";

const NEG_PADRAO = "Na atividade, foram avaliadas competências relacionadas à escuta, identificação de objeções, empatia, argumentação, criação de alternativas, concessões estratégicas, busca por benefício mútuo e fechamento de acordo.";

const slug = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const dataBR = d => d ? d.split("-").reverse().join("/") : "";
const dataCurta = d => d ? d.split("-").reverse().slice(0, 2).join("/") : "";
const num = v => (v === "" || v == null || isNaN(+v)) ? null : +v;
const fmt = v => v == null ? "–" : String(Math.round(v * 10) / 10).replace(".", ",");
const br = s => esc(s).replace(/\n/g, "<br>");
const porData = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);

// turma = campo "Turma" da avaliação; avaliações antigas (sem turma) usam o "Treinamento"
const turmaDe = g => (g.turma || g.training || "").trim();
const turmasDe = grades => [...new Set(grades.map(turmaDe).filter(Boolean))]
  .sort((a, b) => b.localeCompare(a, "pt", { numeric: true }));

/* ---------- e-mail (HTML com estilos inline + texto puro) ---------- */
function montar(turma, d, rs) {
  const min = num(d.minimo) ?? 80;
  const media = rs.length ? rs.reduce((s, r) => s + r.prova, 0) / rs.length : 0;
  const acima = rs.filter(r => r.prova >= min).length;
  const pct = rs.length ? Math.round(acima / rs.length * 100) : 0;
  const cab = r => `${r.nome} – ${fmt(r.prova)}/100${r.neg != null ? ` | Negociação: ${fmt(r.neg)}/20` : ""}`;
  const fim = d.dataFim ? `Finalizamos em ${dataCurta(d.dataFim)}` : "Finalizamos";

  const td = "border:1px solid #bbb;padding:6px 12px;";
  const tabela = `<table style="border-collapse:collapse;font-size:14px">
    <tr><th style="${td}background:#f2f2f2;text-align:left">Participante</th><th style="${td}background:#f2f2f2">Nota</th></tr>
    ${rs.map(r => `<tr><td style="${td}">${esc(r.nome)}</td><td style="${td}text-align:center">${fmt(r.prova)}/100</td></tr>`).join("")}
    <tr><td style="${td}background:#fff1e3"><b>Média da turma</b></td><td style="${td}background:#fff1e3;text-align:center"><b>${fmt(media)}/100</b></td></tr>
  </table>`;

  const p = "margin:0 0 12px";
  const html = `<div style="font-family:Calibri,Arial,sans-serif;font-size:14px;color:#222;line-height:1.5">
    <p style="${p}">${esc(d.saudacao)}</p>
    <p style="${p}">${esc(fim)} o treinamento da ${esc(turma)} e, abaixo, compartilho os principais resultados da turma, considerando as avaliações realizadas durante o período de treinamento.</p>
    <p style="${p}"><b>📊 Indicadores de desempenho</b></p>
    <p style="${p}"><b>Prova de Conhecimento</b></p>
    ${tabela}
    <p style="${p};margin-top:12px"><b>Resultado geral:</b> ${acima} de ${rs.length} participantes (${pct}%) ficaram acima do mínimo esperado de ${fmt(min)}%.</p>
    <p style="${p}"><b>🤝 Desafio de Negociação</b></p>
    <p style="${p}">${br(d.negTexto)}</p>
    <p style="${p}"><b>👥 Percepção individual</b></p>
    ${rs.map(r => `<p style="${p}"><b>${esc(cab(r))}</b><br>${br(r.perc || "—")}</p>`).join("")}
    <p style="${p}"><b>📌 Considerações finais</b></p>
    <p style="${p}">${br(d.consideracoes || "—")}</p>
    <p style="${p}">At.te.</p></div>`;

  const texto = [
    d.saudacao, "",
    `${fim} o treinamento da ${turma} e, abaixo, compartilho os principais resultados da turma, considerando as avaliações realizadas durante o período de treinamento.`, "",
    "📊 Indicadores de desempenho", "Prova de Conhecimento",
    ...rs.map(r => `${r.nome}: ${fmt(r.prova)}/100`),
    `Média da turma: ${fmt(media)}/100`,
    `Resultado geral: ${acima} de ${rs.length} participantes (${pct}%) ficaram acima do mínimo esperado de ${fmt(min)}%.`, "",
    "🤝 Desafio de Negociação", d.negTexto, "",
    "👥 Percepção individual", ...rs.flatMap(r => [cab(r), r.perc || "—", ""]),
    "📌 Considerações finais", d.consideracoes || "—", "", "At.te."
  ].join("\n");

  return { html, texto };
}

async function copiar(html, texto) {
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([texto], { type: "text/plain" })
    })]);
    return "ok";
  } catch {
    try { await navigator.clipboard.writeText(texto); return "texto"; } catch { return "erro"; }
  }
}

/* ---------- tela ---------- */
export function vistaRelatorio(grades) {
  const ts = turmasDe(grades);
  return `<div class="page-head"><h2 class="page-title">Envio de relatório</h2>
    <p class="muted">Monte o e-mail de resultados da turma: notas, percepção individual e considerações finais.</p></div>
  <div class="card"><label for="rTurma">Turma</label>
    <select id="rTurma"><option value="">Selecione…</option>${ts.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join("")}</select>
    ${ts.length ? "" : '<p class="muted">Nenhuma turma ainda. A turma vem do campo "Turma" ao lançar a avaliação (ex.: Turma 12).</p>'}</div>
  <div id="rCorpo"></div>`;
}

export function ligarRelatorio(root, colabs, grades, o = {}) {
  const sel = root.querySelector("#rTurma"), corpo = root.querySelector("#rCorpo");
  if (!sel) return;
  const nome = Object.fromEntries(colabs.map(c => [c.id, c.name]));
  let turma = "", d = null, linhas = [];

  const ultimas = t => {
    const m = new Map();
    grades.filter(g => turmaDe(g) === t).sort(porData).forEach(g => { if (!m.has(g.employeeId)) m.set(g.employeeId, g); });
    return [...m.values()];
  };

  const ler = () => {
    const v = id => corpo.querySelector("#" + id).value;
    d.saudacao = v("rSaud").trim() || "Olá!";
    d.dataFim = v("rFim");
    d.minimo = v("rMin");
    d.negTexto = v("rNeg").trim();
    d.consideracoes = v("rCons").trim();
    d.itens = {};
    corpo.querySelectorAll("[data-emp]").forEach(b => {
      d.itens[b.dataset.emp] = { prova: b.querySelector(".rp").value, neg: b.querySelector(".rn").value, perc: b.querySelector(".rt").value };
    });
  };

  const linhasCalc = () => linhas.map(l => {
    const it = d.itens[l.id] || {};
    return { nome: l.nome, prova: num(it.prova) ?? l.provaAuto, neg: num(it.neg), perc: (it.perc || "").trim() };
  }).sort((a, b) => b.prova - a.prova);

  const atualizarPrev = () => { corpo.querySelector("#rPrev").innerHTML = montar(turma, d, linhasCalc()).html; };

  const abrirTurma = async t => {
    turma = t;
    if (!t) { corpo.innerHTML = ""; return; }
    corpo.innerHTML = '<p class="muted">Carregando…</p>';
    const salvo = (o.carregar && await o.carregar(slug(t))) || {};
    const gs = ultimas(t);
    d = {
      saudacao: salvo.saudacao || "Boa tarde!",
      dataFim: salvo.dataFim || gs.map(g => g.date).sort().pop() || "",
      minimo: salvo.minimo ?? 80,
      negTexto: salvo.negTexto || NEG_PADRAO,
      consideracoes: salvo.consideracoes || "",
      itens: salvo.itens || {}
    };
    // nota da prova sugerida = Teoria (0–35) convertida para 0–100; pode ser editada
    linhas = gs.map(g => ({ id: g.employeeId, nome: nome[g.employeeId] || "Colaborador", ipo: g.ipo, comment: g.comment, provaAuto: Math.round(g.t / 35 * 1000) / 10 }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    corpo.innerHTML = `<div class="card"><h2>${esc(t)} · ${linhas.length} colaborador${linhas.length === 1 ? "" : "es"}</h2>
      <div class="two2"><div><label for="rSaud">Saudação</label><input id="rSaud" value="${esc(d.saudacao)}"></div>
      <div><label for="rFim">Término do treinamento</label><input id="rFim" type="date" value="${esc(d.dataFim)}"></div></div>
      <label for="rMin">Mínimo esperado na prova (%)</label><input id="rMin" type="number" min="0" max="100" value="${esc(d.minimo)}">
      <label for="rNeg">Texto do Desafio de Negociação</label><textarea id="rNeg" rows="3">${esc(d.negTexto)}</textarea></div>
    <div class="card"><h2>Percepção individual</h2>
      <p class="muted">Nota da prova vem da Teoria (convertida para 100). Negociação (0–20) e a percepção detalhada são preenchidas aqui.</p>
      ${linhas.map(l => {
        const it = d.itens[l.id] || {};
        return `<div class="rl-pessoa" data-emp="${l.id}"><b class="av-nome">${esc(l.nome)}</b> <span class="muted">· IPO ${l.ipo}</span>
          <div class="rl-linha"><div></div>
            <div><label>Prova (/100)</label><input class="rp" type="number" min="0" max="100" step="0.1" value="${esc(it.prova ?? l.provaAuto)}"></div>
            <div><label>Negociação (/20)</label><input class="rn" type="number" min="0" max="20" step="0.5" value="${esc(it.neg ?? "")}"></div></div>
          ${l.comment ? `<p class="muted">Feedback curto no sistema: ${esc(l.comment)}</p>` : ""}
          <label>Percepção detalhada (vai só no e-mail)</label><textarea class="rt" rows="5">${esc(it.perc ?? "")}</textarea></div>`;
      }).join("")}</div>
    <div class="card"><h2>Considerações finais da turma</h2>
      <textarea id="rCons" rows="6" placeholder="Resumo geral da turma e pontos de acompanhamento na operação">${esc(d.consideracoes)}</textarea></div>
    <div class="card"><h2>Pré-visualização do e-mail</h2><div class="rl-prev" id="rPrev"></div>
      <div class="rl-acoes"><button type="button" id="rSalvar">Salvar rascunho</button>
        <button type="button" class="ghost" id="rCopiar">Copiar e-mail</button>
        <button type="button" class="ghost" id="rMail">Abrir no e-mail</button>
        <button type="button" class="ghost" id="rPdf">⬇ Exportar PDF</button></div>
      <p id="rMsg" class="muted"></p></div>`;

    ler(); atualizarPrev();
    const msg = m => { corpo.querySelector("#rMsg").textContent = m; };
    corpo.oninput = () => { ler(); atualizarPrev(); };

    corpo.querySelector("#rSalvar").onclick = async () => {
      ler();
      try { await o.salvar(slug(turma), { ...d, turma }); msg("Rascunho salvo."); }
      catch (e) { msg("Não foi possível salvar: " + (e.code || e.message)); }
    };
    corpo.querySelector("#rCopiar").onclick = async () => {
      ler(); const { html, texto } = montar(turma, d, linhasCalc());
      const r = await copiar(html, texto);
      msg(r === "ok" ? "E-mail copiado. Cole no corpo da mensagem (Ctrl+V)." : r === "texto" ? "Copiado só como texto (sem formatação)." : "Não foi possível copiar.");
    };
    corpo.querySelector("#rMail").onclick = () => {
      ler(); const { texto } = montar(turma, d, linhasCalc());
      location.href = `mailto:?subject=${encodeURIComponent("Resultados do treinamento – " + turma)}&body=${encodeURIComponent(texto)}`;
    };
    corpo.querySelector("#rPdf").onclick = () => { ler(); o.onPdf && o.onPdf(montar(turma, d, linhasCalc()).html); };
  };

  sel.onchange = () => abrirTurma(sel.value);
}