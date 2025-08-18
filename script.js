// Cargar datos guardados al iniciar
window.onload = function () {
  cargarDatos();
};

// Agregar nuevo proyecto
function agregarProyecto() {
  const nombre = document.getElementById("nuevoProyecto").value.trim();
  if (nombre === "") return;

  const proyecto = {
    nombre,
    tareas: []
  };

  let proyectos = obtenerProyectos();
  proyectos.push(proyecto);
  guardarProyectos(proyectos);
  mostrarProyectos();
  document.getElementById("nuevoProyecto").value = "";
}

// Mostrar lista de proyectos
function mostrarProyectos() {
  const lista = document.getElementById("listaProyectos");
  lista.innerHTML = "";

  const proyectos = obtenerProyectos();
  proyectos.forEach((proyecto, index) => {
    const li = document.createElement("li");
    li.textContent = proyecto.nombre;
    li.onclick = () => mostrarTareasProyecto(index);
    lista.appendChild(li);
  });
}

// Mostrar tareas de un proyecto
function mostrarTareasProyecto(index) {
  const lista = document.getElementById("listaTareas");
  lista.innerHTML = "";

  const proyectos = obtenerProyectos();
  const tareas = proyectos[index].tareas;

  tareas.forEach((tarea) => {
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

  // Guardar índice actual para agregar tareas
  localStorage.setItem("proyectoActual", index);
}

// Agregar nueva tarea
function agregarTarea() {
  const descripcion = document.getElementById("nuevaTarea").value.trim();
  const estado = document.getElementById("estadoTarea").value;
  const porcentaje = parseInt(document.getElementById("porcentajeTarea").value);

  if (descripcion === "" || isNaN(porcentaje)) return;

  const estadoEmoji = document.getElementById("estadoTarea").selectedOptions[0].textContent;

  const tarea = {
    descripcion,
    estado,
    estadoEmoji,
    porcentaje
  };

  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerProyectos();
  proyectos[index].tareas.push(tarea);
  guardarProyectos(proyectos);
  mostrarTareasProyecto(index);

  document.getElementById("nuevaTarea").value = "";
  document.getElementById("porcentajeTarea").value = "";
}

// Utilidades de almacenamiento
function obtenerProyectos() {
  return JSON.parse(localStorage.getItem("proyectos")) || [];
}

function guardarProyectos(proyectos) {
  localStorage.setItem("proyectos", JSON.stringify(proyectos));
}

function cargarDatos() {
  mostrarProyectos();
  const index = localStorage.getItem("proyectoActual");
  if (index !== null) mostrarTareasProyecto(parseInt(index));
}
