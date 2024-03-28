/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Ne = Symbol("Comlink.proxy"),
    _n = Symbol("Comlink.endpoint"),
    On = Symbol("Comlink.releaseProxy"),
    Kt = Symbol("Comlink.finalizer"),
    Nt = Symbol("Comlink.thrown"),
    Re = t => typeof t == "object" && t !== null || typeof t == "function",
    kn = {
        canHandle: t => Re(t) && t[Ne],
        serialize(t) {
            const {
                port1: e,
                port2: n
            } = new MessageChannel;
            return fe(t, e), [n, [n]]
        },
        deserialize(t) {
            return t.start(), Nn(t)
        }
    },
    Tn = {
        canHandle: t => Re(t) && Nt in t,
        serialize({
            value: t
        }) {
            let e;
            return t instanceof Error ? e = {
                isError: !0,
                value: {
                    message: t.message,
                    name: t.name,
                    stack: t.stack
                }
            } : e = {
                isError: !1,
                value: t
            }, [e, []]
        },
        deserialize(t) {
            throw t.isError ? Object.assign(new Error(t.value.message), t.value) : t.value
        }
    },
    Ce = new Map([
        ["proxy", kn],
        ["throw", Tn]
    ]);

function Sn(t, e) {
    for (const n of t)
        if (e === n || n === "*" || n instanceof RegExp && n.test(e)) return !0;
    return !1
}

function fe(t, e = globalThis, n = ["*"]) {
    e.addEventListener("message", function o(r) {
        if (!r || !r.data) return;
        if (!Sn(n, r.origin)) {
            console.warn(`Invalid origin '${r.origin}' for comlink proxy`);
            return
        }
        const {
            id: s,
            type: a,
            path: u
        } = Object.assign({
            path: []
        }, r.data), l = (r.data.argumentList || []).map(rt);
        let p;
        try {
            const f = u.slice(0, -1).reduce((g, v) => g[v], t),
                d = u.reduce((g, v) => g[v], t);
            switch (a) {
                case "GET":
                    p = d;
                    break;
                case "SET":
                    f[u.slice(-1)[0]] = rt(r.data.value), p = !0;
                    break;
                case "APPLY":
                    p = d.apply(f, l);
                    break;
                case "CONSTRUCT":
                    {
                        const g = new d(...l);p = In(g)
                    }
                    break;
                case "ENDPOINT":
                    {
                        const {
                            port1: g,
                            port2: v
                        } = new MessageChannel;fe(t, v),
                        p = $n(g, [g])
                    }
                    break;
                case "RELEASE":
                    p = void 0;
                    break;
                default:
                    return
            }
        } catch (f) {
            p = {
                value: f,
                [Nt]: 0
            }
        }
        Promise.resolve(p).catch(f => ({
            value: f,
            [Nt]: 0
        })).then(f => {
            const [d, g] = At(f);
            e.postMessage(Object.assign(Object.assign({}, d), {
                id: s
            }), g), a === "RELEASE" && (e.removeEventListener("message", o), Ae(e), Kt in t && typeof t[Kt] == "function" && t[Kt]())
        }).catch(f => {
            const [d, g] = At({
                value: new TypeError("Unserializable return value"),
                [Nt]: 0
            });
            e.postMessage(Object.assign(Object.assign({}, d), {
                id: s
            }), g)
        })
    }), e.start && e.start()
}

function Pn(t) {
    return t.constructor.name === "MessagePort"
}

function Ae(t) {
    Pn(t) && t.close()
}

function Nn(t, e) {
    return ne(t, [], e)
}

function St(t) {
    if (t) throw new Error("Proxy has been released and is not useable")
}

function $e(t) {
    return ht(t, {
        type: "RELEASE"
    }).then(() => {
        Ae(t)
    })
}
const Rt = new WeakMap,
    Ct = "FinalizationRegistry" in globalThis && new FinalizationRegistry(t => {
        const e = (Rt.get(t) || 0) - 1;
        Rt.set(t, e), e === 0 && $e(t)
    });

function Rn(t, e) {
    const n = (Rt.get(e) || 0) + 1;
    Rt.set(e, n), Ct && Ct.register(t, e, t)
}

function Cn(t) {
    Ct && Ct.unregister(t)
}

function ne(t, e = [], n = function() {}) {
    let o = !1;
    const r = new Proxy(n, {
        get(s, a) {
            if (St(o), a === On) return () => {
                Cn(r), $e(t), o = !0
            };
            if (a === "then") {
                if (e.length === 0) return {
                    then: () => r
                };
                const u = ht(t, {
                    type: "GET",
                    path: e.map(l => l.toString())
                }).then(rt);
                return u.then.bind(u)
            }
            return ne(t, [...e, a])
        },
        set(s, a, u) {
            St(o);
            const [l, p] = At(u);
            return ht(t, {
                type: "SET",
                path: [...e, a].map(f => f.toString()),
                value: l
            }, p).then(rt)
        },
        apply(s, a, u) {
            St(o);
            const l = e[e.length - 1];
            if (l === _n) return ht(t, {
                type: "ENDPOINT"
            }).then(rt);
            if (l === "bind") return ne(t, e.slice(0, -1));
            const [p, f] = Me(u);
            return ht(t, {
                type: "APPLY",
                path: e.map(d => d.toString()),
                argumentList: p
            }, f).then(rt)
        },
        construct(s, a) {
            St(o);
            const [u, l] = Me(a);
            return ht(t, {
                type: "CONSTRUCT",
                path: e.map(p => p.toString()),
                argumentList: u
            }, l).then(rt)
        }
    });
    return Rn(r, t), r
}

function An(t) {
    return Array.prototype.concat.apply([], t)
}

function Me(t) {
    const e = t.map(At);
    return [e.map(n => n[0]), An(e.map(n => n[1]))]
}
const Ie = new WeakMap;

function $n(t, e) {
    return Ie.set(t, e), t
}

function In(t) {
    return Object.assign(t, {
        [Ne]: !0
    })
}

function At(t) {
    for (const [e, n] of Ce)
        if (n.canHandle(t)) {
            const [o, r] = n.serialize(t);
            return [{
                type: "HANDLER",
                name: e,
                value: o
            }, r]
        }
    return [{
        type: "RAW",
        value: t
    }, Ie.get(t) || []]
}

function rt(t) {
    switch (t.type) {
        case "HANDLER":
            return Ce.get(t.name).deserialize(t.value);
        case "RAW":
            return t.value
    }
}

function ht(t, e, n) {
    return new Promise(o => {
        const r = jn();
        t.addEventListener("message", function s(a) {
            !a.data || !a.data.id || a.data.id !== r || (t.removeEventListener("message", s), o(a.data))
        }), t.start && t.start(), t.postMessage(Object.assign({
            id: r
        }, e), n)
    })
}

function jn() {
    return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-")
}
var zn = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
    re = {},
    Ln = {
        get exports() {
            return re
        },
        set exports(t) {
            re = t
        }
    };
