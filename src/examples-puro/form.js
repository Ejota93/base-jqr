import $ from '../jquery.reactive.es6.js';

export function initForm() {
    // Bindeo reactivo bidireccional
    $('#input-nombre').reactive('nombre').val();
    $('#nombre-span').reactive('nombre').text();
    $('#input-email').reactive('email').val();
    $('#email-span').reactive('email').text();
    $('#input-edad').reactive('edad').val();
    $('#edad-span').reactive('edad').text();
}