import $ from 'jquery';

/**
 * jQuery Reactive State (ES6)
 *
 * Ideas clave pedagógicas:
 * - Estado global simple (mapa clave→valor) con suscripciones por clave.
 * - Dos estilos de binding: declarativo (`st-*` en HTML) e imperativo (API encadenable).
 * - Renderizado batched: cambios encolados se aplican con un pequeño delay.
 * - Updater functions opcionales: `$.state('k', prev => next)` para actualizaciones seguras.
 * - Eventos: `state:update` global y `state:changed:<key>` por clave para integraciones.
 * - Auto-init en `document.ready` y two-way para inputs con `st-value`.
 */

/**
 * ReactiveState: núcleo de la librería.
 * Mantiene:
 * - `_states`: estado global clave-valor.
 * - `_subscriptions`: lista de callbacks por clave.
 * - `_updateQueue`: claves pendientes de render.
 * - flags de render: `_isUpdating`, `_autoRender`, `_batchMode`.
 * - `config`: prefijo de atributos y parámetros de rendimiento.
 */
/**
 * Núcleo de estado reactivo: gestiona valores por clave, suscripciones y render.
 */
class ReactiveState {
    constructor() {
        this._states = {};
        this._subscriptions = {};
        this._updateQueue = new Set();
        this._isUpdating = false;
        this._batchMode = false;
        this.config = {
            prefix: 'st-',
            debug: false,
            batchTimeout: 16, // ~60fps
            maxUpdateDepth: 100,
            allowUpdaterFn: true,
        };
    }

    /**
     * Inicializa el estado global con un objeto clave-valor.
     * No realiza render inmediato; usa $.render() o cambios posteriores.
     */
    init(initialState = {}) {
        this._states = { ...initialState };
        this._subscriptions = {};
        this._updateQueue.clear();
        this._isUpdating = false;
        return this;
    }

    /**
     * Obtiene una copia del estado completo o el valor por clave.
     */
    getState(key) {
        if (key === undefined) {
            return { ...this._states };
        }
        return this._states[key];
    }

    /**
     * Establece una clave y notifica suscriptores.
     * Si `silent` es true, no dispara suscripciones ni render.
     */
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

    /**
     * Establece múltiples claves en batch.
     * Aplica cambios, dispara suscripciones y encola render por clave.
     */
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

    /**
     * Suscribe un callback a una clave. Devuelve `unsubscribe()`.
     * El callback recibe `(newValue, oldValue, key)`.
     */
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

    /**
     * Dispara callbacks de una clave y programa render (si no hay batch en curso).
     */
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