(function(t) {
    (function(e, n) {
        t.exports ? t.exports = n() : e.moo = n()
    })(zn, function() {
        var e = Object.prototype.hasOwnProperty,
            n = Object.prototype.toString,
            o = typeof new RegExp().sticky == "boolean";

        function r(c) {
            return c && n.call(c) === "[object RegExp]"
        }

        function s(c) {
            return c && typeof c == "object" && !r(c) && !Array.isArray(c)
        }

        function a(c) {
            return c.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
        }

        function u(c) {
            var h = new RegExp("|" + c);
            return h.exec("").length - 1
        }

        function l(c) {
            return "(" + c + ")"
        }

        function p(c) {
            if (!c.length) return "(?!)";
            var h = c.map(function(y) {
                return "(?:" + y + ")"
            }).join("|");
            return "(?:" + h + ")"
        }

        function f(c) {
            if (typeof c == "string") return "(?:" + a(c) + ")";
            if (r(c)) {
                if (c.ignoreCase) throw new Error("RegExp /i flag not allowed");
                if (c.global) throw new Error("RegExp /g flag is implied");
                if (c.sticky) throw new Error("RegExp /y flag is implied");
                if (c.multiline) throw new Error("RegExp /m flag is implied");
                return c.source
            } else throw new Error("Not a pattern: " + c)
        }

        function d(c, h) {
            return c.length > h ? c : Array(h - c.length + 1).join(" ") + c
        }

        function g(c, h) {
            for (var y = c.length, m = 0;;) {
                var M = c.lastIndexOf(`
`, y - 1);
                if (M === -1 || (m++, y = M, m === h) || y === 0) break
            }
            var b = m < h ? 0 : y + 1;
            return c.substring(b).split(`
`)
        }

        function v(c) {
            for (var h = Object.getOwnPropertyNames(c), y = [], m = 0; m < h.length; m++) {
                var M = h[m],
                    b = c[M],
                    O = [].concat(b);
                if (M === "include") {
                    for (var A = 0; A < O.length; A++) y.push({
                        include: O[A]
                    });
                    continue
                }
                var P = [];
                O.forEach(function(w) {
                    s(w) ? (P.length && y.push(_(M, P)), y.push(_(M, w)), P = []) : P.push(w)
                }), P.length && y.push(_(M, P))
            }
            return y
        }

        function x(c) {
            for (var h = [], y = 0; y < c.length; y++) {
                var m = c[y];
                if (m.include) {
                    for (var M = [].concat(m.include), b = 0; b < M.length; b++) h.push({
                        include: M[b]
                    });
                    continue
                }
                if (!m.type) throw new Error("Rule has no type: " + JSON.stringify(m));
                h.push(_(m.type, m))
            }
            return h
        }

        function _(c, h) {
            if (s(h) || (h = {
                    match: h
                }), h.include) throw new Error("Matching rules cannot also include states");
            var y = {
                defaultType: c,
                lineBreaks: !!h.error || !!h.fallback,
                pop: !1,
                next: null,
                push: null,
                error: !1,
                fallback: !1,
                value: null,
                type: null,
                shouldThrow: !1
            };
            for (var m in h) e.call(h, m) && (y[m] = h[m]);
            if (typeof y.type == "string" && c !== y.type) throw new Error("Type transform cannot be a string (type '" + y.type + "' for token '" + c + "')");
            var M = y.match;
            return y.match = Array.isArray(M) ? M : M ? [M] : [], y.match.sort(function(b, O) {
                return r(b) && r(O) ? 0 : r(O) ? -1 : r(b) ? 1 : O.length - b.length
            }), y
        }

        function N(c) {
            return Array.isArray(c) ? x(c) : v(c)
        }
        var R = _("error", {
            lineBreaks: !0,
            shouldThrow: !0
        });

        function k(c, h) {
            for (var y = null, m = Object.create(null), M = !0, b = null, O = [], A = [], P = 0; P < c.length; P++) c[P].fallback && (M = !1);
            for (var P = 0; P < c.length; P++) {
                var w = c[P];
                if (w.include) throw new Error("Inheritance is not allowed in stateless lexers");
                if (w.error || w.fallback) {
                    if (y) throw !w.fallback == !y.fallback ? new Error("Multiple " + (w.fallback ? "fallback" : "error") + " rules not allowed (for token '" + w.defaultType + "')") : new Error("fallback and error are mutually exclusive (for token '" + w.defaultType + "')");
                    y = w
                }
                var z = w.match.slice();
                if (M)
                    for (; z.length && typeof z[0] == "string" && z[0].length === 1;) {
                        var lt = z.shift();
                        m[lt.charCodeAt(0)] = w
                    }
                if (w.pop || w.push || w.next) {
                    if (!h) throw new Error("State-switching options are not allowed in stateless lexers (for token '" + w.defaultType + "')");
                    if (w.fallback) throw new Error("State-switching options are not allowed on fallback tokens (for token '" + w.defaultType + "')")
                }
                if (z.length !== 0) {
                    M = !1, O.push(w);
                    for (var B = 0; B < z.length; B++) {
                        var et = z[B];
                        if (r(et)) {
                            if (b === null) b = et.unicode;
                            else if (b !== et.unicode && w.fallback === !1) throw new Error("If one rule is /u then all must be")
                        }
                    }
                    var pt = p(z.map(f)),
                        q = new RegExp(pt);
                    if (q.test("")) throw new Error("RegExp matches empty string: " + q);
                    var wt = u(pt);
                    if (wt > 0) throw new Error("RegExp has capture groups: " + q + `
Use (?: … ) instead`);
                    if (!w.lineBreaks && q.test(`
`)) throw new Error("Rule should declare lineBreaks: " + q);
                    A.push(l(pt))
                }
            }
            var ft = y && y.fallback,
                Et = o && !ft ? "ym" : "gm",
                Tt = o || ft ? "" : "|";
            b === !0 && (Et += "u");
            var Mn = new RegExp(p(A) + Tt, Et);
            return {
                regexp: Mn,
                groups: O,
                fast: m,
                error: y || R
            }
        }

        function E(c) {
            var h = k(N(c));
            return new $({
                start: h
            }, "start")
        }

        function ct(c, h, y) {
            var m = c && (c.push || c.next);
            if (m && !y[m]) throw new Error("Missing state '" + m + "' (in token '" + c.defaultType + "' of state '" + h + "')");
            if (c && c.pop && +c.pop != 1) throw new Error("pop must be 1 (in token '" + c.defaultType + "' of state '" + h + "')")
        }

        function bt(c, h) {
            var y = c.$all ? N(c.$all) : [];
            delete c.$all;
            var m = Object.getOwnPropertyNames(c);
            h || (h = m[0]);
            for (var M = Object.create(null), b = 0; b < m.length; b++) {
                var O = m[b];
                M[O] = N(c[O]).concat(y)
            }
            for (var b = 0; b < m.length; b++)
                for (var O = m[b], A = M[O], P = Object.create(null), w = 0; w < A.length; w++) {
                    var z = A[w];
                    if (z.include) {
                        var lt = [w, 1];
                        if (z.include !== O && !P[z.include]) {
                            P[z.include] = !0;
                            var B = M[z.include];
                            if (!B) throw new Error("Cannot include nonexistent state '" + z.include + "' (in state '" + O + "')");
                            for (var et = 0; et < B.length; et++) {
                                var pt = B[et];
                                A.indexOf(pt) === -1 && lt.push(pt)
                            }
                        }
                        A.splice.apply(A, lt), w--
                    }
                }
            for (var q = Object.create(null), b = 0; b < m.length; b++) {
                var O = m[b];
                q[O] = k(M[O], !0)
            }
            for (var b = 0; b < m.length; b++) {
                for (var wt = m[b], ft = q[wt], Et = ft.groups, w = 0; w < Et.length; w++) ct(Et[w], wt, q);
                for (var Tt = Object.getOwnPropertyNames(ft.fast), w = 0; w < Tt.length; w++) ct(ft.fast[Tt[w]], wt, q)
            }
            return new $(q, h)
        }

        function Xt(c) {
            for (var h = typeof Map < "u", y = h ? new Map : Object.create(null), m = Object.getOwnPropertyNames(c), M = 0; M < m.length; M++) {
                var b = m[M],
                    O = c[b],
                    A = Array.isArray(O) ? O : [O];
                A.forEach(function(P) {
                    if (typeof P != "string") throw new Error("keyword must be string (in keyword '" + b + "')");
                    h ? y.set(P, b) : y[P] = b
                })
            }
            return function(P) {
                return h ? y.get(P) : y[P]
            }
        }
        var $ = function(c, h) {
            this.startState = h, this.states = c, this.buffer = "", this.stack = [], this.reset()
        };
        $.prototype.reset = function(c, h) {
            return this.buffer = c || "", this.index = 0, this.line = h ? h.line : 1, this.col = h ? h.col : 1, this.queuedToken = h ? h.queuedToken : null, this.queuedText = h ? h.queuedText : "", this.queuedThrow = h ? h.queuedThrow : null, this.setState(h ? h.state : this.startState), this.stack = h && h.stack ? h.stack.slice() : [], this
        }, $.prototype.save = function() {
            return {
                line: this.line,
                col: this.col,
                state: this.state,
                stack: this.stack.slice(),
                queuedToken: this.queuedToken,
                queuedText: this.queuedText,
                queuedThrow: this.queuedThrow
            }
        }, $.prototype.setState = function(c) {
            if (!(!c || this.state === c)) {
                this.state = c;
                var h = this.states[c];
                this.groups = h.groups, this.error = h.error, this.re = h.regexp, this.fast = h.fast
            }
        }, $.prototype.popState = function() {
            this.setState(this.stack.pop())
        }, $.prototype.pushState = function(c) {
            this.stack.push(this.state), this.setState(c)
        };
        var Yt = o ? function(c, h) {
            return c.exec(h)
        } : function(c, h) {
            var y = c.exec(h);
            return y[0].length === 0 ? null : y
        };
        $.prototype._getGroup = function(c) {
            for (var h = this.groups.length, y = 0; y < h; y++)
                if (c[y + 1] !== void 0) return this.groups[y];
            throw new Error("Cannot find token type for matched text")
        };

        function Jt() {
            return this.value
        }
        if ($.prototype.next = function() {
                var c = this.index;
                if (this.queuedGroup) {
                    var h = this._token(this.queuedGroup, this.queuedText, c);
                    return this.queuedGroup = null, this.queuedText = "", h
                }
                var y = this.buffer;
                if (c !== y.length) {
                    var O = this.fast[y.charCodeAt(c)];
                    if (O) return this._token(O, y.charAt(c), c);
                    var m = this.re;
                    m.lastIndex = c;
                    var M = Yt(m, y),
                        b = this.error;
                    if (M == null) return this._token(b, y.slice(c, y.length), c);
                    var O = this._getGroup(M),
                        A = M[0];
                    return b.fallback && M.index !== c ? (this.queuedGroup = O, this.queuedText = A, this._token(b, y.slice(c, M.index), c)) : this._token(O, A, c)
                }
            }, $.prototype._token = function(c, h, y) {
                var m = 0;
                if (c.lineBreaks) {
                    var M = /\n/g,
                        b = 1;
                    if (h === `
`) m = 1;
                    else
                        for (; M.exec(h);) m++, b = M.lastIndex
                }
                var O = {
                        type: typeof c.type == "function" && c.type(h) || c.defaultType,
                        value: typeof c.value == "function" ? c.value(h) : h,
                        text: h,
                        toString: Jt,
                        offset: y,
                        lineBreaks: m,
                        line: this.line,
                        col: this.col
                    },
                    A = h.length;
                if (this.index += A, this.line += m, m !== 0 ? this.col = A - b + 1 : this.col += A, c.shouldThrow) {
                    var P = new Error(this.formatError(O, "invalid syntax"));
                    throw P
                }
                return c.pop ? this.popState() : c.push ? this.pushState(c.push) : c.next && this.setState(c.next), O
            }, typeof Symbol < "u" && Symbol.iterator) {
            var Qt = function(c) {
                this.lexer = c
            };
            Qt.prototype.next = function() {
                var c = this.lexer.next();
                return {
                    value: c,
                    done: !c
                }
            }, Qt.prototype[Symbol.iterator] = function() {
                return this
            }, $.prototype[Symbol.iterator] = function() {
                return new Qt(this)
            }
        }
        return $.prototype.formatError = function(m, h) {
            if (m == null) var y = this.buffer.slice(this.index),
                m = {
                    text: y,
                    offset: this.index,
                    lineBreaks: y.indexOf(`
`) === -1 ? 0 : 1,
                    line: this.line,
                    col: this.col
                };
            var M = 2,
                b = Math.max(m.line - M, 1),
                O = m.line + M,
                A = String(O).length,
                P = g(this.buffer, this.line - m.line + M + 1).slice(0, 5),
                w = [];
            w.push(h + " at line " + m.line + " col " + m.col + ":"), w.push("");
            for (var z = 0; z < P.length; z++) {
                var lt = P[z],
                    B = b + z;
                w.push(d(String(B), A) + "  " + lt), B === m.line && w.push(d("", A + m.col + 1) + "^")
            }
            return w.join(`
`)
        }, $.prototype.clone = function() {
            return new $(this.states, this.state)
        }, $.prototype.has = function(c) {
            return !0
        }, {
            compile: E,
            states: bt,
            error: Object.freeze({
                error: !0
            }),
            fallback: Object.freeze({
                fallback: !0
            }),
            keywords: Xt
        }
    })
})(Ln);
const je = re,
    Mt = "T_CODE",
    T = "G_CODE",
    J = "M_CODE",
    U = "D_CODE",
    C = "ASTERISK",
    D = "PERCENT",
    ze = "EQUALS",
    yt = "COMMA",
    ot = "OPERATOR",
    oe = "GERBER_FORMAT",
    $t = "GERBER_UNITS",
    Le = "GERBER_TOOL_MACRO",
    Ge = "GERBER_TOOL_DEF",
    De = "GERBER_LOAD_POLARITY",
    qe = "GERBER_STEP_REPEAT",
    Ot = "GERBER_MACRO_VARIABLE",
    Fe = "SEMICOLON",
    Be = "DRILL_UNITS",
    se = "DRILL_ZERO_INCLUSION",
    I = "COORD_CHAR",
    j = "NUMBER",
    Gn = "WORD",
    Dn = "WHITESPACE",
    F = "NEWLINE",
    qn = "CATCHALL",
    Fn = "ERROR",
    Bn = /^0*/,
    He = t => t.replace(Bn, ""),
    Pt = t => {
        const e = He(t.slice(1));
        return e === "" ? "0" : e
    },
    Hn = {
        [Mt]: {
            match: /T\d+/,
            value: Pt
        },
        [T]: {
            match: /G\d+/,
            value: Pt
        },
        [J]: {
            match: /M\d+/,
            value: Pt
        },
        [U]: {
            match: /D\d+/,
            value: Pt
        },
        [C]: "*",
        [D]: "%",
        [ze]: "=",
        [oe]: {
            match: /FS[ADILT]+/,
            value: t => t.slice(2)
        },
        [$t]: {
            match: /MO(?:IN|MM)/,
            value: t => t.slice(2)
        },
        [Le]: {
            match: /AM[$.A-Z_a-z][\w.-]*/,
            value: t => t.slice(2)
        },
        [Ge]: {
            match: /ADD\d+[$.A-Z_a-z][\w.-]*/,
            value: t => He(t.slice(3))
        },
        [De]: {
            match: /LP[CD]/,
            value: t => t.slice(2)
        },
        [qe]: "SR",
        [Ot]: /\$\d+/,
        [Fe]: ";",
        [Be]: /^(?:METRIC|INCH)/,
        [se]: {
            match: /,(?:TZ|LZ)/,
            value: t => t.slice(1)
        },
        [I]: /[A-CFH-JNSX-Z]/,
        [j]: /[+-]?[\d.]+/,
        [ot]: ["x", "/", "+", "-", "(", ")"],
        [yt]: ",",
        [Gn]: /[A-Za-z]+/,
        [Dn]: /[\t ]+/,
        [F]: {
            match: /\r?\n/,
            lineBreaks: !0
        },
        [qn]: /\S/,
        [Fn]: je.error
    };

