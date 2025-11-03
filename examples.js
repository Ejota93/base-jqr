/**
 * jQuery Reactive State Library - Ejemplos de Uso
 * Ejemplos básicos y avanzados para comenzar a usar la biblioteca
 */

// =====================================================
// EJEMPLOS BÁSICOS
// =====================================================

// 1. Inicializar el sistema
$.reactiveInit({
    contador: 0,
    nombre: 'Usuario',
    visible: true
});

// 2. Obtener valores del estado
const contador = $.state('contador');        // Obtener valor específico
const todoEstado = $.state();                  // Obtener todo el estado

// 3. Actualizar valores del estado
$.state('contador', 5);                        // Actualizar un valor
$.state({                                      // Actualizar múltiples valores
    contador: 10,
    nombre: 'Nuevo Usuario',
    visible: false
});

// 4. Observar cambios
$.watch('contador', function(nuevoValor, valorAnterior, key) {
    console.log(`${key} cambió de ${valorAnterior} a ${nuevoValor}`);
});

// 5. Renderizado manual
$.render('contador');                          // Renderizar estado específico
$.render();                                    // Renderizar todo

// =====================================================
// EJEMPLOS DE HTML CON ESTADO REACTIVO
// =====================================================

/**
 * Ejemplo 1: Contador con botones
 * HTML:
 * <div>
 *     <p>Contador: <span st-text="contador">0</span></p>
 *     <button onclick="$.state('contador', $.state('contador') + 1)">+</button>
 *     <button onclick="$.state('contador', $.state('contador') - 1)">-</button>
 * </div>
 */

/**
 * Ejemplo 2: Formulario reactivo
 * HTML:
 * <form>
 *     <input type="text" st-value="nombre" placeholder="Nombre">
 *     <input type="email" st-value="email" placeholder="Email">
 *     <p>Hola <span st-text="nombre">usuario</span>!</p>
 *     <p>Tu email es: <span st-text="email"></span></p>
 * </form>
 * 
 * JavaScript:
 * $.reactiveInit({
 *     nombre: '',
 *     email: ''
 * });
 */

/**
 * Ejemplo 3: Toggle de visibilidad
 * HTML:
 * <button onclick="$.state('visible', !$.state('visible'))">Toggle</button>
 * <div st-show="visible">
 *     <p>Este elemento aparece/desaparece!</p>
 * </div>
 * 
 * JavaScript:
 * $.reactiveInit({ visible: true });
 */

// =====================================================
// EJEMPLOS AVANZADOS
// =====================================================

// Ejemplo 1: Lista de tareas dinámica
function setupTodoList() {
    $.reactiveInit({
        tareas: [],
        tareasHtml: '',
        totalTareas: 0,
        nuevaTarea: ''
    });
    
    // Observar cambios en las tareas
    $.watch('tareas', function(nuevasTareas) {
        const html = nuevasTareas.map(tarea => 
            `<div class="task">${tarea.texto}</div>`
        ).join('');
        
        $.state({
            tareasHtml: html,
            totalTareas: nuevasTareas.length
        });
    });
}

function agregarTarea(texto) {
    const tareas = $.state('tareas');
    tareas.push({ texto: texto, completada: false });
    $.state('tareas', tareas);
}

// Ejemplo 2: Validación en tiempo real
function setupValidacion() {
    $.reactiveInit({
        email: '',
        esEmailValido: false,
        mensajeValidacion: ''
    });
    
    $.watch('email', function(email) {
        const esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const mensaje = esValido 
            ? '✅ Email válido' 
            : '❌ Email inválido';
        
        $.state({
            esEmailValido: esValido,
            mensajeValidacion: mensaje
        });
    });
}

// Ejemplo 3: Cambio de tema
function setupTema() {
    $.reactiveInit({
        temaOscuro: false,
        claseBody: 'tema-claro'
    });
    
    $.watch('temaOscuro', function(esOscuro) {
        const clase = esOscuro ? 'tema-oscuro' : 'tema-claro';
        $('body').removeClass('tema-claro tema-oscuro').addClass(clase);
        $.state('claseBody', clase);
    });
}

// Ejemplo 4: Loading states
function setupLoading() {
    $.reactiveInit({
        cargando: false,
        mensaje: 'Listo',
        botonDeshabilitado: false
    });
    
    $.watch('cargando', function(estáCargando) {
        $.state({
            mensaje: estáCargando ? 'Cargando...' : 'Listo',
            botonDeshabilitado: estáCargando
        });
    });
}