        if (!this._batchMode) {
            this.queueRender(key);
        }
    }

    /**
     * Procesa un conjunto de claves cambiadas durante un batch update.
     */
    _processBatchUpdate(changedKeys) {
        changedKeys.forEach(key => {
            this._triggerSubscriptions(key, this._states[key], undefined);
        });

        changedKeys.forEach(key => this.queueRender(key));
    }

    /**
     * Encola una clave para renderizar y programa el procesamiento.
     */
    queueRender(key) {
        this._updateQueue.add(key);

        if (!this._isUpdating) {
            this._scheduleRender();
        }
    }

    /**
     * Programa el vaciado de la cola con un pequeño delay (batching).
     */
    _scheduleRender() {
        if (this._updateQueue.size === 0) return;

        this._isUpdating = true;

        setTimeout(() => {
            this._processRenderQueue();
            this._isUpdating = false;
        }, this.config.batchTimeout);
    }

    /**
     * Vacía la cola y renderiza cada clave encolada.
     */
    _processRenderQueue() {
        const queue = [...this._updateQueue];
        this._updateQueue.clear();

        queue.forEach(key => {
            this._updateDOM(key);
        });
    }

    /**
     * Aplica una clave al DOM en ambos estilos:
     * - `[st-<key>]` con directiva (text/html/value/class/show/hide/prop/attr/css/data)
     * - `[st-text="<key>"]`, `[st-css-color="<key>"]`, etc.
     * También dispara `state:changed:<key>` para observadores externos.
     */
    _updateDOM(key) {
        const value = this._states[key];
        const prefix = this.config.prefix;

        // Estilo: atributo específico por clave (p.ej. <span st-count="text">)
        // Evitar claves con caracteres no válidos (p.ej. nombres con '.') que rompen el selector
        const attrName = `${prefix}${key}`;
        if (isSafeAttrName(attrName)) {
            $(`[${attrName}]`).each(function() {
                const $el = $(this);
                const attr = $el.attr(attrName);
                if (attr) {
                    applyDirective($el, attr, value);
                }
            });
        }

        // Selector para atributos específicos como `st-text="count"`
        const specificAttrSelector = `[${prefix}text="${key}"], [${prefix}html="${key}"], [${prefix}value="${key}"], [${prefix}class="${key}"], [${prefix}show="${key}"], [${prefix}hide="${key}"], [${prefix}enabled="${key}"], [${prefix}disabled="${key}"]`;
        
        $(specificAttrSelector).each(function() {
            const $el = $(this);
            const attrs = this.attributes;
            for (let i = 0; i < attrs.length; i++) {
                const attr = attrs[i];
                if (attr.name.startsWith(prefix) && attr.value === key) {
                    const directive = attr.name.substring(prefix.length);
                    applyDirective($el, directive, value);
                }
            }
        });

        // Escaneo dinámico para atributos como `st-css-color="myColorState"`
        $(`*`).each(function() {
            const el = this;
            const $el = $(this);
            const attrs = el.attributes;
            for (let i = 0; i < attrs.length; i++) {
                const a = attrs[i];
                if (!a || !a.name) continue;
                if (a.value !== key) continue;
                if (!a.name.startsWith(prefix)) continue;

                const spec = a.name.substring(prefix.length);
                applyDirective($el, spec, value);
            }
        });

        $(document).trigger(`state:changed:${key}`, [value, key]);
    }

    /**
     * Render manual: si se pasa `key`, sólo esa clave; si no, todas.
     */
    render(key) {
        if (key) {
            this._updateDOM(key);
        } else {
            Object.keys(this._states).forEach(k => this._updateDOM(k));
        }
        return this;
    }

    /**
     * Mezcla opciones de configuración (prefix, debug, batchTimeout...).
     */
    configure(options) {
        this.config = { ...this.config, ...options };
        return this;
    }

    /**
     * Resetea completamente el estado, suscripciones y cola.
     */
    reset() {
        this._states = {};
        this._subscriptions = {};
        this._updateQueue.clear();
        this._isUpdating = false;
        return this;
    }
}

/**
 * Aplica una directiva declarativa `st-*` sobre un elemento jQuery.
 * Soporta: text, html, value, class, show/hide, enabled/disabled,
 * y prefijos `css-`, `attr-`, `prop-`, `data-`.
 */
function applyDirective($el, directive, value) {
    if (directive.startsWith('css-')) {
        $el.css(directive.substring(4), value);
    } else if (directive.startsWith('attr-')) {
        $el.attr(directive.substring(5), value);
    } else if (directive.startsWith('prop-')) {
        $el.prop(directive.substring(5), value);
    } else if (directive.startsWith('data-')) {
        $el.data(directive.substring(5), value);
    } else {
        switch (directive) {
            case 'text': $el.text(value); break;
            case 'html': $el.html(value); break;
            case 'value': $el.val(value); break;
            case 'class': $el.attr('class', value); break;
            case 'show': $el.toggle(!!value); break;
            case 'hide': $el.toggle(!value); break;
            case 'enabled': $el.prop('disabled', !value); break;
            case 'disabled': $el.prop('disabled', !!value); break;
        }
    }
}

const reactiveState = new ReactiveState();

