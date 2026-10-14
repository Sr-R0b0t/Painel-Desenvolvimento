/* Índice de Prontidão Operacional (IPO) = Teoria (35) + Shadowing invertido (45) + Navegação em sistema (20)
   Regras conforme o "Novo modelo de avaliação de treinamento" (N1 e N2) */

export const TEORIA = [
  "Conhecimento dos processos e serviços da Tem Saúde",
  "Conhecimento das regras e orientações de atendimento",
  "Conhecimento das fontes oficiais de consulta, incluindo FAQ",
  "Interpretação de situações e escolha do direcionamento correto",
  "Conceitos"
]; // cada tema vale 7 pontos

export const shadowCriterios = nivel => [
  "Identificação correta da situação", "Cumprimento do fluxo", "Tomada de decisão correta",
  "Execução sem erros", "Localização das informações", "Perguntas pertinentes",
  "Identificação de situações fora do padrão",
  nivel === "N2" ? "Avaliação correta do protocolo" : "Escuta ativa",
  "Autonomia durante a execução"
]; // cada critério de 1 a 5 = 45 pontos

export const CENARIOS = {
  N1: ["Cliente com uma solicitação", "Cliente na clínica N1", "Agendamento", "Reagendamento", "Situação fora do fluxo", "Cliente insatisfeito"],
  N2: ["Cliente com uma solicitação", "Busca de clínica", "Agendamento", "Reagendamento", "Situação fora do fluxo", "Cliente insatisfeito", "Negociação com clínica"]
};

export const SISTEMA = [ // cada item vale até 4 pontos; "neg" = pontos perdidos (Erros e Retrabalho: -4)
  { k: "tempo", l: "Tempo de execução considerável" },
  { k: "erros", l: "Erros", neg: true },
  { k: "retrabalho", l: "Retrabalho", neg: true },
  { k: "navegacao", l: "Navegação correta" },
  { k: "conclusao", l: "Conclusão da atividade" }
];

/* Leitura do resultado (slide 4 do modelo) */
export const STATUS = {
  pronto: {
    nome: "Pronto", faixa: "80 a 100", cor: "#2f9e44",
    acao: "Liberação para operação",
    desc: "Demonstra conhecimento, execução, qualidade, autonomia e produtividade compatível com a etapa."
  },
  desenvolvimento: {
    nome: "Em desenvolvimento", faixa: "60 a 79", cor: "#f2a20c",
    acao: "Operação acompanhada + plano de desenvolvimento",
    desc: "Apresenta conhecimento, mas ainda possui pontos de atenção."
  },
  reforco: {
    nome: "Precisa reforçar", faixa: "0 a 59", cor: "#d62839",
    acao: "Reforço direcionado + nova avaliação",
    desc: "Apresenta lacunas que podem comprometer a execução."
  }
};
export const classificar = ipo => ipo >= 80 ? "pronto" : ipo >= 60 ? "desenvolvimento" : "reforco";

const n = x => +x || 0;
const soma = a => a.reduce((s, x) => s + n(x), 0);
export function calcular(d) {
  const q = d.sistema, t = soma(d.teoria), s = soma(d.shadowing);
  const perda = v => (v === "" || v == null || isNaN(+v)) ? 4 : 4 - +v; // vazio = 0 pontos perdidos = 4 pontos ganhos
  const sis = n(q.tempo) + n(q.navegacao) + n(q.conclusao) + perda(q.erros) + perda(q.retrabalho);
  const ipo = t + s + sis;
  return { t, s, n: sis, ipo, status: classificar(ipo) };
}

/* ---------- visual ---------- */
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const barra = (l, v, max) => `<div class="row"><span class="n" title="${esc(l)}">${esc(l)}</span><span class="bar"><i style="width:${v / max * 100}%"></i></span><span class="v">${Math.round(v * 10) / 10}/${max}</span></div>`;
const COMP = [["Teoria", "📖", "#2f9e44", 35, "t"], ["Shadowing", "🎯", "#f26a1b", 45, "s"], ["Sistema", "🖥️", "#2f6fdd", 20, "n"]];
const comp = e => COMP.map(([l, ic, c, max, f]) => `<div class="comp"><span class="ico" style="background:${c}">${ic}</span><div class="cb"><b>${l}</b><span class="bar"><i style="width:${e[f] / max * 100}%"></i></span></div><span class="v">${e[f]}/${max}</span></div>`).join("");
const faixas = () => `<div class="card"><h2>Faixas de resultado</h2><p class="muted">Seu resultado final te coloca em um nível de prontidão.</p>${Object.values(STATUS).map(s => `<div class="faixa"><span class="fx" style="background:${s.cor}">${s.faixa}</span><div><b>${s.nome}</b><div class="muted">${s.desc}</div><div class="muted">→ ${s.acao}</div></div></div>`).join("")}</div>`;
const pill = k => `<span class="pill" style="background:${STATUS[k].cor}">${STATUS[k].nome}</span>`;

