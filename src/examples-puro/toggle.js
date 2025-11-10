import $ from '../jquery.reactive.es6.js';

export function initToggle() {
    // Bindeo reactivo
    $('#elemento-toggleable').reactive('visible').show();
    $('#elemento-oculto').reactive('visible').hide();
    $('#estado-visible').reactive('estadoVisible').text();

    // Estado derivado: etiqueta de visibilidad
    $.computed('estadoVisible', ['visible'], (v) => v ? 'Visible' : 'Oculto');

    // Funciones de control
    window.toggleElemento = function() {
        // Usa updater function para invertir el estado
        $.state('visible', prev => !prev);
    }
}