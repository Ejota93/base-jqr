import Reactive from '../reactive-singleton.js';

// Inicializa el estado global compartido y configuración
window.addEventListener('DOMContentLoaded', () => {
  Reactive.init({
    contador: 0,
    nombre: '',
    tasks: [],
    totalTareas: 0,
  });
  // Puedes activar debug si quieres ver logs
  Reactive.configure({ debug: false });
});
// Inicializar estado global con jQuery (opción jQuery pura)
$(function() {
  $.reactiveInit({
    contador: 0,
    nombre: '',
    tasks: [],
    totalTareas: 0,
  });
});