function Un() {
    const t = je.compile(Hn);
    return {
        feed: e
    };

    function e(o, r) {
        return t.reset(o, r), n((r == null ? void 0 : r.offset)??0)
    }

    function n(o) {
        return {
            [Symbol.iterator]() {
                return this
            },
            next() {
                const r = t.next();
                if (r !== void 0) {
                    const s = { ...r,
                            offset: o + r.offset
                        },
                        a = { ...t.save(),
                            offset: o + (t.index??0)
                        };
                    return {
                        value: [s, a]
                    }
                }
                return {
                    value: void 0,
                    done: !0
                }
            }
        }
    }
}
const Ue = "gerber",
    qt = "drill",
    he = "mm",
    Ft = "in",
    _t = "leading",
    kt = "trailing",
    Vn = "absolute",
    Wn = "incremental",
    Bt = "circle",
    de = "rectangle",
    ae = "obround",
    Ve = "polygon",
    We = "macroShape",
    Zn = "1",
    Xn = "2",
    Yn = "20",
    Jn = "21",
    Qn = "22",
    Kn = "4",
    tr = "5",
    er = "6",
    nr = "7",
    Y = "shape",
    st = "move",
    dt = "segment",
    Ze = "slot",
    Xe = "line",
    ye = "cwArc",
    me = "ccwArc",
    Ye = "single",
    rr = "multi",
    Je = "dark",
    or = "clear",
    Ht = "TOKEN",
    gt = "MIN_TO_MAX";

function i(t, e) {
    return {
        rule: Ht,
        type: t,
        value: e
    }
}

function at(t, e) {
    return {
        rule: Ht,
        type: t,
        value: e,
        negate: !0
    }
}

function tt(t) {
    return {
        rule: gt,
        min: 1,
        max: 1,
        match: t
    }
}

function mt(t) {
    return {
        rule: gt,
        min: 0,
        max: 1,
        match: t
    }
}

function W(t) {
    return {
        rule: gt,
        min: 0,
        max: Number.POSITIVE_INFINITY,
        match: t
    }
}

function Qe(t) {
    return {
        rule: gt,
        min: 1,
        max: Number.POSITIVE_INFINITY,
        match: t
    }
}

function it(t, e, n) {
    return {
        rule: gt,
        min: t,
        max: e,
        match: n
    }
}

function Ke(t, e) {
    const n = [];
    for (const o of e) {
        const r = ar(t, o.rules);
        if (r === en) n.push(o);
        else if (r === tn) return {
            filetype: o.filetype,
            nodes: o.createNodes(t)
        }
    }
    return n.length > 0 ? {
        candidates: n,
        tokens: t
    } : {}
}
const tn = "FULL_MATCH",
    en = "PARTIAL_MATCH",
    sr = "NO_MATCH";

function ar(t, e) {
    let n = 0,
        o = 0,
        r = 0;
    for (; n < e.length && o < t.length;) {
        const s = e[n],
            a = t[o];
        if (nn(s, a)) s.rule === Ht || r >= s.max - 1 ? (n++, o++, r = 0) : (o++, r++);
        else if (s.rule === gt && r >= s.min) r = 0, n++;
        else return sr
    }
    return n < e.length ? en : tn
}

