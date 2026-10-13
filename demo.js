import { calcular, vistaGestor, vistaColaborador, ligarForm } from "./ipo.js";

const colabs = [
  { id: "ana", name: "Ana Souza" }, { id: "bruno", name: "Bruno Lima" }, { id: "carla", name: "Carla Mendes" },
  { id: "diego", name: "Diego Rocha" }, { id: "elisa", name: "Elisa Prado" }, { id: "fabio", name: "Fábio Alves (novo)" }
];

// gestor logado na demo (usado ao salvar uma nova avaliação)
const GESTOR_DEMO = "Marina Costa";

let seq = 0;
const mk = (employeeId, level, training, date, teoria, shadowing, [tempo, erros, retrabalho, navegacao, conclusao], comment = "", cenarios = [], managerName = GESTOR_DEMO) => {
  const d = {
    id: "g" + ++seq, employeeId, level, training, date, teoria, shadowing,
    sistema: { tempo, erros, retrabalho, navegacao, conclusao },
    comment, cenarios, managerName, managerId: managerName.toLowerCase().replace(/\s+/g, "-")
  };
  return { ...d, ...calcular(d) };
};

const grades = [
  mk("ana", "N1", "Admissional", "2026-08-12", [5, 6, 5, 5, 6], [3, 3, 4, 3, 3, 3, 3, 4, 3], [3, 2, 2, 3, 3], "Boa base teórica; precisa ganhar agilidade no sistema.", [], "Marina Costa"),
  mk("ana", "N1", "Reciclagem de atendimento", "2026-09-20", [6, 6, 6, 7, 6], [4, 4, 4, 4, 4, 4, 4, 5, 4], [4, 1, 1, 4, 4], "Evolução clara em fluxo e autonomia. Parabéns!", ["Cliente com uma solicitação", "Agendamento", "Cliente insatisfeito"], "Rafael Nunes"),

  mk("bruno", "N1", "Admissional", "2026-09-02", [4, 4, 3, 4, 4], [3, 2, 3, 3, 2, 3, 2, 3, 3], [2, 3, 3, 2, 3], "Reforçar regras de atendimento e localização de informações.", [], "Marina Costa"),
  // exemplo de avaliação com melhoras E pioras
  mk("bruno", "N1", "Reciclagem de atendimento", "2026-10-05", [5, 5, 3, 5, 4], [3, 3, 3, 4, 2, 3, 3, 3, 4], [3, 2, 2, 2, 3], "Melhorou em teoria, mas caiu em navegação no sistema. Vamos reforçar.", ["Cliente com uma solicitação", "Reagendamento"], "Rafael Nunes"),

  mk("carla", "N2", "Admissional", "2026-09-10", [7, 6, 6, 6, 7], [5, 4, 5, 4, 4, 4, 5, 4, 5], [4, 0, 1, 4, 4], "Execução muito segura.", ["Busca de clínica", "Negociação com clínica", "Situação fora do fluxo"], "Rafael Nunes"),
  mk("diego", "N2", "Admissional", "2026-09-15", [5, 5, 6, 5, 5], [4, 3, 4, 4, 3, 4, 3, 4, 4], [3, 2, 1, 3, 4], "", [], "Marina Costa"),
  mk("elisa", "N1", "Admissional", "2026-09-28", [6, 6, 5, 6, 6], [4, 4, 4, 3, 4, 4, 3, 4, 4], [4, 1, 2, 3, 4], "", [], "Rafael Nunes")
];

// exemplo já preenchido: avaliação do Fábio, ainda não salva
const preset = {
  employeeId: "fabio", level: "N1", training: "Admissional",
  teoria: [6, 7, 5, 6, 7], shadowing: [4, 4, 5, 4, 3, 4, 4, 5, 4],
  sistema: { tempo: 4, erros: 1, retrabalho: 0, navegacao: 4, conclusao: 4 },
  comment: "Ótimo desempenho no treinamento.",
  cenarios: ["Cliente com uma solicitação", "Agendamento", "Reagendamento"]
};

const app = document.querySelector("#app");
let aba = "g", usado = false;

function render() {
  app.innerHTML = `<div class="note">Exemplo com dados fictícios. Alterne entre as duas visões e experimente lançar uma avaliação. Veja a evolução da Ana (só melhoras) e do Bruno (melhoras e pioras).</div>
    <div class="tabs">
      <button data-a="g" class="${aba === "g" ? "" : "off"}">Visão do gestor</button>
      <button data-a="c" class="${aba === "c" ? "" : "off"}">Visão do colaborador (Ana Souza)</button>
      <button data-a="b" class="${aba === "b" ? "" : "off"}">Visão do colaborador (Bruno Lima)</button>
    </div>` +
    (aba === "g"
      ? vistaGestor(colabs, grades, { preset: usado ? null : preset })
      : aba === "c"
        ? vistaColaborador(grades.filter(g => g.employeeId === "ana"), "Ana Souza")
        : vistaColaborador(grades.filter(g => g.employeeId === "bruno"), "Bruno Lima"));

  app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { aba = b.dataset.a; render(); });

  if (aba === "g") ligarForm(app, d => {
    grades.push({
      id: "g" + ++seq, ...d, ...calcular(d),
      date: new Date().toISOString().slice(0, 10),
      managerName: GESTOR_DEMO, managerId: "marina-costa"
    });
    usado = true; render(); window.scrollTo(0, 0);
  });
}
render();