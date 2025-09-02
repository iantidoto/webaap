// ---------- Firebase (ESM desde CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Pega aquí tu configuración del paso 2.5
const firebaseConfig = {
  apiKey: "AIzaSyCRnF94BcH97yrsev6kWlbZZ4rIqjwsoNE",
  authDomain: "gestion-zen-4849d.firebaseapp.com",
  projectId: "gestion-zen-4849d",
  storageBucket: "gestion-zen-4849d.appspot.com",   // <- así
  messagingSenderId: "688322178199",
  appId: "1:688322178199:web:188331a53cbd28409ccdd2"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(()=>{});

// ---------- Config local ----------
const BASE = "/webaap/";
const DB_KEY = "gz_state_v3";

// ---------- Estado local ----------
const defaults = { clientes: [], proyectos: [], tareas: [], agenda: [] };
const state = loadLocal();
function loadLocal(){ try{const raw=localStorage.getItem(DB_KEY); return raw?JSON.parse(raw):structuredClone(defaults);}catch{ return structuredClone(defaults); } }
function saveLocal(){ localStorage.setItem(DB_KEY, JSON.stringify(state)); updateKPIs(); renderKanban(); }

// ---------- Utilidades ----------
const $=(s,sc=document)=>sc.querySelector(s);
const $$=(s,sc=document)=>Array.from(sc.querySelectorAll(s));
const uid=()=>crypto.randomUUID();
function fmtMoney(n){ if(n==null||n==="")return""; return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(n)); }
function byId(arr,id){ return arr.find(x=>x.id===id); }

// ---------- Tabs ----------
$$(".tab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    $$(".tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.tab;
    $$(".panel").forEach(p=>p.classList.remove("active"));
    $("#"+id).classList.add("active");
    if(id==="tab-tareas") renderKanban();
  });
});

// ---------- KPIs ----------
function updateKPIs(){
  $("#kpi-clientes").textContent = state.clientes.length;
  $("#kpi-proyectos").textContent = state.proyectos.length;
  $("#kpi-tareas").textContent = state.tareas.length;
  $("#kpi-agenda").textContent = state.agenda.length;
}

// ---------- AUTH UI ----------
const btnLogin=$("#btnLogin"), btnLogout=$("#btnLogout"), userEmail=$("#userEmail");
const authDialog=$("#authDialog"); const btnDoLogin=$("#btnDoLogin");
btnLogin.addEventListener("click", ()=>authDialog.showModal());
btnDoLogin.addEventListener("click", async ()=>{
  if(authDialog.returnValue!=="ok") return;
  const email=$("#authEmail").value.trim(); const pass=$("#authPass").value;
  try{
    await signInWithEmailAndPassword(auth,email,pass);
  }catch(e){
    if(e.code==="auth/user-not-found"){ await createUserWithEmailAndPassword(auth,email,pass); }
    else throw e;
  }
});
btnLogout.addEventListener("click", ()=>signOut(auth));

let unsub = { clientes:null, proyectos:null, tareas:null, agenda:null };
async function ensureMigration(uid){
  const cols=["clientes","proyectos","tareas","agenda"];
  const sizes = await Promise.all(cols.map(async c => (await getDocs(collection(db,"users",uid,c))).size));
  const empty = sizes.every(s=>s===0);
  if(!empty) return;
  const batch = writeBatch(db);
  state.clientes.forEach(x=>{ const id=x.id||uid(); const {id:_,...rest}=x; batch.set(doc(db,"users",uid,"clientes",id), rest); });
  state.proyectos.forEach(x=>{ const id=x.id||uid(); const {id:_,...rest}=x; batch.set(doc(db,"users",uid,"proyectos",id), rest); });
  state.tareas.forEach(x=>{ const id=x.id||uid(); const {id:_,...rest}=x; batch.set(doc(db,"users",uid,"tareas",id), rest); });
  state.agenda.forEach(x=>{ const id=x.id||uid(); const {id:_,...rest}=x; batch.set(doc(db,"users",uid,"agenda",id), rest); });
  await batch.commit();
}
function bindRealtime(uid){
  // limpia previas
  Object.values(unsub).forEach(f=>f&&f());
  unsub.clientes = onSnapshot(collection(db,"users",uid,"clientes"), snap=>{
    state.clientes = snap.docs.map(d=>({id:d.id,...d.data()}));
    saveLocal(); renderClientes(); renderProyectos(); fillClientesSelect(); fillProyectoSelectInTareas();
  });
  unsub.proyectos = onSnapshot(collection(db,"users",uid,"proyectos"), snap=>{
    state.proyectos = snap.docs.map(d=>({id:d.id,...d.data()}));
    saveLocal(); renderProyectos(); fillProyectoSelectInTareas(); renderKanban();
  });
  unsub.tareas = onSnapshot(collection(db,"users",uid,"tareas"), snap=>{
    state.tareas = snap.docs.map(d=>({id:d.id,...d.data()}));
    saveLocal(); renderKanban();
  });
  unsub.agenda = onSnapshot(collection(db,"users",uid,"agenda"), snap=>{
    state.agenda = snap.docs.map(d=>({id:d.id,...d.data()}));
    saveLocal(); renderAgenda();
  });
}

