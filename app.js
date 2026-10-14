import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, collection, query, where, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { calcular, vistaGestor, vistaColaborador, vistaAvaliacoes, ligarAvaliacoes, ligarForm, relatorioHTML, esc } from "./ipo.js";

const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = getFirestore(fb);

const $ = s => document.querySelector(s);
const app = $("#app");
let me = null, pendingName = "", modoCadastro = false, view = "inicio";

/* ---------- Menu lateral ---------- */
const ico = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const MENU_GESTOR = [
  { id: "inicio", label: "Início", icon: ico('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>') },
  { id: "avaliacoes", label: "Avaliações", icon: ico('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>') }
];

const MENU_COLAB = [
  { id: "progresso", label: "Meu progresso", icon: ico('<path d="M3 20h18"/><path d="M6 16l4-5 3 3 5-7"/><path d="M15 7h3v3"/>') }
];

const menuAtual = () => me && me.role === "gestor" ? MENU_GESTOR : MENU_COLAB;

function montarMenu() {
  let nav = $("#sidebar");
  if (!nav) {
    nav = document.createElement("nav");
    nav.id = "sidebar";
    nav.className = "sidebar";
    nav.setAttribute("aria-label", "Menu principal");
    document.body.prepend(nav);
  }
  nav.innerHTML = menuAtual().map(m =>
    `<button type="button" class="nav-item ${m.id === view ? "active" : ""}" data-view="${m.id}">${m.icon}<span>${m.label}</span></button>`
  ).join("");
  nav.querySelectorAll(".nav-item").forEach(b => b.onclick = () => irPara(b.dataset.view));
  document.body.classList.add("has-sidebar");
}

function removerMenu() {
  const nav = $("#sidebar");
  if (nav) nav.remove();
  document.body.classList.remove("has-sidebar");
}

function irPara(v) {
  view = v;
  montarMenu();
  window.scrollTo(0, 0);
  abrir();
}

function abrir() {
  if (me.role !== "gestor") return telaColaborador();
  return view === "avaliacoes" ? telaAvaliacoes() : telaGestor();
}

/* ---------- Exportar PDF (gestor) ---------- */
// Monta o relatório numa área só de impressão e abre a janela de impressão do navegador
// (nela, escolha "Salvar como PDF"). O CSS @media print esconde o resto da página.
function exportarPDF(colabs, todas, filtradas) {
  let area = $("#printArea");
  if (!area) {
    area = document.createElement("div");
    area.id = "printArea";
    document.body.append(area);
  }
  area.innerHTML = relatorioHTML(colabs, todas, filtradas);
  document.body.classList.add("printing");

  const fim = () => {
    document.body.classList.remove("printing");
    area.innerHTML = "";
    window.removeEventListener("afterprint", fim);
  };
  window.addEventListener("afterprint", fim);

  window.print();
}

