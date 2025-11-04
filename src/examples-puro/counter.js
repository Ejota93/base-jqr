import $ from '../jquery.reactive.es6.js';

export function initCounter() {
    // Funciones de control
    window.incrementarContador = function() {
        $.state('contador', $.state('contador') + 1);
    }
    
    window.decrementarContador = function() {
        $.state('contador', $.state('contador') - 1);
    }
    
    window.resetearContador = function() {
        $.state('contador', 0);
    }

    // Bindeo reactivo
    $('#contador-display').reactive('contador').text();
    $('#contador-estado').reactive('contador').text();
}