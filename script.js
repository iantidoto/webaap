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

    const btnEditar = document.createElement("button");
    btnEditar.className = "boton-accion boton-editar";
    btnEditar.innerHTML = '<i class="ph ph-pencil-simple"></i>';
    btnEditar.onclick = (e) => {
      e.stopPropagation();
      editarProyecto(index);
    };

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "boton-accion boton-eliminar";
    btnEliminar.innerHTML = '<i class="ph ph-trash"></i>';
    btnEliminar.onclick = (e) => {
      e.stopPropagation();
      eliminarProyecto(index);
    };

    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

function editarProyecto(index) {
  const proyectos = obtenerDatos("proyectos");
  const nuevoNombre = prompt("Editar nombre del proyecto:", proyectos[index].nombre);
  if (nuevoNombre && nuevoNombre.trim() !== "") {
    proyectos[index].nombre = nuevoNombre.trim();
    guardarDatos("proyectos", proyectos);
    mostrarProyectos();
  }
}

function eliminarProyecto(index) {
  const proyectos = obtenerDatos("proyectos");
  proyectos.splice(index, 1);
  guardarDatos("proyectos", proyectos);
  mostrarProyectos();
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

  tareas.forEach((tarea, i) => {
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

    const btnEditar = document.createElement("button");
    btnEditar.className = "boton-accion boton-editar";
    btnEditar.innerHTML = '<i class="ph ph-pencil-simple"></i>';
    btnEditar.onclick = () => editarTarea(i);

    const btnEliminar = document.createElement("button");
    btnEliminar.className = "boton-accion boton-eliminar";
    btnEliminar.innerHTML = '<i class="ph ph-trash"></i>';
    btnEliminar.onclick = () => eliminarTarea(i);

    li.appendChild(estado);
    li.appendChild(descripcion);
    li.appendChild(progreso);
    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

function editarTarea(i) {
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  const tarea = proyectos[index].tareas[i];

  const nuevaDescripcion = prompt("Editar descripción:", tarea.descripcion);
  if (nuevaDescripcion && nuevaDescripcion.trim() !== "") {
    tarea.descripcion = nuevaDescripcion.trim();
    guardarDatos("proyectos", proyectos);
    mostrarTareas();
  }
}

function eliminarTarea(i) {
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  proyectos[index].tareas.splice(i, 1);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
}

function mostrarTareasProyecto(index) {
  localStorage.setItem("proyectoActual", index);
  mostrarSeccion("tareas");
  mostrarTareas();
}

// === UTILIDADES ===
function obtenerDatos(clave) {
  return JSON.parse(localStorage.getItem(clave)) || [];
}

function guardarDatos(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

// === INICIALIZACIÓN ===
document.addEventListener("DOMContentLoaded", () => {
  mostrarProyectos();
});