onAuthStateChanged(auth, async (user)=>{
  if(user){
    userEmail.textContent = user.email || "Conectado";
    btnLogin.hidden = true; btnLogout.hidden = false;
    await ensureMigration(user.uid);
    bindRealtime(user.uid);
  }else{
    userEmail.textContent = "";
    btnLogin.hidden = false; btnLogout.hidden = true;
    // sin login trabajas local
  }
});

// ---------- CLIENTES ----------
const formCliente = $("#formCliente");
const listaClientes = $("#lista-clientes");
const filtroClientes = $("#filtro-clientes");

formCliente.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const c = {
    id: uid(),
    nombre: $("#cli-nombre").value.trim(),
    nif: $("#cli-nif").value.trim(),
    email: $("#cli-email").value.trim(),
    tel: $("#cli-tel").value.trim(),
    dir: $("#cli-dir").value.trim(),
    cp: $("#cli-cp").value.trim(),
    ciudad: $("#cli-ciudad").value.trim(),
    pais: $("#cli-pais").value.trim(),
    notas: $("#cli-notas").value.trim(),
    estado: $("#cli-estado").value
  };
  if(!c.nombre) return;
  state.clientes.push(c); saveLocal(); renderClientes(); renderProyectos(); fillClientesSelect();
  if(auth.currentUser){
    const {id,...rest}=c;
    await setDoc(doc(db,"users",auth.currentUser.uid,"clientes",id), rest);
  }
  formCliente.reset();
});

filtroClientes.addEventListener("input", renderClientes);

function renderClientes(){
  const q = filtroClientes.value?.toLowerCase() || "";
  listaClientes.innerHTML = "";
  state.clientes
    .filter(c => (c.nombre+c.nif).toLowerCase().includes(q))
    .sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .forEach(c=>{
      const li = document.createElement("li");
      li.className="item";
      li.innerHTML = `
        <div>
          <strong>${c.nombre}</strong>
          <div class="meta">${c.nif||""} · ${c.email||""} · ${c.tel||""} · ${c.ciudad||""}</div>
        </div>
        <div class="actions">
          <button class="btn secondary small" data-edit="${c.id}">Editar</button>
          <button class="btn secondary small" data-del="${c.id}">Eliminar</button>
        </div>`;
      listaClientes.appendChild(li);
    });
}
listaClientes.addEventListener("click", async (e)=>{
  const id = e.target?.dataset?.del || null;
  const eid = e.target?.dataset?.edit || null;
  if(id){
    const proys = state.proyectos.filter(p=>p.clienteId===id).map(p=>p.id);
    state.proyectos = state.proyectos.filter(p=>p.clienteId!==id);
    state.tareas = state.tareas.filter(t=>!proys.includes(t.proyectoId));
    state.clientes = state.clientes.filter(c=>c.id!==id);
    saveLocal(); renderClientes(); renderProyectos(); renderKanban(); fillClientesSelect();
    if(auth.currentUser){
      await deleteDoc(doc(db,"users",auth.currentUser.uid,"clientes",id));
      await Promise.all(proys.map(pid=>deleteDoc(doc(db,"users",auth.currentUser.uid,"proyectos",pid))));
      // tareas en cascada se actualizarán por snapshot cuando se borren proyectos
    }
  }
  if(eid){
    const c = byId(state.clientes,eid); if(!c) return;
    openModal("Editar cliente", clienteForm(c), async (vals)=>{
      Object.assign(c, vals); saveLocal(); renderClientes(); renderProyectos(); fillClientesSelect();
      if(auth.currentUser){
        const {id,...rest}=c;
        await setDoc(doc(db,"users",auth.currentUser.uid,"clientes",id), rest); // upsert
      }
    });
  }
});
function clienteForm(c={}){
  return [
    {k:"nombre",label:"Nombre fiscal",type:"text",required:true,val:c.nombre||""},
    {k:"nif",label:"NIF/CIF",type:"text",val:c.nif||""},
    {k:"email",label:"Email",type:"email",val:c.email||""},
    {k:"tel",label:"Teléfono",type:"text",val:c.tel||""},
    {k:"dir",label:"Dirección",type:"text",val:c.dir||""},
    {k:"cp",label:"CP",type:"text",val:c.cp||""},
    {k:"ciudad",label:"Ciudad",type:"text",val:c.ciudad||""},
    {k:"pais",label:"País",type:"text",val:c.pais||""},
    {k:"estado",label:"Estado",type:"select",options:[["activo","Activo"],["inactivo","Inactivo"]],val:c.estado||"activo"},
    {k:"notas",label:"Notas",type:"textarea",val:c.notas||""}
  ];
}