function simularCarga() {
    $.state('cargando', true);
    
    setTimeout(function() {
        $.state('cargando', false);
    }, 2000);
}

// =====================================================
// CONFIGURACIÓN AVANZADA
// =====================================================

// Configurar opciones personalizadas
$.reactiveConfig({
    prefix: 'data-state-',     // Cambiar prefijo de atributos
    debug: true,               // Activar modo debug
    batchTimeout: 32,        // Cambiar timeout de batch updates
    maxUpdateDepth: 50       // Limitar profundidad de actualizaciones
});

// =====================================================
// MÉTODOS DE ELEMENTO (jQuery chaining)
// =====================================================

// Vincular elementos al estado
$('#miElemento').bindState('mensaje', 'text');      // Texto
$('#miInput').bindState('valor', 'value');         // Valor de input
$('#miDiv').bindState('visible', 'show');         // Mostrar/ocultar
$('#miBoton').bindState('habilitado', 'enabled');  // Habilitar/deshabilitar

// Desvincular elementos
$('#miElemento').unbindState('mensaje');

// =====================================================
// EVENTOS PERSONALIZADOS
// =====================================================

// =====================================================
// EJEMPLO 2: SINTAXIS jQUERY PURA (SIN ATRIBUTOS ST-*)
// =====================================================

/**
 * Ejemplo 2.1: Formulario Reactivo - Estilo jQuery Puro
 * HTML (sin atributos mágicos):
 * <form id="formulario-usuario">
 *     <input type="text" id="nombre-input" placeholder="Tu nombre">
 *     <input type="email" id="email-input" placeholder="Tu email">
 *     <div id="saludo-personalizado"></div>
 *     <div id="validacion-email"></div>
 * </form>
 * 
 * JavaScript:
 */
function ejemploFormularioJQueryPuro() {
    // Inicializar estado
    $.reactiveInit({
        nombre: 'Usuario',
        email: '',
        emailValido: false
    });
    
    $(document).ready(function() {
        // Configurar reactividad con sintaxis jQuery pura
        $('#nombre-input')
            .reactive('nombre')  // Auto-binding bidireccional
            .addClass('form-control')
            .attr('data-campo', 'nombre');
        
        $('#email-input')
            .reactive('email')
            .addClass('form-control')
            .on('blur', function() {
                // Validación adicional al perder foco
                const email = $(this).val();
                const esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                $.state('emailValido', esValido);
            });
        
        // Elementos de salida reactiva
        $('#saludo-personalizado')
            .reactiveText('nombre')
            .addClass('alert alert-info mt-3');
        
        // Validación en tiempo real
        $.watch('email', function(nuevoEmail) {
            const esValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoEmail);
            $.state('emailValido', esValido);
            
            $('#validacion-email')
                .text(esValido ? '✅ Email válido' : '❌ Email inválido')
                .removeClass('text-success text-danger')
                .addClass(esValido ? 'text-success' : 'text-danger');
        });
    });
}

/**
 * Ejemplo 2.2: Lista de Tareas - Estilo jQuery Puro
 * HTML:
 * <div id="app-tareas">
 *     <input type="text" id="nueva-tarea-input" placeholder="Nueva tarea">
 *     <button id="agregar-tarea-btn">Agregar</button>
 *     <ul id="lista-tareas"></ul>
 *     <div id="total-tareas"></div>
 * </div>
 * 
 * JavaScript:
 */