function nn(t, e) {
    if (t.rule === Ht) {
        const n = t.type === e.type,
            o = t.value === null || t.value === void 0 || typeof t.value == "string" && t.value === e.value || t.value instanceof RegExp && t.value.test(e.value),
            r = n && o;
        return t.negate === !0 ? !r : r
    }
    return Array.isArray(t.match) ? t.match.some(n => nn(n, e)) : !1
}
const ir = "root",
    ge = "comment",
    ur = "drillHeader",
    ve = "done",
    Ut = "units",
    xe = "coordinateFormat",
    It = "toolDefinition",
    rn = "toolMacro",
    Vt = "toolChange",
    ie = "loadPolarity",
    cr = "stepRepeat",
    Q = "graphic",
    vt = "interpolateMode",
    ue = "regionMode",
    on = "quadrantMode",
    lr = "unimplemented",
    pr = "macroComment",
    sn = "macroVariable",
    an = "macroPrimitive";

function ut(t) {
    return Object.fromEntries(t.map((e, n) => [e, n > 0 ? t[n - 1] : void 0]).filter(e => {
        const [n, o] = e;
        return n.type === j && (o == null ? void 0 : o.type) === I
    }).map(([e, n]) => [n.value.toLowerCase(), e.value]))
}

function Wt(t) {
    const e = t.filter(n => n.type === T).map(n => n.value === "0" ? st : n.value === "1" ? Xe : n.value === "2" ? ye : n.value === "3" ? me : n.value === "5" ? qt : !1);
    return typeof e[0] == "string" ? e[0] : void 0
}

function fr(t) {
    const e = t.filter(n => n.type === U).map(n => n.value === "1" ? dt : n.value === "2" ? st : n.value === "3" ? Y : !1);
    return typeof e[0] == "string" ? e[0] : void 0
}

function be(t) {
    return t.map(e => e.value).join("").trim()
}

function S(t, e = {}) {
    const {
        head: n = t[0],
        length: o = 0
    } = e, r = o > 0 ? t[t.indexOf(n) + o - 1] : t[t.length - 1];
    return {
        start: {
            line: n.line,
            column: n.col,
            offset: n.offset
        },
        end: {
            line: r.line,
            column: r.col,
            offset: r.offset
        }
    }
}
const hr = {
        name: "units",
        rules: [tt([i(Be), i(J, "71"), i(J, "72")]), W([i(yt), i(se), i(j, /^0{1,8}\.0{1,8}$/)]), i(F)],
        createNodes(t) {
            const e = t[0].value === "INCH" || t[0].value === "72" ? Ft : he,
                n = t.filter(s => s.type === se).map(s => s.value === "LZ" ? kt : _t),
                o = t.filter(s => s.type === j).map(s => {
                    const [a = "", u = ""] = s.value.split(".");
                    return [a.length, u.length]
                }),
                r = [{
                    type: Ut,
                    position: S(t.slice(0, 2)),
                    units: e
                }];
            return (n.length > 0 || o.length > 0) && r.push({
                type: xe,
                position: S(t.slice(1)),
                mode: void 0,
                format: o[0],
                zeroSuppression: n[0]
            }), r
        }
    },
    dr = {
        name: "tool",
        rules: [i(Mt), it(0, 12, [i(I, "C"), i(I, "F"), i(I, "S"), i(I, "B"), i(I, "H"), i(I, "Z"), i(j)]), i(F)],
        createNodes(t) {
            const e = t[0].value,
                n = S(t),
                {
                    c: o
                } = ut(t.slice(1, -1));
            return o === void 0 ? [{
                type: Vt,
                position: n,
                code: e
            }] : [{
                type: It,
                shape: {
                    type: Bt,
                    diameter: Number(o)
                },
                hole: void 0,
                position: n,
                code: e
            }]
        }
    },
    yr = {
        name: "operationMode",
        rules: [tt([i(T, "0"), i(T, "1"), i(T, "2"), i(T, "3"), i(T, "5")]), i(F)],
        createNodes: t => [{
            type: vt,
            position: S(t),
            mode: Wt(t)
        }]
    },
    mr = {
        name: "operation",
        rules: [it(0, 2, [i(Mt), i(T, "0"), i(T, "1"), i(T, "2"), i(T, "3"), i(T, "5")]), it(2, 8, [i(I), i(j)]), mt([i(Mt)]), i(F)],
        createNodes(t) {
            const e = t.filter(d => d.type === I || d.type === j),
                n = t.find(d => d.type === T),
                o = t.find(d => d.type === Mt),
                r = ut(e),
                s = o == null ? void 0 : o.value,
                a = Wt(t),
                u = S(t, {
                    head: e[0],
                    length: e.length + 1
                }),
                l = S(t, {
                    head: n,
                    length: 2
                }),
                p = S(t, {
                    head: o,
                    length: 2
                }),
                f = [{
                    type: Q,
                    position: u,
                    graphic: void 0,
                    coordinates: r
                }];
            return a !== void 0 && f.unshift({
                type: vt,
                position: l,
                mode: a
            }), s !== void 0 && f.unshift({
                type: Vt,
                position: p,
                code: s
            }), f
        }
    },
    gr = {
        name: "slot",
        rules: [it(2, 4, [i(I), i(j)]), i(T, "85"), it(2, 4, [i(I), i(j)]), i(F)],
        createNodes(t) {
            const e = t.find(s => s.type === T),
                n = e === void 0 ? -1 : t.indexOf(e),
                o = Object.fromEntries(Object.entries(ut(t.slice(0, n))).map(([s, a]) => [`${s}0`, a])),
                r = ut(t.slice(n));
            return [{
                type: Q,
                position: S(t),
                graphic: Ze,
                coordinates: { ...o,
                    ...r
                }
            }]
        }
    },
    vr = {
        name: "done",
        rules: [tt([i(J, "30"), i(J, "0")]), i(F)],
        createNodes: t => [{
            type: ve,
            position: S(t)
        }]
    },
    xr = {
        name: "header",
        rules: [tt([i(J, "48"), i(D)]), i(F)],
        createNodes: t => [{
            type: ur,
            position: S(t)
        }]
    },
    br = {
        name: "comment",
        rules: [i(Fe), W([at(F)]), i(F)],
        createNodes: t => [{
            type: ge,
            comment: be(t.slice(1, -1)),
            position: S(t)
        }]
    },
    un = [dr, yr, mr, gr, br, hr, vr, xr].map(t => ({ ...t,
        filetype: qt
    })),
    wr = {
        name: "macroComment",
        rules: [i(j, "0"), W([at(C)]), i(C)],
        createNodes: _r
    },
    Er = {
        name: "macroVariable",
        rules: [i(Ot), i(ze), Qe([i(j), i(ot), i(Ot), i(I, "X")]), i(C)],
        createNodes: kr
    },
    Mr = {
        name: "macroPrimitive",
        rules: [i(j), i(yt), Qe([i(F), i(yt), i(j), i(ot), i(Ot), i(I, "X")]), i(C)],
        createNodes: Or
    };

function _r(t) {
    const e = t.slice(1, -1).map(n => n.text).join("").trim();
    return [{
        type: pr,
        position: S(t),
        comment: e
    }]
}

function Or(t) {
    const e = t[0].value,
        n = [
            []
        ];
    let o = n[0];
    for (const s of t.slice(2, -1)) s.type === yt ? (o = [], n.push(o)) : o.push(s);
    const r = n.map(s => cn(s));
    return [{
        type: an,
        position: S(t),
        code: e,
        parameters: r
    }]
}

function kr(t) {
    const e = t[0].value,
        n = cn(t.slice(2, -1));
    return [{
        type: sn,
        position: S(t),
        name: e,
        value: n
    }]
}

function cn(t) {
    const e = t.map(a => a.type === I ? Object.assign(a, {
        type: ot,
        value: "x"
    }) : a);
    return s();

    function n() {
        return e[0]
    }

    function o() {
        const a = e.shift();
        if ((a == null ? void 0 : a.type) === j) return Number(a.value);
        if ((a == null ? void 0 : a.type) === Ot) return a.value;
        const u = s();
        return e.shift(), u
    }

    function r() {
        let a = o(),
            u = n();
        for (;
            (u == null ? void 0 : u.type) === ot && (u.value === "x" || u.value === "/");) e.shift(), a = {
            left: a,
            right: o(),
            operator: u.value
        }, u = n();
        return a
    }

    function s() {
        let a = r(),
            u = n();
        for (;
            (u == null ? void 0 : u.type) === ot && (u.value === "+" || u.value === "-") || (u == null ? void 0 : u.type) === j;) {
            let l = "+";
            u.type === ot && (e.shift(), l = u.value);
            const p = r();
            a = {
                left: a,
                right: p,
                operator: l
            }, u = n()
        }
        return a
    }
}
const _e = [Mr, Er, wr];

