/**
 * jQuery Reactive State Library
 * Biblioteca mini de estado reactivo para jQuery con API imperativa
 * @version 1.0.0
 * @author jQuery Reactive Team
 *
 * Objetivo
 * - Proveer un almacén de estado centralizado (clave-valor) con suscripciones.
 * - Renderizar automáticamente cambios en el DOM usando dos estilos:
 *   1) Atributos declarativos `st-*` (p.ej. `st-text="count"`, `st-css-color="color"`).
 *   2) API jQuery pura (p.ej. `$(el).reactiveText('count')`).
 *
 * Dos formas de uso
 * 1) Atributos `st-*` (declarativo):
 *    - HTML:
 *      <span st-text="count"></span>
 *      <input st-value="count" type="number" />
 *    - JS:
 *      $.reactiveInit({ count: 0 })
 *      $.state('count', 5)            // actualiza y re-renderiza
 *      $.watch('count', (n, o) => console.log('count', o, '->', n))
 *
 * 2) jQuery puro (imperativo):
 *    - HTML:
 *      <span id="counter"></span>
 *      <input id="countInput" type="number" />
 *    - JS:
 *      $.reactiveInit({ count: 0 })
 *      $('#counter').reactiveText('count')
 *      $('#countInput').reactive('count') // two-way binding
 *
 * Conceptos clave
 * - Almacén de estado: objeto plano de claves.
 * - Suscripciones: callbacks por clave que se disparan cuando cambia el valor.
 * - Renderizado: al cambiar una clave, se actualizan los elementos enlazados.
 * - Batching: los renders se agrupan usando un pequeño timeout (~16ms) para evitar jank.
 *
 * Buenas prácticas y rendimiento
 * - Evita realizar setState en bucles apretados; usa `setStates` para cambios múltiples.
 * - El escaneo dinámico de atributos genéricos (bloque `'*'`) es conveniente pero más costoso.
 *   Prefiere los selectores específicos (`[st-text="key"]`) cuando sea posible.
 * - Activa `debug: true` para depuración de cambios.
 *
 * Ejemplo completo (atributos `st-*`):
 *   $.reactiveInit({ count: 0, visible: true, color: '#f00' })
 *   $('[st-text="count"]').text('0') // render inicial automático
 *   $.state('count', 1) // actualiza el texto
 *
 * Ejemplo completo (jQuery puro):
 *   $.reactiveInit({ msg: 'Hola' })
 *   $('#title').reactiveText('msg')
 *   $.state('msg', 'Mundo') // actualiza #title
 */

