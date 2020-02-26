
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.18.2 */

    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	setTimeout(
    		() => {
    			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    		},
    		0
    	);
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// We need an iterable: if it's not a Map, use Object.entries
    	const routesIterable = routes instanceof Map ? routes : Object.entries(routes);

    	// Set up all routes
    	const routesList = [];

    	for (const [path, route] of routesIterable) {
    		routesList.push(new RouteItem(path, route));
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);
    						$$invalidate(1, componentParams = match);
    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [component, componentParams, routes, prefix];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\Icon\Icon.svelte generated by Svelte v3.18.2 */

    const file = "node_modules\\smelte\\src\\components\\Icon\\Icon.svelte";

    function create_fragment$1(ctx) {
    	let i;
    	let i_class_value;
    	let i_style_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			i = element("i");
    			if (default_slot) default_slot.c();
    			attr_dev(i, "aria-hidden", "true");
    			attr_dev(i, "class", i_class_value = "material-icons icon text-xl " + /*className*/ ctx[0] + " transition" + " svelte-zzky5a");
    			attr_dev(i, "style", i_style_value = /*color*/ ctx[5] ? `color: ${/*color*/ ctx[5]}` : "");
    			toggle_class(i, "reverse", /*reverse*/ ctx[3]);
    			toggle_class(i, "tip", /*tip*/ ctx[4]);
    			toggle_class(i, "text-base", /*small*/ ctx[1]);
    			toggle_class(i, "text-xs", /*xs*/ ctx[2]);
    			add_location(i, file, 20, 0, 324);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (default_slot) {
    				default_slot.m(i, null);
    			}

    			current = true;
    			dispose = listen_dev(i, "click", /*click_handler*/ ctx[8], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}

    			if (!current || dirty & /*className*/ 1 && i_class_value !== (i_class_value = "material-icons icon text-xl " + /*className*/ ctx[0] + " transition" + " svelte-zzky5a")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (!current || dirty & /*color*/ 32 && i_style_value !== (i_style_value = /*color*/ ctx[5] ? `color: ${/*color*/ ctx[5]}` : "")) {
    				attr_dev(i, "style", i_style_value);
    			}

    			if (dirty & /*className, reverse*/ 9) {
    				toggle_class(i, "reverse", /*reverse*/ ctx[3]);
    			}

    			if (dirty & /*className, tip*/ 17) {
    				toggle_class(i, "tip", /*tip*/ ctx[4]);
    			}

    			if (dirty & /*className, small*/ 3) {
    				toggle_class(i, "text-base", /*small*/ ctx[1]);
    			}

    			if (dirty & /*className, xs*/ 5) {
    				toggle_class(i, "text-xs", /*xs*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { small = false } = $$props;
    	let { xs = false } = $$props;
    	let { reverse = false } = $$props;
    	let { tip = false } = $$props;
    	let { color = "default" } = $$props;
    	const writable_props = ["class", "small", "xs", "reverse", "tip", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("class" in $$props) $$invalidate(0, className = $$props.class);
    		if ("small" in $$props) $$invalidate(1, small = $$props.small);
    		if ("xs" in $$props) $$invalidate(2, xs = $$props.xs);
    		if ("reverse" in $$props) $$invalidate(3, reverse = $$props.reverse);
    		if ("tip" in $$props) $$invalidate(4, tip = $$props.tip);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			small,
    			xs,
    			reverse,
    			tip,
    			color
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("className" in $$props) $$invalidate(0, className = $$props.className);
    		if ("small" in $$props) $$invalidate(1, small = $$props.small);
    		if ("xs" in $$props) $$invalidate(2, xs = $$props.xs);
    		if ("reverse" in $$props) $$invalidate(3, reverse = $$props.reverse);
    		if ("tip" in $$props) $$invalidate(4, tip = $$props.tip);
    		if ("color" in $$props) $$invalidate(5, color = $$props.color);
    	};

    	return [className, small, xs, reverse, tip, color, $$scope, $$slots, click_handler];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			class: 0,
    			small: 1,
    			xs: 2,
    			reverse: 3,
    			tip: 4,
    			color: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get class() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xs() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xs(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reverse() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reverse(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tip() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tip(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const noDepth = ["white", "black", "transparent"];

    function getClass(prop, color, depth, defaultDepth) {
      if (noDepth.includes(color)) {
        return `${prop}-${color}`;
      }
      return `${prop}-${color}-${depth || defaultDepth} `;
    }

    function utils(color, defaultDepth = 500) {
      return {
        bg: depth => getClass("bg", color, depth, defaultDepth),
        border: depth => getClass("border", color, depth, defaultDepth),
        txt: depth => getClass("text", color, depth, defaultDepth),
        caret: depth => getClass("caret", color, depth, defaultDepth)
      };
    }

    class ClassBuilder {
      constructor(classes, defaultClasses) {
        this.defaults =
          typeof classes === "function" ? classes(defaultClasses) : classes;

        this.classes = this.defaults;
      }

      flush() {
        this.classes = this.defaults;

        return this;
      }

      extend(...fns) {
        return this;
      }

      get() {
        return this.classes;
      }

      replace(classes, cond = true) {
        if (cond && classes) {
          this.classes = Object.keys(classes).reduce(
            (acc, from) => acc.replace(new RegExp(from, "g"), classes[from]),
            this.classes
          );
        }

        return this;
      }

      remove(classes, cond = true) {
        if (cond && classes) {
          this.classes = classes
            .split(" ")
            .reduce(
              (acc, cur) => acc.replace(new RegExp(cur, "g"), ""),
              this.classes
            );
        }

        return this;
      }

      add(className, cond = true, defaultValue) {
        if (!cond || !className) return this;

        switch (typeof className) {
          case "string":
          default:
            this.classes += ` ${className} `;
            return this;
          case "function":
            this.classes += ` ${className(defaultValue || this.classes)} `;
            return this;
        }
      }
    }

    function filterProps(reserved, props) {

      return Object.keys(props).reduce(
        (acc, cur) =>
          cur.includes("$$") || cur.includes("Class") || reserved.includes(cur)
            ? acc
            : { ...acc, [cur]: props[cur] },
        {}
      );
    }

    // Thanks Lagden! https://svelte.dev/repl/61d9178d2b9944f2aa2bfe31612ab09f?version=3.6.7
    function ripple(color, centered) {
      return function(event) {
        const target = event.currentTarget;
        const circle = document.createElement("span");
        const d = Math.max(target.clientWidth, target.clientHeight);

        const removeCircle = () => {
          circle.remove();
          circle.removeEventListener("animationend", removeCircle);
        };

        circle.addEventListener("animationend", removeCircle);
        circle.style.width = circle.style.height = `${d}px`;
        const rect = target.getBoundingClientRect();

        if (centered) {
          circle.classList.add(
            "absolute",
            "top-0",
            "left-0",
            "ripple-centered",
            `bg-${color}-transDark`
          );
        } else {
          circle.style.left = `${event.clientX - rect.left - d / 2}px`;
          circle.style.top = `${event.clientY - rect.top - d / 2}px`;

          circle.classList.add("ripple-normal", `bg-${color}-trans`);
        }

        circle.classList.add("ripple");

        target.appendChild(circle);
      };
    }

    function r(color = "primary", centered = false) {
      return function(node) {
        node.addEventListener("click", ripple(color, centered));

        return {
          onDestroy: () => node.removeEventListener("click")
        };
      };
    }

    /* node_modules\smelte\src\components\Button\Button.svelte generated by Svelte v3.18.2 */
    const file$1 = "node_modules\\smelte\\src\\components\\Button\\Button.svelte";

    // (150:0) {:else}
    function create_else_block(ctx) {
    	let button;
    	let t;
    	let ripple_action;
    	let current;
    	let dispose;
    	let if_block = /*icon*/ ctx[3] && create_if_block_2(ctx);
    	const default_slot_template = /*$$slots*/ ctx[42].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[51], null);

    	let button_levels = [
    		{ class: /*classes*/ ctx[1] },
    		/*props*/ ctx[8],
    		{ disabled: /*disabled*/ ctx[2] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			button = element("button");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$1, 150, 2, 4054);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(ripple_action = /*ripple*/ ctx[7].call(null, button)),
    				listen_dev(button, "click", /*click_handler_3*/ ctx[50], false, false, false),
    				listen_dev(button, "click", /*click_handler_1*/ ctx[46], false, false, false),
    				listen_dev(button, "mouseover", /*mouseover_handler_1*/ ctx[47], false, false, false),
    				listen_dev(button, "*", /*_handler_1*/ ctx[48], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 1048576) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[51], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[51], dirty, null));
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty[0] & /*classes*/ 2 && { class: /*classes*/ ctx[1] },
    				dirty[0] & /*props*/ 256 && /*props*/ ctx[8],
    				dirty[0] & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] }
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_else_block.name,
    		type: "else",
    		source: "(150:0) {:else}",
    		ctx
    	});

    	return block_1;
    }

    // (129:0) {#if href}
    function create_if_block(ctx) {
    	let a;
    	let button;
    	let t;
    	let ripple_action;
    	let current;
    	let dispose;
    	let if_block = /*icon*/ ctx[3] && create_if_block_1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[42].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[51], null);

    	let button_levels = [
    		{ class: /*classes*/ ctx[1] },
    		/*props*/ ctx[8],
    		{ disabled: /*disabled*/ ctx[2] }
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	let a_levels = [{ href: /*href*/ ctx[5] }, /*props*/ ctx[8]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block_1 = {
    		c: function create() {
    			a = element("a");
    			button = element("button");
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			set_attributes(button, button_data);
    			add_location(button, file$1, 133, 4, 3754);
    			set_attributes(a, a_data);
    			add_location(a, file$1, 129, 2, 3717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, button);
    			if (if_block) if_block.m(button, null);
    			append_dev(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(ripple_action = /*ripple*/ ctx[7].call(null, button)),
    				listen_dev(button, "click", /*click_handler_2*/ ctx[49], false, false, false),
    				listen_dev(button, "click", /*click_handler*/ ctx[43], false, false, false),
    				listen_dev(button, "mouseover", /*mouseover_handler*/ ctx[44], false, false, false),
    				listen_dev(button, "*", /*_handler*/ ctx[45], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (/*icon*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot && default_slot.p && dirty[1] & /*$$scope*/ 1048576) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[51], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[51], dirty, null));
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty[0] & /*classes*/ 2 && { class: /*classes*/ ctx[1] },
    				dirty[0] & /*props*/ 256 && /*props*/ ctx[8],
    				dirty[0] & /*disabled*/ 4 && { disabled: /*disabled*/ ctx[2] }
    			]));

    			set_attributes(a, get_spread_update(a_levels, [
    				dirty[0] & /*href*/ 32 && { href: /*href*/ ctx[5] },
    				dirty[0] & /*props*/ 256 && /*props*/ ctx[8]
    			]));
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block.name,
    		type: "if",
    		source: "(129:0) {#if href}",
    		ctx
    	});

    	return block_1;
    }

    // (161:4) {#if icon}
    function create_if_block_2(ctx) {
    	let current;

    	const icon_1 = new Icon({
    			props: {
    				class: /*iClasses*/ ctx[6],
    				small: /*small*/ ctx[4],
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block_1 = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iClasses*/ 64) icon_1_changes.class = /*iClasses*/ ctx[6];
    			if (dirty[0] & /*small*/ 16) icon_1_changes.small = /*small*/ ctx[4];

    			if (dirty[0] & /*icon*/ 8 | dirty[1] & /*$$scope*/ 1048576) {
    				icon_1_changes.$$scope = { dirty, ctx };
    			}

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(161:4) {#if icon}",
    		ctx
    	});

    	return block_1;
    }

    // (162:6) <Icon class={iClasses} {small}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*icon*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*icon*/ 8) set_data_dev(t, /*icon*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(162:6) <Icon class={iClasses} {small}>",
    		ctx
    	});

    	return block_1;
    }

    // (144:6) {#if icon}
    function create_if_block_1(ctx) {
    	let current;

    	const icon_1 = new Icon({
    			props: {
    				class: /*iClasses*/ ctx[6],
    				small: /*small*/ ctx[4],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block_1 = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iClasses*/ 64) icon_1_changes.class = /*iClasses*/ ctx[6];
    			if (dirty[0] & /*small*/ 16) icon_1_changes.small = /*small*/ ctx[4];

    			if (dirty[0] & /*icon*/ 8 | dirty[1] & /*$$scope*/ 1048576) {
    				icon_1_changes.$$scope = { dirty, ctx };
    			}

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(144:6) {#if icon}",
    		ctx
    	});

    	return block_1;
    }

    // (145:8) <Icon class={iClasses} {small}>
    function create_default_slot(ctx) {
    	let t;

    	const block_1 = {
    		c: function create() {
    			t = text(/*icon*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*icon*/ 8) set_data_dev(t, /*icon*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(145:8) <Icon class={iClasses} {small}>",
    		ctx
    	});

    	return block_1;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[5]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block_1 = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    const classesDefault = "py-2 px-4 uppercase text-sm font-medium relative overflow-hidden";
    const basicDefault = "text-white transition";
    const outlinedDefault = "bg-transparent border border-solid";
    const textDefault = "bg-transparent border-none px-4 hover:bg-transparent";
    const iconDefault = "p-4 flex items-center";
    const fabDefault = "hover:bg-transparent";
    const smallDefault = "p-1 h-4 w-4";
    const disabledDefault = "bg-gray-300 text-gray-500 dark:bg-dark-400 elevation-none pointer-events-none hover:bg-gray-300 cursor-default";
    const elevationDefault = "hover:elevation-5 elevation-3";

    function instance$2($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { value = false } = $$props;
    	let { outlined = false } = $$props;
    	let { text = false } = $$props;
    	let { block = false } = $$props;
    	let { disabled = false } = $$props;
    	let { icon = null } = $$props;
    	let { small = false } = $$props;
    	let { light = false } = $$props;
    	let { dark = false } = $$props;
    	let { flat = false } = $$props;
    	let { iconClass = "" } = $$props;
    	let { color = "primary" } = $$props;
    	let { href = null } = $$props;
    	let { fab = false } = $$props;
    	let { remove = "" } = $$props;
    	let { add = "" } = $$props;
    	let { replace = {} } = $$props;
    	let { classes = classesDefault } = $$props;
    	let { basicClasses = basicDefault } = $$props;
    	let { outlinedClasses = outlinedDefault } = $$props;
    	let { textClasses = textDefault } = $$props;
    	let { iconClasses = iconDefault } = $$props;
    	let { fabClasses = fabDefault } = $$props;
    	let { smallClasses = smallDefault } = $$props;
    	let { disabledClasses = disabledDefault } = $$props;
    	let { elevationClasses = elevationDefault } = $$props;
    	fab = fab || text && icon;
    	const basic = !outlined && !text && !fab;
    	const elevation = (basic || icon) && !disabled && !flat && !text;
    	let Classes = i => i;
    	let iClasses = i => i;
    	let shade = 0;
    	const { bg, border, txt } = utils(color);
    	const cb = new ClassBuilder(classes, classesDefault);
    	let iconCb;

    	if (icon) {
    		iconCb = new ClassBuilder(iconClass);
    	}

    	const ripple = r(text || fab || outlined ? color : "white");

    	const props = filterProps(
    		[
    			"outlined",
    			"text",
    			"color",
    			"block",
    			"disabled",
    			"icon",
    			"small",
    			"light",
    			"dark",
    			"flat",
    			"add",
    			"remove",
    			"replace"
    		],
    		$$props
    	);

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function mouseover_handler(event) {
    		bubble($$self, event);
    	}

    	function _handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function mouseover_handler_1(event) {
    		bubble($$self, event);
    	}

    	function _handler_1(event) {
    		bubble($$self, event);
    	}

    	const click_handler_2 = () => $$invalidate(0, value = !value);
    	const click_handler_3 = () => $$invalidate(0, value = !value);

    	$$self.$set = $$new_props => {
    		$$invalidate(41, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(10, className = $$new_props.class);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("outlined" in $$new_props) $$invalidate(11, outlined = $$new_props.outlined);
    		if ("text" in $$new_props) $$invalidate(12, text = $$new_props.text);
    		if ("block" in $$new_props) $$invalidate(13, block = $$new_props.block);
    		if ("disabled" in $$new_props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    		if ("small" in $$new_props) $$invalidate(4, small = $$new_props.small);
    		if ("light" in $$new_props) $$invalidate(14, light = $$new_props.light);
    		if ("dark" in $$new_props) $$invalidate(15, dark = $$new_props.dark);
    		if ("flat" in $$new_props) $$invalidate(16, flat = $$new_props.flat);
    		if ("iconClass" in $$new_props) $$invalidate(17, iconClass = $$new_props.iconClass);
    		if ("color" in $$new_props) $$invalidate(18, color = $$new_props.color);
    		if ("href" in $$new_props) $$invalidate(5, href = $$new_props.href);
    		if ("fab" in $$new_props) $$invalidate(9, fab = $$new_props.fab);
    		if ("remove" in $$new_props) $$invalidate(19, remove = $$new_props.remove);
    		if ("add" in $$new_props) $$invalidate(20, add = $$new_props.add);
    		if ("replace" in $$new_props) $$invalidate(21, replace = $$new_props.replace);
    		if ("classes" in $$new_props) $$invalidate(1, classes = $$new_props.classes);
    		if ("basicClasses" in $$new_props) $$invalidate(22, basicClasses = $$new_props.basicClasses);
    		if ("outlinedClasses" in $$new_props) $$invalidate(23, outlinedClasses = $$new_props.outlinedClasses);
    		if ("textClasses" in $$new_props) $$invalidate(24, textClasses = $$new_props.textClasses);
    		if ("iconClasses" in $$new_props) $$invalidate(25, iconClasses = $$new_props.iconClasses);
    		if ("fabClasses" in $$new_props) $$invalidate(26, fabClasses = $$new_props.fabClasses);
    		if ("smallClasses" in $$new_props) $$invalidate(27, smallClasses = $$new_props.smallClasses);
    		if ("disabledClasses" in $$new_props) $$invalidate(28, disabledClasses = $$new_props.disabledClasses);
    		if ("elevationClasses" in $$new_props) $$invalidate(29, elevationClasses = $$new_props.elevationClasses);
    		if ("$$scope" in $$new_props) $$invalidate(51, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			value,
    			outlined,
    			text,
    			block,
    			disabled,
    			icon,
    			small,
    			light,
    			dark,
    			flat,
    			iconClass,
    			color,
    			href,
    			fab,
    			remove,
    			add,
    			replace,
    			classes,
    			basicClasses,
    			outlinedClasses,
    			textClasses,
    			iconClasses,
    			fabClasses,
    			smallClasses,
    			disabledClasses,
    			elevationClasses,
    			Classes,
    			iClasses,
    			shade,
    			iconCb,
    			normal,
    			lighter
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(41, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(10, className = $$new_props.className);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("outlined" in $$props) $$invalidate(11, outlined = $$new_props.outlined);
    		if ("text" in $$props) $$invalidate(12, text = $$new_props.text);
    		if ("block" in $$props) $$invalidate(13, block = $$new_props.block);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$new_props.disabled);
    		if ("icon" in $$props) $$invalidate(3, icon = $$new_props.icon);
    		if ("small" in $$props) $$invalidate(4, small = $$new_props.small);
    		if ("light" in $$props) $$invalidate(14, light = $$new_props.light);
    		if ("dark" in $$props) $$invalidate(15, dark = $$new_props.dark);
    		if ("flat" in $$props) $$invalidate(16, flat = $$new_props.flat);
    		if ("iconClass" in $$props) $$invalidate(17, iconClass = $$new_props.iconClass);
    		if ("color" in $$props) $$invalidate(18, color = $$new_props.color);
    		if ("href" in $$props) $$invalidate(5, href = $$new_props.href);
    		if ("fab" in $$props) $$invalidate(9, fab = $$new_props.fab);
    		if ("remove" in $$props) $$invalidate(19, remove = $$new_props.remove);
    		if ("add" in $$props) $$invalidate(20, add = $$new_props.add);
    		if ("replace" in $$props) $$invalidate(21, replace = $$new_props.replace);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("basicClasses" in $$props) $$invalidate(22, basicClasses = $$new_props.basicClasses);
    		if ("outlinedClasses" in $$props) $$invalidate(23, outlinedClasses = $$new_props.outlinedClasses);
    		if ("textClasses" in $$props) $$invalidate(24, textClasses = $$new_props.textClasses);
    		if ("iconClasses" in $$props) $$invalidate(25, iconClasses = $$new_props.iconClasses);
    		if ("fabClasses" in $$props) $$invalidate(26, fabClasses = $$new_props.fabClasses);
    		if ("smallClasses" in $$props) $$invalidate(27, smallClasses = $$new_props.smallClasses);
    		if ("disabledClasses" in $$props) $$invalidate(28, disabledClasses = $$new_props.disabledClasses);
    		if ("elevationClasses" in $$props) $$invalidate(29, elevationClasses = $$new_props.elevationClasses);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("iClasses" in $$props) $$invalidate(6, iClasses = $$new_props.iClasses);
    		if ("shade" in $$props) $$invalidate(30, shade = $$new_props.shade);
    		if ("iconCb" in $$props) $$invalidate(31, iconCb = $$new_props.iconCb);
    		if ("normal" in $$props) $$invalidate(32, normal = $$new_props.normal);
    		if ("lighter" in $$props) $$invalidate(33, lighter = $$new_props.lighter);
    	};

    	let normal;
    	let lighter;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*light, dark, shade*/ 1073790976) {
    			 {
    				$$invalidate(30, shade = light ? 200 : 0);
    				$$invalidate(30, shade = dark ? -400 : shade);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*shade*/ 1073741824) {
    			 $$invalidate(32, normal = 500 - shade);
    		}

    		if ($$self.$$.dirty[0] & /*shade*/ 1073741824) {
    			 $$invalidate(33, lighter = 400 - shade);
    		}

    		if ($$self.$$.dirty[0] & /*basicClasses, elevationClasses, outlinedClasses, outlined, text, textClasses, iconClasses, icon, fab, disabledClasses, disabled, smallClasses, small, block, fabClasses, className, remove, replace, add*/ 1073233436 | $$self.$$.dirty[1] & /*normal, lighter*/ 6) {
    			 $$invalidate(1, classes = cb.flush().add(basicClasses, basic, basicDefault).add(`${bg(normal)} hover:${bg(lighter)}`, basic).add(elevationClasses, elevation, elevationDefault).add(outlinedClasses, outlined, outlinedDefault).add(`${border(lighter)} ${txt(normal)} hover:${bg("trans")} dark-hover:${bg("transDark")}`, outlined).add(`${txt(lighter)}`, text).add(textClasses, text, textDefault).add(iconClasses, icon, iconDefault).remove("py-2", icon).remove(txt(lighter), fab).add(disabledClasses, disabled, disabledDefault).add(smallClasses, small, smallDefault).add("flex items-center justify-center", small && icon).add("border-solid", outlined).add("rounded-full", icon).add("w-full", block).add("rounded", basic || outlined || text).add("button", !icon).add(fabClasses, fab, fabDefault).add(`hover:${bg("transLight")}`, fab).add(className).remove(remove).replace(replace).add(add).get());
    		}

    		if ($$self.$$.dirty[0] & /*fab, iconClass*/ 131584 | $$self.$$.dirty[1] & /*iconCb*/ 1) {
    			 if (iconCb) {
    				$$invalidate(6, iClasses = iconCb.flush().add(txt(), fab && !iconClass).get());
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		classes,
    		disabled,
    		icon,
    		small,
    		href,
    		iClasses,
    		ripple,
    		props,
    		fab,
    		className,
    		outlined,
    		text,
    		block,
    		light,
    		dark,
    		flat,
    		iconClass,
    		color,
    		remove,
    		add,
    		replace,
    		basicClasses,
    		outlinedClasses,
    		textClasses,
    		iconClasses,
    		fabClasses,
    		smallClasses,
    		disabledClasses,
    		elevationClasses,
    		shade,
    		iconCb,
    		normal,
    		lighter,
    		basic,
    		elevation,
    		Classes,
    		bg,
    		border,
    		txt,
    		cb,
    		$$props,
    		$$slots,
    		click_handler,
    		mouseover_handler,
    		_handler,
    		click_handler_1,
    		mouseover_handler_1,
    		_handler_1,
    		click_handler_2,
    		click_handler_3,
    		$$scope
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				class: 10,
    				value: 0,
    				outlined: 11,
    				text: 12,
    				block: 13,
    				disabled: 2,
    				icon: 3,
    				small: 4,
    				light: 14,
    				dark: 15,
    				flat: 16,
    				iconClass: 17,
    				color: 18,
    				href: 5,
    				fab: 9,
    				remove: 19,
    				add: 20,
    				replace: 21,
    				classes: 1,
    				basicClasses: 22,
    				outlinedClasses: 23,
    				textClasses: 24,
    				iconClasses: 25,
    				fabClasses: 26,
    				smallClasses: 27,
    				disabledClasses: 28,
    				elevationClasses: 29
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get class() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get block() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set block(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get light() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set light(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dark() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dark(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flat() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flat(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClass() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClass(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fab() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fab(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get basicClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set basicClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlinedClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlinedClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fabClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fabClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get smallClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set smallClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabledClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabledClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get elevationClasses() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elevationClasses(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Info.svelte generated by Svelte v3.18.2 */
    const file$2 = "src\\Info.svelte";

    // (14:4) <Button color="secondary">
    function create_default_slot$1(ctx) {
    	let a;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "API Documentation";
    			attr_dev(a, "href", "/docs");
    			add_location(a, file$2, 14, 6, 486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(14:4) <Button color=\\\"secondary\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let p;
    	let t1;
    	let current;

    	const button = new Button({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "This is a simple journaling app that you can use for anything! It also\r\n        has a public api. It looks great on mobile too and make sure to try the\r\n        light mode!";
    			t1 = space();
    			create_component(button.$$.fragment);
    			add_location(p, file$2, 7, 6, 237);
    			attr_dev(div0, "class", "bg-white dark:bg-dark-500 max-w-lg m-8 p-8 rounded");
    			add_location(div0, file$2, 6, 4, 165);
    			attr_dev(div1, "class", "mt-8 flex flex-col items-center");
    			add_location(div1, file$2, 5, 2, 114);
    			attr_dev(div2, "class", "flex justify-center");
    			add_location(div2, file$2, 4, 0, 77);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div1, t1);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* node_modules\smelte\src\components\TextField\Label.svelte generated by Svelte v3.18.2 */
    const file$3 = "node_modules\\smelte\\src\\components\\TextField\\Label.svelte";

    function create_fragment$4(ctx) {
    	let label;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[22].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[21], null);

    	let label_levels = [
    		{
    			class: "" + (/*lClasses*/ ctx[1] + " " + /*className*/ ctx[0])
    		},
    		/*props*/ ctx[2]
    	];

    	let label_data = {};

    	for (let i = 0; i < label_levels.length; i += 1) {
    		label_data = assign(label_data, label_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			if (default_slot) default_slot.c();
    			set_attributes(label, label_data);
    			toggle_class(label, "svelte-g3sy94", true);
    			add_location(label, file$3, 60, 0, 1474);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);

    			if (default_slot) {
    				default_slot.m(label, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2097152) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[21], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[21], dirty, null));
    			}

    			set_attributes(label, get_spread_update(label_levels, [
    				dirty & /*lClasses, className*/ 3 && {
    					class: "" + (/*lClasses*/ ctx[1] + " " + /*className*/ ctx[0])
    				},
    				dirty & /*props*/ 4 && /*props*/ ctx[2]
    			]));

    			toggle_class(label, "svelte-g3sy94", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { focused = false } = $$props;
    	let { error = false } = $$props;
    	let { outlined = false } = $$props;
    	let { labelOnTop = false } = $$props;
    	let { prepend = false } = $$props;
    	let { color = "primary" } = $$props;
    	let { bgColor = "white" } = $$props;
    	let labelDefault = `pt-4 absolute top-0 label-transition block pb-2 px-4 pointer-events-none cursor-text`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { labelClasses = labelDefault } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const l = new ClassBuilder(labelClasses, labelDefault);
    	let lClasses = i => i;
    	const props = filterProps(["focused", "error", "outlined", "labelOnTop", "prepend", "color"], $$props);
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ("focused" in $$new_props) $$invalidate(3, focused = $$new_props.focused);
    		if ("error" in $$new_props) $$invalidate(4, error = $$new_props.error);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("labelOnTop" in $$new_props) $$invalidate(6, labelOnTop = $$new_props.labelOnTop);
    		if ("prepend" in $$new_props) $$invalidate(7, prepend = $$new_props.prepend);
    		if ("color" in $$new_props) $$invalidate(8, color = $$new_props.color);
    		if ("bgColor" in $$new_props) $$invalidate(9, bgColor = $$new_props.bgColor);
    		if ("add" in $$new_props) $$invalidate(10, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(11, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(12, replace = $$new_props.replace);
    		if ("labelClasses" in $$new_props) $$invalidate(13, labelClasses = $$new_props.labelClasses);
    		if ("$$scope" in $$new_props) $$invalidate(21, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			focused,
    			error,
    			outlined,
    			labelOnTop,
    			prepend,
    			color,
    			bgColor,
    			labelDefault,
    			add,
    			remove,
    			replace,
    			labelClasses,
    			lClasses
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(20, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(0, className = $$new_props.className);
    		if ("focused" in $$props) $$invalidate(3, focused = $$new_props.focused);
    		if ("error" in $$props) $$invalidate(4, error = $$new_props.error);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("labelOnTop" in $$props) $$invalidate(6, labelOnTop = $$new_props.labelOnTop);
    		if ("prepend" in $$props) $$invalidate(7, prepend = $$new_props.prepend);
    		if ("color" in $$props) $$invalidate(8, color = $$new_props.color);
    		if ("bgColor" in $$props) $$invalidate(9, bgColor = $$new_props.bgColor);
    		if ("labelDefault" in $$props) labelDefault = $$new_props.labelDefault;
    		if ("add" in $$props) $$invalidate(10, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(11, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(12, replace = $$new_props.replace);
    		if ("labelClasses" in $$props) $$invalidate(13, labelClasses = $$new_props.labelClasses);
    		if ("lClasses" in $$props) $$invalidate(1, lClasses = $$new_props.lClasses);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*focused, error, labelOnTop, outlined, bgColor, prepend, add, remove, replace*/ 7928) {
    			 $$invalidate(1, lClasses = l.flush().add(txt(), focused && !error).add("text-error-500", focused && error).add("label-top text-xs", labelOnTop).remove("pt-4 pb-2 px-4 px-1 pt-0", labelOnTop && outlined).add(`ml-3 p-1 pt-0 mt-0 bg-${bgColor} dark:bg-dark-500`, labelOnTop && outlined).remove("px-4", prepend).add("pr-4 pl-10", prepend).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		lClasses,
    		props,
    		focused,
    		error,
    		outlined,
    		labelOnTop,
    		prepend,
    		color,
    		bgColor,
    		add,
    		remove,
    		replace,
    		labelClasses,
    		labelDefault,
    		bg,
    		border,
    		txt,
    		caret,
    		l,
    		$$props,
    		$$scope,
    		$$slots
    	];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$4, safe_not_equal, {
    			class: 0,
    			focused: 3,
    			error: 4,
    			outlined: 5,
    			labelOnTop: 6,
    			prepend: 7,
    			color: 8,
    			bgColor: 9,
    			add: 10,
    			remove: 11,
    			replace: 12,
    			labelClasses: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focused() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelOnTop() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelOnTop(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prepend() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prepend(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelClasses() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelClasses(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quadIn(t) {
        return t * t;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => `overflow: hidden;` +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* node_modules\smelte\src\components\TextField\Hint.svelte generated by Svelte v3.18.2 */
    const file$4 = "node_modules\\smelte\\src\\components\\TextField\\Hint.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*hint*/ ctx[1]);
    			t1 = space();
    			t2 = text(/*error*/ ctx[0]);
    			attr_dev(div, "class", /*classes*/ ctx[3]);
    			add_location(div, file$4, 36, 0, 813);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*hint*/ 2) set_data_dev(t0, /*hint*/ ctx[1]);
    			if (!current || dirty & /*error*/ 1) set_data_dev(t2, /*error*/ ctx[0]);

    			if (!current || dirty & /*classes*/ 8) {
    				attr_dev(div, "class", /*classes*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*transitionProps*/ ctx[2], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*transitionProps*/ ctx[2], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { class: className = "text-xs py-1 pl-4 absolute bottom-1 left-0" } = $$props;
    	let { error = false } = $$props;
    	let { hint = "" } = $$props;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { transitionProps = { y: -10, duration: 100, easing: quadOut } } = $$props;
    	const l = new ClassBuilder(className, className);
    	let Classes = i => i;
    	const props = filterProps(["error", "hint"], $$props);

    	$$self.$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(4, className = $$new_props.class);
    		if ("error" in $$new_props) $$invalidate(0, error = $$new_props.error);
    		if ("hint" in $$new_props) $$invalidate(1, hint = $$new_props.hint);
    		if ("add" in $$new_props) $$invalidate(5, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(6, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(7, replace = $$new_props.replace);
    		if ("transitionProps" in $$new_props) $$invalidate(2, transitionProps = $$new_props.transitionProps);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			error,
    			hint,
    			add,
    			remove,
    			replace,
    			transitionProps,
    			Classes,
    			classes
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(4, className = $$new_props.className);
    		if ("error" in $$props) $$invalidate(0, error = $$new_props.error);
    		if ("hint" in $$props) $$invalidate(1, hint = $$new_props.hint);
    		if ("add" in $$props) $$invalidate(5, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(6, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(7, replace = $$new_props.replace);
    		if ("transitionProps" in $$props) $$invalidate(2, transitionProps = $$new_props.transitionProps);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*error, hint, add, remove, replace*/ 227) {
    			 $$invalidate(3, classes = l.flush().add("text-error-500", error).add("text-gray-600", hint).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [error, hint, transitionProps, classes, className, add, remove, replace];
    }

    class Hint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {
    			class: 4,
    			error: 0,
    			hint: 1,
    			add: 5,
    			remove: 6,
    			replace: 7,
    			transitionProps: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hint",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get class() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionProps() {
    		throw new Error("<Hint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionProps(value) {
    		throw new Error("<Hint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\Underline.svelte generated by Svelte v3.18.2 */
    const file$5 = "node_modules\\smelte\\src\\components\\TextField\\Underline.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*classes*/ ctx[3]) + " svelte-xd9zs6"));
    			set_style(div0, "height", "2px");
    			set_style(div0, "transition", "width .2s ease");
    			add_location(div0, file$5, 61, 2, 1180);
    			attr_dev(div1, "class", div1_class_value = "line absolute bottom-0 left-0 w-full bg-gray-600 " + /*className*/ ctx[0] + " svelte-xd9zs6");
    			toggle_class(div1, "hidden", /*noUnderline*/ ctx[1] || /*outlined*/ ctx[2]);
    			add_location(div1, file$5, 58, 0, 1060);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*classes*/ 8 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*classes*/ ctx[3]) + " svelte-xd9zs6"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*className*/ 1 && div1_class_value !== (div1_class_value = "line absolute bottom-0 left-0 w-full bg-gray-600 " + /*className*/ ctx[0] + " svelte-xd9zs6")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*className, noUnderline, outlined*/ 7) {
    				toggle_class(div1, "hidden", /*noUnderline*/ ctx[1] || /*outlined*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { noUnderline = false } = $$props;
    	let { outlined = false } = $$props;
    	let { focused = false } = $$props;
    	let { error = false } = $$props;
    	let { color = "primary" } = $$props;
    	let defaultClasses = `mx-auto w-0`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { lineClasses = defaultClasses } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const l = new ClassBuilder(lineClasses, defaultClasses);
    	let Classes = i => i;
    	const props = filterProps(["focused", "error", "outlined", "labelOnTop", "prepend", "bgcolor", "color"], $$props);

    	$$self.$set = $$new_props => {
    		$$invalidate(19, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(0, className = $$new_props.class);
    		if ("noUnderline" in $$new_props) $$invalidate(1, noUnderline = $$new_props.noUnderline);
    		if ("outlined" in $$new_props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("focused" in $$new_props) $$invalidate(4, focused = $$new_props.focused);
    		if ("error" in $$new_props) $$invalidate(5, error = $$new_props.error);
    		if ("color" in $$new_props) $$invalidate(6, color = $$new_props.color);
    		if ("add" in $$new_props) $$invalidate(7, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(8, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(9, replace = $$new_props.replace);
    		if ("lineClasses" in $$new_props) $$invalidate(10, lineClasses = $$new_props.lineClasses);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			noUnderline,
    			outlined,
    			focused,
    			error,
    			color,
    			defaultClasses,
    			add,
    			remove,
    			replace,
    			lineClasses,
    			Classes,
    			classes
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(19, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(0, className = $$new_props.className);
    		if ("noUnderline" in $$props) $$invalidate(1, noUnderline = $$new_props.noUnderline);
    		if ("outlined" in $$props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("focused" in $$props) $$invalidate(4, focused = $$new_props.focused);
    		if ("error" in $$props) $$invalidate(5, error = $$new_props.error);
    		if ("color" in $$props) $$invalidate(6, color = $$new_props.color);
    		if ("defaultClasses" in $$props) defaultClasses = $$new_props.defaultClasses;
    		if ("add" in $$props) $$invalidate(7, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(8, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(9, replace = $$new_props.replace);
    		if ("lineClasses" in $$props) $$invalidate(10, lineClasses = $$new_props.lineClasses);
    		if ("Classes" in $$props) Classes = $$new_props.Classes;
    		if ("classes" in $$props) $$invalidate(3, classes = $$new_props.classes);
    	};

    	let classes;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*focused, error, add, remove, replace*/ 944) {
    			 $$invalidate(3, classes = l.flush().add(txt(), focused && !error).add("bg-error-500", error).add("w-full", focused || error).add(bg(), focused).add(add).remove(remove).replace(replace).get());
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		className,
    		noUnderline,
    		outlined,
    		classes,
    		focused,
    		error,
    		color,
    		add,
    		remove,
    		replace,
    		lineClasses
    	];
    }

    class Underline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {
    			class: 0,
    			noUnderline: 1,
    			outlined: 2,
    			focused: 4,
    			error: 5,
    			color: 6,
    			add: 7,
    			remove: 8,
    			replace: 9,
    			lineClasses: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Underline",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get class() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noUnderline() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noUnderline(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focused() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lineClasses() {
    		throw new Error("<Underline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineClasses(value) {
    		throw new Error("<Underline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\TextField\TextField.svelte generated by Svelte v3.18.2 */
    const file$6 = "node_modules\\smelte\\src\\components\\TextField\\TextField.svelte";
    const get_prepend_slot_changes = dirty => ({});
    const get_prepend_slot_context = ctx => ({});
    const get_append_slot_changes = dirty => ({});
    const get_append_slot_context = ctx => ({});
    const get_label_slot_changes = dirty => ({});
    const get_label_slot_context = ctx => ({});

    // (137:4) <Label       {labelOnTop}       {focused}       {error}       {outlined}       {prepend}       {color}       {bgColor}     >
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*label*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*label*/ 8) set_data_dev(t, /*label*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(137:4) <Label       {labelOnTop}       {focused}       {error}       {outlined}       {prepend}       {color}       {bgColor}     >",
    		ctx
    	});

    	return block;
    }

    // (179:36) 
    function create_if_block_5(ctx) {
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			input.readOnly = true;
    			attr_dev(input, "class", /*iClasses*/ ctx[25]);
    			input.disabled = /*disabled*/ ctx[19];
    			input.value = /*value*/ ctx[0];
    			add_location(input, file$6, 179, 4, 4665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			dispose = [
    				listen_dev(input, "change", /*change_handler_2*/ ctx[61], false, false, false),
    				listen_dev(input, "input", /*input_handler_2*/ ctx[62], false, false, false),
    				listen_dev(input, "click", /*click_handler_2*/ ctx[63], false, false, false),
    				listen_dev(input, "blur", /*blur_handler_2*/ ctx[64], false, false, false),
    				listen_dev(input, "focus", /*focus_handler_2*/ ctx[65], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*iClasses*/ 33554432) {
    				attr_dev(input, "class", /*iClasses*/ ctx[25]);
    			}

    			if (dirty[0] & /*disabled*/ 524288) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[19]);
    			}

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(179:36) ",
    		ctx
    	});

    	return block;
    }

    // (163:32) 
    function create_if_block_4(ctx) {
    	let textarea_1;
    	let dispose;

    	let textarea_1_levels = [
    		{ rows: /*rows*/ ctx[10] },
    		{ "aria-label": /*label*/ ctx[3] },
    		{ class: /*iClasses*/ ctx[25] },
    		{ disabled: /*disabled*/ ctx[19] },
    		/*props*/ ctx[28],
    		{
    			placeholder: !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    		}
    	];

    	let textarea_1_data = {};

    	for (let i = 0; i < textarea_1_levels.length; i += 1) {
    		textarea_1_data = assign(textarea_1_data, textarea_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea_1 = element("textarea");
    			set_attributes(textarea_1, textarea_1_data);
    			add_location(textarea_1, file$6, 163, 4, 4317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea_1, anchor);
    			set_input_value(textarea_1, /*value*/ ctx[0]);

    			dispose = [
    				listen_dev(textarea_1, "change", /*change_handler_1*/ ctx[56], false, false, false),
    				listen_dev(textarea_1, "input", /*input_handler_1*/ ctx[57], false, false, false),
    				listen_dev(textarea_1, "click", /*click_handler_1*/ ctx[58], false, false, false),
    				listen_dev(textarea_1, "focus", /*focus_handler_1*/ ctx[59], false, false, false),
    				listen_dev(textarea_1, "blur", /*blur_handler_1*/ ctx[60], false, false, false),
    				listen_dev(textarea_1, "input", /*textarea_1_input_handler*/ ctx[67]),
    				listen_dev(textarea_1, "focus", /*toggleFocused*/ ctx[27], false, false, false),
    				listen_dev(textarea_1, "blur", /*toggleFocused*/ ctx[27], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea_1, get_spread_update(textarea_1_levels, [
    				dirty[0] & /*rows*/ 1024 && { rows: /*rows*/ ctx[10] },
    				dirty[0] & /*label*/ 8 && { "aria-label": /*label*/ ctx[3] },
    				dirty[0] & /*iClasses*/ 33554432 && { class: /*iClasses*/ ctx[25] },
    				dirty[0] & /*disabled*/ 524288 && { disabled: /*disabled*/ ctx[19] },
    				dirty[0] & /*props*/ 268435456 && /*props*/ ctx[28],
    				dirty[0] & /*value, placeholder*/ 17 && {
    					placeholder: !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    				}
    			]));

    			if (dirty[0] & /*value*/ 1) {
    				set_input_value(textarea_1, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea_1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(163:32) ",
    		ctx
    	});

    	return block;
    }

    // (148:2) {#if (!textarea && !select) || autocomplete}
    function create_if_block_3(ctx) {
    	let input;
    	let dispose;

    	let input_levels = [
    		{ "aria-label": /*label*/ ctx[3] },
    		{ class: /*iClasses*/ ctx[25] },
    		{ disabled: /*disabled*/ ctx[19] },
    		/*props*/ ctx[28],
    		{
    			placeholder: !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    		}
    	];

    	let input_data = {};

    	for (let i = 0; i < input_levels.length; i += 1) {
    		input_data = assign(input_data, input_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			set_attributes(input, input_data);
    			add_location(input, file$6, 148, 4, 3989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			dispose = [
    				listen_dev(input, "focus", /*toggleFocused*/ ctx[27], false, false, false),
    				listen_dev(input, "blur", /*toggleFocused*/ ctx[27], false, false, false),
    				listen_dev(input, "blur", /*blur_handler*/ ctx[51], false, false, false),
    				listen_dev(input, "input", /*input_input_handler*/ ctx[66]),
    				listen_dev(input, "change", /*change_handler*/ ctx[52], false, false, false),
    				listen_dev(input, "input", /*input_handler*/ ctx[53], false, false, false),
    				listen_dev(input, "click", /*click_handler*/ ctx[54], false, false, false),
    				listen_dev(input, "focus", /*focus_handler*/ ctx[55], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input, get_spread_update(input_levels, [
    				dirty[0] & /*label*/ 8 && { "aria-label": /*label*/ ctx[3] },
    				dirty[0] & /*iClasses*/ 33554432 && { class: /*iClasses*/ ctx[25] },
    				dirty[0] & /*disabled*/ 524288 && { disabled: /*disabled*/ ctx[19] },
    				dirty[0] & /*props*/ 268435456 && /*props*/ ctx[28],
    				dirty[0] & /*value, placeholder*/ 17 && {
    					placeholder: !/*value*/ ctx[0] ? /*placeholder*/ ctx[4] : ""
    				}
    			]));

    			if (dirty[0] & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(148:2) {#if (!textarea && !select) || autocomplete}",
    		ctx
    	});

    	return block;
    }

    // (192:2) {#if append}
    function create_if_block_2$1(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const append_slot_template = /*$$slots*/ ctx[50].append;
    	const append_slot = create_slot(append_slot_template, ctx, /*$$scope*/ ctx[70], get_append_slot_context);

    	const icon = new Icon({
    			props: {
    				reverse: /*appendReverse*/ ctx[14],
    				class: "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[26]() : "") + " " + /*iconClass*/ ctx[18]),
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (!append_slot) {
    				create_component(icon.$$.fragment);
    			}

    			if (append_slot) append_slot.c();
    			attr_dev(div, "class", /*aClasses*/ ctx[21]);
    			add_location(div, file$6, 192, 4, 4849);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!append_slot) {
    				mount_component(icon, div, null);
    			}

    			if (append_slot) {
    				append_slot.m(div, null);
    			}

    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_3*/ ctx[68], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!append_slot) {
    				const icon_changes = {};
    				if (dirty[0] & /*appendReverse*/ 16384) icon_changes.reverse = /*appendReverse*/ ctx[14];
    				if (dirty[0] & /*focused, iconClass*/ 262146) icon_changes.class = "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[26]() : "") + " " + /*iconClass*/ ctx[18]);

    				if (dirty[0] & /*append*/ 128 | dirty[2] & /*$$scope*/ 256) {
    					icon_changes.$$scope = { dirty, ctx };
    				}

    				icon.$set(icon_changes);
    			}

    			if (append_slot && append_slot.p && dirty[2] & /*$$scope*/ 256) {
    				append_slot.p(get_slot_context(append_slot_template, ctx, /*$$scope*/ ctx[70], get_append_slot_context), get_slot_changes(append_slot_template, /*$$scope*/ ctx[70], dirty, get_append_slot_changes));
    			}

    			if (!current || dirty[0] & /*aClasses*/ 2097152) {
    				attr_dev(div, "class", /*aClasses*/ ctx[21]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(append_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(append_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (!append_slot) {
    				destroy_component(icon);
    			}

    			if (append_slot) append_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(192:2) {#if append}",
    		ctx
    	});

    	return block;
    }

    // (198:8) <Icon           reverse={appendReverse}           class="{focused ? txt() : ""} {iconClass}"         >
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*append*/ ctx[7]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*append*/ 128) set_data_dev(t, /*append*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(198:8) <Icon           reverse={appendReverse}           class=\\\"{focused ? txt() : \\\"\\\"} {iconClass}\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (208:2) {#if prepend}
    function create_if_block_1$1(ctx) {
    	let div;
    	let current;
    	let dispose;
    	const prepend_slot_template = /*$$slots*/ ctx[50].prepend;
    	const prepend_slot = create_slot(prepend_slot_template, ctx, /*$$scope*/ ctx[70], get_prepend_slot_context);

    	const icon = new Icon({
    			props: {
    				reverse: /*prependReverse*/ ctx[15],
    				class: "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[26]() : "") + " " + /*iconClass*/ ctx[18]),
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (!prepend_slot) {
    				create_component(icon.$$.fragment);
    			}

    			if (prepend_slot) prepend_slot.c();
    			attr_dev(div, "class", /*pClasses*/ ctx[22]);
    			add_location(div, file$6, 208, 4, 5158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!prepend_slot) {
    				mount_component(icon, div, null);
    			}

    			if (prepend_slot) {
    				prepend_slot.m(div, null);
    			}

    			current = true;
    			dispose = listen_dev(div, "click", /*click_handler_4*/ ctx[69], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (!prepend_slot) {
    				const icon_changes = {};
    				if (dirty[0] & /*prependReverse*/ 32768) icon_changes.reverse = /*prependReverse*/ ctx[15];
    				if (dirty[0] & /*focused, iconClass*/ 262146) icon_changes.class = "" + ((/*focused*/ ctx[1] ? /*txt*/ ctx[26]() : "") + " " + /*iconClass*/ ctx[18]);

    				if (dirty[0] & /*prepend*/ 256 | dirty[2] & /*$$scope*/ 256) {
    					icon_changes.$$scope = { dirty, ctx };
    				}

    				icon.$set(icon_changes);
    			}

    			if (prepend_slot && prepend_slot.p && dirty[2] & /*$$scope*/ 256) {
    				prepend_slot.p(get_slot_context(prepend_slot_template, ctx, /*$$scope*/ ctx[70], get_prepend_slot_context), get_slot_changes(prepend_slot_template, /*$$scope*/ ctx[70], dirty, get_prepend_slot_changes));
    			}

    			if (!current || dirty[0] & /*pClasses*/ 4194304) {
    				attr_dev(div, "class", /*pClasses*/ ctx[22]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(prepend_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(prepend_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (!prepend_slot) {
    				destroy_component(icon);
    			}

    			if (prepend_slot) prepend_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(208:2) {#if prepend}",
    		ctx
    	});

    	return block;
    }

    // (214:8) <Icon           reverse={prependReverse}           class="{focused ? txt() : ""} {iconClass}"         >
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*prepend*/ ctx[8]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*prepend*/ 256) set_data_dev(t, /*prepend*/ ctx[8]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(214:8) <Icon           reverse={prependReverse}           class=\\\"{focused ? txt() : \\\"\\\"} {iconClass}\\\"         >",
    		ctx
    	});

    	return block;
    }

    // (230:2) {#if showHint}
    function create_if_block$1(ctx) {
    	let current;

    	const hint_1 = new Hint({
    			props: {
    				error: /*error*/ ctx[6],
    				hint: /*hint*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(hint_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(hint_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const hint_1_changes = {};
    			if (dirty[0] & /*error*/ 64) hint_1_changes.error = /*error*/ ctx[6];
    			if (dirty[0] & /*hint*/ 32) hint_1_changes.hint = /*hint*/ ctx[5];
    			hint_1.$set(hint_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hint_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hint_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hint_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(230:2) {#if showHint}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const label_slot_template = /*$$slots*/ ctx[50].label;
    	const label_slot = create_slot(label_slot_template, ctx, /*$$scope*/ ctx[70], get_label_slot_context);

    	const label_1 = new Label({
    			props: {
    				labelOnTop: /*labelOnTop*/ ctx[24],
    				focused: /*focused*/ ctx[1],
    				error: /*error*/ ctx[6],
    				outlined: /*outlined*/ ctx[2],
    				prepend: /*prepend*/ ctx[8],
    				color: /*color*/ ctx[16],
    				bgColor: /*bgColor*/ ctx[17],
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (!/*textarea*/ ctx[9] && !/*select*/ ctx[11] || /*autocomplete*/ ctx[12]) return create_if_block_3;
    		if (/*textarea*/ ctx[9] && !/*select*/ ctx[11]) return create_if_block_4;
    		if (/*select*/ ctx[11] && !/*autocomplete*/ ctx[12]) return create_if_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	let if_block1 = /*append*/ ctx[7] && create_if_block_2$1(ctx);
    	let if_block2 = /*prepend*/ ctx[8] && create_if_block_1$1(ctx);

    	const underline = new Underline({
    			props: {
    				noUnderline: /*noUnderline*/ ctx[13],
    				outlined: /*outlined*/ ctx[2],
    				focused: /*focused*/ ctx[1],
    				error: /*error*/ ctx[6]
    			},
    			$$inline: true
    		});

    	let if_block3 = /*showHint*/ ctx[23] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (!label_slot) {
    				create_component(label_1.$$.fragment);
    			}

    			if (label_slot) label_slot.c();
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			create_component(underline.$$.fragment);
    			t4 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div, "class", /*wClasses*/ ctx[20]);
    			add_location(div, file$6, 134, 0, 3738);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!label_slot) {
    				mount_component(label_1, div, null);
    			}

    			if (label_slot) {
    				label_slot.m(div, null);
    			}

    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t2);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t3);
    			mount_component(underline, div, null);
    			append_dev(div, t4);
    			if (if_block3) if_block3.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!label_slot) {
    				const label_1_changes = {};
    				if (dirty[0] & /*labelOnTop*/ 16777216) label_1_changes.labelOnTop = /*labelOnTop*/ ctx[24];
    				if (dirty[0] & /*focused*/ 2) label_1_changes.focused = /*focused*/ ctx[1];
    				if (dirty[0] & /*error*/ 64) label_1_changes.error = /*error*/ ctx[6];
    				if (dirty[0] & /*outlined*/ 4) label_1_changes.outlined = /*outlined*/ ctx[2];
    				if (dirty[0] & /*prepend*/ 256) label_1_changes.prepend = /*prepend*/ ctx[8];
    				if (dirty[0] & /*color*/ 65536) label_1_changes.color = /*color*/ ctx[16];
    				if (dirty[0] & /*bgColor*/ 131072) label_1_changes.bgColor = /*bgColor*/ ctx[17];

    				if (dirty[0] & /*label*/ 8 | dirty[2] & /*$$scope*/ 256) {
    					label_1_changes.$$scope = { dirty, ctx };
    				}

    				label_1.$set(label_1_changes);
    			}

    			if (label_slot && label_slot.p && dirty[2] & /*$$scope*/ 256) {
    				label_slot.p(get_slot_context(label_slot_template, ctx, /*$$scope*/ ctx[70], get_label_slot_context), get_slot_changes(label_slot_template, /*$$scope*/ ctx[70], dirty, get_label_slot_changes));
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			}

    			if (/*append*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*prepend*/ ctx[8]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			const underline_changes = {};
    			if (dirty[0] & /*noUnderline*/ 8192) underline_changes.noUnderline = /*noUnderline*/ ctx[13];
    			if (dirty[0] & /*outlined*/ 4) underline_changes.outlined = /*outlined*/ ctx[2];
    			if (dirty[0] & /*focused*/ 2) underline_changes.focused = /*focused*/ ctx[1];
    			if (dirty[0] & /*error*/ 64) underline_changes.error = /*error*/ ctx[6];
    			underline.$set(underline_changes);

    			if (/*showHint*/ ctx[23]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    					transition_in(if_block3, 1);
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*wClasses*/ 1048576) {
    				attr_dev(div, "class", /*wClasses*/ ctx[20]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_1.$$.fragment, local);
    			transition_in(label_slot, local);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(underline.$$.fragment, local);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label_1.$$.fragment, local);
    			transition_out(label_slot, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(underline.$$.fragment, local);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (!label_slot) {
    				destroy_component(label_1);
    			}

    			if (label_slot) label_slot.d(detaching);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_component(underline);
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const classesDefault$1 = "mt-2 mb-6 relative text-gray-600 dark:text-gray-100";
    const appendDefault = "absolute right-0 top-0 pb-2 pr-4 pt-4 text-gray-700 z-10";
    const prependDefault = "absolute left-0 top-0 pb-2 pl-2 pt-4 text-xs text-gray-700 z-10";

    function instance$6($$self, $$props, $$invalidate) {
    	let { class: className = "" } = $$props;
    	let { outlined = false } = $$props;
    	let { value = null } = $$props;
    	let { label = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { hint = "" } = $$props;
    	let { error = false } = $$props;
    	let { append = "" } = $$props;
    	let { prepend = "" } = $$props;
    	let { persistentHint = false } = $$props;
    	let { textarea = false } = $$props;
    	let { rows = 5 } = $$props;
    	let { select = false } = $$props;
    	let { dense = false } = $$props;
    	let { autocomplete = false } = $$props;
    	let { noUnderline = false } = $$props;
    	let { appendReverse = false } = $$props;
    	let { prependReverse = false } = $$props;
    	let { color = "primary" } = $$props;
    	let { bgColor = "white" } = $$props;
    	let { iconClass = "" } = $$props;
    	let { disabled = false } = $$props;
    	const inputDefault = `transition pb-2 pt-6 px-4 rounded-t text-black dark:text-gray-100 w-full`;
    	let { add = "" } = $$props;
    	let { remove = "" } = $$props;
    	let { replace = "" } = $$props;
    	let { inputClasses = inputDefault } = $$props;
    	let { classes = classesDefault$1 } = $$props;
    	let { appendClasses = appendDefault } = $$props;
    	let { prependClasses = prependDefault } = $$props;
    	const { bg, border, txt, caret } = utils(color);
    	const cb = new ClassBuilder(inputClasses, inputDefault);
    	const ccb = new ClassBuilder(classes, classesDefault$1);
    	const acb = new ClassBuilder(appendClasses, appendDefault);
    	const pcb = new ClassBuilder(prependClasses, prependDefault);

    	let { extend = () => {
    		
    	} } = $$props;

    	let { focused = false } = $$props;
    	let wClasses = i => i;
    	let aClasses = i => i;
    	let pClasses = i => i;

    	function toggleFocused() {
    		$$invalidate(1, focused = !focused);
    	}

    	const props = filterProps(
    		[
    			"outlined",
    			"label",
    			"placeholder",
    			"hint",
    			"error",
    			"append",
    			"prepend",
    			"persistentHint",
    			"textarea",
    			"rows",
    			"select",
    			"autocomplete",
    			"noUnderline",
    			"appendReverse",
    			"prependReverse",
    			"color",
    			"bgColor",
    			"disabled",
    			"replace",
    			"remove",
    			"small"
    		],
    		$$props
    	);

    	const dispatch = createEventDispatcher();
    	let { $$slots = {}, $$scope } = $$props;

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_handler_1(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_1(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_handler_2(event) {
    		bubble($$self, event);
    	}

    	function click_handler_2(event) {
    		bubble($$self, event);
    	}

    	function blur_handler_2(event) {
    		bubble($$self, event);
    	}

    	function focus_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function textarea_1_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const click_handler_3 = () => dispatch("click-append");
    	const click_handler_4 = () => dispatch("click-prepend");

    	$$self.$set = $$new_props => {
    		$$invalidate(49, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("class" in $$new_props) $$invalidate(30, className = $$new_props.class);
    		if ("outlined" in $$new_props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$new_props) $$invalidate(3, label = $$new_props.label);
    		if ("placeholder" in $$new_props) $$invalidate(4, placeholder = $$new_props.placeholder);
    		if ("hint" in $$new_props) $$invalidate(5, hint = $$new_props.hint);
    		if ("error" in $$new_props) $$invalidate(6, error = $$new_props.error);
    		if ("append" in $$new_props) $$invalidate(7, append = $$new_props.append);
    		if ("prepend" in $$new_props) $$invalidate(8, prepend = $$new_props.prepend);
    		if ("persistentHint" in $$new_props) $$invalidate(31, persistentHint = $$new_props.persistentHint);
    		if ("textarea" in $$new_props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("rows" in $$new_props) $$invalidate(10, rows = $$new_props.rows);
    		if ("select" in $$new_props) $$invalidate(11, select = $$new_props.select);
    		if ("dense" in $$new_props) $$invalidate(32, dense = $$new_props.dense);
    		if ("autocomplete" in $$new_props) $$invalidate(12, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$new_props) $$invalidate(13, noUnderline = $$new_props.noUnderline);
    		if ("appendReverse" in $$new_props) $$invalidate(14, appendReverse = $$new_props.appendReverse);
    		if ("prependReverse" in $$new_props) $$invalidate(15, prependReverse = $$new_props.prependReverse);
    		if ("color" in $$new_props) $$invalidate(16, color = $$new_props.color);
    		if ("bgColor" in $$new_props) $$invalidate(17, bgColor = $$new_props.bgColor);
    		if ("iconClass" in $$new_props) $$invalidate(18, iconClass = $$new_props.iconClass);
    		if ("disabled" in $$new_props) $$invalidate(19, disabled = $$new_props.disabled);
    		if ("add" in $$new_props) $$invalidate(33, add = $$new_props.add);
    		if ("remove" in $$new_props) $$invalidate(34, remove = $$new_props.remove);
    		if ("replace" in $$new_props) $$invalidate(35, replace = $$new_props.replace);
    		if ("inputClasses" in $$new_props) $$invalidate(36, inputClasses = $$new_props.inputClasses);
    		if ("classes" in $$new_props) $$invalidate(37, classes = $$new_props.classes);
    		if ("appendClasses" in $$new_props) $$invalidate(38, appendClasses = $$new_props.appendClasses);
    		if ("prependClasses" in $$new_props) $$invalidate(39, prependClasses = $$new_props.prependClasses);
    		if ("extend" in $$new_props) $$invalidate(40, extend = $$new_props.extend);
    		if ("focused" in $$new_props) $$invalidate(1, focused = $$new_props.focused);
    		if ("$$scope" in $$new_props) $$invalidate(70, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			className,
    			outlined,
    			value,
    			label,
    			placeholder,
    			hint,
    			error,
    			append,
    			prepend,
    			persistentHint,
    			textarea,
    			rows,
    			select,
    			dense,
    			autocomplete,
    			noUnderline,
    			appendReverse,
    			prependReverse,
    			color,
    			bgColor,
    			iconClass,
    			disabled,
    			add,
    			remove,
    			replace,
    			inputClasses,
    			classes,
    			appendClasses,
    			prependClasses,
    			extend,
    			focused,
    			wClasses,
    			aClasses,
    			pClasses,
    			showHint,
    			labelOnTop,
    			iClasses
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(49, $$props = assign(assign({}, $$props), $$new_props));
    		if ("className" in $$props) $$invalidate(30, className = $$new_props.className);
    		if ("outlined" in $$props) $$invalidate(2, outlined = $$new_props.outlined);
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("label" in $$props) $$invalidate(3, label = $$new_props.label);
    		if ("placeholder" in $$props) $$invalidate(4, placeholder = $$new_props.placeholder);
    		if ("hint" in $$props) $$invalidate(5, hint = $$new_props.hint);
    		if ("error" in $$props) $$invalidate(6, error = $$new_props.error);
    		if ("append" in $$props) $$invalidate(7, append = $$new_props.append);
    		if ("prepend" in $$props) $$invalidate(8, prepend = $$new_props.prepend);
    		if ("persistentHint" in $$props) $$invalidate(31, persistentHint = $$new_props.persistentHint);
    		if ("textarea" in $$props) $$invalidate(9, textarea = $$new_props.textarea);
    		if ("rows" in $$props) $$invalidate(10, rows = $$new_props.rows);
    		if ("select" in $$props) $$invalidate(11, select = $$new_props.select);
    		if ("dense" in $$props) $$invalidate(32, dense = $$new_props.dense);
    		if ("autocomplete" in $$props) $$invalidate(12, autocomplete = $$new_props.autocomplete);
    		if ("noUnderline" in $$props) $$invalidate(13, noUnderline = $$new_props.noUnderline);
    		if ("appendReverse" in $$props) $$invalidate(14, appendReverse = $$new_props.appendReverse);
    		if ("prependReverse" in $$props) $$invalidate(15, prependReverse = $$new_props.prependReverse);
    		if ("color" in $$props) $$invalidate(16, color = $$new_props.color);
    		if ("bgColor" in $$props) $$invalidate(17, bgColor = $$new_props.bgColor);
    		if ("iconClass" in $$props) $$invalidate(18, iconClass = $$new_props.iconClass);
    		if ("disabled" in $$props) $$invalidate(19, disabled = $$new_props.disabled);
    		if ("add" in $$props) $$invalidate(33, add = $$new_props.add);
    		if ("remove" in $$props) $$invalidate(34, remove = $$new_props.remove);
    		if ("replace" in $$props) $$invalidate(35, replace = $$new_props.replace);
    		if ("inputClasses" in $$props) $$invalidate(36, inputClasses = $$new_props.inputClasses);
    		if ("classes" in $$props) $$invalidate(37, classes = $$new_props.classes);
    		if ("appendClasses" in $$props) $$invalidate(38, appendClasses = $$new_props.appendClasses);
    		if ("prependClasses" in $$props) $$invalidate(39, prependClasses = $$new_props.prependClasses);
    		if ("extend" in $$props) $$invalidate(40, extend = $$new_props.extend);
    		if ("focused" in $$props) $$invalidate(1, focused = $$new_props.focused);
    		if ("wClasses" in $$props) $$invalidate(20, wClasses = $$new_props.wClasses);
    		if ("aClasses" in $$props) $$invalidate(21, aClasses = $$new_props.aClasses);
    		if ("pClasses" in $$props) $$invalidate(22, pClasses = $$new_props.pClasses);
    		if ("showHint" in $$props) $$invalidate(23, showHint = $$new_props.showHint);
    		if ("labelOnTop" in $$props) $$invalidate(24, labelOnTop = $$new_props.labelOnTop);
    		if ("iClasses" in $$props) $$invalidate(25, iClasses = $$new_props.iClasses);
    	};

    	let showHint;
    	let labelOnTop;
    	let iClasses;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*error, hint, focused*/ 98 | $$self.$$.dirty[1] & /*persistentHint*/ 1) {
    			 $$invalidate(23, showHint = error || (persistentHint ? hint : focused && hint));
    		}

    		if ($$self.$$.dirty[0] & /*placeholder, focused, value*/ 19) {
    			 $$invalidate(24, labelOnTop = placeholder || focused || value);
    		}

    		if ($$self.$$.dirty[0] & /*outlined, error, focused, prepend, disabled, select, autocomplete, className*/ 1074272582 | $$self.$$.dirty[1] & /*add, remove, replace, extend*/ 540) {
    			 $$invalidate(25, iClasses = cb.flush().remove("pt-6 pb-2", outlined).add("border rounded bg-transparent py-4 transition", outlined).add("border-error-500 caret-error-500", error).remove(caret(), error).add(caret(), !error).add(border(), focused && !error).add("border-gray-600", !error && !focused).add("bg-gray-100 dark:bg-dark-600", !outlined).add("bg-gray-300 dark:bg-dark-200", focused && !outlined).remove("px-4", prepend).add("pr-4 pl-10", prepend).add(add).remove("bg-gray-100", disabled).add("bg-gray-50", disabled).add("cursor-pointer", select && !autocomplete).add(className).remove(remove).replace(replace).extend(extend).get());
    		}

    		if ($$self.$$.dirty[0] & /*select, autocomplete, error, disabled*/ 530496 | $$self.$$.dirty[1] & /*dense*/ 2) {
    			 $$invalidate(20, wClasses = ccb.flush().add("select", select || autocomplete).add("dense", dense).replace({ "text-gray-600": "text-error-500" }, error).add("text-gray-200", disabled).get());
    		}
    	};

    	 $$invalidate(21, aClasses = acb.flush().get());
    	 $$invalidate(22, pClasses = pcb.flush().get());
    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		focused,
    		outlined,
    		label,
    		placeholder,
    		hint,
    		error,
    		append,
    		prepend,
    		textarea,
    		rows,
    		select,
    		autocomplete,
    		noUnderline,
    		appendReverse,
    		prependReverse,
    		color,
    		bgColor,
    		iconClass,
    		disabled,
    		wClasses,
    		aClasses,
    		pClasses,
    		showHint,
    		labelOnTop,
    		iClasses,
    		txt,
    		toggleFocused,
    		props,
    		dispatch,
    		className,
    		persistentHint,
    		dense,
    		add,
    		remove,
    		replace,
    		inputClasses,
    		classes,
    		appendClasses,
    		prependClasses,
    		extend,
    		inputDefault,
    		bg,
    		border,
    		caret,
    		cb,
    		ccb,
    		acb,
    		pcb,
    		$$props,
    		$$slots,
    		blur_handler,
    		change_handler,
    		input_handler,
    		click_handler,
    		focus_handler,
    		change_handler_1,
    		input_handler_1,
    		click_handler_1,
    		focus_handler_1,
    		blur_handler_1,
    		change_handler_2,
    		input_handler_2,
    		click_handler_2,
    		blur_handler_2,
    		focus_handler_2,
    		input_input_handler,
    		textarea_1_input_handler,
    		click_handler_3,
    		click_handler_4,
    		$$scope
    	];
    }

    class TextField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$7,
    			safe_not_equal,
    			{
    				class: 30,
    				outlined: 2,
    				value: 0,
    				label: 3,
    				placeholder: 4,
    				hint: 5,
    				error: 6,
    				append: 7,
    				prepend: 8,
    				persistentHint: 31,
    				textarea: 9,
    				rows: 10,
    				select: 11,
    				dense: 32,
    				autocomplete: 12,
    				noUnderline: 13,
    				appendReverse: 14,
    				prependReverse: 15,
    				color: 16,
    				bgColor: 17,
    				iconClass: 18,
    				disabled: 19,
    				add: 33,
    				remove: 34,
    				replace: 35,
    				inputClasses: 36,
    				classes: 37,
    				appendClasses: 38,
    				prependClasses: 39,
    				extend: 40,
    				focused: 1
    			},
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextField",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get class() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hint() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get error() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get append() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set append(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prepend() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prepend(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get persistentHint() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set persistentHint(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textarea() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textarea(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rows() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get select() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set select(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autocomplete() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autocomplete(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noUnderline() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noUnderline(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appendReverse() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appendReverse(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prependReverse() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prependReverse(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconClass() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconClass(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get add() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set add(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get replace() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set replace(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inputClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appendClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appendClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prependClasses() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prependClasses(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get extend() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set extend(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focused() {
    		throw new Error("<TextField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focused(value) {
    		throw new Error("<TextField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const loggedIn = writable(false);

    /* node_modules\smelte\src\components\Util\Spacer.svelte generated by Svelte v3.18.2 */

    const file$7 = "node_modules\\smelte\\src\\components\\Util\\Spacer.svelte";

    function create_fragment$8(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "flex-grow");
    			add_location(div, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Spacer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spacer",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const Spacer$1 = Spacer;

    /* node_modules\smelte\src\components\Snackbar\Snackbar.svelte generated by Svelte v3.18.2 */
    const file$8 = "node_modules\\smelte\\src\\components\\Snackbar\\Snackbar.svelte";
    const get_action_slot_changes = dirty => ({});
    const get_action_slot_context = ctx => ({});

    // (114:0) {#if value && (running === hash)}
    function create_if_block$2(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;
    	let div0_intro;
    	let div0_outro;
    	let div1_class_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[26].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[30], null);
    	let if_block = !/*noAction*/ ctx[5] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			add_location(div0, file$8, 118, 6, 2770);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*wClasses*/ ctx[6]) + " svelte-1ym8qvd"));
    			add_location(div1, file$8, 117, 4, 2741);
    			attr_dev(div2, "class", "fixed w-full h-full top-0 left-0 z-30 pointer-events-none");
    			add_location(div2, file$8, 114, 2, 2658);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			append_dev(div0, t);
    			if (if_block) if_block.m(div0, null);
    			/*div0_binding*/ ctx[28](div0);
    			current = true;
    			dispose = listen_dev(div0, "click", /*click_handler_1*/ ctx[29], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1073741824) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[30], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[30], dirty, null));
    			}

    			if (!/*noAction*/ ctx[5]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*wClasses*/ 64 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*wClasses*/ ctx[6]) + " svelte-1ym8qvd"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);
    				if (!div0_intro) div0_intro = create_in_transition(div0, scale, /*inProps*/ ctx[3]);
    				div0_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, fade, /*outProps*/ ctx[4]);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    			/*div0_binding*/ ctx[28](null);
    			if (detaching && div0_outro) div0_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(114:0) {#if value && (running === hash)}",
    		ctx
    	});

    	return block;
    }

    // (125:8) {#if !noAction}
    function create_if_block_1$2(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	const spacer = new Spacer$1({ $$inline: true });
    	const action_slot_template = /*$$slots*/ ctx[26].action;
    	const action_slot = create_slot(action_slot_template, ctx, /*$$scope*/ ctx[30], get_action_slot_context);
    	let if_block = !/*timeout*/ ctx[2] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(spacer.$$.fragment);
    			t = space();

    			if (!action_slot) {
    				if (if_block) if_block.c();
    				if_block_anchor = empty();
    			}

    			if (action_slot) action_slot.c();
    		},
    		m: function mount(target, anchor) {
    			mount_component(spacer, target, anchor);
    			insert_dev(target, t, anchor);

    			if (!action_slot) {
    				if (if_block) if_block.m(target, anchor);
    				insert_dev(target, if_block_anchor, anchor);
    			}

    			if (action_slot) {
    				action_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!action_slot) {
    				if (!/*timeout*/ ctx[2]) {
    					if (if_block) {
    						if_block.p(ctx, dirty);
    						transition_in(if_block, 1);
    					} else {
    						if_block = create_if_block_2$2(ctx);
    						if_block.c();
    						transition_in(if_block, 1);
    						if_block.m(if_block_anchor.parentNode, if_block_anchor);
    					}
    				} else if (if_block) {
    					group_outros();

    					transition_out(if_block, 1, 1, () => {
    						if_block = null;
    					});

    					check_outros();
    				}
    			}

    			if (action_slot && action_slot.p && dirty & /*$$scope*/ 1073741824) {
    				action_slot.p(get_slot_context(action_slot_template, ctx, /*$$scope*/ ctx[30], get_action_slot_context), get_slot_changes(action_slot_template, /*$$scope*/ ctx[30], dirty, get_action_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spacer.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(action_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spacer.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(action_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spacer, detaching);
    			if (detaching) detach_dev(t);

    			if (!action_slot) {
    				if (if_block) if_block.d(detaching);
    				if (detaching) detach_dev(if_block_anchor);
    			}

    			if (action_slot) action_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(125:8) {#if !noAction}",
    		ctx
    	});

    	return block;
    }

    // (128:12) {#if !timeout}
    function create_if_block_2$2(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				text: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[27]);

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1073741824) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(128:12) {#if !timeout}",
    		ctx
    	});

    	return block;
    }

    // (129:14) <Button text on:click={() => value = false}>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Close");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(129:14) <Button text on:click={() => value = false}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*value*/ ctx[0] && running === /*hash*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*value*/ ctx[0] && running === /*hash*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const queue = writable([]);
    let running = false;
    const wrapperDefault = "fixed w-full h-full flex items-center justify-center pointer-events-none";

    function instance$7($$self, $$props, $$invalidate) {
    	let $queue;
    	validate_store(queue, "queue");
    	component_subscribe($$self, queue, $$value => $$invalidate(19, $queue = $$value));
    	let { value = false } = $$props;
    	let { timeout = 2000 } = $$props;
    	let { inProps = { duration: 100, easing: quadIn } } = $$props;

    	let { outProps = {
    		duration: 100,
    		easing: quadOut,
    		delay: 150
    	} } = $$props;

    	let { color = "gray" } = $$props;
    	let { text = "white" } = $$props;
    	let { top = false } = $$props;
    	let { bottom = true } = $$props;
    	let { right = false } = $$props;
    	let { left = false } = $$props;
    	let { noAction = true } = $$props;
    	let { hash = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const classesDefault = `pointer-events-auto flex absolute py-2 px-4 z-30 mb-4 content-between mx-auto
      rounded items-center elevation-2 h-12`;

    	let { class: className = classesDefault } = $$props;
    	let { classes = wrapperDefault } = $$props;
    	const cb = new ClassBuilder(className, classesDefault);
    	const wrapperCb = new ClassBuilder(classes, wrapperDefault);
    	let wClasses = i => i;
    	let tm;
    	let node;

    	let bg = () => {
    		
    	};

    	function toggle(h, id) {
    		if (value === false && running === false) {
    			return;
    		}

    		$$invalidate(1, hash = running = $$invalidate(0, value = id));
    		if (!timeout) return;

    		$$invalidate(16, tm = setTimeout(
    			() => {
    				$$invalidate(0, value = running = $$invalidate(1, hash = false));
    				dispatch("finish");

    				if ($queue.length) {
    					$queue.shift()();
    				}
    			},
    			timeout
    		));
    	}

    	wClasses = wrapperCb.flush().add(`text-${text}`).get();

    	const writable_props = [
    		"value",
    		"timeout",
    		"inProps",
    		"outProps",
    		"color",
    		"text",
    		"top",
    		"bottom",
    		"right",
    		"left",
    		"noAction",
    		"hash",
    		"class",
    		"classes"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Snackbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler = () => $$invalidate(0, value = false);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, node = $$value);
    		});
    	}

    	const click_handler_1 = () => $$invalidate(0, value = false);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("timeout" in $$props) $$invalidate(2, timeout = $$props.timeout);
    		if ("inProps" in $$props) $$invalidate(3, inProps = $$props.inProps);
    		if ("outProps" in $$props) $$invalidate(4, outProps = $$props.outProps);
    		if ("color" in $$props) $$invalidate(8, color = $$props.color);
    		if ("text" in $$props) $$invalidate(9, text = $$props.text);
    		if ("top" in $$props) $$invalidate(10, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(11, bottom = $$props.bottom);
    		if ("right" in $$props) $$invalidate(12, right = $$props.right);
    		if ("left" in $$props) $$invalidate(13, left = $$props.left);
    		if ("noAction" in $$props) $$invalidate(5, noAction = $$props.noAction);
    		if ("hash" in $$props) $$invalidate(1, hash = $$props.hash);
    		if ("class" in $$props) $$invalidate(14, className = $$props.class);
    		if ("classes" in $$props) $$invalidate(15, classes = $$props.classes);
    		if ("$$scope" in $$props) $$invalidate(30, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			running,
    			value,
    			timeout,
    			inProps,
    			outProps,
    			color,
    			text,
    			top,
    			bottom,
    			right,
    			left,
    			noAction,
    			hash,
    			className,
    			classes,
    			wClasses,
    			tm,
    			node,
    			bg,
    			toggler,
    			$queue,
    			c
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("timeout" in $$props) $$invalidate(2, timeout = $$props.timeout);
    		if ("inProps" in $$props) $$invalidate(3, inProps = $$props.inProps);
    		if ("outProps" in $$props) $$invalidate(4, outProps = $$props.outProps);
    		if ("color" in $$props) $$invalidate(8, color = $$props.color);
    		if ("text" in $$props) $$invalidate(9, text = $$props.text);
    		if ("top" in $$props) $$invalidate(10, top = $$props.top);
    		if ("bottom" in $$props) $$invalidate(11, bottom = $$props.bottom);
    		if ("right" in $$props) $$invalidate(12, right = $$props.right);
    		if ("left" in $$props) $$invalidate(13, left = $$props.left);
    		if ("noAction" in $$props) $$invalidate(5, noAction = $$props.noAction);
    		if ("hash" in $$props) $$invalidate(1, hash = $$props.hash);
    		if ("className" in $$props) $$invalidate(14, className = $$props.className);
    		if ("classes" in $$props) $$invalidate(15, classes = $$props.classes);
    		if ("wClasses" in $$props) $$invalidate(6, wClasses = $$props.wClasses);
    		if ("tm" in $$props) $$invalidate(16, tm = $$props.tm);
    		if ("node" in $$props) $$invalidate(7, node = $$props.node);
    		if ("bg" in $$props) $$invalidate(17, bg = $$props.bg);
    		if ("toggler" in $$props) $$invalidate(18, toggler = $$props.toggler);
    		if ("$queue" in $$props) queue.set($queue = $$props.$queue);
    		if ("c" in $$props) $$invalidate(20, c = $$props.c);
    	};

    	let toggler;
    	let c;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color*/ 256) {
    			 {
    				const u = utils(color || "gray");
    				$$invalidate(17, bg = u.bg);
    			}
    		}

    		if ($$self.$$.dirty & /*hash, value*/ 3) {
    			 {
    				$$invalidate(1, hash = hash || (value ? btoa(`${value}${new Date().valueOf()}`) : null));
    				($$invalidate(0, value), $$invalidate(1, hash));
    			}
    		}

    		if ($$self.$$.dirty & /*value, hash*/ 3) {
    			 $$invalidate(18, toggler = () => toggle(value, hash));
    		}

    		if ($$self.$$.dirty & /*value, toggler*/ 262145) {
    			 if (value) {
    				queue.update(u => [...u, toggler]);
    			}
    		}

    		if ($$self.$$.dirty & /*value, $queue*/ 524289) {
    			 if (!running && value && $queue.length) {
    				$queue.shift()();
    			}
    		}

    		if ($$self.$$.dirty & /*value, tm*/ 65537) {
    			 if (!value) clearTimeout(tm);
    		}

    		if ($$self.$$.dirty & /*bg, color, right, top, left, bottom, noAction*/ 146720) {
    			 $$invalidate(20, c = cb.flush().add(bg(800), color).add("right-0 mr-2", right).add("top-0 mt-2", top).add("left-0 ml-2", left).add("bottom-0", bottom).add("snackbar", !noAction).get());
    		}

    		if ($$self.$$.dirty & /*node, c*/ 1048704) {
    			// for some reason it doesn't get updated otherwise
    			 if (node) $$invalidate(7, node.classList = c, node);
    		}
    	};

    	return [
    		value,
    		hash,
    		timeout,
    		inProps,
    		outProps,
    		noAction,
    		wClasses,
    		node,
    		color,
    		text,
    		top,
    		bottom,
    		right,
    		left,
    		className,
    		classes,
    		tm,
    		bg,
    		toggler,
    		$queue,
    		c,
    		dispatch,
    		classesDefault,
    		cb,
    		wrapperCb,
    		toggle,
    		$$slots,
    		click_handler,
    		div0_binding,
    		click_handler_1,
    		$$scope
    	];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$9, safe_not_equal, {
    			value: 0,
    			timeout: 2,
    			inProps: 3,
    			outProps: 4,
    			color: 8,
    			text: 9,
    			top: 10,
    			bottom: 11,
    			right: 12,
    			left: 13,
    			noAction: 5,
    			hash: 1,
    			class: 14,
    			classes: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get value() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeout() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inProps() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inProps(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outProps() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outProps(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noAction() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noAction(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hash() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hash(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Login.svelte generated by Svelte v3.18.2 */
    const file$9 = "src\\Login.svelte";

    // (46:4) <Button color="secondary" on:click={login}>
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("login");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(46:4) <Button color=\\\"secondary\\\" on:click={login}>",
    		ctx
    	});

    	return block;
    }

    // (50:0) <Snackbar color="red" top bind:value={showError}>
    function create_default_slot$4(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*errorMsg*/ ctx[1]);
    			add_location(div, file$9, 50, 2, 1450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 2) set_data_dev(t, /*errorMsg*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(50:0) <Snackbar color=\\\"red\\\" top bind:value={showError}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let t4;
    	let updating_value_2;
    	let current;

    	function textfield0_value_binding(value) {
    		/*textfield0_value_binding*/ ctx[5].call(null, value);
    	}

    	let textfield0_props = { outlined: true, label: "email" };

    	if (/*body*/ ctx[0].email !== void 0) {
    		textfield0_props.value = /*body*/ ctx[0].email;
    	}

    	const textfield0 = new TextField({ props: textfield0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield0, "value", textfield0_value_binding));

    	function textfield1_value_binding(value_1) {
    		/*textfield1_value_binding*/ ctx[6].call(null, value_1);
    	}

    	let textfield1_props = { outlined: true, label: "password" };

    	if (/*body*/ ctx[0].password !== void 0) {
    		textfield1_props.value = /*body*/ ctx[0].password;
    	}

    	const textfield1 = new TextField({ props: textfield1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield1, "value", textfield1_value_binding));

    	const button = new Button({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*login*/ ctx[3]);

    	function snackbar_value_binding(value_2) {
    		/*snackbar_value_binding*/ ctx[7].call(null, value_2);
    	}

    	let snackbar_props = {
    		color: "red",
    		top: true,
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	if (/*showError*/ ctx[2] !== void 0) {
    		snackbar_props.value = /*showError*/ ctx[2];
    	}

    	const snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(snackbar, "value", snackbar_value_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Login";
    			t1 = space();
    			div1 = element("div");
    			create_component(textfield0.$$.fragment);
    			t2 = space();
    			create_component(textfield1.$$.fragment);
    			t3 = space();
    			create_component(button.$$.fragment);
    			t4 = space();
    			create_component(snackbar.$$.fragment);
    			attr_dev(div0, "class", "text-white font-thin text-3xl");
    			add_location(div0, file$9, 39, 2, 1022);
    			attr_dev(div1, "class", "flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-lg p-8 m-4\r\n    rounded");
    			add_location(div1, file$9, 40, 2, 1080);
    			attr_dev(div2, "class", "flex flex-col items-center justify-center");
    			add_location(div2, file$9, 38, 0, 963);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(textfield0, div1, null);
    			append_dev(div1, t2);
    			mount_component(textfield1, div1, null);
    			append_dev(div1, t3);
    			mount_component(button, div1, null);
    			insert_dev(target, t4, anchor);
    			mount_component(snackbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textfield0_changes = {};

    			if (!updating_value && dirty & /*body*/ 1) {
    				updating_value = true;
    				textfield0_changes.value = /*body*/ ctx[0].email;
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield0.$set(textfield0_changes);
    			const textfield1_changes = {};

    			if (!updating_value_1 && dirty & /*body*/ 1) {
    				updating_value_1 = true;
    				textfield1_changes.value = /*body*/ ctx[0].password;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textfield1.$set(textfield1_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			const snackbar_changes = {};

    			if (dirty & /*$$scope, errorMsg*/ 258) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_2 && dirty & /*showError*/ 4) {
    				updating_value_2 = true;
    				snackbar_changes.value = /*showError*/ ctx[2];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			snackbar.$set(snackbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(snackbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(snackbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			destroy_component(button);
    			if (detaching) detach_dev(t4);
    			destroy_component(snackbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $loggedIn;
    	validate_store(loggedIn, "loggedIn");
    	component_subscribe($$self, loggedIn, $$value => $$invalidate(4, $loggedIn = $$value));
    	let body = {};
    	let errorMsg;
    	let showError = false;

    	onMount(() => {
    		if (localStorage.getItem("token")) {
    			push("#/journal");
    		}
    	});

    	const login = async () => {
    		const req = await fetch("/api/v1/auth/login", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(body)
    		});

    		const res = await req.json();

    		if (res.success) {
    			localStorage.setItem("token", JSON.stringify(res.token));
    			set_store_value(loggedIn, $loggedIn = true);
    			push("#/journal");
    		} else {
    			$$invalidate(2, showError = true);
    			$$invalidate(1, errorMsg = res.error);
    		}
    	};

    	function textfield0_value_binding(value) {
    		body.email = value;
    		$$invalidate(0, body);
    	}

    	function textfield1_value_binding(value_1) {
    		body.password = value_1;
    		$$invalidate(0, body);
    	}

    	function snackbar_value_binding(value_2) {
    		showError = value_2;
    		$$invalidate(2, showError);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("body" in $$props) $$invalidate(0, body = $$props.body);
    		if ("errorMsg" in $$props) $$invalidate(1, errorMsg = $$props.errorMsg);
    		if ("showError" in $$props) $$invalidate(2, showError = $$props.showError);
    		if ("$loggedIn" in $$props) loggedIn.set($loggedIn = $$props.$loggedIn);
    	};

    	return [
    		body,
    		errorMsg,
    		showError,
    		login,
    		$loggedIn,
    		textfield0_value_binding,
    		textfield1_value_binding,
    		snackbar_value_binding
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\CreateUser.svelte generated by Svelte v3.18.2 */
    const file$a = "src\\CreateUser.svelte";

    // (39:4) <Button color="secondary" on:click={createUser}>
    function create_default_slot_1$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("create");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(39:4) <Button color=\\\"secondary\\\" on:click={createUser}>",
    		ctx
    	});

    	return block;
    }

    // (43:0) <Snackbar color="red" top bind:value={showError}>
    function create_default_slot$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*errorMsg*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 4) set_data_dev(t, /*errorMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(43:0) <Snackbar color=\\\"red\\\" top bind:value={showError}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let updating_value_2;
    	let t4;
    	let t5;
    	let updating_value_3;
    	let current;

    	function textfield0_value_binding(value) {
    		/*textfield0_value_binding*/ ctx[5].call(null, value);
    	}

    	let textfield0_props = { outlined: true, label: "name" };

    	if (/*body*/ ctx[0].name !== void 0) {
    		textfield0_props.value = /*body*/ ctx[0].name;
    	}

    	const textfield0 = new TextField({ props: textfield0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield0, "value", textfield0_value_binding));

    	function textfield1_value_binding(value_1) {
    		/*textfield1_value_binding*/ ctx[6].call(null, value_1);
    	}

    	let textfield1_props = { outlined: true, label: "email" };

    	if (/*body*/ ctx[0].email !== void 0) {
    		textfield1_props.value = /*body*/ ctx[0].email;
    	}

    	const textfield1 = new TextField({ props: textfield1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield1, "value", textfield1_value_binding));

    	function textfield2_value_binding(value_2) {
    		/*textfield2_value_binding*/ ctx[7].call(null, value_2);
    	}

    	let textfield2_props = { outlined: true, label: "password" };

    	if (/*body*/ ctx[0].password !== void 0) {
    		textfield2_props.value = /*body*/ ctx[0].password;
    	}

    	const textfield2 = new TextField({ props: textfield2_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield2, "value", textfield2_value_binding));

    	const button = new Button({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*createUser*/ ctx[3]);

    	function snackbar_value_binding(value_3) {
    		/*snackbar_value_binding*/ ctx[8].call(null, value_3);
    	}

    	let snackbar_props = {
    		color: "red",
    		top: true,
    		$$slots: { default: [create_default_slot$5] },
    		$$scope: { ctx }
    	};

    	if (/*showError*/ ctx[1] !== void 0) {
    		snackbar_props.value = /*showError*/ ctx[1];
    	}

    	const snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(snackbar, "value", snackbar_value_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "New User";
    			t1 = space();
    			div1 = element("div");
    			create_component(textfield0.$$.fragment);
    			t2 = space();
    			create_component(textfield1.$$.fragment);
    			t3 = space();
    			create_component(textfield2.$$.fragment);
    			t4 = space();
    			create_component(button.$$.fragment);
    			t5 = space();
    			create_component(snackbar.$$.fragment);
    			attr_dev(div0, "class", "text-white font-thin text-3xl");
    			add_location(div0, file$a, 31, 2, 824);
    			attr_dev(div1, "class", "flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-lg p-8 m-4\r\n    rounded");
    			add_location(div1, file$a, 32, 2, 885);
    			attr_dev(div2, "class", "flex flex-col items-center justify-center");
    			add_location(div2, file$a, 30, 0, 765);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(textfield0, div1, null);
    			append_dev(div1, t2);
    			mount_component(textfield1, div1, null);
    			append_dev(div1, t3);
    			mount_component(textfield2, div1, null);
    			append_dev(div1, t4);
    			mount_component(button, div1, null);
    			insert_dev(target, t5, anchor);
    			mount_component(snackbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const textfield0_changes = {};

    			if (!updating_value && dirty & /*body*/ 1) {
    				updating_value = true;
    				textfield0_changes.value = /*body*/ ctx[0].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield0.$set(textfield0_changes);
    			const textfield1_changes = {};

    			if (!updating_value_1 && dirty & /*body*/ 1) {
    				updating_value_1 = true;
    				textfield1_changes.value = /*body*/ ctx[0].email;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textfield1.$set(textfield1_changes);
    			const textfield2_changes = {};

    			if (!updating_value_2 && dirty & /*body*/ 1) {
    				updating_value_2 = true;
    				textfield2_changes.value = /*body*/ ctx[0].password;
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			textfield2.$set(textfield2_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 512) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    			const snackbar_changes = {};

    			if (dirty & /*$$scope, errorMsg*/ 516) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_3 && dirty & /*showError*/ 2) {
    				updating_value_3 = true;
    				snackbar_changes.value = /*showError*/ ctx[1];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			snackbar.$set(snackbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(textfield2.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(snackbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(textfield2.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(snackbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			destroy_component(textfield2);
    			destroy_component(button);
    			if (detaching) detach_dev(t5);
    			destroy_component(snackbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $loggedIn;
    	validate_store(loggedIn, "loggedIn");
    	component_subscribe($$self, loggedIn, $$value => $$invalidate(4, $loggedIn = $$value));
    	let body = {};
    	let showError = false;
    	let errorMsg;

    	const createUser = async () => {
    		const req = await fetch("/api/v1/auth/register", {
    			method: "POST",
    			headers: { "Content-Type": "application/json" },
    			body: JSON.stringify(body)
    		});

    		const res = await req.json();

    		if (res.success) {
    			push("/journal");
    			set_store_value(loggedIn, $loggedIn = true);
    		} else {
    			$$invalidate(1, showError = true);
    			$$invalidate(2, errorMsg = res.error);
    		}
    	};

    	function textfield0_value_binding(value) {
    		body.name = value;
    		$$invalidate(0, body);
    	}

    	function textfield1_value_binding(value_1) {
    		body.email = value_1;
    		$$invalidate(0, body);
    	}

    	function textfield2_value_binding(value_2) {
    		body.password = value_2;
    		$$invalidate(0, body);
    	}

    	function snackbar_value_binding(value_3) {
    		showError = value_3;
    		$$invalidate(1, showError);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("body" in $$props) $$invalidate(0, body = $$props.body);
    		if ("showError" in $$props) $$invalidate(1, showError = $$props.showError);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    		if ("$loggedIn" in $$props) loggedIn.set($loggedIn = $$props.$loggedIn);
    	};

    	return [
    		body,
    		showError,
    		errorMsg,
    		createUser,
    		$loggedIn,
    		textfield0_value_binding,
    		textfield1_value_binding,
    		textfield2_value_binding,
    		snackbar_value_binding
    	];
    }

    class CreateUser extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateUser",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Writer.svelte generated by Svelte v3.18.2 */
    const file$b = "src\\Writer.svelte";

    // (20:4) <Button color="secondary" on:click={newEntry(entry)}>
    function create_default_slot$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Add");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(20:4) <Button color=\\\"secondary\\\" on:click={newEntry(entry)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let current;

    	function textfield0_value_binding(value) {
    		/*textfield0_value_binding*/ ctx[2].call(null, value);
    	}

    	let textfield0_props = { outlined: true, label: "subject" };

    	if (/*entry*/ ctx[1].subject !== void 0) {
    		textfield0_props.value = /*entry*/ ctx[1].subject;
    	}

    	const textfield0 = new TextField({ props: textfield0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield0, "value", textfield0_value_binding));

    	function textfield1_value_binding(value_1) {
    		/*textfield1_value_binding*/ ctx[3].call(null, value_1);
    	}

    	let textfield1_props = {
    		outlined: true,
    		textarea: true,
    		label: "description"
    	};

    	if (/*entry*/ ctx[1].description !== void 0) {
    		textfield1_props.value = /*entry*/ ctx[1].description;
    	}

    	const textfield1 = new TextField({ props: textfield1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield1, "value", textfield1_value_binding));

    	const button = new Button({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*newEntry*/ ctx[0](/*entry*/ ctx[1]))) /*newEntry*/ ctx[0](/*entry*/ ctx[1]).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "New Entry";
    			t1 = space();
    			div1 = element("div");
    			create_component(textfield0.$$.fragment);
    			t2 = space();
    			create_component(textfield1.$$.fragment);
    			t3 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "text-white font-hairline text-2xl");
    			add_location(div0, file$b, 9, 2, 240);
    			attr_dev(div1, "class", "w-full flex flex-col bg-white dark:bg-dark-500 max-w-2xl p-8 mt-4\r\n    rounded");
    			add_location(div1, file$b, 10, 2, 306);
    			attr_dev(div2, "class", " lg:w-1/2 flex flex-col items-center m-8");
    			add_location(div2, file$b, 8, 0, 182);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(textfield0, div1, null);
    			append_dev(div1, t2);
    			mount_component(textfield1, div1, null);
    			append_dev(div1, t3);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const textfield0_changes = {};

    			if (!updating_value && dirty & /*entry*/ 2) {
    				updating_value = true;
    				textfield0_changes.value = /*entry*/ ctx[1].subject;
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield0.$set(textfield0_changes);
    			const textfield1_changes = {};

    			if (!updating_value_1 && dirty & /*entry*/ 2) {
    				updating_value_1 = true;
    				textfield1_changes.value = /*entry*/ ctx[1].description;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textfield1.$set(textfield1_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { newEntry } = $$props;
    	let entry = {};
    	const writable_props = ["newEntry"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Writer> was created with unknown prop '${key}'`);
    	});

    	function textfield0_value_binding(value) {
    		entry.subject = value;
    		$$invalidate(1, entry);
    	}

    	function textfield1_value_binding(value_1) {
    		entry.description = value_1;
    		$$invalidate(1, entry);
    	}

    	$$self.$set = $$props => {
    		if ("newEntry" in $$props) $$invalidate(0, newEntry = $$props.newEntry);
    	};

    	$$self.$capture_state = () => {
    		return { newEntry, entry };
    	};

    	$$self.$inject_state = $$props => {
    		if ("newEntry" in $$props) $$invalidate(0, newEntry = $$props.newEntry);
    		if ("entry" in $$props) $$invalidate(1, entry = $$props.entry);
    	};

    	return [newEntry, entry, textfield0_value_binding, textfield1_value_binding];
    }

    class Writer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$c, safe_not_equal, { newEntry: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Writer",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*newEntry*/ ctx[0] === undefined && !("newEntry" in props)) {
    			console.warn("<Writer> was created without expected prop 'newEntry'");
    		}
    	}

    	get newEntry() {
    		throw new Error("<Writer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newEntry(value) {
    		throw new Error("<Writer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\EditModal.svelte generated by Svelte v3.18.2 */
    const file$c = "src\\EditModal.svelte";

    // (31:0) {#if show}
    function create_if_block$3(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t1;
    	let updating_value;
    	let t2;
    	let updating_value_1;
    	let t3;
    	let div2_transition;
    	let current;
    	let dispose;

    	function textfield0_value_binding(value) {
    		/*textfield0_value_binding*/ ctx[5].call(null, value);
    	}

    	let textfield0_props = { outlined: true, label: "subject" };

    	if (/*entry*/ ctx[1].subject !== void 0) {
    		textfield0_props.value = /*entry*/ ctx[1].subject;
    	}

    	const textfield0 = new TextField({ props: textfield0_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield0, "value", textfield0_value_binding));

    	function textfield1_value_binding(value_1) {
    		/*textfield1_value_binding*/ ctx[6].call(null, value_1);
    	}

    	let textfield1_props = {
    		outlined: true,
    		textarea: true,
    		label: "description"
    	};

    	if (/*entry*/ ctx[1].description !== void 0) {
    		textfield1_props.value = /*entry*/ ctx[1].description;
    	}

    	const textfield1 = new TextField({ props: textfield1_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield1, "value", textfield1_value_binding));

    	const button = new Button({
    			props: {
    				color: "secondary",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function((/*editEntry*/ ctx[2](/*entry*/ ctx[1], /*entry*/ ctx[1]._id, /*i*/ ctx[3]), /*click_handler*/ ctx[7]))) (/*editEntry*/ ctx[2](/*entry*/ ctx[1], /*entry*/ ctx[1]._id, /*i*/ ctx[3]), /*click_handler*/ ctx[7]).apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Edit Entry";
    			t1 = space();
    			create_component(textfield0.$$.fragment);
    			t2 = space();
    			create_component(textfield1.$$.fragment);
    			t3 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "font-hairline text-2xl text-center");
    			add_location(div0, file$c, 40, 8, 877);
    			attr_dev(div1, "class", "flex flex-col bg-white dark:bg-dark-500 w-5/6 max-w-2xl p-8\r\n        mx-auto editEntry rounded svelte-1mo1fvr");
    			add_location(div1, file$c, 37, 6, 750);
    			attr_dev(div2, "class", "modal-overlay svelte-1mo1fvr");
    			attr_dev(div2, "data-close", "");
    			add_location(div2, file$c, 32, 4, 615);
    			add_location(div3, file$c, 31, 2, 604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(textfield0, div1, null);
    			append_dev(div1, t2);
    			mount_component(textfield1, div1, null);
    			append_dev(div1, t3);
    			mount_component(button, div1, null);
    			current = true;
    			dispose = listen_dev(div2, "click", /*overlay_click*/ ctx[4], false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const textfield0_changes = {};

    			if (!updating_value && dirty & /*entry*/ 2) {
    				updating_value = true;
    				textfield0_changes.value = /*entry*/ ctx[1].subject;
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield0.$set(textfield0_changes);
    			const textfield1_changes = {};

    			if (!updating_value_1 && dirty & /*entry*/ 2) {
    				updating_value_1 = true;
    				textfield1_changes.value = /*entry*/ ctx[1].description;
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			textfield1.$set(textfield1_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(button.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 150 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, { duration: 150 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(textfield0);
    			destroy_component(textfield1);
    			destroy_component(button);
    			if (detaching && div2_transition) div2_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(31:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (48:8) <Button            color="secondary"            on:click={(editEntry(entry, entry._id, i), () => (show = false))}>
    function create_default_slot$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Edit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(48:8) <Button            color=\\\"secondary\\\"            on:click={(editEntry(entry, entry._id, i), () => (show = false))}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*show*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	function overlay_click(e) {
    		if ("close" in e.target.dataset) $$invalidate(0, show = false);
    	}

    	let { show = false } = $$props;
    	let { editEntry } = $$props;
    	let { entry } = $$props;
    	let { i } = $$props;
    	const writable_props = ["show", "editEntry", "entry", "i"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditModal> was created with unknown prop '${key}'`);
    	});

    	function textfield0_value_binding(value) {
    		entry.subject = value;
    		$$invalidate(1, entry);
    	}

    	function textfield1_value_binding(value_1) {
    		entry.description = value_1;
    		$$invalidate(1, entry);
    	}

    	const click_handler = () => $$invalidate(0, show = false);

    	$$self.$set = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("editEntry" in $$props) $$invalidate(2, editEntry = $$props.editEntry);
    		if ("entry" in $$props) $$invalidate(1, entry = $$props.entry);
    		if ("i" in $$props) $$invalidate(3, i = $$props.i);
    	};

    	$$self.$capture_state = () => {
    		return { show, editEntry, entry, i };
    	};

    	$$self.$inject_state = $$props => {
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("editEntry" in $$props) $$invalidate(2, editEntry = $$props.editEntry);
    		if ("entry" in $$props) $$invalidate(1, entry = $$props.entry);
    		if ("i" in $$props) $$invalidate(3, i = $$props.i);
    	};

    	return [
    		show,
    		entry,
    		editEntry,
    		i,
    		overlay_click,
    		textfield0_value_binding,
    		textfield1_value_binding,
    		click_handler
    	];
    }

    class EditModal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$d, safe_not_equal, { show: 0, editEntry: 2, entry: 1, i: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditModal",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*editEntry*/ ctx[2] === undefined && !("editEntry" in props)) {
    			console.warn("<EditModal> was created without expected prop 'editEntry'");
    		}

    		if (/*entry*/ ctx[1] === undefined && !("entry" in props)) {
    			console.warn("<EditModal> was created without expected prop 'entry'");
    		}

    		if (/*i*/ ctx[3] === undefined && !("i" in props)) {
    			console.warn("<EditModal> was created without expected prop 'i'");
    		}
    	}

    	get show() {
    		throw new Error("<EditModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<EditModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editEntry() {
    		throw new Error("<EditModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editEntry(value) {
    		throw new Error("<EditModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get entry() {
    		throw new Error("<EditModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<EditModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<EditModal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<EditModal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Entry.svelte generated by Svelte v3.18.2 */
    const file$d = "src\\Entry.svelte";

    // (30:6) <Button on:click={() => (show = true)} add="flex p-2" remove="py-2 px-4">
    function create_default_slot_1$4(ctx) {
    	let i_1;

    	const block = {
    		c: function create() {
    			i_1 = element("i");
    			i_1.textContent = "edit";
    			attr_dev(i_1, "class", "material-icons");
    			add_location(i_1, file$d, 30, 8, 932);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i_1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(30:6) <Button on:click={() => (show = true)} add=\\\"flex p-2\\\" remove=\\\"py-2 px-4\\\">",
    		ctx
    	});

    	return block;
    }

    // (33:6) <Button          add="flex p-2 ml-2"          remove="py-2 px-4"          color="pink"          on:click={deleteEntry(entry._id, i)}>
    function create_default_slot$8(ctx) {
    	let i_1;

    	const block = {
    		c: function create() {
    			i_1 = element("i");
    			i_1.textContent = "clear";
    			attr_dev(i_1, "class", "material-icons");
    			add_location(i_1, file$d, 37, 8, 1134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i_1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(33:6) <Button          add=\\\"flex p-2 ml-2\\\"          remove=\\\"py-2 px-4\\\"          color=\\\"pink\\\"          on:click={deleteEntry(entry._id, i)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let li;
    	let div0;
    	let t0_value = /*entry*/ ctx[0].subject + "";
    	let t0;
    	let t1;
    	let hr;
    	let t2;
    	let div1;
    	let t3_value = /*entry*/ ctx[0].description + "";
    	let t3;
    	let t4;
    	let div4;
    	let div2;

    	let t5_value = new Date(/*entry*/ ctx[0].createdAt).toLocaleString("en-US", {
    		weekday: "long",
    		year: "numeric",
    		month: "long",
    		day: "numeric",
    		hour: "2-digit",
    		minute: "2-digit"
    	}) + "";

    	let t5;
    	let t6;
    	let div3;
    	let t7;
    	let t8;
    	let updating_show;
    	let current;

    	const button0 = new Button({
    			props: {
    				add: "flex p-2",
    				remove: "py-2 px-4",
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[5]);

    	const button1 = new Button({
    			props: {
    				add: "flex p-2 ml-2",
    				remove: "py-2 px-4",
    				color: "pink",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", function () {
    		if (is_function(/*deleteEntry*/ ctx[2](/*entry*/ ctx[0]._id, /*i*/ ctx[1]))) /*deleteEntry*/ ctx[2](/*entry*/ ctx[0]._id, /*i*/ ctx[1]).apply(this, arguments);
    	});

    	function editmodal_show_binding(value) {
    		/*editmodal_show_binding*/ ctx[6].call(null, value);
    	}

    	let editmodal_props = {
    		editEntry: /*editEntry*/ ctx[3],
    		entry: /*entry*/ ctx[0],
    		i: /*i*/ ctx[1]
    	};

    	if (/*show*/ ctx[4] !== void 0) {
    		editmodal_props.show = /*show*/ ctx[4];
    	}

    	const editmodal = new EditModal({ props: editmodal_props, $$inline: true });
    	binding_callbacks.push(() => bind(editmodal, "show", editmodal_show_binding));

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div4 = element("div");
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div3 = element("div");
    			create_component(button0.$$.fragment);
    			t7 = space();
    			create_component(button1.$$.fragment);
    			t8 = space();
    			create_component(editmodal.$$.fragment);
    			attr_dev(div0, "class", "font-bold");
    			add_location(div0, file$d, 14, 2, 383);
    			add_location(hr, file$d, 15, 2, 431);
    			attr_dev(div1, "class", "mb-4");
    			add_location(div1, file$d, 16, 2, 441);
    			attr_dev(div2, "class", "text-xs");
    			add_location(div2, file$d, 18, 4, 550);
    			attr_dev(div3, "class", "flex flex-row");
    			add_location(div3, file$d, 28, 4, 814);
    			attr_dev(div4, "class", "flex flex-row justify-between items-center");
    			add_location(div4, file$d, 17, 2, 488);
    			attr_dev(li, "class", "flex flex-col bg-white dark:bg-dark-500 p-4 m-8 rounded");
    			add_location(li, file$d, 13, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, t0);
    			append_dev(li, t1);
    			append_dev(li, hr);
    			append_dev(li, t2);
    			append_dev(li, div1);
    			append_dev(div1, t3);
    			append_dev(li, t4);
    			append_dev(li, div4);
    			append_dev(div4, div2);
    			append_dev(div2, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div3);
    			mount_component(button0, div3, null);
    			append_dev(div3, t7);
    			mount_component(button1, div3, null);
    			insert_dev(target, t8, anchor);
    			mount_component(editmodal, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*entry*/ 1) && t0_value !== (t0_value = /*entry*/ ctx[0].subject + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*entry*/ 1) && t3_value !== (t3_value = /*entry*/ ctx[0].description + "")) set_data_dev(t3, t3_value);

    			if ((!current || dirty & /*entry*/ 1) && t5_value !== (t5_value = new Date(/*entry*/ ctx[0].createdAt).toLocaleString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}) + "")) set_data_dev(t5, t5_value);

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 128) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const editmodal_changes = {};
    			if (dirty & /*editEntry*/ 8) editmodal_changes.editEntry = /*editEntry*/ ctx[3];
    			if (dirty & /*entry*/ 1) editmodal_changes.entry = /*entry*/ ctx[0];
    			if (dirty & /*i*/ 2) editmodal_changes.i = /*i*/ ctx[1];

    			if (!updating_show && dirty & /*show*/ 16) {
    				updating_show = true;
    				editmodal_changes.show = /*show*/ ctx[4];
    				add_flush_callback(() => updating_show = false);
    			}

    			editmodal.$set(editmodal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(editmodal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(editmodal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(button0);
    			destroy_component(button1);
    			if (detaching) detach_dev(t8);
    			destroy_component(editmodal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { entry } = $$props;
    	let { i } = $$props;
    	let { deleteEntry } = $$props;
    	let { editEntry } = $$props;
    	let show;
    	const writable_props = ["entry", "i", "deleteEntry", "editEntry"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Entry> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(4, show = true);

    	function editmodal_show_binding(value) {
    		show = value;
    		$$invalidate(4, show);
    	}

    	$$self.$set = $$props => {
    		if ("entry" in $$props) $$invalidate(0, entry = $$props.entry);
    		if ("i" in $$props) $$invalidate(1, i = $$props.i);
    		if ("deleteEntry" in $$props) $$invalidate(2, deleteEntry = $$props.deleteEntry);
    		if ("editEntry" in $$props) $$invalidate(3, editEntry = $$props.editEntry);
    	};

    	$$self.$capture_state = () => {
    		return { entry, i, deleteEntry, editEntry, show };
    	};

    	$$self.$inject_state = $$props => {
    		if ("entry" in $$props) $$invalidate(0, entry = $$props.entry);
    		if ("i" in $$props) $$invalidate(1, i = $$props.i);
    		if ("deleteEntry" in $$props) $$invalidate(2, deleteEntry = $$props.deleteEntry);
    		if ("editEntry" in $$props) $$invalidate(3, editEntry = $$props.editEntry);
    		if ("show" in $$props) $$invalidate(4, show = $$props.show);
    	};

    	return [entry, i, deleteEntry, editEntry, show, click_handler, editmodal_show_binding];
    }

    class Entry extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$e, safe_not_equal, {
    			entry: 0,
    			i: 1,
    			deleteEntry: 2,
    			editEntry: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Entry",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*entry*/ ctx[0] === undefined && !("entry" in props)) {
    			console.warn("<Entry> was created without expected prop 'entry'");
    		}

    		if (/*i*/ ctx[1] === undefined && !("i" in props)) {
    			console.warn("<Entry> was created without expected prop 'i'");
    		}

    		if (/*deleteEntry*/ ctx[2] === undefined && !("deleteEntry" in props)) {
    			console.warn("<Entry> was created without expected prop 'deleteEntry'");
    		}

    		if (/*editEntry*/ ctx[3] === undefined && !("editEntry" in props)) {
    			console.warn("<Entry> was created without expected prop 'editEntry'");
    		}
    	}

    	get entry() {
    		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entry(value) {
    		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deleteEntry() {
    		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deleteEntry(value) {
    		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editEntry() {
    		throw new Error("<Entry>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editEntry(value) {
    		throw new Error("<Entry>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules\smelte\src\components\progressLinear\ProgressLinear.svelte generated by Svelte v3.18.2 */
    const file$e = "node_modules\\smelte\\src\\components\\progressLinear\\ProgressLinear.svelte";

    function create_fragment$f(ctx) {
    	let div2;
    	let div0;
    	let div0_class_value;
    	let div0_style_value;
    	let t;
    	let div1;
    	let div1_class_value;
    	let div2_class_value;
    	let div2_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			attr_dev(div0, "class", div0_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute" + " svelte-mguqwa");

    			attr_dev(div0, "style", div0_style_value = /*progress*/ ctx[1]
    			? `width: ${/*progress*/ ctx[1]}%`
    			: "");

    			toggle_class(div0, "inc", !/*progress*/ ctx[1]);
    			toggle_class(div0, "transition", /*progress*/ ctx[1]);
    			add_location(div0, file$e, 56, 2, 987);
    			attr_dev(div1, "class", div1_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute dec" + " svelte-mguqwa");
    			toggle_class(div1, "hidden", /*progress*/ ctx[1]);
    			add_location(div1, file$e, 61, 2, 1145);
    			attr_dev(div2, "class", div2_class_value = "top-0 left-0 w-full h-1 bg-" + /*color*/ ctx[2] + "-100 overflow-hidden relative" + " svelte-mguqwa");
    			toggle_class(div2, "fixed", /*app*/ ctx[0]);
    			toggle_class(div2, "z-50", /*app*/ ctx[0]);
    			toggle_class(div2, "hidden", /*app*/ ctx[0] && !/*initialized*/ ctx[3]);
    			add_location(div2, file$e, 50, 0, 790);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*color*/ 4 && div0_class_value !== (div0_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute" + " svelte-mguqwa")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*progress*/ 2 && div0_style_value !== (div0_style_value = /*progress*/ ctx[1]
    			? `width: ${/*progress*/ ctx[1]}%`
    			: "")) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div0, "inc", !/*progress*/ ctx[1]);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div0, "transition", /*progress*/ ctx[1]);
    			}

    			if (!current || dirty & /*color*/ 4 && div1_class_value !== (div1_class_value = "bg-" + /*color*/ ctx[2] + "-500 h-1 absolute dec" + " svelte-mguqwa")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*color, progress*/ 6) {
    				toggle_class(div1, "hidden", /*progress*/ ctx[1]);
    			}

    			if (!current || dirty & /*color*/ 4 && div2_class_value !== (div2_class_value = "top-0 left-0 w-full h-1 bg-" + /*color*/ ctx[2] + "-100 overflow-hidden relative" + " svelte-mguqwa")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty & /*color, app*/ 5) {
    				toggle_class(div2, "fixed", /*app*/ ctx[0]);
    			}

    			if (dirty & /*color, app*/ 5) {
    				toggle_class(div2, "z-50", /*app*/ ctx[0]);
    			}

    			if (dirty & /*color, app, initialized*/ 13) {
    				toggle_class(div2, "hidden", /*app*/ ctx[0] && !/*initialized*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, slide, { duration: 300 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { app = false } = $$props;
    	let { progress = 0 } = $$props;
    	let { color = "primary" } = $$props;
    	let initialized = false;

    	onMount(() => {
    		if (!app) return;

    		setTimeout(
    			() => {
    				$$invalidate(3, initialized = true);
    			},
    			200
    		);
    	});

    	const writable_props = ["app", "progress", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProgressLinear> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    		if ("progress" in $$props) $$invalidate(1, progress = $$props.progress);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    	};

    	$$self.$capture_state = () => {
    		return { app, progress, color, initialized };
    	};

    	$$self.$inject_state = $$props => {
    		if ("app" in $$props) $$invalidate(0, app = $$props.app);
    		if ("progress" in $$props) $$invalidate(1, progress = $$props.progress);
    		if ("color" in $$props) $$invalidate(2, color = $$props.color);
    		if ("initialized" in $$props) $$invalidate(3, initialized = $$props.initialized);
    	};

    	return [app, progress, color, initialized];
    }

    class ProgressLinear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$f, safe_not_equal, { app: 0, progress: 1, color: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProgressLinear",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get app() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set app(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get progress() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set progress(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<ProgressLinear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<ProgressLinear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Entries.svelte generated by Svelte v3.18.2 */
    const file$f = "src\\Entries.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (19:2) {#each entries as entry, i}
    function create_each_block(ctx) {
    	let current;

    	const entry = new Entry({
    			props: {
    				entry: /*entry*/ ctx[3],
    				i: /*i*/ ctx[5],
    				deleteEntry: /*deleteEntry*/ ctx[1],
    				editEntry: /*editEntry*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(entry.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(entry, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const entry_changes = {};
    			if (dirty & /*entries*/ 1) entry_changes.entry = /*entry*/ ctx[3];
    			if (dirty & /*deleteEntry*/ 2) entry_changes.deleteEntry = /*deleteEntry*/ ctx[1];
    			if (dirty & /*editEntry*/ 4) entry_changes.editEntry = /*editEntry*/ ctx[2];
    			entry.$set(entry_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(entry.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(entry.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(entry, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:2) {#each entries as entry, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let ul;
    	let t;
    	let div;
    	let current;
    	let each_value = /*entries*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const progresslinear = new ProgressLinear({
    			props: { color: "secondary" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div = element("div");
    			create_component(progresslinear.$$.fragment);
    			attr_dev(div, "id", "loader");
    			attr_dev(div, "class", "h-72 w-full flex justify-center items-center hidden");
    			add_location(div, file$f, 21, 2, 486);
    			attr_dev(ul, "class", "w-full lg:w-1/2 height lg:overflow-y-scroll svelte-19auoug");
    			add_location(ul, file$f, 17, 0, 331);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t);
    			append_dev(ul, div);
    			mount_component(progresslinear, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*entries, deleteEntry, editEntry*/ 7) {
    				each_value = /*entries*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(progresslinear.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(progresslinear.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			destroy_component(progresslinear);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { entries = [] } = $$props;
    	let { deleteEntry } = $$props;
    	let { editEntry } = $$props;
    	const writable_props = ["entries", "deleteEntry", "editEntry"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Entries> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("entries" in $$props) $$invalidate(0, entries = $$props.entries);
    		if ("deleteEntry" in $$props) $$invalidate(1, deleteEntry = $$props.deleteEntry);
    		if ("editEntry" in $$props) $$invalidate(2, editEntry = $$props.editEntry);
    	};

    	$$self.$capture_state = () => {
    		return { entries, deleteEntry, editEntry };
    	};

    	$$self.$inject_state = $$props => {
    		if ("entries" in $$props) $$invalidate(0, entries = $$props.entries);
    		if ("deleteEntry" in $$props) $$invalidate(1, deleteEntry = $$props.deleteEntry);
    		if ("editEntry" in $$props) $$invalidate(2, editEntry = $$props.editEntry);
    	};

    	return [entries, deleteEntry, editEntry];
    }

    class Entries extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$g, safe_not_equal, { entries: 0, deleteEntry: 1, editEntry: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Entries",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*deleteEntry*/ ctx[1] === undefined && !("deleteEntry" in props)) {
    			console.warn("<Entries> was created without expected prop 'deleteEntry'");
    		}

    		if (/*editEntry*/ ctx[2] === undefined && !("editEntry" in props)) {
    			console.warn("<Entries> was created without expected prop 'editEntry'");
    		}
    	}

    	get entries() {
    		throw new Error("<Entries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set entries(value) {
    		throw new Error("<Entries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deleteEntry() {
    		throw new Error("<Entries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set deleteEntry(value) {
    		throw new Error("<Entries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editEntry() {
    		throw new Error("<Entries>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editEntry(value) {
    		throw new Error("<Entries>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Journal.svelte generated by Svelte v3.18.2 */
    const file$g = "src\\Journal.svelte";

    // (98:0) <Snackbar color="red" top bind:value={showError}>
    function create_default_slot$9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*errorMsg*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 4) set_data_dev(t, /*errorMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(98:0) <Snackbar color=\\\"red\\\" top bind:value={showError}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let updating_value;
    	let current;

    	const writer = new Writer({
    			props: { newEntry: /*newEntry*/ ctx[3] },
    			$$inline: true
    		});

    	const entries_1 = new Entries({
    			props: {
    				entries: /*entries*/ ctx[0],
    				deleteEntry: /*deleteEntry*/ ctx[4],
    				editEntry: /*editEntry*/ ctx[5]
    			},
    			$$inline: true
    		});

    	function snackbar_value_binding(value) {
    		/*snackbar_value_binding*/ ctx[6].call(null, value);
    	}

    	let snackbar_props = {
    		color: "red",
    		top: true,
    		$$slots: { default: [create_default_slot$9] },
    		$$scope: { ctx }
    	};

    	if (/*showError*/ ctx[1] !== void 0) {
    		snackbar_props.value = /*showError*/ ctx[1];
    	}

    	const snackbar = new Snackbar({ props: snackbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(snackbar, "value", snackbar_value_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(writer.$$.fragment);
    			t0 = space();
    			create_component(entries_1.$$.fragment);
    			t1 = space();
    			create_component(snackbar.$$.fragment);
    			attr_dev(div, "class", "flex flex-col lg:flex-row");
    			add_location(div, file$g, 93, 0, 2207);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(writer, div, null);
    			append_dev(div, t0);
    			mount_component(entries_1, div, null);
    			insert_dev(target, t1, anchor);
    			mount_component(snackbar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const entries_1_changes = {};
    			if (dirty & /*entries*/ 1) entries_1_changes.entries = /*entries*/ ctx[0];
    			entries_1.$set(entries_1_changes);
    			const snackbar_changes = {};

    			if (dirty & /*$$scope, errorMsg*/ 132) {
    				snackbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*showError*/ 2) {
    				updating_value = true;
    				snackbar_changes.value = /*showError*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			snackbar.$set(snackbar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(writer.$$.fragment, local);
    			transition_in(entries_1.$$.fragment, local);
    			transition_in(snackbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(writer.$$.fragment, local);
    			transition_out(entries_1.$$.fragment, local);
    			transition_out(snackbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(writer);
    			destroy_component(entries_1);
    			if (detaching) detach_dev(t1);
    			destroy_component(snackbar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let entries = [];
    	let showError = false;
    	let errorMsg;

    	onMount(async () => {
    		const loader = document.getElementById("loader");
    		loader.classList.remove("hidden");

    		const req = await fetch("/api/v1/entries", {
    			method: "GET",
    			headers: {
    				Authorization: "Bearer " + JSON.parse(localStorage.getItem("token"))
    			}
    		});

    		const res = await req.json();

    		if (res.success) {
    			$$invalidate(0, entries = res.data);
    		}

    		loader.classList.add("hidden");
    	});

    	const newEntry = async entry => {
    		const req = await fetch("/api/v1/entries", {
    			method: "POST",
    			headers: {
    				Authorization: "Bearer " + JSON.parse(localStorage.getItem("token")),
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify(entry)
    		});

    		const res = await req.json();

    		if (res.success) {
    			$$invalidate(0, entries = [...entries, res.data]);
    		} else {
    			$$invalidate(1, showError = true);
    			$$invalidate(2, errorMsg = res.error);
    		}
    	};

    	const deleteEntry = async (id, i) => {
    		const check = confirm("are you sure you want to delete this entry");
    		if (!check) return;

    		const req = await fetch(`/api/v1/entries/${id}`, {
    			method: "DELETE",
    			headers: {
    				Authorization: "Bearer " + JSON.parse(localStorage.getItem("token"))
    			}
    		});

    		const res = await req.json();
    		console.log(res);

    		if (res.success) {
    			entries.splice(i, 1);
    			$$invalidate(0, entries);
    		}
    	};

    	const editEntry = async (entry, id, i) => {
    		const req = await fetch(`/api/v1/entries/${id}`, {
    			method: "PUT",
    			body: JSON.stringify(entry),
    			headers: {
    				Authorization: "Bearer " + JSON.parse(localStorage.getItem("token")),
    				"Content-Type": "application/json"
    			}
    		});

    		const res = await req.json();

    		if (res.success) {
    			$$invalidate(0, entries[i] = res.data, entries);
    		} else {
    			$$invalidate(1, showError = true);
    			$$invalidate(2, errorMsg = res.error);
    		}
    	};

    	function snackbar_value_binding(value) {
    		showError = value;
    		$$invalidate(1, showError);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("entries" in $$props) $$invalidate(0, entries = $$props.entries);
    		if ("showError" in $$props) $$invalidate(1, showError = $$props.showError);
    		if ("errorMsg" in $$props) $$invalidate(2, errorMsg = $$props.errorMsg);
    	};

    	return [
    		entries,
    		showError,
    		errorMsg,
    		newEntry,
    		deleteEntry,
    		editEntry,
    		snackbar_value_binding
    	];
    }

    class Journal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Journal",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    let darkMode;

    function isDarkTheme() {
      if (!window.matchMedia) {
        return false;
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return true;
      }
    }

    function dark(value = false, bodyClasses = "mode-dark") {
      if (typeof window === "undefined") return writable(value);

      if (!darkMode) {
        darkMode = writable(value || isDarkTheme());
      }

      return {
        subscribe: darkMode.subscribe,
        set: v => {
          bodyClasses.split(" ").forEach(c => {
            if (v) {
              document.body.classList.add(c);
            } else {
              document.body.classList.remove(c);
            }
          });

          darkMode.set(v);
        }
      };
    }

    /* src\LoggedOutSidebar.svelte generated by Svelte v3.18.2 */
    const file$h = "src\\LoggedOutSidebar.svelte";

    // (45:0) {#if sidebar_show}
    function create_if_block$4(ctx) {
    	let div0;
    	let div0_transition;
    	let t0;
    	let nav;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let ul;
    	let hr0;
    	let t2;
    	let li0;
    	let a0;
    	let link_action;
    	let t4;
    	let hr1;
    	let t5;
    	let li1;
    	let a1;
    	let link_action_1;
    	let t7;
    	let hr2;
    	let t8;
    	let li2;
    	let a2;
    	let link_action_2;
    	let t10;
    	let hr3;
    	let nav_transition;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$darkMode*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			nav = element("nav");
    			div1 = element("div");
    			if_block.c();
    			t1 = space();
    			ul = element("ul");
    			hr0 = element("hr");
    			t2 = space();
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "New User";
    			t4 = space();
    			hr1 = element("hr");
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Login";
    			t7 = space();
    			hr2 = element("hr");
    			t8 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Info";
    			t10 = space();
    			hr3 = element("hr");
    			attr_dev(div0, "class", "modal-overlay svelte-1jg0su2");
    			attr_dev(div0, "data-close", "");
    			add_location(div0, file$h, 45, 2, 897);
    			attr_dev(div1, "class", "flex items-center justify-center w-full mb-8");
    			add_location(div1, file$h, 51, 4, 1099);
    			add_location(hr0, file$h, 68, 6, 1535);
    			attr_dev(a0, "class", "hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex\r\n          h-full w-full items-center");
    			attr_dev(a0, "href", "/newUser");
    			add_location(a0, file$h, 70, 8, 1576);
    			attr_dev(li0, "class", "h-16");
    			add_location(li0, file$h, 69, 6, 1549);
    			add_location(hr1, file$h, 79, 6, 1834);
    			attr_dev(a1, "class", "hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex\r\n          h-full w-full items-center");
    			attr_dev(a1, "href", "/login");
    			add_location(a1, file$h, 81, 8, 1875);
    			attr_dev(li1, "class", "h-16");
    			add_location(li1, file$h, 80, 6, 1848);
    			add_location(hr2, file$h, 90, 6, 2128);
    			attr_dev(a2, "class", "hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex\r\n          h-full w-full items-center");
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$h, 92, 8, 2169);
    			attr_dev(li2, "class", "h-16");
    			add_location(li2, file$h, 91, 6, 2142);
    			add_location(hr3, file$h, 101, 6, 2416);
    			add_location(ul, file$h, 67, 4, 1523);
    			attr_dev(nav, "class", "dark:bg-dark-500 svelte-1jg0su2");
    			add_location(nav, file$h, 50, 2, 1022);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(nav, t1);
    			append_dev(nav, ul);
    			append_dev(ul, hr0);
    			append_dev(ul, t2);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t4);
    			append_dev(ul, hr1);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t7);
    			append_dev(ul, hr2);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t10);
    			append_dev(ul, hr3);
    			current = true;

    			dispose = [
    				listen_dev(div0, "click", /*overlay_click*/ ctx[4], false, false, false),
    				action_destroyer(link_action = link.call(null, a0)),
    				listen_dev(
    					a0,
    					"click",
    					function () {
    						if (is_function(/*sidebar*/ ctx[1]())) /*sidebar*/ ctx[1]().apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(link_action_1 = link.call(null, a1)),
    				listen_dev(
    					a1,
    					"click",
    					function () {
    						if (is_function(/*sidebar*/ ctx[1]())) /*sidebar*/ ctx[1]().apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(link_action_2 = link.call(null, a2)),
    				listen_dev(
    					a2,
    					"click",
    					function () {
    						if (is_function(/*sidebar*/ ctx[1]())) /*sidebar*/ ctx[1]().apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, { x: -300, opacity: 1 }, true);
    				nav_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, false);
    			div0_transition.run(0);
    			transition_out(if_block);
    			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, { x: -300, opacity: 1 }, false);
    			nav_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    			if (detaching && nav_transition) nav_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(45:0) {#if sidebar_show}",
    		ctx
    	});

    	return block;
    }

    // (59:6) {:else}
    function create_else_block$1(ctx) {
    	let updating_value;
    	let current;

    	function button_value_binding_1(value) {
    		/*button_value_binding_1*/ ctx[6].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		iconClass: "text-black",
    		icon: "brightness_high",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[2] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[2];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 4) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(59:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:6) {#if $darkMode}
    function create_if_block_1$3(ctx) {
    	let updating_value;
    	let current;

    	function button_value_binding(value) {
    		/*button_value_binding*/ ctx[5].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_low",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[2] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[2];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding));

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 4) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(53:6) {#if $darkMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*sidebar_show*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*sidebar_show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $darkMode;
    	let { sidebar_show } = $$props;
    	let { sidebar } = $$props;
    	const darkMode = dark();
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, value => $$invalidate(2, $darkMode = value));

    	function overlay_click(e) {
    		if ("close" in e.target.dataset) sidebar();
    	}

    	const writable_props = ["sidebar_show", "sidebar"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LoggedOutSidebar> was created with unknown prop '${key}'`);
    	});

    	function button_value_binding(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	function button_value_binding_1(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	$$self.$set = $$props => {
    		if ("sidebar_show" in $$props) $$invalidate(0, sidebar_show = $$props.sidebar_show);
    		if ("sidebar" in $$props) $$invalidate(1, sidebar = $$props.sidebar);
    	};

    	$$self.$capture_state = () => {
    		return { sidebar_show, sidebar, $darkMode };
    	};

    	$$self.$inject_state = $$props => {
    		if ("sidebar_show" in $$props) $$invalidate(0, sidebar_show = $$props.sidebar_show);
    		if ("sidebar" in $$props) $$invalidate(1, sidebar = $$props.sidebar);
    		if ("$darkMode" in $$props) darkMode.set($darkMode = $$props.$darkMode);
    	};

    	return [
    		sidebar_show,
    		sidebar,
    		$darkMode,
    		darkMode,
    		overlay_click,
    		button_value_binding,
    		button_value_binding_1
    	];
    }

    class LoggedOutSidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$i, safe_not_equal, { sidebar_show: 0, sidebar: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedOutSidebar",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebar_show*/ ctx[0] === undefined && !("sidebar_show" in props)) {
    			console.warn("<LoggedOutSidebar> was created without expected prop 'sidebar_show'");
    		}

    		if (/*sidebar*/ ctx[1] === undefined && !("sidebar" in props)) {
    			console.warn("<LoggedOutSidebar> was created without expected prop 'sidebar'");
    		}
    	}

    	get sidebar_show() {
    		throw new Error("<LoggedOutSidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar_show(value) {
    		throw new Error("<LoggedOutSidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sidebar() {
    		throw new Error("<LoggedOutSidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar(value) {
    		throw new Error("<LoggedOutSidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LoggedInSidebar.svelte generated by Svelte v3.18.2 */

    const { console: console_1 } = globals;
    const file$i = "src\\LoggedInSidebar.svelte";

    // (47:0) {#if sidebar_show}
    function create_if_block$5(ctx) {
    	let div0;
    	let div0_transition;
    	let t0;
    	let nav;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let ul;
    	let hr0;
    	let t2;
    	let li0;
    	let a0;
    	let link_action;
    	let t4;
    	let hr1;
    	let t5;
    	let li1;
    	let a1;
    	let link_action_1;
    	let t7;
    	let hr2;
    	let t8;
    	let li2;
    	let a2;
    	let link_action_2;
    	let t10;
    	let hr3;
    	let nav_transition;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_1$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$darkMode*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			nav = element("nav");
    			div1 = element("div");
    			if_block.c();
    			t1 = space();
    			ul = element("ul");
    			hr0 = element("hr");
    			t2 = space();
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Logout";
    			t4 = space();
    			hr1 = element("hr");
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Journal";
    			t7 = space();
    			hr2 = element("hr");
    			t8 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Info";
    			t10 = space();
    			hr3 = element("hr");
    			attr_dev(div0, "class", "modal-overlay svelte-1jg0su2");
    			attr_dev(div0, "data-close", "");
    			add_location(div0, file$i, 47, 2, 948);
    			attr_dev(div1, "class", "flex items-center justify-center w-full mb-8");
    			add_location(div1, file$i, 53, 4, 1150);
    			add_location(hr0, file$i, 70, 6, 1586);
    			attr_dev(a0, "class", "hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex\r\n          h-full w-full items-center");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$i, 72, 8, 1627);
    			attr_dev(li0, "class", "h-16");
    			add_location(li0, file$i, 71, 6, 1600);
    			add_location(hr1, file$i, 81, 6, 1888);
    			attr_dev(a1, "class", "hover:bg-gray-500 transition duration-100 ease-in-out pl-4 flex\r\n          h-full w-full items-center");
    			attr_dev(a1, "href", "/journal");
    			add_location(a1, file$i, 83, 8, 1929);
    			attr_dev(li1, "class", "h-16");
    			add_location(li1, file$i, 82, 6, 1902);
    			add_location(hr2, file$i, 92, 6, 2186);
    			attr_dev(a2, "class", "hover:bg-gray-500 pl-4 transition duration-100 ease-in-out flex\r\n          h-full w-full items-center");
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$i, 94, 8, 2227);
    			attr_dev(li2, "class", "h-16");
    			add_location(li2, file$i, 93, 6, 2200);
    			add_location(hr3, file$i, 103, 6, 2474);
    			add_location(ul, file$i, 69, 4, 1574);
    			attr_dev(nav, "class", "dark:bg-dark-500 svelte-1jg0su2");
    			add_location(nav, file$i, 52, 2, 1073);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(nav, t1);
    			append_dev(nav, ul);
    			append_dev(ul, hr0);
    			append_dev(ul, t2);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t4);
    			append_dev(ul, hr1);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t7);
    			append_dev(ul, hr2);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t10);
    			append_dev(ul, hr3);
    			current = true;

    			dispose = [
    				listen_dev(div0, "click", /*overlay_click*/ ctx[5], false, false, false),
    				action_destroyer(link_action = link.call(null, a0)),
    				listen_dev(
    					a0,
    					"click",
    					function () {
    						if (is_function((/*logout*/ ctx[2](), /*sidebar*/ ctx[1]()))) (/*logout*/ ctx[2](), /*sidebar*/ ctx[1]()).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(link_action_1 = link.call(null, a1)),
    				listen_dev(
    					a1,
    					"click",
    					function () {
    						if (is_function(/*sidebar*/ ctx[1]())) /*sidebar*/ ctx[1]().apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(link_action_2 = link.call(null, a2)),
    				listen_dev(
    					a2,
    					"click",
    					function () {
    						if (is_function(/*sidebar*/ ctx[1]())) /*sidebar*/ ctx[1]().apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(if_block);

    			add_render_callback(() => {
    				if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, { x: -300, opacity: 1 }, true);
    				nav_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, { duration: 150 }, false);
    			div0_transition.run(0);
    			transition_out(if_block);
    			if (!nav_transition) nav_transition = create_bidirectional_transition(nav, fly, { x: -300, opacity: 1 }, false);
    			nav_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    			if (detaching && nav_transition) nav_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(47:0) {#if sidebar_show}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {:else}
    function create_else_block$2(ctx) {
    	let updating_value;
    	let current;

    	function button_value_binding_1(value) {
    		/*button_value_binding_1*/ ctx[7].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		iconClass: "text-black",
    		icon: "brightness_high",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[3] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[3];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding_1));

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 8) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(61:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:6) {#if $darkMode}
    function create_if_block_1$4(ctx) {
    	let updating_value;
    	let current;

    	function button_value_binding(value) {
    		/*button_value_binding*/ ctx[6].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_low",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[3] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[3];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding));

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 8) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[3];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(55:6) {#if $darkMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*sidebar_show*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*sidebar_show*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $darkMode;
    	let { sidebar_show } = $$props;
    	let { sidebar } = $$props;
    	let { logout } = $$props;
    	const darkMode = dark();
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, value => $$invalidate(3, $darkMode = value));

    	function overlay_click(e) {
    		if ("close" in e.target.dataset) sidebar();
    		console.log($darkMode);
    	}

    	const writable_props = ["sidebar_show", "sidebar", "logout"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<LoggedInSidebar> was created with unknown prop '${key}'`);
    	});

    	function button_value_binding(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	function button_value_binding_1(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	$$self.$set = $$props => {
    		if ("sidebar_show" in $$props) $$invalidate(0, sidebar_show = $$props.sidebar_show);
    		if ("sidebar" in $$props) $$invalidate(1, sidebar = $$props.sidebar);
    		if ("logout" in $$props) $$invalidate(2, logout = $$props.logout);
    	};

    	$$self.$capture_state = () => {
    		return { sidebar_show, sidebar, logout, $darkMode };
    	};

    	$$self.$inject_state = $$props => {
    		if ("sidebar_show" in $$props) $$invalidate(0, sidebar_show = $$props.sidebar_show);
    		if ("sidebar" in $$props) $$invalidate(1, sidebar = $$props.sidebar);
    		if ("logout" in $$props) $$invalidate(2, logout = $$props.logout);
    		if ("$darkMode" in $$props) darkMode.set($darkMode = $$props.$darkMode);
    	};

    	return [
    		sidebar_show,
    		sidebar,
    		logout,
    		$darkMode,
    		darkMode,
    		overlay_click,
    		button_value_binding,
    		button_value_binding_1
    	];
    }

    class LoggedInSidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$j, safe_not_equal, { sidebar_show: 0, sidebar: 1, logout: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedInSidebar",
    			options,
    			id: create_fragment$j.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebar_show*/ ctx[0] === undefined && !("sidebar_show" in props)) {
    			console_1.warn("<LoggedInSidebar> was created without expected prop 'sidebar_show'");
    		}

    		if (/*sidebar*/ ctx[1] === undefined && !("sidebar" in props)) {
    			console_1.warn("<LoggedInSidebar> was created without expected prop 'sidebar'");
    		}

    		if (/*logout*/ ctx[2] === undefined && !("logout" in props)) {
    			console_1.warn("<LoggedInSidebar> was created without expected prop 'logout'");
    		}
    	}

    	get sidebar_show() {
    		throw new Error("<LoggedInSidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar_show(value) {
    		throw new Error("<LoggedInSidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sidebar() {
    		throw new Error("<LoggedInSidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar(value) {
    		throw new Error("<LoggedInSidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logout() {
    		throw new Error("<LoggedInSidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logout(value) {
    		throw new Error("<LoggedInSidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LoggedOutNav.svelte generated by Svelte v3.18.2 */
    const file$j = "src\\LoggedOutNav.svelte";

    // (47:2) {:else}
    function create_else_block$3(ctx) {
    	let li;
    	let updating_value;
    	let current;

    	function button_value_binding_1(value) {
    		/*button_value_binding_1*/ ctx[4].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_high",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[1] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[1];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding_1));

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(button.$$.fragment);
    			attr_dev(li, "class", "h-full w-20 flex items-center justify-center");
    			add_location(li, file$j, 47, 4, 1206);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(button, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 2) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(47:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:2) {#if $darkMode}
    function create_if_block$6(ctx) {
    	let li;
    	let updating_value;
    	let current;

    	function button_value_binding(value) {
    		/*button_value_binding*/ ctx[3].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_low",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[1] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[1];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding));

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(button.$$.fragment);
    			attr_dev(li, "class", "h-full w-20 flex items-center justify-center");
    			add_location(li, file$j, 39, 4, 1000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(button, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 2) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(39:2) {#if $darkMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let ul;
    	let li0;
    	let a0;
    	let link_action;
    	let t1;
    	let li1;
    	let a1;
    	let link_action_1;
    	let t3;
    	let li2;
    	let a2;
    	let link_action_2;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let t6;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$6, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$darkMode*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const button = new Button({
    			props: {
    				color: "primary-300",
    				icon: "menu",
    				remove: "elevation",
    				add: "h-full lg:hidden mr-2"
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*sidebar*/ ctx[0]())) /*sidebar*/ ctx[0]().apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "New User";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Login";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Info";
    			t5 = space();
    			if_block.c();
    			t6 = space();
    			create_component(button.$$.fragment);
    			attr_dev(a0, "href", "/newUser");
    			attr_dev(a0, "class", "h-full w-full flex justify-center items-center text-white");
    			add_location(a0, file$j, 13, 4, 349);
    			attr_dev(li0, "class", "h-full w-32 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li0, file$j, 11, 2, 257);
    			attr_dev(a1, "href", "/login");
    			attr_dev(a1, "class", "h-full w-full flex justify-center items-center text-white");
    			add_location(a1, file$j, 22, 4, 595);
    			attr_dev(li1, "class", "h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li1, file$j, 20, 2, 503);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "h-full w-full flex justify-center items-center text-white");
    			add_location(a2, file$j, 31, 4, 836);
    			attr_dev(li2, "class", "h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li2, file$j, 29, 2, 744);
    			attr_dev(ul, "class", "h-full hidden lg:flex");
    			add_location(ul, file$j, 10, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			if_blocks[current_block_type_index].m(ul, null);
    			insert_dev(target, t6, anchor);
    			mount_component(button, target, anchor);
    			current = true;

    			dispose = [
    				action_destroyer(link_action = link.call(null, a0)),
    				action_destroyer(link_action_1 = link.call(null, a1)),
    				action_destroyer(link_action_2 = link.call(null, a2))
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(ul, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t6);
    			destroy_component(button, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $darkMode;
    	let { sidebar } = $$props;
    	const darkMode = dark();
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, value => $$invalidate(1, $darkMode = value));
    	const writable_props = ["sidebar"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LoggedOutNav> was created with unknown prop '${key}'`);
    	});

    	function button_value_binding(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	function button_value_binding_1(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	$$self.$set = $$props => {
    		if ("sidebar" in $$props) $$invalidate(0, sidebar = $$props.sidebar);
    	};

    	$$self.$capture_state = () => {
    		return { sidebar, $darkMode };
    	};

    	$$self.$inject_state = $$props => {
    		if ("sidebar" in $$props) $$invalidate(0, sidebar = $$props.sidebar);
    		if ("$darkMode" in $$props) darkMode.set($darkMode = $$props.$darkMode);
    	};

    	return [sidebar, $darkMode, darkMode, button_value_binding, button_value_binding_1];
    }

    class LoggedOutNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$k, safe_not_equal, { sidebar: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedOutNav",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebar*/ ctx[0] === undefined && !("sidebar" in props)) {
    			console.warn("<LoggedOutNav> was created without expected prop 'sidebar'");
    		}
    	}

    	get sidebar() {
    		throw new Error("<LoggedOutNav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar(value) {
    		throw new Error("<LoggedOutNav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LoggedInNav.svelte generated by Svelte v3.18.2 */
    const file$k = "src\\LoggedInNav.svelte";

    // (50:2) {:else}
    function create_else_block$4(ctx) {
    	let li;
    	let updating_value;
    	let current;

    	function button_value_binding_1(value) {
    		/*button_value_binding_1*/ ctx[5].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_high",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[2] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[2];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding_1));

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(button.$$.fragment);
    			attr_dev(li, "class", "h-full w-20 flex items-center justify-center");
    			add_location(li, file$k, 50, 4, 1289);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(button, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 4) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(50:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if $darkMode}
    function create_if_block$7(ctx) {
    	let li;
    	let updating_value;
    	let current;

    	function button_value_binding(value) {
    		/*button_value_binding*/ ctx[4].call(null, value);
    	}

    	let button_props = {
    		flat: true,
    		icon: "brightness_low",
    		color: "blue-500"
    	};

    	if (/*$darkMode*/ ctx[2] !== void 0) {
    		button_props.value = /*$darkMode*/ ctx[2];
    	}

    	const button = new Button({ props: button_props, $$inline: true });
    	binding_callbacks.push(() => bind(button, "value", button_value_binding));

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(button.$$.fragment);
    			attr_dev(li, "class", "h-full w-20 flex items-center justify-center");
    			add_location(li, file$k, 42, 4, 1083);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(button, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (!updating_value && dirty & /*$darkMode*/ 4) {
    				updating_value = true;
    				button_changes.value = /*$darkMode*/ ctx[2];
    				add_flush_callback(() => updating_value = false);
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(42:2) {#if $darkMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let ul;
    	let li0;
    	let a0;
    	let link_action;
    	let t1;
    	let li1;
    	let a1;
    	let link_action_1;
    	let t3;
    	let li2;
    	let a2;
    	let link_action_2;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let t6;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$7, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$darkMode*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const button = new Button({
    			props: {
    				color: "primary-300",
    				icon: "menu",
    				remove: "elevation",
    				add: "h-full lg:hidden mr-2"
    			},
    			$$inline: true
    		});

    	button.$on("click", function () {
    		if (is_function(/*sidebar*/ ctx[0]())) /*sidebar*/ ctx[0]().apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Logout";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Journal";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Info";
    			t5 = space();
    			if_block.c();
    			t6 = space();
    			create_component(button.$$.fragment);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "h-full w-full flex justify-center items-center text-white\r\n      cursor-pointer");
    			add_location(a0, file$k, 14, 4, 375);
    			attr_dev(li0, "class", "h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li0, file$k, 12, 2, 283);
    			attr_dev(a1, "href", "/journal");
    			attr_dev(a1, "class", "h-full w-full flex justify-center items-center text-white");
    			add_location(a1, file$k, 25, 4, 674);
    			attr_dev(li1, "class", "h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li1, file$k, 23, 2, 582);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "h-full w-full flex justify-center items-center text-white");
    			add_location(a2, file$k, 34, 4, 919);
    			attr_dev(li2, "class", "h-full w-20 hover:bg-primary-500 transition duration-100 ease-in-out");
    			add_location(li2, file$k, 32, 2, 827);
    			attr_dev(ul, "class", "h-full hidden lg:flex");
    			add_location(ul, file$k, 11, 0, 245);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t5);
    			if_blocks[current_block_type_index].m(ul, null);
    			insert_dev(target, t6, anchor);
    			mount_component(button, target, anchor);
    			current = true;

    			dispose = [
    				action_destroyer(link_action = link.call(null, a0)),
    				listen_dev(
    					a0,
    					"click",
    					function () {
    						if (is_function((/*logout*/ ctx[1](), push("/")))) (/*logout*/ ctx[1](), push("/")).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				action_destroyer(link_action_1 = link.call(null, a1)),
    				action_destroyer(link_action_2 = link.call(null, a2))
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(ul, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t6);
    			destroy_component(button, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let $darkMode;
    	let { sidebar } = $$props;
    	let { logout } = $$props;
    	let darkMode = dark();
    	validate_store(darkMode, "darkMode");
    	component_subscribe($$self, darkMode, value => $$invalidate(2, $darkMode = value));
    	const writable_props = ["sidebar", "logout"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LoggedInNav> was created with unknown prop '${key}'`);
    	});

    	function button_value_binding(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	function button_value_binding_1(value) {
    		$darkMode = value;
    		darkMode.set($darkMode);
    	}

    	$$self.$set = $$props => {
    		if ("sidebar" in $$props) $$invalidate(0, sidebar = $$props.sidebar);
    		if ("logout" in $$props) $$invalidate(1, logout = $$props.logout);
    	};

    	$$self.$capture_state = () => {
    		return { sidebar, logout, darkMode, $darkMode };
    	};

    	$$self.$inject_state = $$props => {
    		if ("sidebar" in $$props) $$invalidate(0, sidebar = $$props.sidebar);
    		if ("logout" in $$props) $$invalidate(1, logout = $$props.logout);
    		if ("darkMode" in $$props) $$invalidate(3, darkMode = $$props.darkMode);
    		if ("$darkMode" in $$props) darkMode.set($darkMode = $$props.$darkMode);
    	};

    	return [
    		sidebar,
    		logout,
    		$darkMode,
    		darkMode,
    		button_value_binding,
    		button_value_binding_1
    	];
    }

    class LoggedInNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$l, safe_not_equal, { sidebar: 0, logout: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedInNav",
    			options,
    			id: create_fragment$l.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*sidebar*/ ctx[0] === undefined && !("sidebar" in props)) {
    			console.warn("<LoggedInNav> was created without expected prop 'sidebar'");
    		}

    		if (/*logout*/ ctx[1] === undefined && !("logout" in props)) {
    			console.warn("<LoggedInNav> was created without expected prop 'logout'");
    		}
    	}

    	get sidebar() {
    		throw new Error("<LoggedInNav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sidebar(value) {
    		throw new Error("<LoggedInNav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logout() {
    		throw new Error("<LoggedInNav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logout(value) {
    		throw new Error("<LoggedInNav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Navbar.svelte generated by Svelte v3.18.2 */
    const file$l = "src\\Navbar.svelte";

    // (39:4) {:else}
    function create_else_block$5(ctx) {
    	let t;
    	let current;

    	const loggedoutnav = new LoggedOutNav({
    			props: { sidebar: /*sidebar*/ ctx[2] },
    			$$inline: true
    		});

    	const loggedoutsidebar = new LoggedOutSidebar({
    			props: {
    				sidebar: /*sidebar*/ ctx[2],
    				sidebar_show: /*sidebar_show*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(loggedoutnav.$$.fragment);
    			t = space();
    			create_component(loggedoutsidebar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loggedoutnav, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(loggedoutsidebar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loggedoutsidebar_changes = {};
    			if (dirty & /*sidebar_show*/ 1) loggedoutsidebar_changes.sidebar_show = /*sidebar_show*/ ctx[0];
    			loggedoutsidebar.$set(loggedoutsidebar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loggedoutnav.$$.fragment, local);
    			transition_in(loggedoutsidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loggedoutnav.$$.fragment, local);
    			transition_out(loggedoutsidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loggedoutnav, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(loggedoutsidebar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(39:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:4) {#if $loggedIn}
    function create_if_block$8(ctx) {
    	let t;
    	let current;

    	const loggedinnav = new LoggedInNav({
    			props: {
    				logout: /*logout*/ ctx[3],
    				sidebar: /*sidebar*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const loggedinsidebar = new LoggedInSidebar({
    			props: {
    				logout: /*logout*/ ctx[3],
    				sidebar_show: /*sidebar_show*/ ctx[0],
    				sidebar: /*sidebar*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(loggedinnav.$$.fragment);
    			t = space();
    			create_component(loggedinsidebar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loggedinnav, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(loggedinsidebar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loggedinsidebar_changes = {};
    			if (dirty & /*sidebar_show*/ 1) loggedinsidebar_changes.sidebar_show = /*sidebar_show*/ ctx[0];
    			loggedinsidebar.$set(loggedinsidebar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loggedinnav.$$.fragment, local);
    			transition_in(loggedinsidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loggedinnav.$$.fragment, local);
    			transition_out(loggedinsidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loggedinnav, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(loggedinsidebar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(36:4) {#if $loggedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let nav;
    	let div;
    	let a;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$8, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$loggedIn*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div = element("div");
    			a = element("a");
    			a.textContent = "Journal";
    			t1 = space();
    			if_block.c();
    			attr_dev(a, "href", "#!");
    			attr_dev(a, "class", "text-white font-thin text-2xl");
    			add_location(a, file$l, 33, 4, 963);
    			attr_dev(div, "class", "flex items-center flex-wrap justify-between w-full h-full px-4\r\n    lg:w-5/6");
    			add_location(div, file$l, 30, 2, 862);
    			attr_dev(nav, "class", "top-0 w-screen flex items-center justify-center left-0 z-30 p-0 h-16\r\n  elevation-3 bg-primary-700");
    			add_location(nav, file$l, 27, 0, 743);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div);
    			append_dev(div, a);
    			append_dev(div, t1);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $loggedIn;
    	validate_store(loggedIn, "loggedIn");
    	component_subscribe($$self, loggedIn, $$value => $$invalidate(1, $loggedIn = $$value));
    	let sidebar_show = false;

    	const sidebar = () => {
    		$$invalidate(0, sidebar_show = !sidebar_show);
    	};

    	const logout = () => {
    		localStorage.setItem("token", "");
    		set_store_value(loggedIn, $loggedIn = false);
    		push("/");
    	};

    	onMount(() => {
    		if (localStorage.getItem("token") !== "") set_store_value(loggedIn, $loggedIn = true);
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("sidebar_show" in $$props) $$invalidate(0, sidebar_show = $$props.sidebar_show);
    		if ("$loggedIn" in $$props) loggedIn.set($loggedIn = $$props.$loggedIn);
    	};

    	return [sidebar_show, $loggedIn, sidebar, logout];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\NotFound.svelte generated by Svelte v3.18.2 */

    const file$m = "src\\NotFound.svelte";

    function create_fragment$n(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "NotFound";
    			add_location(h1, file$m, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.18.2 */
    const file$n = "src\\App.svelte";

    function create_fragment$o(ctx) {
    	let main;
    	let div;
    	let t0;
    	let t1;
    	let current;
    	const navbar = new Navbar({ $$inline: true });

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t0 = space();
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			create_component(router.$$.fragment);
    			attr_dev(div, "class", "bg-img svelte-19x59r0");
    			add_location(div, file$n, 36, 2, 867);
    			add_location(main, file$n, 35, 0, 858);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(main, t0);
    			mount_component(navbar, main, null);
    			append_dev(main, t1);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self) {
    	const routes = {
    		"/": Info,
    		"/login": Login,
    		"/newUser": CreateUser,
    		"/journal": Journal,
    		"*": NotFound
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