function Tr(t) {
    let e = _e,
        n = [];
    const o = [];
    for (const r of t) {
        n.push(r);
        const s = Ke(n, e);
        s.nodes !== void 0 && o.push(...s.nodes), n = s.tokens??[], e = s.candidates??_e
    }
    return o
}
const te = t => {
        if (t.length === 1) {
            const [e] = t;
            return {
                type: Bt,
                diameter: e
            }
        }
        if (t.length === 2) {
            const [e, n] = t;
            return {
                type: de,
                xSize: e,
                ySize: n
            }
        }
    },
    Sr = {
        name: "done",
        rules: [tt([i(J, "0"), i(J, "2")]), i(C)],
        createNodes: t => [{
            type: ve,
            position: S(t)
        }]
    },
    Pr = {
        name: "comment",
        rules: [i(T, "4"), W([at(C)]), i(C)],
        createNodes: t => [{
            type: ge,
            position: S(t),
            comment: be(t.slice(1, -1))
        }]
    },
    Nr = {
        name: "format",
        rules: [i(D), i(oe), W([at(I, "X")]), i(I, "X"), i(j), i(I, "Y"), i(j), W([at(C)]), i(C), it(0, 2, [i($t), i(C)]), i(D)],
        createNodes(t) {
            var e;
            let n, o, r;
            const s = ut(t),
                a = t.findIndex(p => p.type === C),
                u = t.find(p => p.type === $t);
            for (const p of t.filter(f => f.type === oe)) p.value.includes("T") && (o = kt), p.value.includes("L") && (o = _t), p.value.includes("I") && (r = Wn), p.value.includes("A") && (r = Vn);
            if (s.x === s.y && ((e = s.x) == null ? void 0 : e.length) === 2) {
                const p = Number(s.x[0]),
                    f = Number(s.x[1]);
                p > 0 && f > 0 && (n = [p, f])
            }
            const l = [{
                type: xe,
                position: S(t.slice(1, a + 1)),
                zeroSuppression: o,
                format: n,
                mode: r
            }];
            return u !== void 0 && l.push({
                type: Ut,
                position: S(t.slice(1, -1), {
                    head: u
                }),
                units: u.value === "MM" ? he : Ft
            }), l
        }
    },
    Rr = {
        name: "units",
        rules: [i(D), i($t), i(C), i(D)],
        createNodes: t => [{
            type: Ut,
            position: S(t.slice(1, -1)),
            units: t[1].value === "MM" ? he : Ft
        }]
    },
    Cr = {
        name: "toolMacro",
        rules: [i(D), i(Le), i(C), W([at(D)]), i(D)],
        createNodes(t) {
            const e = t[1].value,
                n = S(t.slice(1, -1)),
                o = t.slice(3, -1);
            return [{
                type: rn,
                position: n,
                children: Tr(o),
                name: e
            }]
        }
    },
    Ar = {
        name: "toolDefinition",
        rules: [i(D), i(Ge), W([i(yt), i(j), i(I, "X")]), i(C), i(D)],
        createNodes(t) {
            let e, n;
            const o = /(\d+)(.+)/.exec(t[1].value),
                [, r = "", s = ""] = o??[],
                a = t.slice(3, -2).filter(u => u.type === j).map(u => Number(u.value));
            switch (s) {
                case "C":
                    {
                        const [u, ...l] = a;e = {
                            type: Bt,
                            diameter: u
                        },
                        n = te(l);
                        break
                    }
                case "R":
                case "O":
                    {
                        const [u, l, ...p] = a;e = {
                            type: s === "R" ? de : ae,
                            xSize: u,
                            ySize: l
                        },
                        n = te(p);
                        break
                    }
                case "P":
                    {
                        const [u, l, p, ...f] = a;e = {
                            type: Ve,
                            diameter: u,
                            vertices: l,
                            rotation: p
                        },
                        n = te(f);
                        break
                    }
                default:
                    e = {
                        type: We,
                        name: s,
                        variableValues: a
                    }
            }
            return [{
                type: It,
                position: S(t.slice(1, -1)),
                code: r,
                shape: e,
                hole: n
            }]
        }
    },
    $r = {
        name: "toolChange",
        rules: [mt([i(T, "54")]), i(U), i(C)],
        createNodes: t => t.filter(({
            type: e
        }) => e === U).map(({
            value: e
        }) => ({
            type: Vt,
            position: S(t),
            code: e
        }))
    },
    ln = t => {
        const e = fr(t),
            n = ut(t),
            o = Wt(t),
            r = S(t, {
                head: o === void 0 ? t[0] : t[1]
            }),
            s = Object.keys(n).length > 0 || e !== void 0 ? [{
                type: Q,
                position: r,
                graphic: e,
                coordinates: n
            }] : [];
        if (o !== void 0) {
            const a = S(t, {
                head: t[0],
                length: 2
            });
            s.unshift({
                type: vt,
                position: a,
                mode: o
            })
        }
        return s
    },
    Ir = {
        name: "operation",
        rules: [mt([i(T, "1"), i(T, "2"), i(T, "3")]), it(2, 8, [i(I), i(j)]), mt([i(U, "1"), i(U, "2"), i(U, "3")]), i(C)],
        createNodes: ln
    },
    jr = {
        name: "operationWithoutCoords",
        rules: [mt([i(T, "1"), i(T, "2"), i(T, "3")]), mt([i(U, "1"), i(U, "2"), i(U, "3")]), i(C)],
        createNodes: ln
    },
    zr = {
        name: "interpolationMode",
        rules: [tt([i(T, "1"), i(T, "2"), i(T, "3")]), i(C)],
        createNodes: t => [{
            type: vt,
            position: S(t),
            mode: Wt(t)
        }]
    },
    Lr = {
        name: "regionMode",
        rules: [tt([i(T, "36"), i(T, "37")]), i(C)],
        createNodes: t => [{
            type: ue,
            position: S(t),
            region: t[0].value === "36"
        }]
    },
    Gr = {
        name: "quadrantMode",
        rules: [tt([i(T, "74"), i(T, "75")]), i(C)],
        createNodes: t => [{
            type: on,
            position: S(t),
            quadrant: t[0].value === "74" ? Ye : rr
        }]
    },
    Dr = {
        name: "loadPolarity",
        rules: [i(D), i(De), i(C), i(D)],
        createNodes: t => [{
            type: ie,
            position: S(t.slice(1, -1)),
            polarity: t[1].value === "D" ? Je : or
        }]
    },
    qr = {
        name: "stepRepeat",
        rules: [i(D), i(qe), W([i(I), i(j)]), i(C), i(D)],
        createNodes(t) {
            const e = ut(t),
                n = Object.fromEntries(Object.entries(e).map(([o, r]) => [o, Number(r)]));
            return [{
                type: cr,
                position: S(t.slice(1, -1)),
                stepRepeat: n
            }]
        }
    },
    Fr = {
        name: "unimplementedExtendedCommand",
        rules: [i(D), W([at(C)]), i(C), i(D)],
        createNodes: t => [{
            type: lr,
            position: S(t.slice(1, -1)),
            value: be(t)
        }]
    },
    pn = [Ir, jr, zr, $r, Ar, Cr, Pr, Lr, Gr, Dr, qr, Nr, Rr, Sr, Fr].map(t => ({ ...t,
        filetype: Ue
    })),
    Br = [...pn, ...un];

function Hr(t, e) {
    const n = [];
    let o = u(),
        r = [],
        s, a = "";
    for (const [l, p] of t) {
        r.push(l);
        const f = Ke(r, o);
        f.nodes === void 0 ? a += l.text : (n.push(...f.nodes), s = p, a = ""), e = e??f.filetype, r = f.tokens??[], o = f.candidates??u()
    }
    return {
        filetype: e,
        unmatched: a,
        nodes: n,
        lexerState: s
    };

    function u() {
        return e === Ue ? pn : e === qt ? un : Br
    }
}

function Ur() {
    const t = Un(),
        e = [];
    let n, o, r = "";
    const s = {
        lexer: t,
        feed: a,
        result: u
    };
    return s;

    function a(l) {
        const p = t.feed(`${r}${l}`, o),
            f = Hr(p, n);
        n = n??f.filetype, r = f.unmatched, o = f.lexerState??o;
        for (const d of f.nodes) e.push(d);
        return s
    }

    function u() {
        if (n === void 0) throw new Error("File type not recognized");
        return {
            type: ir,
            filetype: n,
            children: e
        }
    }
}

function Vr(t) {
    return Ur().feed(t).result()
}
const Wr = "image",
    ce = "imageShape",
    Zr = "imagePath",
    fn = "imageRegion",
    G = "line",
    L = "arc",
    xt = "circle",
    Zt = "rectangle",
    Z = "polygon",
    jt = "outline",
    we = "layeredShape",
    {
        PI: K
    } = Math,
    X = K / 2,
    hn = 3 * X,
    H = 2 * K;