function ejemploListaTareasJQueryPuro() {
    $.reactiveInit({
        tareas: [
            { id: 1, texto: 'Aprender jQuery Reactive', completada: false },
            { id: 2, texto: 'Crear ejemplos', completada: true }
        ],
        nuevaTareaTexto: '',
        totalTareas: 2,
        tareasPendientes: 1
    });
    
    $(document).ready(function() {
        // Input para nueva tarea
        $('#nueva-tarea-input')
            .reactive('nuevaTareaTexto')
            .addClass('form-control')
            .on('keypress', function(e) {
                if (e.which === 13) { // Enter
                    agregarTareaDesdeInput();
                }
            });
        
        // Botón agregar
        $('#agregar-tarea-btn')
            .on('click', agregarTareaDesdeInput)
            .prop('disabled', true); // Deshabilitado inicialmente
        
        // Observar cuando hay texto para habilitar botón
        $.watch('nuevaTareaTexto', function(texto) {
            $('#agregar-tarea-btn').prop('disabled', texto.trim() === '');
        });
        
        // Observar cambios en tareas y actualizar lista
        $.watch('tareas', function(tareas) {
            actualizarListaTareas(tareas);
            actualizarContadores(tareas);
        });
        
        function agregarTareaDesdeInput() {
            const texto = $.state('nuevaTareaTexto');
            if (texto.trim()) {
                const tareas = $.state('tareas');
                const nuevaTarea = {
                    id: Date.now(),
                    texto: texto,
                    completada: false
                };
                tareas.push(nuevaTarea);
                $.state('tareas', tareas);
                $.state('nuevaTareaTexto', ''); // Limpiar input
            }
        }
        
        function actualizarListaTareas(tareas) {
            const $lista = $('#lista-tareas').empty();
            
            tareas.forEach(tarea => {
                const $li = $('<li>')
                    .addClass('tarea-item')
                    .toggleClass('completada', tarea.completada);
                
                const $checkbox = $('<input>')
                    .attr('type', 'checkbox')
                    .prop('checked', tarea.completada)
                    .on('change', function() {
                        toggleTarea(tarea.id);
                    });
                
                const $texto = $('<span>').text(tarea.texto);
                
                const $eliminar = $('<button>')
                    .text('Eliminar')
                    .addClass('btn-eliminar')
                    .on('click', function() {
                        eliminarTarea(tarea.id);
                    });
                
                $li.append($checkbox, $texto, $eliminar);
                $lista.append($li);
            });
        }
        
        function toggleTarea(id) {
            const tareas = $.state('tareas');
            const tarea = tareas.find(t => t.id === id);
            if (tarea) {
                tarea.completada = !tarea.completada;
                $.state('tareas', tareas);
            }
        }
        
        function eliminarTarea(id) {
            const tareas = $.state('tareas');
            const nuevasTareas = tareas.filter(t => t.id !== id);
            $.state('tareas', nuevasTareas);
        }
        
        function actualizarContadores(tareas) {
            const total = tareas.length;
            const pendientes = tareas.filter(t => !t.completada).length;
            
            $('#total-tareas')
                .text(`Total: ${total} | Pendientes: ${pendientes}`)
                .addClass('contador-tareas');
        }
    });
}

/**
 * Ejemplo 2.3: Panel de Control con Temas - Estilo jQuery Puro
 * HTML:
 * <div id="panel-control">
 *     <h1 id="titulo-panel">Panel de Control</h1>
 *     <button id="btn-tema-claro">Tema Claro</button>
 *     <button id="btn-tema-oscuro">Tema Oscuro</button>
 *     <div id="contenido-panel">
 *         <p>Contenido del panel...</p>
 *     </div>
 * </div>
 * 
 * JavaScript:
 */
function ejemploPanelControlJQueryPuro() {
    $.reactiveInit({
        temaActual: 'claro', // 'claro' o 'oscuro'
        tituloPanel: 'Panel de Control',
        mensajeEstado: 'Sistema operativo'
    });
    
    $(document).ready(function() {
        // Título reactivo
        $('#titulo-panel')
            .reactiveText('tituloPanel')
            .addClass('titulo-principal');
        
        // Botones de tema
        $('#btn-tema-claro').on('click', function() {
            $.state('temaActual', 'claro');
        });
        
        $('#btn-tema-oscuro').on('click', function() {
            $.state('temaActual', 'oscuro');
        });
        
        // Observar cambios de tema y aplicar estilos
        $.watch('temaActual', function(nuevoTema) {
            const $panel = $('#panel-control');
            const $botones = $('#btn-tema-claro, #btn-tema-oscuro');
            
            if (nuevoTema === 'oscuro') {
                $panel
                    .removeClass('tema-claro')
                    .addClass('tema-oscuro');
                
                $botones
                    .removeClass('btn-activo')
                    .filter('#btn-tema-oscuro')
                    .addClass('btn-activo');
                
                $.state('mensajeEstado', 'Modo oscuro activado');
            } else {
                $panel
                    .removeClass('tema-oscuro')
                    .addClass('tema-claro');
                
                $botones
                    .removeClass('btn-activo')
                    .filter('#btn-tema-claro')
                    .addClass('btn-activo');
                
                $.state('mensajeEstado', 'Modo claro activado');
            }
        });
        
        // Mensaje de estado reactivo
        $('<div>')
            .attr('id', 'mensaje-estado')
            .reactiveText('mensajeEstado')
            .addClass('mensaje-sistema')
            .appendTo('#panel-control');
        
        // Inicializar con tema claro
        $.state('temaActual', 'claro');
    });
}

