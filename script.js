// Config de despliegue en GitHub Pages
const BASE = "/webaap/"; // no tocar si el repo se llama "webaap"

// Estado y persistencia
const DB_KEY = "gz_state_v1";
const defaults = { clientes: [], proyectos: [], tareas: [], agenda: [] };
const state = load();

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}
function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  updateKPIs();
}

// Utiles DOM
const $ = (sel, scope=document) => scope.querySelector(sel);
const $$ = (sel, scope=document) => Array.from(scope.querySelectorAll(sel));

// Generadores de ID
const newId = () => crypto.randomUUID();

// Render básicos
function updateKPIs() {
  $("#kpi-clientes").textContent = state.clientes.length;
  $("#kpi-proyectos").textContent = state.proyectos.length;
  $("#kpi-tareas").textContent = state.tareas.length;
  $("#kpi-agenda").textContent = state.agenda.length;
}

function renderClientes() {
  const ul = $("#lista-clientes");
  ul.innerHTML = "";
  state.clientes.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${c.nombre} <small>· ${c.estado}</small></span>
      <button class="btn secondary" data-del="${c.id}">Eliminar</button>`;
    ul.appendChild(li);
  });
  // options para proyectos
  const sel = $("#proy-cliente");
  sel.innerHTML = `<option value="" disabled selected>Cliente</option>` +
    state.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join("");
}

function renderProyectos() {
  const ul = $("#lista-proyectos");
  ul.innerHTML = "";
  state.proyectos.forEach(p => {
    const cli = state.clientes.find(c => c.id === p.clienteId);
    const cliNombre = cli ? cli.nombre : "¿cliente?";
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.titulo} <small>· ${p.estado} · ${cliNombre}</small></span>
      <button class="btn secondary" data-del="${p.id}">Eliminar</button>`;
    ul.appendChild(li);
  });
  // options para tareas
  const sel = $("#tarea-proyecto");
  sel.innerHTML = `<option value="" disabled selected>Proyecto</option>` +
    state.proyectos.map(p => `<option value="${p.id}">${p.titulo}</option>`).join("");
}

function renderTareas() {
  const ul = $("#lista-tareas");
  ul.innerHTML = "";
  state.tareas.forEach(t => {
    const proy = state.proyectos.find(p => p.id === t.proyectoId);
    const proyTitulo = proy ? proy.titulo : "¿proyecto?";
    const li = document.createElement("li");
    li.innerHTML = `<span>${t.titulo} <small>· ${t.estado} · ${proyTitulo}</small></span>
      <button class="btn secondary" data-del="${t.id}">Eliminar</button>`;
    ul.appendChild(li);
  });
}

function renderAgenda() {
  const ul = $("#lista-agenda");
  ul.innerHTML = "";
  state.agenda
    .slice()
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .forEach(a => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${a.asunto} <small>· ${a.fecha}</small></span>
        <button class="btn secondary" data-del="${a.id}">Eliminar</button>`;
      ul.appendChild(li);
    });
}

// Alta
$("#formCliente").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = $("#cli-nombre").value.trim();
  const estado = $("#cli-estado").value;
  if (!nombre) return;
  state.clientes.push({ id: newId(), nombre, estado });
  save();
  e.target.reset();
  renderClientes(); renderProyectos();
});

$("#formProyecto").addEventListener("submit", e => {
  e.preventDefault();
  const clienteId = $("#proy-cliente").value;
  const titulo = $("#proy-titulo").value.trim();
  const estado = $("#proy-estado").value;
  if (!clienteId || !titulo) return;
  state.proyectos.push({ id: newId(), clienteId, titulo, estado });
  save();
  e.target.reset();
  renderProyectos(); renderTareas();
});

$("#formTarea").addEventListener("submit", e => {
  e.preventDefault();
  const proyectoId = $("#tarea-proyecto").value;
  const titulo = $("#tarea-titulo").value.trim();
  const estado = $("#tarea-estado").value;
  if (!proyectoId || !titulo) return;
  state.tareas.push({ id: newId(), proyectoId, titulo, estado });
  save();
  e.target.reset();
  renderTareas();
});

$("#formAgenda").addEventListener("submit", e => {
  e.preventDefault();
  const asunto = $("#ag-asunto").value.trim();
  const fecha = $("#ag-fecha").value;
  if (!asunto || !fecha) return;
  state.agenda.push({ id: newId(), asunto, fecha });
  save();
  e.target.reset();
  renderAgenda();
});

// Borrados delegados
$("#lista-clientes").addEventListener("click", e=>{
  const id = e.target?.dataset?.del; if(!id) return;
  state.clientes = state.clientes.filter(c=>c.id!==id);
  // cascada mínima: quitar proyectos y tareas huérfanas
  const proys = state.proyectos.filter(p=>p.clienteId===id).map(p=>p.id);
  state.proyectos = state.proyectos.filter(p=>p.clienteId!==id);
  state.tareas = state.tareas.filter(t=>!proys.includes(t.proyectoId));
  save(); renderClientes(); renderProyectos(); renderTareas();
});

$("#lista-proyectos").addEventListener("click", e=>{
  const id = e.target?.dataset?.del; if(!id) return;
  state.proyectos = state.proyectos.filter(p=>p.id!==id);
  state.tareas = state.tareas.filter(t=>t.proyectoId!==id);
  save(); renderProyectos(); renderTareas();
});

$("#lista-tareas").addEventListener("click", e=>{
  const id = e.target?.dataset?.del; if(!id) return;
  state.tareas = state.tareas.filter(t=>t.id!==id);
  save(); renderTareas();
});

$("#lista-agenda").addEventListener("click", e=>{
  const id = e.target?.dataset?.del; if(!id) return;
  state.agenda = state.agenda.filter(a=>a.id!==id);
  save(); renderAgenda();
});

// PWA: instalación
let deferredPrompt = null;
const btnInstall = $("#btnInstall");
window.addEventListener("beforeinstallprompt", (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.hidden = false;
});
btnInstall.addEventListener("click", async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  btnInstall.hidden = true;
  deferredPrompt = null;
});

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${BASE}service-worker.js`, { scope: BASE })
    .catch(console.error);
}

// Primera pintura
updateKPIs();
renderClientes();
renderProyectos();
renderTareas();
renderAgenda();