function le(t) {
    return t >= 0 && t <= H ? t : t < 0 ? t + H : t > H ? t - H : le(t)
}

function Oe(t) {
    return t >= X ? t - X : t + hn
}

function dn(t) {
    return t * K / 180
}

function V(t, e, n = 0) {
    const o = dn(n),
        [r, s] = [Math.sin(o), Math.cos(o)],
        [a, u] = t,
        l = a * s - u * r + e[0],
        p = a * r + u * s + e[1];
    return [l, p]
}

function yn(t, e) {
    return t[0] === e[0] && t[1] === e[1]
}

function ke(t) {
    return t.length === 0
}

function Xr() {
    return []
}

function Yr(t, e) {
    return ke(t) ? e : ke(e) ? t : [Math.min(t[0], e[0]), Math.min(t[1], e[1]), Math.max(t[2], e[2]), Math.max(t[3], e[3])]
}

function zt(t) {
    return t.reduce(Yr, Xr())
}

function Jr(t) {
    return zt(t.map(Qr))
}

function Qr(t) {
    return t.type === ce ? mn(t.shape) : gn(t.segments, t.type === Zr ? t.width : void 0)
}

function mn(t) {
    switch (t.type) {
        case xt:
            {
                const {
                    cx: e,
                    cy: n,
                    r: o
                } = t;
                return pe([e, n], o)
            }
        case Zt:
            {
                const {
                    x: e,
                    y: n,
                    xSize: o,
                    ySize: r
                } = t;
                return [e, n, e + o, n + r]
            }
        case Z:
            return zt(t.points.map(e => pe(e)));
        case jt:
            return gn(t.segments);
        case we:
            return zt(t.shapes.filter(({
                erase: e
            }) => e !== !0).map(mn))
    }
}

function gn(t, e = 0) {
    const n = e / 2,
        o = [];
    for (const r of t)
        if (o.push(r.start, r.end), r.type === L) {
            const {
                start: s,
                end: a,
                center: u,
                radius: l
            } = r, p = Math.abs(a[2] - s[2]);
            let [f, d] = a[2] > s[2] ? [s[2], a[2]] : [a[2], s[2]];
            f = le(f), d = le(d);
            const g = [
                [u[0] + l, u[1]],
                [u[0], u[1] + l],
                [u[0] - l, u[1]],
                [u[0], u[1] - l]
            ];
            for (const v of g)(f > d || p === H) && o.push(v), f = Oe(f), d = Oe(d)
        }
    return zt(o.map(r => pe(r, n)))
}

