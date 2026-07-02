/* =====================================================================
   APLICACIÓN DE GESTIÓN DE ESTUDIANTES
   Todo el estado de la aplicación vive en un arreglo de objetos en
   memoria (sin base de datos, sin frameworks). Cada estudiante es un
   objeto con la forma:
   {
     documento: "1098765432",
     nombre: "María Fernanda Ríos",
     programa: "Ingeniería de Sistemas",
     nota1: 4.5, nota2: 3.8, nota3: 4.0,
     definitiva: 4.1,
     estado: "Aprobado"
   }
   ===================================================================== */

// ---------------------------------------------------------------------
// 1. VARIABLES A UTILIZAR EN NUESTRO DESARROLLO
// ---------------------------------------------------------------------

// Arreglo principal que almacena todos los estudiantes registrados.
let estudiantes = [];

// Nota mínima para considerar un estudiante "Aprobado" (escala 0.0 - 5.0).
const NOTA_APROBATORIA = 3.0;

// ---------------------------------------------------------------------
// 2. REFERENCIAS DE LAS VARIABLES A UTILIZAR EL DOM (DOCUMENT OBJECT MODEL)
// Se agrupan aquí para no repetir document.getElementById por todo el archivo.
// ---------------------------------------------------------------------
const form = document.getElementById('formEstudiante');
const campoModoEdicion = document.getElementById('modoEdicion');

const campoDocumento = document.getElementById('documento');
const campoNombre = document.getElementById('nombre');
const campoPrograma = document.getElementById('programa');
const campoNota1 = document.getElementById('nota1');
const campoNota2 = document.getElementById('nota2');
const campoNota3 = document.getElementById('nota3');

const ayudaDocumento = document.getElementById('ayudaDocumento');
const ayudaNombre = document.getElementById('ayudaNombre');
const ayudaPrograma = document.getElementById('ayudaPrograma');
const ayudaNotas = document.getElementById('ayudaNotas');

const previaDefinitiva = document.getElementById('previaDefinitiva');
const previaEstado = document.getElementById('previaEstado');

const mensajeFormulario = document.getElementById('mensajeFormulario');
const botonGuardar = document.getElementById('botonGuardar');
const botonCancelar = document.getElementById('botonCancelar');

const cuerpoTabla = document.getElementById('cuerpoTabla');
const tablaVacia = document.getElementById('tablaVacia');
const contadorEstudiantes = document.getElementById('contadorEstudiantes');

const campoBuscarDocumento = document.getElementById('buscarDocumento');
const botonBuscar = document.getElementById('botonBuscar');
const botonLimpiarBusqueda = document.getElementById('botonLimpiarBusqueda');
const mensajeBusqueda = document.getElementById('mensajeBusqueda');

// Referencias usadas para la navegación tipo "portal" entre páginas.
const encabezadoApp = document.getElementById('encabezadoApp');
const botonIngresar = document.getElementById('botonIngresar');
const botonVolverPortada = document.getElementById('botonVolverPortada');

// ---------------------------------------------------------------------
// 3. NAVEGACIÓN ENTRE PÁGINAS (PORTADA → MENÚ → FORMULARIO / LISTADO)
// La aplicación es de una sola página HTML, pero se comporta como un
// portal de varias páginas: cada "vista" es una sección que se muestra
// u oculta con el atributo hidden, sin recargar el navegador.
// ---------------------------------------------------------------------
const vistas = {
  portada: document.getElementById('vistaPortada'),
  menu: document.getElementById('vistaMenu'),
  formulario: document.getElementById('vistaFormulario'),
  listado: document.getElementById('vistaListado'),
};

/**
 * Muestra únicamente la vista solicitada y oculta el resto.
 * El encabezado de la aplicación solo aparece fuera de la portada.
 */