/**
 * Ejemplo 2.4: Formulario de Registro Completo - Estilo jQuery Puro
 * HTML:
 * <form id="formulario-registro">
 *     <div class="campo">
 *         <label>Usuario:</label>
 *         <input type="text" id="usuario-registro">
 *         <span id="usuario-validacion"></span>
 *     </div>
 *     <div class="campo">
 *         <label>Contraseña:</label>
 *         <input type="password" id="password-registro">
 *         <span id="password-validacion"></span>
 *     </div>
 *     <div class="campo">
 *         <label>Confirmar Contraseña:</label>
 *         <input type="password" id="confirmar-password">
 *         <span id="confirmar-validacion"></span>
 *     </div>
 *     <button type="submit" id="btn-registrar">Registrar</button>
 *     <div id="formulario-mensaje"></div>
 * </form>
 * 
 * JavaScript:
 */
function ejemploRegistroJQueryPuro() {
    $.reactiveInit({
        usuario: '',
        password: '',
        confirmarPassword: '',
        usuarioValido: false,
        passwordValido: false,
        passwordsCoinciden: false,
        formularioValido: false,
        mensajeFormulario: ''
    });
    
    $(document).ready(function() {
        // Campos del formulario
        $('#usuario-registro')
            .reactive('usuario')
            .addClass('input-registro')
            .on('input', validarUsuario);
        
        $('#password-registro')
            .reactive('password')
            .addClass('input-registro')
            .on('input', validarPasswords);
        
        $('#confirmar-password')
            .reactive('confirmarPassword')
            .addClass('input-registro')
            .on('input', validarPasswords);
        
        // Observar validaciones
        $.watch('usuario', validarUsuario);
        $.watch('password', validarPasswords);
        $.watch('confirmarPassword', validarPasswords);
        
        // Observar formulario completo
        $.watch(['usuarioValido', 'passwordValido', 'passwordsCoinciden'], function() {
            const usuarioValido = $.state('usuarioValido');
            const passwordValido = $.state('passwordValido');
            const passwordsCoinciden = $.state('passwordsCoinciden');
            
            const formularioValido = usuarioValido && passwordValido && passwordsCoinciden;
            $.state('formularioValido', formularioValido);
            
            $('#btn-registrar').prop('disabled', !formularioValido);
        });
        
        // Botón de registro
        $('#btn-registrar')
            .on('click', function(e) {
                e.preventDefault();
                procesarRegistro();
            })
            .prop('disabled', true);
        
        function validarUsuario() {
            const usuario = $.state('usuario');
            const esValido = usuario.length >= 3 && usuario.length <= 20;
            $.state('usuarioValido', esValido);
            
            $('#usuario-validacion')
                .text(esValido ? '✅ Válido' : '❌ Mínimo 3 caracteres')
                .removeClass('valido invalido')
                .addClass(esValido ? 'valido' : 'invalido');
        }
        
        function validarPasswords() {
            const password = $.state('password');
            const confirmar = $.state('confirmarPassword');
            
            const passwordValido = password.length >= 6;
            const passwordsCoinciden = password === confirmar && password !== '';
            
            $.state('passwordValido', passwordValido);
            $.state('passwordsCoinciden', passwordsCoinciden);
            
            $('#password-validacion')
                .text(passwordValido ? '✅ Segura' : '❌ Mínimo 6 caracteres')
                .removeClass('valido invalido')
                .addClass(passwordValido ? 'valido' : 'invalido');
            
            $('#confirmar-validacion')
                .text(passwordsCoinciden ? '✅ Coinciden' : '❌ No coinciden')
                .removeClass('valido invalido')
                .addClass(passwordsCoinciden ? 'valido' : 'invalido');
        }
        
        function procesarRegistro() {
            if ($.state('formularioValido')) {
                $.state('mensajeFormulario', '🎉 Registro exitoso!');
                
                // Simular proceso de registro
                setTimeout(function() {
                    $.state('mensajeFormulario', 'Redirigiendo...');
                }, 1500);
            }
        }
        
        // Mensaje del formulario
        $('#formulario-mensaje')
            .reactiveText('mensajeFormulario')
            .addClass('mensaje-formulario');
    });
}

// Función para inicializar todos los ejemplos
function inicializarEjemplosJQueryPuros() {
    ejemploFormularioJQueryPuro();
    ejemploListaTareasJQueryPuro();
    ejemploPanelControlJQueryPuro();
    ejemploRegistroJQueryPuro();
}