/**
 * Verifica si un nombre de atributo CSS es seguro para usar en selectores jQuery/Sizzle.
 * Permitimos letras, números, guiones y guion bajo, y evitamos '.' u otros caracteres problemáticos.
 */
function isSafeAttrName(name) {
    return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name);
}

// Fluent binder para encadenar métodos al estilo jQuery
/**
 * ReactiveBinder: API encadenable estilo jQuery para vincular una clave.
 * - Render inicial con el valor actual
 * - Suscripción a futuros cambios
 * - En `val()`: binding bidireccional para inputs/selects/textarea
 */
class ReactiveBinder {
    constructor($el, key) {
        this.$el = $el;
        this.key = key;
        this._unsubscribers = [];
        // guardar referencia para potencial unbind externo
        this.$el.data('reactive-binder', this);
    }

    _subscribe(handler) {
        const unsub = reactiveState.subscribe(this.key, (val) => {
            try { handler(this.$el, val); } catch (e) { console.error('[ReactiveBinder] handler error', e); }
        });
        this._unsubscribers.push(unsub);
        return this;
    }

    _initialAndSubscribe(handler) {
        // Render inicial
        const initial = reactiveState.getState(this.key);
        if (initial !== undefined) {
            try { handler(this.$el, initial); } catch (e) { console.error('[ReactiveBinder] initial handler error', e); }
        }
        // Suscripción
        return this._subscribe(handler);
    }

    unbind() {
        // cancelar subscripciones y eventos
        this._unsubscribers.forEach(fn => { try { fn(); } catch (_) {} });
        this._unsubscribers = [];
        this.$el.off('input.reactive change.reactive');
        return this.$el;
    }

    /** Establece el texto con el valor de la clave. */
    text() { return this._initialAndSubscribe(($el, val) => { $el.text(val); }); }

    /** Establece el HTML con el valor de la clave. */
    html() { return this._initialAndSubscribe(($el, val) => { $el.html(val); }); }

    val() {
        const $el = this.$el;
        // setear valor inicial desde estado
        const initial = reactiveState.getState(this.key);
        if ($el.is('input[type="checkbox"]')) {
            $el.prop('checked', !!initial);
        } else if (typeof initial !== 'undefined' && $el.val() !== initial) {
            $el.val(initial);
        }

        // two-way binding
        $el.on('input.reactive change.reactive', (event) => {
            const $target = $(event.target);
            let value;
            if ($target.is('input[type="checkbox"]')) {
                value = $target.prop('checked');
            } else if ($target.is('input, textarea, select')) {
                value = $target.val();
            } else {
                return;
            }
            reactiveState.setState(this.key, value);
        });

        return this._subscribe(($el2, newValue) => {
            if ($el2.is('input[type="checkbox"]')) {
                $el2.prop('checked', !!newValue);
            } else if ($el2.val() !== newValue) {
                $el2.val(newValue);
            }
        });
    }

    /** Visibilidad condicional: true → mostrar. */
    show() { return this._initialAndSubscribe(($el, val) => { $el.toggle(!!val); }); }

    /** Visibilidad condicional: true → ocultar. */
    hide() { return this._initialAndSubscribe(($el, val) => { $el.toggle(!val); }); }

    /** Habilita cuando la clave es true. */
    enabled() { return this._initialAndSubscribe(($el, val) => { $el.prop('disabled', !val); }); }

    /** Deshabilita cuando la clave es true. */
    disabled() { return this._initialAndSubscribe(($el, val) => { $el.prop('disabled', !!val); }); }

    /** Alterna una clase según booleano. */
    toggleClass(className) { return this._initialAndSubscribe(($el, val) => { $el.toggleClass(className, !!val); }); }

    // alias para compatibilidad con API clásica
    ["class"]() { return this.className(); }
    /** Reemplaza `class` del elemento con el valor de la clave. */
    className() { return this._initialAndSubscribe(($el, val) => { $el.attr('class', val); }); }

