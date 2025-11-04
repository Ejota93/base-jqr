import $ from '../jquery.reactive.es6.js';

export function initCounter() {
  // Modificar el estado con $.state()
  // Esto actualizará automáticamente los elementos del DOM vinculados
  setInterval(() => {
    $.state('count', count => (count || 0) + 1);
  }, 1000);

  // Suscribirse a cambios en el estado (opcional)
  $.watch('count', (newValue, oldValue) => {
    console.log(`[Counter Module] El contador cambió de ${oldValue} a ${newValue}`);
  });
}