(function($) {
    'use strict';

    /**
     * ReactiveState: núcleo de la librería.
     * Mantiene:
     * - `_states`: estado global clave-valor.
     * - `_subscriptions`: lista de callbacks por clave.
     * - `_updateQueue`: claves pendientes de render.
     * - flags de render: `_isUpdating`, `_autoRender`, `_batchMode`.
     * - `config`: prefijo de atributos y parámetros de rendimiento.
     */
    // Centralized state storage
    const ReactiveState = {
        // State storage
        _states: {},
        
        // Subscriptions storage
        _subscriptions: {},
        
        // Batch update queue
        _updateQueue: [],
        
        // Rendering flags
        _isUpdating: false,
        _autoRender: true,
        _batchMode: false,
        
        // Configuration
        config: {
            /** Prefijo para atributos declarativos, por defecto 'st-' */
            prefix: 'st-',
            /** Si true, loguea cambios en consola */
            debug: false,
            /** Timeout de batching (~60fps) para agrupar renders */
            batchTimeout: 16, // ~60fps
            /** Profundidad máxima de actualizaciones anidadas (protección) */
            maxUpdateDepth: 100,
            /** Permite usar updater functions en $.state('key', prev => next) */
            allowUpdaterFn: true
        },
        
        /**
         * Inicializa el estado global.
         * @param {Object} [initialState={}] Estado inicial por clave.
         * @returns {ReactiveState} this
         */
        init: function(initialState = {}) {
            this._states = { ...initialState };
            this._subscriptions = {};
            this._updateQueue = [];
            this._isUpdating = false;
            return this;
        },
        
        /**
         * Obtiene el estado por clave o todo el objeto si no se pasa clave.
         * @param {string} [key] Clave opcional.
         * @returns {*} Valor de la clave o copia del estado completo.
         */
        getState: function(key) {
            if (key === undefined) {
                return { ...this._states };
            }
            return this._states[key];
        },
        
        /**
         * Establece el valor de una clave y notifica suscripciones.
         * No re-renderiza si `silent` es true.
         * @param {string} key Clave de estado.
         * @param {*} value Nuevo valor.
         * @param {boolean} [silent=false] Si true, no dispara suscripciones.
         * @returns {ReactiveState} this
         */
        setState: function(key, value, silent = false) {
            const oldValue = this._states[key];
            
            // Evitar renders si no hay cambio
            if (oldValue === value) {
                return this;
            }
            
            // Actualiza estado
            this._states[key] = value;
            
            // Log de depuración
            if (this.config.debug) {
                console.log(`[ReactiveState] ${key}:`, oldValue, '->', value);
            }
            
            // Dispara suscripciones
            if (!silent) {
                this._triggerSubscriptions(key, value, oldValue);
            }
            
            return this;
        },
        
        /**
         * Establece múltiples claves en batch.
         * Agrupa las suscripciones y el renderizado en una sola pasada.
         * @param {Object} states Objeto clave-valor a aplicar.
         * @param {boolean} [silent=false] Si true, no notifica.
         * @returns {ReactiveState} this
         */
        setStates: function(states, silent = false) {
            this._batchMode = true;
            const changedKeys = [];
            
            for (const [key, value] of Object.entries(states)) {
                const oldValue = this._states[key];
                if (oldValue !== value) {
                    this._states[key] = value;
                    changedKeys.push(key);
                }
            }
            
            if (!silent && changedKeys.length > 0) {
                // Procesa todas las suscripciones en bloque
                this._processBatchUpdate(changedKeys);
            }
            
            this._batchMode = false;
            return this;
        },
        
        /**
         * Suscribe un callback a cambios de una clave.
         * @param {string} key Clave a observar.
         * @param {Function} callback (newValue, oldValue, key) => void
         * @returns {Function} unsubscribe() para quitar la suscripción.
         */
        subscribe: function(key, callback) {
            if (!this._subscriptions[key]) {
                this._subscriptions[key] = [];
            }
            // Valida callback
            if (typeof callback !== 'function') {
                if (this.config.debug) {
                    console.warn(`[ReactiveState] Ignoring subscription: callback is not a function for key '${key}'`, callback);
                }
                // No-op unsubscribe
                return () => {};
            }
            this._subscriptions[key].push(callback);
            
            // Retorna función para desuscribir
            return () => {
                const index = this._subscriptions[key].indexOf(callback);
                if (index > -1) {
                    this._subscriptions[key].splice(index, 1);
                }
            };
        },
        
        /**
         * Dispara los callbacks suscritos a una clave.
         * También programa render si el auto-render está activo.
         * @private
         * @param {string} key
         * @param {*} newValue
         * @param {*} oldValue
         */
        _triggerSubscriptions: function(key, newValue, oldValue) {
            const subs = this._subscriptions[key];
            if (Array.isArray(subs) && subs.length > 0) {
                // Limpia entradas inválidas antes de disparar
                this._subscriptions[key] = subs.filter(cb => typeof cb === 'function');
                this._subscriptions[key].forEach(cb => {
                    try {
                        cb(newValue, oldValue, key);
                    } catch (error) {
                        console.error(`[ReactiveState] Error in subscription for ${key}:`, error);
                    }
                });
            }
            
            // Auto-render si está habilitado y no estamos en modo batch
            if (this._autoRender && !this._batchMode) {
                this.queueRender(key);
            }
        },
        
        /**
         * Procesa suscripciones en lote y programa render de todas las claves cambiadas.
         * @private
         * @param {string[]} changedKeys Claves que cambiaron.
         */
        _processBatchUpdate: function(changedKeys) {
            // Dispara todas las suscripciones
            changedKeys.forEach(key => {
                this._triggerSubscriptions(key, this._states[key], undefined);
            });
            
            // Programa render de todas
            if (this._autoRender) {
                changedKeys.forEach(key => this.queueRender(key));
            }
        },
        
        /**
         * Encola una clave para renderizado.
         * No encola duplicados.
         * @param {string} key
         */
        queueRender: function(key) {
            if (this._updateQueue.indexOf(key) === -1) {
                this._updateQueue.push(key);
            }
            
            if (!this._isUpdating) {
                this._scheduleRender();
            }
        },
        
        /**
         * Programa el procesamiento de la cola de render con batching.
         * Usa `setTimeout(batchTimeout)` para agrupar múltiples actualizaciones.
         * @private
         */
        _scheduleRender: function() {
            if (this._updateQueue.length === 0) return;
            
            this._isUpdating = true;
            
            setTimeout(() => {
                this._processRenderQueue();
                this._isUpdating = false;
            }, this.config.batchTimeout);
        },
        
        /**
         * Procesa la cola de claves a renderizar.
         * @private
         */
        _processRenderQueue: function() {
            const queue = [...this._updateQueue];
            this._updateQueue = [];
            
            queue.forEach(key => {
                this._updateDOM(key);
            });
        },
        
        /**
         * Actualiza el DOM para una clave dada.
         * Soporta:
         * - Estilo `st-<key>="text|html|value|class|show|hide|enabled|disabled|attr-*|prop-*|css-*|data-*"`.
         * - Estilo vinculante `st-text="key"`, `st-css-color="key"`, etc.
         * - Escaneo genérico de todos los atributos `st-*` (más costoso).
         * Dispara el evento `state:changed:<key>` en `document`.
         * @private
         * @param {string} key Clave a renderizar.
         */
        _updateDOM: function(key) {
            const value = this._states[key];
            const prefix = this.config.prefix;
            
            // Estilo: atributo específico por clave (p.ej. <span st-count="text">)
            $(`[${prefix}${key}]`).each(function() {
                const $el = $(this);
                const attr = $el.attr(`${prefix}${key}`);
                
                switch (attr) {
                    case 'text':
                        $el.text(value);
                        break;
                    case 'html':
                        $el.html(value);
                        break;
                    case 'value':
                        $el.val(value);
                        break;
                    case 'class':
                        $el.attr('class', value);
                        break;
                    case 'show':
                        $el.toggle(value);
                        break;
                    case 'hide':
                        $el.toggle(!value);
                        break;
                    case 'enabled':
                        $el.prop('disabled', !value);
                        break;
                    case 'disabled':
                        $el.prop('disabled', value);
                        break;
                    default:
                        // Atributos genéricos
                        if (attr && attr.startsWith('attr-')) {
                            const attrName = attr.substring(5);
                            $el.attr(attrName, value);
                        } else if (attr && attr.startsWith('prop-')) {
                            const propName = attr.substring(5);
                            $el.prop(propName, value);
                        } else if (attr && attr.startsWith('css-')) {
                            const cssProp = attr.substring(4);
                            $el.css(cssProp, value);
                        } else if (attr && attr.startsWith('data-')) {
                            const dataKey = attr.substring(5);
                            $el.data(dataKey, value);
                        }
                        break;
                }
            });
            
            // Estilo: vinculante genérico (p.ej. <span st-text="count">)
            $(`[${prefix}text="${key}"]`).each(function() { $(this).text(value); });
            $(`[${prefix}html="${key}"]`).each(function() { $(this).html(value); });
            $(`[${prefix}value="${key}"]`).each(function() { $(this).val(value); });
            $(`[${prefix}class="${key}"]`).each(function() { $(this).attr('class', value); });
            $(`[${prefix}show="${key}"]`).each(function() { $(this).toggle(value); });
            $(`[${prefix}hide="${key}"]`).each(function() { $(this).toggle(!value); });
            $(`[${prefix}enabled="${key}"]`).each(function() { $(this).prop('disabled', !value); });
            $(`[${prefix}disabled="${key}"]`).each(function() { $(this).prop('disabled', value); });

            // Escaneo dinámico: detecta cualquier atributo `st-*` cuyo valor sea `key`
            // Nota: es más costoso; útil para `st-css-*` y variantes personalizadas.
            $('*').each(function() {
                const el = this;
                const $el = $(this);
                const attrs = el.attributes;
                for (let i = 0; i < attrs.length; i++) {
                    const a = attrs[i];
                    if (!a || !a.name) continue;
                    if (a.value !== key) continue;
                    if (!a.name.startsWith(prefix)) continue;

                    const spec = a.name.substring(prefix.length);
                    if (spec === 'text') { $el.text(value); continue; }
                    if (spec === 'html') { $el.html(value); continue; }
                    if (spec === 'value') { $el.val(value); continue; }
                    if (spec === 'class') { $el.attr('class', value); continue; }
                    if (spec === 'show') { $el.toggle(value); continue; }
                    if (spec === 'hide') { $el.toggle(!value); continue; }
                    if (spec === 'enabled') { $el.prop('disabled', !value); continue; }
                    if (spec === 'disabled') { $el.prop('disabled', value); continue; }

                    if (spec.startsWith('attr-')) {
                        const attrName = spec.substring(5);
                        $el.attr(attrName, value);
                        continue;
                    }
                    if (spec.startsWith('prop-')) {
                        const propName = spec.substring(5);
                        $el.prop(propName, value);
                        continue;
                    }
                    if (spec.startsWith('css-')) {
                        const cssProp = spec.substring(4);
                        $el.css(cssProp, value);
                        continue;
                    }
                    if (spec.startsWith('data-')) {
                        const dataKey = spec.substring(5);
                        $el.data(dataKey, value);
                        continue;
                    }
                }
            });
            
            // Evento personalizado para observers externos
            $(document).trigger(`state:changed:${key}`, [value, key]);
        },
        
        /**
         * Render manual: si se pasa `key`, sólo esa clave; si no, todas.
         * @param {string} [key]
         * @returns {ReactiveState} this
         */
        render: function(key) {
            if (key) {
                this._updateDOM(key);
            } else {
                // Renderiza todo el estado actual
                Object.keys(this._states).forEach(k => this._updateDOM(k));
            }
            return this;
        },
        
        /**
         * Configura el objeto `config`.
         * @param {Object} options Opciones parciales (prefix, debug, batchTimeout...).
         * @returns {ReactiveState} this
         */
        configure: function(options) {
            this.config = { ...this.config, ...options };
            return this;
        },
        
        /**
         * Resetea completamente el estado y colas.
         * @returns {ReactiveState} this
         */
        reset: function() {
            this._states = {};
            this._subscriptions = {};
            this._updateQueue = [];
            this._isUpdating = false;
            return this;
        }
    };

    // jQuery plugin extensions
    $.extend({
        /**
         * API global de estado: get/set único o múltiple.
         * Formas:
         * - $.state()              -> obtiene copia del estado
         * - $.state('key')         -> obtiene valor
         * - $.state('key', value)  -> establece valor
         * - $.state({k1: v1, k2: v2}) -> establece múltiples valores
         */
        state: function(key, value) {
            if (arguments.length === 0) {
                return ReactiveState.getState();
            }
            
            if (typeof key === 'string' && arguments.length === 1) {
                return ReactiveState.getState(key);
            }
            
            if (typeof key === 'string' && arguments.length === 2) {
                // Soporte updater function: $.state('key', prev => next)
                if (typeof value === 'function' && ReactiveState.config.allowUpdaterFn !== false) {
                    try {
                        const prev = ReactiveState.getState(key);
                        const next = value(prev);
                        ReactiveState.setState(key, next);
                    } catch (err) {
                        console.error('[ReactiveState] Error applying updater function for', key, err);
                    }
                } else {
                    ReactiveState.setState(key, value);
                }
                return $;
            }
            
            if (typeof key === 'object') {
                // Permitir funciones como valores en objetos: $.state({ k: prev => next, ... })
                const updates = {};
                try {
                    Object.keys(key).forEach(function(k) {
                        const v = key[k];
                        if (typeof v === 'function' && ReactiveState.config.allowUpdaterFn !== false) {
                            const prev = ReactiveState.getState(k);
                            updates[k] = v(prev);
                        } else {
                            updates[k] = v;
                        }
                    });
                    ReactiveState.setStates(updates);
                } catch (err) {
                    console.error('[ReactiveState] Error applying batch updates', err);
                    // Fallback: aplicar como estaba para no romper
                    ReactiveState.setStates(key);
                }
                return $;
            }
            
            return $;
        },
        
        /**
         * Observa cambios de estado.
         * - $.watch('key', cb)
         * - $.watch((newVal, oldVal, key) => {}) // todas las claves actuales
         * Nota: si agregas nuevas claves tras el `watch(global)`, no se añadirán automáticamente;
         *       vuelve a llamar `$.watch` o suscríbete manualmente.
         */
        watch: function(key, callback) {
            if (typeof key === 'function') {
                // Observador global para claves existentes
                const globalCallback = key;
                const allKeys = Object.keys(ReactiveState._states);
                allKeys.forEach(k => {
                    ReactiveState.subscribe(k, (newVal, oldVal) => {
                        globalCallback(newVal, oldVal, k);
                    });
                });
            } else if (typeof key === 'string' && typeof callback === 'function') {
                ReactiveState.subscribe(key, callback);
            }
            return $;
        },
        
        /**
         * Fuerza renderizado (una clave o todas).
         */
        render: function(key) {
            ReactiveState.render(key);
            return $;
        },
        
        /**
         * Inicializa el estado con un objeto.
         */
        reactiveInit: function(initialState) {
            ReactiveState.init(initialState);
            return $;
        },
        
        /**
         * Configura opciones del sistema reactivo.
         */
        reactiveConfig: function(options) {
            ReactiveState.configure(options);
            return $;
        },
        
        /**
         * Resetea por completo el estado.
         */
        reactiveReset: function() {
            ReactiveState.reset();
            return $;
        }
    });

    // jQuery element extensions
    $.fn.extend({
        /**
         * Enlaza un elemento con una clave de estado usando atributos `st-*` generados.
         * Equivalente a poner en el DOM: `<el st-<key>="<attr>">`.
         * Render inicial incluido.
         * @param {string} key Clave de estado.
         * @param {string} [attr='text'] Uno de: text|html|value|class|show|hide|enabled|disabled|attr-*|prop-*|css-*|data-*
         * @returns {jQuery} this
         * @example
         *   $('#title').bindState('msg', 'text')
         *   $.state('msg', 'Hola') // actualiza el texto del elemento
         */
        bindState: function(key, attr = 'text') {
            const prefix = ReactiveState.config.prefix;
            
            return this.each(function() {
                $(this).attr(`${prefix}${key}`, attr);
                
                // Render inicial
                const value = ReactiveState.getState(key);
                if (value !== undefined) {
                    switch (attr) {
                        case 'text':
                            $(this).text(value);
                            break;
                        case 'html':
                            $(this).html(value);
                            break;
                        case 'value':
                            $(this).val(value);
                            break;
                        case 'class':
                            $(this).attr('class', value);
                            break;
                        case 'show':
                            $(this).toggle(value);
                            break;
                        case 'hide':
                            $(this).toggle(!value);
                            break;
                        case 'enabled':
                            $(this).prop('disabled', !value);
                            break;
                        case 'disabled':
                            $(this).prop('disabled', value);
                            break;
                        default:
                            if (attr.startsWith('attr-')) {
                                const attrName = attr.substring(5);
                                $(this).attr(attrName, value);
                            } else if (attr.startsWith('prop-')) {
                                const propName = attr.substring(5);
                                $(this).prop(propName, value);
                            } else if (attr.startsWith('css-')) {
                                const cssProp = attr.substring(4);
                                $(this).css(cssProp, value);
                            } else if (attr.startsWith('data-')) {
                                const dataKey = attr.substring(5);
                                $(this).data(dataKey, value);
                            }
                            break;
                    }
                }
            });
        },
        
        /**
         * Desenlaza un elemento removiendo el atributo `st-<key>`.
         */
        unbindState: function(key) {
            const prefix = ReactiveState.config.prefix;
            return this.each(function() {
                $(this).removeAttr(`${prefix}${key}`);
            });
        },
        
        /**
         * Two-way binding imperativo para inputs.
         * - Inicializa el valor del input con el estado.
         * - Escucha `input/change` y actualiza la clave de estado.
         * - Suscribe el input para reflejar cambios futuros.
         * @param {string} key Clave.
         * @returns {jQuery} this
         * @example
         *   $.reactiveInit({ name: 'Ana' })
         *   $('#name').reactive('name')
         *   $.state('name', 'Luis') // actualiza el input
         */
        reactive: function(key) {
            return this.each(function() {
                const $el = $(this);
                const initial = ReactiveState.getState(key);
                if (initial !== undefined) {
                    $el.val(initial);
                }
                // Two-way binding
                $el.on('input change', function() {
                    ReactiveState.setState(key, $el.val());
                });
                // Suscripción para reflejar cambios
                ReactiveState.subscribe(key, function(newVal) {
                    $el.val(newVal);
                });
            });
        },
        
        /**
         * Enlace de texto (solo lectura) vía jQuery.
         * @param {string} key
         * @deprecated Usar `$(el).reactive(key).text()` en su lugar.
         */
        reactive: function(key) {
            const $el = this;

            // Comportamiento por defecto
            if ($el.is('input, textarea, select')) {
                // Two-way binding para elementos de formulario
                $el.each(function() {
                    const $input = $(this);
                    const initial = ReactiveState.getState(key);
                    if (initial !== undefined) {
                        $input.val(initial);
                    }
                    $input.on('input change', function() {
                        ReactiveState.setState(key, $input.val());
                    });
                    ReactiveState.subscribe(key, function(newVal) {
                        $input.val(newVal);
                    });
                });
            } else {
                // One-way binding al texto para otros elementos
                $el.each(function() {
                    const $element = $(this);
                    const initial = ReactiveState.getState(key);
                    if (initial !== undefined) {
                        $element.text(initial);
                    }
                    ReactiveState.subscribe(key, function(newVal) {
                        $element.text(newVal);
                    });
                });
            }

            // Devolver el binder para encadenar
            return new ReactiveBinder($el, key);
        },

        /**
         * Enlace de HTML (solo lectura) vía jQuery.
         * @param {string} key
         * @deprecated Usar `$(el).reactive(key).html()` en su lugar.
         */
        reactiveHtml: function(key) {
            console.warn('[ReactiveState] reactiveHtml() está obsoleto. Usa $(el).reactive(key).html() en su lugar.');
            return this.each(function() {
                const $el = $(this);
                const initial = ReactiveState.getState(key);
                if (initial !== undefined) {
                    $el.html(initial);
                }
                ReactiveState.subscribe(key, function(newVal) {
                    $el.html(newVal);
                });
            });
        },
        
        /**
         * Enlace de CSS (propiedad específica) vía jQuery.
         * @param {string} property Propiedad CSS (p.ej. 'color').
         * @param {string} key Clave.
         * @deprecated Usar `$(el).reactive(key).css(prop)` en su lugar.
         */
        reactiveCss: function(property, key) {
            console.warn('[ReactiveState] reactiveCss() está obsoleto. Usa $(el).reactive(key).css(prop) en su lugar.');
            return this.each(function() {
                const $el = $(this);
                const initial = ReactiveState.getState(key);
                if (initial !== undefined) {
                    $el.css(property, initial);
                }
                ReactiveState.subscribe(key, function(newVal) {
                    $el.css(property, newVal);
                });
            });
        },
        
        /**
         * Muestra/oculta según truthiness del estado (mostrar cuando true).
         * @param {string} key
         * @deprecated Usar `$(el).reactive(key).show()` en su lugar.
         */
        reactiveShow: function(key) {
            console.warn('[ReactiveState] reactiveShow() está obsoleto. Usa $(el).reactive(key).show() en su lugar.');
            return this.each(function() {
                const $el = $(this);
                const initial = ReactiveState.getState(key);
                $el.toggle(!!initial);
                ReactiveState.subscribe(key, function(newVal) {
                    $el.toggle(!!newVal);
                });
            });
        },
        
        /**
         * Muestra/oculta según truthiness del estado (ocultar cuando true).
         * @param {string} key
         * @deprecated Usar `$(el).reactive(key).hide()` en su lugar.
         */
        reactiveHide: function(key) {
            console.warn('[ReactiveState] reactiveHide() está obsoleto. Usa $(el).reactive(key).hide() en su lugar.');
            return this.each(function() {
                const $el = $(this);
                const initial = ReactiveState.getState(key);
                $el.toggle(!initial);
                ReactiveState.subscribe(key, function(newVal) {
                    $el.toggle(!newVal);
                });
            });
        }
    });

    /**
     * Clase ReactiveBinder: proporciona la API fluida.
     * @param {jQuery} $el Elemento jQuery.
     * @param {string} key Clave de estado.
     */
    function ReactiveBinder($el, key) {
        this.$el = $el;
        this.key = key;
    }

    ReactiveBinder.prototype = {
        _bind: function(updateFn) {
            const initial = ReactiveState.getState(this.key);
            if (initial !== undefined) {
                this.$el.each(function() {
                    updateFn($(this), initial);
                });
            }
            ReactiveState.subscribe(this.key, (newVal) => {
                this.$el.each(function() {
                    updateFn($(this), newVal);
                });
            });
            return this.$el; // Devuelve el elemento jQuery para seguir encadenando
        },

        text: function() {
            return this._bind(($el, val) => $el.text(val));
        },

        html: function() {
            return this._bind(($el, val) => $el.html(val));
        },

        val: function() {
            return this._bind(($el, val) => $el.val(val));
        },

        show: function() {
            return this._bind(($el, val) => $el.toggle(!!val));
        },

        hide: function() {
            return this._bind(($el, val) => $el.toggle(!val));
        },

        enabled: function() {
            return this._bind(($el, val) => $el.prop('disabled', !val));
        },

        disabled: function() {
            return this._bind(($el, val) => $el.prop('disabled', !!val));
        },

        css: function(property) {
            return this._bind(($el, val) => $el.css(property, val));
        },

        attr: function(attributeName) {
            return this._bind(($el, val) => $el.attr(attributeName, val));
        },

        prop: function(propertyName) {
            return this._bind(($el, val) => $el.prop(propertyName, val));
        },

        class: function() {
            return this._bind(($el, val) => $el.attr('class', val));
        }
    };

    // Auto-initialize on document ready
    $(document).ready(function() {
        /**
         * Inicializa con estado vacío por defecto.
         * Puedes llamar a `$.reactiveInit({ ... })` antes o después.
         */
        ReactiveState.init();
        
        /**
         * Evento personalizado para actualizaciones:
         * $(document).trigger('state:update', ['key', value])
         */
        $(document).on('state:update', function(event, key, value) {
            $.state(key, value);
        });
        
        /**
         * Two-way binding automático para inputs con `st-value="<key>"`.
         * Permite usar solo atributos declarativos sin escribir JS extra.
         */
        const prefix = ReactiveState.config.prefix;
        $(document).on('input change', `[${prefix}value]`, function() {
            const stateKey = $(this).attr(`${prefix}value`);
            if (stateKey) {
                const newVal = $(this).val();
                ReactiveState.setState(stateKey, newVal);
            }
        });
    });

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ReactiveState;
    }
    
    // Expose ReactiveState object (útil para depurar en consola)
    $.ReactiveState = ReactiveState;

})(jQuery);