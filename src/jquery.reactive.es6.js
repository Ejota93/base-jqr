import $ from 'jquery';

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

    init(initialState = {}) {
        this._states = { ...initialState };
        this._subscriptions = {};
        this._updateQueue.clear();
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

        if (!this._batchMode) {
            this.queueRender(key);
        }
    }

    _processBatchUpdate(changedKeys) {
        changedKeys.forEach(key => {
            this._triggerSubscriptions(key, this._states[key], undefined);
        });

        changedKeys.forEach(key => this.queueRender(key));
    }

    queueRender(key) {
        this._updateQueue.add(key);

        if (!this._isUpdating) {
            this._scheduleRender();
        }
    }

    _scheduleRender() {
        if (this._updateQueue.size === 0) return;

        this._isUpdating = true;

        setTimeout(() => {
            this._processRenderQueue();
            this._isUpdating = false;
        }, this.config.batchTimeout);
    }

    _processRenderQueue() {
        const queue = [...this._updateQueue];
        this._updateQueue.clear();

        queue.forEach(key => {
            this._updateDOM(key);
        });
    }

    _updateDOM(key) {
        const value = this._states[key];
        const prefix = this.config.prefix;

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
        this._updateQueue.clear();
        this._isUpdating = false;
        return this;
    }
}

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

$.extend({
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
    reactiveInit: function(initialState) {
        reactiveState.init(initialState);
        reactiveState.render();
        return $;
    },
    reactiveRender: function(key) {
        reactiveState.render(key);
        return $;
    },
    reactiveConfigure: function(options) {
        reactiveState.configure(options);
        return $;
    },
    reactiveReset: function() {
        reactiveState.reset();
        return $;
    }
});

$.fn.extend({
    reactive: function(key) {
        const $el = this;
        if (!$el.length) return $el;

        const initialValue = reactiveState.getState(key);
        if (typeof initialValue !== 'undefined') {
            $el.val(initialValue);
        }

        const handler = (event) => {
            const { type, target } = event;
            const $target = $(target);
            let value;

            if ($target.is('input[type="checkbox"]')) {
                value = $target.prop('checked');
            } else if ($target.is('input, textarea, select')) {
                value = $target.val();
            } else {
                return;
            }
            
            reactiveState.setState(key, value);
        };

        $el.on('input change', handler);

        const unsubscribe = reactiveState.subscribe(key, (newValue) => {
            if ($el.is('input[type="checkbox"]')) {
                $el.prop('checked', newValue);
            } else if ($el.val() !== newValue) {
                $el.val(newValue);
            }
        });

        $el.data('reactive-unsubscribe', unsubscribe);

        return $el;
    },
    list: function(key, render, options = {}) {
        const $container = this;
        if (!$container.length) return this;

        const { key: itemKey = 'id', placeholder = '' } = options;

        const updateList = (items) => {
            if (!Array.isArray(items) || items.length === 0) {
                $container.html(placeholder);
                return;
            }

            const fragment = document.createDocumentFragment();
            items.forEach(item => {
                const $item = $(render(item));
                $item.attr(`data-reactive-key`, item[itemKey]);
                fragment.appendChild($item[0]);
            });

            $container.html(fragment);
        };

        const initialItems = reactiveState.getState(key);
        updateList(initialItems);

        const unsubscribe = reactiveState.subscribe(key, updateList);
        $container.data('reactive-list-unsubscribe', unsubscribe);

        return this;
    }
});

export default $;