    /** Setea una propiedad del DOM con la clave. */
    prop(propName) { return this._initialAndSubscribe(($el, val) => { $el.prop(propName, val); }); }

    /** Setea un atributo HTML con la clave. */
    attr(attrName) { return this._initialAndSubscribe(($el, val) => { $el.attr(attrName, val); }); }

    /** Setea una propiedad CSS con la clave. */
    css(cssProp) { return this._initialAndSubscribe(($el, val) => { $el.css(cssProp, val); }); }

    /** Setea un data-* para el elemento con la clave. */
    data(dataKey) { return this._initialAndSubscribe(($el, val) => { $el.data(dataKey, val); }); }

    list(render, options = {}) {
        // delega en la implementación existente de $.fn.list
        this.$el.list(this.key, render, options);
        return this;
    }
}

$.extend({
    /**
     * API de estado global:
     * - $.state() → copia del estado
     * - $.state('key') → valor
     * - $.state('key', value|fn) → set (soporta updater fn)
     * - $.state({k1: v1, k2: v2|fn}) → set múltiple en batch
     */
    state: function(key, value) {
        if (arguments.length === 0) {
            return reactiveState.getState();
        }
        if (typeof key === 'string' && arguments.length === 1) {
            return reactiveState.getState(key);
        }
        if (typeof key === 'string' && arguments.length === 2) {
            if (typeof value === 'function' && reactiveState.config.allowUpdaterFn) {
                const prev = reactiveState.getState(key);
                const next = value(prev);
                reactiveState.setState(key, next);
            } else {
                reactiveState.setState(key, value);
            }
            return $;
        }
        if (typeof key === 'object') {
            const updates = {};
            Object.keys(key).forEach(k => {
                const v = key[k];
                if (typeof v === 'function' && reactiveState.config.allowUpdaterFn) {
                    const prev = reactiveState.getState(k);
                    updates[k] = v(prev);
                } else {
                    updates[k] = v;
                }
            });
            reactiveState.setStates(updates);
            return $;
        }
        return $;
    },
    /** Observa cambios: por clave o global (sobre claves existentes). */
    watch: function(key, callback) {
        if (typeof key === 'function') {
            const globalCallback = key;
            Object.keys(reactiveState.getState()).forEach(k => {
                reactiveState.subscribe(k, (newVal, oldVal) => globalCallback(newVal, oldVal, k));
            });
        } else {
            reactiveState.subscribe(key, callback);
        }
        return $;
    },
    /** Inicializa el estado (no renderiza automáticamente). */
    reactiveInit: function(initialState) {
        reactiveState.init(initialState);
        return $;
    },
    // Alias para paridad con versión jQuery
    /** Fuerza renderizado de una clave o de todas. */
    render: function(key) {
        reactiveState.render(key);
        return $;
    },
    reactiveRender: function(key) {
        reactiveState.render(key);
        return $;
    },
    /** Configura opciones (prefix, debug, batchTimeout...). */
    reactiveConfig: function(options) {
        reactiveState.configure(options);
        return $;
    },
    reactiveConfigure: function(options) {
        reactiveState.configure(options);
        return $;
    },
    /** Resetea por completo el estado y suscripciones. */
    reactiveReset: function() {
        reactiveState.reset();
        return $;
    },
    /**
     * Añade claves del estado solo si no existen aún.
     * Por defecto es silencioso (no dispara render ni watchers).
     * Uso: $.ensure({ 'perfil.nombre': 'Invitado', 'ui.modalOpen': false }, { silent: true })
     */
    ensure: function(defaults, options = {}) {
        const { silent = true } = options;
        if (!defaults || typeof defaults !== 'object') return $;
        const updates = {};
        Object.keys(defaults).forEach(k => {
            const existing = reactiveState.getState(k);
            if (typeof existing === 'undefined') {
                updates[k] = defaults[k];
            }
        });

        const hasUpdates = Object.keys(updates).length > 0;
        if (hasUpdates) {
            // set en batch respetando el flag silent
            reactiveState.setStates(updates, !!silent);
        }
        return $;
    },
    /**
     * Igual que ensure, pero aplicando un prefijo/namespace a cada clave.
     * Uso: $.ensureNS('perfil', { nombre: 'Invitado' }, { silent: true, sep: '.' })
     */
    ensureNS: function(prefix, defaults, options = {}) {
        const sep = options.sep != null ? options.sep : '.';
        if (!prefix) return $;
        const namespaced = {};
        if (defaults && typeof defaults === 'object') {
            Object.keys(defaults).forEach(k => {
                namespaced[`${prefix}${sep}${k}`] = defaults[k];
            });
        }
        return $.ensure(namespaced, options);
    },
    /**
     * Helper de namespace para trabajar con un prefijo de forma segura y legible.
     * Devuelve utilidades: k(key), ensure(defaults), get/set/watch.
     * Ejemplo:
     *   const perfil = $.namespace('perfil');
     *   perfil.ensure({ nombre: 'Invitado' });
     *   $('#nombre').reactive(perfil.k('nombre')).val();
     */
    namespace: function(prefix, options = {}) {
        const sep = options.sep != null ? options.sep : '.';
        const makeKey = (key) => `${prefix}${sep}${key}`;
        return {
            k: makeKey,
            /** Añade defaults dentro del namespace si no existen (silent por defecto). */
            ensure: function(defs, opts = {}) {
                return $.ensureNS(prefix, defs, { ...opts, sep });
            },
            /** Obtiene el valor namespaced. */
            get: function(key) { return $.state(makeKey(key)); },
            /** Setea el valor namespaced (acepta valor o updater fn, delega en $.state). */
            set: function(key, value) { $.state(makeKey(key), value); return this; },
            /** Observa cambios de una clave en el namespace. */
            watch: function(key, cb) { $.watch(makeKey(key), cb); return this; },
            /** Alias directo a $.state para usuarios que prefieran esta forma. */
            state: function(key, value) { $.state(makeKey(key), value); return this; }
        };
    }
});