// ---------- PROYECTOS ----------
const formProyecto = $("#formProyecto");
const listaProyectos = $("#lista-proyectos");
const selProyCliente = $("#proy-cliente");

function fillClientesSelect(){
  selProyCliente.innerHTML = `<option value="" disabled selected>Cliente</option>` +
    state.clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("");
}
formProyecto.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const p = {
    id: uid(),
    clienteId: $("#proy-cliente").value,
    titulo: $("#proy-titulo").value.trim(),
    inicio: $("#proy-inicio").value || "",
    fin: $("#proy-fin").value || "",
    presupuesto: $("#proy-presupuesto").value || "",
    desc: $("#proy-desc").value.trim(),
    estado: $("#proy-estado").value
  };
  if(!p.clienteId || !p.titulo) return;
  state.proyectos.push(p); saveLocal(); renderProyectos(); fillProyectoSelectInTareas();
  if(auth.currentUser){
    const {id,...rest}=p;
    await setDoc(doc(db,"users",auth.currentUser.uid,"proyectos",id), rest);
  }
  formProyecto.reset();
});
function renderProyectos(){
  listaProyectos.innerHTML="";
  state.proyectos.slice().sort((a,b)=>a.titulo.localeCompare(b.titulo)).forEach(p=>{
    const cli = byId(state.clientes,p.clienteId);
    const li = document.createElement("li");
    li.className="item";
    li.innerHTML = `
      <div>
        <strong>${p.titulo}</strong>
        <div class="meta">${cli?cli.nombre:"¿cliente?"} · ${p.estado} · ${fmtMoney(p.presupuesto)}</div>
      </div>
      <div class="actions">
        <button class="btn secondary small" data-edit="${p.id}">Editar</button>
        <button class="btn secondary small" data-del="${p.id}">Eliminar</button>
      </div>`;
    listaProyectos.appendChild(li);
  });
}
listaProyectos.addEventListener("click", async (e)=>{
  const id=e.target?.dataset?.del||null;
  const eid=e.target?.dataset?.edit||null;
  if(id){
    state.tareas = state.tareas.filter(t=>t.proyectoId!==id);
    state.proyectos = state.proyectos.filter(p=>p.id!==id);
    saveLocal(); renderProyectos(); renderKanban(); fillProyectoSelectInTareas();
    if(auth.currentUser){
      await deleteDoc(doc(db,"users",auth.currentUser.uid,"proyectos",id));
    }
  }
  if(eid){
    const p = byId(state.proyectos,eid); if(!p) return;
    openModal("Editar proyecto", proyectoForm(p), async (vals)=>{
      Object.assign(p, vals); saveLocal(); renderProyectos(); renderKanban(); fillProyectoSelectInTareas();
      if(auth.currentUser){
        const {id,...rest}=p;
        await setDoc(doc(db,"users",auth.currentUser.uid,"proyectos",id), rest);
      }
    });
  }
});
function proyectoForm(p={}){
  return [
    {k:"clienteId",label:"Cliente",type:"select",options: state.clientes.map(c=>[c.id,c.nombre]), val:p.clienteId||""},
    {k:"titulo",label:"Título",type:"text",required:true,val:p.titulo||""},
    {k:"inicio",label:"Inicio",type:"date",val:p.inicio||""},
    {k:"fin",label:"Fin",type:"date",val:p.fin||""},
    {k:"presupuesto",label:"Presupuesto (€)",type:"number",val:p.presupuesto||""},
    {k:"estado",label:"Estado",type:"select",options:[["abierto","Abierto"],["en_progreso","En progreso"],["cerrado","Cerrado"]],val:p.estado||"abierto"},
    {k:"desc",label:"Descripción",type:"textarea",val:p.desc||""}
  ];
}