// mais recente primeiro; no mesmo dia, desempata pelo horário de criação (createdAt)
const porData = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;

// o status é sempre recalculado a partir do IPO (avaliações antigas podem ter faixas antigas salvas)
const norm = g => ({ ...g, status: classificar(g.ipo) });
const kpi = (l, v, c = "") => `<div class="card"><div class="muted">${l}</div><div class="kpi" ${c ? `style="color:${c}"` : ""}>${v}</div></div>`;
const dBadge = d => d === null ? "" : `<span class="dl ${d > 0 ? "up" : d < 0 ? "dn" : "eq"}">${d > 0 ? "▲ +" : d < 0 ? "▼ " : "= "}${d}</span>`;

/* ---------- gestor + evolução ---------- */
const por = x => x.managerName ? ` · Avaliado por <b>${esc(x.managerName)}</b>` : "";
const fmtData = d => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
// "2026-10-13" -> "13/10/2026" (só na exibição; o valor salvo continua em AAAA-MM-DD)
const dataBR = d => d ? d.split("-").reverse().join("/") : "";

// pontos GANHOS por item (em Erros/Retrabalho o valor salvo é "pontos perdidos", então invertemos)
const itens = e => [
  ...TEORIA.map((l, i) => ({ g: "Teoria", l, v: n(e.teoria[i]), max: 7 })),
  ...shadowCriterios(e.level).map((l, i) => ({ g: "Shadowing", l, v: n(e.shadowing[i]), max: 5 })),
  ...SISTEMA.map(c => ({ g: "Sistema", l: c.l, neg: !!c.neg, v: c.neg ? 4 - n(e.sistema[c.k]) : n(e.sistema[c.k]), max: 4 }))
];
const comparar = (a, b) => {
  const mb = new Map(itens(b).map(i => [i.g + "|" + i.l, i]));
  return itens(a).map(i => { const o = mb.get(i.g + "|" + i.l); return { ...i, ant: o ? o.v : null, d: o ? i.v - o.v : null }; });
};
const delta = d => d === null ? '<span class="dl nw">novo</span>'
  : d > 0 ? `<span class="dl up">▲ +${d}</span>`
  : d < 0 ? `<span class="dl dn">▼ ${d}</span>`
  : '<span class="dl eq">= igual</span>';

