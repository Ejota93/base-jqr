import $ from '../jquery.reactive.es6.js';

export function initRefsNS() {
  // Namespace para este ejemplo (evita colisiones con Demo 7)
  const perfilNs = $.namespace('perfilNs');

  // Recolectar referencias dentro del contenedor de la tarjeta
  const { nombre, label, btnGuardar, item, btnDestacar, estadoNombre, estadoDestacado, guardados } = $.refs('#refs-ns-root');

  // Defaults locales del módulo (silenciosos y no sobreescriben si ya existen)
  perfilNs.ensure({
    nombre: 'Invitado',
    destacado: false,
    guardadoCount: 0,
  });

  // Two-way binding del input nombre dentro del namespace (helper callable)
  perfilNs.nombre(nombre).val();

  // Etiqueta formateada con map() y namespace
  perfilNs.nombre(label)
    .map(n => `PerfilNs: ${n || 'Invitado'}`)
    .text();

  // Mostrar estado crudo (namespaced)
  perfilNs.nombre(estadoNombre).text();

  // Botón Guardar: incrementa contador de guardados en el namespace
  // perfilNs.nombre(btnGuardar)
  //   .on('click', () => perfilNs.guardadoCount.set(c => (c || 0) + 1), { prevent: true })
  //   .watch(c => console.log('Guardado count:', c));
 
  $.events(btnGuardar, 'click', () => perfilNs.guardadoCount.set(c => (c || 0) + 1), { prevent: true });
  
  $.events(btnDestacar, 'click', () => perfilNs.destacado.set(v => !v), { prevent: true });

  // Duplicados: aplicar toggle de clase highlight a todos los elementos con data-ref="item"
  perfilNs.destacado(item).toggleClass('highlight');

  // Botón para alternar el estado de destacado (namespace)
  // perfilNs.destacado(btnDestacar)
  //   // .on('click', () => perfilNs.set('destacado', v => !v), { prevent: true });
  //   .on('click', () => perfilNs.destacado.set(v => !v), { prevent: true });

  // Mostrar estado de destacado (namespaced)
  perfilNs.destacado(estadoDestacado)
    .map(v => v ? 'Destacado' : 'Normal')
    .text();

  // Mostrar contador de guardados (namespaced)
  perfilNs.guardadoCount(guardados).text();
}