function mostrarVista(nombre) {
  Object.entries(vistas).forEach(([clave, seccion]) => {
    seccion.hidden = clave !== nombre;
  });
  encabezadoApp.hidden = nombre === 'portada';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Botón de la portada: entra al portal mostrando el menú principal.
botonIngresar.addEventListener('click', function () {
  mostrarVista('menu');
});

// Botón del menú: regresa a la portada.
botonVolverPortada.addEventListener('click', function () {
  mostrarVista('portada');
});

// Todos los botones marcados con data-destino (volver al menú, ir al
// formulario, ir al listado) comparten la misma lógica de navegación.
document.querySelectorAll('[data-destino]').forEach((boton) => {
  boton.addEventListener('click', function () {
    mostrarVista(boton.dataset.destino);
  });
});

// ---------------------------------------------------------------------
// 4. FUNCIONES DE CÁLCULO
// ---------------------------------------------------------------------

/**
 * Calcula la nota definitiva como el promedio simple de las 3 notas.
 * Se redondea a 1 decimal para que se vea limpio en la tabla.
 */
function calcularDefinitiva(nota1, nota2, nota3) {
  const promedio = (nota1 + nota2 + nota3) / 3;
  return Math.round(promedio * 10) / 10;
}

/**
 * Determina el estado académico según la nota definitiva.
 * Regla de negocio: Aprobado si la definitiva es >= 3.0, Reprobado en otro caso.
 */
function calcularEstado(definitiva) {
  return definitiva >= NOTA_APROBATORIA ? 'Aprobado' : 'Reprobado';
}

// ---------------------------------------------------------------------
// 5. VALIDACIONES
// Cada función de validación devuelve un mensaje de error (string) o
// una cadena vacía "" si el campo es válido. Esto facilita mostrar el
// error específico junto a cada campo.
// ---------------------------------------------------------------------

const SOLO_DIGITOS = /^\d+$/;
const NUMERO_DECIMAL = /^\d+(\.\d+)?$/;

function validarDocumento(valor, documentoOriginal) {
  if (valor.trim() === '') return 'El documento es obligatorio.';
  if (!SOLO_DIGITOS.test(valor.trim())) return 'El documento solo debe contener números.';

  // Si estamos editando, el propio documento del estudiante no cuenta como duplicado.
  const yaExiste = estudiantes.some(
    (est) => est.documento === valor.trim() && est.documento !== documentoOriginal
  );
  if (yaExiste) return 'Ya existe un estudiante con ese documento.';

  return '';
}

function validarTexto(valor, nombreCampo) {
  if (valor.trim() === '') return `${nombreCampo} es obligatorio.`;
  return '';
}

function validarNota(valor, etiqueta) {
  if (String(valor).trim() === '') return `${etiqueta} es obligatoria.`;
  if (!NUMERO_DECIMAL.test(String(valor).trim())) return `${etiqueta} solo debe contener números.`;

  const numero = parseFloat(valor);
  if (numero < 0 || numero > 5) return `${etiqueta} debe estar entre 0 y 5.`;
  return '';
}

/**
 * Limpia los textos de ayuda de error y los regresa a su estado neutro.
 */
function limpiarErrores() {
  [ayudaDocumento, ayudaNombre, ayudaPrograma, ayudaNotas].forEach((el) => {
    el.classList.remove('error');
  });
  ayudaDocumento.textContent = 'Solo números. No se puede repetir ni editar luego.';
  ayudaNombre.textContent = '';
  ayudaPrograma.textContent = '';
  ayudaNotas.textContent = 'Cada nota debe estar entre 0.0 y 5.0.';
  mensajeFormulario.textContent = '';
  mensajeFormulario.className = 'mensaje-formulario';
}

/**
 * Valida el formulario completo. Si hay errores, los pinta junto a cada
 * campo y devuelve null. Si todo es válido, devuelve un objeto limpio
 * con los datos listos para guardar.
 */
function validarFormulario() {
  limpiarErrores();

  const documentoOriginal = campoModoEdicion.value; // vacío si es un registro nuevo
  const documento = campoDocumento.value;
  const nombre = campoNombre.value;
  const programa = campoPrograma.value;
  const nota1 = campoNota1.value;
  const nota2 = campoNota2.value;
  const nota3 = campoNota3.value;

  let huboError = false;

  const errorDocumento = validarDocumento(documento, documentoOriginal);
  if (errorDocumento) {
    ayudaDocumento.textContent = errorDocumento;
    ayudaDocumento.classList.add('error');
    huboError = true;
  }

  const errorNombre = validarTexto(nombre, 'El nombre');
  if (errorNombre) {
    ayudaNombre.textContent = errorNombre;
    ayudaNombre.classList.add('error');
    huboError = true;
  }

  const errorPrograma = validarTexto(programa, 'El programa académico');
  if (errorPrograma) {
    ayudaPrograma.textContent = errorPrograma;
    ayudaPrograma.classList.add('error');
    huboError = true;
  }

  const errorNota1 = validarNota(nota1, 'La nota 1');
  const errorNota2 = validarNota(nota2, 'La nota 2');
  const errorNota3 = validarNota(nota3, 'La nota 3');
  const errorNotas = errorNota1 || errorNota2 || errorNota3;
  if (errorNotas) {
    ayudaNotas.textContent = errorNotas;
    ayudaNotas.classList.add('error');
    huboError = true;
  }

  if (huboError) {
    mensajeFormulario.textContent = 'Revisa los campos resaltados antes de continuar.';
    mensajeFormulario.classList.add('error');
    return null;
  }

  return {
    documento: documento.trim(),
    nombre: nombre.trim(),
    programa: programa.trim(),
    nota1: parseFloat(nota1),
    nota2: parseFloat(nota2),
    nota3: parseFloat(nota3),
  };
}

// ---------------------------------------------------------------------
// 6. VISTA PREVIA EN VIVO DE LA NOTA DEFINITIVA
// Mientras el usuario escribe las notas, mostramos el cálculo en tiempo
// real para que sepa qué va a quedar guardado, sin esperar al envío.
// ---------------------------------------------------------------------
function actualizarVistaPrevia() {
  const n1 = parseFloat(campoNota1.value);
  const n2 = parseFloat(campoNota2.value);
  const n3 = parseFloat(campoNota3.value);

  if (Number.isNaN(n1) || Number.isNaN(n2) || Number.isNaN(n3)) {
    previaDefinitiva.textContent = '—';
    previaEstado.textContent = 'Sin calcular';
    previaEstado.className = 'estado-pill';
    return;
  }

  const definitiva = calcularDefinitiva(n1, n2, n3);
  const estado = calcularEstado(definitiva);

  previaDefinitiva.textContent = definitiva.toFixed(1);
  previaEstado.textContent = estado;
  previaEstado.className = 'estado-pill ' + (estado === 'Aprobado' ? 'aprobado' : 'reprobado');
}

[campoNota1, campoNota2, campoNota3].forEach((campo) => {
  campo.addEventListener('input', actualizarVistaPrevia);
});

// ---------------------------------------------------------------------
// 7. RENDERIZADO DE LA TABLA
// ---------------------------------------------------------------------

/**
 * Dibuja en el <tbody> la lista de estudiantes recibida.
 * Se usa tanto para mostrar todos los registros como para mostrar
 * resultados filtrados por la búsqueda.
 */
function renderizarTabla(lista) {
  cuerpoTabla.innerHTML = ''; // limpiamos antes de volver a dibujar

  tablaVacia.style.display = lista.length === 0 ? 'block' : 'none';

  lista.forEach((est) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td class="documento">${escaparHTML(est.documento)}</td>
      <td>${escaparHTML(est.nombre)}</td>
      <td>${escaparHTML(est.programa)}</td>
      <td class="definitiva">${est.definitiva.toFixed(1)}</td>
      <td><span class="estado-pill ${est.estado === 'Aprobado' ? 'aprobado' : 'reprobado'}">${est.estado}</span></td>
      <td>
        <menu class="acciones-fila">
          <li><button type="button" class="boton boton--secundario boton--pequeno" data-accion="editar" data-documento="${escaparHTML(est.documento)}">Editar</button></li>
          <li><button type="button" class="boton boton--peligro boton--pequeno" data-accion="eliminar" data-documento="${escaparHTML(est.documento)}">Eliminar</button></li>
        </menu>
      </td>
    `;

    cuerpoTabla.appendChild(fila);
  });

  contadorEstudiantes.textContent =
    estudiantes.length === 1 ? '1 estudiante registrado' : `${estudiantes.length} estudiantes registrados`;
}

/**
 * Previene inyección de HTML al imprimir datos del usuario en la tabla.
 */
function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ---------------------------------------------------------------------
// 8. REGISTRO Y EDICIÓN (mismo formulario, dos modos)
// ---------------------------------------------------------------------

form.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const datos = validarFormulario();
  if (!datos) return; // hubo errores, ya se mostraron en pantalla

  const definitiva = calcularDefinitiva(datos.nota1, datos.nota2, datos.nota3);
  const estado = calcularEstado(definitiva);

  const documentoEnEdicion = campoModoEdicion.value;

  if (documentoEnEdicion) {
    // --- MODO EDICIÓN: actualizamos el estudiante existente ---
    const indice = estudiantes.findIndex((est) => est.documento === documentoEnEdicion);
    if (indice !== -1) {
      estudiantes[indice] = {
        ...estudiantes[indice], // conserva el documento original
        nombre: datos.nombre,
        programa: datos.programa,
        nota1: datos.nota1,
        nota2: datos.nota2,
        nota3: datos.nota3,
        definitiva,
        estado,
      };
    }
    mostrarMensajeExito('Estudiante actualizado correctamente.');
    salirModoEdicion();
    renderizarTabla(estudiantes);
    mostrarVista('listado'); // tras editar, regresamos al listado para ver el cambio
    return;
  } else {
    // --- MODO REGISTRO: agregamos un nuevo estudiante al arreglo ---
    estudiantes.push({
      documento: datos.documento,
      nombre: datos.nombre,
      programa: datos.programa,
      nota1: datos.nota1,
      nota2: datos.nota2,
      nota3: datos.nota3,
      definitiva,
      estado,
    });
    mostrarMensajeExito('Estudiante registrado correctamente.');
    form.reset();
    actualizarVistaPrevia();
  }

  renderizarTabla(estudiantes);
});

function mostrarMensajeExito(texto) {
  mensajeFormulario.textContent = texto;
  mensajeFormulario.classList.add('exito');
}

/**
 * Pone el formulario en "modo edición": rellena los campos con los
 * datos del estudiante seleccionado y bloquea el documento (no editable).
 */
function entrarModoEdicion(documento) {
  const estudiante = estudiantes.find((est) => est.documento === documento);
  if (!estudiante) return;

  limpiarErrores();
  campoModoEdicion.value = estudiante.documento;

  campoDocumento.value = estudiante.documento;
  campoDocumento.readOnly = true; // el documento no se puede modificar

  campoNombre.value = estudiante.nombre;
  campoPrograma.value = estudiante.programa;
  campoNota1.value = estudiante.nota1;
  campoNota2.value = estudiante.nota2;
  campoNota3.value = estudiante.nota3;

  actualizarVistaPrevia();

  botonGuardar.textContent = 'Guardar cambios';
  botonCancelar.hidden = false;

  // Llevamos al usuario a la página del formulario para que vea que está editando.
  mostrarVista('formulario');
}

/**
 * Saca el formulario del modo edición y lo deja listo para un registro nuevo.
 */
function salirModoEdicion() {
  campoModoEdicion.value = '';
  campoDocumento.readOnly = false;
  botonGuardar.textContent = 'Registrar estudiante';
  botonCancelar.hidden = true;
  form.reset();
  actualizarVistaPrevia();
}

botonCancelar.addEventListener('click', function () {
  const documentoEnEdicion = campoModoEdicion.value;
  salirModoEdicion();
  mensajeFormulario.textContent = 'Edición cancelada.';
  mensajeFormulario.className = 'mensaje-formulario';
  if (documentoEnEdicion) {
    mostrarVista('listado'); // si se canceló una edición, regresamos al listado
  }
});

// ---------------------------------------------------------------------
// 9. ELIMINACIÓN
// ---------------------------------------------------------------------
function eliminarEstudiante(documento) {
  const estudiante = estudiantes.find((est) => est.documento === documento);
  if (!estudiante) return;

  const confirmado = confirm(`¿Eliminar al estudiante ${estudiante.nombre} (documento ${documento})?`);
  if (!confirmado) return;

  estudiantes = estudiantes.filter((est) => est.documento !== documento);

  // Si justo se estaba editando al estudiante eliminado, salimos del modo edición.
  if (campoModoEdicion.value === documento) {
    salirModoEdicion();
  }

  renderizarTabla(estudiantes);
}

// Delegación de eventos: en vez de poner un listener por cada botón de la
// tabla (que se regenera todo el tiempo), escuchamos los clics en el
// <tbody> y revisamos qué botón se presionó.
cuerpoTabla.addEventListener('click', function (evento) {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const documento = boton.dataset.documento;

  if (boton.dataset.accion === 'editar') {
    entrarModoEdicion(documento);
  } else if (boton.dataset.accion === 'eliminar') {
    eliminarEstudiante(documento);
  }
});

// ---------------------------------------------------------------------
// 10. BÚSQUEDA POR DOCUMENTO
// ---------------------------------------------------------------------
function buscarPorDocumento() {
  const termino = campoBuscarDocumento.value.trim();

  if (termino === '') {
    mensajeBusqueda.textContent = '';
    renderizarTabla(estudiantes);
    return;
  }

  // Búsqueda flexible: coincide si el documento contiene el término escrito.
  const resultados = estudiantes.filter((est) => est.documento.includes(termino));

  mensajeBusqueda.textContent =
    resultados.length === 0
      ? `No se encontró ningún estudiante con el documento "${termino}".`
      : `${resultados.length} resultado(s) para "${termino}".`;

  renderizarTabla(resultados);
}

botonBuscar.addEventListener('click', buscarPorDocumento);

// Permite buscar también presionando Enter dentro del campo de búsqueda.
campoBuscarDocumento.addEventListener('keyup', function (evento) {
  if (evento.key === 'Enter') buscarPorDocumento();
});

botonLimpiarBusqueda.addEventListener('click', function () {
  campoBuscarDocumento.value = '';
  mensajeBusqueda.textContent = '';
  renderizarTabla(estudiantes);
});

// ---------------------------------------------------------------------
// 11. INICIALIZACIÓN
// ---------------------------------------------------------------------
renderizarTabla(estudiantes);
actualizarVistaPrevia();