/* ---------- Login / Cadastro ---------- */
function telaLogin(erro = "") {

  $("#role").hidden = true;
  $("#logout").hidden = true;
  if ($("#who")) $("#who").hidden = true;   // esconde o nome do usuário ao sair
  removerMenu();
  view = "inicio";

  // Sai do layout do painel (corrige a tela quebrada após o logout)
  document.body.classList.remove("dashboard-mode");

  document.body.classList.add("login-mode");
  document.querySelector("main").classList.add("login-main");

  app.innerHTML = `
    <section class="login-page">

      <!-- Decorações -->
      <div class="login-decoration top-left"></div>
      <div class="login-decoration top-right"></div>
      <div class="login-decoration bottom-left"></div>
      <div class="login-decoration bottom-right"></div>

      <div class="login-container">

        <!-- =================================================
             LADO ESQUERDO
             ================================================= -->

        <div class="login-brand">

          <h1>
            Painel de
            <strong>Desenvolvimento</strong>
          </h1>

          <div class="login-brand-line"></div>

          <p>
            Conhecimento que
            <strong>transforma resultados.</strong>
          </p>

          <!--
            Coloque sua imagem de ilustração aqui:

            assets/login-illustration.png
          -->

          <div class="login-illustration">

            <img
              src="./assets/imgs/ilustracao-login.png"
              alt="Pessoa estudando"
              onerror="this.style.display='none'"
            >

          </div>

        </div>


        <!-- =================================================
             CARD DE LOGIN
             ================================================= -->

        <div class="login-card">

          <div class="login-icon">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="8" r="3.5"></circle>
              <path d="M5 20c.8-3.3 3.1-5 7-5s6.2 1.7 7 5"></path>
            </svg>

          </div>


          <h2 class="login-title">
            ${modoCadastro ? "Criar conta" : "Bem-vindo(a)!"}
          </h2>

          <p class="login-subtitle">
            ${modoCadastro
              ? "Cadastre seu acesso para continuar."
              : "Acesse sua conta para continuar."
            }
          </p>


          <!-- Nome somente no cadastro -->

          ${modoCadastro ? `

            <div class="login-field">

              <label for="nome">
                Nome completo
              </label>

              <div class="input-wrapper">

                <input
                  id="nome"
                  class="login-input"
                  type="text"
                  placeholder="Digite seu nome"
                  autocomplete="name"
                >

              </div>

            </div>

          ` : ""}


          <!-- E-mail -->

          <div class="login-field">

            <label for="email">
              E-mail
            </label>

            <div class="input-wrapper">

              <span class="input-icon">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                  <path d="m3 7 9 6 9-6"></path>
                </svg>

              </span>

              <input
                id="email"
                class="login-input"
                type="email"
                placeholder="Digite seu e-mail"
                autocomplete="email"
              >

            </div>

          </div>


          <!-- Senha -->

          <div class="login-field">

            <label for="senha">
              Senha
            </label>

            <div class="input-wrapper">

              <span class="input-icon">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="5" y="10" width="14" height="10" rx="2"></rect>
                  <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
                </svg>

              </span>


              <input
                id="senha"
                class="login-input"
                type="password"
                placeholder="Digite sua senha"
                autocomplete="${modoCadastro ? "new-password" : "current-password"}"
              >


              <button
                type="button"
                class="password-toggle"
                id="toggleSenha"
                aria-label="Mostrar senha"
              >

                <svg
                  id="eyeIcon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
                  <circle cx="12" cy="12" r="2.5"></circle>
                </svg>

              </button>

            </div>

          </div>


          <!-- Erro -->

          <div
            id="erro"
            class="login-error"
          >
            ${esc(erro)}
          </div>


          <!-- Entrar -->

          <button
            id="ok"
            class="login-submit"
          >

            <span class="login-submit-content">

              <span>
                ${modoCadastro ? "Cadastrar" : "Entrar"}
              </span>

              <span class="login-submit-arrow">
                →
              </span>

            </span>

          </button>


          <!-- Divisor -->

          <div class="login-divider">
            <span>ou</span>
          </div>


          <!-- Criar conta -->

          <button
            type="button"
            class="login-create"
            id="troca"
          >
            ${modoCadastro
              ? "Já tenho uma conta"
              : "Criar conta de colaborador"
            }
          </button>

        </div>

      </div>

    </section>
  `;


  /* =======================================================
     TROCAR LOGIN / CADASTRO
     ======================================================= */

  $("#troca").onclick = () => {

    modoCadastro = !modoCadastro;

    telaLogin();

  };


  /* =======================================================
     MOSTRAR / OCULTAR SENHA
     ======================================================= */

  $("#toggleSenha").onclick = () => {

    const senha = $("#senha");
    const icon = $("#eyeIcon");

    if (senha.type === "password") {

      senha.type = "text";

      icon.innerHTML = `
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-3.2 4.2"></path>
        <path d="M6.3 6.3C3.9 8 2.5 12 2.5 12s3.5 7 9.5 7c1.1 0 2.1-.2 3-.6"></path>
      `;

    } else {

      senha.type = "password";

      icon.innerHTML = `
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"></path>
        <circle cx="12" cy="12" r="2.5"></circle>
      `;

    }

  };


  /* =======================================================
     LOGIN / CADASTRO
     ======================================================= */

  $("#ok").onclick = async () => {

    const email = $("#email").value.trim();
    const senha = $("#senha").value;

    try {

      if (modoCadastro) {

        pendingName = $("#nome").value.trim();

        if (!pendingName) {

          $("#erro").textContent =
            "Informe seu nome.";

          return;
        }

        if (!email) {

          $("#erro").textContent =
            "Informe seu e-mail.";

          return;
        }

        if (!senha) {

          $("#erro").textContent =
            "Informe sua senha.";

          return;
        }

        await createUserWithEmailAndPassword(
          auth,
          email,
          senha
        );

      } else {

        if (!email || !senha) {

          $("#erro").textContent =
            "Informe seu e-mail e sua senha.";

          return;
        }

        await signInWithEmailAndPassword(
          auth,
          email,
          senha
        );

      }

    } catch (e) {

      console.error(e);

      $("#erro").textContent =
        "Não foi possível entrar: " + e.code;

    }

  };


  /* =======================================================
     ENTER PARA ENVIAR
     ======================================================= */

  $("#email").addEventListener("keydown", e => {

    if (e.key === "Enter") {
      $("#ok").click();
    }

  });

  $("#senha").addEventListener("keydown", e => {

    if (e.key === "Enter") {
      $("#ok").click();
    }

  });

}

