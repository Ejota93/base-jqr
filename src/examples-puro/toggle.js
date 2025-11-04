import $ from '../jquery.reactive.es6.js';

export function initToggle() {
    // Bindeo reactivo
    $('#elemento-toggleable').reactive('visible').show();
    $('#elemento-oculto').reactive('visible').hide();
    $('#estado-visible').reactive('estadoVisible').text();

    // Funciones de control
    window.toggleElemento = function() {
        const visible = $.state('visible');
        $.state({
            visible: !visible,
            estadoVisible: visible ? 'Oculto' : 'Visible'
        });
    }
}