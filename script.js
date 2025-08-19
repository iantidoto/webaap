// === UTILIDADES ===
function obtenerDatos(clave) {
  return JSON.parse(localStorage.getItem(clave)) || [];
}

function guardarDatos(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
}

function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.add("oculto"));
  document.getElementById(id).classList.remove("oculto");
}

function actualizarResumen() {
  const clientes = obtenerDatos("clientes").length;
  const proyectos = obtenerDatos("proyectos").length;
  let tareas = 0;
  obtenerDatos("proyectos").forEach(p => tareas += p.tareas.length);
  document.getElementById("resumenClientes").textContent = clientes;
  document.getElementById("resumenProyectos").textContent = proyectos;
  document.getElementById("resumenTareas").textContent = tareas;
}

function agregarCliente() {
  const empresa = document.getElementById("empresaCliente").value.trim();
  const contacto = document.getElementById("contactoCliente").value.trim();
  const notas = document.getElementById("notasCliente").value.trim();
  if (!empresa) return;
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
  obtenerDatos("clientes").forEach(cliente => {
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
  if (!nombre) return;
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

function mostrarTareasProyecto(index) {
  localStorage.setItem("proyectoActual", index);
  mostrarTareas();
  mostrarSeccion("seccionTareas");
}

// === TAREAS Y SUBTAREAS ===
function agregarTarea() {
  const descripcion = document.getElementById("nuevaTarea").value.trim();
  const estado = document.getElementById("estadoTarea").value;
  const porcentaje = parseInt(document.getElementById("porcentajeTarea").value);
  const estadoEmoji = document.getElementById("estadoTarea").selectedOptions[0].textContent;
  if (!descripcion || isNaN(porcentaje)) return;
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

function editarTarea(i) {
  const proyectos = obtenerDatos("proyectos");
  const index = parseInt(localStorage.getItem("proyectoActual"));
  const tarea = proyectos[index].tareas[i];
  const nuevaDesc = prompt("Editar descripción:", tarea.descripcion);
  const nuevoPorcentaje = prompt("Editar porcentaje:", tarea.porcentaje);
  if (nuevaDesc) tarea.descripcion = nuevaDesc.trim();
  if (!isNaN(parseInt(nuevoPorcentaje))) tarea.porcentaje = parseInt(nuevoPorcentaje);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
}

function eliminarTarea(i) {
  if (!confirm("¿Eliminar tarea?")) return;
  const proyectos = obtenerDatos("proyectos");
  const index = parseInt(localStorage.getItem("proyectoActual"));
  proyectos[index].tareas.splice(i, 1);
  guardarDatos("proyectos", proyectos);
  mostrarTareas();
  actualizarResumen();
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

        const btnEditarSub = document.createElement("button");
        btnEditarSub.innerHTML = "✏️";
        btnEditarSub.onclick = () => {
          const nueva = prompt("Editar subtarea:", sub.descripcion);
          if (nueva && nueva.trim() !== "") {
            proyectos[index].tareas[i].subtareas[j].descripcion = nueva.trim();
            guardarDatos("proyectos", proyectos);
            mostrarTareas();
          }
        };

        const btnToggle = document.createElement("button");
        btnToggle.innerHTML = sub.completado ? "❌" : "✔️";
        btnToggle.onclick = () => {
          proyectos[index].tareas[i].subtareas[j].completado = !sub.completado;
          guardarDatos("proyectos", proyectos);
          mostrarTareas();
        };

        const btnEliminarSub = document.createElement("button");
        btnEliminarSub.innerHTML = "🗑️";
        btnEliminarSub.onclick = () => eliminarSubtarea(i, j);

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

// === AGENDA SEMANAL ===
function agregarTareaAgenda() {
  const dia = document.getElementById("diaAgenda").value;
  const tarea = document.getElementById("tareaAgenda").value.trim();
  if (!tarea) return;
  const agenda = obtenerDatos("agenda");
  agenda[dia] ||= [];
  agenda[dia].push(tarea);
  guardarDatos("agenda", agenda);
  mostrarAgenda();
  document.getElementById("form-agenda").reset();
}

function mostrarAgenda() {
  const agenda = obtenerDatos("agenda");
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  dias.forEach(dia => {
    const contenedor = document.getElementById(`agenda-${dia}`);
    contenedor.innerHTML = "";
    (agenda[dia] || []).forEach((tarea, i) => {
      const li = document.createElement("li");
      li.textContent = tarea;

      const btnEditar = document.createElement("button");
      btnEditar.innerHTML = "✏️";
      btnEditar.onclick = () => editarTareaAgenda(dia, i);

      const btnEliminar = document.createElement("button");
      btnEliminar.innerHTML = "🗑️";
      btnEliminar.onclick = () => eliminarTareaAgenda(dia, i);

      li.appendChild(btnEditar);
      li.appendChild(btnEliminar);
      contenedor.appendChild(li);
    });
  });
}

const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
dias.forEach(dia => {
  const contenedor = document.getElementById(`agenda-${dia}`);
  contenedor.onclick = () => abrirDiaAgenda(dia);
});


function editarTareaAgenda(dia, index) {
  const agenda = obtenerDatos("agenda");
  const nueva = prompt("Editar tarea:", agenda[dia][index]);
  if (nueva && nueva.trim() !== "") {
    agenda[dia][index] = nueva.trim();
    guardarDatos("agenda", agenda);
    mostrarAgenda();
  }
}

function eliminarTareaAgenda(dia, index) {
  if (!confirm("¿Eliminar tarea de la agenda?")) return;
  const agenda = obtenerDatos("agenda");
  agenda[dia].splice(index, 1);
  guardarDatos("agenda", agenda);
  mostrarAgenda();
}

// === MOSTRAR INICIO AL CARGAR ===
document.addEventListener('DOMContentLoaded', () => {
  mostrarSeccion('inicio');
});

// ===ABRIR DIA ACTUAL ===
let diaActual = null;

function abrirDiaAgenda(dia) {
  diaActual = dia;
  document.getElementById('titulo-dia').textContent = `Agenda de ${dia}`;
  document.getElementById('detalle-dia').classList.remove('oculto');

  const lista = document.getElementById('lista-dia');
  lista.innerHTML = '';
  const agenda = obtenerDatos('agenda');
  (agenda[dia] || []).forEach((tarea, i) => {
    const li = document.createElement('li');
    li.textContent = tarea;

    const btnEditar = document.createElement('button');
    btnEditar.innerHTML = '✏️';
    btnEditar.onclick = () => {
      const nueva = prompt('Editar tarea:', tarea);
      if (nueva && nueva.trim() !== '') {
        agenda[dia][i] = nueva.trim();
        guardarDatos('agenda', agenda);
        abrirDiaAgenda(dia); // refresca la vista
        mostrarAgenda(); // actualiza resumen semanal
      }
    };

    const btnEliminar = document.createElement('button');
    btnEliminar.innerHTML = '🗑️';
    btnEliminar.onclick = () => {
      if (confirm('¿Eliminar tarea?')) {
        agenda[dia].splice(i, 1);
        guardarDatos('agenda', agenda);
        abrirDiaAgenda(dia);
        mostrarAgenda();
      }
    };

    li.appendChild(btnEditar);
    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

function agregarTareaADiaActual() {
  const texto = document.getElementById('nueva-tarea-dia').value.trim();
  if (!texto || !diaActual) return;
  const agenda = obtenerDatos('agenda');
  agenda[diaActual] ||= [];
  agenda[diaActual].push(texto);
  guardarDatos('agenda', agenda);
  document.getElementById('nueva-tarea-dia').value = '';
  abrirDiaAgenda(diaActual);
  mostrarAgenda();
}

function cerrarDetalleDia() {
  document.getElementById('detalle-dia').classList.add('oculto');
  diaActual = null;
}