// ---------- TAREAS + KANBAN ----------
const formTarea = $("#formTarea");
const selTareaProyecto = $("#tarea-proyecto");
function fillProyectoSelectInTareas(){
  selTareaProyecto.innerHTML = `<option value="">— Tarea libre —</option>` +
    state.proyectos.map(p=>`<option value="${p.id}">${p.titulo}</option>`).join("");
}
formTarea.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const t = { id: uid(), proyectoId: $("#tarea-proyecto").value || "", titulo: $("#tarea-titulo").value.trim(), fecha: $("#tarea-fecha").value || "", desc: $("#tarea-desc").value.trim(), estado: $("#tarea-estado").value };
  if(!t.titulo) return;
  state.tareas.push(t); saveLocal(); renderKanban();
  if(auth.currentUser){
    const {id,...rest}=t;
    await setDoc(doc(db,"users",auth.currentUser.uid,"tareas",id), rest);
  }
  formTarea.reset();
});
function taskCard(t){
  const proy = t.proyectoId ? byId(state.proyectos,t.proyectoId) : null;
  const div = document.createElement("div");
  div.className="card-task"; div.draggable=true; div.dataset.id=t.id;
  div.innerHTML = `<strong>${t.titulo}</strong><div class="meta">${proy?proy.titulo:"Tarea libre"} · ${t.fecha||""}</div>
    <div class="actions mt"><button class="btn secondary small" data-edit="${t.id}">Editar</button>
    <button class="btn secondary small" data-del="${t.id}">Eliminar</button></div>`;
  div.addEventListener("dragstart", ev=>{ div.classList.add("drag"); ev.dataTransfer.setData("text/plain", t.id); });
  div.addEventListener("dragend", ()=>div.classList.remove("drag"));
  return div;
}
function renderKanban(){
  ["pendiente","haciendo","hecho"].forEach(s=>{
    const zone = document.getElementById(`list-${s}`) || document.getElementById(`kanban-${s}`);
    if(!zone) return; zone.innerHTML="";
    state.tareas.filter(t=>t.estado===s).forEach(t=> zone.appendChild(taskCard(t)));
  });
  ["pendiente","haciendo","hecho"].forEach(s=>{
    const zone = document.getElementById(`kanban-${s}`);
    if(zone){ zone.innerHTML=""; state.tareas.filter(t=>t.estado===s).slice(0,5).forEach(t=> zone.appendChild(taskCard(t))); }
  });
}
$$(".dropzone").forEach(zone=>{
  zone.addEventListener("dragover", e=>{ e.preventDefault(); });
  zone.addEventListener("drop", async e=>{
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const t = byId(state.tareas,id); if(!t) return;
    const status = zone.closest(".col")?.dataset?.status; if(!status) return;
    t.estado = status; saveLocal(); renderKanban();
    if(auth.currentUser){ await updateDoc(doc(db,"users",auth.currentUser.uid,"tareas",id), {estado:status}); }
  });
});
// acciones tarjeta
document.addEventListener("click", async (e)=>{
  const del = e.target?.dataset?.del;
  const edit = e.target?.dataset?.edit;
  if(del){
    const i = state.tareas.findIndex(x=>x.id===del);
    if(i>-1){ state.tareas.splice(i,1); saveLocal(); renderKanban(); if(auth.currentUser){ await deleteDoc(doc(db,"users",auth.currentUser.uid,"tareas",del)); } }
  }
  if(edit){
    const t = byId(state.tareas,edit); if(t){
      openModal("Editar tarea", tareaForm(t), async (vals)=>{
        Object.assign(t, vals); saveLocal(); renderKanban();
        if(auth.currentUser){ const {id,...rest}=t; await setDoc(doc(db,"users",auth.currentUser.uid,"tareas",id), rest); }
      });
    }
  }
});
function tareaForm(t={}){
  return [
    {k:"titulo",label:"Título",type:"text",required:true,val:t.titulo||""},
    {k:"proyectoId",label:"Proyecto",type:"select",options:[["","— Tarea libre —"], ...state.proyectos.map(p=>[p.id,p.titulo])], val:t.proyectoId||""},
    {k:"fecha",label:"Fecha",type:"date",val:t.fecha||""},
    {k:"estado",label:"Estado",type:"select",options:[["pendiente","Pendiente"],["haciendo","Haciendo"],["hecho","Hecho"]],val:t.estado||"pendiente"},
    {k:"desc",label:"Notas",type:"textarea",val:t.desc||""}
  ];
}

