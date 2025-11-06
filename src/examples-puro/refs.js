import $ from '../jquery.reactive.es6.js';

export function initRefs() {
  // Recolectar referencias dentro del contenedor de la tarjeta
  const { nombre, label, btnGuardar, item, btnDestacar, estadoNombre, estadoDestacado, guardados } = $.refs('#refs-root');

  // Defaults locales del módulo (silenciosos y no sobreescriben si ya existen)
  $.ensure({
    'refsDemo.nombre': 'Invitado',
    'refsDemo.destacado': false,
    'refsDemo.guardadoCount': 0,
  });

  // Two-way binding del input nombre
  const nombreBinder = nombre.reactive('refsDemo.nombre').val();
  // Normalización con binder.set: si queda vacío, poner "Invitado" (evita bucles con comparación interna)
  nombreBinder.watch(($el, raw) => {
    const norm = String(raw ?? '').trim();
    if (!norm) nombreBinder.set('Invitado');
  }, { mapped: false });

  // Etiqueta formateada con map()
  label.reactive('refsDemo.nombre')
    .map(n => `Nombre: ${n || 'Invitado'}`)
    .text();

  // Mostrar estado crudo
  estadoNombre.reactive('refsDemo.nombre').text();

  // Ejemplo de watcher encadenable sobre la misma clave
  estadoNombre.reactive('refsDemo.nombre').watch(($el, nuevo, viejo) => {
    if (typeof window !== 'undefined' && typeof window.agregarMensajePura === 'function') {
      window.agregarMensajePura(`refsDemo.nombre: ${viejo ?? '∅'} → ${nuevo}`, 'info');
    } else {
      console.log('[refs.watch] refsDemo.nombre:', viejo, '→', nuevo);
    }
  }, { immediate: true });

  // Botón Guardar: incrementa contador de guardados
  btnGuardar.reactive('refsDemo.nombre')
    .on('click', () => {
      $.state('refsDemo.guardadoCount', c => (c || 0) + 1);
    }, { prevent: true });

  // Duplicados: aplicar toggle de clase highlight a todos los elementos con data-ref="item"
  item.reactive('refsDemo.destacado').toggleClass('highlight');

  // Botón para alternar el estado de destacado
  btnDestacar.reactive('refsDemo.destacado')
    .on('click', () => $.state('refsDemo.destacado', v => !v), { prevent: true });

  // Mostrar estado de destacado
  estadoDestacado.reactive('refsDemo.destacado')
    .map(v => v ? 'Destacado' : 'Normal')
    .text();

  // Mostrar contador de guardados
  guardados.reactive('refsDemo.guardadoCount').text();
}