// Mostrar sección activa
function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion");
  secciones.forEach(sec => sec.classList.add("oculto"));
  document.getElementById(id).classList.remove("oculto");
}

// === CLIENTES ===
function agregarCliente() {
  const empresa = document.getElementById("empresaCliente").value.trim();
  const contacto = document.getElementById("contactoCliente").value.trim();
  const notas = document.getElementById("notasCliente").value.trim();
  if (empresa === "") return;
  const clientes = obtenerDatos("clientes");
  clientes.push({ id: Date.now(), empresa, contacto, notas });
  guardarDatos("clientes", clientes);
  mostrarClientes();
  actualizarSelectorClientes();
  actualizarResumen();
  document.getElementById("form-cliente").reset();
}

function mostrarClientes() {
  const lista = document.getElementById("lista-clientes");
  lista.innerHTML = "";
  const clientes = obtenerDatos("clientes");
  clientes.forEach((cliente, index) => {
    const li = document.createElement("li");
    li.textContent = `${cliente.empresa} (${cliente.contacto})`;
    const btnEditar = document.createElement("button");
    btnEditar.innerHTML = "✏️";
    btnEditar.onclick = () => editarCliente(index);
    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = "🗑️";
    btnEliminar.onclick = () => eliminarCliente(index);
    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

function editarCliente(index) {
  const clientes = obtenerDatos("clientes");
  const cliente = clientes[index];
  const empresa = prompt("Editar empresa:", cliente.empresa);
  const contacto = prompt("Editar contacto:", cliente.contacto);
  const notas = prompt("Editar notas:", cliente.notas);
  if (empresa) cliente.empresa = empresa.trim();
  if (contacto) cliente.contacto = contacto.trim();
  if (notas) cliente.notas = notas.trim();
  guardarDatos("clientes", clientes);
  mostrarClientes();
  actualizarSelectorClientes();
  actualizarResumen();
}

function eliminarCliente(index) {
  if (!confirm("¿Eliminar cliente?")) return;
  const clientes = obtenerDatos("clientes");
  const clienteId = clientes[index].id;
  clientes.splice(index, 1);
  guardarDatos("clientes", clientes);
  const proyectos = obtenerDatos("proyectos").filter(p => p.clienteId !== clienteId);
  guardarDatos("proyectos", proyectos);
  mostrarClientes();
  mostrarProyectos();
  actualizarSelectorClientes();
  actualizarResumen();
}

function actualizarSelectorClientes() {
  const selector = document.getElementById("selectorCliente");
  selector.innerHTML = "";
  const clientes = obtenerDatos("clientes");
  clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.id;
    option.textContent = cliente.empresa;
    selector.appendChild(option);
  });
}

// === PROYECTOS ===
function agregarProyecto() {
  const nombre = document.getElementById("nuevoProyecto").value.trim();
  const clienteId = document.getElementById("selectorCliente").value;
  if (nombre === "") return;
  const proyectos = obtenerDatos("proyectos");
  proyectos.push({ nombre, clienteId, tareas: [] });
  guardarDatos("proyectos", proyectos);
  mostrarProyectos();
  actualizarResumen();
  document.getElementById("nuevoProyecto").value = "";
}

function mostrarProyectos() {
  const lista = document.getElementById("listaProyectos");
  lista.innerHTML = "";
  const proyectos = obtenerDatos("proyectos");
  const clientes = obtenerDatos("clientes");
  proyectos.forEach((proyecto, index) => {
    const cliente = clientes.find(c => c.id == proyecto.clienteId);
    const nombreCliente = cliente ? ` (${cliente.empresa})` : "";
    const li = document.createElement("li");
    li.textContent = proyecto.nombre + nombreCliente;
    li.onclick = () => mostrarTareasProyecto(index);
    const btnEditar = document.createElement("button");
    btnEditar.innerHTML = "✏️";
    btnEditar.onclick = (e) => { e.stopPropagation(); editarProyecto(index); };
    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = "🗑️";
    btnEliminar.onclick = (e) => { e.stopPropagation(); eliminarProyecto(index); };
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
    actualizarResumen();
  }
}

function eliminarProyecto(index) {
  if (!confirm("¿Eliminar proyecto?")) return;
  const proyectos = obtenerDatos("proyectos");
  proyectos.splice(index, 1);
  guardarDatos("proyectos", proyectos);
  mostrarProyectos();
  actualizarResumen();
}

// === TAREAS Y SUBTAREAS ===
function agregarTarea() {
  const descripcion = document.getElementById("nuevaTarea").value.trim();
  const estado = document.getElementById("estadoTarea").value;
  const porcentaje = parseInt(document.getElementById("porcentajeTarea").value);
  const estadoEmoji = document.getElementById("estadoTarea").selectedOptions[0].textContent;
  if (descripcion === "" || isNaN(porcentaje)) return;
  const tarea = { descripcion, estado, estadoEmoji, porcentaje, subtareas: [] };
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  proyectos[index].tareas.push(tarea);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
  actualizarResumen();
  document.getElementById("nuevaTarea").value = "";
  document.getElementById("porcentajeTarea").value = "";
}

function agregarSubtarea(tareaIndex) {
  const descripcion = prompt("Subtarea:");
  if (!descripcion) return;
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  proyectos[index].tareas[tareaIndex].subtareas.push({ descripcion, completado: false });
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
}

function eliminarSubtarea(tareaIndex, subIndex) {
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  proyectos[index].tareas[tareaIndex].subtareas.splice(subIndex, 1);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
}

function mostrarTareas() {
  const lista = document.getElementById("listaTareas");
  lista.innerHTML = "";
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const proyectos = obtenerDatos("proyectos");
  const tareas = proyectos[index]?.tareas || [];
  tareas.forEach((tarea, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<div class="estado ${tarea.estado}">${tarea.estadoEmoji}</div>
                    <div>${tarea.descripcion}</div>`;
    const progreso = document.createElement("div");
    progreso.className = "progreso";
    const barra = document.createElement("div");
    barra.className = "barra";
    barra.style.width = `${tarea.porcentaje}%`;
    progreso.appendChild(barra);
    li.appendChild(progreso);

    const btnEditar = document.createElement("button");
    btnEditar.innerHTML = "✏️";
    btnEditar.onclick = () => editarTarea(i);
    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = "🗑️";
    btnEliminar.onclick = () => eliminarTarea(i);
    const btnSub = document.createElement("button");
    btnSub.innerHTML = "➕ Subtarea";
    btnSub.onclick = () => agregarSubtarea(i);
    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    li.appendChild(btnSub);

   if (tarea.subtareas) {
  const ul = document.createElement("ul");
  tarea.subtareas.forEach((sub, j) => {
    const subLi = document.createElement("li");
    subLi.textContent = sub.descripcion + (sub.completado ? " ✅" : " ⏳");

    const btnEliminarSub = document.createElement("button");
    btnEliminarSub.innerHTML = "🗑️";
    btnEliminarSub.onclick = () => eliminarSubtarea(i, j);

    const btnEditarSub = document.createElement("button");
    btnEditarSub.innerHTML = "✏️";
    btnEditarSub.onclick = () => {
      const nueva = prompt("Editar subtarea:", sub.descripcion);
      if (nueva && nueva.trim() !== "") {
        const index = parseInt(localStorage.getItem("proyectoActual"));
        const proyectos = obtenerDatos("proyectos");
        proyectos[index].tareas[i].subtareas[j].descripcion = nueva.trim();
        guardarDatos("proyectos", proyectos);
        mostrarTareas();
      }
    };

    const btnToggle = document.createElement("button");
    btnToggle.innerHTML = sub.completado ? "❌" : "✔️";
    btnToggle.onclick = () => {
      const index = parseInt(localStorage.getItem("proyectoActual"));
      const proyectos = obtenerDatos("proyectos");
      proyectos[index].tareas[i].subtareas[j].completado = !sub.completado;
      guardarDatos("proyectos", proyectos);
      mostrarTareas();
    };

    subLi.appendChild(btnEditarSub);
    subLi.appendChild(btnToggle);
    subLi.appendChild(btnEliminarSub);
    ul.appendChild(subLi);
  });
  li.appendChild(ul);
}
lista.appendChild(li);
});
}