// ---------- AGENDA ----------
const formAgenda=$("#formAgenda");
const agendaGrid=$("#agenda-grid");
formAgenda.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const a = { id: uid(), asunto: $("#ag-asunto").value.trim(), fecha: $("#ag-fecha").value, hora: $("#ag-hora").value || "", notas: $("#ag-notas").value.trim() };
  if(!a.asunto || !a.fecha) return;
  state.agenda.push(a); saveLocal(); renderAgenda();
  if(auth.currentUser){ const {id,...rest}=a; await setDoc(doc(db,"users",auth.currentUser.uid,"agenda",id), rest); }
  formAgenda.reset();
});
function renderAgenda(){
  agendaGrid.innerHTML="";
  state.agenda.slice().sort((a,b)=> (a.fecha+a.hora).localeCompare(b.fecha+b.hora)).forEach(a=>{
    const row = document.createElement("div");
    row.className="agenda-item";
    row.innerHTML = `
      <div><strong>${a.asunto}</strong><div class="meta">${a.fecha} ${a.hora||""}</div>${a.notas? `<div class="meta">${a.notas}</div>`:""}</div>
      <div class="actions"><button class="btn secondary small" data-edit="${a.id}">Editar</button><button class="btn secondary small" data-del="${a.id}">Eliminar</button></div>`;
    agendaGrid.appendChild(row);
  });
}
agendaGrid.addEventListener("click", async (e)=>{
  const id=e.target?.dataset?.del||null; const eid=e.target?.dataset?.edit||null;
  if(id){
    state.agenda = state.agenda.filter(x=>x.id!==id); saveLocal(); renderAgenda();
    if(auth.currentUser){ await deleteDoc(doc(db,"users",auth.currentUser.uid,"agenda",id)); }
  }
  if(eid){
    const a = byId(state.agenda,eid); if(!a) return;
    openModal("Editar evento", agendaForm(a), async (vals)=>{
      Object.assign(a, vals); saveLocal(); renderAgenda();
      if(auth.currentUser){ const {id,...rest}=a; await setDoc(doc(db,"users",auth.currentUser.uid,"agenda",id), rest); }
    });
  }
});
function agendaForm(a={}){ return [
  {k:"asunto",label:"Asunto",type:"text",required:true,val:a.asunto||""},
  {k:"fecha",label:"Fecha",type:"date",required:true,val:a.fecha||""},
  {k:"hora",label:"Hora",type:"time",val:a.hora||""},
  {k:"notas",label:"Notas",type:"textarea",val:a.notas||""}
]; }

// ---------- Modal genérico ----------
const modal = $("#modal"); const modalBody = $("#modal-body"); const modalTitle = $("#modal-title");
function openModal(title, schema, onOK){
  modalTitle.textContent = title; modalBody.innerHTML = "";
  const form = document.createElement("form"); form.className="form-grid";
  schema.forEach(f=>{
    let el;
    if(f.type==="textarea"){ el=document.createElement("textarea"); el.rows=3; }
    else if(f.type==="select"){ el=document.createElement("select"); (f.options||[]).forEach(([val,label])=>{ const opt=document.createElement("option"); opt.value=val; opt.textContent=label; if(String(f.val)===String(val)) opt.selected=true; el.appendChild(opt); }); }
    else{ el=document.createElement("input"); el.type=f.type||"text"; if(f.type==="number"){ el.step="0.01"; } el.value=f.val||""; }
    el.id="m-"+f.k; el.name=f.k; if(f.required) el.required=true; el.placeholder=f.label;
    const wrap=document.createElement("div"); const lab=document.createElement("label"); lab.htmlFor=el.id; lab.textContent=f.label; wrap.appendChild(lab); wrap.appendChild(el);
    form.appendChild(wrap);
  });
  modalBody.appendChild(form); modal.showModal();
  modal.addEventListener("close", handler, {once:true});
  function handler(){ if(modal.returnValue!=="ok") return; const vals={}; schema.forEach(f=>{ vals[f.k]=form.elements[f.k].value; }); onOK?.(vals); }
}

// ---------- Boot ----------
function boot(){
  updateKPIs();
  renderClientes(); renderProyectos(); fillClientesSelect();
  fillProyectoSelectInTareas(); renderKanban(); renderAgenda();
}
boot();

// ---------- PWA ----------
let deferredPrompt=null; const btnInstall=$("#btnInstall");
window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); deferredPrompt=e; btnInstall.hidden=false; });
btnInstall.addEventListener("click", async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; btnInstall.hidden=true; deferredPrompt=null; });
if("serviceWorker" in navigator){ navigator.serviceWorker.register(`${BASE}service-worker.js`, {scope: BASE}).catch(console.error); }