/* ---------- Colaborador ---------- */
async function telaColaborador() {
  const snap = await getDocs(query(collection(db, "grades"), where("employeeId", "==", me.uid)));
  app.innerHTML = vistaColaborador(snap.docs.map(d => ({ id: d.id, ...d.data() })), me.name);
}

/* ---------- Gestor: dados ---------- */
async function carregarGestor() {
  const [us, gs] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "colaborador"))),
    getDocs(collection(db, "grades"))
  ]);
  const colabs = us.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name));
  const grades = gs.docs.map(d => ({ id: d.id, ...d.data() }));
  return { colabs, grades };
}

/* ---------- Gestor: Início ---------- */
async function telaGestor() {
  const { colabs, grades } = await carregarGestor();
  app.innerHTML = vistaGestor(colabs, grades, { podeExcluir: true });

  ligarForm(app, async d => {
    await addDoc(collection(db, "grades"), {
      ...d, ...calcular(d),
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),   // desempata avaliações lançadas no mesmo dia
      managerId: me.uid,
      managerName: me.name
    });
    telaGestor();
  });

  app.querySelectorAll(".del").forEach(b => b.onclick = async () => {
    if (confirm("Excluir esta avaliação?")) { await deleteDoc(doc(db, "grades", b.dataset.id)); telaGestor(); }
  });

  // botões que levam a outra tela do menu (ex.: "Ver todas as avaliações")
  app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => irPara(b.dataset.go));
}

/* ---------- Gestor: Avaliações (todas) ---------- */
async function telaAvaliacoes() {
  const { colabs, grades } = await carregarGestor();
  app.innerHTML = vistaAvaliacoes(colabs);
  ligarAvaliacoes(app, colabs, grades, {
    uid: me.uid,
    podeExcluir: true,
    onExcluir: id => deleteDoc(doc(db, "grades", id)),
    onExportar: (todas, lista) => exportarPDF(colabs, todas, lista)
  });
}

/* ---------- Estado de login ---------- */
onAuthStateChanged(auth, async user => {

  if (!user) {

    me = null;

    return telaLogin();
  }

  // ============================================
  // SAI DO LAYOUT DE LOGIN
  // ============================================

  document.body.classList.remove("login-mode");

  document.querySelector("main").classList.remove("login-main");

  // ============================================
  // ATIVA O LAYOUT DO SISTEMA
  // ============================================

  document.body.classList.add("dashboard-mode");

  const ref = doc(db, "users", user.uid);
  let snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name: pendingName || user.email, email: user.email, role: "colaborador" });
    snap = await getDoc(ref);
  }
  me = { uid: user.uid, ...snap.data() };

  // ============================================
  // NOME DO USUÁRIO LOGADO NO CABEÇALHO
  // ============================================

  let who = $("#who");
  if (!who) {
    who = document.createElement("span");
    who.id = "who";
    who.className = "who";
    $("#role").before(who);
  }
  who.textContent = me.name;
  who.title = me.email || "";
  who.hidden = false;

  $("#role").hidden = false; $("#role").textContent = me.role === "gestor" ? "Gestor" : "Colaborador";
  $("#logout").hidden = false;

  // menu lateral (gestor: Início/Avaliações · colaborador: Meu progresso)
  view = me.role === "gestor" ? "inicio" : "progresso";
  montarMenu();
  abrir();
});
$("#logout").onclick = () => signOut(auth);