function pe(t, e = 0) {
    return [t[0] - e, t[1] - e, t[0] + e, t[1] + e]
}
const Kr = /FORMAT={?(\d):(\d)/;

function to(t) {
    const {
        children: e
    } = t;
    let n, o, r, s = 0;
    for (; s < e.length && (n === void 0 || o === void 0 || r === void 0);) {
        const a = e[s];
        switch (a.type) {
            case Ut:
                {
                    n = a.units;
                    break
                }
            case xe:
                {
                    o = a.format??void 0,
                    r = a.zeroSuppression??void 0;
                    break
                }
            case Q:
                {
                    const {
                        coordinates: u
                    } = a;
                    for (const l of Object.values(u)) {
                        if (r !== void 0) break;
                        (l == null ? void 0 : l.endsWith("0")) === !0 || (l == null ? void 0 : l.includes(".")) === !0 ? r = _t : (l == null ? void 0 : l.startsWith("0")) === !0 && (r = kt)
                    }
                    break
                }
            case ge:
                {
                    const {
                        comment: u
                    } = a,
                    l = Kr.exec(u);
                    /suppress trailing/i.test(u) ? r = kt : /(suppress leading|keep zeros)/i.test(u) && (r = _t),
                    l !== null && (o = [Number(l[1]), Number(l[2])]);
                    break
                }
        }
        s += 1
    }
    return {
        units: n??Ft,
        coordinateFormat: o??[2, 4],
        zeroSuppression: r??_t
    }
}
const Lt = "simpleTool",
    vn = "macroTool";

function eo() {
    return Object.create(no)
}
const no = {
    _currentToolCode: void 0,
    _toolsByCode: {},
    _macrosByName: {},
    use(t) {
        if (t.type === rn && (this._macrosByName[t.name] = t.children), t.type === It) {
            const {
                code: e,
                shape: n,
                hole: o
            } = t, r = n.type === We ? {
                type: vn,
                name: n.name,
                dcode: e,
                macro: this._macrosByName[n.name]??[],
                variableValues: n.variableValues
            } : {
                type: Lt,
                dcode: e,
                shape: n,
                hole: o??void 0
            };
            this._toolsByCode[e] = r
        }
        return (t.type === It || t.type === Vt) && (this._currentToolCode = t.code), typeof this._currentToolCode == "string" ? this._toolsByCode[this._currentToolCode] : void 0
    }
};

function ro() {
    return Object.create(oo)
}
const oo = {
    _DEFAULT_ARC_OFFSETS: {
        i: 0,
        j: 0,
        a: 0
    },
    _previousPoint: {
        x: 0,
        y: 0
    },
    use(t, e) {
        let n = this._DEFAULT_ARC_OFFSETS,
            o = this._previousPoint,
            r = o;
        if (t.type === Q) {
            const {
                coordinates: s
            } = t, a = nt(s.x0, o.x, e), u = nt(s.y0, o.y, e), l = nt(s.x, a, e), p = nt(s.y, u, e), f = nt(s.i, 0, e), d = nt(s.j, 0, e), g = nt(s.a, 0, e);
            (o.x !== a || o.y !== u) && (o = {
                x: a,
                y: u
            }), (r.x !== l || r.y !== p) && (r = {
                x: l,
                y: p
            }), (f !== 0 || d !== 0 || g !== 0) && (n = {
                i: f,
                j: d,
                a: g
            })
        }
        return this._previousPoint = r, {
            startPoint: o,
            endPoint: r,
            arcOffsets: n
        }
    }
};

function nt(t, e, n) {
    if (typeof t != "string") return e;
    if (t.includes(".") || t === "0") return Number(t);
    const {
        coordinateFormat: o,
        zeroSuppression: r
    } = n, [s, a] = o, [u, l] = t.startsWith("+") || t.startsWith("-") ? [t[0], t.slice(1)] : ["+", t], p = s + a, f = r === kt ? l.padEnd(p, "0") : l.padStart(p, "0"), d = f.slice(0, s), g = f.slice(s);
    return +`${u}${d}.${g}`
}

function Te(t, e) {
    const {
        x: n,
        y: o
    } = e;
    switch (t.type) {
        case Bt:
            {
                const {
                    diameter: r
                } = t;
                return {
                    type: xt,
                    cx: n,
                    cy: o,
                    r: r / 2
                }
            }
        case de:
        case ae:
            {
                const {
                    xSize: r,
                    ySize: s
                } = t,
                a = r / 2,
                u = s / 2,
                l = {
                    type: Zt,
                    x: n - a,
                    y: o - u,
                    xSize: r,
                    ySize: s
                };
                return t.type === ae && (l.r = Math.min(a, u)),
                l
            }
        case Ve:
            {
                const {
                    diameter: r,
                    rotation: s,
                    vertices: a
                } = t,
                u = r / 2,
                l = dn(s??0),
                p = H / a,
                f = Array.from({
                    length: a
                }).map((d, g) => {
                    const v = p * g + l,
                        x = n + u * Math.cos(v),
                        _ = o + u * Math.sin(v);
                    return [x, _]
                });
                return {
                    type: Z,
                    points: f
                }
            }
    }
}

function Se(t) {
    if (t.type === xt) {
        const {
            cx: e,
            cy: n,
            r: o
        } = t;
        return [{
            type: L,
            start: [e + o, n, 0],
            end: [e + o, n, H],
            center: [e, n],
            radius: o
        }]
    }
    if (t.type === Zt) {
        const {
            x: e,
            y: n,
            xSize: o,
            ySize: r,
            r: s
        } = t;
        return s === o / 2 ? [{
            type: G,
            start: [e + o, n + s],
            end: [e + o, n + r - s]
        }, {
            type: L,
            start: [e + o, n + r - s, 0],
            end: [e, n + r - s, K],
            center: [e + s, n + r - s],
            radius: s
        }, {
            type: G,
            start: [e, n + r - s],
            end: [e, n + s]
        }, {
            type: L,
            start: [e, n + s, K],
            end: [e + o, n + s, H],
            center: [e + s, n + s],
            radius: s
        }] : s === r / 2 ? [{
            type: G,
            start: [e + s, n],
            end: [e + o - s, n]
        }, {
            type: L,
            start: [e + o - s, n, -X],
            end: [e + o - s, n + r, X],
            center: [e + o - s, n + s],
            radius: s
        }, {
            type: G,
            start: [e + o - s, n + r],
            end: [e + s, n + r]
        }, {
            type: L,
            start: [e + s, n + r, X],
            end: [e + s, n, hn],
            center: [e + s, n + s],
            radius: s
        }] : [{
            type: G,
            start: [e, n],
            end: [e + o, n]
        }, {
            type: G,
            start: [e + o, n],
            end: [e + o, n + r]
        }, {
            type: G,
            start: [e + o, n + r],
            end: [e, n + r]
        }, {
            type: G,
            start: [e, n + r],
            end: [e, n]
        }]
    }
    return t.type === Z ? t.points.map((e, n) => {
        const o = n < t.points.length - 1 ? n + 1 : 0;
        return {
            type: G,
            start: e,
            end: t.points[o]
        }
    }) : t.segments
}

function so(t, e) {
    const {
        shape: n,
        hole: o
    } = t, r = Te(n, e.endPoint);
    if (o !== void 0) {
        const s = Te(o, e.endPoint);
        return {
            type: we,
            shapes: [{
                type: jt,
                erase: !1,
                segments: Se(r)
            }, {
                type: jt,
                erase: !0,
                segments: Se(s)
            }]
        }
    }
    return r
}

function ao(t, e) {
    const n = t.type === G ? io(t, e) : [];
    return {
        type: fn,
        segments: n
    }
}

function io(t, e) {
    const {
        start: n,
        end: o
    } = t, [r, s] = n, [a, u] = o, [l, p] = [e.xSize / 2, e.ySize / 2], f = Math.atan2(u - s, a - r), [d, g] = [r - l, r + l], [v, x] = [s - p, s + p], [_, N] = [a - l, a + l], [R, k] = [u - p, u + p];
    let E = [];
    return yn(n, o) ? E = [
        [d, v],
        [g, v],
        [N, R],
        [N, k],
        [_, k],
        [d, x]
    ] : f >= 0 && f < X ? E = [
        [d, v],
        [g, v],
        [N, R],
        [N, k],
        [_, k],
        [d, x]
    ] : f >= X && f <= K ? E = [
        [g, v],
        [g, x],
        [N, k],
        [_, k],
        [_, R],
        [d, v]
    ] : f >= -K && f < -X ? E = [
        [g, x],
        [d, x],
        [_, k],
        [_, R],
        [N, R],
        [g, v]
    ] : E = [
        [d, x],
        [d, v],
        [_, R],
        [N, R],
        [N, k],
        [g, x]
    ], E.map((ct, bt) => ({
        type: G,
        start: ct,
        end: E[(bt + 1) % E.length]
    }))
}
const xn = "cw",
    Ee = "ccw";

function ee(t, e, n) {
    return e === void 0 ? wn(t) : co(t, e, n)
}

function bn(t) {
    if (t.length > 0) return {
        type: fn,
        segments: t
    }
}

function Pe(t, e) {
    if ((e == null ? void 0 : e.type) === Lt && e.shape.type === xt) return bn(uo(t, e.shape.diameter));
    if ((e == null ? void 0 : e.type) === Lt && e.shape.type === Zt) return ao(t, e.shape)
}

function wn(t) {
    return {
        type: G,
        start: [t.startPoint.x, t.startPoint.y],
        end: [t.endPoint.x, t.endPoint.y]
    }
}

function uo(t, e) {
    const {
        start: n,
        end: o
    } = t;
    if (t.type === G) {
        const [r, s] = n, [a, u] = o, l = Math.atan2(u - s, a - r), p = -(e / 2) * Math.sin(l), f = e / 2 * Math.cos(l);
        return [{
            type: G,
            start: [r + p, s + f],
            end: [a + p, u + f]
        }, {
            type: L,
            start: [a + p, u + f, l + Math.PI / 2],
            end: [a - p, u - f, l - Math.PI / 2],
            center: [a, u],
            radius: e / 2
        }, {
            type: G,
            start: [a - p, u - f],
            end: [r - p, s - f]
        }, {
            type: L,
            start: [r - p, s - f, l + Math.PI * 3 / 2],
            end: [r + p, s + f, l + Math.PI / 2],
            center: [r, s],
            radius: e / 2
        }]
    } else {
        const {
            start: r,
            end: s,
            radius: a,
            center: u
        } = t, [l, p] = r, [f, d] = s, [g, v] = u, x = r[2], _ = s[2], N = -(e / 2) * Math.sin(x - Math.PI / 2), R = e / 2 * Math.cos(x - Math.PI / 2), k = -(e / 2) * Math.sin(_ - Math.PI / 2), E = e / 2 * Math.cos(_ - Math.PI / 2);
        return x > _ ? [{
            type: L,
            start: [l + N, p + R, x],
            end: [f + k, d + E, _],
            center: [g, v],
            radius: a + e / 2
        }, {
            type: L,
            start: [f + k, d + E, _],
            end: [f - k, d - E, _ - Math.PI],
            center: [f, d],
            radius: e / 2
        }, {
            type: L,
            start: [f - k, d - E, _],
            end: [l - N, p - R, x],
            center: [g, v],
            radius: a - e / 2
        }, {
            type: L,
            start: [l - N, p - R, x + Math.PI],
            end: [l + N, p + R, x],
            center: [l, p],
            radius: e / 2
        }] : [{
            type: L,
            start: [l + N, p + R, x],
            end: [f + k, d + E, _],
            center: [g, v],
            radius: a + e / 2
        }, {
            type: L,
            start: [f + k, d + E, _],
            end: [f - k, d - E, _ + Math.PI],
            center: [f, d],
            radius: e / 2
        }, {
            type: L,
            start: [f - k, d - E, _],
            end: [l - N, p - R, x],
            center: [g, v],
            radius: a - e / 2
        }, {
            type: L,
            start: [l - N, p - R, x - Math.PI],
            end: [l + N, p + R, x],
            center: [l, p],
            radius: e / 2
        }]
    }
}

function co(t, e, n = !1) {
    const {
        startPoint: o,
        endPoint: r,
        arcOffsets: s
    } = t, a = s.a > 0 ? s.a : (s.i ** 2 + s.j ** 2) ** .5;
    if (n || s.a > 0) {
        if (o.x === r.x && o.y === r.y) return wn(t);
        const [d, g, v] = lo(t, a).map(x => Gt(o, r, x, e)).sort(([x, _], [N, R]) => {
            const k = Math.abs(_[2] - x[2]),
                E = Math.abs(R[2] - N[2]);
            return k - E
        })[0];
        return {
            type: L,
            start: d,
            end: g,
            center: v,
            radius: a
        }
    }
    const u = {
            x: o.x + s.i,
            y: o.y + s.j
        },
        [l, p, f] = Gt(o, r, u, e);
    return {
        type: L,
        start: l,
        end: p,
        center: f,
        radius: a
    }
}

function Gt(t, e, n, o) {
    let r = Math.atan2(t.y - n.y, t.x - n.x),
        s = Math.atan2(e.y - n.y, e.x - n.x);
    return o === Ee ? s = s > r ? s : s + H : r = r > s ? r : r + H, [
        [t.x, t.y, r],
        [e.x, e.y, s],
        [n.x, n.y]
    ]
}

function lo(t, e) {
    const {
        x: n,
        y: o
    } = t.startPoint, {
        x: r,
        y: s
    } = t.endPoint, [a, u] = [r - n, s - o], [l, p] = [r + n, s + o], f = Math.sqrt(a ** 2 + u ** 2);
    if (e <= f / 2) return [{
        x: n + a / 2,
        y: o + u / 2
    }];
    const d = Math.sqrt(4 * e ** 2 / f ** 2 - 1),
        [g, v] = [l / 2, p / 2],
        [x, _] = [u * d / 2, a * d / 2];
    return [{
        x: g + x,
        y: v - _
    }, {
        x: g - x,
        y: v + _
    }]
}

function po(t, e) {
    const n = [],
        o = Object.fromEntries(t.variableValues.map((r, s) => [`$${s+1}`, r]));
    for (const r of t.macro)
        if (r.type === sn && (o[r.name] = Dt(r.value, o)), r.type === an) {
            const s = [e.endPoint.x, e.endPoint.y],
                a = r.parameters.map(u => Dt(u, o));
            n.push(...fo(r.code, s, a))
        }
    return {
        type: we,
        shapes: n
    }
}

function Dt(t, e) {
    if (typeof t == "number") return t;
    if (typeof t == "string") return e[t];
    const n = Dt(t.left, e),
        o = Dt(t.right, e);
    switch (t.operator) {
        case "+":
            return n + o;
        case "-":
            return n - o;
        case "x":
            return n * o;
        case "/":
            return n / o
    }
}

function fo(t, e, n) {
    switch (t) {
        case Zn:
            return [ho(e, n)];
        case Yn:
        case Xn:
            return [yo(e, n)];
        case Jn:
            return [mo(e, n)];
        case Qn:
            return [go(e, n)];
        case Kn:
            return [vo(e, n)];
        case tr:
            return [xo(e, n)];
        case er:
            return bo(e, n);
        case nr:
            return [wo(e, n)]
    }
    return []
}

function ho(t, e) {
    const [n, o, r, s, a] = e, u = o / 2, [l, p] = V([r, s], t, a);
    return {
        type: xt,
        erase: n === 0,
        cx: l,
        cy: p,
        r: u
    }
}

function yo(t, e) {
    const [n, o, r, s, a, u, l] = e, [p, f] = [u - s, a - r], d = o / 2, g = Math.sqrt(p ** 2 + f ** 2), [v, x] = [d * p / g, d * f / g];
    return {
        type: Z,
        erase: n === 0,
        points: [
            [r + v, s - x],
            [a + v, u - x],
            [a - v, u + x],
            [r - v, s + x]
        ].map(_ => V(_, t, l))
    }
}

function mo(t, e) {
    const [n, o, r, s, a, u] = e, [l, p] = [o / 2, r / 2];
    return {
        type: Z,
        erase: n === 0,
        points: [
            [s - l, a - p],
            [s + l, a - p],
            [s + l, a + p],
            [s - l, a + p]
        ].map(f => V(f, t, u))
    }
}

function go(t, e) {
    const [n, o, r, s, a, u] = e;
    return {
        type: Z,
        erase: n === 0,
        points: [
            [s, a],
            [s + o, a],
            [s + o, a + r],
            [s, a + r]
        ].map(l => V(l, t, u))
    }
}

function vo(t, e) {
    const [n, , ...o] = e.slice(0, -1), r = e[e.length - 1];
    return {
        type: Z,
        erase: n === 0,
        points: o.flatMap((s, a) => a % 2 === 1 ? [
            [o[a - 1], s]
        ] : []).map(s => V(s, t, r))
    }
}

function xo(t, e) {
    const [n, o, r, s, a, u] = e, l = a / 2, p = 2 * K / o, f = [];
    let d;
    for (d = 0; d < o; d++) {
        const g = p * d,
            v = r + l * Math.cos(g),
            x = s + l * Math.sin(g);
        f.push(V([v, x], t, u))
    }
    return {
        type: Z,
        erase: n === 0,
        points: f
    }
}

function bo(t, e) {
    const n = k => V(k, t, e[8]),
        [o, r, s, a, u, l, p, f] = e,
        [d, g] = n([o, r]),
        v = p / 2,
        x = f / 2,
        _ = [];
    let N = 0,
        R = s;
    for (; R >= 0 && N < l;) {
        const k = R / 2,
            E = k - a;
        _.push({
            r: k,
            erase: !1
        }), E > 0 && _.push({
            r: E,
            erase: !0
        }), N += 1, R = 2 * (E - u)
    }
    return [..._.flatMap(({
        r: k,
        erase: E
    }) => ({
        type: xt,
        cx: d,
        cy: g,
        r: k,
        erase: E
    })), {
        type: Z,
        erase: !1,
        points: [
            [o - v, r - x],
            [o + v, r - x],
            [o + v, r + x],
            [o - v, r + x]
        ].map(n)
    }, {
        type: Z,
        erase: !1,
        points: [
            [o - x, r - v],
            [o + x, r - v],
            [o + x, r + v],
            [o - x, r + v]
        ].map(n)
    }]
}

function wo(t, e) {
    const [n, o, r, s, a, u] = e, l = V([n, o], t, u), [p, f] = [r / 2, s / 2], d = a / 2, g = p ** 2 - d ** 2, v = f ** 2 - d ** 2, x = Math.sqrt(g), _ = v >= 0 ? Math.sqrt(v) : d, N = [0, 90, 180, 270], R = [];
    for (const k of N) {
        const E = [
                [_, d],
                [x, d],
                [d, x],
                [d, _]
            ].map($ => V($, [n, o], k)).map($ => V($, t, u)),
            [ct, bt, Xt] = Gt({
                x: E[1][0],
                y: E[1][1]
            }, {
                x: E[2][0],
                y: E[2][1]
            }, {
                x: l[0],
                y: l[1]
            }, Ee);
        if (R.push({
                type: G,
                start: E[0],
                end: E[1]
            }, {
                type: L,
                start: ct,
                end: bt,
                center: Xt,
                radius: p
            }, {
                type: G,
                start: E[2],
                end: E[3]
            }), !yn(E[0], E[3])) {
            const [$, Yt, Jt] = Gt({
                x: E[3][0],
                y: E[3][1]
            }, {
                x: E[0][0],
                y: E[0][1]
            }, {
                x: l[0],
                y: l[1]
            }, xn);
            R.push({
                type: L,
                start: $,
                end: Yt,
                center: Jt,
                radius: f
            })
        }
    }
    return {
        type: jt,
        segments: R
    }
}

function Eo(t) {
    const e = Object.create(Mo);
    return t === qt ? Object.assign(e, _o) : e
}
const Mo = {
        _currentPath: void 0,
        _arcDirection: void 0,
        _ambiguousArcCenter: !1,
        _regionMode: !1,
        _defaultGraphic: void 0,
        _polarity: Je,
        plot(t, e, n) {
            const o = [];
            let r;
            t.type !== Q ? r = void 0 : t.graphic !== void 0 ? r = t.graphic : this._defaultGraphic !== void 0 && (r = this._defaultGraphic);
            const s = this._plotCurrentPath(t, e, r);
            if (s !== void 0 && o.push({ ...s,
                    polarity: this._polarity,
                    dcode: void 0
                }), this._setGraphicState(t), r === Y && (e == null ? void 0 : e.type) === Lt && o.push({
                    type: ce,
                    shape: so(e, n),
                    polarity: this._polarity,
                    dcode: e.dcode,
                    location: [n.endPoint.x, n.endPoint.y]
                }), r === Y && (e == null ? void 0 : e.type) === vn && o.push({
                    type: ce,
                    shape: po(e, n),
                    polarity: this._polarity,
                    dcode: e.dcode,
                    location: [n.endPoint.x, n.endPoint.y]
                }), r === dt && this._regionMode && (this._currentPath = this._currentPath??{
                    segments: [],
                    region: this._regionMode,
                    tool: e
                }, this._currentPath.segments.push(ee(n, this._arcDirection, this._ambiguousArcCenter))), r === dt && !this._regionMode) {
                const a = Pe(ee(n, this._arcDirection, this._ambiguousArcCenter), e);
                a !== void 0 && o.push({ ...a,
                    polarity: this._polarity,
                    dcode: e == null ? void 0 : e.dcode
                })
            }
            if (r === Ze) {
                const a = Pe(ee(n), e);
                a !== void 0 && o.push({ ...a,
                    polarity: this._polarity,
                    dcode: e == null ? void 0 : e.dcode
                })
            }
            return o
        },
        _setGraphicState(t) {
            if (t.type === vt && (this._arcDirection = En(t.mode)), t.type === on && (this._ambiguousArcCenter = t.quadrant === Ye), t.type === ue && (this._regionMode = t.region), t.type === ie && (this._polarity = t.polarity), t.type === Q) switch (t.graphic) {
                case dt:
                    {
                        this._defaultGraphic = dt;
                        break
                    }
                case st:
                    {
                        this._defaultGraphic = st;
                        break
                    }
                case Y:
                    {
                        this._defaultGraphic = Y;
                        break
                    }
            }
        },
        _plotCurrentPath(t, e, n) {
            if (this._currentPath !== void 0 && (e !== this._currentPath.tool || t.type === ue || t.type === ve || n === st && this._currentPath.region || n === Y || t.type === ie)) {
                const o = bn(this._currentPath.segments);
                return this._currentPath = void 0, o
            }
        }
    },
    _o = {
        _defaultGraphic: Y,
        _ambiguousArcCenter: !0,
        _setGraphicState(t) {
            if (t.type === vt) {
                const {
                    mode: e
                } = t;
                this._arcDirection = En(e), e === ye || e === me || e === Xe ? this._defaultGraphic = dt : e === st ? this._defaultGraphic = st : this._defaultGraphic = Y
            }
            if (t.type === Q) return t.graphic??this._defaultGraphic
        }
    };

function En(t) {
    if (t === me) return Ee;
    if (t === ye) return xn
}

function Oo(t) {
    const e = to(t),
        n = eo(),
        o = ro(),
        r = Eo(t.filetype),
        s = [];
    for (const a of t.children) {
        const u = n.use(a),
            l = o.use(a, e),
            p = r.plot(a, u, l);
        s.push(...p)
    }
    return {
        type: Wr,
        units: e.units,
        tools: n._toolsByCode,
        size: Jr(s),
        children: s
    }
}
const ko = {
    parseGerber(t) {
        const e = Vr(t);
        return Oo(e)
    }
};
fe(ko);