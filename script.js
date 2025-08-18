// Mostrar sección activa
function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.classList.add("oculto"));
  document.getElementById(id).classList.remove("oculto");
}

// === PROYECTOS ===
function agregarProyecto() {
  const nombre = document.getElementById("nuevoProyecto").value.trim();
  if (nombre === "") return;

  const proyectos = obtenerDatos("proyectos");
  proyectos.push({ nombre, tareas: [] });
  guardarDatos("proyectos", proyectos);
  mostrarProyectos();
  document.getElementById("nuevoProyecto").value = "";
}

function mostrarProyectos() {
  const lista = document.getElementById("listaProyectos");
  lista.innerHTML = "";
  const proyectos = obtenerDatos("proyectos");

  proyectos.forEach((proyecto, index) => {
    const li = document.createElement("li");
    li.textContent = proyecto.nombre;
    li.onclick = () => mostrarTareasProyecto(index);
    lista.appendChild(li);
  });
}

function mostrarTareasProyecto(index) {
  localStorage.setItem("proyectoActual", index);
  mostrarSeccion("tareas");
  mostrarTareas();
}

// === TAREAS ===
function agregarTarea() {
  const descripcion = document.getElementById("nuevaTarea").value.trim();
  const estado = document.getElementById("estadoTarea").value;
  const porcentaje = parseInt(document.getElementById("porcentajeTarea").value);
  const estadoEmoji = document.getElementById("estadoTarea").selectedOptions[0].textContent;

  if (descripcion === "" || isNaN(porcentaje)) return;

  const tarea = { descripcion, estado, estadoEmoji, porcentaje };
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");

  proyectos[index].tareas.push(tarea);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();

  document.getElementById("nuevaTarea").value = "";
  document.getElementById("porcentajeTarea").value = "";
}

function mostrarTareas() {
  const lista = document.getElementById("listaTareas");
  lista.innerHTML = "";
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  const tareas = proyectos[index]?.tareas || [];

  tareas.forEach(tarea => {
    const li = document.createElement("li");

    const estado = document.createElement("div");
    estado.className = `estado ${tarea.estado}`;
    estado.textContent = tarea.estadoEmoji;

    const descripcion = document.createElement("div");
    descripcion.textContent = tarea.descripcion;

    const progreso = document.createElement("div");
    progreso.className = "progreso";

    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.width = `${tarea.porcentaje}%`;

    progreso.appendChild(barra);
    li.appendChild(estado);
    li.appendChild(descripcion);
    li.appendChild(progreso);
    lista.appendChild(li);
  });
}

// === HORARIOS ===
function agregarHorario() {
  const texto = document.getElementById("nuevoHorario").value.trim();
  const inicio = document.getElementById("horaInicio").value;
  const fin = document.getElementById("horaFin").value;
  if (texto === "" || !inicio || !fin) return;

  const horarios = obtenerDatos("horarios");
  horarios.push({ texto, inicio, fin });
  guardarDatos("horarios", horarios);
  mostrarHorarios();

  document.getElementById("nuevoHorario").value = "";
  document.getElementById("horaInicio").value = "";
  document.getElementById("horaFin").value = "";
}

function mostrarHorarios() {
  const lista = document.getElementById("listaHorarios");
  lista.innerHTML = "";
  const horarios = obtenerDatos("horarios");

  horarios.forEach(h => {
    const li = document.createElement("li");
    li.textContent = `${h.texto} (${h.inicio} - ${h.fin})`;
    lista.appendChild(li);
  });
}

// === AGENDA ===
function agregarEvento() {
  const texto = document.getElementById("nuevoEvento").value.trim();
  const fecha = document.getElementById("fechaEvento").value;
  const hora = document.getElementById("horaEvento").value;
  if (texto === "" || !fecha || !hora) return;

  const agenda = obtenerDatos("agenda");
  agenda.push({ texto, fecha, hora });
  guardarDatos("agenda", agenda);
  mostrarAgenda();

  document.getElementById("nuevoEvento").value = "";
  document.getElementById("fechaEvento").value = "";
  document.getElementById("horaEvento").value = "";
}

function mostrarAgenda() {
  const lista = document.getElementById("listaAgenda");
  lista.innerHTML = "";
  const agenda = obtenerDatos("agenda");

  agenda.forEach(e => {
    const li = document.createElement("li");
    li.textContent = `${e.texto} - ${e.fecha} ${e.hora}`;
    lista.appendChild(li);
  });
}

// === CLIENTES ===
function agregarCliente() {
  const empresa = document.getElementById("empresaCliente").value.trim();
  const contacto = document.getElementById("contactoCliente").value.trim();
  const notas = document.getElementById("notasCliente").value.trim();
  if (empresa === "" || contacto === "") return;

  const clientes = obtenerDatos("clientes");
  clientes.push({ empresa, contacto, notas });
  guardarDatos("clientes", clientes);
  mostrarClientes();

  document.getElementById("empresaCliente").value = "";
  document.getElementById("contactoCliente").value = "";
  document.getElementById("notasCliente").value = "";
}

function mostrarClientes() {
  const lista = document.getElementById("listaClientes");
  lista.innerHTML = "";
  const clientes = obtenerDatos("clientes");

  clientes.forEach(c => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.empresa}</strong> - ${c.contacto}<br><em>${c.notas}</em>`;
    lista.appendChild(li);
  });
}

// === UTILIDADES ===
function obtenerDatos(clave) {
  return JSON.parse(localStorage.getItem(clave)) || [];
}

function guardarDatos(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

// === Cargar todo al iniciar ===
window.onload = function () {
  mostrarProyectos();
  mostrarHorarios();
  mostrarAgenda();
  mostrarClientes();
};