// =====================================================
// USO: Llamar a inicializarEjemplosJQueryPuros() cuando el DOM esté listo
// $(document).ready(inicializarEjemplosJQueryPuros);
// =====================================================

// Escuchar cambios de estado específicos
$(document).on('state:changed:nombre', function(event, nuevoValor, key) {
    console.log('El nombre cambió a:', nuevoValor);
});

// Escuchar todos los cambios de estado
$(document).on('state:changed', function(event, nuevoValor, key) {
    console.log('Estado actualizado:', key, '=', nuevoValor);
});

// Disparar actualizaciones de estado manualmente
$(document).trigger('state:update', ['nombre', 'Nuevo Valor']);

// =====================================================
// MEJORES PRÁCTICAS
// =====================================================

/**
 * 1. Mantener el estado plano y simple
 * ✅ Bien:
 * $.reactiveInit({
 *     usuario: { nombre: 'Juan', edad: 25 },
 *     productos: [],
 *     cargando: false
 * });
 * 
 * ❌ Evitar:
 * $.reactiveInit({
 *     app: {
 *         usuario: {
 *             perfil: {
 *                 datos: { nombre: 'Juan' }
 *             }
 *         }
 *     }
 * });
 */

/**
 * 2. Usar actualizaciones múltiples cuando sea posible
 * ✅ Bien:
 * $.state({
 *     contador: nuevoValor,
 *     ultimaActualizacion: new Date()
 * });
 * 
 * ❌ Evitar:
 * $.state('contador', nuevoValor);
 * $.state('ultimaActualizacion', new Date());
 */

/**
 * 3. Limpiar suscripciones cuando ya no sean necesarias
 * const unsubscribe = $.watch('estado', callback);
 * // Cuando ya no sea necesario
 * unsubscribe();
 */

/**
 * 4. Usar renderizado manual para mejorar rendimiento
 * // Desactivar auto-render para operaciones masivas
 * $.ReactiveState._autoRender = false;
 * 
 * // Realizar muchas actualizaciones
 * for (let i = 0; i < 1000; i++) {
 *     $.state(`item_${i}`, i);
 * }
 * 
 * // Reactivar y renderizar todo
 * $.ReactiveState._autoRender = true;
 * $.render();
 */

// =====================================================
// EJEMPLO COMPLETO: APLICACIÓN DE CONTADOR
// =====================================================

function crearAplicacionContador() {
    // Inicializar estado
    $.reactiveInit({
        contador: 0,
        historial: [],
        puedeDeshacer: false
    });
    
    // HTML:
    // <div id="app-contador">
    //     <h2>Contador: <span st-text="contador">0</span></h2>
    //     <button onclick="incrementar()">+1</button>
    //     <button onclick="decrementar()">-1</button>
    //     <button onclick="deshacer()" st-enabled="puedeDeshacer">Deshacer</button>
    //     <div st-html="historialHtml"></div>
    // </div>
    
    // Observar cambios
    $.watch('contador', function(nuevo, anterior) {
        if (anterior !== undefined) {
            const historial = $.state('historial');
            historial.push({ de: anterior, a: nuevo });
            
            // Limitar historial a 10 elementos
            if (historial.length > 10) {
                historial.shift();
            }
            
            $.state({
                historial: historial,
                puedeDeshacer: historial.length > 0
            });
            
            actualizarHistorialHtml();
        }
    });
    
    // Funciones de la aplicación
    window.incrementar = function() {
        $.state('contador', $.state('contador') + 1);
    };
    
    window.decrementar = function() {
        $.state('contador', $.state('contador') - 1);
    };
    
    window.deshacer = function() {
        const historial = $.state('historial');
        if (historial.length > 0) {
            const ultimo = historial[historial.length - 1];
            $.state('contador', ultimo.de);
            historial.pop();
            
            $.state({
                historial: historial,
                puedeDeshacer: historial.length > 0
            });
            
            actualizarHistorialHtml();
        }
    };
    
    function actualizarHistorialHtml() {
        const historial = $.state('historial');
        const html = historial.map(item => 
            `<div>${item.de} → ${item.a}</div>`
        ).join('');
        
        // Actualizar HTML del historial (necesitaría un elemento con st-html="historialHtml")
        // $.state('historialHtml', html);
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        crearAplicacionContador,
        setupTodoList,
        setupValidacion,
        setupTema,
        setupLoading
    };
}