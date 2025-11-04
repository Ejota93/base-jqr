import $ from '../jquery.reactive.es6.js';

export function initTextInput() {
  // Vincula el input #text-input con la clave 'text' del estado
  $('#text-input').reactive('text');

  $.watch('text', (newValue) => {
    console.log(`[Text Input Module] El texto ahora es: "${newValue}"`);
  });
}