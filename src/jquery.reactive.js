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
 *   2) API jQuery pura (p.ej. `$(el).reactive('count').text()`).
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
 *      $('#counter').reactive('count').text()
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
 *   $('#title').reactive('msg').text()
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
    class ReactiveState {
        constructor() {
            this._states = {};
            this._subscriptions = {};
            this._updateQueue = [];
            this._isUpdating = false;
            this._autoRender = true;
            this._batchMode = false;
            this.config = {
                prefix: 'st-',
                debug: false,
                batchTimeout: 16,
                maxUpdateDepth: 100,
                allowUpdaterFn: true
            };
        }
        init(initialState = {}) {
            this._states = { ...initialState };
            this._subscriptions = {};
            this._updateQueue = [];
            this._isUpdating = false;
            return this;
        }
        getState(key) {
            if (key === undefined) {
                return { ...this._states };
            }
            return this._states[key];
        }
        setState(key, value, silent = false) {
            const oldValue = this._states[key];
            if (oldValue === value) {
                return this;
            }
            this._states[key] = value;
            if (this.config.debug) {
                console.log(`[ReactiveState] ${key}:`, oldValue, '->', value);
            }
            if (!silent) {
                this._triggerSubscriptions(key, value, oldValue);
            }
            return this;
        }
        setStates(states, silent = false) {
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
                this._processBatchUpdate(changedKeys);
            }
            this._batchMode = false;
            return this;
        }
        subscribe(key, callback) {
            if (!this._subscriptions[key]) {
                this._subscriptions[key] = [];
            }
            if (typeof callback !== 'function') {
                if (this.config.debug) {
                    console.warn(`[ReactiveState] Ignoring subscription: callback is not a function for key '${key}'`, callback);
                }
                return () => {};
            }
            this._subscriptions[key].push(callback);
            return () => {
                const index = this._subscriptions[key].indexOf(callback);
                if (index > -1) {
                    this._subscriptions[key].splice(index, 1);
                }
            };
        }
        _triggerSubscriptions(key, newValue, oldValue) {
            const subs = this._subscriptions[key];
            if (Array.isArray(subs) && subs.length > 0) {
                this._subscriptions[key] = subs.filter(cb => typeof cb === 'function');
                this._subscriptions[key].forEach(cb => {
                    try {
                        cb(newValue, oldValue, key);
                    } catch (error) {
                        console.error(`[ReactiveState] Error in subscription for ${key}:`, error);
                    }
                });
            }
            if (this._autoRender && !this._batchMode) {
                this.queueRender(key);
            }
        }
        _processBatchUpdate(changedKeys) {
            changedKeys.forEach(key => {
                this._triggerSubscriptions(key, this._states[key], undefined);
            });
            if (this._autoRender) {
                changedKeys.forEach(key => this.queueRender(key));
            }
        }
        queueRender(key) {
            if (this._updateQueue.indexOf(key) === -1) {
                this._updateQueue.push(key);
            }
            if (!this._isUpdating) {
                this._scheduleRender();
            }
        }
        _scheduleRender() {
            if (this._updateQueue.length === 0) return;
            this._isUpdating = true;
            setTimeout(() => {
                this._processRenderQueue();
                this._isUpdating = false;
            }, this.config.batchTimeout);
        }
        _processRenderQueue() {
            const queue = [...this._updateQueue];
            this._updateQueue = [];
            queue.forEach(key => {
                this._updateDOM(key);
            });
        }
        _updateDOM(key) {
            const value = this._states[key];
            const prefix = this.config.prefix;
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
            $(`[${prefix}text="${key}"]`).each(function() { $(this).text(value); });
            $(`[${prefix}html="${key}"]`).each(function() { $(this).html(value); });
            $(`[${prefix}value="${key}"]`).each(function() { $(this).val(value); });
            $(`[${prefix}class="${key}"]`).each(function() { $(this).attr('class', value); });
            $(`[${prefix}show="${key}"]`).each(function() { $(this).toggle(value); });
            $(`[${prefix}hide="${key}"]`).each(function() { $(this).toggle(!value); });
            $(`[${prefix}enabled="${key}"]`).each(function() { $(this).prop('disabled', !value); });
            $(`[${prefix}disabled="${key}"]`).each(function() { $(this).prop('disabled', value); });
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
            $(document).trigger(`state:changed:${key}`, [value, key]);
        }
        render(key) {
            if (key) {
                this._updateDOM(key);
            } else {
                Object.keys(this._states).forEach(k => this._updateDOM(k));
            }
            return this;
        }
        configure(options) {
            this.config = { ...this.config, ...options };
            return this;
        }
        reset() {
            this._states = {};
            this._subscriptions = {};
            this._updateQueue = [];
            this._isUpdating = false;
            return this;
        }
    }

    const globalState = new ReactiveState();

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
                return globalState.getState();
            }
            
            if (typeof key === 'string' && arguments.length === 1) {
                return globalState.getState(key);
            }
            
            if (typeof key === 'string' && arguments.length === 2) {
                // Soporte updater function: $.state('key', prev => next)
                if (typeof value === 'function' && globalState.config.allowUpdaterFn !== false) {
                    try {
                        const prev = globalState.getState(key);
                        const next = value(prev);
                        globalState.setState(key, next);
                    } catch (err) {
                        console.error('[ReactiveState] Error applying updater function for', key, err);
                    }
                } else {
                    globalState.setState(key, value);
                }
                return $;
            }
            
            if (typeof key === 'object') {
                // Permitir funciones como valores en objetos: $.state({ k: prev => next, ... })
                const updates = {};
                try {
                    Object.keys(key).forEach(function(k) {
                        const v = key[k];
                        if (typeof v === 'function' && globalState.config.allowUpdaterFn !== false) {
                            const prev = globalState.getState(k);
                            updates[k] = v(prev);
                        } else {
                            updates[k] = v;
                        }
                    });
                    globalState.setStates(updates);
                } catch (err) {
                    console.error('[ReactiveState] Error applying batch updates', err);
                    // Fallback: aplicar como estaba para no romper
                    globalState.setStates(key);
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
                const allKeys = Object.keys(globalState._states);
                allKeys.forEach(k => {
                    globalState.subscribe(k, (newVal, oldVal) => {
                        globalCallback(newVal, oldVal, k);
                    });
                });
            } else if (typeof key === 'string' && typeof callback === 'function') {
                globalState.subscribe(key, callback);
            }
            return $;
        },

        /**
         * Valores derivados: recalcula y establece `key` cuando cambian sus dependencias `deps`.
         * Uso básico:
         *   $.computed('label', ['nivel'], (n) => 'Nivel: ' + n)
         * Args:
         *   - key: string (clave de salida)
         *   - deps: string | string[] (claves dependientes)
         *   - computeFn: (...depValues) => nextValue
         *   - options: { immediate = true, distinct = true, silent = false }
         * Retorna: función cleanup() que desuscribe los watchers.
         */
        computed: function(key, deps, computeFn, options) {
            options = options || {};
            try {
                var outKey = (typeof key === 'string') ? key : String(key);
                var depKeys = Array.isArray(deps)
                    ? deps.map(function(d){ return (typeof d === 'string') ? d : String(d); })
                    : [ (typeof deps === 'string') ? deps : String(deps) ];
                var immediate = options.immediate !== undefined ? options.immediate : true;
                var distinct = options.distinct !== undefined ? options.distinct : true;
                var silent = options.silent !== undefined ? options.silent : false;

                if (!outKey || depKeys.length === 0 || typeof computeFn !== 'function') {
                    console.warn('[$.computed] argumentos inválidos:', { key: key, deps: deps, computeFn: computeFn });
                    return function noop(){};
                }
                // Evitar bucles triviales: salida depende de sí misma
                if (depKeys.indexOf(outKey) !== -1) {
                    console.warn('[$.computed] la clave de salida no puede depender de sí misma:', outKey);
                    return function noop(){};
                }

                function recompute() {
                    var values;
                    try {
                        values = depKeys.map(function(k){ return globalState.getState(k); });
                    } catch (e) {
                        console.error('[$.computed] error obteniendo dependencias', e);
                        return;
                    }
                    var next;
                    try {
                        next = computeFn.apply(null, values);
                    } catch (e) {
                        console.error('[$.computed] error en computeFn', e);
                        return;
                    }
                    if (distinct) {
                        var prev = globalState.getState(outKey);
                        if (next === prev) return;
                    }
                    try {
                        globalState.setState(outKey, next, silent);
                    } catch (e) {
                        console.error('[$.computed] error al setear clave derivada', e);
                    }
                }

                // Suscribir a todas las dependencias
                var unsubs = depKeys.map(function(k){ return globalState.subscribe(k, recompute); });
                // Render inicial
                if (immediate) recompute();
                // Cleanup
                return function cleanup(){
                    unsubs.forEach(function(fn){ try { fn(); } catch (_e) {} });
                };
            } catch (e) {
                console.error('[$.computed] error inesperado', e);
                return function noop(){};
            }
        },
        
        /**
         * Fuerza renderizado (una clave o todas).
         */
        render: function(key) {
            globalState.render(key);
            return $;
        },
        
        /**
         * Inicializa el estado con un objeto.
         */
        reactiveInit: function(initialState) {
            globalState.init(initialState);
            return $;
        },
        
        /**
         * Configura opciones del sistema reactivo.
         */
        reactiveConfig: function(options) {
            globalState.configure(options);
            return $;
        },
        
        /**
         * Resetea por completo el estado.
         */
        reactiveReset: function() {
            globalState.reset();
            return $;
        }
    });

    // jQuery element extensions
    $.fn.extend({
        /**
         * Asegura una instancia de estado reactivo local asociada al elemento.
         * Si ya existe, la reutiliza; si no, crea una nueva e inicializa.
         * @param {Object} [initialState] Estado inicial local
         * @param {Object} [options] Opciones para configurar la instancia (p.ej. { debug, batchTimeout, allowUpdaterFn })
         * @returns {jQuery} this
         */
        ensureState: function(initialState = {}, options) {
            return this.each(function() {
                const $el = $(this);
                let instance = $el.data('reactive-instance');
                if (!instance) {
                    instance = new ReactiveState();
                    instance.init(initialState || {});
                    if (options && typeof options === 'object') {
                        instance.configure(options);
                    }
                    $el.data('reactive-instance', instance);
                } else if (initialState && Object.keys(initialState).length > 0) {
                    instance.setStates(initialState);
                }
            });
        },

        /**
         * Obtiene/establece estado local asociado al primer elemento del set.
         * Si no existe instancia local, la crea vacía automáticamente.
         * Formas:
         * - $(el).state() -> copia del estado local
         * - $(el).state('key') -> valor local
         * - $(el).state('key', value) -> set local
         * - $(el).state({k1: v1, k2: v2}) -> set múltiple local
         * @returns {*} valor para getters, jQuery para setters
         */
        state: function(key, value) {
            const $first = this.eq(0);
            let instance = $first.data('reactive-instance');
            if (!instance) {
                instance = new ReactiveState();
                instance.init();
                $first.data('reactive-instance', instance);
            }

            if (arguments.length === 0) {
                return instance.getState();
            }

            if (typeof key === 'string' && arguments.length === 1) {
                return instance.getState(key);
            }

            if (typeof key === 'string' && arguments.length === 2) {
                if (typeof value === 'function' && instance.config.allowUpdaterFn !== false) {
                    try {
                        const prev = instance.getState(key);
                        const next = value(prev);
                        instance.setState(key, next);
                    } catch (err) {
                        console.error('[ReactiveState] Error applying local updater function for', key, err);
                    }
                } else {
                    instance.setState(key, value);
                }
                return this;
            }

            if (typeof key === 'object') {
                const updates = {};
                try {
                    Object.keys(key).forEach(function(k) {
                        const v = key[k];
                        if (typeof v === 'function' && instance.config.allowUpdaterFn !== false) {
                            const prev = instance.getState(k);
                            updates[k] = v(prev);
                        } else {
                            updates[k] = v;
                        }
                    });
                    instance.setStates(updates);
                } catch (err) {
                    console.error('[ReactiveState] Error applying local batch updates', err);
                    instance.setStates(key);
                }
                return this;
            }

            return this;
        },
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
            const prefix = globalState.config.prefix;
            
            return this.each(function() {
                $(this).attr(`${prefix}${key}`, attr);
                
                // Render inicial
                const value = globalState.getState(key);
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
         * @name reactive
         * @description
         * Enlace reactivo principal. Devuelve un "binder" encadenable para especificar explícitamente el tipo de binding.
         * Siempre debes encadenar un método como `.text()`, `.html()`, `.val()`, `.css('<prop>')`, `.show()`, `.hide()`, `.enabled()`, `.disabled()`, `.attr('<name>')`, `.prop('<name>')`, `.data('<key>')` o `.list(templateFn, options)`.
         * @param {string} key La clave del estado a la que enlazar.
         * @returns {ReactiveBinder} Una instancia de ReactiveBinder para encadenar métodos (.text(), .html(), .css(), .list(), etc.).
         * @example
         * // Con binding explícito
         * $('#titulo').reactive('titulo').text();
         * $('#contenido').reactive('articulo').html();
         * $('#caja').reactive('colorActivo').css('background-color');
         * $('#logo').reactive('visible').show();
         */
        reactive: function(key) {
            const $el = this;

            // Devuelve el binder para encadenar. La lógica de comportamiento por defecto
            // se puede manejar si no se llama a ningún método del binder, pero es más limpio
            // y predecible requerir un método explícito como .text() o .val().
            // Por simplicidad y claridad, la versión anterior que aplicaba un default
            // ha sido removida. Ahora siempre se debe encadenar un método.
            return new ReactiveBinder($el, key);
        },

        /** @deprecated Usar `$(el).reactive(key).text()` en su lugar. */
        reactiveText: function(key) {
            console.warn('[ReactiveState] reactiveText() está obsoleto. Usa $(el).reactive(key).text() en su lugar.');
            return new ReactiveBinder(this, key).text();
        },

        /** @deprecated Usar `$(el).reactive(key).html()` en su lugar. */
        reactiveHtml: function(key) {
            console.warn('[ReactiveState] reactiveHtml() está obsoleto. Usa $(el).reactive(key).html() en su lugar.');
            return new ReactiveBinder(this, key).html();
        },

        /** @deprecated Usar `$(el).reactive(key).css(prop)` en su lugar. */
        reactiveCss: function(property, key) {
            console.warn('[ReactiveState] reactiveCss() está obsoleto. Usa $(el).reactive(key).css(prop) en su lugar.');
            return new ReactiveBinder(this, key).css(property);
        },

        /** @deprecated Usar `$(el).reactive(key).show()` en su lugar. */
        reactiveShow: function(key) {
            console.warn('[ReactiveState] reactiveShow() está obsoleto. Usa $(el).reactive(key).show() en su lugar.');
            return new ReactiveBinder(this, key).show();
        },

        /** @deprecated Usar `$(el).reactive(key).hide()` en su lugar. */
        reactiveHide: function(key) {
            console.warn('[ReactiveState] reactiveHide() está obsoleto. Usa $(el).reactive(key).hide() en su lugar.');
            return new ReactiveBinder(this, key).hide();
        }
    });

    /**
     * Clase ReactiveBinder: proporciona la API fluida.
     * @param {jQuery} $el Elemento jQuery.
     * @param {string} key Clave de estado.
     */
    class ReactiveBinder {
        constructor($el, key) {
            this.$el = $el;
            this.key = key;
        }

        _bind(oneWayUpdater, twoWayEvent = null) {
            const { $el, key } = this;

            $el.each(function() {
                const $element = $(this);
                
                // Render inicial
                const initialValue = globalState.getState(key);
                if (initialValue !== undefined) {
                    oneWayUpdater($element, initialValue);
                }

                // Suscripción a cambios del estado
                const unsubscribe = globalState.subscribe(key, (newValue) => {
                    oneWayUpdater($element, newValue);
                });

                // Guardar la función de desuscripción para limpieza
                const subscriptions = $element.data('reactive-subscriptions') || [];
                subscriptions.push(unsubscribe);
                $element.data('reactive-subscriptions', subscriptions);


                // Binding en dos direcciones (si aplica)
                if (twoWayEvent) {
                    $element.on(twoWayEvent, function() {
                        const value = $element.val();
                        globalState.setState(key, value, false); // No re-renderizar el mismo elemento
                    });
                }
            });

            return $el;
        }

        text() {
            return this._bind(($el, val) => $el.text(val));
        }

        html() {
            return this._bind(($el, val) => $el.html(val));
        }

        val() {
            return this._bind(
                ($el, val) => $el.val(val),
                'input change'
            );
        }

        show() {
            return this._bind(($el, val) => $el.toggle(!!val));
        }

        hide() {
            return this._bind(($el, val) => $el.toggle(!val));
        }

        enabled() {
            return this._bind(($el, val) => $el.prop('disabled', !val));
        }

        disabled() {
            return this._bind(($el, val) => $el.prop('disabled', !!val));
        }

        toggleClass(className) {
            return this._bind(($el, val) => $el.toggleClass(className, !!val));
        }

        prop(propName) {
            return this._bind(($el, val) => $el.prop(propName, val));
        }

        attr(attrName) {
            return this._bind(($el, val) => $el.attr(attrName, val));
        }

        css(propName) {
            return this._bind(($el, val) => $el.css(propName, val));
        }

        class() {
            return this._bind(($el, val) => $el.attr('class', val));
        }

        data(dataKey) {
            return this._bind(($el, val) => $el.data(dataKey, val));
        }

        /**
         * Enlaza un array del estado para renderizar una lista de elementos de forma eficiente.
         * Utiliza un algoritmo de "diffing" para minimizar las manipulaciones del DOM,
         * preservando los elementos existentes y sus estados internos cuando sea posible.
         *
         * @param {function(any, number): string} templateFunction Una función que recibe un item del array
         *   y su índice, y devuelve un string HTML para ese item. El HTML debe tener un único elemento raíz.
         * @param {object} [options] Opciones adicionales.
         * @param {string} [options.key] El nombre de la propiedad en cada objeto del array que sirve como clave única.
         *   Esencial para un "diffing" eficiente. Si no se provee, se usará el índice del array como clave,
         *   lo cual es menos eficiente para reordenamientos o inserciones/eliminaciones en medio de la lista.
         * @returns {jQuery} El elemento jQuery original para encadenamiento.
         * @example
         * $.state('tareas', [{id: 1, texto: 'Comprar pan'}, {id: 2, texto: 'Llamar a mamá'}]);
         * $('#lista-tareas').reactive('tareas').list(
         *   (tarea) => `<li>${tarea.texto}</li>`,
         *   { key: 'id' }
         * );
         * // Añadir una nueva tarea actualizará el DOM eficientemente.
         * $.state('tareas', (tareas) => [...tareas, {id: 3, texto: 'Estudiar'}]);
         */
        list(templateFunction, options = {}) {
            const keyField = options.key;
            const placeholderHtml = options.placeholder;
            const placeholderAttr = 'data-reactive-placeholder';
            const $container = this.$el;
            const stateKey = this.key;
            const keyAttribute = 'data-jreact-key';

            const renderList = (newArray) => {
                // Si no es un array o es vacío, mostrar placeholder si está definido
                if (!Array.isArray(newArray) || newArray.length === 0) {
                    if (!Array.isArray(newArray) && newArray !== undefined && newArray !== null) {
                        console.warn(`[ReactiveState] List rendering for '${stateKey}' received a non-array value.`, newArray);
                    }
                    $container.empty();
                    if (placeholderHtml) {
                        const $ph = $(placeholderHtml).attr(placeholderAttr, 'true');
                        $container.append($ph);
                    }
                    return;
                }

                // Remover placeholder si existe al tener elementos
                $container.children(`[${placeholderAttr}]`).remove();

                const oldElementsMap = new Map();
                $container.children().each(function() {
                    const $child = $(this);
                    const key = $child.attr(keyAttribute);
                    if (key !== undefined) {
                        oldElementsMap.set(key, $child);
                    }
                });

                const newElements = []; // Array of jQuery objects in the new order

                // Pass 1: Create/retrieve elements for the new list
                newArray.forEach((item, index) => {
                    const itemKey = keyField && item ? item[keyField] : index;
                    if (itemKey === undefined || itemKey === null) {
                        console.warn(`[ReactiveState] Item at index ${index} has an invalid key and will be skipped.`, item);
                        return;
                    }
                    const key = String(itemKey);
                    
                    let $el = oldElementsMap.get(key);

                    if (!$el) { // Element is new, create it
                        const newItemHtml = templateFunction(item, index);
                        $el = $(newItemHtml);
                        $el.attr(keyAttribute, key);
                    } else {
                        // Element exists, mark it as kept by removing from the map
                        oldElementsMap.delete(key);
                    }
                    newElements.push($el);
                });

                // Pass 2: Remove old elements that are no longer in the list
                oldElementsMap.forEach(($el) => {
                    $el.remove();
                });

                // Pass 3: Re-order the DOM
                let previousElement = null;
                newElements.forEach(($el) => {
                    const elNode = $el[0];
                    if (!previousElement) {
                        // First element, prepend if it's not already the first
                        if ($container[0].firstChild !== elNode) {
                            $container.prepend(elNode);
                        }
                    } else {
                        // Subsequent element, place it after the previous one if it's not already there
                        if (previousElement.nextSibling !== elNode) {
                            $(previousElement).after(elNode);
                        }
                    }
                    previousElement = elNode;
                });
            };

            // Suscripción y render inicial
            const unsubscribe = globalState.subscribe(stateKey, renderList);
            const initialValue = globalState.getState(stateKey);
            
            // Guardar la función de desuscripción para limpieza
            const subscriptions = this.$el.data('reactive-subscriptions') || [];
            subscriptions.push(unsubscribe);
            this.$el.data('reactive-subscriptions', subscriptions);

            // Render inicial (incluye placeholder si corresponde)
            renderList(initialValue);

            return this.$el;
        }
    }

    // Auto-initialize on document ready
    $(document).ready(function() {
        /**
         * Inicializa con estado vacío por defecto.
         * Puedes llamar a `$.reactiveInit({ ... })` antes o después.
         */
        globalState.init();
        
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
        const prefix = globalState.config.prefix;
        $(document).on('input change', `[${prefix}value]`, function() {
            const stateKey = $(this).attr(`${prefix}value`);
            if (stateKey) {
                const newVal = $(this).val();
                globalState.setState(stateKey, newVal);
            }
        });
    });

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = globalState;
    }
    
    // Expose ReactiveState object (útil para depurar en consola)
    $.ReactiveState = globalState;

})(jQuery);