// Exponer objeto para depuración como en la versión original
// Exposición opcional: acceso al singleton para debugging/advanced usage
$.ReactiveState = reactiveState;

// Listeners globales para compatibilidad: state:update y two-way st-value
// Auto-init y listeners globales: eventos de actualización y two-way st-value
/**
 * Auto-inicialización y eventos globales:
 * - Inicializa el estado si existe `window.__INITIAL_STATE__` opcional.
 * - Emite `state:update` para cada cambio (útil en demos y depuración).
 * - Two-way automático para inputs con `[st-value]` sin necesidad de código imperativo.
 */
$(function() {
    // Auto-initialize with empty state for parity with original
    reactiveState.init();
    // Evento personalizado para actualizaciones: $(document).trigger('state:update', ['key', value])
    $(document).on('state:update', function(event, key, value) {
        $.state(key, value);
    });

    // Two-way binding automático para inputs con `st-value="<key>"`
    const prefix = reactiveState.config.prefix;
    $(document).on('input change', `[${prefix}value]`, function() {
        const stateKey = $(this).attr(`${prefix}value`);
        if (stateKey) {
            const newVal = $(this).val();
            reactiveState.setState(stateKey, newVal);
        }
    });
});

// Extensiones de elementos: helpers declarativos e imperativos
$.fn.extend({
    // Atributos declarativos estilo bind/unbind para paridad
    /**
     * Vincula un elemento a una clave con una directiva (por defecto `text`).
     * Equivale al uso de atributos `[st-<key>="<attr>"]` pero desde JS.
     */
    bindState: function(key, attr = 'text') {
        const prefix = reactiveState.config.prefix;
        return this.each(function() {
            const $el = $(this);
            $el.attr(`${prefix}${key}`, attr);
            // Render inicial
            const value = reactiveState.getState(key);
            if (value !== undefined) {
                if (attr === 'text') { $el.text(value); }
                else if (attr === 'html') { $el.html(value); }
                else if (attr === 'value') { $el.val(value); }
                else if (attr === 'class') { $el.attr('class', value); }
                else if (attr === 'show') { $el.toggle(!!value); }
                else if (attr === 'hide') { $el.toggle(!value); }
                else if (attr === 'enabled') { $el.prop('disabled', !value); }
                else if (attr === 'disabled') { $el.prop('disabled', !!value); }
                else if (attr.startsWith('attr-')) { $el.attr(attr.substring(5), value); }
                else if (attr.startsWith('prop-')) { $el.prop(attr.substring(5), value); }
                else if (attr.startsWith('css-')) { $el.css(attr.substring(4), value); }
                else if (attr.startsWith('data-')) { $el.data(attr.substring(5), value); }
            }
        });
    },
    /**
     * Elimina suscripciones/handlers asociados al binding del elemento.
     */
    unbindState: function(key) {
        const prefix = reactiveState.config.prefix;
        return this.each(function() { $(this).removeAttr(`${prefix}${key}`); });
    },
    /**
     * Crea un `ReactiveBinder` para encadenar métodos imperativos sobre la clave.
     */
    reactive: function(key) {
        const $el = this;
        if (!$el.length) return $el;
        return new ReactiveBinder($el, key);
    },
    /**
     * Renderiza listas a partir de una clave con array, con diff incremental.
     * `render(item, index)` debe devolver un jQuery/HTML para cada elemento.
     */
    list: function(key, render, options = {}) {
        const $container = this;
        if (!$container.length) return this;

        const { key: itemKey = 'id', placeholder = '' } = options;

        const keyAttribute = 'data-jreact-key';
        const placeholderAttr = 'data-reactive-placeholder';
        function ensureKey(el, keyVal) {
            el.setAttribute(keyAttribute, keyVal);
        }

        const updateList = (items) => {
            const containerEl = $container[0];

            // Placeholder cuando la lista está vacía
            if (!Array.isArray(items) || items.length === 0) {
                $container.empty();
                if (placeholder) {
                    const $ph = $(placeholder).attr(placeholderAttr, 'true');
                    $container.append($ph);
                }
                return;
            }

            // Remover placeholder si existe
            $container.children(`[${placeholderAttr}]`).remove();

            // Mapa de elementos existentes por clave
            const existingMap = new Map();
            $container.children().each(function() {
                const $child = $(this);
                const key = $child.attr(keyAttribute);
                if (key !== undefined) {
                    existingMap.set(String(key), $child);
                }
            });

            const newElements = [];

            // Pass 1: crear/recuperar elementos en nuevo orden
            items.forEach((item, index) => {
                const rawKey = item && item[itemKey] != null ? item[itemKey] : index;
                if (rawKey === undefined || rawKey === null) return;
                const key = String(rawKey);

                let $el = existingMap.get(key);
                if (!$el) {
                    const newItemHtml = render(item, index);
                    $el = $(newItemHtml);
                    $el.attr(keyAttribute, key);
                } else {
                    // marcar como mantenido
                    existingMap.delete(key);
                }
                newElements.push($el);
            });

            // Pass 2: eliminar elementos antiguos no utilizados
            existingMap.forEach(($el) => { $el.remove(); });

            // Pass 3: reordenar el DOM
            let previousElement = null;
            newElements.forEach(($el) => {
                const elNode = $el[0];
                if (!previousElement) {
                    if (containerEl.firstChild !== elNode) {
                        $container.prepend(elNode);
                    }
                } else {
                    if (previousElement.nextSibling !== elNode) {
                        $(previousElement).after(elNode);
                    }
                }
                previousElement = elNode;
            });
        };

        const initialItems = reactiveState.getState(key);
        updateList(initialItems);

        const unsubscribe = reactiveState.subscribe(key, updateList);
        $container.data('reactive-list-unsubscribe', unsubscribe);

        return this;
    }
});

export default $;