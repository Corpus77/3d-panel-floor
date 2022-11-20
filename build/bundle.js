
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active$1 = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active$1 += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active$1 -= deleted;
            if (!active$1)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active$1)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
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
            const d = (program.b - t);
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
            if (running_program || pending_program) {
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.52.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function slide(node, { delay = 0, duration = 400, easing = cubicOut } = {}) {
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
            css: t => 'overflow: hidden;' +
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
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
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

    let filenamesBrick = [
      { url: "3blue.jpg", size: "770x700", title: "Голубой кирпич 3мм" },
      { url: "3miata.jpg", size: "770x700", title: "Мятный кирпич 3мм" },
      { url: "3rose.jpg", size: "770x700", title: "Розовый кирпич 3мм" },
      { url: "3sand.jpg", size: "770x700", title: "Песочный кирпич 3мм" },
      { url: "3silver.jpg", size: "770x700", title: "Серебряный кирпич 3мм" },
      {
        url: "whitesilverbrick.webp",
        size: "770x700",
        title: "Белый кирпич с серебрянной полоской 5мм",
      },
      { url: "3white.jpg", size: "770x700", title: "Белый кирпич 3мм" },

      { url: "4white.jpg", size: "770x700", title: "Белый кирпич 4мм" },
      { url: "5birusa.jpg", size: "770x700", title: "Бирюзовый кирпич 5мм" },
      { url: "5black.jpg", size: "770x700", title: "Черный кирпич 5мм" },
      { url: "5blue+.jpg", size: "770x700", title: "Синий кирпич 5мм" },
      { url: "5blue.jpg", size: "770x700", title: "Голубой кирпич 5мм" },
      {
        url: "5lightviolet.jpg",
        size: "770x700",
        title: "Св. фиолетовый кирпич 5мм",
      },
      { url: "5miata.jpg", size: "770x700", title: "Мятный кирпич 5мм" },
      { url: "5orange.jpg", size: "770x700", title: "Оранжевый кирпич 5мм" },
      { url: "5gold.jpg", size: "770x700", title: "Золотистый кирпич 5мм" },
      { url: "5red.jpg", size: "770x700", title: "Красный кирпич 5мм" },
      { url: "5rose.jpg", size: "770x700", title: "Розовый кирпич 5мм" },
      { url: "5roseflowers.jpg", size: "770x700", title: "Розовые цветы 5мм" },
      { url: "5green.jpg", size: "770x700", title: "Зеленый кирпич 5мм" },
      { url: "5cofee.jpg", size: "770x700", title: "Кофейный кирпич 5мм" },
      { url: "5silver.jpg", size: "770x700", title: "Серебряный кирпич 5мм" },
      { url: "5violet.jpg", size: "770x700", title: "Фиолетовый кирпич 5мм" },
      { url: "5white.jpg", size: "770x700", title: "Белый кирпич 5мм" },
      { url: "5yellow+.jpg", size: "770x700", title: "Желтый кирпич 5мм" },
      { url: "5yellow.jpg", size: "770x700", title: "Бежевый кирпич 5мм" },
      { url: "5greystripe.jpeg", size: "770x700", title: "Серая полоска 5мм" },
      { url: "5bejstripe.jpeg", size: "770x700", title: "Бежевая полоска 5мм" },
      { url: "7birusa.jpg", size: "770x700", title: "Бирюзовый кирпич 7мм" },
      { url: "7black.jpg", size: "770x700", title: "Черный кирпич 7мм" },
      { url: "7blue.jpg", size: "770x700", title: "Голубой кирпич 7мм" },
      { url: "7brown.jpg", size: "770x700", title: "Коричневый кирпич 7мм" },
      { url: "7cofee.jpg", size: "770x700", title: "Кофейный кирпич 7мм" },
      { url: "7darkrose.jpg", size: "770x700", title: "Тёмно-розовый кирпич 7мм" },
      { url: "7gold.jpg", size: "770x700", title: "Золотистый кирпич 7мм" },
      { url: "7green.jpg", size: "770x700", title: "Зеленый кирпич 7мм" },
      {
        url: "7lightviolet.jpg",
        size: "770x700",
        title: "Св. фиолетовый кирпич 7мм",
      },
      { url: "7miata.jpg", size: "770x700", title: "Мятный кирпич 7мм" },
      { url: "7orange.jpg", size: "770x700", title: "Оранжевый кирпич 7мм" },
      { url: "7red.jpg", size: "770x700", title: "Красный кирпич 7мм" },
      { url: "7rose.jpg", size: "770x700", title: "Розовый кирпич 7мм" },
      { url: "7silver.jpg", size: "770x700", title: "Серебряный кирпич 7мм" },
      { url: "7violet.jpg", size: "770x700", title: "Фиолетовый кирпич 7мм" },
      { url: "7white.jpg", size: "770x700", title: "Белый кирпич 7мм" },
      { url: "7yellow+.jpg", size: "770x700", title: "Желтый кирпич 7мм" },
      { url: "7yellow.jpg", size: "770x700", title: "Бежевый кирпич 7мм" },
    ];
    let filenamesDecBrick = [
      { url: "5graffity.jpg", size: "770x700", title: "Кирпич с граффити 5мм" },
      { url: "5graffity1.jpg", size: "770x700", title: "Кирпич с граффити1 5мм" },
      { url: "5graffity2.jpg", size: "770x700", title: "Кирпич с граффити2 5мм" },
      { url: "5greenmix.jpg", size: "770x700", title: "Зелёный микс 5мм" },
      { url: "4rosemix.jpg", size: "770x700", title: "Розовый микс 4мм" },
      { url: "4seamix.jpg", size: "770x700", title: "Морской микс 4мм" },
      { url: "5bordo.jpg", size: "770x700", title: "Бордовый кирпич 5мм" },
      { url: "klinkersand.webp", size: "770x700", title: "Клинкер песочный 5мм" },
      {
        url: "klinkerorange.webp",
        size: "770x700",
        title: "Клинкер оранжевый 5мм",
      },
      { url: "klinkergrey.webp", size: "770x700", title: "Клинкер серый 5мм" },
      {
        url: "klinkerbrown.webp",
        size: "770x700",
        title: "Клинкер коричневый 6мм",
      },
      { url: "klinkerred.webp", size: "770x700", title: "Клинкер красный 6мм" },
      {
        url: "newbrownsand4.webp",
        size: "770x700",
        title: "Коричневый песчаник 4мм",
      },
      { url: "stonesand.jpg", size: "770x700", title: "Песчаник 6мм" },
      { url: "stonesandgrey.jpg", size: "770x700", title: "Серый песчаник 6мм" },
      { url: "stonesandmat.jpeg", size: "770x700", title: "Песчаник матовый 6мм" },
      {
        url: "stonesandgreydark.jpg",
        size: "770x700",
        title: "Серый песчаник темный 5мм",
      },
      {
        url: "stonesandred.jpg",
        size: "770x700",
        title: "Бежево-серый песчаник 6мм",
      },
      { url: "firewood4.webp", size: 70, title: "Огненное дерево 4мм" },
      { url: "5scale.jpg", size: "770x700", title: "Луска 5мм" },
      { url: "st.webp", size: "770x700", title: "Разноцветные полоски 6мм" },
      { url: "mech.jpg", size: "770x700", title: "Шестеренки 5мм" },
      { url: "colormozaic4.webp", size: "770x700", title: "Цветная мозаика 4мм" },
      { url: "yellowromb+.jpg", size: 70, title: "Бежевые ромбы 7мм" },
      { url: "5tornbej.jpeg", size: "770x700", title: "Рваный бежевый кирпич 5мм" },
      { url: "5torngrey.jpeg", size: "770x700", title: "Рваный серый кирпич 5мм" },
      { url: "orangestone.webp", size: 70, title: "Рваный оранжевый камень 8мм" },
      { url: "5tornwhite.jpeg", size: "770x700", title: "Рваный белый кирпич 5мм" },
      {
        url: "brokenwhitebrick5.webp",
        size: "770x700",
        title: "Белый разбитый кирпич 5мм",
      },
      {
        url: "comb_torn_stone.jpg",
        size: "770x700",
        title: "Комбинированый рваный камень 7мм",
      },
      {
        url: "whitebrick_different.jpg",
        size: 70,
        title: "Белый кирпич декор 5мм",
      },
    ];
    let filenamesEk = [
      {
        url: "ekbejbrown.jpg",
        size: "770x700",
        title: "Екатиринославский бежево-коричневый 5мм",
      },
      {
        url: "ekbrown.jpg",
        size: "770x700",
        title: "Екатиринославский коричневый 5мм",
      },
      { url: "redwhite.webp", size: "770x700", title: "Красно-белый" },
      { url: "ekgrey.jpg", size: "770x700", title: "Екатиринославский серый 5мм" },
      {
        url: "ekgreyblue.jpg",
        size: "770x700",
        title: "Екатиринославский синий 5мм",
      },
      { url: "ekred.jpg", size: "770x700", title: "Екатиринославский красный 5мм" },
      {
        url: "ekbrightmat.jpeg",
        size: "770x700",
        title: "Екатиринославский яркий матовый 5мм",
      },
      { url: "ekroux.jpg", size: "770x700", title: "Екатиринославский рыжий 5мм" },
      {
        url: "ekviolet.jpg",
        size: "770x700",
        title: "Екатиринославский фиолетовый 5мм",
      },
    ];
    let filenamesKladka = [
      { url: "klblack.jpg", size: "770x700", title: "Кладка черная 7мм" },
      { url: "klblue.jpg", size: "770x700", title: "Кладка голубой 7мм" },
      { url: "klchokolate.jpg", size: "770x700", title: "Кладка шоколад 7мм" },
      { url: "klcofee.jpg", size: "770x700", title: "Кладка кофейная 7мм" },
      { url: "klsand.jpg", size: "770x700", title: "Кладка песочная 7мм" },
      { url: "klsilver.jpg", size: "770x700", title: "Кладка серебряная 7мм" },
      { url: "klwhite.jpg", size: "770x700", title: "Кладка белая 7мм" },
      { url: "klyellow.jpg", size: "770x700", title: "Кладка желтая 7мм" },
      { url: "klyell.webp", size: "770x700", title: "Кладка желтая мраморная 7мм" },
    ];
    let filenamesMramor = [
      {
        url: "brown_mramor.jpg",
        size: "770x700",
        title: "Мрамор светло коричневый 5мм",
      },
      { url: "grey_mramor.jpg", size: "770x700", title: "Мрамор светло серый 5мм" },
      { url: "mrbegorange.jpg", size: "770x700", title: "Мрамор оранж-беж 5мм" },
      { url: "mrbej.jpg", size: "770x700", title: "Мрамор бежевый 5мм" },
      { url: "mrblack.jpg", size: "770x700", title: "Мрамор черный 5мм" },
      { url: "mrblackwhite.jpg", size: "770x700", title: "Мрамор черно-белый 5мм" },
      { url: "mrblue.jpg", size: "770x700", title: "Мрамор голубой 5мм" },
      { url: "mrbordo.jpg", size: "770x700", title: "Мрамор бордовый 5мм" },
      { url: "mrdeepsea.jpg", size: "770x700", title: "Мрамор глубокое море 5мм" },
      { url: "mrfire.jpg", size: "770x700", title: "Мрамор огненный 5мм" },
      { url: "mrgold.jpg", size: "770x700", title: "Мрамор золотой 5мм" },
      { url: "mrolive.jpg", size: "770x700", title: "Мрамор оливковый 5мм" },
      { url: "mrred.jpg", size: "770x700", title: "Мрамор красный 5мм" },
      { url: "mrsalad.jpg", size: "770x700", title: "Мрамор салатный 5мм" },
      {
        url: "mrbrownbej.jpg",
        size: "770x700",
        title: "Мрамор коричнево-бежевый 5мм",
      },
      { url: "mrplitka.jpg", size: "770x700", title: "Мраморная плитка 4мм" },
      {
        url: "seamramorplate4.webp",
        size: "770x700",
        title: "Мраморная плитка морская 4мм",
      },
    ];
    let filenamesBambook = [
      { url: "bamboocapuchino.jpg", size: 70, title: "Бамбук капучино 8мм" },
      { url: "bamboogrey.jpg", size: 70, title: "Бамбук серый 8мм" },
      { url: "bamboogreyred.jpg", size: 70, title: "Бамбук серо-красный 8мм" },
      { url: "bambook1.jpg", size: 70, title: "Бамбук микс 8мм" },
      { url: "bambookbrown.jpg", size: 70, title: "Бамбук коричневый 8мм" },
      { url: "bambookcolor.jpg", size: 70, title: "Бамбук цветной 8мм" },
      { url: "bambookyellow.jpg", size: 70, title: "Бамбук желтый 8мм" },
      { url: "bamboomiata.jpg", size: 70, title: "Бамбук мятный 8мм" },
      { url: "bamboomix.jpg", size: 70, title: "Бамбук микс1 8мм" },
      { url: "bambooorange.jpg", size: 70, title: "Бамбук оранжевый 8мм" },
      { url: "bamboorose.jpg", size: 70, title: "Бамбук розовый 8мм" },
      { url: "bambooviolet.jpg", size: 70, title: "Бамбук фиолетовый 8мм" },
    ];
    //-----------------------------------------
    let filenamesStone = [
      { url: "stone.jpg", size: "770x700", title: "Камень 6мм" },
      { url: "stoneblack.jpeg", size: 70, title: "Черный камень 5мм" },
      { url: "stonemat.jpeg", size: 70, title: "Матовый камень 7мм" },
      {
        url: "stoneblackwhite.jpg",
        size: 70,
        title: "Черный мраморный камень 7мм",
      },
      { url: "stoneyellow.jpg", size: 70, title: "Бежевый мраморный камень 7мм" },
      { url: "stonegrey.jpg", size: 70, title: "Серый камень 8мм" },
    ];
    let filenamesWood = [
      { url: "woodbrown.jpg", size: 70, title: "Коричневое дерево 5мм" },
      { url: "woodbrownblue.jpg", size: 70, title: "Синее дерево 5мм" },
      { url: "woodgreybrown.webp", size: 70, title: "Серо-зеленое дерево 4мм" },
      { url: "palitra4.webp", size: "770x700", title: "Палитра 4мм" },
      { url: "youngtree4.webp", size: "770x700", title: "Молодое дерево 4мм" },
      { url: "woodcolor.jpg", size: 70, title: "Бежево-голубое 5мм" },
      { url: "woodflower.jpg", size: 70, title: "Цветущее дерево 5мм" },
      { url: "woodgold.jpg", size: 70, title: "Золотистое дерево 7мм" },
      { url: "woodgreybrown.jpg", size: 70, title: "Серо-коричневое дерево 7мм" },
      { url: "rosetree4.webp", size: "770x700", title: "Розовый микс" },
      { url: "woodlightouk.jpg", size: 70, title: "Светлый дуб 5мм" },
      { url: "woodmiata.jpg", size: 70, title: "Мятное дерево 5мм" },
      { url: "woodoakdark.jpg", size: 70, title: "Темный дуб 7мм" },
      { url: "woodolhadark.jpg", size: 70, title: "Ольха 5мм" },
      { url: "woodredoak.jpg", size: 70, title: "Красное дерево 7мм" },
      { url: "woodzebra.jpg", size: 70, title: "Дерево под зебру 7мм" },
      { url: "woodgrafit.jpg", size: 70, title: "Дерево под графит 4мм" },
      { url: "woodcaramel.jpg", size: 70, title: "Дерево под карамель 4мм" },
      { url: "whitewood.jpg", size: 70, title: "Белое дерево 6мм" },
      { url: "5brus.jpg", size: "770x700", title: "Брус 5мм" },
    ];
    let filenamesVintage = [
      { url: "blueroses.webp", size: 70, title: "Розы на голубом 5мм" },
      { url: "greenroses.webp", size: 70, title: "Розы на зеленом 5мм" },
      { url: "grayroses.webp", size: 70, title: "Розы на сером 5мм" },
      { url: "roseroses.webp", size: 70, title: "Розы на розовом 5мм" },
      { url: "whitevintage.webp", size: 70, title: "Белый винтаж 5мм" },
      { url: "birvintage.webp", size: 70, title: "Бирюзовый винтаж 5мм" },
      { url: "bejvintage.webp", size: 70, title: "Бежевый винтаж 5мм" },
      { url: "blackvintage.webp", size: 70, title: "Черный винтаж 5мм" },
      { url: "venzelgreen.webp", size: 70, title: "Вензель зеленый 5мм" },
      { url: "venzelgold.webp", size: 70, title: "Вензель золотой 5мм" },
      { url: "venzelviolet.webp", size: 70, title: "Вензель фиолетовый 5мм" },
      { url: "venzelsilver.webp", size: 70, title: "Вензель серебро 5мм" },
      { url: "venzelsilver.webp", size: 70, title: "Вензель серебро 5мм" },
    ];
    let filenamesCeil = [
      { url: "pot4conus.jpg", size: 70, title: "Потолочная белая роза 5мм" },
      { url: "potbigornament.jpg", size: 70, title: "Потолочная клевер 9мм" },
      { url: "potbigwave.jpg", size: 70, title: "Потолочная большие волны 7мм" },
      { url: "brown_wave.jpg", size: 70, title: "Коричневая волна 7мм" },
      { url: "goldwave.webp", size: 70, title: "Золотая волна 5мм" },
      { url: "blackwave.webp", size: 70, title: "Черно-белая волна 5мм" },
      {
        url: "potcrashdark.jpg",
        size: 70,
        title: "Потолочная серебрянная паутина 8мм",
      },
      { url: "potcrashed.jpg", size: 70, title: "Потолочная белая паутинка 5мм" },
      { url: "potflower.jpg", size: 70, title: "Белая лилия 5мм" },
      { url: "rings1.webp", size: 70, title: "Кольца 8мм 300x300" },
      { url: "rectangle.webp", size: 70, title: "Прямоугольники 8мм 300х300" },
      { url: "potflowerinromb.jpg", size: 70, title: "Белая вышиванка 5мм" },
      { url: "potmirror.jpg", size: 70, title: "Потолочная ромб с серебром 6мм" },
      { url: "potorigami.jpg", size: 70, title: "Потолочная белый ромб 6мм" },
      { url: "potornament.jpg", size: 70, title: "Потолочная лотос 5мм" },
      {
        url: "potornamentromb.jpg",
        size: 70,
        title: "Потолочная белая романтика 5мм",
      },
      { url: "potplitka.jpg", size: 70, title: "Потолочная пирамида 5мм" },
      {
        url: "potplitkayellow.jpg",
        size: 70,
        title: "Потолочная пирамида с желтым 5мм",
      },
      { url: "potromb+.jpg", size: 70, title: "Потолочная ромб 7мм" },
      { url: "potromb.jpg", size: 70, title: "Потолочная ромб1 7мм" },
      { url: "potroundornament.jpg", size: 70, title: "Потолочная солнце 7.5мм" },
      { url: "potsmallornament.jpg", size: 70, title: "Потолочная модерн 5мм" },
      { url: "potsmallwaves.jpg", size: 70, title: "Потолочная мелкая волна 7мм" },
      { url: "potsquare.jpg", size: 70, title: "Потолочная квадраты" },
      {
        url: "potsquaresilver.jpg",
        size: 70,
        title: "Потолочная квадраты серебро",
      },
      { url: "potplet.jpeg", size: 70, title: "Потолочная плетение 5мм" },
      { url: "potpletdark.jpg", size: 70, title: "Потолочная плетение темная 5мм" },
      { url: "potstar.jpg", size: 70, title: "Потолочная ромашка 5мм" },
      {
        url: "potstaryellow.jpg",
        size: 70,
        title: "Потолочная ромашка желтая 5мм",
      },
      { url: "potuzorromb.jpg", size: 70, title: "Потолочная узорный ромб 6мм" },
      { url: "potuzorsquare.jpg", size: 70, title: "Потолочная орнамент 5мм" },
      {
        url: "potornamentyellow.jpg",
        size: 70,
        title: "Потолочная орнамент желтая 5мм",
      },
      {
        url: "potornamentsilver.jpg",
        size: 70,
        title: "Потолочная орнамент серебро 5мм",
      },
    ];
    const filenamesVinilWall = [
      { url: "ashwood.webp", size: 70, title: "Пепельное дерево" },
      { url: "bejmramor.webp", size: 70, title: "Бежевый мрамор" },
      { url: "blackmramor.webp", size: 70, title: "Черный мрамор мат." },
      { url: "blackmramorlux.webp", size: 70, title: "Черный мрамор гл." },
      { url: "colormramor.webp", size: 70, title: "Цветной мрамор" },
      { url: "darkmramor.webp", size: 70, title: "Темный мрамор" },
      { url: "darkwood.webp", size: 70, title: "Темное дерево" },
      { url: "greylux.webp", size: 70, title: "Серый мрамор гл." },
      { url: "greystripeswood.webp", size: 70, title: "Серое полосатое дерево" },
      { url: "greywood.webp", size: 70, title: "Серое дерево" },
      { url: "kashtanwood.webp", size: 70, title: "Каштановое дерево" },
      { url: "lightgreymramor.webp", size: 70, title: "Светло-серый мрамор" },
      { url: "lightmramor.webp", size: 70, title: "Светлый мрамор" },
      { url: "lightstonemramor.webp", size: 70, title: "Светлый камень" },
      { url: "milkwood.webp", size: 70, title: "Молочное дерево" },
      { url: "milkwood2.webp", size: 70, title: "Молочное дерево-2" },
      { url: "mosaicdarkwood.webp", size: 70, title: "Темная мозаика дерево" },
      { url: "mosaicwood.webp", size: 70, title: "Мозаика дерево" },
      { url: "mramor.webp", size: 70, title: "Мрамор" },
      { url: "naturalmramor.webp", size: 70, title: "Натуральный мрамор" },
      { url: "naturalmramor2.webp", size: 70, title: "Натуральный мрамор-2" },
      { url: "oldwood.webp", size: 70, title: "Старое дерево" },
      { url: "redmramor.webp", size: 70, title: "Красный мрамор" },
      { url: "silvermramor.webp", size: 70, title: "Серебряный мрамор мат." },
      { url: "silvermramorlux.webp", size: 70, title: "Серебряный мрамор гл." },
      { url: "stonemramor.webp", size: 70, title: "Каменный мрамор" },
      { url: "venge.webp", size: 70, title: "Венж" },
      { url: "whitemramor.webp", size: 70, title: "Белый мрамор" },
      { url: "wildpear.webp", size: 70, title: "Дикая груша" },
    ];

    const filenamesPuzzles = [
      { url: "f-brownwood.webp", size: 70, title: "Коричневое дерево" },
      { url: "f-darkgreywood.webp", size: 70, title: "Темно-серое дерево" },
      { url: "f-darkwood.webp", size: 70, title: "Темное дерево" },
      { url: "f-goldenwood.webp", size: 70, title: "Золотое дерево" },
      { url: "f-grass.jpg", size: 70, title: "Трава" },
      { url: "f-greywood.webp", size: 70, title: "Серое дерево" },
      { url: "f-holes.webp", size: 70, title: "Отверстия" },
      { url: "f-lightrosewood.webp", size: 70, title: "Светло-розовое дерево" },
      { url: "f-persikwood.webp", size: 70, title: "Персиковое дерево" },
      { url: "f-redwood.webp", size: 70, title: "Красное дерево" },
      { url: "f-rosewood.webp", size: 70, title: "Розовое дерево" },
      { url: "f-sandywood.webp", size: 70, title: "Песочное дерево" },
      { url: "f-water.webp", size: 70, title: "Вода" },
      { url: "f-yantarwood.webp", size: 70, title: "Янтарное дерево" },
      { url: "f-yellowwood.webp", size: 70, title: "Желтое дерево" },
    ];
    const filenamesPuzzlesButton = [
      { url: "brownwood.webp", size: 70, title: "Коричневое дерево" },
      { url: "darkgreywood.webp", size: 70, title: "Темно-серое дерево" },
      { url: "darkwood.webp", size: 70, title: "Темное дерево" },
      { url: "goldenwood.webp", size: 70, title: "Золотое дерево" },
      { url: "grass.webp", size: 70, title: "Трава" },
      { url: "greywood.webp", size: 70, title: "Серое дерево" },
      { url: "holes.webp", size: 70, title: "Отверстия" },
      { url: "lightrosewood.webp", size: 70, title: "Светло-розовое дерево" },
      { url: "persikwood.webp", size: 70, title: "Персиковое дерево" },
      { url: "redwood.webp", size: 70, title: "Красное дерево" },
      { url: "rosewood.webp", size: 70, title: "Розовое дерево" },
      { url: "sandywood.webp", size: 70, title: "Песочное дерево" },
      { url: "water.webp", size: 70, title: "Вода" },
      { url: "yantarwood.webp", size: 70, title: "Янтарное дерево" },
      { url: "yellowwood", size: 70, title: "Желтое дерево" },
    ];
    const filenamesVinil = [
      { url: "ashwood.webp", size: 70, title: "Пепельное дерево" },
      { url: "bejmramor.webp", size: 70, title: "Бежевый мрамор" },
      { url: "blackmramor.webp", size: 70, title: "Черный мрамор мат." },
      { url: "blackmramorlux.webp", size: 70, title: "Черный мрамор гл." },
      { url: "colormramor.webp", size: 70, title: "Цветной мрамор" },
      { url: "darkmramor.webp", size: 70, title: "Темный мрамор" },
      { url: "darkwood.webp", size: 70, title: "Темное дерево" },
      { url: "greylux.webp", size: 70, title: "Серый мрамор гл." },
      { url: "greystripeswood.webp", size: 70, title: "Серое полосатое дерево" },
      { url: "greywood.webp", size: 70, title: "Серое дерево" },
      { url: "kashtanwood.webp", size: 70, title: "Каштановое дерево" },
      { url: "lightgreymramor.webp", size: 70, title: "Светло-серый мрамор" },
      { url: "lightmramor.webp", size: 70, title: "Светлый мрамор" },
      { url: "lightstonemramor.webp", size: 70, title: "Светлый камень" },
      { url: "milkwood.webp", size: 70, title: "Молочное дерево" },
      { url: "milkwood2.webp", size: 70, title: "Молочное дерево-2" },
      { url: "mosaicdarkwood.webp", size: 70, title: "Темная мозаика дерево" },
      { url: "mosaicwood.webp", size: 70, title: "Мозаика дерево" },
      { url: "mramor.webp", size: 70, title: "Мрамор" },
      { url: "naturalmramor.webp", size: 70, title: "Натуральный мрамор" },
      { url: "naturalmramor2.webp", size: 70, title: "Натуральный мрамор-2" },
      { url: "oldwood.webp", size: 70, title: "Старое дерево" },
      { url: "redmramor.webp", size: 70, title: "Красный мрамор" },
      { url: "silvermramor.webp", size: 70, title: "Серебряный мрамор мат." },
      { url: "silvermramorlux.webp", size: 70, title: "Серебряный мрамор гл." },
      { url: "stonemramor.webp", size: 70, title: "Каменный мрамор" },
      { url: "venge.webp", size: 70, title: "Венж" },
      { url: "whitemramor.webp", size: 70, title: "Белый мрамор" },
      { url: "wildpear.webp", size: 70, title: "Дикая груша" },
    ];

    /* src\components\Modal.svelte generated by Svelte v3.52.0 */

    const file$4 = "src\\components\\Modal.svelte";

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[28] = list;
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[27] = list;
    	child_ctx[26] = i;
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[25] = list;
    	child_ctx[26] = i;
    	return child_ctx;
    }

    // (148:38) 
    function create_if_block_8(ctx) {
    	let each_1_anchor;
    	let each_value_8 = /*wallArray*/ ctx[1];
    	validate_each_argument(each_value_8);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*active, wallArray*/ 2) {
    				each_value_8 = /*wallArray*/ ctx[1];
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_8.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(148:38) ",
    		ctx
    	});

    	return block;
    }

    // (137:39) 
    function create_if_block_7(ctx) {
    	let each_1_anchor;
    	let each_value_7 = /*floorArray*/ ctx[2];
    	validate_each_argument(each_value_7);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*active, floorArray*/ 4) {
    				each_value_7 = /*floorArray*/ ctx[2];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_7.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(137:39) ",
    		ctx
    	});

    	return block;
    }

    // (126:4) {#if globalSurface == "wall"}
    function create_if_block_6(ctx) {
    	let each_1_anchor;
    	let each_value_6 = /*wallArray*/ ctx[1];
    	validate_each_argument(each_value_6);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*active, wallArray*/ 2) {
    				each_value_6 = /*wallArray*/ ctx[1];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_6.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(126:4) {#if globalSurface == \\\"wall\\\"}",
    		ctx
    	});

    	return block;
    }

    // (149:6) {#each wallArray as item, index}
    function create_each_block_8(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[11].title + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[6](/*item*/ ctx[11], /*each_value_8*/ ctx[28], /*index*/ ctx[26], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "btn non-active svelte-1bl75g1");
    			add_location(button, file$4, 149, 8, 3832);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*wallArray*/ 2 && t0_value !== (t0_value = /*item*/ ctx[11].title + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(149:6) {#each wallArray as item, index}",
    		ctx
    	});

    	return block;
    }

    // (138:6) {#each floorArray as item, index}
    function create_each_block_7(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[11].title + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[5](/*item*/ ctx[11], /*each_value_7*/ ctx[27], /*index*/ ctx[26], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "btn non-active svelte-1bl75g1");
    			add_location(button, file$4, 138, 8, 3506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*floorArray*/ 4 && t0_value !== (t0_value = /*item*/ ctx[11].title + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(138:6) {#each floorArray as item, index}",
    		ctx
    	});

    	return block;
    }

    // (127:6) {#each wallArray as item, index}
    function create_each_block_6(ctx) {
    	let button;
    	let t0_value = /*item*/ ctx[11].title + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*item*/ ctx[11], /*each_value_6*/ ctx[25], /*index*/ ctx[26], ...args);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "btn non-active svelte-1bl75g1");
    			add_location(button, file$4, 127, 8, 3179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*wallArray*/ 2 && t0_value !== (t0_value = /*item*/ ctx[11].title + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(127:6) {#each wallArray as item, index}",
    		ctx
    	});

    	return block;
    }

    // (202:36) 
    function create_if_block_4(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_4 = /*wallArray*/ ctx[1];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wallArray, linear, panelChoice*/ 10) {
    				each_value_4 = /*wallArray*/ ctx[1];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_4.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(202:36) ",
    		ctx
    	});

    	return block;
    }

    // (183:37) 
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*floorArray*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*floorArray, linear, panelChoice*/ 12) {
    				each_value_2 = /*floorArray*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(183:37) ",
    		ctx
    	});

    	return block;
    }

    // (164:2) {#if globalSurface == "wall"}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*wallArray*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*wallArray, linear, panelChoice*/ 10) {
    				each_value = /*wallArray*/ ctx[1];
    				validate_each_argument(each_value);
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
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(164:2) {#if globalSurface == \\\"wall\\\"}",
    		ctx
    	});

    	return block;
    }

    // (204:6) {#if item.visible}
    function create_if_block_5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_5 = /*item*/ ctx[11].imgArr;
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*linear, panelChoice, wallArray*/ 10) {
    				each_value_5 = /*item*/ ctx[11].imgArr;
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_5.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_5.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(204:6) {#if item.visible}",
    		ctx
    	});

    	return block;
    }

    // (205:8) {#each item.imgArr as filename}
    function create_each_block_5(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let t1_value = /*filename*/ ctx[14].title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*filename*/ ctx[14].size + "";
    	let t3;
    	let t4;
    	let t5;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[9](/*filename*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			t5 = space();
    			if (!src_url_equal(img.src, img_src_value = "./build/textures/" + /*filename*/ ctx[14].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1bl75g1");
    			add_location(img, file$4, 213, 12, 5964);
    			attr_dev(span0, "class", "title svelte-1bl75g1");
    			add_location(span0, file$4, 214, 12, 6030);
    			attr_dev(span1, "class", "size svelte-1bl75g1");
    			add_location(span1, file$4, 215, 12, 6087);
    			attr_dev(div, "class", "divImg svelte-1bl75g1");
    			add_location(div, file$4, 206, 10, 5738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_5, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*wallArray*/ 2 && !src_url_equal(img.src, img_src_value = "./build/textures/" + /*filename*/ ctx[14].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*wallArray*/ 2) && t1_value !== (t1_value = /*filename*/ ctx[14].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*wallArray*/ 2) && t3_value !== (t3_value = /*filename*/ ctx[14].size + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					scale,
    					{
    						delay: 200,
    						duration: 500,
    						easing: identity
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				scale,
    				{
    					delay: 200,
    					duration: 500,
    					easing: identity
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(205:8) {#each item.imgArr as filename}",
    		ctx
    	});

    	return block;
    }

    // (203:4) {#each wallArray as item}
    function create_each_block_4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*item*/ ctx[11].visible && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[11].visible) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*wallArray*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_5(ctx);
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
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(203:4) {#each wallArray as item}",
    		ctx
    	});

    	return block;
    }

    // (185:6) {#if item.visible}
    function create_if_block_3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_3 = /*item*/ ctx[11].imgArr;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*linear, panelChoice, floorArray*/ 12) {
    				each_value_3 = /*item*/ ctx[11].imgArr;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_3.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(185:6) {#if item.visible}",
    		ctx
    	});

    	return block;
    }

    // (186:8) {#each item.imgArr as filename}
    function create_each_block_3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let t1_value = /*filename*/ ctx[14].title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*filename*/ ctx[14].size + "";
    	let t3;
    	let t4;
    	let t5;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[8](/*filename*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			t5 = space();
    			if (!src_url_equal(img.src, img_src_value = "./build/textures/floor/" + /*filename*/ ctx[14].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1bl75g1");
    			add_location(img, file$4, 194, 12, 5288);
    			attr_dev(span0, "class", "title svelte-1bl75g1");
    			add_location(span0, file$4, 195, 12, 5360);
    			attr_dev(span1, "class", "size svelte-1bl75g1");
    			add_location(span1, file$4, 196, 12, 5417);
    			attr_dev(div, "class", "divImg svelte-1bl75g1");
    			add_location(div, file$4, 187, 10, 5062);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*floorArray*/ 4 && !src_url_equal(img.src, img_src_value = "./build/textures/floor/" + /*filename*/ ctx[14].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*floorArray*/ 4) && t1_value !== (t1_value = /*filename*/ ctx[14].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*floorArray*/ 4) && t3_value !== (t3_value = /*filename*/ ctx[14].size + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					scale,
    					{
    						delay: 200,
    						duration: 500,
    						easing: identity
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				scale,
    				{
    					delay: 200,
    					duration: 500,
    					easing: identity
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(186:8) {#each item.imgArr as filename}",
    		ctx
    	});

    	return block;
    }

    // (184:4) {#each floorArray as item}
    function create_each_block_2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*item*/ ctx[11].visible && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[11].visible) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*floorArray*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(184:4) {#each floorArray as item}",
    		ctx
    	});

    	return block;
    }

    // (166:6) {#if item.visible}
    function create_if_block_1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*item*/ ctx[11].imgArr;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*linear, panelChoice, wallArray*/ 10) {
    				each_value_1 = /*item*/ ctx[11].imgArr;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(166:6) {#if item.visible}",
    		ctx
    	});

    	return block;
    }

    // (167:8) {#each item.imgArr as filename}
    function create_each_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let span0;
    	let t1_value = /*filename*/ ctx[14].title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*filename*/ ctx[14].size + "";
    	let t3;
    	let t4;
    	let t5;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[7](/*filename*/ ctx[14]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text(" mm");
    			t5 = space();
    			if (!src_url_equal(img.src, img_src_value = "./build/textures/" + /*filename*/ ctx[14].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-1bl75g1");
    			add_location(img, file$4, 175, 12, 4616);
    			attr_dev(span0, "class", "title svelte-1bl75g1");
    			add_location(span0, file$4, 176, 12, 4682);
    			attr_dev(span1, "class", "size svelte-1bl75g1");
    			add_location(span1, file$4, 177, 12, 4739);
    			attr_dev(div, "class", "divImg svelte-1bl75g1");
    			add_location(div, file$4, 168, 10, 4390);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*wallArray*/ 2 && !src_url_equal(img.src, img_src_value = "./build/textures/" + /*filename*/ ctx[14].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if ((!current || dirty & /*wallArray*/ 2) && t1_value !== (t1_value = /*filename*/ ctx[14].title + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*wallArray*/ 2) && t3_value !== (t3_value = /*filename*/ ctx[14].size + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					scale,
    					{
    						delay: 200,
    						duration: 500,
    						easing: identity
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				scale,
    				{
    					delay: 200,
    					duration: 500,
    					easing: identity
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(167:8) {#each item.imgArr as filename}",
    		ctx
    	});

    	return block;
    }

    // (165:4) {#each wallArray as item}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*item*/ ctx[11].visible && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*item*/ ctx[11].visible) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*wallArray*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(165:4) {#each wallArray as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let div0_transition;
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let div1_transition;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*globalSurface*/ ctx[0] == "wall") return create_if_block_6;
    		if (/*globalSurface*/ ctx[0] == "floor") return create_if_block_7;
    		if (/*globalSurface*/ ctx[0] == "ceil") return create_if_block_8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type && current_block_type(ctx);
    	const if_block_creators = [create_if_block$1, create_if_block_2, create_if_block_4];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*globalSurface*/ ctx[0] == "wall") return 0;
    		if (/*globalSurface*/ ctx[0] == "floor") return 1;
    		if (/*globalSurface*/ ctx[0] == "ceil") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "btnContainer svelte-1bl75g1");
    			add_location(div0, file$4, 123, 2, 2973);
    			attr_dev(div1, "class", "container svelte-1bl75g1");
    			add_location(div1, file$4, 122, 0, 2897);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div1, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if (if_block0) if_block0.d(1);
    				if_block0 = current_block_type && current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, scale, { delay: 250, duration: 500 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, { delay: 100, duration: 500 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, scale, { delay: 250, duration: 500 }, false);
    			div0_transition.run(0);
    			transition_out(if_block1);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, slide, { delay: 100, duration: 500 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block0) {
    				if_block0.d();
    			}

    			if (detaching && div0_transition) div0_transition.end();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching && div1_transition) div1_transition.end();
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

    function active(button, typePanel, surfaceArray) {
    	button.classList.toggle("non-active");
    	let buttonArr = document.querySelectorAll("button");

    	surfaceArray.forEach(item => {
    		if (item.type !== typePanel.type) {
    			item.visible = false;

    			buttonArr.forEach(butt => {
    				if (button !== butt) {
    					butt.classList.add("non-active");
    				}
    			});
    		}
    	});
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Modal', slots, []);
    	let { globalSurface } = $$props;

    	//  dispatch event target panel
    	const dispatch = createEventDispatcher();

    	const panelChoice = url => {
    		dispatch("panelChoice", url);
    	};

    	//  Array of object`s panels for walls
    	let wallArray = [
    		{
    			type: "simpleBrick",
    			visible: false,
    			title: "Кирпич",
    			imgArr: filenamesBrick
    		},
    		{
    			type: "decBrick",
    			visible: false,
    			title: "Декоративный кирпич",
    			imgArr: filenamesDecBrick
    		},
    		{
    			type: "ekBrick",
    			visible: false,
    			title: "Екатеринославский кирпич",
    			imgArr: filenamesEk
    		},
    		{
    			type: "kladka",
    			visible: false,
    			title: "Кладка",
    			imgArr: filenamesKladka
    		},
    		{
    			type: "mramor",
    			visible: false,
    			title: "Мрамор",
    			imgArr: filenamesMramor
    		},
    		{
    			type: "bambook",
    			visible: false,
    			title: "Бамбук",
    			imgArr: filenamesBambook
    		},
    		{
    			type: "stone",
    			visible: false,
    			title: "Камень",
    			imgArr: filenamesStone
    		},
    		{
    			type: "wood",
    			visible: false,
    			title: "Дерево",
    			imgArr: filenamesWood
    		},
    		{
    			type: "vintage",
    			visible: false,
    			title: "Винтаж",
    			imgArr: filenamesVintage
    		},
    		{
    			type: "ceil",
    			visible: false,
    			title: "Потолочные",
    			imgArr: filenamesCeil
    		},
    		{
    			type: "vinil",
    			visible: false,
    			title: "Виниловая плитка",
    			imgArr: filenamesVinilWall
    		}
    	];

    	// Array of object`s items for floor
    	let floorArray = [
    		{
    			type: "pazzles",
    			visible: false,
    			title: "Пол-пазл",
    			imgArr: filenamesPuzzles
    		},
    		{
    			type: "vinil",
    			visible: false,
    			title: "Виниловая плитка",
    			imgArr: filenamesVinil
    		}
    	];

    	$$self.$$.on_mount.push(function () {
    		if (globalSurface === undefined && !('globalSurface' in $$props || $$self.$$.bound[$$self.$$.props['globalSurface']])) {
    			console.warn("<Modal> was created without expected prop 'globalSurface'");
    		}
    	});

    	const writable_props = ['globalSurface'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (item, each_value_6, index, e) => {
    		active(e.target, item, wallArray);
    		$$invalidate(1, each_value_6[index].visible = !item.visible, wallArray);
    	};

    	const click_handler_1 = (item, each_value_7, index, e) => {
    		active(e.target, item, floorArray);
    		$$invalidate(2, each_value_7[index].visible = !item.visible, floorArray);
    	};

    	const click_handler_2 = (item, each_value_8, index, e) => {
    		active(e.target, item, wallArray);
    		$$invalidate(1, each_value_8[index].visible = !item.visible, wallArray);
    	};

    	const click_handler_3 = filename => {
    		panelChoice(filename.url);
    	};

    	const click_handler_4 = filename => {
    		panelChoice(filename.url);
    	};

    	const click_handler_5 = filename => {
    		panelChoice(filename.url);
    	};

    	$$self.$$set = $$props => {
    		if ('globalSurface' in $$props) $$invalidate(0, globalSurface = $$props.globalSurface);
    	};

    	$$self.$capture_state = () => ({
    		slide,
    		scale,
    		linear: identity,
    		createEventDispatcher,
    		filenamesBrick,
    		filenamesDecBrick,
    		filenamesBambook,
    		filenamesEk,
    		filenamesKladka,
    		filenamesMramor,
    		filenamesStone,
    		filenamesWood,
    		filenamesVintage,
    		filenamesCeil,
    		filenamesVinilWall,
    		filenamesPuzzles,
    		filenamesVinil,
    		filenamesPuzzlesButton,
    		globalSurface,
    		active,
    		dispatch,
    		panelChoice,
    		wallArray,
    		floorArray
    	});

    	$$self.$inject_state = $$props => {
    		if ('globalSurface' in $$props) $$invalidate(0, globalSurface = $$props.globalSurface);
    		if ('wallArray' in $$props) $$invalidate(1, wallArray = $$props.wallArray);
    		if ('floorArray' in $$props) $$invalidate(2, floorArray = $$props.floorArray);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		globalSurface,
    		wallArray,
    		floorArray,
    		panelChoice,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { globalSurface: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get globalSurface() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set globalSurface(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Buttonall.svelte generated by Svelte v3.52.0 */
    const file$3 = "src\\components\\Buttonall.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*buttonText*/ ctx[0]);
    			attr_dev(button, "class", "btn-header non-activeapp svelte-mril56");
    			add_location(button, file$3, 10, 0, 219);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*buttonText*/ 1) set_data_dev(t, /*buttonText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Buttonall', slots, []);
    	let { buttonText = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const fillAll = btn => {
    		dispatch("fillAll", btn);
    	};

    	const writable_props = ['buttonText'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Buttonall> was created with unknown prop '${key}'`);
    	});

    	const click_handler = function (e) {
    		fillAll(this);
    	};

    	$$self.$$set = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		buttonText,
    		dispatch,
    		fillAll
    	});

    	$$self.$inject_state = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [buttonText, fillAll, click_handler];
    }

    class Buttonall extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { buttonText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttonall",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get buttonText() {
    		throw new Error("<Buttonall>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonText(value) {
    		throw new Error("<Buttonall>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Buttonone.svelte generated by Svelte v3.52.0 */
    const file$2 = "src\\components\\Buttonone.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*buttonText*/ ctx[0]);
    			attr_dev(button, "class", "btn-header non-activeapp svelte-pgxy0c");
    			add_location(button, file$2, 10, 0, 221);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*buttonText*/ 1) set_data_dev(t, /*buttonText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Buttonone', slots, []);
    	let { buttonText = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const onePanel = btn => {
    		dispatch("onePanel", btn);
    	};

    	const writable_props = ['buttonText'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Buttonone> was created with unknown prop '${key}'`);
    	});

    	const click_handler = function (e) {
    		onePanel(this);
    	};

    	$$self.$$set = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		buttonText,
    		dispatch,
    		onePanel
    	});

    	$$self.$inject_state = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [buttonText, onePanel, click_handler];
    }

    class Buttonone extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { buttonText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttonone",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get buttonText() {
    		throw new Error("<Buttonone>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonText(value) {
    		throw new Error("<Buttonone>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Buttonclear.svelte generated by Svelte v3.52.0 */
    const file$1 = "src\\components\\Buttonclear.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*buttonText*/ ctx[0]);
    			attr_dev(button, "class", "btn-header non-activeapp svelte-f7sq1n");
    			add_location(button, file$1, 10, 0, 221);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*buttonText*/ 1) set_data_dev(t, /*buttonText*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Buttonclear', slots, []);
    	let { buttonText = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const clearAll = btn => {
    		dispatch("clearAll", btn);
    	};

    	const writable_props = ['buttonText'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Buttonclear> was created with unknown prop '${key}'`);
    	});

    	const click_handler = function (e) {
    		clearAll(this);
    	};

    	$$self.$$set = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		buttonText,
    		dispatch,
    		clearAll
    	});

    	$$self.$inject_state = $$props => {
    		if ('buttonText' in $$props) $$invalidate(0, buttonText = $$props.buttonText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [buttonText, clearAll, click_handler];
    }

    class Buttonclear extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { buttonText: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Buttonclear",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get buttonText() {
    		throw new Error("<Buttonclear>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonText(value) {
    		throw new Error("<Buttonclear>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.52.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (342:2) {#if modalVisible}
    function create_if_block(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: { globalSurface: /*globalSurface*/ ctx[2] },
    			$$inline: true
    		});

    	modal.$on("panelChoice", /*panelChoice*/ ctx[3]);

    	const block = {
    		c: function create() {
    			create_component(modal.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const modal_changes = {};
    			if (dirty & /*globalSurface*/ 4) modal_changes.globalSurface = /*globalSurface*/ ctx[2];
    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(342:2) {#if modalVisible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div11;
    	let header;
    	let div1;
    	let h40;
    	let t1;
    	let div0;
    	let buttonall0;
    	let t2;
    	let buttonclear0;
    	let t3;
    	let buttonone0;
    	let t4;
    	let div3;
    	let h41;
    	let t6;
    	let div2;
    	let buttonall1;
    	let t7;
    	let buttonclear1;
    	let t8;
    	let buttonone1;
    	let t9;
    	let div5;
    	let h42;
    	let t11;
    	let div4;
    	let buttonall2;
    	let t12;
    	let buttonclear2;
    	let t13;
    	let buttonone2;
    	let t14;
    	let div10;
    	let div6;
    	let t15;
    	let div7;
    	let t16;
    	let div8;
    	let t17;
    	let div9;
    	let t18;
    	let current;

    	buttonall0 = new Buttonall({
    			props: { buttonText: "На все стены" },
    			$$inline: true
    		});

    	buttonall0.$on("fillAll", /*fillAll_handler*/ ctx[5]);

    	buttonclear0 = new Buttonclear({
    			props: { buttonText: "Очистить стены" },
    			$$inline: true
    		});

    	buttonclear0.$on("clearAll", /*clearAll_handler*/ ctx[6]);

    	buttonone0 = new Buttonone({
    			props: { buttonText: "Одна панель" },
    			$$inline: true
    		});

    	buttonone0.$on("onePanel", /*onePanel_handler*/ ctx[7]);

    	buttonall1 = new Buttonall({
    			props: { buttonText: "На весь потолок" },
    			$$inline: true
    		});

    	buttonall1.$on("fillAll", /*fillAll_handler_1*/ ctx[8]);

    	buttonclear1 = new Buttonclear({
    			props: { buttonText: "Очистить потолок" },
    			$$inline: true
    		});

    	buttonclear1.$on("clearAll", /*clearAll_handler_1*/ ctx[9]);

    	buttonone1 = new Buttonone({
    			props: { buttonText: "Одна панель" },
    			$$inline: true
    		});

    	buttonone1.$on("onePanel", /*onePanel_handler_1*/ ctx[10]);

    	buttonall2 = new Buttonall({
    			props: { buttonText: "На весь пол" },
    			$$inline: true
    		});

    	buttonall2.$on("fillAll", /*fillAll_handler_2*/ ctx[11]);

    	buttonclear2 = new Buttonclear({
    			props: { buttonText: "Очистить пол" },
    			$$inline: true
    		});

    	buttonclear2.$on("clearAll", /*clearAll_handler_2*/ ctx[12]);

    	buttonone2 = new Buttonone({
    			props: { buttonText: "Одна плита" },
    			$$inline: true
    		});

    	buttonone2.$on("onePanel", /*onePanel_handler_2*/ ctx[13]);
    	let if_block = /*modalVisible*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			header = element("header");
    			div1 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Стены";
    			t1 = space();
    			div0 = element("div");
    			create_component(buttonall0.$$.fragment);
    			t2 = space();
    			create_component(buttonclear0.$$.fragment);
    			t3 = space();
    			create_component(buttonone0.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Потолок";
    			t6 = space();
    			div2 = element("div");
    			create_component(buttonall1.$$.fragment);
    			t7 = space();
    			create_component(buttonclear1.$$.fragment);
    			t8 = space();
    			create_component(buttonone1.$$.fragment);
    			t9 = space();
    			div5 = element("div");
    			h42 = element("h4");
    			h42.textContent = "Полы";
    			t11 = space();
    			div4 = element("div");
    			create_component(buttonall2.$$.fragment);
    			t12 = space();
    			create_component(buttonclear2.$$.fragment);
    			t13 = space();
    			create_component(buttonone2.$$.fragment);
    			t14 = space();
    			div10 = element("div");
    			div6 = element("div");
    			t15 = space();
    			div7 = element("div");
    			t16 = space();
    			div8 = element("div");
    			t17 = space();
    			div9 = element("div");
    			t18 = space();
    			if (if_block) if_block.c();
    			attr_dev(h40, "class", "svelte-1lh6obx");
    			add_location(h40, file, 231, 6, 6499);
    			attr_dev(div0, "class", "buttonWrapper svelte-1lh6obx");
    			add_location(div0, file, 232, 6, 6521);
    			attr_dev(div1, "class", "wallHeader svelte-1lh6obx");
    			add_location(div1, file, 230, 4, 6467);
    			attr_dev(h41, "class", "svelte-1lh6obx");
    			add_location(h41, file, 266, 6, 7414);
    			attr_dev(div2, "class", "buttonWrapper svelte-1lh6obx");
    			add_location(div2, file, 267, 6, 7438);
    			attr_dev(div3, "class", "ceilHeader svelte-1lh6obx");
    			add_location(div3, file, 265, 4, 7382);
    			attr_dev(h42, "class", "svelte-1lh6obx");
    			add_location(h42, file, 301, 6, 8344);
    			attr_dev(div4, "class", "buttonWrapper svelte-1lh6obx");
    			add_location(div4, file, 302, 6, 8365);
    			attr_dev(div5, "class", "floorHeader svelte-1lh6obx");
    			add_location(div5, file, 300, 4, 8311);
    			attr_dev(header, "class", "svelte-1lh6obx");
    			add_location(header, file, 229, 2, 6453);
    			attr_dev(div6, "class", "ceil svelte-1lh6obx");
    			add_location(div6, file, 335, 4, 9224);
    			attr_dev(div7, "class", "wall wall1 svelte-1lh6obx");
    			add_location(div7, file, 336, 4, 9250);
    			attr_dev(div8, "class", "wall wall2 svelte-1lh6obx");
    			add_location(div8, file, 337, 4, 9282);
    			attr_dev(div9, "class", "floor svelte-1lh6obx");
    			add_location(div9, file, 338, 4, 9314);
    			attr_dev(div10, "class", "roomContainer svelte-1lh6obx");
    			add_location(div10, file, 334, 2, 9191);
    			attr_dev(div11, "class", "container svelte-1lh6obx");
    			add_location(div11, file, 228, 0, 6426);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, header);
    			append_dev(header, div1);
    			append_dev(div1, h40);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(buttonall0, div0, null);
    			append_dev(div0, t2);
    			mount_component(buttonclear0, div0, null);
    			append_dev(div0, t3);
    			mount_component(buttonone0, div0, null);
    			append_dev(header, t4);
    			append_dev(header, div3);
    			append_dev(div3, h41);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			mount_component(buttonall1, div2, null);
    			append_dev(div2, t7);
    			mount_component(buttonclear1, div2, null);
    			append_dev(div2, t8);
    			mount_component(buttonone1, div2, null);
    			append_dev(header, t9);
    			append_dev(header, div5);
    			append_dev(div5, h42);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			mount_component(buttonall2, div4, null);
    			append_dev(div4, t12);
    			mount_component(buttonclear2, div4, null);
    			append_dev(div4, t13);
    			mount_component(buttonone2, div4, null);
    			append_dev(div11, t14);
    			append_dev(div11, div10);
    			append_dev(div10, div6);
    			append_dev(div10, t15);
    			append_dev(div10, div7);
    			append_dev(div10, t16);
    			append_dev(div10, div8);
    			append_dev(div10, t17);
    			append_dev(div10, div9);
    			append_dev(div11, t18);
    			if (if_block) if_block.m(div11, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*modalVisible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*modalVisible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div11, null);
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
    			transition_in(buttonall0.$$.fragment, local);
    			transition_in(buttonclear0.$$.fragment, local);
    			transition_in(buttonone0.$$.fragment, local);
    			transition_in(buttonall1.$$.fragment, local);
    			transition_in(buttonclear1.$$.fragment, local);
    			transition_in(buttonone1.$$.fragment, local);
    			transition_in(buttonall2.$$.fragment, local);
    			transition_in(buttonclear2.$$.fragment, local);
    			transition_in(buttonone2.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buttonall0.$$.fragment, local);
    			transition_out(buttonclear0.$$.fragment, local);
    			transition_out(buttonone0.$$.fragment, local);
    			transition_out(buttonall1.$$.fragment, local);
    			transition_out(buttonclear1.$$.fragment, local);
    			transition_out(buttonone1.$$.fragment, local);
    			transition_out(buttonall2.$$.fragment, local);
    			transition_out(buttonclear2.$$.fragment, local);
    			transition_out(buttonone2.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			destroy_component(buttonall0);
    			destroy_component(buttonclear0);
    			destroy_component(buttonone0);
    			destroy_component(buttonall1);
    			destroy_component(buttonclear1);
    			destroy_component(buttonone1);
    			destroy_component(buttonall2);
    			destroy_component(buttonclear2);
    			destroy_component(buttonone2);
    			if (if_block) if_block.d();
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

    function walls() {
    	return document.querySelectorAll(".wall");
    }

    function floor() {
    	return document.querySelectorAll(".floor");
    }

    function ceil() {
    	return document.querySelectorAll(".ceil");
    }

    // Get surface type panels array
    function allPanels() {
    	return document.querySelectorAll(".allPanels");
    }

    function panel() {
    	return document.querySelectorAll(".panel");
    }

    function panelFloor() {
    	return document.querySelectorAll(".panel-floor");
    }

    function panelCeil() {
    	return document.querySelectorAll(".panel-ceil");
    }

    // Calculating panel size
    function panelSize(surface) {
    	return surface[0].offsetHeight / 4 - 0.4;
    }

    //----------------------------------------------
    function removePanels(surface) {
    	surface.forEach(item => {
    		item.remove();
    	});
    }

    function styleCommonPanels(toCreate) {
    	toCreate.style.width = panelSize(walls()) + "px";
    	toCreate.style.height = panelSize(walls()) + "px";
    	toCreate.style.backgroundSize = "contain";
    	toCreate.classList.add("allPanels");

    	allPanels().forEach(item => {
    		item.style.transition = "1.5s";
    		let counter = 2;

    		item.oncontextmenu = function (e) {
    			e.preventDefault();

    			if (counter % 2 == 0) {
    				console.log("menu");
    				item.style.transform = "rotate(90deg)";
    			} else {
    				item.style.transform = "rotate(0deg)";
    			}

    			counter++;
    		};
    	});
    }

    function initWallPanelAdd() {
    	walls().forEach(item => {
    		for (let i = 0; i < 165; i++) {
    			let panel = document.createElement("div");
    			styleCommonPanels(panel);
    			panel.classList.add("panel");
    			item.append(panel);
    		}
    	});
    }

    function initFloorPanelAdd() {
    	floor().forEach(item => {
    		for (let i = 0; i < 165; i++) {
    			let panel = document.createElement("div");
    			styleCommonPanels(panel);
    			panel.classList.add("panel-floor");
    			item.append(panel);
    		}
    	});
    }

    function initCeilPanelAdd() {
    	ceil().forEach(item => {
    		for (let i = 0; i < 165; i++) {
    			let panel = document.createElement("div");
    			styleCommonPanels(panel);
    			panel.classList.add("panel-ceil");
    			item.append(panel);
    		}
    	});
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let modalVisible = false;
    	let fillAllFlag = true;
    	let globalSurface;
    	let btnHeaderArr;
    	let url = "";
    	let urlWall = "./build/textures/";
    	let urlFloor = "./build/textures/floor/";

    	// ----------------------------------------------
    	function panelChoice(event) {
    		url = event.detail;

    		if (fillAllFlag && globalSurface == "wall") {
    			fillAll(walls());
    			url = event.detail;
    		} else if (fillAllFlag && globalSurface == "floor") {
    			fillAll(floor());
    			url = event.detail;
    		} else if (!fillAllFlag && globalSurface == "wall") {
    			walls().forEach(item => {
    				item.onclick = function (e) {
    					url = urlWall + event.detail;
    					e.target.style.backgroundImage = `url(${url})`;
    				};
    			});
    		} else if (!fillAllFlag && globalSurface == "floor") {
    			floor().forEach(item => {
    				item.onclick = function (e) {
    					url = urlFloor + event.detail;
    					e.target.style.backgroundImage = `url(${url})`;
    				};
    			});
    		} else //------------------------------For ceil
    		if (fillAllFlag && globalSurface == "ceil") {
    			url = event.detail;
    			fillAll(ceil());
    		} else if (!fillAllFlag && globalSurface == "ceil") {
    			ceil().forEach(item => {
    				item.onclick = function (e) {
    					url = urlWall + event.detail;
    					e.target.style.backgroundImage = `url(${url})`;
    				};
    			});
    		}

    		$$invalidate(0, modalVisible = false);
    		$$invalidate(1, fillAllFlag = false);
    	}

    	// --------------------------------------------
    	function fillAll(surface) {
    		if (globalSurface == "wall") {
    			removePanels(panel());
    		} else if (globalSurface == "floor") {
    			removePanels(panelFloor());
    		} else if (globalSurface == "ceil") {
    			removePanels(panelCeil());
    		}

    		if (globalSurface == "wall") {
    			addPanel(surface);
    		} else if (globalSurface == "floor") {
    			addPanel(surface);
    		} else if (globalSurface == "ceil") {
    			addPanel(surface);
    		}
    	}

    	function addPanel(wallsArg) {
    		wallsArg.forEach(item => {
    			for (let i = 0; i < 165; i++) {
    				let panel = document.createElement("div");
    				styleCommonPanels(panel);

    				if (globalSurface == "wall") {
    					panel.classList.add("panel");
    					panel.style.backgroundImage = `url(${urlWall}${url}`;
    					item.append(panel);
    				} else if (globalSurface == "floor") {
    					panel.classList.add("panel-floor");
    					panel.style.backgroundImage = `url(${urlFloor}${url}`;
    					item.append(panel);
    				} else if (globalSurface == "ceil") {
    					panel.classList.add("panel-ceil");
    					panel.style.backgroundImage = `url(${urlWall}${url}`;
    					item.append(panel);
    				}
    			}
    		});
    	}

    	// ?hlefje
    	function btnHeaderActive(event) {
    		setTimeout(
    			function () {
    				if (modalVisible) {
    					event.classList.remove("non-activeapp");
    				} else {
    					event.classList.add("non-activeapp");
    				}

    				btnHeaderArr.forEach(item => {
    					if (item != event) {
    						item.classList.add("non-activeapp");
    					}
    				});
    			},
    			10
    		);
    	}

    	//_______________________________
    	onMount(() => {
    		btnHeaderArr = document.querySelectorAll(".btn-header");

    		//----- initial add panels
    		initWallPanelAdd();

    		initFloorPanelAdd();
    		initCeilPanelAdd();

    		//----------------------
    		window.onresize = function () {
    			allPanels().forEach(item => {
    				item.style.width = panelSize(walls()) + "px";
    				item.style.height = panelSize(walls()) + "px";
    			});
    		};
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const fillAll_handler = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "wall");
    		$$invalidate(1, fillAllFlag = true);
    		btnHeaderActive(event.detail);
    	};

    	const clearAll_handler = event => {
    		removePanels(panel());
    		initWallPanelAdd();
    	};

    	const onePanel_handler = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "wall");
    		$$invalidate(1, fillAllFlag = false);
    		btnHeaderActive(event.detail);
    	};

    	const fillAll_handler_1 = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "ceil");
    		$$invalidate(1, fillAllFlag = true);
    		btnHeaderActive(event.detail);
    	};

    	const clearAll_handler_1 = event => {
    		removePanels(panelCeil());
    		initCeilPanelAdd();
    	};

    	const onePanel_handler_1 = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "ceil");
    		$$invalidate(1, fillAllFlag = false);
    		btnHeaderActive(event.detail);
    	};

    	const fillAll_handler_2 = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "floor");
    		$$invalidate(1, fillAllFlag = true);
    		btnHeaderActive(event.detail);
    	};

    	const clearAll_handler_2 = event => {
    		removePanels(panelFloor());
    		initFloorPanelAdd();
    	};

    	const onePanel_handler_2 = event => {
    		$$invalidate(0, modalVisible = !modalVisible);
    		$$invalidate(2, globalSurface = "floor");
    		$$invalidate(1, fillAllFlag = false);
    		btnHeaderActive(event.detail);
    	};

    	$$self.$capture_state = () => ({
    		Modal,
    		onMount,
    		Buttonall,
    		Buttonone,
    		Buttonclear,
    		modalVisible,
    		fillAllFlag,
    		globalSurface,
    		btnHeaderArr,
    		url,
    		urlWall,
    		urlFloor,
    		walls,
    		floor,
    		ceil,
    		allPanels,
    		panel,
    		panelFloor,
    		panelCeil,
    		panelSize,
    		panelChoice,
    		fillAll,
    		removePanels,
    		styleCommonPanels,
    		addPanel,
    		btnHeaderActive,
    		initWallPanelAdd,
    		initFloorPanelAdd,
    		initCeilPanelAdd
    	});

    	$$self.$inject_state = $$props => {
    		if ('modalVisible' in $$props) $$invalidate(0, modalVisible = $$props.modalVisible);
    		if ('fillAllFlag' in $$props) $$invalidate(1, fillAllFlag = $$props.fillAllFlag);
    		if ('globalSurface' in $$props) $$invalidate(2, globalSurface = $$props.globalSurface);
    		if ('btnHeaderArr' in $$props) btnHeaderArr = $$props.btnHeaderArr;
    		if ('url' in $$props) url = $$props.url;
    		if ('urlWall' in $$props) urlWall = $$props.urlWall;
    		if ('urlFloor' in $$props) urlFloor = $$props.urlFloor;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		modalVisible,
    		fillAllFlag,
    		globalSurface,
    		panelChoice,
    		btnHeaderActive,
    		fillAll_handler,
    		clearAll_handler,
    		onePanel_handler,
    		fillAll_handler_1,
    		clearAll_handler_1,
    		onePanel_handler_1,
    		fillAll_handler_2,
    		clearAll_handler_2,
    		onePanel_handler_2
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
