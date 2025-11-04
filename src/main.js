import $ from './jquery.reactive.es6.js';

$(function() {
  console.log('DOM listo y jQuery reactivo funcionando!');

  // 1. Inicializar el estado global
  $.reactiveInit({
    count: 0,
    text: 'Hola Mundo',
    visible: true,
    color: '#000000'
  });

  // 2. Ejemplo de Two-Way Data Binding con .reactive()
  // Vincula el input #text-input con la clave 'text' del estado
  $('#text-input').reactive('text');

  // 3. Suscribirse a cambios en el estado (opcional)
  $.watch('count', (newValue, oldValue) => {
    console.log(`El contador cambió de ${oldValue} a ${newValue}`);
  });

  // 4. Modificar el estado con $.state()
  // Esto actualizará automáticamente los elementos del DOM vinculados
  setInterval(() => {
    $.state('count', count => count + 1);
  }, 1000);

  setInterval(() => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    $.state('color', randomColor);
  }, 2000);
});