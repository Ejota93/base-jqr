import $ from '../jquery.reactive.es6.js';

// Módulo de demostración: Namespaces para estado con prefijo
// Encapsula la configuración y bindings del namespace 'perfil'
export function initNamespaces() {
  // Crear helper de namespace para 'perfil' y asegurar defaults sin colisiones
  const perfil = $.namespace('perfil');
  // Añadir valor por defecto solo si no existe (silencioso por defecto)
  perfil.ensure({ nombre: 'Invitado' });

  // Watch para mostrar cambios de nombre en la consola de la demo si está disponible
  perfil.watch('nombre', function(newVal, oldVal) {
    const from = (oldVal == null ? 'Invitado' : oldVal);
    const msg = `Nombre cambiado: ${from} → ${newVal}`;
    if (typeof window !== 'undefined' && typeof window.agregarMensajePura === 'function') {
      window.agregarMensajePura(msg, 'info');
    } else {
      console.log('[Namespaces]', msg);
    }
  });

  // Wiring imperativo de los elementos de la tarjeta de Namespaces
  const $nsInput = $('#ns-input-nombre');
  const $nsSpan = $('#ns-nombre-span');
  if ($nsInput.length) {
    $nsInput.reactive(perfil.k('nombre')).val();
  }
  if ($nsSpan.length) {
    $nsSpan.reactive(perfil.k('nombre')).text();
  }
}