// hist: avaliações do colaborador, da mais recente para a mais antiga
function grafico(hist) {
  const h = [...hist].reverse();
  const W = 360, H = 150, L = 30, R = 16, T = 18, B = 30;
  const lo = Math.min(50, Math.floor(Math.min(...h.map(x => x.ipo)) / 10) * 10), hi = 100;
  const X = i => h.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (h.length - 1);
  const Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  // linhas de referência nos limites das faixas: 60 e 80
  const guias = [60, 80].filter(v => v > lo).map(v =>
    `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eadfd3" stroke-dasharray="3 3"/>
     <text x="${L - 5}" y="${Y(v) + 3}" text-anchor="end" font-size="9" fill="#9aa1ac">${v}</text>`).join("");
  const linha = h.length > 1 ? `<polyline fill="none" stroke="#f26a1b" stroke-width="2.5" stroke-linejoin="round" points="${h.map((x, i) => `${X(i)},${Y(x.ipo)}`).join(" ")}"/>` : "";
  const pontos = h.map((x, i) => `<circle cx="${X(i)}" cy="${Y(x.ipo)}" r="5" fill="${STATUS[x.status].cor}" stroke="#fff" stroke-width="2"/>
    <text x="${X(i)}" y="${Y(x.ipo) - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#263449">${x.ipo}</text>
    <text x="${X(i)}" y="${H - 10}" text-anchor="middle" font-size="9" fill="#9aa1ac">${fmtData(x.date)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="evo-svg" role="img" aria-label="Evolução do IPO">${guias}${linha}${pontos}</svg>`;
}

function evolucao(hist) {
  if (hist.length < 2) return '<p class="muted">Esta é a primeira avaliação. A comparação aparece a partir da segunda.</p>';
  const a = hist[0], b = hist[1], primeira = hist[hist.length - 1];
  const cmp = comparar(a, b);
  const melhor = cmp.filter(x => x.d > 0).sort((x, y) => y.d - x.d);
  const pior = cmp.filter(x => x.d < 0).sort((x, y) => x.d - y.d);
  const iguais = cmp.filter(x => x.d === 0).length;
  const dI = a.ipo - b.ipo;
  const cor = dI > 0 ? "var(--ok)" : dI < 0 ? "var(--lo)" : "var(--mu)";
  const comps = COMP.map(([l, , , max, f]) => `<div class="evc"><span class="muted">${l}</span><b>${a[f]}/${max}</b>${delta(a[f] - b[f])}</div>`).join("");
  // Erros e Retrabalho são mostrados como "pontos perdidos" (igual ao formulário); o ▲/▼ indica melhora ou piora real
  const lista = (arr, vazio) => arr.length
    ? arr.map(x => `<div class="det"><span>${esc(x.l)} <span class="muted">· ${x.g}</span></span><b>${
        x.neg ? `perdeu ${4 - x.ant} → perdeu ${4 - x.v}` : `${x.ant} → ${x.v}/${x.max}`
      } ${delta(x.d)}</b></div>`).join("")
    : `<p class="muted">${vazio}</p>`;
  return `<div class="evo">
    <div class="evo-head">
      <div><small class="muted">IPO ${fmtData(b.date)} → ${fmtData(a.date)}</small>
        <div class="evo-big" style="color:${cor}">${dI > 0 ? "+" : ""}${dI} <small>pontos</small></div>
        <div class="muted">${b.ipo} → ${a.ipo}${a.status !== b.status ? ` · ${esc(STATUS[b.status].nome)} → <b>${esc(STATUS[a.status].nome)}</b>` : ""}</div>
        ${hist.length > 2 ? `<div class="muted">Desde a primeira avaliação: ${a.ipo - primeira.ipo >= 0 ? "+" : ""}${a.ipo - primeira.ipo} pontos</div>` : ""}</div>
      ${grafico(hist)}
    </div>
    <div class="evgrid">${comps}</div>
    <h3>▲ Pontos que melhoraram (${melhor.length})</h3>${lista(melhor, "Nenhum ponto melhorou desta vez.")}
    <h3>▼ Pontos que pioraram (${pior.length})</h3>${lista(pior, "Nenhum ponto piorou. 🎉")}
    <p class="muted">${iguais} ponto${iguais === 1 ? "" : "s"} sem mudança. Em Erros e Retrabalho, ▲ significa menos pontos perdidos.</p>
  </div>`;
}

// histórico do colaborador até a avaliação g (g primeiro), do mais recente ao mais antigo
const histAte = (g, grades) => {
  const l = grades.filter(x => x.employeeId === g.employeeId).sort(porData);
  const i = l.findIndex(x => x.id === g.id);
  return i < 0 ? [g] : l.slice(i);
};

// posição da avaliação g na sequência do colaborador:
// n = número da tentativa (1ª, 2ª...), anterior/proxima = avaliações vizinhas do mesmo colaborador
const tentativa = (g, todas) => {
  const l = todas.filter(x => x.employeeId === g.employeeId).sort(porData);
  const i = l.findIndex(x => x.id === g.id);
  return { n: l.length - i, total: l.length, anterior: l[i + 1] || null, proxima: i > 0 ? l[i - 1] : null };
};

const detalhes = e => `<details><summary>Ver detalhes da nota</summary>
  <p class="muted"><b>Teoria</b> (${e.t}/35)</p>${TEORIA.map((c, i) => `<div class="det"><span>${esc(c)}</span><b>${e.teoria[i]}/7</b></div>`).join("")}
  <p class="muted"><b>Shadowing invertido</b> (${e.s}/45)</p>${e.cenarios && e.cenarios.length ? `<p class="muted">Situações aplicadas: ${e.cenarios.map(esc).join(", ")}</p>` : ""}${shadowCriterios(e.level).map((c, i) => `<div class="det"><span>${esc(c)}</span><b>${e.shadowing[i]}/5</b></div>`).join("")}
  <p class="muted"><b>Navegação em sistema</b> (${e.n}/20)</p>${SISTEMA.map(c => `<div class="det"><span>${esc(c.l)}${c.neg ? " (pontos perdidos)" : ""}</span><b>${e.sistema[c.k]}/4</b></div>`).join("")}</details>`;


export function vistaColaborador(lista, nomeColab = "Colaborador") {
  const g = [...lista].map(norm).sort(porData);
  const cab = `<div class="page-head"><h2 class="page-title">Meu progresso</h2>
    <p class="muted">Acompanhe sua evolução e saiba qual é o seu próximo desafio.</p></div>`;
  if (!g.length) return cab + '<div class="card"><p class="muted">Nenhuma avaliação lançada ainda.</p></div>';

  const e = g[0], st = STATUS[e.status], dif = g[1] ? e.ipo - g[1].ipo : null;

  // próximo desafio: o componente com maior distância proporcional do máximo (ignora os que já estão no máximo)
  const falta = COMP.map(c => ({ l: c[0], falta: c[3] - e[c[4]], p: e[c[4]] / c[3] }))
    .filter(x => x.falta > 0)
    .sort((a, b) => a.p - b.p)[0];

  const desafio = falta
    ? `<div class="desafio"><span class="ico" style="background:#f26a1b">🎯</span><div><small>PRÓXIMO DESAFIO:</small><br><b>Aumentar sua pontuação em ${falta.l}!</b> <span class="muted">(faltam ${falta.falta} ponto${falta.falta === 1 ? "" : "s"})</span></div><span class="seta">→</span></div>`
    : `<div class="desafio"><span class="ico" style="background:#f2a20c">🏆</span><div><small>PARABÉNS!</small><br><b>Você atingiu a pontuação máxima!</b></div></div>`;

  const kpis = `<div class="grid">
    ${kpi("Pontuação atual", `${e.ipo}<small class="muted">/100</small>`, st.cor)}
    <div class="card"><div class="muted">Situação</div><div class="kpi-pill">${pill(e.status)}</div><div class="muted">${esc(st.acao)}</div></div>
    ${kpi("Desde a avaliação anterior", dif === null ? "–" : `${dif > 0 ? "▲ +" : dif < 0 ? "▼ " : "= "}${dif}`, dif === null || dif === 0 ? "" : dif > 0 ? "var(--ok)" : "var(--lo)")}
    ${kpi("Avaliações realizadas", g.length)}
  </div>`;

  return `${cab}${kpis}
  <div class="colab-grid">
    <div>
      <div class="card"><h2>Seu painel individual</h2>
        <div class="top2"><div class="user"><span class="ico" style="background:#f26a1b">👤</span><div class="cb"><b>${esc(nomeColab)}</b><span class="bar"><i style="width:${e.ipo}%"></i></span></div></div></div>
        ${comp(e)}
        ${desafio}
        <p class="muted">${esc(e.training)} · ${dataBR(e.date)} · ${e.level}${por(e)}</p>
        ${e.comment ? `<div class="fb"><small>FEEDBACK DO GESTOR</small><p>${esc(e.comment)}</p></div>` : ""}
      </div>
      ${faixas()}
    </div>
    <div>
      ${g.length > 1 ? `<div class="card"><h2>Minha evolução</h2>${evolucao(g)}</div>` : ""}
      <div class="card"><h2>Histórico de avaliações</h2>${g.map(x => `<div class="item"><div class="hd"><b>${esc(x.training)}</b>${pill(x.status)}<b style="color:${STATUS[x.status].cor}">${x.ipo} pts</b></div>
        <div class="muted">${dataBR(x.date)} · ${x.level}${por(x)}</div>
        ${x.comment ? `<div class="muted">Feedback: ${esc(x.comment)}</div>` : ""}
        ${detalhes(x)}</div>`).join("")}</div>
    </div>
  </div>`;
}

export function vistaGestor(colabs, grades, o = {}) {
  grades = grades.map(norm);
  const nome = Object.fromEntries(colabs.map(c => [c.id, c.name]));
  const ult = colabs.map(c => ({ c, g: grades.filter(x => x.employeeId === c.id).sort(porData)[0] })).filter(x => x.g).sort((a, b) => b.g.ipo - a.g.ipo);
  const cont = k => ult.filter(x => x.g.status === k).length;
  const mIpo = media(ult.map(x => x.g.ipo));
  const recentes = [...grades].sort(porData).slice(0, 5);
  return `<div class="grid">${kpi("Colaboradores avaliados", ult.length)}${kpi("Média do IPO", ult.length ? mIpo.toFixed(1) : "–", STATUS[classificar(mIpo)].cor)}${kpi("Prontos (80 a 100)", cont("pronto"))}${kpi("Avaliações lançadas", grades.length)}</div>
  <div class="two"><div>${formHTML(colabs, o.preset)}</div>
  <div><div class="card"><h2>Situação dos colaboradores (última avaliação)</h2>
    ${Object.keys(STATUS).map(k => `<div class="det"><span>${pill(k)}</span><b>${cont(k)}</b></div>`).join("")}</div>
  <div class="card"><h2>Ranking por IPO</h2>${ult.length ? ult.map(x => barra(x.c.name, x.g.ipo, 100)).join("") : '<p class="muted">Sem avaliações ainda.</p>'}</div>
  <div class="card"><h2>Média por componente</h2>${barra("Teoria", media(grades.map(x => x.t)), 35)}${barra("Shadowing invertido", media(grades.map(x => x.s)), 45)}${barra("Navegação em sistema", media(grades.map(x => x.n)), 20)}</div>${faixas()}</div></div>
  <div class="card"><h2>Últimas avaliações</h2>${recentes.length ? recentes.map(g => {
    const hist = histAte(g, grades), ant = hist[1], d = ant ? g.ipo - ant.ipo : null;
    return `<div class="item"><div class="hd">${pill(g.status)}<b>${g.ipo} pts</b>${dBadge(d)}
      · ${esc(nome[g.employeeId] || "Colaborador")} · ${esc(g.training)} · ${g.level}
      <span class="muted">${dataBR(g.date)}${por(g)}</span>${o.podeExcluir ? `<button class="del" data-id="${g.id}">excluir</button>` : ""}</div>
      ${ant ? `<details><summary>Ver evolução do colaborador</summary>${evolucao(hist)}</details>` : ""}</div>`;
  }).join("") : '<p class="muted">Nenhuma avaliação ainda.</p>'}
  ${grades.length > recentes.length ? `<button type="button" class="ghost mais" data-go="avaliacoes">Ver todas as avaliações →</button>` : ""}</div>`;
}


/* ---------- tela "Avaliações" (todas) ---------- */
const PAGINA = 15;

export function vistaAvaliacoes(colabs) {
  return `<div class="page-head head-flex"><div><h2 class="page-title">Avaliações</h2>
    <p class="muted">Todas as avaliações lançadas. Use os filtros para encontrar o que precisa.</p></div>
    <button type="button" class="ghost" id="avPdf">⬇ Exportar PDF</button></div>
  <div class="card filtros">
    <div class="fl"><label for="fBusca">Buscar</label><input id="fBusca" type="search" placeholder="Colaborador ou treinamento"></div>
    <div class="fl"><label for="fAval">Avaliador</label><select id="fAval"><option value="eu">Minhas avaliações</option><option value="todos">Todos os gestores</option></select></div>
    <div class="fl"><label for="fColab">Colaborador</label><select id="fColab"><option value="">Todos</option>${colabs.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div>
    <div class="fl"><label for="fFaixa">Resultado</label><select id="fFaixa"><option value="">Todos</option>${Object.entries(STATUS).map(([k, s]) => `<option value="${k}">${esc(s.nome)} (${s.faixa})</option>`).join("")}</select></div>
    <div class="fl"><label for="fNivel">Nível</label><select id="fNivel"><option value="">Todos</option><option>N1</option><option>N2</option></select></div>
  </div>
  <div id="avResumo"></div><div id="avLista"></div>`;
}

export function ligarAvaliacoes(root, colabs, grades, o = {}) {
  const lista = root.querySelector("#avLista"); if (!lista) return;
  let todas = grades.map(norm);
  const nome = Object.fromEntries(colabs.map(c => [c.id, c.name]));
  const f = id => root.querySelector("#" + id);
  let limite = PAGINA;

  const filtradas = () => {
    const q = f("fBusca").value.trim().toLowerCase();
    return todas.filter(g =>
      (f("fAval").value === "todos" || g.managerId === o.uid) &&
      (!f("fColab").value || g.employeeId === f("fColab").value) &&
      (!f("fFaixa").value || g.status === f("fFaixa").value) &&
      (!f("fNivel").value || g.level === f("fNivel").value) &&
      (!q || (nome[g.employeeId] || "").toLowerCase().includes(q) || (g.training || "").toLowerCase().includes(q))
    ).sort(porData);
  };

  const render = () => {
    const l = filtradas(), vis = l.slice(0, limite);
    const m = media(l.map(x => x.ipo));
    f("avResumo").innerHTML = `<div class="grid">${kpi("Avaliações", l.length)}${kpi("Média do IPO", l.length ? m.toFixed(1) : "–", l.length ? STATUS[classificar(m)].cor : "")}${kpi("Prontos", l.filter(x => x.status === "pronto").length)}${kpi("Colaboradores", new Set(l.map(x => x.employeeId)).size)}</div>`;

    lista.innerHTML = l.length
      ? `<div class="card">${vis.map(g => {
          const hist = histAte(g, todas), ant = hist[1], d = ant ? g.ipo - ant.ipo : null;
          const t = tentativa(g, todas);
          const recuperou = t.anterior && t.anterior.status !== "pronto" && g.status === "pronto";
          const abrirEvo = t.anterior && t.anterior.status !== "pronto";
          const st = x => `<b>${x.ipo} pts</b> (${esc(STATUS[x.status].nome)})`;
          const elo = t.total > 1
            ? `<div class="elo">${t.anterior ? `↳ Reavaliação · antes: ${st(t.anterior)}` : ""}${t.anterior && t.proxima ? " · " : ""}${t.proxima ? `Depois: ${st(t.proxima)}` : ""}
                · <button type="button" class="link" data-colab="${g.employeeId}">ver só deste colaborador</button></div>`
            : "";
          return `<div class="item ${t.total > 1 ? "ligado" : ""}"><div class="hd">${pill(g.status)}<b>${g.ipo} pts</b>${dBadge(d)}
            <b class="av-nome">${esc(nome[g.employeeId] || "Colaborador")}</b>
            ${t.total > 1 ? `<span class="tent">${t.n}ª avaliação</span>` : ""}
            ${recuperou ? `<span class="tent ok">✔ Recuperou</span>` : ""}
            <span class="muted">${esc(g.training)} · ${g.level} · ${dataBR(g.date)}${por(g)}</span>
            ${o.podeExcluir ? `<button class="del" data-id="${g.id}">excluir</button>` : ""}</div>
            ${elo}
            ${g.comment ? `<div class="muted">Feedback: ${esc(g.comment)}</div>` : ""}
            ${detalhes(g)}
            ${ant ? `<details ${abrirEvo ? "open" : ""}><summary>Ver evolução do colaborador</summary>${evolucao(hist)}</details>` : ""}</div>`;
        }).join("")}
        ${l.length > vis.length ? `<button type="button" class="ghost mais" id="avMais">Mostrar mais (${l.length - vis.length})</button>` : ""}</div>`
      : '<div class="card"><p class="muted">Nenhuma avaliação encontrada com esses filtros.</p></div>';

    const mais = f("avMais");
    if (mais) mais.onclick = () => { limite += PAGINA; render(); };

    // "ver só deste colaborador" aplica o filtro de colaborador
    lista.querySelectorAll("[data-colab]").forEach(b => b.onclick = () => {
      f("fColab").value = b.dataset.colab;
      limite = PAGINA;
      render();
      window.scrollTo(0, 0);
    });

    lista.querySelectorAll(".del").forEach(b => b.onclick = async () => {
      if (!confirm("Excluir esta avaliação?")) return;
      try {
        await o.onExcluir(b.dataset.id);
        todas = todas.filter(x => x.id !== b.dataset.id);
        render();
      } catch (e) { alert("Não foi possível excluir: " + (e.code || e.message)); }
    });
  };

  root.querySelectorAll(".filtros input, .filtros select").forEach(el =>
    el.addEventListener("input", () => { limite = PAGINA; render(); }));

  // exportar PDF: usa as avaliações que estão passando pelos filtros agora
  const pdf = f("avPdf");
  if (pdf) pdf.onclick = () => {
    const l = filtradas();
    if (!l.length) { alert("Não há avaliações para exportar com esses filtros."); return; }
    o.onExportar && o.onExportar(todas, l);
  };

  render();
}


/* ---------- formulário do gestor ---------- */
const campo = (cls, i, min, max, val, ph = "") => `<input type="number" class="${cls}" data-i="${i}" min="${min}" max="${max}" step="1" value="${val ?? ""}" placeholder="${ph}">`;
const shadowInputs = (nivel, v = []) => shadowCriterios(nivel).map((c, i) => `<label class="crit"><span>${esc(c)} <span>1–5</span></span>${campo("sh", i, 1, 5, v[i])}</label>`).join("");

const cenInputs = (nivel, sel = []) => `<p class="muted">Situações aplicadas (${nivel}):</p>` + CENARIOS[nivel].map(c => `<label class="chk"><input type="checkbox" class="cen" value="${esc(c)}" ${sel.includes(c) ? "checked" : ""}> ${esc(c)}</label>`).join("");

function formHTML(colabs, p = {}) {
  const q = p.sistema || {};
  return `<div class="card"><h2>Lançar avaliação (IPO)</h2><div id="formIpo">
    <label>Colaborador</label><select id="emp">${colabs.length ? colabs.map(c => `<option value="${c.id}" ${c.id === p.employeeId ? "selected" : ""}>${esc(c.name)}</option>`).join("") : '<option value="">Nenhum colaborador cadastrado</option>'}</select>
    <div class="two2"><div><label>Nível</label><select id="lvl"><option>N1</option><option ${p.level === "N2" ? "selected" : ""}>N2</option></select></div>
    <div><label>Treinamento</label><input id="tr" value="${esc(p.training || "")}" placeholder="Ex.: Admissional"></div></div>
    <h3>1. Teoria · até 35 pontos</h3><p class="muted">Nota da prova (Forms) em cada tema, de 0 a 7.</p>
    ${TEORIA.map((c, i) => `<label class="crit"><span>${esc(c)} <span>0–7</span></span>${campo("te", i, 0, 7, (p.teoria || [])[i])}</label>`).join("")}
    <h3>2. Shadowing invertido · até 45 pontos</h3><p class="muted">O avaliador pontua cada critério de 1 a 5.</p>
    <div id="cenBox">${cenInputs(p.level || "N1", p.cenarios)}</div><div id="shBox">${shadowInputs(p.level || "N1", p.shadowing)}</div>
    <h3>3. Navegação em sistema · até 20 pontos</h3><p class="muted">Cada item vale até 4. Em Erros e Retrabalho, informe os pontos perdidos (0 = nenhum erro · 4 = perda total).</p>
    ${SISTEMA.map(c => `<label class="crit"><span>${esc(c.l)} <span>${c.neg ? "perdidos 0–4 · vazio = 0" : "0–4"}</span></span>${campo("sy", c.k, 0, 4, q[c.k], c.neg ? "0" : "")}</label>`).join("")}
    <label>Feedback ao colaborador (opcional)</label><textarea id="cm" rows="2">${esc(p.comment || "")}</textarea>
    <div class="preview" id="pv"></div><button id="go">Salvar avaliação</button> <span id="msg" class="muted"></span></div></div>`;
}

const vals = (f, cls) => [...f.querySelectorAll("." + cls)].map(i => i.value === "" ? NaN : +i.value);
function ler(f) {
  const sistema = {};
  f.querySelectorAll(".sy").forEach(i => {
    const neg = SISTEMA.find(c => c.k === i.dataset.i)?.neg;
    sistema[i.dataset.i] = i.value === "" ? (neg ? 0 : NaN) : +i.value; // Erros/Retrabalho: vazio = 0
  });
  return { employeeId: f.querySelector("#emp").value, level: f.querySelector("#lvl").value, training: f.querySelector("#tr").value.trim(),
    teoria: vals(f, "te"), shadowing: vals(f, "sh"), sistema, cenarios: [...f.querySelectorAll(".cen:checked")].map(i => i.value), comment: f.querySelector("#cm").value.trim() };
}
const valido = d => d.employeeId && d.training && d.teoria.every(x => x >= 0 && x <= 7) && d.shadowing.every(x => x >= 1 && x <= 5) &&
  SISTEMA.every(c => d.sistema[c.k] >= 0 && d.sistema[c.k] <= 4);

export function ligarForm(root, onSave) {
  const f = root.querySelector("#formIpo"); if (!f) return;
  const pv = () => {
    const r = calcular(ler(f)), st = STATUS[r.status];
    f.querySelector("#pv").innerHTML = `<div class="muted">Teoria ${r.t}/35 · Shadowing ${r.s}/45 · Sistema ${r.n}/20</div>
      <div class="big" style="color:${st.cor}">${r.ipo}<small>/100</small></div>${pill(r.status)} <div class="muted">${st.acao}</div>`;
  };
  // limita o valor digitado ao intervalo do campo (min/max) e só aceita inteiros
  f.addEventListener("keydown", e => { if (e.target.type === "number" && ["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault(); });
  f.addEventListener("input", e => {
    const i = e.target;
    if (i.type !== "number" || i.value === "") return;
    let v = Math.round(+i.value); if (v > +i.max) v = +i.max; if (v < 0) v = +i.min;
    if (String(v) !== i.value) i.value = v;
  });
  f.addEventListener("change", e => { const i = e.target; if (i.type === "number" && i.value !== "" && +i.value < +i.min) i.value = i.min; });
  f.addEventListener("input", pv);
  f.querySelector("#lvl").onchange = e => { f.querySelector("#cenBox").innerHTML = cenInputs(e.target.value, [...f.querySelectorAll(".cen:checked")].map(i => i.value)); f.querySelector("#shBox").innerHTML = shadowInputs(e.target.value, vals(f, "sh").map(x => isNaN(x) ? "" : x)); pv(); };
  f.querySelector("#go").onclick = async () => {
    const d = ler(f), m = f.querySelector("#msg");
    if (!valido(d)) { m.textContent = "Preencha tudo: colaborador, treinamento e todas as notas dentro dos limites."; return; }
    try { await onSave(d); } catch (e) { m.textContent = "Não foi possível salvar: " + (e.code || e.message); }
  };
  pv();
}


/* ---------- relatório em PDF (gestor) ---------- */
// filtradas = avaliações que passaram nos filtros (define quem entra);
// o histórico de cada pessoa usa TODAS as avaliações, para a evolução ficar completa.
export function relatorioHTML(colabs, todas, filtradas) {
  const all = todas.map(norm);
  const nome = Object.fromEntries(colabs.map(c => [c.id, c.name]));
  const ids = [...new Set(filtradas.map(g => g.employeeId))]
    .sort((a, b) => (nome[a] || "").localeCompare(nome[b] || ""));
  const hists = ids.map(id => ({ id, hist: all.filter(g => g.employeeId === id).sort(porData) }));

  const deprimeira = hists.filter(x => x.hist[x.hist.length - 1].status === "pronto").length;
  const mIpo = media(hists.map(x => x.hist[0].ipo));
  const hoje = new Date().toLocaleDateString("pt-BR");

  const resumo = hists.length ? `<div class="grid">
    ${kpi("Colaboradores", hists.length)}
    ${kpi("Média do IPO (última)", mIpo.toFixed(1), STATUS[classificar(mIpo)].cor)}
    ${kpi("Prontos de primeira", `${deprimeira}/${hists.length}`)}
    ${kpi("Avaliações no período", filtradas.length)}
  </div>` : '<p class="muted">Nenhuma avaliação para exibir.</p>';

  const secoes = hists.map(({ id, hist }) => {
    const ult = hist[0], prim = hist[hist.length - 1];
    const primeiraOk = prim.status === "pronto";
    const linhas = hist.map(x => `<tr>
      <td>${dataBR(x.date)}</td><td>${esc(x.training)}</td><td>${x.level}</td><td>${esc(x.managerName || "–")}</td>
      <td>${x.t}/35</td><td>${x.s}/45</td><td>${x.n}/20</td><td><b>${x.ipo}</b></td><td>${pill(x.status)}</td></tr>`).join("");

    return `<section class="rel-colab">
      <div class="hd"><h2 style="margin:0">${esc(nome[id] || "Colaborador")}</h2>${pill(ult.status)}
        <b style="color:${STATUS[ult.status].cor}">${ult.ipo} pts</b></div>
      <p class="muted">${hist.length} avaliaç${hist.length === 1 ? "ão" : "ões"} ·
        ${primeiraOk ? "✔ Pronto na primeira avaliação" : "Não atingiu “Pronto” na primeira avaliação"}</p>
      ${comp(ult)}
      ${primeiraOk ? "" : `<h3>Evolução</h3>${evolucao(hist)}`}
      <h3>Histórico</h3>
      <table class="rel-tab"><thead><tr><th>Data</th><th>Treinamento</th><th>Nível</th><th>Avaliador</th>
        <th>Teoria</th><th>Shadow.</th><th>Sistema</th><th>IPO</th><th>Situação</th></tr></thead>
        <tbody>${linhas}</tbody></table>
      ${ult.comment ? `<div class="fb"><small>ÚLTIMO FEEDBACK</small><p>${esc(ult.comment)}</p></div>` : ""}
    </section>`;
  }).join("");

  return `<div class="rel-capa">
    <h1>Relatório de avaliações — IPO</h1>
    <p class="muted">Gerado em ${hoje}</p>${resumo}</div>${secoes}`;
}