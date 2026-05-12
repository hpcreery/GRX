var dv = Object.defineProperty;
var pv = (e, t, r) => t in e ? dv(e, t, {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: r
}) : e[t] = r;
var ue = (e, t, r) => (pv(e, typeof t != "symbol" ? t + "" : t, r), r);
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const Gu = Symbol("Comlink.proxy"),
    mv = Symbol("Comlink.endpoint"),
    $u = Symbol("Comlink.releaseProxy"),
    Ya = Symbol("Comlink.finalizer"),
    _n = Symbol("Comlink.thrown"),
    Hu = e => typeof e == "object" && e !== null || typeof e == "function",
    gv = {
        canHandle: e => Hu(e) && e[Gu],
        serialize(e) {
            const {
                port1: t,
                port2: r
            } = new MessageChannel;
            return dh(e, t), [r, [r]]
        },
        deserialize(e) {
            return e.start(), Xu(e)
        }
    },
    vv = {
        canHandle: e => Hu(e) && _n in e,
        serialize({
            value: e
        }) {
            let t;
            return e instanceof Error ? t = {
                isError: !0,
                value: {
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                }
            } : t = {
                isError: !1,
                value: e
            }, [t, []]
        },
        deserialize(e) {
            throw e.isError ? Object.assign(new Error(e.value.message), e.value) : e.value
        }
    },
    Vu = new Map([
        ["proxy", gv],
        ["throw", vv]
    ]);

function _v(e, t) {
    for (const r of e)
        if (t === r || r === "*" || r instanceof RegExp && r.test(t)) return !0;
    return !1
}

function dh(e, t = globalThis, r = ["*"]) {
    t.addEventListener("message", function i(s) {
        if (!s || !s.data) return;
        if (!_v(r, s.origin)) {
            console.warn(`Invalid origin '${s.origin}' for comlink proxy`);
            return
        }
        const {
            id: n,
            type: a,
            path: o
        } = Object.assign({
            path: []
        }, s.data), h = (s.data.argumentList || []).map(Yr);
        let l;
        try {
            const c = o.slice(0, -1).reduce((p, m) => p[m], e),
                f = o.reduce((p, m) => p[m], e);
            switch (a) {
                case "GET":
                    l = f;
                    break;
                case "SET":
                    c[o.slice(-1)[0]] = Yr(s.data.value), l = !0;
                    break;
                case "APPLY":
                    l = f.apply(c, h);
                    break;
                case "CONSTRUCT":
                    {
                        const p = new f(...h);l = Tv(p)
                    }
                    break;
                case "ENDPOINT":
                    {
                        const {
                            port1: p,
                            port2: m
                        } = new MessageChannel;dh(e, m),
                        l = Ev(p, [p])
                    }
                    break;
                case "RELEASE":
                    l = void 0;
                    break;
                default:
                    return
            }
        } catch (c) {
            l = {
                value: c,
                [_n]: 0
            }
        }
        Promise.resolve(l).catch(c => ({
            value: c,
            [_n]: 0
        })).then(c => {
            const [f, p] = Pn(c);
            t.postMessage(Object.assign(Object.assign({}, f), {
                id: n
            }), p), a === "RELEASE" && (t.removeEventListener("message", i), zu(t), Ya in e && typeof e[Ya] == "function" && e[Ya]())
        }).catch(c => {
            const [f, p] = Pn({
                value: new TypeError("Unserializable return value"),
                [_n]: 0
            });
            t.postMessage(Object.assign(Object.assign({}, f), {
                id: n
            }), p)
        })
    }), t.start && t.start()
}

function yv(e) {
    return e.constructor.name === "MessagePort"
}

function zu(e) {
    yv(e) && e.close()
}

function Xu(e, t) {
    return To(e, [], t)
}

function Ws(e) {
    if (e) throw new Error("Proxy has been released and is not useable")
}

function ju(e) {
    return Ti(e, {
        type: "RELEASE"
    }).then(() => {
        zu(e)
    })
}
const Rn = new WeakMap,
    Mn = "FinalizationRegistry" in globalThis && new FinalizationRegistry(e => {
        const t = (Rn.get(e) || 0) - 1;
        Rn.set(e, t), t === 0 && ju(e)
    });

function xv(e, t) {
    const r = (Rn.get(t) || 0) + 1;
    Rn.set(t, r), Mn && Mn.register(e, t, e)
}

function bv(e) {
    Mn && Mn.unregister(e)
}

function To(e, t = [], r = function() {}) {
    let i = !1;
    const s = new Proxy(r, {
        get(n, a) {
            if (Ws(i), a === $u) return () => {
                bv(s), ju(e), i = !0
            };
            if (a === "then") {
                if (t.length === 0) return {
                    then: () => s
                };
                const o = Ti(e, {
                    type: "GET",
                    path: t.map(h => h.toString())
                }).then(Yr);
                return o.then.bind(o)
            }
            return To(e, [...t, a])
        },
        set(n, a, o) {
            Ws(i);
            const [h, l] = Pn(o);
            return Ti(e, {
                type: "SET",
                path: [...t, a].map(c => c.toString()),
                value: h
            }, l).then(Yr)
        },
        apply(n, a, o) {
            Ws(i);
            const h = t[t.length - 1];
            if (h === mv) return Ti(e, {
                type: "ENDPOINT"
            }).then(Yr);
            if (h === "bind") return To(e, t.slice(0, -1));
            const [l, c] = pc(o);
            return Ti(e, {
                type: "APPLY",
                path: t.map(f => f.toString()),
                argumentList: l
            }, c).then(Yr)
        },
        construct(n, a) {
            Ws(i);
            const [o, h] = pc(a);
            return Ti(e, {
                type: "CONSTRUCT",
                path: t.map(l => l.toString()),
                argumentList: o
            }, h).then(Yr)
        }
    });
    return xv(s, e), s
}

function wv(e) {
    return Array.prototype.concat.apply([], e)
}

function pc(e) {
    const t = e.map(Pn);
    return [t.map(r => r[0]), wv(t.map(r => r[1]))]
}
const Wu = new WeakMap;

function Ev(e, t) {
    return Wu.set(e, t), e
}

function Tv(e) {
    return Object.assign(e, {
        [Gu]: !0
    })
}

function Pn(e) {
    for (const [t, r] of Vu)
        if (r.canHandle(e)) {
            const [i, s] = r.serialize(e);
            return [{
                type: "HANDLER",
                name: t,
                value: i
            }, s]
        }
    return [{
        type: "RAW",
        value: e
    }, Wu.get(e) || []]
}

function Yr(e) {
    switch (e.type) {
        case "HANDLER":
            return Vu.get(e.name).deserialize(e.value);
        case "RAW":
            return e.value
    }
}

function Ti(e, t, r) {
    return new Promise(i => {
        const s = Av();
        e.addEventListener("message", function n(a) {
            !a.data || !a.data.id || a.data.id !== s || (e.removeEventListener("message", n), i(a.data))
        }), e.start && e.start(), e.postMessage(Object.assign({
            id: s
        }, t), r)
    })
}

function Av() {
    return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-")
}
var Cv = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
    Ao = {},
    Sv = {
        get exports() {
            return Ao
        },
        set exports(e) {
            Ao = e
        }
    };
(function(e) {
    (function(t, r) {
        e.exports ? e.exports = r() : t.moo = r()
    })(Cv, function() {
        var t = Object.prototype.hasOwnProperty,
            r = Object.prototype.toString,
            i = typeof new RegExp().sticky == "boolean";

        function s(E) {
            return E && r.call(E) === "[object RegExp]"
        }

        function n(E) {
            return E && typeof E == "object" && !s(E) && !Array.isArray(E)
        }

        function a(E) {
            return E.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
        }

        function o(E) {
            var D = new RegExp("|" + E);
            return D.exec("").length - 1
        }

        function h(E) {
            return "(" + E + ")"
        }

        function l(E) {
            if (!E.length) return "(?!)";
            var D = E.map(function(N) {
                return "(?:" + N + ")"
            }).join("|");
            return "(?:" + D + ")"
        }

        function c(E) {
            if (typeof E == "string") return "(?:" + a(E) + ")";
            if (s(E)) {
                if (E.ignoreCase) throw new Error("RegExp /i flag not allowed");
                if (E.global) throw new Error("RegExp /g flag is implied");
                if (E.sticky) throw new Error("RegExp /y flag is implied");
                if (E.multiline) throw new Error("RegExp /m flag is implied");
                return E.source
            } else throw new Error("Not a pattern: " + E)
        }

        function f(E, D) {
            return E.length > D ? E : Array(D - E.length + 1).join(" ") + E
        }

        function p(E, D) {
            for (var N = E.length, R = 0;;) {
                var j = E.lastIndexOf(`
`, N - 1);
                if (j === -1 || (R++, N = j, R === D) || N === 0) break
            }
            var H = R < D ? 0 : N + 1;
            return E.substring(H).split(`
`)
        }

        function m(E) {
            for (var D = Object.getOwnPropertyNames(E), N = [], R = 0; R < D.length; R++) {
                var j = D[R],
                    H = E[j],
                    U = [].concat(H);
                if (j === "include") {
                    for (var it = 0; it < U.length; it++) N.push({
                        include: U[it]
                    });
                    continue
                }
                var at = [];
                U.forEach(function(O) {
                    n(O) ? (at.length && N.push(_(j, at)), N.push(_(j, O)), at = []) : at.push(O)
                }), at.length && N.push(_(j, at))
            }
            return N
        }

        function v(E) {
            for (var D = [], N = 0; N < E.length; N++) {
                var R = E[N];
                if (R.include) {
                    for (var j = [].concat(R.include), H = 0; H < j.length; H++) D.push({
                        include: j[H]
                    });
                    continue
                }
                if (!R.type) throw new Error("Rule has no type: " + JSON.stringify(R));
                D.push(_(R.type, R))
            }
            return D
        }

        function _(E, D) {
            if (n(D) || (D = {
                    match: D
                }), D.include) throw new Error("Matching rules cannot also include states");
            var N = {
                defaultType: E,
                lineBreaks: !!D.error || !!D.fallback,
                pop: !1,
                next: null,
                push: null,
                error: !1,
                fallback: !1,
                value: null,
                type: null,
                shouldThrow: !1
            };
            for (var R in D) t.call(D, R) && (N[R] = D[R]);
            if (typeof N.type == "string" && E !== N.type) throw new Error("Type transform cannot be a string (type '" + N.type + "' for token '" + E + "')");
            var j = N.match;
            return N.match = Array.isArray(j) ? j : j ? [j] : [], N.match.sort(function(H, U) {
                return s(H) && s(U) ? 0 : s(U) ? -1 : s(H) ? 1 : U.length - H.length
            }), N
        }

        function y(E) {
            return Array.isArray(E) ? v(E) : m(E)
        }
        var A = _("error", {
            lineBreaks: !0,
            shouldThrow: !0
        });

        function I(E, D) {
            for (var N = null, R = Object.create(null), j = !0, H = null, U = [], it = [], at = 0; at < E.length; at++) E[at].fallback && (j = !1);
            for (var at = 0; at < E.length; at++) {
                var O = E[at];
                if (O.include) throw new Error("Inheritance is not allowed in stateless lexers");
                if (O.error || O.fallback) {
                    if (N) throw !O.fallback == !N.fallback ? new Error("Multiple " + (O.fallback ? "fallback" : "error") + " rules not allowed (for token '" + O.defaultType + "')") : new Error("fallback and error are mutually exclusive (for token '" + O.defaultType + "')");
                    N = O
                }
                var Z = O.match.slice();
                if (j)
                    for (; Z.length && typeof Z[0] == "string" && Z[0].length === 1;) {
                        var ut = Z.shift();
                        R[ut.charCodeAt(0)] = O
                    }
                if (O.pop || O.push || O.next) {
                    if (!D) throw new Error("State-switching options are not allowed in stateless lexers (for token '" + O.defaultType + "')");
                    if (O.fallback) throw new Error("State-switching options are not allowed on fallback tokens (for token '" + O.defaultType + "')")
                }
                if (Z.length !== 0) {
                    j = !1, U.push(O);
                    for (var ft = 0; ft < Z.length; ft++) {
                        var dt = Z[ft];
                        if (s(dt)) {
                            if (H === null) H = dt.unicode;
                            else if (H !== dt.unicode && O.fallback === !1) throw new Error("If one rule is /u then all must be")
                        }
                    }
                    var Nt = l(Z.map(c)),
                        xt = new RegExp(Nt);
                    if (xt.test("")) throw new Error("RegExp matches empty string: " + xt);
                    var Dt = o(Nt);
                    if (Dt > 0) throw new Error("RegExp has capture groups: " + xt + `
Use (?: … ) instead`);
                    if (!O.lineBreaks && xt.test(`
`)) throw new Error("Rule should declare lineBreaks: " + xt);
                    it.push(h(Nt))
                }
            }
            var Ft = N && N.fallback,
                zt = i && !Ft ? "ym" : "gm",
                Ut = i || Ft ? "" : "|";
            H === !0 && (zt += "u");
            var Pt = new RegExp(l(it) + Ut, zt);
            return {
                regexp: Pt,
                groups: U,
                fast: R,
                error: N || A
            }
        }

        function x(E) {
            var D = I(y(E));
            return new G({
                start: D
            }, "start")
        }

        function S(E, D, N) {
            var R = E && (E.push || E.next);
            if (R && !N[R]) throw new Error("Missing state '" + R + "' (in token '" + E.defaultType + "' of state '" + D + "')");
            if (E && E.pop && +E.pop != 1) throw new Error("pop must be 1 (in token '" + E.defaultType + "' of state '" + D + "')")
        }

        function $(E, D) {
            var N = E.$all ? y(E.$all) : [];
            delete E.$all;
            var R = Object.getOwnPropertyNames(E);
            D || (D = R[0]);
            for (var j = Object.create(null), H = 0; H < R.length; H++) {
                var U = R[H];
                j[U] = y(E[U]).concat(N)
            }
            for (var H = 0; H < R.length; H++)
                for (var U = R[H], it = j[U], at = Object.create(null), O = 0; O < it.length; O++) {
                    var Z = it[O];
                    if (Z.include) {
                        var ut = [O, 1];
                        if (Z.include !== U && !at[Z.include]) {
                            at[Z.include] = !0;
                            var ft = j[Z.include];
                            if (!ft) throw new Error("Cannot include nonexistent state '" + Z.include + "' (in state '" + U + "')");
                            for (var dt = 0; dt < ft.length; dt++) {
                                var Nt = ft[dt];
                                it.indexOf(Nt) === -1 && ut.push(Nt)
                            }
                        }
                        it.splice.apply(it, ut), O--
                    }
                }
            for (var xt = Object.create(null), H = 0; H < R.length; H++) {
                var U = R[H];
                xt[U] = I(j[U], !0)
            }
            for (var H = 0; H < R.length; H++) {
                for (var Dt = R[H], Ft = xt[Dt], zt = Ft.groups, O = 0; O < zt.length; O++) S(zt[O], Dt, xt);
                for (var Ut = Object.getOwnPropertyNames(Ft.fast), O = 0; O < Ut.length; O++) S(Ft.fast[Ut[O]], Dt, xt)
            }
            return new G(xt, D)
        }

        function k(E) {
            for (var D = typeof Map < "u", N = D ? new Map : Object.create(null), R = Object.getOwnPropertyNames(E), j = 0; j < R.length; j++) {
                var H = R[j],
                    U = E[H],
                    it = Array.isArray(U) ? U : [U];
                it.forEach(function(at) {
                    if (typeof at != "string") throw new Error("keyword must be string (in keyword '" + H + "')");
                    D ? N.set(at, H) : N[at] = H
                })
            }
            return function(at) {
                return D ? N.get(at) : N[at]
            }
        }
        var G = function(E, D) {
            this.startState = D, this.states = E, this.buffer = "", this.stack = [], this.reset()
        };
        G.prototype.reset = function(E, D) {
            return this.buffer = E || "", this.index = 0, this.line = D ? D.line : 1, this.col = D ? D.col : 1, this.queuedToken = D ? D.queuedToken : null, this.queuedText = D ? D.queuedText : "", this.queuedThrow = D ? D.queuedThrow : null, this.setState(D ? D.state : this.startState), this.stack = D && D.stack ? D.stack.slice() : [], this
        }, G.prototype.save = function() {
            return {
                line: this.line,
                col: this.col,
                state: this.state,
                stack: this.stack.slice(),
                queuedToken: this.queuedToken,
                queuedText: this.queuedText,
                queuedThrow: this.queuedThrow
            }
        }, G.prototype.setState = function(E) {
            if (!(!E || this.state === E)) {
                this.state = E;
                var D = this.states[E];
                this.groups = D.groups, this.error = D.error, this.re = D.regexp, this.fast = D.fast
            }
        }, G.prototype.popState = function() {
            this.setState(this.stack.pop())
        }, G.prototype.pushState = function(E) {
            this.stack.push(this.state), this.setState(E)
        };
        var L = i ? function(E, D) {
            return E.exec(D)
        } : function(E, D) {
            var N = E.exec(D);
            return N[0].length === 0 ? null : N
        };
        G.prototype._getGroup = function(E) {
            for (var D = this.groups.length, N = 0; N < D; N++)
                if (E[N + 1] !== void 0) return this.groups[N];
            throw new Error("Cannot find token type for matched text")
        };

        function Y() {
            return this.value
        }
        if (G.prototype.next = function() {
                var E = this.index;
                if (this.queuedGroup) {
                    var D = this._token(this.queuedGroup, this.queuedText, E);
                    return this.queuedGroup = null, this.queuedText = "", D
                }
                var N = this.buffer;
                if (E !== N.length) {
                    var U = this.fast[N.charCodeAt(E)];
                    if (U) return this._token(U, N.charAt(E), E);
                    var R = this.re;
                    R.lastIndex = E;
                    var j = L(R, N),
                        H = this.error;
                    if (j == null) return this._token(H, N.slice(E, N.length), E);
                    var U = this._getGroup(j),
                        it = j[0];
                    return H.fallback && j.index !== E ? (this.queuedGroup = U, this.queuedText = it, this._token(H, N.slice(E, j.index), E)) : this._token(U, it, E)
                }
            }, G.prototype._token = function(E, D, N) {
                var R = 0;
                if (E.lineBreaks) {
                    var j = /\n/g,
                        H = 1;
                    if (D === `
`) R = 1;
                    else
                        for (; j.exec(D);) R++, H = j.lastIndex
                }
                var U = {
                        type: typeof E.type == "function" && E.type(D) || E.defaultType,
                        value: typeof E.value == "function" ? E.value(D) : D,
                        text: D,
                        toString: Y,
                        offset: N,
                        lineBreaks: R,
                        line: this.line,
                        col: this.col
                    },
                    it = D.length;
                if (this.index += it, this.line += R, R !== 0 ? this.col = it - H + 1 : this.col += it, E.shouldThrow) {
                    var at = new Error(this.formatError(U, "invalid syntax"));
                    throw at
                }
                return E.pop ? this.popState() : E.push ? this.pushState(E.push) : E.next && this.setState(E.next), U
            }, typeof Symbol < "u" && Symbol.iterator) {
            var et = function(E) {
                this.lexer = E
            };
            et.prototype.next = function() {
                var E = this.lexer.next();
                return {
                    value: E,
                    done: !E
                }
            }, et.prototype[Symbol.iterator] = function() {
                return this
            }, G.prototype[Symbol.iterator] = function() {
                return new et(this)
            }
        }
        return G.prototype.formatError = function(R, D) {
            if (R == null) var N = this.buffer.slice(this.index),
                R = {
                    text: N,
                    offset: this.index,
                    lineBreaks: N.indexOf(`
`) === -1 ? 0 : 1,
                    line: this.line,
                    col: this.col
                };
            var j = 2,
                H = Math.max(R.line - j, 1),
                U = R.line + j,
                it = String(U).length,
                at = p(this.buffer, this.line - R.line + j + 1).slice(0, 5),
                O = [];
            O.push(D + " at line " + R.line + " col " + R.col + ":"), O.push("");
            for (var Z = 0; Z < at.length; Z++) {
                var ut = at[Z],
                    ft = H + Z;
                O.push(f(String(ft), it) + "  " + ut), ft === R.line && O.push(f("", it + R.col + 1) + "^")
            }
            return O.join(`
`)
        }, G.prototype.clone = function() {
            return new G(this.states, this.state)
        }, G.prototype.has = function(E) {
            return !0
        }, {
            compile: x,
            states: $,
            error: Object.freeze({
                error: !0
            }),
            fallback: Object.freeze({
                fallback: !0
            }),
            keywords: k
        }
    })
})(Sv);
const Iv = Ao,
    ps = "T_CODE",
    St = "G_CODE",
    Pr = "M_CODE",
    er = "D_CODE",
    kt = "ASTERISK",
    ce = "PERCENT",
    Yu = "EQUALS",
    Li = "COMMA",
    qr = "OPERATOR",
    Co = "GERBER_FORMAT",
    Nn = "GERBER_UNITS",
    qu = "GERBER_TOOL_MACRO",
    Zu = "GERBER_TOOL_DEF",
    Ku = "GERBER_LOAD_POLARITY",
    Ju = "GERBER_STEP_REPEAT",
    vs = "GERBER_MACRO_VARIABLE",
    Qu = "SEMICOLON",
    tf = "DRILL_UNITS",
    So = "DRILL_ZERO_INCLUSION",
    Yt = "COORD_CHAR",
    Zt = "NUMBER",
    Rv = "WORD",
    Mv = "WHITESPACE",
    We = "NEWLINE",
    Pv = "CATCHALL",
    Nv = "ERROR",
    Dv = /^0*/,
    ef = e => e.replace(Dv, ""),
    Ys = e => {
        const t = ef(e.slice(1));
        return t === "" ? "0" : t
    };
ps + "", St + "", Pr + "", er + "", kt + "", ce + "", Yu + "", Co + "", Nn + "", qu + "", Zu + "", Ku + "", Ju + "", vs + "", Qu + "", tf + "", So + "", Yt + "", Zt + "", qr + "", Li + "", Rv + "", Mv + "", We + "", Pv + "", Nv + "", Iv.error;
const Bv = "gerber",
    rf = "drill",
    Qn = "mm",
    Rs = "in",
    sf = "leading",
    nf = "trailing",
    Ov = "absolute",
    Fv = "incremental",
    ta = "circle",
    ph = "rectangle",
    Io = "obround",
    af = "polygon",
    kv = "macroShape",
    Lv = "1",
    Uv = "2",
    Gv = "20",
    $v = "21",
    Hv = "22",
    Vv = "4",
    zv = "5",
    Xv = "6",
    jv = "7",
    Wv = "shape",
    of = "move",
    Yv = "segment",
    qv = "slot",
    Zv = "line",
    Kv = "cwArc",
    Jv = "ccwArc",
    Qv = "single",
    t_ = "multi",
    Le = "dark",
    hf = "clear",
    ea = "TOKEN",
    Yi = "MIN_TO_MAX";

function B(e, t) {
    return {
        rule: ea,
        type: e,
        value: t
    }
}

function Kr(e, t) {
    return {
        rule: ea,
        type: e,
        value: t,
        negate: !0
    }
}

function Or(e) {
    return {
        rule: Yi,
        min: 1,
        max: 1,
        match: e
    }
}

function Ui(e) {
    return {
        rule: Yi,
        min: 0,
        max: 1,
        match: e
    }
}

function or(e) {
    return {
        rule: Yi,
        min: 0,
        max: Number.POSITIVE_INFINITY,
        match: e
    }
}

function lf(e) {
    return {
        rule: Yi,
        min: 1,
        max: Number.POSITIVE_INFINITY,
        match: e
    }
}

function Jr(e, t, r) {
    return {
        rule: Yi,
        min: e,
        max: t,
        match: r
    }
}

function e_(e, t) {
    const r = [];
    for (const i of t) {
        const s = i_(e, i.rules);
        if (s === uf) r.push(i);
        else if (s === cf) return {
            filetype: i.filetype,
            nodes: i.createNodes(e)
        }
    }
    return r.length > 0 ? {
        candidates: r,
        tokens: e
    } : {}
}
const cf = "FULL_MATCH",
    uf = "PARTIAL_MATCH",
    r_ = "NO_MATCH";

function i_(e, t) {
    let r = 0,
        i = 0,
        s = 0;
    for (; r < t.length && i < e.length;) {
        const n = t[r],
            a = e[i];
        if (ff(n, a)) n.rule === ea || s >= n.max - 1 ? (r++, i++, s = 0) : (i++, s++);
        else if (n.rule === Yi && s >= n.min) s = 0, r++;
        else return r_
    }
    return r < t.length ? uf : cf
}

function ff(e, t) {
    if (e.rule === ea) {
        const r = e.type === t.type,
            i = e.value === null || e.value === void 0 || typeof e.value == "string" && e.value === t.value || e.value instanceof RegExp && e.value.test(t.value),
            s = r && i;
        return e.negate === !0 ? !s : s
    }
    return Array.isArray(e.match) ? e.match.some(r => ff(r, t)) : !1
}
const df = "comment",
    s_ = "drillHeader",
    pf = "done",
    mh = "units",
    mf = "coordinateFormat",
    gf = "toolDefinition",
    n_ = "toolMacro",
    gh = "toolChange",
    a_ = "loadPolarity",
    o_ = "stepRepeat",
    vh = "graphic",
    ra = "interpolateMode",
    h_ = "regionMode",
    l_ = "quadrantMode",
    c_ = "unimplemented",
    u_ = "macroComment",
    vf = "macroVariable",
    _f = "macroPrimitive";

function Qr(e) {
    return Object.fromEntries(e.map((t, r) => [t, r > 0 ? e[r - 1] : void 0]).filter(t => {
        const [r, i] = t;
        return r.type === Zt && (i == null ? void 0 : i.type) === Yt
    }).map(([t, r]) => [r.value.toLowerCase(), t.value]))
}

function ia(e) {
    const t = e.filter(r => r.type === St).map(r => r.value === "0" ? of : r.value === "1" ? Zv : r.value === "2" ? Kv : r.value === "3" ? Jv : r.value === "5" ? rf : !1);
    return typeof t[0] == "string" ? t[0] : void 0
}

function f_(e) {
    const t = e.filter(r => r.type === er).map(r => r.value === "1" ? Yv : r.value === "2" ? of : r.value === "3" ? Wv : !1);
    return typeof t[0] == "string" ? t[0] : void 0
}

function _h(e) {
    return e.map(t => t.value).join("").trim()
}

function It(e, t = {}) {
    const {
        head: r = e[0],
        length: i = 0
    } = t, s = i > 0 ? e[e.indexOf(r) + i - 1] : e[e.length - 1];
    return {
        start: {
            line: r.line,
            column: r.col,
            offset: r.offset
        },
        end: {
            line: s.line,
            column: s.col,
            offset: s.offset
        }
    }
}
const d_ = {
        name: "units",
        rules: [Or([B(tf), B(Pr, "71"), B(Pr, "72")]), or([B(Li), B(So), B(Zt, /^0{1,8}\.0{1,8}$/)]), B(We)],
        createNodes(e) {
            const t = e[0].value === "INCH" || e[0].value === "72" ? Rs : Qn,
                r = e.filter(n => n.type === So).map(n => n.value === "LZ" ? nf : sf),
                i = e.filter(n => n.type === Zt).map(n => {
                    const [a = "", o = ""] = n.value.split(".");
                    return [a.length, o.length]
                }),
                s = [{
                    type: mh,
                    position: It(e.slice(0, 2)),
                    units: t
                }];
            return (r.length > 0 || i.length > 0) && s.push({
                type: mf,
                position: It(e.slice(1)),
                mode: void 0,
                format: i[0],
                zeroSuppression: r[0]
            }), s
        }
    },
    p_ = {
        name: "tool",
        rules: [B(ps), Jr(0, 12, [B(Yt, "C"), B(Yt, "F"), B(Yt, "S"), B(Yt, "B"), B(Yt, "H"), B(Yt, "Z"), B(Zt)]), B(We)],
        createNodes(e) {
            const t = e[0].value,
                r = It(e),
                {
                    c: i
                } = Qr(e.slice(1, -1));
            return i === void 0 ? [{
                type: gh,
                position: r,
                code: t
            }] : [{
                type: gf,
                shape: {
                    type: ta,
                    diameter: Number(i)
                },
                hole: void 0,
                position: r,
                code: t
            }]
        }
    },
    m_ = {
        name: "operationMode",
        rules: [Or([B(St, "0"), B(St, "1"), B(St, "2"), B(St, "3"), B(St, "5")]), B(We)],
        createNodes: e => [{
            type: ra,
            position: It(e),
            mode: ia(e)
        }]
    },
    g_ = {
        name: "operation",
        rules: [Jr(0, 2, [B(ps), B(St, "0"), B(St, "1"), B(St, "2"), B(St, "3"), B(St, "5")]), Jr(2, 8, [B(Yt), B(Zt)]), Ui([B(ps)]), B(We)],
        createNodes(e) {
            const t = e.filter(f => f.type === Yt || f.type === Zt),
                r = e.find(f => f.type === St),
                i = e.find(f => f.type === ps),
                s = Qr(t),
                n = i == null ? void 0 : i.value,
                a = ia(e),
                o = It(e, {
                    head: t[0],
                    length: t.length + 1
                }),
                h = It(e, {
                    head: r,
                    length: 2
                }),
                l = It(e, {
                    head: i,
                    length: 2
                }),
                c = [{
                    type: vh,
                    position: o,
                    graphic: void 0,
                    coordinates: s
                }];
            return a !== void 0 && c.unshift({
                type: ra,
                position: h,
                mode: a
            }), n !== void 0 && c.unshift({
                type: gh,
                position: l,
                code: n
            }), c
        }
    },
    v_ = {
        name: "slot",
        rules: [Jr(2, 4, [B(Yt), B(Zt)]), B(St, "85"), Jr(2, 4, [B(Yt), B(Zt)]), B(We)],
        createNodes(e) {
            const t = e.find(n => n.type === St),
                r = t === void 0 ? -1 : e.indexOf(t),
                i = Object.fromEntries(Object.entries(Qr(e.slice(0, r))).map(([n, a]) => [`${n}0`, a])),
                s = Qr(e.slice(r));
            return [{
                type: vh,
                position: It(e),
                graphic: qv,
                coordinates: { ...i,
                    ...s
                }
            }]
        }
    },
    __ = {
        name: "done",
        rules: [Or([B(Pr, "30"), B(Pr, "0")]), B(We)],
        createNodes: e => [{
            type: pf,
            position: It(e)
        }]
    },
    y_ = {
        name: "header",
        rules: [Or([B(Pr, "48"), B(ce)]), B(We)],
        createNodes: e => [{
            type: s_,
            position: It(e)
        }]
    },
    x_ = {
        name: "comment",
        rules: [B(Qu), or([Kr(We)]), B(We)],
        createNodes: e => [{
            type: df,
            comment: _h(e.slice(1, -1)),
            position: It(e)
        }]
    };
[p_, m_, g_, v_, x_, d_, __, y_].map(e => ({ ...e,
    filetype: rf
}));
const b_ = {
        name: "macroComment",
        rules: [B(Zt, "0"), or([Kr(kt)]), B(kt)],
        createNodes: T_
    },
    w_ = {
        name: "macroVariable",
        rules: [B(vs), B(Yu), lf([B(Zt), B(qr), B(vs), B(Yt, "X")]), B(kt)],
        createNodes: C_
    },
    E_ = {
        name: "macroPrimitive",
        rules: [B(Zt), B(Li), lf([B(We), B(Li), B(Zt), B(qr), B(vs), B(Yt, "X")]), B(kt)],
        createNodes: A_
    };

function T_(e) {
    const t = e.slice(1, -1).map(r => r.text).join("").trim();
    return [{
        type: u_,
        position: It(e),
        comment: t
    }]
}

function A_(e) {
    const t = e[0].value,
        r = [
            []
        ];
    let i = r[0];
    for (const n of e.slice(2, -1)) n.type === Li ? (i = [], r.push(i)) : i.push(n);
    const s = r.map(n => yf(n));
    return [{
        type: _f,
        position: It(e),
        code: t,
        parameters: s
    }]
}

function C_(e) {
    const t = e[0].value,
        r = yf(e.slice(2, -1));
    return [{
        type: vf,
        position: It(e),
        name: t,
        value: r
    }]
}

function yf(e) {
    const t = e.map(a => a.type === Yt ? Object.assign(a, {
        type: qr,
        value: "x"
    }) : a);
    return n();

    function r() {
        return t[0]
    }

    function i() {
        const a = t.shift();
        if ((a == null ? void 0 : a.type) === Zt) return Number(a.value);
        if ((a == null ? void 0 : a.type) === vs) return a.value;
        const o = n();
        return t.shift(), o
    }

    function s() {
        let a = i(),
            o = r();
        for (;
            (o == null ? void 0 : o.type) === qr && (o.value === "x" || o.value === "/");) t.shift(), a = {
            left: a,
            right: i(),
            operator: o.value
        }, o = r();
        return a
    }

    function n() {
        let a = s(),
            o = r();
        for (;
            (o == null ? void 0 : o.type) === qr && (o.value === "+" || o.value === "-") || (o == null ? void 0 : o.type) === Zt;) {
            let h = "+";
            o.type === qr && (t.shift(), h = o.value);
            const l = s();
            a = {
                left: a,
                right: l,
                operator: h
            }, o = r()
        }
        return a
    }
}
const mc = [E_, w_, b_];

function S_(e) {
    let t = mc,
        r = [];
    const i = [];
    for (const s of e) {
        r.push(s);
        const n = e_(r, t);
        n.nodes !== void 0 && i.push(...n.nodes), r = n.tokens??[], t = n.candidates??mc
    }
    return i
}
const qa = e => {
        if (e.length === 1) {
            const [t] = e;
            return {
                type: ta,
                diameter: t
            }
        }
        if (e.length === 2) {
            const [t, r] = e;
            return {
                type: ph,
                xSize: t,
                ySize: r
            }
        }
    },
    I_ = {
        name: "done",
        rules: [Or([B(Pr, "0"), B(Pr, "2")]), B(kt)],
        createNodes: e => [{
            type: pf,
            position: It(e)
        }]
    },
    R_ = {
        name: "comment",
        rules: [B(St, "4"), or([Kr(kt)]), B(kt)],
        createNodes: e => [{
            type: df,
            position: It(e),
            comment: _h(e.slice(1, -1))
        }]
    },
    M_ = {
        name: "format",
        rules: [B(ce), B(Co), or([Kr(Yt, "X")]), B(Yt, "X"), B(Zt), B(Yt, "Y"), B(Zt), or([Kr(kt)]), B(kt), Jr(0, 2, [B(Nn), B(kt)]), B(ce)],
        createNodes(e) {
            var t;
            let r, i, s;
            const n = Qr(e),
                a = e.findIndex(l => l.type === kt),
                o = e.find(l => l.type === Nn);
            for (const l of e.filter(c => c.type === Co)) l.value.includes("T") && (i = nf), l.value.includes("L") && (i = sf), l.value.includes("I") && (s = Fv), l.value.includes("A") && (s = Ov);
            if (n.x === n.y && ((t = n.x) == null ? void 0 : t.length) === 2) {
                const l = Number(n.x[0]),
                    c = Number(n.x[1]);
                l > 0 && c > 0 && (r = [l, c])
            }
            const h = [{
                type: mf,
                position: It(e.slice(1, a + 1)),
                zeroSuppression: i,
                format: r,
                mode: s
            }];
            return o !== void 0 && h.push({
                type: mh,
                position: It(e.slice(1, -1), {
                    head: o
                }),
                units: o.value === "MM" ? Qn : Rs
            }), h
        }
    },
    P_ = {
        name: "units",
        rules: [B(ce), B(Nn), B(kt), B(ce)],
        createNodes: e => [{
            type: mh,
            position: It(e.slice(1, -1)),
            units: e[1].value === "MM" ? Qn : Rs
        }]
    },
    N_ = {
        name: "toolMacro",
        rules: [B(ce), B(qu), B(kt), or([Kr(ce)]), B(ce)],
        createNodes(e) {
            const t = e[1].value,
                r = It(e.slice(1, -1)),
                i = e.slice(3, -1);
            return [{
                type: n_,
                position: r,
                children: S_(i),
                name: t
            }]
        }
    },
    D_ = {
        name: "toolDefinition",
        rules: [B(ce), B(Zu), or([B(Li), B(Zt), B(Yt, "X")]), B(kt), B(ce)],
        createNodes(e) {
            let t, r;
            const i = /(\d+)(.+)/.exec(e[1].value),
                [, s = "", n = ""] = i??[],
                a = e.slice(3, -2).filter(o => o.type === Zt).map(o => Number(o.value));
            switch (n) {
                case "C":
                    {
                        const [o, ...h] = a;t = {
                            type: ta,
                            diameter: o
                        },
                        r = qa(h);
                        break
                    }
                case "R":
                case "O":
                    {
                        const [o, h, ...l] = a;t = {
                            type: n === "R" ? ph : Io,
                            xSize: o,
                            ySize: h
                        },
                        r = qa(l);
                        break
                    }
                case "P":
                    {
                        const [o, h, l, ...c] = a;t = {
                            type: af,
                            diameter: o,
                            vertices: h,
                            rotation: l
                        },
                        r = qa(c);
                        break
                    }
                default:
                    t = {
                        type: kv,
                        name: n,
                        variableValues: a
                    }
            }
            return [{
                type: gf,
                position: It(e.slice(1, -1)),
                code: s,
                shape: t,
                hole: r
            }]
        }
    },
    B_ = {
        name: "toolChange",
        rules: [Ui([B(St, "54")]), B(er), B(kt)],
        createNodes: e => e.filter(({
            type: t
        }) => t === er).map(({
            value: t
        }) => ({
            type: gh,
            position: It(e),
            code: t
        }))
    },
    xf = e => {
        const t = f_(e),
            r = Qr(e),
            i = ia(e),
            s = It(e, {
                head: i === void 0 ? e[0] : e[1]
            }),
            n = Object.keys(r).length > 0 || t !== void 0 ? [{
                type: vh,
                position: s,
                graphic: t,
                coordinates: r
            }] : [];
        if (i !== void 0) {
            const a = It(e, {
                head: e[0],
                length: 2
            });
            n.unshift({
                type: ra,
                position: a,
                mode: i
            })
        }
        return n
    },
    O_ = {
        name: "operation",
        rules: [Ui([B(St, "1"), B(St, "2"), B(St, "3")]), Jr(2, 8, [B(Yt), B(Zt)]), Ui([B(er, "1"), B(er, "2"), B(er, "3")]), B(kt)],
        createNodes: xf
    },
    F_ = {
        name: "operationWithoutCoords",
        rules: [Ui([B(St, "1"), B(St, "2"), B(St, "3")]), Ui([B(er, "1"), B(er, "2"), B(er, "3")]), B(kt)],
        createNodes: xf
    },
    k_ = {
        name: "interpolationMode",
        rules: [Or([B(St, "1"), B(St, "2"), B(St, "3")]), B(kt)],
        createNodes: e => [{
            type: ra,
            position: It(e),
            mode: ia(e)
        }]
    },
    L_ = {
        name: "regionMode",
        rules: [Or([B(St, "36"), B(St, "37")]), B(kt)],
        createNodes: e => [{
            type: h_,
            position: It(e),
            region: e[0].value === "36"
        }]
    },
    U_ = {
        name: "quadrantMode",
        rules: [Or([B(St, "74"), B(St, "75")]), B(kt)],
        createNodes: e => [{
            type: l_,
            position: It(e),
            quadrant: e[0].value === "74" ? Qv : t_
        }]
    },
    G_ = {
        name: "loadPolarity",
        rules: [B(ce), B(Ku), B(kt), B(ce)],
        createNodes: e => [{
            type: a_,
            position: It(e.slice(1, -1)),
            polarity: e[1].value === "D" ? Le : hf
        }]
    },
    $_ = {
        name: "stepRepeat",
        rules: [B(ce), B(Ju), or([B(Yt), B(Zt)]), B(kt), B(ce)],
        createNodes(e) {
            const t = Qr(e),
                r = Object.fromEntries(Object.entries(t).map(([i, s]) => [i, Number(s)]));
            return [{
                type: o_,
                position: It(e.slice(1, -1)),
                stepRepeat: r
            }]
        }
    },
    H_ = {
        name: "unimplementedExtendedCommand",
        rules: [B(ce), or([Kr(kt)]), B(kt), B(ce)],
        createNodes: e => [{
            type: c_,
            position: It(e.slice(1, -1)),
            value: _h(e)
        }]
    };
[O_, F_, k_, B_, D_, N_, R_, L_, U_, G_, $_, M_, P_, I_, H_].map(e => ({ ...e,
    filetype: Bv
}));
const yn = "imageShape",
    bf = "imagePath",
    Ht = "line",
    Ge = "arc",
    Gi = "circle",
    Dn = "rectangle",
    Ye = "polygon",
    _s = "outline",
    Bn = "layeredShape",
    {
        PI: $i
    } = Math,
    xn = $i / 2,
    V_ = 3 * xn,
    ys = 2 * $i;

function wf(e) {
    return e * $i / 180
}

function rr(e, t, r = 0) {
    const i = wf(r),
        [s, n] = [Math.sin(i), Math.cos(i)],
        [a, o] = e,
        h = a * n - o * s + t[0],
        l = a * s + o * n + t[1];
    return [h, l]
}

function bn(e, t) {
    return e[0] === t[0] && e[1] === t[1]
}
const z_ = "simpleTool",
    X_ = "macroTool";

function gc(e, t) {
    const {
        x: r,
        y: i
    } = t;
    switch (e.type) {
        case ta:
            {
                const {
                    diameter: s
                } = e;
                return {
                    type: Gi,
                    cx: r,
                    cy: i,
                    r: s / 2
                }
            }
        case ph:
        case Io:
            {
                const {
                    xSize: s,
                    ySize: n
                } = e,
                a = s / 2,
                o = n / 2,
                h = {
                    type: Dn,
                    x: r - a,
                    y: i - o,
                    xSize: s,
                    ySize: n
                };
                return e.type === Io && (h.r = Math.min(a, o)),
                h
            }
        case af:
            {
                const {
                    diameter: s,
                    rotation: n,
                    vertices: a
                } = e,
                o = s / 2,
                h = wf(n??0),
                l = ys / a,
                c = Array.from({
                    length: a
                }).map((f, p) => {
                    const m = l * p + h,
                        v = r + o * Math.cos(m),
                        _ = i + o * Math.sin(m);
                    return [v, _]
                });
                return {
                    type: Ye,
                    points: c
                }
            }
    }
}

function vc(e) {
    if (e.type === Gi) {
        const {
            cx: t,
            cy: r,
            r: i
        } = e;
        return [{
            type: Ge,
            start: [t + i, r, 0],
            end: [t + i, r, ys],
            center: [t, r],
            radius: i
        }]
    }
    if (e.type === Dn) {
        const {
            x: t,
            y: r,
            xSize: i,
            ySize: s,
            r: n
        } = e;
        return n === i / 2 ? [{
            type: Ht,
            start: [t + i, r + n],
            end: [t + i, r + s - n]
        }, {
            type: Ge,
            start: [t + i, r + s - n, 0],
            end: [t, r + s - n, $i],
            center: [t + n, r + s - n],
            radius: n
        }, {
            type: Ht,
            start: [t, r + s - n],
            end: [t, r + n]
        }, {
            type: Ge,
            start: [t, r + n, $i],
            end: [t + i, r + n, ys],
            center: [t + n, r + n],
            radius: n
        }] : n === s / 2 ? [{
            type: Ht,
            start: [t + n, r],
            end: [t + i - n, r]
        }, {
            type: Ge,
            start: [t + i - n, r, -xn],
            end: [t + i - n, r + s, xn],
            center: [t + i - n, r + n],
            radius: n
        }, {
            type: Ht,
            start: [t + i - n, r + s],
            end: [t + n, r + s]
        }, {
            type: Ge,
            start: [t + n, r + s, xn],
            end: [t + n, r, V_],
            center: [t + n, r + n],
            radius: n
        }] : [{
            type: Ht,
            start: [t, r],
            end: [t + i, r]
        }, {
            type: Ht,
            start: [t + i, r],
            end: [t + i, r + s]
        }, {
            type: Ht,
            start: [t + i, r + s],
            end: [t, r + s]
        }, {
            type: Ht,
            start: [t, r + s],
            end: [t, r]
        }]
    }
    return e.type === Ye ? e.points.map((t, r) => {
        const i = r < e.points.length - 1 ? r + 1 : 0;
        return {
            type: Ht,
            start: t,
            end: e.points[i]
        }
    }) : e.segments
}

function j_(e, t) {
    const {
        shape: r,
        hole: i
    } = e, s = gc(r, t.endPoint);
    if (i !== void 0) {
        const n = gc(i, t.endPoint);
        return {
            type: Bn,
            shapes: [{
                type: _s,
                erase: !1,
                segments: vc(s)
            }, {
                type: _s,
                erase: !0,
                segments: vc(n)
            }]
        }
    }
    return s
}
const W_ = "cw",
    Ef = "ccw";

function _c(e, t, r, i) {
    let s = Math.atan2(e.y - r.y, e.x - r.x),
        n = Math.atan2(t.y - r.y, t.x - r.x);
    return i === Ef ? n = n > s ? n : n + ys : s = s > n ? s : s + ys, [
        [e.x, e.y, s],
        [t.x, t.y, n],
        [r.x, r.y]
    ]
}

function Y_(e, t) {
    const r = [],
        i = Object.fromEntries(e.variableValues.map((s, n) => [`$${n+1}`, s]));
    for (const s of e.macro)
        if (s.type === vf && (i[s.name] = On(s.value, i)), s.type === _f) {
            const n = [t.endPoint.x, t.endPoint.y],
                a = s.parameters.map(o => On(o, i));
            r.push(...q_(s.code, n, a))
        }
    return {
        type: Bn,
        shapes: r
    }
}

function On(e, t) {
    if (typeof e == "number") return e;
    if (typeof e == "string") return t[e];
    const r = On(e.left, t),
        i = On(e.right, t);
    switch (e.operator) {
        case "+":
            return r + i;
        case "-":
            return r - i;
        case "x":
            return r * i;
        case "/":
            return r / i
    }
}

function q_(e, t, r) {
    switch (e) {
        case Lv:
            return [Z_(t, r)];
        case Gv:
        case Uv:
            return [K_(t, r)];
        case $v:
            return [J_(t, r)];
        case Hv:
            return [Q_(t, r)];
        case Vv:
            return [ty(t, r)];
        case zv:
            return [ey(t, r)];
        case Xv:
            return ry(t, r);
        case jv:
            return [iy(t, r)]
    }
    return []
}

function Z_(e, t) {
    const [r, i, s, n, a] = t, o = i / 2, [h, l] = rr([s, n], e, a);
    return {
        type: Gi,
        erase: r === 0,
        cx: h,
        cy: l,
        r: o
    }
}

function K_(e, t) {
    const [r, i, s, n, a, o, h] = t, [l, c] = [o - n, a - s], f = i / 2, p = Math.sqrt(l ** 2 + c ** 2), [m, v] = [f * l / p, f * c / p];
    return {
        type: Ye,
        erase: r === 0,
        points: [
            [s + m, n - v],
            [a + m, o - v],
            [a - m, o + v],
            [s - m, n + v]
        ].map(_ => rr(_, e, h))
    }
}

function J_(e, t) {
    const [r, i, s, n, a, o] = t, [h, l] = [i / 2, s / 2];
    return {
        type: Ye,
        erase: r === 0,
        points: [
            [n - h, a - l],
            [n + h, a - l],
            [n + h, a + l],
            [n - h, a + l]
        ].map(c => rr(c, e, o))
    }
}

function Q_(e, t) {
    const [r, i, s, n, a, o] = t;
    return {
        type: Ye,
        erase: r === 0,
        points: [
            [n, a],
            [n + i, a],
            [n + i, a + s],
            [n, a + s]
        ].map(h => rr(h, e, o))
    }
}

function ty(e, t) {
    const [r, , ...i] = t.slice(0, -1), s = t[t.length - 1];
    return {
        type: Ye,
        erase: r === 0,
        points: i.flatMap((n, a) => a % 2 === 1 ? [
            [i[a - 1], n]
        ] : []).map(n => rr(n, e, s))
    }
}

function ey(e, t) {
    const [r, i, s, n, a, o] = t, h = a / 2, l = 2 * $i / i, c = [];
    let f;
    for (f = 0; f < i; f++) {
        const p = l * f,
            m = s + h * Math.cos(p),
            v = n + h * Math.sin(p);
        c.push(rr([m, v], e, o))
    }
    return {
        type: Ye,
        erase: r === 0,
        points: c
    }
}

function ry(e, t) {
    const r = I => rr(I, e, t[8]),
        [i, s, n, a, o, h, l, c] = t,
        [f, p] = r([i, s]),
        m = l / 2,
        v = c / 2,
        _ = [];
    let y = 0,
        A = n;
    for (; A >= 0 && y < h;) {
        const I = A / 2,
            x = I - a;
        _.push({
            r: I,
            erase: !1
        }), x > 0 && _.push({
            r: x,
            erase: !0
        }), y += 1, A = 2 * (x - o)
    }
    return [..._.flatMap(({
        r: I,
        erase: x
    }) => ({
        type: Gi,
        cx: f,
        cy: p,
        r: I,
        erase: x
    })), {
        type: Ye,
        erase: !1,
        points: [
            [i - m, s - v],
            [i + m, s - v],
            [i + m, s + v],
            [i - m, s + v]
        ].map(r)
    }, {
        type: Ye,
        erase: !1,
        points: [
            [i - v, s - m],
            [i + v, s - m],
            [i + v, s + m],
            [i - v, s + m]
        ].map(r)
    }]
}

function iy(e, t) {
    const [r, i, s, n, a, o] = t, h = rr([r, i], e, o), [l, c] = [s / 2, n / 2], f = a / 2, p = l ** 2 - f ** 2, m = c ** 2 - f ** 2, v = Math.sqrt(p), _ = m >= 0 ? Math.sqrt(m) : f, y = [0, 90, 180, 270], A = [];
    for (const I of y) {
        const x = [
                [_, f],
                [v, f],
                [f, v],
                [f, _]
            ].map(G => rr(G, [r, i], I)).map(G => rr(G, e, o)),
            [S, $, k] = _c({
                x: x[1][0],
                y: x[1][1]
            }, {
                x: x[2][0],
                y: x[2][1]
            }, {
                x: h[0],
                y: h[1]
            }, Ef);
        if (A.push({
                type: Ht,
                start: x[0],
                end: x[1]
            }, {
                type: Ge,
                start: S,
                end: $,
                center: k,
                radius: l
            }, {
                type: Ht,
                start: x[2],
                end: x[3]
            }), !bn(x[0], x[3])) {
            const [G, L, Y] = _c({
                x: x[3][0],
                y: x[3][1]
            }, {
                x: x[0][0],
                y: x[0][1]
            }, {
                x: h[0],
                y: h[1]
            }, W_);
            A.push({
                type: Ge,
                start: G,
                end: L,
                center: Y,
                radius: c
            })
        }
    }
    return {
        type: _s,
        segments: A
    }
}
var si = (e => (e[e.WEBGL_LEGACY = 0] = "WEBGL_LEGACY", e[e.WEBGL = 1] = "WEBGL", e[e.WEBGL2 = 2] = "WEBGL2", e))(si || {}),
    yh = (e => (e[e.UNKNOWN = 0] = "UNKNOWN", e[e.WEBGL = 1] = "WEBGL", e[e.CANVAS = 2] = "CANVAS", e))(yh || {}),
    Ro = (e => (e[e.COLOR = 16384] = "COLOR", e[e.DEPTH = 256] = "DEPTH", e[e.STENCIL = 1024] = "STENCIL", e))(Ro || {}),
    lt = (e => (e[e.NORMAL = 0] = "NORMAL", e[e.ADD = 1] = "ADD", e[e.MULTIPLY = 2] = "MULTIPLY", e[e.SCREEN = 3] = "SCREEN", e[e.OVERLAY = 4] = "OVERLAY", e[e.DARKEN = 5] = "DARKEN", e[e.LIGHTEN = 6] = "LIGHTEN", e[e.COLOR_DODGE = 7] = "COLOR_DODGE", e[e.COLOR_BURN = 8] = "COLOR_BURN", e[e.HARD_LIGHT = 9] = "HARD_LIGHT", e[e.SOFT_LIGHT = 10] = "SOFT_LIGHT", e[e.DIFFERENCE = 11] = "DIFFERENCE", e[e.EXCLUSION = 12] = "EXCLUSION", e[e.HUE = 13] = "HUE", e[e.SATURATION = 14] = "SATURATION", e[e.COLOR = 15] = "COLOR", e[e.LUMINOSITY = 16] = "LUMINOSITY", e[e.NORMAL_NPM = 17] = "NORMAL_NPM", e[e.ADD_NPM = 18] = "ADD_NPM", e[e.SCREEN_NPM = 19] = "SCREEN_NPM", e[e.NONE = 20] = "NONE", e[e.SRC_OVER = 0] = "SRC_OVER", e[e.SRC_IN = 21] = "SRC_IN", e[e.SRC_OUT = 22] = "SRC_OUT", e[e.SRC_ATOP = 23] = "SRC_ATOP", e[e.DST_OVER = 24] = "DST_OVER", e[e.DST_IN = 25] = "DST_IN", e[e.DST_OUT = 26] = "DST_OUT", e[e.DST_ATOP = 27] = "DST_ATOP", e[e.ERASE = 26] = "ERASE", e[e.SUBTRACT = 28] = "SUBTRACT", e[e.XOR = 29] = "XOR", e))(lt || {}),
    tr = (e => (e[e.POINTS = 0] = "POINTS", e[e.LINES = 1] = "LINES", e[e.LINE_LOOP = 2] = "LINE_LOOP", e[e.LINE_STRIP = 3] = "LINE_STRIP", e[e.TRIANGLES = 4] = "TRIANGLES", e[e.TRIANGLE_STRIP = 5] = "TRIANGLE_STRIP", e[e.TRIANGLE_FAN = 6] = "TRIANGLE_FAN", e))(tr || {}),
    W = (e => (e[e.RGBA = 6408] = "RGBA", e[e.RGB = 6407] = "RGB", e[e.RG = 33319] = "RG", e[e.RED = 6403] = "RED", e[e.RGBA_INTEGER = 36249] = "RGBA_INTEGER", e[e.RGB_INTEGER = 36248] = "RGB_INTEGER", e[e.RG_INTEGER = 33320] = "RG_INTEGER", e[e.RED_INTEGER = 36244] = "RED_INTEGER", e[e.ALPHA = 6406] = "ALPHA", e[e.LUMINANCE = 6409] = "LUMINANCE", e[e.LUMINANCE_ALPHA = 6410] = "LUMINANCE_ALPHA", e[e.DEPTH_COMPONENT = 6402] = "DEPTH_COMPONENT", e[e.DEPTH_STENCIL = 34041] = "DEPTH_STENCIL", e))(W || {}),
    Di = (e => (e[e.TEXTURE_2D = 3553] = "TEXTURE_2D", e[e.TEXTURE_CUBE_MAP = 34067] = "TEXTURE_CUBE_MAP", e[e.TEXTURE_2D_ARRAY = 35866] = "TEXTURE_2D_ARRAY", e[e.TEXTURE_CUBE_MAP_POSITIVE_X = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X", e[e.TEXTURE_CUBE_MAP_NEGATIVE_X = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X", e[e.TEXTURE_CUBE_MAP_POSITIVE_Y = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y", e[e.TEXTURE_CUBE_MAP_POSITIVE_Z = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z", e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z", e))(Di || {}),
    ot = (e => (e[e.UNSIGNED_BYTE = 5121] = "UNSIGNED_BYTE", e[e.UNSIGNED_SHORT = 5123] = "UNSIGNED_SHORT", e[e.UNSIGNED_SHORT_5_6_5 = 33635] = "UNSIGNED_SHORT_5_6_5", e[e.UNSIGNED_SHORT_4_4_4_4 = 32819] = "UNSIGNED_SHORT_4_4_4_4", e[e.UNSIGNED_SHORT_5_5_5_1 = 32820] = "UNSIGNED_SHORT_5_5_5_1", e[e.UNSIGNED_INT = 5125] = "UNSIGNED_INT", e[e.UNSIGNED_INT_10F_11F_11F_REV = 35899] = "UNSIGNED_INT_10F_11F_11F_REV", e[e.UNSIGNED_INT_2_10_10_10_REV = 33640] = "UNSIGNED_INT_2_10_10_10_REV", e[e.UNSIGNED_INT_24_8 = 34042] = "UNSIGNED_INT_24_8", e[e.UNSIGNED_INT_5_9_9_9_REV = 35902] = "UNSIGNED_INT_5_9_9_9_REV", e[e.BYTE = 5120] = "BYTE", e[e.SHORT = 5122] = "SHORT", e[e.INT = 5124] = "INT", e[e.FLOAT = 5126] = "FLOAT", e[e.FLOAT_32_UNSIGNED_INT_24_8_REV = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV", e[e.HALF_FLOAT = 36193] = "HALF_FLOAT", e))(ot || {}),
    Mo = (e => (e[e.FLOAT = 0] = "FLOAT", e[e.INT = 1] = "INT", e[e.UINT = 2] = "UINT", e))(Mo || {}),
    mr = (e => (e[e.NEAREST = 0] = "NEAREST", e[e.LINEAR = 1] = "LINEAR", e))(mr || {}),
    Mr = (e => (e[e.CLAMP = 33071] = "CLAMP", e[e.REPEAT = 10497] = "REPEAT", e[e.MIRRORED_REPEAT = 33648] = "MIRRORED_REPEAT", e))(Mr || {}),
    hr = (e => (e[e.OFF = 0] = "OFF", e[e.POW2 = 1] = "POW2", e[e.ON = 2] = "ON", e[e.ON_MANUAL = 3] = "ON_MANUAL", e))(hr || {}),
    qe = (e => (e[e.NPM = 0] = "NPM", e[e.UNPACK = 1] = "UNPACK", e[e.PMA = 2] = "PMA", e[e.NO_PREMULTIPLIED_ALPHA = 0] = "NO_PREMULTIPLIED_ALPHA", e[e.PREMULTIPLY_ON_UPLOAD = 1] = "PREMULTIPLY_ON_UPLOAD", e[e.PREMULTIPLIED_ALPHA = 2] = "PREMULTIPLIED_ALPHA", e))(qe || {}),
    Je = (e => (e[e.NO = 0] = "NO", e[e.YES = 1] = "YES", e[e.AUTO = 2] = "AUTO", e[e.BLEND = 0] = "BLEND", e[e.CLEAR = 1] = "CLEAR", e[e.BLIT = 2] = "BLIT", e))(Je || {}),
    xh = (e => (e[e.AUTO = 0] = "AUTO", e[e.MANUAL = 1] = "MANUAL", e))(xh || {}),
    Re = (e => (e.LOW = "lowp", e.MEDIUM = "mediump", e.HIGH = "highp", e))(Re || {}),
    te = (e => (e[e.NONE = 0] = "NONE", e[e.SCISSOR = 1] = "SCISSOR", e[e.STENCIL = 2] = "STENCIL", e[e.SPRITE = 3] = "SPRITE", e[e.COLOR = 4] = "COLOR", e))(te || {}),
    Qt = (e => (e[e.NONE = 0] = "NONE", e[e.LOW = 2] = "LOW", e[e.MEDIUM = 4] = "MEDIUM", e[e.HIGH = 8] = "HIGH", e))(Qt || {}),
    ir = (e => (e[e.ELEMENT_ARRAY_BUFFER = 34963] = "ELEMENT_ARRAY_BUFFER", e[e.ARRAY_BUFFER = 34962] = "ARRAY_BUFFER", e[e.UNIFORM_BUFFER = 35345] = "UNIFORM_BUFFER", e))(ir || {});
const sy = {
        createCanvas: (e, t) => {
            const r = document.createElement("canvas");
            return r.width = e, r.height = t, r
        },
        getCanvasRenderingContext2D: () => CanvasRenderingContext2D,
        getWebGLRenderingContext: () => WebGLRenderingContext,
        getNavigator: () => navigator,
        getBaseUrl: () => document.baseURI??window.location.href,
        getFontFaceSet: () => document.fonts,
        fetch: (e, t) => fetch(e, t),
        parseXML: e => new DOMParser().parseFromString(e, "text/xml")
    },
    K = {
        ADAPTER: sy,
        RESOLUTION: 1,
        CREATE_IMAGE_BITMAP: !1,
        ROUND_PIXELS: !1
    };
var Za = /iPhone/i,
    yc = /iPod/i,
    xc = /iPad/i,
    bc = /\biOS-universal(?:.+)Mac\b/i,
    Ka = /\bAndroid(?:.+)Mobile\b/i,
    wc = /Android/i,
    vi = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i,
    qs = /Silk/i,
    fr = /Windows Phone/i,
    Ec = /\bWindows(?:.+)ARM\b/i,
    Tc = /BlackBerry/i,
    Ac = /BB10/i,
    Cc = /Opera Mini/i,
    Sc = /\b(CriOS|Chrome)(?:.+)Mobile/i,
    Ic = /Mobile(?:.+)Firefox\b/i,
    Rc = function(e) {
        return typeof e < "u" && e.platform === "MacIntel" && typeof e.maxTouchPoints == "number" && e.maxTouchPoints > 1 && typeof MSStream > "u"
    };

function ny(e) {
    return function(t) {
        return t.test(e)
    }
}

function Mc(e) {
    var t = {
        userAgent: "",
        platform: "",
        maxTouchPoints: 0
    };
    !e && typeof navigator < "u" ? t = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints || 0
    } : typeof e == "string" ? t.userAgent = e : e && e.userAgent && (t = {
        userAgent: e.userAgent,
        platform: e.platform,
        maxTouchPoints: e.maxTouchPoints || 0
    });
    var r = t.userAgent,
        i = r.split("[FBAN");
    typeof i[1] < "u" && (r = i[0]), i = r.split("Twitter"), typeof i[1] < "u" && (r = i[0]);
    var s = ny(r),
        n = {
            apple: {
                phone: s(Za) && !s(fr),
                ipod: s(yc),
                tablet: !s(Za) && (s(xc) || Rc(t)) && !s(fr),
                universal: s(bc),
                device: (s(Za) || s(yc) || s(xc) || s(bc) || Rc(t)) && !s(fr)
            },
            amazon: {
                phone: s(vi),
                tablet: !s(vi) && s(qs),
                device: s(vi) || s(qs)
            },
            android: {
                phone: !s(fr) && s(vi) || !s(fr) && s(Ka),
                tablet: !s(fr) && !s(vi) && !s(Ka) && (s(qs) || s(wc)),
                device: !s(fr) && (s(vi) || s(qs) || s(Ka) || s(wc)) || s(/\bokhttp\b/i)
            },
            windows: {
                phone: s(fr),
                tablet: s(Ec),
                device: s(fr) || s(Ec)
            },
            other: {
                blackberry: s(Tc),
                blackberry10: s(Ac),
                opera: s(Cc),
                firefox: s(Ic),
                chrome: s(Sc),
                device: s(Tc) || s(Ac) || s(Cc) || s(Ic) || s(Sc)
            },
            any: !1,
            phone: !1,
            tablet: !1
        };
    return n.any = n.apple.device || n.android.device || n.windows.device || n.other.device, n.phone = n.apple.phone || n.android.phone || n.windows.phone, n.tablet = n.apple.tablet || n.android.tablet || n.windows.tablet, n
}
const ay = Mc.default??Mc,
    Ii = ay(globalThis.navigator);
K.RETINA_PREFIX = /@([0-9\.]+)x/;
K.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT = !1;
var wn = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {},
    Hi = {},
    oy = {
        get exports() {
            return Hi
        },
        set exports(e) {
            Hi = e
        }
    };
(function(e) {
    var t = Object.prototype.hasOwnProperty,
        r = "~";

    function i() {}
    Object.create && (i.prototype = Object.create(null), new i().__proto__ || (r = !1));

    function s(h, l, c) {
        this.fn = h, this.context = l, this.once = c || !1
    }

    function n(h, l, c, f, p) {
        if (typeof c != "function") throw new TypeError("The listener must be a function");
        var m = new s(c, f || h, p),
            v = r ? r + l : l;
        return h._events[v] ? h._events[v].fn ? h._events[v] = [h._events[v], m] : h._events[v].push(m) : (h._events[v] = m, h._eventsCount++), h
    }

    function a(h, l) {
        --h._eventsCount === 0 ? h._events = new i : delete h._events[l]
    }

    function o() {
        this._events = new i, this._eventsCount = 0
    }
    o.prototype.eventNames = function() {
        var l = [],
            c, f;
        if (this._eventsCount === 0) return l;
        for (f in c = this._events) t.call(c, f) && l.push(r ? f.slice(1) : f);
        return Object.getOwnPropertySymbols ? l.concat(Object.getOwnPropertySymbols(c)) : l
    }, o.prototype.listeners = function(l) {
        var c = r ? r + l : l,
            f = this._events[c];
        if (!f) return [];
        if (f.fn) return [f.fn];
        for (var p = 0, m = f.length, v = new Array(m); p < m; p++) v[p] = f[p].fn;
        return v
    }, o.prototype.listenerCount = function(l) {
        var c = r ? r + l : l,
            f = this._events[c];
        return f ? f.fn ? 1 : f.length : 0
    }, o.prototype.emit = function(l, c, f, p, m, v) {
        var _ = r ? r + l : l;
        if (!this._events[_]) return !1;
        var y = this._events[_],
            A = arguments.length,
            I, x;
        if (y.fn) {
            switch (y.once && this.removeListener(l, y.fn, void 0, !0), A) {
                case 1:
                    return y.fn.call(y.context), !0;
                case 2:
                    return y.fn.call(y.context, c), !0;
                case 3:
                    return y.fn.call(y.context, c, f), !0;
                case 4:
                    return y.fn.call(y.context, c, f, p), !0;
                case 5:
                    return y.fn.call(y.context, c, f, p, m), !0;
                case 6:
                    return y.fn.call(y.context, c, f, p, m, v), !0
            }
            for (x = 1, I = new Array(A - 1); x < A; x++) I[x - 1] = arguments[x];
            y.fn.apply(y.context, I)
        } else {
            var S = y.length,
                $;
            for (x = 0; x < S; x++) switch (y[x].once && this.removeListener(l, y[x].fn, void 0, !0), A) {
                case 1:
                    y[x].fn.call(y[x].context);
                    break;
                case 2:
                    y[x].fn.call(y[x].context, c);
                    break;
                case 3:
                    y[x].fn.call(y[x].context, c, f);
                    break;
                case 4:
                    y[x].fn.call(y[x].context, c, f, p);
                    break;
                default:
                    if (!I)
                        for ($ = 1, I = new Array(A - 1); $ < A; $++) I[$ - 1] = arguments[$];
                    y[x].fn.apply(y[x].context, I)
            }
        }
        return !0
    }, o.prototype.on = function(l, c, f) {
        return n(this, l, c, f, !1)
    }, o.prototype.once = function(l, c, f) {
        return n(this, l, c, f, !0)
    }, o.prototype.removeListener = function(l, c, f, p) {
        var m = r ? r + l : l;
        if (!this._events[m]) return this;
        if (!c) return a(this, m), this;
        var v = this._events[m];
        if (v.fn) v.fn === c && (!p || v.once) && (!f || v.context === f) && a(this, m);
        else {
            for (var _ = 0, y = [], A = v.length; _ < A; _++)(v[_].fn !== c || p && !v[_].once || f && v[_].context !== f) && y.push(v[_]);
            y.length ? this._events[m] = y.length === 1 ? y[0] : y : a(this, m)
        }
        return this
    }, o.prototype.removeAllListeners = function(l) {
        var c;
        return l ? (c = r ? r + l : l, this._events[c] && a(this, c)) : (this._events = new i, this._eventsCount = 0), this
    }, o.prototype.off = o.prototype.removeListener, o.prototype.addListener = o.prototype.on, o.prefixed = r, o.EventEmitter = o, e.exports = o
})(oy);
var Fn = {},
    hy = {
        get exports() {
            return Fn
        },
        set exports(e) {
            Fn = e
        }
    };
hy.exports = sa;
Fn.default = sa;

function sa(e, t, r) {
    r = r || 2;
    var i = t && t.length,
        s = i ? t[0] * r : e.length,
        n = Tf(e, 0, s, r, !0),
        a = [];
    if (!n || n.next === n.prev) return a;
    var o, h, l, c, f, p, m;
    if (i && (n = dy(e, t, n, r)), e.length > 80 * r) {
        o = l = e[0], h = c = e[1];
        for (var v = r; v < s; v += r) f = e[v], p = e[v + 1], f < o && (o = f), p < h && (h = p), f > l && (l = f), p > c && (c = p);
        m = Math.max(l - o, c - h), m = m !== 0 ? 32767 / m : 0
    }
    return xs(n, a, r, o, h, m, 0), a
}

function Tf(e, t, r, i, s) {
    var n, a;
    if (s === Do(e, t, r, i) > 0)
        for (n = t; n < r; n += i) a = Pc(n, e[n], e[n + 1], a);
    else
        for (n = r - i; n >= t; n -= i) a = Pc(n, e[n], e[n + 1], a);
    return a && na(a, a.next) && (ws(a), a = a.next), a
}

function ti(e, t) {
    if (!e) return e;
    t || (t = e);
    var r = e,
        i;
    do
        if (i = !1, !r.steiner && (na(r, r.next) || Vt(r.prev, r, r.next) === 0)) {
            if (ws(r), r = t = r.prev, r === r.next) break;
            i = !0
        } else r = r.next; while (i || r !== t);
    return t
}

function xs(e, t, r, i, s, n, a) {
    if (e) {
        !a && n && _y(e, i, s, n);
        for (var o = e, h, l; e.prev !== e.next;) {
            if (h = e.prev, l = e.next, n ? cy(e, i, s, n) : ly(e)) {
                t.push(h.i / r | 0), t.push(e.i / r | 0), t.push(l.i / r | 0), ws(e), e = l.next, o = l.next;
                continue
            }
            if (e = l, e === o) {
                a ? a === 1 ? (e = uy(ti(e), t, r), xs(e, t, r, i, s, n, 2)) : a === 2 && fy(e, t, r, i, s, n) : xs(ti(e), t, r, i, s, n, 1);
                break
            }
        }
    }
}

function ly(e) {
    var t = e.prev,
        r = e,
        i = e.next;
    if (Vt(t, r, i) >= 0) return !1;
    for (var s = t.x, n = r.x, a = i.x, o = t.y, h = r.y, l = i.y, c = s < n ? s < a ? s : a : n < a ? n : a, f = o < h ? o < l ? o : l : h < l ? h : l, p = s > n ? s > a ? s : a : n > a ? n : a, m = o > h ? o > l ? o : l : h > l ? h : l, v = i.next; v !== t;) {
        if (v.x >= c && v.x <= p && v.y >= f && v.y <= m && Ri(s, o, n, h, a, l, v.x, v.y) && Vt(v.prev, v, v.next) >= 0) return !1;
        v = v.next
    }
    return !0
}

function cy(e, t, r, i) {
    var s = e.prev,
        n = e,
        a = e.next;
    if (Vt(s, n, a) >= 0) return !1;
    for (var o = s.x, h = n.x, l = a.x, c = s.y, f = n.y, p = a.y, m = o < h ? o < l ? o : l : h < l ? h : l, v = c < f ? c < p ? c : p : f < p ? f : p, _ = o > h ? o > l ? o : l : h > l ? h : l, y = c > f ? c > p ? c : p : f > p ? f : p, A = Po(m, v, t, r, i), I = Po(_, y, t, r, i), x = e.prevZ, S = e.nextZ; x && x.z >= A && S && S.z <= I;) {
        if (x.x >= m && x.x <= _ && x.y >= v && x.y <= y && x !== s && x !== a && Ri(o, c, h, f, l, p, x.x, x.y) && Vt(x.prev, x, x.next) >= 0 || (x = x.prevZ, S.x >= m && S.x <= _ && S.y >= v && S.y <= y && S !== s && S !== a && Ri(o, c, h, f, l, p, S.x, S.y) && Vt(S.prev, S, S.next) >= 0)) return !1;
        S = S.nextZ
    }
    for (; x && x.z >= A;) {
        if (x.x >= m && x.x <= _ && x.y >= v && x.y <= y && x !== s && x !== a && Ri(o, c, h, f, l, p, x.x, x.y) && Vt(x.prev, x, x.next) >= 0) return !1;
        x = x.prevZ
    }
    for (; S && S.z <= I;) {
        if (S.x >= m && S.x <= _ && S.y >= v && S.y <= y && S !== s && S !== a && Ri(o, c, h, f, l, p, S.x, S.y) && Vt(S.prev, S, S.next) >= 0) return !1;
        S = S.nextZ
    }
    return !0
}

function uy(e, t, r) {
    var i = e;
    do {
        var s = i.prev,
            n = i.next.next;
        !na(s, n) && Af(s, i, i.next, n) && bs(s, n) && bs(n, s) && (t.push(s.i / r | 0), t.push(i.i / r | 0), t.push(n.i / r | 0), ws(i), ws(i.next), i = e = n), i = i.next
    } while (i !== e);
    return ti(i)
}

function fy(e, t, r, i, s, n) {
    var a = e;
    do {
        for (var o = a.next.next; o !== a.prev;) {
            if (a.i !== o.i && by(a, o)) {
                var h = Cf(a, o);
                a = ti(a, a.next), h = ti(h, h.next), xs(a, t, r, i, s, n, 0), xs(h, t, r, i, s, n, 0);
                return
            }
            o = o.next
        }
        a = a.next
    } while (a !== e)
}

function dy(e, t, r, i) {
    var s = [],
        n, a, o, h, l;
    for (n = 0, a = t.length; n < a; n++) o = t[n] * i, h = n < a - 1 ? t[n + 1] * i : e.length, l = Tf(e, o, h, i, !1), l === l.next && (l.steiner = !0), s.push(xy(l));
    for (s.sort(py), n = 0; n < s.length; n++) r = my(s[n], r);
    return r
}

function py(e, t) {
    return e.x - t.x
}

function my(e, t) {
    var r = gy(e, t);
    if (!r) return t;
    var i = Cf(r, e);
    return ti(i, i.next), ti(r, r.next)
}

function gy(e, t) {
    var r = t,
        i = e.x,
        s = e.y,
        n = -1 / 0,
        a;
    do {
        if (s <= r.y && s >= r.next.y && r.next.y !== r.y) {
            var o = r.x + (s - r.y) * (r.next.x - r.x) / (r.next.y - r.y);
            if (o <= i && o > n && (n = o, a = r.x < r.next.x ? r : r.next, o === i)) return a
        }
        r = r.next
    } while (r !== t);
    if (!a) return null;
    var h = a,
        l = a.x,
        c = a.y,
        f = 1 / 0,
        p;
    r = a;
    do i >= r.x && r.x >= l && i !== r.x && Ri(s < c ? i : n, s, l, c, s < c ? n : i, s, r.x, r.y) && (p = Math.abs(s - r.y) / (i - r.x), bs(r, e) && (p < f || p === f && (r.x > a.x || r.x === a.x && vy(a, r))) && (a = r, f = p)), r = r.next; while (r !== h);
    return a
}

function vy(e, t) {
    return Vt(e.prev, e, t.prev) < 0 && Vt(t.next, e, e.next) < 0
}

function _y(e, t, r, i) {
    var s = e;
    do s.z === 0 && (s.z = Po(s.x, s.y, t, r, i)), s.prevZ = s.prev, s.nextZ = s.next, s = s.next; while (s !== e);
    s.prevZ.nextZ = null, s.prevZ = null, yy(s)
}

function yy(e) {
    var t, r, i, s, n, a, o, h, l = 1;
    do {
        for (r = e, e = null, n = null, a = 0; r;) {
            for (a++, i = r, o = 0, t = 0; t < l && (o++, i = i.nextZ, !!i); t++);
            for (h = l; o > 0 || h > 0 && i;) o !== 0 && (h === 0 || !i || r.z <= i.z) ? (s = r, r = r.nextZ, o--) : (s = i, i = i.nextZ, h--), n ? n.nextZ = s : e = s, s.prevZ = n, n = s;
            r = i
        }
        n.nextZ = null, l *= 2
    } while (a > 1);
    return e
}

function Po(e, t, r, i, s) {
    return e = (e - r) * s | 0, t = (t - i) * s | 0, e = (e | e << 8) & 16711935, e = (e | e << 4) & 252645135, e = (e | e << 2) & 858993459, e = (e | e << 1) & 1431655765, t = (t | t << 8) & 16711935, t = (t | t << 4) & 252645135, t = (t | t << 2) & 858993459, t = (t | t << 1) & 1431655765, e | t << 1
}

function xy(e) {
    var t = e,
        r = e;
    do(t.x < r.x || t.x === r.x && t.y < r.y) && (r = t), t = t.next; while (t !== e);
    return r
}

function Ri(e, t, r, i, s, n, a, o) {
    return (s - a) * (t - o) >= (e - a) * (n - o) && (e - a) * (i - o) >= (r - a) * (t - o) && (r - a) * (n - o) >= (s - a) * (i - o)
}

function by(e, t) {
    return e.next.i !== t.i && e.prev.i !== t.i && !wy(e, t) && (bs(e, t) && bs(t, e) && Ey(e, t) && (Vt(e.prev, e, t.prev) || Vt(e, t.prev, t)) || na(e, t) && Vt(e.prev, e, e.next) > 0 && Vt(t.prev, t, t.next) > 0)
}

function Vt(e, t, r) {
    return (t.y - e.y) * (r.x - t.x) - (t.x - e.x) * (r.y - t.y)
}

function na(e, t) {
    return e.x === t.x && e.y === t.y
}

function Af(e, t, r, i) {
    var s = Ks(Vt(e, t, r)),
        n = Ks(Vt(e, t, i)),
        a = Ks(Vt(r, i, e)),
        o = Ks(Vt(r, i, t));
    return !!(s !== n && a !== o || s === 0 && Zs(e, r, t) || n === 0 && Zs(e, i, t) || a === 0 && Zs(r, e, i) || o === 0 && Zs(r, t, i))
}

function Zs(e, t, r) {
    return t.x <= Math.max(e.x, r.x) && t.x >= Math.min(e.x, r.x) && t.y <= Math.max(e.y, r.y) && t.y >= Math.min(e.y, r.y)
}

function Ks(e) {
    return e > 0 ? 1 : e < 0 ? -1 : 0
}

function wy(e, t) {
    var r = e;
    do {
        if (r.i !== e.i && r.next.i !== e.i && r.i !== t.i && r.next.i !== t.i && Af(r, r.next, e, t)) return !0;
        r = r.next
    } while (r !== e);
    return !1
}

function bs(e, t) {
    return Vt(e.prev, e, e.next) < 0 ? Vt(e, t, e.next) >= 0 && Vt(e, e.prev, t) >= 0 : Vt(e, t, e.prev) < 0 || Vt(e, e.next, t) < 0
}

function Ey(e, t) {
    var r = e,
        i = !1,
        s = (e.x + t.x) / 2,
        n = (e.y + t.y) / 2;
    do r.y > n != r.next.y > n && r.next.y !== r.y && s < (r.next.x - r.x) * (n - r.y) / (r.next.y - r.y) + r.x && (i = !i), r = r.next; while (r !== e);
    return i
}

function Cf(e, t) {
    var r = new No(e.i, e.x, e.y),
        i = new No(t.i, t.x, t.y),
        s = e.next,
        n = t.prev;
    return e.next = t, t.prev = e, r.next = s, s.prev = r, i.next = r, r.prev = i, n.next = i, i.prev = n, i
}

function Pc(e, t, r, i) {
    var s = new No(e, t, r);
    return i ? (s.next = i.next, s.prev = i, i.next.prev = s, i.next = s) : (s.prev = s, s.next = s), s
}

function ws(e) {
    e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ)
}

function No(e, t, r) {
    this.i = e, this.x = t, this.y = r, this.prev = null, this.next = null, this.z = 0, this.prevZ = null, this.nextZ = null, this.steiner = !1
}
sa.deviation = function(e, t, r, i) {
    var s = t && t.length,
        n = s ? t[0] * r : e.length,
        a = Math.abs(Do(e, 0, n, r));
    if (s)
        for (var o = 0, h = t.length; o < h; o++) {
            var l = t[o] * r,
                c = o < h - 1 ? t[o + 1] * r : e.length;
            a -= Math.abs(Do(e, l, c, r))
        }
    var f = 0;
    for (o = 0; o < i.length; o += 3) {
        var p = i[o] * r,
            m = i[o + 1] * r,
            v = i[o + 2] * r;
        f += Math.abs((e[p] - e[v]) * (e[m + 1] - e[p + 1]) - (e[p] - e[m]) * (e[v + 1] - e[p + 1]))
    }
    return a === 0 && f === 0 ? 0 : Math.abs((f - a) / a)
};

function Do(e, t, r, i) {
    for (var s = 0, n = t, a = r - i; n < r; n += i) s += (e[a] - e[n]) * (e[n + 1] + e[a + 1]), a = n;
    return s
}
sa.flatten = function(e) {
    for (var t = e[0][0].length, r = {
            vertices: [],
            holes: [],
            dimensions: t
        }, i = 0, s = 0; s < e.length; s++) {
        for (var n = 0; n < e[s].length; n++)
            for (var a = 0; a < t; a++) r.vertices.push(e[s][n][a]);
        s > 0 && (i += e[s - 1].length, r.holes.push(i))
    }
    return r
};
var kn = {},
    Ty = {
        get exports() {
            return kn
        },
        set exports(e) {
            kn = e
        }
    }; /*! https://mths.be/punycode v1.3.2 by @mathias */
(function(e, t) {
    (function(r) {
        var i = t && !t.nodeType && t,
            s = e && !e.nodeType && e,
            n = typeof wn == "object" && wn;
        (n.global === n || n.window === n || n.self === n) && (r = n);
        var a, o = 2147483647,
            h = 36,
            l = 1,
            c = 26,
            f = 38,
            p = 700,
            m = 72,
            v = 128,
            _ = "-",
            y = /^xn--/,
            A = /[^\x20-\x7E]/,
            I = /[\x2E\u3002\uFF0E\uFF61]/g,
            x = {
                overflow: "Overflow: input needs wider integers to process",
                "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                "invalid-input": "Invalid input"
            },
            S = h - l,
            $ = Math.floor,
            k = String.fromCharCode,
            G;

        function L(O) {
            throw RangeError(x[O])
        }

        function Y(O, Z) {
            for (var ut = O.length, ft = []; ut--;) ft[ut] = Z(O[ut]);
            return ft
        }

        function et(O, Z) {
            var ut = O.split("@"),
                ft = "";
            ut.length > 1 && (ft = ut[0] + "@", O = ut[1]), O = O.replace(I, ".");
            var dt = O.split("."),
                Nt = Y(dt, Z).join(".");
            return ft + Nt
        }

        function E(O) {
            for (var Z = [], ut = 0, ft = O.length, dt, Nt; ut < ft;) dt = O.charCodeAt(ut++), dt >= 55296 && dt <= 56319 && ut < ft ? (Nt = O.charCodeAt(ut++), (Nt & 64512) == 56320 ? Z.push(((dt & 1023) << 10) + (Nt & 1023) + 65536) : (Z.push(dt), ut--)) : Z.push(dt);
            return Z
        }

        function D(O) {
            return Y(O, function(Z) {
                var ut = "";
                return Z > 65535 && (Z -= 65536, ut += k(Z >>> 10 & 1023 | 55296), Z = 56320 | Z & 1023), ut += k(Z), ut
            }).join("")
        }

        function N(O) {
            return O - 48 < 10 ? O - 22 : O - 65 < 26 ? O - 65 : O - 97 < 26 ? O - 97 : h
        }

        function R(O, Z) {
            return O + 22 + 75 * (O < 26) - ((Z != 0) << 5)
        }

        function j(O, Z, ut) {
            var ft = 0;
            for (O = ut ? $(O / p) : O >> 1, O += $(O / Z); O > S * c >> 1; ft += h) O = $(O / S);
            return $(ft + (S + 1) * O / (O + f))
        }

        function H(O) {
            var Z = [],
                ut = O.length,
                ft, dt = 0,
                Nt = v,
                xt = m,
                Dt, Ft, zt, Ut, Pt, Xt, jt, pe, Ce;
            for (Dt = O.lastIndexOf(_), Dt < 0 && (Dt = 0), Ft = 0; Ft < Dt; ++Ft) O.charCodeAt(Ft) >= 128 && L("not-basic"), Z.push(O.charCodeAt(Ft));
            for (zt = Dt > 0 ? Dt + 1 : 0; zt < ut;) {
                for (Ut = dt, Pt = 1, Xt = h; zt >= ut && L("invalid-input"), jt = N(O.charCodeAt(zt++)), (jt >= h || jt > $((o - dt) / Pt)) && L("overflow"), dt += jt * Pt, pe = Xt <= xt ? l : Xt >= xt + c ? c : Xt - xt, !(jt < pe); Xt += h) Ce = h - pe, Pt > $(o / Ce) && L("overflow"), Pt *= Ce;
                ft = Z.length + 1, xt = j(dt - Ut, ft, Ut == 0), $(dt / ft) > o - Nt && L("overflow"), Nt += $(dt / ft), dt %= ft, Z.splice(dt++, 0, Nt)
            }
            return D(Z)
        }

        function U(O) {
            var Z, ut, ft, dt, Nt, xt, Dt, Ft, zt, Ut, Pt, Xt = [],
                jt, pe, Ce, kr;
            for (O = E(O), jt = O.length, Z = v, ut = 0, Nt = m, xt = 0; xt < jt; ++xt) Pt = O[xt], Pt < 128 && Xt.push(k(Pt));
            for (ft = dt = Xt.length, dt && Xt.push(_); ft < jt;) {
                for (Dt = o, xt = 0; xt < jt; ++xt) Pt = O[xt], Pt >= Z && Pt < Dt && (Dt = Pt);
                for (pe = ft + 1, Dt - Z > $((o - ut) / pe) && L("overflow"), ut += (Dt - Z) * pe, Z = Dt, xt = 0; xt < jt; ++xt)
                    if (Pt = O[xt], Pt < Z && ++ut > o && L("overflow"), Pt == Z) {
                        for (Ft = ut, zt = h; Ut = zt <= Nt ? l : zt >= Nt + c ? c : zt - Nt, !(Ft < Ut); zt += h) kr = Ft - Ut, Ce = h - Ut, Xt.push(k(R(Ut + kr % Ce, 0))), Ft = $(kr / Ce);
                        Xt.push(k(R(Ft, 0))), Nt = j(ut, pe, ft == dt), ut = 0, ++ft
                    }++ut, ++Z
            }
            return Xt.join("")
        }

        function it(O) {
            return et(O, function(Z) {
                return y.test(Z) ? H(Z.slice(4).toLowerCase()) : Z
            })
        }

        function at(O) {
            return et(O, function(Z) {
                return A.test(Z) ? "xn--" + U(Z) : Z
            })
        }
        if (a = {
                version: "1.3.2",
                ucs2: {
                    decode: E,
                    encode: D
                },
                decode: H,
                encode: U,
                toASCII: at,
                toUnicode: it
            }, i && s)
            if (e.exports == i) s.exports = a;
            else
                for (G in a) a.hasOwnProperty(G) && (i[G] = a[G]);
        else r.punycode = a
    })(wn)
})(Ty, kn);
var Ay = {
        isString: function(e) {
            return typeof e == "string"
        },
        isObject: function(e) {
            return typeof e == "object" && e !== null
        },
        isNull: function(e) {
            return e === null
        },
        isNullOrUndefined: function(e) {
            return e == null
        }
    },
    Es = {};

function Cy(e, t) {
    return Object.prototype.hasOwnProperty.call(e, t)
}
var Sy = function(e, t, r, i) {
        t = t || "&", r = r || "=";
        var s = {};
        if (typeof e != "string" || e.length === 0) return s;
        var n = /\+/g;
        e = e.split(t);
        var a = 1e3;
        i && typeof i.maxKeys == "number" && (a = i.maxKeys);
        var o = e.length;
        a > 0 && o > a && (o = a);
        for (var h = 0; h < o; ++h) {
            var l = e[h].replace(n, "%20"),
                c = l.indexOf(r),
                f, p, m, v;
            c >= 0 ? (f = l.substr(0, c), p = l.substr(c + 1)) : (f = l, p = ""), m = decodeURIComponent(f), v = decodeURIComponent(p), Cy(s, m) ? Array.isArray(s[m]) ? s[m].push(v) : s[m] = [s[m], v] : s[m] = v
        }
        return s
    },
    Qi = function(e) {
        switch (typeof e) {
            case "string":
                return e;
            case "boolean":
                return e ? "true" : "false";
            case "number":
                return isFinite(e) ? e : "";
            default:
                return ""
        }
    },
    Iy = function(e, t, r, i) {
        return t = t || "&", r = r || "=", e === null && (e = void 0), typeof e == "object" ? Object.keys(e).map(function(s) {
            var n = encodeURIComponent(Qi(s)) + r;
            return Array.isArray(e[s]) ? e[s].map(function(a) {
                return n + encodeURIComponent(Qi(a))
            }).join(t) : n + encodeURIComponent(Qi(e[s]))
        }).join(t) : i ? encodeURIComponent(Qi(i)) + r + encodeURIComponent(Qi(e)) : ""
    };
Es.decode = Es.parse = Sy;
Es.encode = Es.stringify = Iy;
var Ry = kn,
    Qe = Ay,
    My = aa,
    Py = Hy,
    Ny = $y;

function Ve() {
    this.protocol = null, this.slashes = null, this.auth = null, this.host = null, this.port = null, this.hostname = null, this.hash = null, this.search = null, this.query = null, this.pathname = null, this.path = null, this.href = null
}
var Dy = /^([a-z0-9.+-]+:)/i,
    By = /:[0-9]*$/,
    Oy = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
    Fy = ["<", ">", '"', "`", " ", "\r", `
`, "	"],
    ky = ["{", "}", "|", "\\", "^", "`"].concat(Fy),
    Bo = ["'"].concat(ky),
    Nc = ["%", "/", "?", ";", "#"].concat(Bo),
    Dc = ["/", "?", "#"],
    Ly = 255,
    Bc = /^[+a-z0-9A-Z_-]{0,63}$/,
    Uy = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    Gy = {
        javascript: !0,
        "javascript:": !0
    },
    Oo = {
        javascript: !0,
        "javascript:": !0
    },
    Bi = {
        http: !0,
        https: !0,
        ftp: !0,
        gopher: !0,
        file: !0,
        "http:": !0,
        "https:": !0,
        "ftp:": !0,
        "gopher:": !0,
        "file:": !0
    },
    Fo = Es;

function aa(e, t, r) {
    if (e && Qe.isObject(e) && e instanceof Ve) return e;
    var i = new Ve;
    return i.parse(e, t, r), i
}
Ve.prototype.parse = function(e, t, r) {
    if (!Qe.isString(e)) throw new TypeError("Parameter 'url' must be a string, not " + typeof e);
    var i = e.indexOf("?"),
        s = i !== -1 && i < e.indexOf("#") ? "?" : "#",
        n = e.split(s),
        a = /\\/g;
    n[0] = n[0].replace(a, "/"), e = n.join(s);
    var o = e;
    if (o = o.trim(), !r && e.split("#").length === 1) {
        var h = Oy.exec(o);
        if (h) return this.path = o, this.href = o, this.pathname = h[1], h[2] ? (this.search = h[2], t ? this.query = Fo.parse(this.search.substr(1)) : this.query = this.search.substr(1)) : t && (this.search = "", this.query = {}), this
    }
    var l = Dy.exec(o);
    if (l) {
        l = l[0];
        var c = l.toLowerCase();
        this.protocol = c, o = o.substr(l.length)
    }
    if (r || l || o.match(/^\/\/[^@\/]+@[^@\/]+/)) {
        var f = o.substr(0, 2) === "//";
        f && !(l && Oo[l]) && (o = o.substr(2), this.slashes = !0)
    }
    if (!Oo[l] && (f || l && !Bi[l])) {
        for (var p = -1, m = 0; m < Dc.length; m++) {
            var v = o.indexOf(Dc[m]);
            v !== -1 && (p === -1 || v < p) && (p = v)
        }
        var _, y;
        p === -1 ? y = o.lastIndexOf("@") : y = o.lastIndexOf("@", p), y !== -1 && (_ = o.slice(0, y), o = o.slice(y + 1), this.auth = decodeURIComponent(_)), p = -1;
        for (var m = 0; m < Nc.length; m++) {
            var v = o.indexOf(Nc[m]);
            v !== -1 && (p === -1 || v < p) && (p = v)
        }
        p === -1 && (p = o.length), this.host = o.slice(0, p), o = o.slice(p), this.parseHost(), this.hostname = this.hostname || "";
        var A = this.hostname[0] === "[" && this.hostname[this.hostname.length - 1] === "]";
        if (!A)
            for (var I = this.hostname.split(/\./), m = 0, x = I.length; m < x; m++) {
                var S = I[m];
                if (S && !S.match(Bc)) {
                    for (var $ = "", k = 0, G = S.length; k < G; k++) S.charCodeAt(k) > 127 ? $ += "x" : $ += S[k];
                    if (!$.match(Bc)) {
                        var L = I.slice(0, m),
                            Y = I.slice(m + 1),
                            et = S.match(Uy);
                        et && (L.push(et[1]), Y.unshift(et[2])), Y.length && (o = "/" + Y.join(".") + o), this.hostname = L.join(".");
                        break
                    }
                }
            }
        this.hostname.length > Ly ? this.hostname = "" : this.hostname = this.hostname.toLowerCase(), A || (this.hostname = Ry.toASCII(this.hostname));
        var E = this.port ? ":" + this.port : "",
            D = this.hostname || "";
        this.host = D + E, this.href += this.host, A && (this.hostname = this.hostname.substr(1, this.hostname.length - 2), o[0] !== "/" && (o = "/" + o))
    }
    if (!Gy[c])
        for (var m = 0, x = Bo.length; m < x; m++) {
            var N = Bo[m];
            if (o.indexOf(N) !== -1) {
                var R = encodeURIComponent(N);
                R === N && (R = escape(N)), o = o.split(N).join(R)
            }
        }
    var j = o.indexOf("#");
    j !== -1 && (this.hash = o.substr(j), o = o.slice(0, j));
    var H = o.indexOf("?");
    if (H !== -1 ? (this.search = o.substr(H), this.query = o.substr(H + 1), t && (this.query = Fo.parse(this.query)), o = o.slice(0, H)) : t && (this.search = "", this.query = {}), o && (this.pathname = o), Bi[c] && this.hostname && !this.pathname && (this.pathname = "/"), this.pathname || this.search) {
        var E = this.pathname || "",
            U = this.search || "";
        this.path = E + U
    }
    return this.href = this.format(), this
};

function $y(e) {
    return Qe.isString(e) && (e = aa(e)), e instanceof Ve ? e.format() : Ve.prototype.format.call(e)
}
Ve.prototype.format = function() {
    var e = this.auth || "";
    e && (e = encodeURIComponent(e), e = e.replace(/%3A/i, ":"), e += "@");
    var t = this.protocol || "",
        r = this.pathname || "",
        i = this.hash || "",
        s = !1,
        n = "";
    this.host ? s = e + this.host : this.hostname && (s = e + (this.hostname.indexOf(":") === -1 ? this.hostname : "[" + this.hostname + "]"), this.port && (s += ":" + this.port)), this.query && Qe.isObject(this.query) && Object.keys(this.query).length && (n = Fo.stringify(this.query));
    var a = this.search || n && "?" + n || "";
    return t && t.substr(-1) !== ":" && (t += ":"), this.slashes || (!t || Bi[t]) && s !== !1 ? (s = "//" + (s || ""), r && r.charAt(0) !== "/" && (r = "/" + r)) : s || (s = ""), i && i.charAt(0) !== "#" && (i = "#" + i), a && a.charAt(0) !== "?" && (a = "?" + a), r = r.replace(/[?#]/g, function(o) {
        return encodeURIComponent(o)
    }), a = a.replace("#", "%23"), t + s + r + a + i
};

function Hy(e, t) {
    return aa(e, !1, !0).resolve(t)
}
Ve.prototype.resolve = function(e) {
    return this.resolveObject(aa(e, !1, !0)).format()
};
Ve.prototype.resolveObject = function(e) {
    if (Qe.isString(e)) {
        var t = new Ve;
        t.parse(e, !1, !0), e = t
    }
    for (var r = new Ve, i = Object.keys(this), s = 0; s < i.length; s++) {
        var n = i[s];
        r[n] = this[n]
    }
    if (r.hash = e.hash, e.href === "") return r.href = r.format(), r;
    if (e.slashes && !e.protocol) {
        for (var a = Object.keys(e), o = 0; o < a.length; o++) {
            var h = a[o];
            h !== "protocol" && (r[h] = e[h])
        }
        return Bi[r.protocol] && r.hostname && !r.pathname && (r.path = r.pathname = "/"), r.href = r.format(), r
    }
    if (e.protocol && e.protocol !== r.protocol) {
        if (!Bi[e.protocol]) {
            for (var l = Object.keys(e), c = 0; c < l.length; c++) {
                var f = l[c];
                r[f] = e[f]
            }
            return r.href = r.format(), r
        }
        if (r.protocol = e.protocol, !e.host && !Oo[e.protocol]) {
            for (var x = (e.pathname || "").split("/"); x.length && !(e.host = x.shift()););
            e.host || (e.host = ""), e.hostname || (e.hostname = ""), x[0] !== "" && x.unshift(""), x.length < 2 && x.unshift(""), r.pathname = x.join("/")
        } else r.pathname = e.pathname;
        if (r.search = e.search, r.query = e.query, r.host = e.host || "", r.auth = e.auth, r.hostname = e.hostname || e.host, r.port = e.port, r.pathname || r.search) {
            var p = r.pathname || "",
                m = r.search || "";
            r.path = p + m
        }
        return r.slashes = r.slashes || e.slashes, r.href = r.format(), r
    }
    var v = r.pathname && r.pathname.charAt(0) === "/",
        _ = e.host || e.pathname && e.pathname.charAt(0) === "/",
        y = _ || v || r.host && e.pathname,
        A = y,
        I = r.pathname && r.pathname.split("/") || [],
        x = e.pathname && e.pathname.split("/") || [],
        S = r.protocol && !Bi[r.protocol];
    if (S && (r.hostname = "", r.port = null, r.host && (I[0] === "" ? I[0] = r.host : I.unshift(r.host)), r.host = "", e.protocol && (e.hostname = null, e.port = null, e.host && (x[0] === "" ? x[0] = e.host : x.unshift(e.host)), e.host = null), y = y && (x[0] === "" || I[0] === "")), _) r.host = e.host || e.host === "" ? e.host : r.host, r.hostname = e.hostname || e.hostname === "" ? e.hostname : r.hostname, r.search = e.search, r.query = e.query, I = x;
    else if (x.length) I || (I = []), I.pop(), I = I.concat(x), r.search = e.search, r.query = e.query;
    else if (!Qe.isNullOrUndefined(e.search)) {
        if (S) {
            r.hostname = r.host = I.shift();
            var $ = r.host && r.host.indexOf("@") > 0 ? r.host.split("@") : !1;
            $ && (r.auth = $.shift(), r.host = r.hostname = $.shift())
        }
        return r.search = e.search, r.query = e.query, (!Qe.isNull(r.pathname) || !Qe.isNull(r.search)) && (r.path = (r.pathname ? r.pathname : "") + (r.search ? r.search : "")), r.href = r.format(), r
    }
    if (!I.length) return r.pathname = null, r.search ? r.path = "/" + r.search : r.path = null, r.href = r.format(), r;
    for (var k = I.slice(-1)[0], G = (r.host || e.host || I.length > 1) && (k === "." || k === "..") || k === "", L = 0, Y = I.length; Y >= 0; Y--) k = I[Y], k === "." ? I.splice(Y, 1) : k === ".." ? (I.splice(Y, 1), L++) : L && (I.splice(Y, 1), L--);
    if (!y && !A)
        for (; L--; L) I.unshift("..");
    y && I[0] !== "" && (!I[0] || I[0].charAt(0) !== "/") && I.unshift(""), G && I.join("/").substr(-1) !== "/" && I.push("");
    var et = I[0] === "" || I[0] && I[0].charAt(0) === "/";
    if (S) {
        r.hostname = r.host = et ? "" : I.length ? I.shift() : "";
        var $ = r.host && r.host.indexOf("@") > 0 ? r.host.split("@") : !1;
        $ && (r.auth = $.shift(), r.host = r.hostname = $.shift())
    }
    return y = y || r.host && I.length, y && !et && I.unshift(""), I.length ? r.pathname = I.join("/") : (r.pathname = null, r.path = null), (!Qe.isNull(r.pathname) || !Qe.isNull(r.search)) && (r.path = (r.pathname ? r.pathname : "") + (r.search ? r.search : "")), r.auth = e.auth || r.auth, r.slashes = r.slashes || e.slashes, r.href = r.format(), r
};
Ve.prototype.parseHost = function() {
    var e = this.host,
        t = By.exec(e);
    t && (t = t[0], t !== ":" && (this.port = t.substr(1)), e = e.substr(0, e.length - t.length)), e && (this.hostname = e)
};
const Vy = {
    parse: My,
    format: Ny,
    resolve: Py
};

function Be(e) {
    if (typeof e != "string") throw new TypeError(`Path must be a string. Received ${JSON.stringify(e)}`)
}

function ts(e) {
    return e.split("?")[0].split("#")[0]
}

function zy(e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function Xy(e, t, r) {
    return e.replace(new RegExp(zy(t), "g"), r)
}

function jy(e, t) {
    let r = "",
        i = 0,
        s = -1,
        n = 0,
        a = -1;
    for (let o = 0; o <= e.length; ++o) {
        if (o < e.length) a = e.charCodeAt(o);
        else {
            if (a === 47) break;
            a = 47
        }
        if (a === 47) {
            if (!(s === o - 1 || n === 1))
                if (s !== o - 1 && n === 2) {
                    if (r.length < 2 || i !== 2 || r.charCodeAt(r.length - 1) !== 46 || r.charCodeAt(r.length - 2) !== 46) {
                        if (r.length > 2) {
                            const h = r.lastIndexOf("/");
                            if (h !== r.length - 1) {
                                h === -1 ? (r = "", i = 0) : (r = r.slice(0, h), i = r.length - 1 - r.lastIndexOf("/")), s = o, n = 0;
                                continue
                            }
                        } else if (r.length === 2 || r.length === 1) {
                            r = "", i = 0, s = o, n = 0;
                            continue
                        }
                    }
                    t && (r.length > 0 ? r += "/.." : r = "..", i = 2)
                } else r.length > 0 ? r += `/${e.slice(s+1,o)}` : r = e.slice(s + 1, o), i = o - s - 1;
            s = o, n = 0
        } else a === 46 && n !== -1 ? ++n : n = -1
    }
    return r
}
const ye = {
        toPosix(e) {
            return Xy(e, "\\", "/")
        },
        isUrl(e) {
            return /^https?:/.test(this.toPosix(e))
        },
        isDataUrl(e) {
            return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(e)
        },
        hasProtocol(e) {
            return /^[^/:]+:\//.test(this.toPosix(e))
        },
        getProtocol(e) {
            Be(e), e = this.toPosix(e);
            let t = "";
            const r = /^file:\/\/\//.exec(e),
                i = /^[^/:]+:\/\//.exec(e),
                s = /^[^/:]+:\//.exec(e);
            if (r || i || s) {
                const n = (r == null ? void 0 : r[0]) || (i == null ? void 0 : i[0]) || (s == null ? void 0 : s[0]);
                t = n, e = e.slice(n.length)
            }
            return t
        },
        toAbsolute(e, t, r) {
            if (this.isDataUrl(e)) return e;
            const i = ts(this.toPosix(t??K.ADAPTER.getBaseUrl())),
                s = ts(this.toPosix(r??this.rootname(i)));
            return Be(e), e = this.toPosix(e), e.startsWith("/") ? ye.join(s, e.slice(1)) : this.isAbsolute(e) ? e : this.join(i, e)
        },
        normalize(e) {
            if (e = this.toPosix(e), Be(e), e.length === 0) return ".";
            let t = "";
            const r = e.startsWith("/");
            this.hasProtocol(e) && (t = this.rootname(e), e = e.slice(t.length));
            const i = e.endsWith("/");
            return e = jy(e, !1), e.length > 0 && i && (e += "/"), r ? `/${e}` : t + e
        },
        isAbsolute(e) {
            return Be(e), e = this.toPosix(e), this.hasProtocol(e) ? !0 : e.startsWith("/")
        },
        join(...e) {
            if (e.length === 0) return ".";
            let t;
            for (let r = 0; r < e.length; ++r) {
                const i = e[r];
                if (Be(i), i.length > 0)
                    if (t === void 0) t = i;
                    else {
                        const s = e[r - 1]??"";
                        this.extname(s) ? t += `/../${i}` : t += `/${i}`
                    }
            }
            return t === void 0 ? "." : this.normalize(t)
        },
        dirname(e) {
            if (Be(e), e.length === 0) return ".";
            e = this.toPosix(e);
            let t = e.charCodeAt(0);
            const r = t === 47;
            let i = -1,
                s = !0;
            const n = this.getProtocol(e),
                a = e;
            e = e.slice(n.length);
            for (let o = e.length - 1; o >= 1; --o)
                if (t = e.charCodeAt(o), t === 47) {
                    if (!s) {
                        i = o;
                        break
                    }
                } else s = !1;
            return i === -1 ? r ? "/" : this.isUrl(a) ? n + e : n : r && i === 1 ? "//" : n + e.slice(0, i)
        },
        rootname(e) {
            Be(e), e = this.toPosix(e);
            let t = "";
            if (e.startsWith("/") ? t = "/" : t = this.getProtocol(e), this.isUrl(e)) {
                const r = e.indexOf("/", t.length);
                r !== -1 ? t = e.slice(0, r) : t = e, t.endsWith("/") || (t += "/")
            }
            return t
        },
        basename(e, t) {
            Be(e), t && Be(t), e = ts(this.toPosix(e));
            let r = 0,
                i = -1,
                s = !0,
                n;
            if (t !== void 0 && t.length > 0 && t.length <= e.length) {
                if (t.length === e.length && t === e) return "";
                let a = t.length - 1,
                    o = -1;
                for (n = e.length - 1; n >= 0; --n) {
                    const h = e.charCodeAt(n);
                    if (h === 47) {
                        if (!s) {
                            r = n + 1;
                            break
                        }
                    } else o === -1 && (s = !1, o = n + 1), a >= 0 && (h === t.charCodeAt(a) ? --a === -1 && (i = n) : (a = -1, i = o))
                }
                return r === i ? i = o : i === -1 && (i = e.length), e.slice(r, i)
            }
            for (n = e.length - 1; n >= 0; --n)
                if (e.charCodeAt(n) === 47) {
                    if (!s) {
                        r = n + 1;
                        break
                    }
                } else i === -1 && (s = !1, i = n + 1);
            return i === -1 ? "" : e.slice(r, i)
        },
        extname(e) {
            Be(e), e = ts(this.toPosix(e));
            let t = -1,
                r = 0,
                i = -1,
                s = !0,
                n = 0;
            for (let a = e.length - 1; a >= 0; --a) {
                const o = e.charCodeAt(a);
                if (o === 47) {
                    if (!s) {
                        r = a + 1;
                        break
                    }
                    continue
                }
                i === -1 && (s = !1, i = a + 1), o === 46 ? t === -1 ? t = a : n !== 1 && (n = 1) : t !== -1 && (n = -1)
            }
            return t === -1 || i === -1 || n === 0 || n === 1 && t === i - 1 && t === r + 1 ? "" : e.slice(t, i)
        },
        parse(e) {
            Be(e);
            const t = {
                root: "",
                dir: "",
                base: "",
                ext: "",
                name: ""
            };
            if (e.length === 0) return t;
            e = ts(this.toPosix(e));
            let r = e.charCodeAt(0);
            const i = this.isAbsolute(e);
            let s;
            t.root = this.rootname(e), i || this.hasProtocol(e) ? s = 1 : s = 0;
            let n = -1,
                a = 0,
                o = -1,
                h = !0,
                l = e.length - 1,
                c = 0;
            for (; l >= s; --l) {
                if (r = e.charCodeAt(l), r === 47) {
                    if (!h) {
                        a = l + 1;
                        break
                    }
                    continue
                }
                o === -1 && (h = !1, o = l + 1), r === 46 ? n === -1 ? n = l : c !== 1 && (c = 1) : n !== -1 && (c = -1)
            }
            return n === -1 || o === -1 || c === 0 || c === 1 && n === o - 1 && n === a + 1 ? o !== -1 && (a === 0 && i ? t.base = t.name = e.slice(1, o) : t.base = t.name = e.slice(a, o)) : (a === 0 && i ? (t.name = e.slice(1, n), t.base = e.slice(1, o)) : (t.name = e.slice(a, n), t.base = e.slice(a, o)), t.ext = e.slice(n, o)), t.dir = this.dirname(e), t
        },
        sep: "/",
        delimiter: ":"
    },
    Oc = {};

function Et(e, t, r = 3) {
    if (Oc[t]) return;
    let i = new Error().stack;
    typeof i > "u" ? console.warn("PixiJS Deprecation Warning: ", `${t}
Deprecated since v${e}`) : (i = i.split(`
`).splice(r).join(`
`), console.groupCollapsed ? (console.groupCollapsed("%cPixiJS Deprecation Warning: %c%s", "color:#614108;background:#fffbe6", "font-weight:normal;color:#614108;background:#fffbe6", `${t}
Deprecated since v${e}`), console.warn(i), console.groupEnd()) : (console.warn("PixiJS Deprecation Warning: ", `${t}
Deprecated since v${e}`), console.warn(i))), Oc[t] = !0
}
let Ja;

function Wy() {
    return typeof Ja > "u" && (Ja = function() {
        var r;
        const t = {
            stencil: !0,
            failIfMajorPerformanceCaveat: K.FAIL_IF_MAJOR_PERFORMANCE_CAVEAT
        };
        try {
            if (!K.ADAPTER.getWebGLRenderingContext()) return !1;
            const i = K.ADAPTER.createCanvas();
            let s = i.getContext("webgl", t) || i.getContext("experimental-webgl", t);
            const n = !!((r = s == null ? void 0 : s.getContextAttributes()) != null && r.stencil);
            if (s) {
                const a = s.getExtension("WEBGL_lose_context");
                a && a.loseContext()
            }
            return s = null, n
        } catch {
            return !1
        }
    }()), Ja
}
var Yy = {
        grad: .9,
        turn: 360,
        rad: 360 / (2 * Math.PI)
    },
    dr = function(e) {
        return typeof e == "string" ? e.length > 0 : typeof e == "number"
    },
    ie = function(e, t, r) {
        return t === void 0 && (t = 0), r === void 0 && (r = Math.pow(10, t)), Math.round(r * e) / r + 0
    },
    Me = function(e, t, r) {
        return t === void 0 && (t = 0), r === void 0 && (r = 1), e > r ? r : e > t ? e : t
    },
    Sf = function(e) {
        return (e = isFinite(e) ? e % 360 : 0) > 0 ? e : e + 360
    },
    Fc = function(e) {
        return {
            r: Me(e.r, 0, 255),
            g: Me(e.g, 0, 255),
            b: Me(e.b, 0, 255),
            a: Me(e.a)
        }
    },
    Qa = function(e) {
        return {
            r: ie(e.r),
            g: ie(e.g),
            b: ie(e.b),
            a: ie(e.a, 3)
        }
    },
    qy = /^#([0-9a-f]{3,8})$/i,
    Js = function(e) {
        var t = e.toString(16);
        return t.length < 2 ? "0" + t : t
    },
    If = function(e) {
        var t = e.r,
            r = e.g,
            i = e.b,
            s = e.a,
            n = Math.max(t, r, i),
            a = n - Math.min(t, r, i),
            o = a ? n === t ? (r - i) / a : n === r ? 2 + (i - t) / a : 4 + (t - r) / a : 0;
        return {
            h: 60 * (o < 0 ? o + 6 : o),
            s: n ? a / n * 100 : 0,
            v: n / 255 * 100,
            a: s
        }
    },
    Rf = function(e) {
        var t = e.h,
            r = e.s,
            i = e.v,
            s = e.a;
        t = t / 360 * 6, r /= 100, i /= 100;
        var n = Math.floor(t),
            a = i * (1 - r),
            o = i * (1 - (t - n) * r),
            h = i * (1 - (1 - t + n) * r),
            l = n % 6;
        return {
            r: 255 * [i, o, a, a, h, i][l],
            g: 255 * [h, i, i, o, a, a][l],
            b: 255 * [a, a, h, i, i, o][l],
            a: s
        }
    },
    kc = function(e) {
        return {
            h: Sf(e.h),
            s: Me(e.s, 0, 100),
            l: Me(e.l, 0, 100),
            a: Me(e.a)
        }
    },
    Lc = function(e) {
        return {
            h: ie(e.h),
            s: ie(e.s),
            l: ie(e.l),
            a: ie(e.a, 3)
        }
    },
    Uc = function(e) {
        return Rf((r = (t = e).s, {
            h: t.h,
            s: (r *= ((i = t.l) < 50 ? i : 100 - i) / 100) > 0 ? 2 * r / (i + r) * 100 : 0,
            v: i + r,
            a: t.a
        }));
        var t, r, i
    },
    ms = function(e) {
        return {
            h: (t = If(e)).h,
            s: (s = (200 - (r = t.s)) * (i = t.v) / 100) > 0 && s < 200 ? r * i / 100 / (s <= 100 ? s : 200 - s) * 100 : 0,
            l: s / 2,
            a: t.a
        };
        var t, r, i, s
    },
    Zy = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s*,\s*([+-]?\d*\.?\d+)%\s*,\s*([+-]?\d*\.?\d+)%\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    Ky = /^hsla?\(\s*([+-]?\d*\.?\d+)(deg|rad|grad|turn)?\s+([+-]?\d*\.?\d+)%\s+([+-]?\d*\.?\d+)%\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    Jy = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*,\s*([+-]?\d*\.?\d+)(%)?\s*(?:,\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    Qy = /^rgba?\(\s*([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s+([+-]?\d*\.?\d+)(%)?\s*(?:\/\s*([+-]?\d*\.?\d+)(%)?\s*)?\)$/i,
    ko = {
        string: [
            [function(e) {
                var t = qy.exec(e);
                return t ? (e = t[1]).length <= 4 ? {
                    r: parseInt(e[0] + e[0], 16),
                    g: parseInt(e[1] + e[1], 16),
                    b: parseInt(e[2] + e[2], 16),
                    a: e.length === 4 ? ie(parseInt(e[3] + e[3], 16) / 255, 2) : 1
                } : e.length === 6 || e.length === 8 ? {
                    r: parseInt(e.substr(0, 2), 16),
                    g: parseInt(e.substr(2, 2), 16),
                    b: parseInt(e.substr(4, 2), 16),
                    a: e.length === 8 ? ie(parseInt(e.substr(6, 2), 16) / 255, 2) : 1
                } : null : null
            }, "hex"],
            [function(e) {
                var t = Jy.exec(e) || Qy.exec(e);
                return t ? t[2] !== t[4] || t[4] !== t[6] ? null : Fc({
                    r: Number(t[1]) / (t[2] ? 100 / 255 : 1),
                    g: Number(t[3]) / (t[4] ? 100 / 255 : 1),
                    b: Number(t[5]) / (t[6] ? 100 / 255 : 1),
                    a: t[7] === void 0 ? 1 : Number(t[7]) / (t[8] ? 100 : 1)
                }) : null
            }, "rgb"],
            [function(e) {
                var t = Zy.exec(e) || Ky.exec(e);
                if (!t) return null;
                var r, i, s = kc({
                    h: (r = t[1], i = t[2], i === void 0 && (i = "deg"), Number(r) * (Yy[i] || 1)),
                    s: Number(t[3]),
                    l: Number(t[4]),
                    a: t[5] === void 0 ? 1 : Number(t[5]) / (t[6] ? 100 : 1)
                });
                return Uc(s)
            }, "hsl"]
        ],
        object: [
            [function(e) {
                var t = e.r,
                    r = e.g,
                    i = e.b,
                    s = e.a,
                    n = s === void 0 ? 1 : s;
                return dr(t) && dr(r) && dr(i) ? Fc({
                    r: Number(t),
                    g: Number(r),
                    b: Number(i),
                    a: Number(n)
                }) : null
            }, "rgb"],
            [function(e) {
                var t = e.h,
                    r = e.s,
                    i = e.l,
                    s = e.a,
                    n = s === void 0 ? 1 : s;
                if (!dr(t) || !dr(r) || !dr(i)) return null;
                var a = kc({
                    h: Number(t),
                    s: Number(r),
                    l: Number(i),
                    a: Number(n)
                });
                return Uc(a)
            }, "hsl"],
            [function(e) {
                var t = e.h,
                    r = e.s,
                    i = e.v,
                    s = e.a,
                    n = s === void 0 ? 1 : s;
                if (!dr(t) || !dr(r) || !dr(i)) return null;
                var a = function(o) {
                    return {
                        h: Sf(o.h),
                        s: Me(o.s, 0, 100),
                        v: Me(o.v, 0, 100),
                        a: Me(o.a)
                    }
                }({
                    h: Number(t),
                    s: Number(r),
                    v: Number(i),
                    a: Number(n)
                });
                return Rf(a)
            }, "hsv"]
        ]
    },
    Gc = function(e, t) {
        for (var r = 0; r < t.length; r++) {
            var i = t[r][0](e);
            if (i) return [i, t[r][1]]
        }
        return [null, void 0]
    },
    tx = function(e) {
        return typeof e == "string" ? Gc(e.trim(), ko.string) : typeof e == "object" && e !== null ? Gc(e, ko.object) : [null, void 0]
    },
    to = function(e, t) {
        var r = ms(e);
        return {
            h: r.h,
            s: Me(r.s + 100 * t, 0, 100),
            l: r.l,
            a: r.a
        }
    },
    eo = function(e) {
        return (299 * e.r + 587 * e.g + 114 * e.b) / 1e3 / 255
    },
    $c = function(e, t) {
        var r = ms(e);
        return {
            h: r.h,
            s: r.s,
            l: Me(r.l + 100 * t, 0, 100),
            a: r.a
        }
    },
    Lo = function() {
        function e(t) {
            this.parsed = tx(t)[0], this.rgba = this.parsed || {
                r: 0,
                g: 0,
                b: 0,
                a: 1
            }
        }
        return e.prototype.isValid = function() {
            return this.parsed !== null
        }, e.prototype.brightness = function() {
            return ie(eo(this.rgba), 2)
        }, e.prototype.isDark = function() {
            return eo(this.rgba) < .5
        }, e.prototype.isLight = function() {
            return eo(this.rgba) >= .5
        }, e.prototype.toHex = function() {
            return t = Qa(this.rgba), r = t.r, i = t.g, s = t.b, a = (n = t.a) < 1 ? Js(ie(255 * n)) : "", "#" + Js(r) + Js(i) + Js(s) + a;
            var t, r, i, s, n, a
        }, e.prototype.toRgb = function() {
            return Qa(this.rgba)
        }, e.prototype.toRgbString = function() {
            return t = Qa(this.rgba), r = t.r, i = t.g, s = t.b, (n = t.a) < 1 ? "rgba(" + r + ", " + i + ", " + s + ", " + n + ")" : "rgb(" + r + ", " + i + ", " + s + ")";
            var t, r, i, s, n
        }, e.prototype.toHsl = function() {
            return Lc(ms(this.rgba))
        }, e.prototype.toHslString = function() {
            return t = Lc(ms(this.rgba)), r = t.h, i = t.s, s = t.l, (n = t.a) < 1 ? "hsla(" + r + ", " + i + "%, " + s + "%, " + n + ")" : "hsl(" + r + ", " + i + "%, " + s + "%)";
            var t, r, i, s, n
        }, e.prototype.toHsv = function() {
            return t = If(this.rgba), {
                h: ie(t.h),
                s: ie(t.s),
                v: ie(t.v),
                a: ie(t.a, 3)
            };
            var t
        }, e.prototype.invert = function() {
            return Ze({
                r: 255 - (t = this.rgba).r,
                g: 255 - t.g,
                b: 255 - t.b,
                a: t.a
            });
            var t
        }, e.prototype.saturate = function(t) {
            return t === void 0 && (t = .1), Ze(to(this.rgba, t))
        }, e.prototype.desaturate = function(t) {
            return t === void 0 && (t = .1), Ze(to(this.rgba, -t))
        }, e.prototype.grayscale = function() {
            return Ze(to(this.rgba, -1))
        }, e.prototype.lighten = function(t) {
            return t === void 0 && (t = .1), Ze($c(this.rgba, t))
        }, e.prototype.darken = function(t) {
            return t === void 0 && (t = .1), Ze($c(this.rgba, -t))
        }, e.prototype.rotate = function(t) {
            return t === void 0 && (t = 15), this.hue(this.hue() + t)
        }, e.prototype.alpha = function(t) {
            return typeof t == "number" ? Ze({
                r: (r = this.rgba).r,
                g: r.g,
                b: r.b,
                a: t
            }) : ie(this.rgba.a, 3);
            var r
        }, e.prototype.hue = function(t) {
            var r = ms(this.rgba);
            return typeof t == "number" ? Ze({
                h: t,
                s: r.s,
                l: r.l,
                a: r.a
            }) : ie(r.h)
        }, e.prototype.isEqual = function(t) {
            return this.toHex() === Ze(t).toHex()
        }, e
    }(),
    Ze = function(e) {
        return e instanceof Lo ? e : new Lo(e)
    },
    Hc = [],
    ex = function(e) {
        e.forEach(function(t) {
            Hc.indexOf(t) < 0 && (t(Lo, ko), Hc.push(t))
        })
    };

function rx(e, t) {
    var r = {
            white: "#ffffff",
            bisque: "#ffe4c4",
            blue: "#0000ff",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            azure: "#f0ffff",
            whitesmoke: "#f5f5f5",
            papayawhip: "#ffefd5",
            plum: "#dda0dd",
            blanchedalmond: "#ffebcd",
            black: "#000000",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gainsboro: "#dcdcdc",
            cornsilk: "#fff8dc",
            cornflowerblue: "#6495ed",
            burlywood: "#deb887",
            aquamarine: "#7fffd4",
            beige: "#f5f5dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkkhaki: "#bdb76b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkgrey: "#a9a9a9",
            peachpuff: "#ffdab9",
            darkmagenta: "#8b008b",
            darkred: "#8b0000",
            darkorchid: "#9932cc",
            darkorange: "#ff8c00",
            darkslateblue: "#483d8b",
            gray: "#808080",
            darkslategray: "#2f4f4f",
            darkslategrey: "#2f4f4f",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            wheat: "#f5deb3",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            ghostwhite: "#f8f8ff",
            darkviolet: "#9400d3",
            magenta: "#ff00ff",
            green: "#008000",
            dodgerblue: "#1e90ff",
            grey: "#808080",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            blueviolet: "#8a2be2",
            forestgreen: "#228b22",
            lawngreen: "#7cfc00",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            fuchsia: "#ff00ff",
            brown: "#a52a2a",
            maroon: "#800000",
            mediumblue: "#0000cd",
            lightcoral: "#f08080",
            darkturquoise: "#00ced1",
            lightcyan: "#e0ffff",
            ivory: "#fffff0",
            lightyellow: "#ffffe0",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            linen: "#faf0e6",
            mediumaquamarine: "#66cdaa",
            lemonchiffon: "#fffacd",
            lime: "#00ff00",
            khaki: "#f0e68c",
            mediumseagreen: "#3cb371",
            limegreen: "#32cd32",
            mediumspringgreen: "#00fa9a",
            lightskyblue: "#87cefa",
            lightblue: "#add8e6",
            midnightblue: "#191970",
            lightpink: "#ffb6c1",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            mintcream: "#f5fffa",
            lightslategray: "#778899",
            lightslategrey: "#778899",
            navajowhite: "#ffdead",
            navy: "#000080",
            mediumvioletred: "#c71585",
            powderblue: "#b0e0e6",
            palegoldenrod: "#eee8aa",
            oldlace: "#fdf5e6",
            paleturquoise: "#afeeee",
            mediumturquoise: "#48d1cc",
            mediumorchid: "#ba55d3",
            rebeccapurple: "#663399",
            lightsteelblue: "#b0c4de",
            mediumslateblue: "#7b68ee",
            thistle: "#d8bfd8",
            tan: "#d2b48c",
            orchid: "#da70d6",
            mediumpurple: "#9370db",
            purple: "#800080",
            pink: "#ffc0cb",
            skyblue: "#87ceeb",
            springgreen: "#00ff7f",
            palegreen: "#98fb98",
            red: "#ff0000",
            yellow: "#ffff00",
            slateblue: "#6a5acd",
            lavenderblush: "#fff0f5",
            peru: "#cd853f",
            palevioletred: "#db7093",
            violet: "#ee82ee",
            teal: "#008080",
            slategray: "#708090",
            slategrey: "#708090",
            aliceblue: "#f0f8ff",
            darkseagreen: "#8fbc8f",
            darkolivegreen: "#556b2f",
            greenyellow: "#adff2f",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            tomato: "#ff6347",
            silver: "#c0c0c0",
            sienna: "#a0522d",
            lavender: "#e6e6fa",
            lightgreen: "#90ee90",
            orange: "#ffa500",
            orangered: "#ff4500",
            steelblue: "#4682b4",
            royalblue: "#4169e1",
            turquoise: "#40e0d0",
            yellowgreen: "#9acd32",
            salmon: "#fa8072",
            saddlebrown: "#8b4513",
            sandybrown: "#f4a460",
            rosybrown: "#bc8f8f",
            darksalmon: "#e9967a",
            lightgoldenrodyellow: "#fafad2",
            snow: "#fffafa",
            lightgrey: "#d3d3d3",
            lightgray: "#d3d3d3",
            dimgray: "#696969",
            dimgrey: "#696969",
            olivedrab: "#6b8e23",
            olive: "#808000"
        },
        i = {};
    for (var s in r) i[r[s]] = s;
    var n = {};
    e.prototype.toName = function(a) {
        if (!(this.rgba.a || this.rgba.r || this.rgba.g || this.rgba.b)) return "transparent";
        var o, h, l = i[this.toHex()];
        if (l) return l;
        if (a != null && a.closest) {
            var c = this.toRgb(),
                f = 1 / 0,
                p = "black";
            if (!n.length)
                for (var m in r) n[m] = new e(r[m]).toRgb();
            for (var v in r) {
                var _ = (o = c, h = n[v], Math.pow(o.r - h.r, 2) + Math.pow(o.g - h.g, 2) + Math.pow(o.b - h.b, 2));
                _ < f && (f = _, p = v)
            }
            return p
        }
    }, t.string.push([function(a) {
        var o = a.toLowerCase(),
            h = o === "transparent" ? "#0000" : r[o];
        return h ? new e(h).toRgb() : null
    }, "name"])
}
ex([rx]);
const Oi = class {
    constructor(e = 16777215) {
        this._value = null, this._components = new Float32Array(4), this._components.fill(1), this._int = 16777215, this.value = e
    }
    get red() {
        return this._components[0]
    }
    get green() {
        return this._components[1]
    }
    get blue() {
        return this._components[2]
    }
    get alpha() {
        return this._components[3]
    }
    setValue(e) {
        return this.value = e, this
    }
    set value(e) {
        if (e instanceof Oi) this._value = this.cloneSource(e._value), this._int = e._int, this._components.set(e._components);
        else {
            if (e === null) throw new Error("Cannot set PIXI.Color#value to null");
            (this._value === null || !this.isSourceEqual(this._value, e)) && (this.normalize(e), this._value = this.cloneSource(e))
        }
    }
    get value() {
        return this._value
    }
    cloneSource(e) {
        return typeof e == "string" || typeof e == "number" || e instanceof Number || e === null ? e : Array.isArray(e) || ArrayBuffer.isView(e) ? e.slice(0) : typeof e == "object" && e !== null ? { ...e
        } : e
    }
    isSourceEqual(e, t) {
        const r = typeof e;
        if (r !== typeof t) return !1;
        if (r === "number" || r === "string" || e instanceof Number) return e === t;
        if (Array.isArray(e) && Array.isArray(t) || ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) return e.length !== t.length ? !1 : e.every((s, n) => s === t[n]);
        if (e !== null && t !== null) {
            const s = Object.keys(e),
                n = Object.keys(t);
            return s.length !== n.length ? !1 : s.every(a => e[a] === t[a])
        }
        return e === t
    }
    toRgba() {
        const [e, t, r, i] = this._components;
        return {
            r: e,
            g: t,
            b: r,
            a: i
        }
    }
    toRgb() {
        const [e, t, r] = this._components;
        return {
            r: e,
            g: t,
            b: r
        }
    }
    toRgbaString() {
        const [e, t, r] = this.toUint8RgbArray();
        return `rgba(${e},${t},${r},${this.alpha})`
    }
    toUint8RgbArray(e) {
        const [t, r, i] = this._components;
        return e = e??[], e[0] = Math.round(t * 255), e[1] = Math.round(r * 255), e[2] = Math.round(i * 255), e
    }
    toRgbArray(e) {
        e = e??[];
        const [t, r, i] = this._components;
        return e[0] = t, e[1] = r, e[2] = i, e
    }
    toNumber() {
        return this._int
    }
    toLittleEndianNumber() {
        const e = this._int;
        return (e >> 16) + (e & 65280) + ((e & 255) << 16)
    }
    multiply(e) {
        const [t, r, i, s] = Oi.temp.setValue(e)._components;
        return this._components[0] *= t, this._components[1] *= r, this._components[2] *= i, this._components[3] *= s, this.refreshInt(), this._value = null, this
    }
    premultiply(e, t = !0) {
        return t && (this._components[0] *= e, this._components[1] *= e, this._components[2] *= e), this._components[3] = e, this.refreshInt(), this._value = null, this
    }
    toPremultiplied(e, t = !0) {
        if (e === 1) return (255 << 24) + this._int;
        if (e === 0) return t ? 0 : this._int;
        let r = this._int >> 16 & 255,
            i = this._int >> 8 & 255,
            s = this._int & 255;
        return t && (r = r * e + .5 | 0, i = i * e + .5 | 0, s = s * e + .5 | 0), (e * 255 << 24) + (r << 16) + (i << 8) + s
    }
    toHex() {
        const e = this._int.toString(16);
        return `#${"000000".substring(0,6-e.length)+e}`
    }
    toHexa() {
        const t = Math.round(this._components[3] * 255).toString(16);
        return this.toHex() + "00".substring(0, 2 - t.length) + t
    }
    setAlpha(e) {
        return this._components[3] = this._clamp(e), this
    }
    round(e) {
        const [t, r, i] = this._components;
        return this._components[0] = Math.round(t * e) / e, this._components[1] = Math.round(r * e) / e, this._components[2] = Math.round(i * e) / e, this.refreshInt(), this._value = null, this
    }
    toArray(e) {
        e = e??[];
        const [t, r, i, s] = this._components;
        return e[0] = t, e[1] = r, e[2] = i, e[3] = s, e
    }
    normalize(e) {
        let t, r, i, s;
        if ((typeof e == "number" || e instanceof Number) && e >= 0 && e <= 16777215) {
            const n = e;
            t = (n >> 16 & 255) / 255, r = (n >> 8 & 255) / 255, i = (n & 255) / 255, s = 1
        } else if ((Array.isArray(e) || e instanceof Float32Array) && e.length >= 3 && e.length <= 4) e = this._clamp(e), [t, r, i, s = 1] = e;
        else if ((e instanceof Uint8Array || e instanceof Uint8ClampedArray) && e.length >= 3 && e.length <= 4) e = this._clamp(e, 0, 255), [t, r, i, s = 255] = e, t /= 255, r /= 255, i /= 255, s /= 255;
        else if (typeof e == "string" || typeof e == "object") {
            if (typeof e == "string") {
                const a = Oi.HEX_PATTERN.exec(e);
                a && (e = `#${a[2]}`)
            }
            const n = Ze(e);
            n.isValid() && ({
                r: t,
                g: r,
                b: i,
                a: s
            } = n.rgba, t /= 255, r /= 255, i /= 255)
        }
        if (t !== void 0) this._components[0] = t, this._components[1] = r, this._components[2] = i, this._components[3] = s, this.refreshInt();
        else throw new Error(`Unable to convert color ${e}`)
    }
    refreshInt() {
        this._clamp(this._components);
        const [e, t, r] = this._components;
        this._int = (e * 255 << 16) + (t * 255 << 8) + (r * 255 | 0)
    }
    _clamp(e, t = 0, r = 1) {
        return typeof e == "number" ? Math.min(Math.max(e, t), r) : (e.forEach((i, s) => {
            e[s] = Math.min(Math.max(i, t), r)
        }), e)
    }
};
let Ot = Oi;
Ot.shared = new Oi;
Ot.temp = new Oi;
Ot.HEX_PATTERN = /^(#|0x)?(([a-f0-9]{3}){1,2}([a-f0-9]{2})?)$/i;

function ix() {
    const e = [],
        t = [];
    for (let i = 0; i < 32; i++) e[i] = i, t[i] = i;
    e[lt.NORMAL_NPM] = lt.NORMAL, e[lt.ADD_NPM] = lt.ADD, e[lt.SCREEN_NPM] = lt.SCREEN, t[lt.NORMAL] = lt.NORMAL_NPM, t[lt.ADD] = lt.ADD_NPM, t[lt.SCREEN] = lt.SCREEN_NPM;
    const r = [];
    return r.push(t), r.push(e), r
}
const Mf = ix();

function Pf(e, t) {
    return Mf[t ? 1 : 0][e]
}

function sx(e, t = null) {
    const r = e * 6;
    if (t = t || new Uint16Array(r), t.length !== r) throw new Error(`Out buffer length is incorrect, got ${t.length} and expected ${r}`);
    for (let i = 0, s = 0; i < r; i += 6, s += 4) t[i + 0] = s + 0, t[i + 1] = s + 1, t[i + 2] = s + 2, t[i + 3] = s + 0, t[i + 4] = s + 2, t[i + 5] = s + 3;
    return t
}

function Nf(e) {
    if (e.BYTES_PER_ELEMENT === 4) return e instanceof Float32Array ? "Float32Array" : e instanceof Uint32Array ? "Uint32Array" : "Int32Array";
    if (e.BYTES_PER_ELEMENT === 2) {
        if (e instanceof Uint16Array) return "Uint16Array"
    } else if (e.BYTES_PER_ELEMENT === 1 && e instanceof Uint8Array) return "Uint8Array";
    return null
}

function Ln(e) {
    return e += e === 0 ? 1 : 0, --e, e |= e >>> 1, e |= e >>> 2, e |= e >>> 4, e |= e >>> 8, e |= e >>> 16, e + 1
}

function Vc(e) {
    return !(e & e - 1) && !!e
}

function zc(e) {
    let t = (e > 65535 ? 1 : 0) << 4;
    e >>>= t;
    let r = (e > 255 ? 1 : 0) << 3;
    return e >>>= r, t |= r, r = (e > 15 ? 1 : 0) << 2, e >>>= r, t |= r, r = (e > 3 ? 1 : 0) << 1, e >>>= r, t |= r, t | e >> 1
}

function gs(e, t, r) {
    const i = e.length;
    let s;
    if (t >= i || r === 0) return;
    r = t + r > i ? i - t : r;
    const n = i - r;
    for (s = t; s < n; ++s) e[s] = e[s + r];
    e.length = n
}

function Mi(e) {
    return e === 0 ? 0 : e < 0 ? -1 : 1
}
let nx = 0;

function ei() {
    return ++nx
}
const Df = class {
    constructor(e, t, r, i) {
        this.left = e, this.top = t, this.right = r, this.bottom = i
    }
    get width() {
        return this.right - this.left
    }
    get height() {
        return this.bottom - this.top
    }
    isEmpty() {
        return this.left === this.right || this.top === this.bottom
    }
};
let Uo = Df;
Uo.EMPTY = new Df(0, 0, 0, 0);
const Xc = {},
    Ke = Object.create(null),
    Ir = Object.create(null);
class ax {
    constructor(t, r, i) {
        this._canvas = K.ADAPTER.createCanvas(), this._context = this._canvas.getContext("2d"), this.resolution = i || K.RESOLUTION, this.resize(t, r)
    }
    clear() {
        this._checkDestroyed(), this._context.setTransform(1, 0, 0, 1, 0, 0), this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
    }
    resize(t, r) {
        this._checkDestroyed(), this._canvas.width = Math.round(t * this.resolution), this._canvas.height = Math.round(r * this.resolution)
    }
    destroy() {
        this._context = null, this._canvas = null
    }
    get width() {
        return this._checkDestroyed(), this._canvas.width
    }
    set width(t) {
        this._checkDestroyed(), this._canvas.width = Math.round(t)
    }
    get height() {
        return this._checkDestroyed(), this._canvas.height
    }
    set height(t) {
        this._checkDestroyed(), this._canvas.height = Math.round(t)
    }
    get canvas() {
        return this._checkDestroyed(), this._canvas
    }
    get context() {
        return this._checkDestroyed(), this._context
    }
    _checkDestroyed() {
        if (this._canvas === null) throw new TypeError("The CanvasRenderTarget has already been destroyed")
    }
}

function jc(e, t, r) {
    for (let i = 0, s = 4 * r * t; i < t; ++i, s += 4)
        if (e[s + 3] !== 0) return !1;
    return !0
}

function Wc(e, t, r, i, s) {
    const n = 4 * t;
    for (let a = i, o = i * n + 4 * r; a <= s; ++a, o += n)
        if (e[o + 3] !== 0) return !1;
    return !0
}

function ox(e) {
    const {
        width: t,
        height: r
    } = e, i = e.getContext("2d", {
        willReadFrequently: !0
    });
    if (i === null) throw new TypeError("Failed to get canvas 2D context");
    const n = i.getImageData(0, 0, t, r).data;
    let a = 0,
        o = 0,
        h = t - 1,
        l = r - 1;
    for (; o < r && jc(n, t, o);) ++o;
    if (o === r) return Uo.EMPTY;
    for (; jc(n, t, l);) --l;
    for (; Wc(n, t, a, o, l);) ++a;
    for (; Wc(n, t, h, o, l);) --h;
    return ++h, ++l, new Uo(a, o, h, l)
}

function hx(e) {
    const t = ox(e),
        {
            width: r,
            height: i
        } = t;
    let s = null;
    if (!t.isEmpty()) {
        const n = e.getContext("2d");
        if (n === null) throw new TypeError("Failed to get canvas 2D context");
        s = n.getImageData(t.left, t.top, r, i)
    }
    return {
        width: r,
        height: i,
        data: s
    }
}
let Qs;

function lx(e, t = globalThis.location) {
    if (e.startsWith("data:")) return "";
    t = t || globalThis.location, Qs || (Qs = document.createElement("a")), Qs.href = e;
    const r = Vy.parse(Qs.href),
        i = !r.port && t.port === "" || r.port === t.port;
    return r.hostname !== t.hostname || !i || r.protocol !== t.protocol ? "anonymous" : ""
}

function Nr(e, t = 1) {
    var i;
    const r = (i = K.RETINA_PREFIX) == null ? void 0 : i.exec(e);
    return r ? parseFloat(r[1]) : t
}
var J = (e => (e.Renderer = "renderer", e.Application = "application", e.RendererSystem = "renderer-webgl-system", e.RendererPlugin = "renderer-webgl-plugin", e.CanvasRendererSystem = "renderer-canvas-system", e.CanvasRendererPlugin = "renderer-canvas-plugin", e.Asset = "asset", e.LoadParser = "load-parser", e.ResolveParser = "resolve-parser", e.CacheParser = "cache-parser", e.DetectionParser = "detection-parser", e))(J || {});
const Go = e => {
        if (typeof e == "function" || typeof e == "object" && e.extension) {
            if (!e.extension) throw new Error("Extension class must have an extension object");
            e = { ...typeof e.extension != "object" ? {
                    type: e.extension
                } : e.extension,
                ref: e
            }
        }
        if (typeof e == "object") e = { ...e
        };
        else throw new Error("Invalid extension type");
        return typeof e.type == "string" && (e.type = [e.type]), e
    },
    Yc = (e, t) => Go(e).priority??t,
    nt = {
        _addHandlers: {},
        _removeHandlers: {},
        _queue: {},
        remove(...e) {
            return e.map(Go).forEach(t => {
                t.type.forEach(r => {
                    var i, s;
                    return (s = (i = this._removeHandlers)[r]) == null ? void 0 : s.call(i, t)
                })
            }), this
        },
        add(...e) {
            return e.map(Go).forEach(t => {
                t.type.forEach(r => {
                    const i = this._addHandlers,
                        s = this._queue;
                    i[r] ? i[r](t) : (s[r] = s[r] || [], s[r].push(t))
                })
            }), this
        },
        handle(e, t, r) {
            const i = this._addHandlers,
                s = this._removeHandlers;
            if (i[e] || s[e]) throw new Error(`Extension type ${e} already has a handler`);
            i[e] = t, s[e] = r;
            const n = this._queue;
            return n[e] && (n[e].forEach(a => t(a)), delete n[e]), this
        },
        handleByMap(e, t) {
            return this.handle(e, r => {
                t[r.name] = r.ref
            }, r => {
                delete t[r.name]
            })
        },
        handleByList(e, t, r = -1) {
            return this.handle(e, i => {
                t.includes(i.ref) || (t.push(i.ref), t.sort((s, n) => Yc(n, r) - Yc(s, r)))
            }, i => {
                const s = t.indexOf(i.ref);
                s !== -1 && t.splice(s, 1)
            })
        }
    };
class $o {
    constructor(t) {
        typeof t == "number" ? this.rawBinaryData = new ArrayBuffer(t) : t instanceof Uint8Array ? this.rawBinaryData = t.buffer : this.rawBinaryData = t, this.uint32View = new Uint32Array(this.rawBinaryData), this.float32View = new Float32Array(this.rawBinaryData)
    }
    get int8View() {
        return this._int8View || (this._int8View = new Int8Array(this.rawBinaryData)), this._int8View
    }
    get uint8View() {
        return this._uint8View || (this._uint8View = new Uint8Array(this.rawBinaryData)), this._uint8View
    }
    get int16View() {
        return this._int16View || (this._int16View = new Int16Array(this.rawBinaryData)), this._int16View
    }
    get uint16View() {
        return this._uint16View || (this._uint16View = new Uint16Array(this.rawBinaryData)), this._uint16View
    }
    get int32View() {
        return this._int32View || (this._int32View = new Int32Array(this.rawBinaryData)), this._int32View
    }
    view(t) {
        return this[`${t}View`]
    }
    destroy() {
        this.rawBinaryData = null, this._int8View = null, this._uint8View = null, this._int16View = null, this._uint16View = null, this._int32View = null, this.uint32View = null, this.float32View = null
    }
    static sizeOf(t) {
        switch (t) {
            case "int8":
            case "uint8":
                return 1;
            case "int16":
            case "uint16":
                return 2;
            case "int32":
            case "uint32":
            case "float32":
                return 4;
            default:
                throw new Error(`${t} isn't a valid view type`)
        }
    }
}
const cx = ["precision mediump float;", "void main(void){", "float test = 0.1;", "%forloop%", "gl_FragColor = vec4(0.0);", "}"].join(`
`);

function ux(e) {
    let t = "";
    for (let r = 0; r < e; ++r) r > 0 && (t += `
else `), r < e - 1 && (t += `if(test == ${r}.0){}`);
    return t
}

function fx(e, t) {
    if (e === 0) throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");
    const r = t.createShader(t.FRAGMENT_SHADER);
    for (;;) {
        const i = cx.replace(/%forloop%/gi, ux(e));
        if (t.shaderSource(r, i), t.compileShader(r), !t.getShaderParameter(r, t.COMPILE_STATUS)) e = e / 2 | 0;
        else break
    }
    return e
}
const ro = 0,
    io = 1,
    so = 2,
    no = 3,
    ao = 4,
    oo = 5;
class br {
    constructor() {
        this.data = 0, this.blendMode = lt.NORMAL, this.polygonOffset = 0, this.blend = !0, this.depthMask = !0
    }
    get blend() {
        return !!(this.data & 1 << ro)
    }
    set blend(t) {
        !!(this.data & 1 << ro) !== t && (this.data ^= 1 << ro)
    }
    get offsets() {
        return !!(this.data & 1 << io)
    }
    set offsets(t) {
        !!(this.data & 1 << io) !== t && (this.data ^= 1 << io)
    }
    get culling() {
        return !!(this.data & 1 << so)
    }
    set culling(t) {
        !!(this.data & 1 << so) !== t && (this.data ^= 1 << so)
    }
    get depthTest() {
        return !!(this.data & 1 << no)
    }
    set depthTest(t) {
        !!(this.data & 1 << no) !== t && (this.data ^= 1 << no)
    }
    get depthMask() {
        return !!(this.data & 1 << oo)
    }
    set depthMask(t) {
        !!(this.data & 1 << oo) !== t && (this.data ^= 1 << oo)
    }
    get clockwiseFrontFace() {
        return !!(this.data & 1 << ao)
    }
    set clockwiseFrontFace(t) {
        !!(this.data & 1 << ao) !== t && (this.data ^= 1 << ao)
    }
    get blendMode() {
        return this._blendMode
    }
    set blendMode(t) {
        this.blend = t !== lt.NONE, this._blendMode = t
    }
    get polygonOffset() {
        return this._polygonOffset
    }
    set polygonOffset(t) {
        this.offsets = !!t, this._polygonOffset = t
    }
    toString() {
        return `[@pixi/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`
    }
    static for2d() {
        const t = new br;
        return t.depthTest = !1, t.blend = !0, t
    }
}
const Ho = [];

function Bf(e, t) {
    if (!e) return null;
    let r = "";
    if (typeof e == "string") {
        const i = /\.(\w{3,4})(?:$|\?|#)/i.exec(e);
        i && (r = i[1].toLowerCase())
    }
    for (let i = Ho.length - 1; i >= 0; --i) {
        const s = Ho[i];
        if (s.test && s.test(e, r)) return new s(e, t)
    }
    throw new Error("Unrecognized source type to auto-detect Resource")
}
class ze {
    constructor(t) {
        this.items = [], this._name = t, this._aliasCount = 0
    }
    emit(t, r, i, s, n, a, o, h) {
        if (arguments.length > 8) throw new Error("max arguments reached");
        const {
            name: l,
            items: c
        } = this;
        this._aliasCount++;
        for (let f = 0, p = c.length; f < p; f++) c[f][l](t, r, i, s, n, a, o, h);
        return c === this.items && this._aliasCount--, this
    }
    ensureNonAliasedItems() {
        this._aliasCount > 0 && this.items.length > 1 && (this._aliasCount = 0, this.items = this.items.slice(0))
    }
    add(t) {
        return t[this._name] && (this.ensureNonAliasedItems(), this.remove(t), this.items.push(t)), this
    }
    remove(t) {
        const r = this.items.indexOf(t);
        return r !== -1 && (this.ensureNonAliasedItems(), this.items.splice(r, 1)), this
    }
    contains(t) {
        return this.items.includes(t)
    }
    removeAll() {
        return this.ensureNonAliasedItems(), this.items.length = 0, this
    }
    destroy() {
        this.removeAll(), this.items = null, this._name = null
    }
    get empty() {
        return this.items.length === 0
    }
    get name() {
        return this._name
    }
}
Object.defineProperties(ze.prototype, {
    dispatch: {
        value: ze.prototype.emit
    },
    run: {
        value: ze.prototype.emit
    }
});
class Ts {
    constructor(t = 0, r = 0) {
        this._width = t, this._height = r, this.destroyed = !1, this.internal = !1, this.onResize = new ze("setRealSize"), this.onUpdate = new ze("update"), this.onError = new ze("onError")
    }
    bind(t) {
        this.onResize.add(t), this.onUpdate.add(t), this.onError.add(t), (this._width || this._height) && this.onResize.emit(this._width, this._height)
    }
    unbind(t) {
        this.onResize.remove(t), this.onUpdate.remove(t), this.onError.remove(t)
    }
    resize(t, r) {
        (t !== this._width || r !== this._height) && (this._width = t, this._height = r, this.onResize.emit(t, r))
    }
    get valid() {
        return !!this._width && !!this._height
    }
    update() {
        this.destroyed || this.onUpdate.emit()
    }
    load() {
        return Promise.resolve(this)
    }
    get width() {
        return this._width
    }
    get height() {
        return this._height
    }
    style(t, r, i) {
        return !1
    }
    dispose() {}
    destroy() {
        this.destroyed || (this.destroyed = !0, this.dispose(), this.onError.removeAll(), this.onError = null, this.onResize.removeAll(), this.onResize = null, this.onUpdate.removeAll(), this.onUpdate = null)
    }
    static test(t, r) {
        return !1
    }
}
class Ms extends Ts {
    constructor(t, r) {
        const {
            width: i,
            height: s
        } = r || {};
        if (!i || !s) throw new Error("BufferResource width or height invalid");
        super(i, s), this.data = t
    }
    upload(t, r, i) {
        const s = t.gl;
        s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r.alphaMode === qe.UNPACK);
        const n = r.realWidth,
            a = r.realHeight;
        return i.width === n && i.height === a ? s.texSubImage2D(r.target, 0, 0, 0, n, a, r.format, i.type, this.data) : (i.width = n, i.height = a, s.texImage2D(r.target, 0, i.internalFormat, n, a, 0, r.format, i.type, this.data)), !0
    }
    dispose() {
        this.data = null
    }
    static test(t) {
        return t instanceof Float32Array || t instanceof Uint8Array || t instanceof Uint32Array
    }
}
const dx = {
        scaleMode: mr.NEAREST,
        format: W.RGBA,
        alphaMode: qe.NPM
    },
    Ai = class extends Hi {
        constructor(e = null, t = null) {
            super(), t = Object.assign({}, Ai.defaultOptions, t);
            const {
                alphaMode: r,
                mipmap: i,
                anisotropicLevel: s,
                scaleMode: n,
                width: a,
                height: o,
                wrapMode: h,
                format: l,
                type: c,
                target: f,
                resolution: p,
                resourceOptions: m
            } = t;
            e && !(e instanceof Ts) && (e = Bf(e, m), e.internal = !0), this.resolution = p || K.RESOLUTION, this.width = Math.round((a || 0) * this.resolution) / this.resolution, this.height = Math.round((o || 0) * this.resolution) / this.resolution, this._mipmap = i, this.anisotropicLevel = s, this._wrapMode = h, this._scaleMode = n, this.format = l, this.type = c, this.target = f, this.alphaMode = r, this.uid = ei(), this.touched = 0, this.isPowerOfTwo = !1, this._refreshPOT(), this._glTextures = {}, this.dirtyId = 0, this.dirtyStyleId = 0, this.cacheId = null, this.valid = a > 0 && o > 0, this.textureCacheIds = [], this.destroyed = !1, this.resource = null, this._batchEnabled = 0, this._batchLocation = 0, this.parentTextureArray = null, this.setResource(e)
        }
        get realWidth() {
            return Math.round(this.width * this.resolution)
        }
        get realHeight() {
            return Math.round(this.height * this.resolution)
        }
        get mipmap() {
            return this._mipmap
        }
        set mipmap(e) {
            this._mipmap !== e && (this._mipmap = e, this.dirtyStyleId++)
        }
        get scaleMode() {
            return this._scaleMode
        }
        set scaleMode(e) {
            this._scaleMode !== e && (this._scaleMode = e, this.dirtyStyleId++)
        }
        get wrapMode() {
            return this._wrapMode
        }
        set wrapMode(e) {
            this._wrapMode !== e && (this._wrapMode = e, this.dirtyStyleId++)
        }
        setStyle(e, t) {
            let r;
            return e !== void 0 && e !== this.scaleMode && (this.scaleMode = e, r = !0), t !== void 0 && t !== this.mipmap && (this.mipmap = t, r = !0), r && this.dirtyStyleId++, this
        }
        setSize(e, t, r) {
            return r = r || this.resolution, this.setRealSize(e * r, t * r, r)
        }
        setRealSize(e, t, r) {
            return this.resolution = r || this.resolution, this.width = Math.round(e) / this.resolution, this.height = Math.round(t) / this.resolution, this._refreshPOT(), this.update(), this
        }
        _refreshPOT() {
            this.isPowerOfTwo = Vc(this.realWidth) && Vc(this.realHeight)
        }
        setResolution(e) {
            const t = this.resolution;
            return t === e ? this : (this.resolution = e, this.valid && (this.width = Math.round(this.width * t) / e, this.height = Math.round(this.height * t) / e, this.emit("update", this)), this._refreshPOT(), this)
        }
        setResource(e) {
            if (this.resource === e) return this;
            if (this.resource) throw new Error("Resource can be set only once");
            return e.bind(this), this.resource = e, this
        }
        update() {
            this.valid ? (this.dirtyId++, this.dirtyStyleId++, this.emit("update", this)) : this.width > 0 && this.height > 0 && (this.valid = !0, this.emit("loaded", this), this.emit("update", this))
        }
        onError(e) {
            this.emit("error", this, e)
        }
        destroy() {
            this.resource && (this.resource.unbind(this), this.resource.internal && this.resource.destroy(), this.resource = null), this.cacheId && (delete Ir[this.cacheId], delete Ke[this.cacheId], this.cacheId = null), this.dispose(), Ai.removeFromCache(this), this.textureCacheIds = null, this.destroyed = !0
        }
        dispose() {
            this.emit("dispose", this)
        }
        castToBaseTexture() {
            return this
        }
        static from(e, t, r = K.STRICT_TEXTURE_CACHE) {
            const i = typeof e == "string";
            let s = null;
            if (i) s = e;
            else {
                if (!e._pixiId) {
                    const a = (t == null ? void 0 : t.pixiIdPrefix) || "pixiid";
                    e._pixiId = `${a}_${ei()}`
                }
                s = e._pixiId
            }
            let n = Ir[s];
            if (i && r && !n) throw new Error(`The cacheId "${s}" does not exist in BaseTextureCache.`);
            return n || (n = new Ai(e, t), n.cacheId = s, Ai.addToCache(n, s)), n
        }
        static fromBuffer(e, t, r, i) {
            e = e || new Float32Array(t * r * 4);
            const s = new Ms(e, {
                    width: t,
                    height: r
                }),
                n = e instanceof Float32Array ? ot.FLOAT : ot.UNSIGNED_BYTE;
            return new Ai(s, Object.assign({}, dx, {
                type: n
            }, i))
        }
        static addToCache(e, t) {
            t && (e.textureCacheIds.includes(t) || e.textureCacheIds.push(t), Ir[t] && Ir[t] !== e && console.warn(`BaseTexture added to the cache with an id [${t}] that already had an entry`), Ir[t] = e)
        }
        static removeFromCache(e) {
            if (typeof e == "string") {
                const t = Ir[e];
                if (t) {
                    const r = t.textureCacheIds.indexOf(e);
                    return r > -1 && t.textureCacheIds.splice(r, 1), delete Ir[e], t
                }
            } else if (e != null && e.textureCacheIds) {
                for (let t = 0; t < e.textureCacheIds.length; ++t) delete Ir[e.textureCacheIds[t]];
                return e.textureCacheIds.length = 0, e
            }
            return null
        }
    };
let ct = Ai;
ct.defaultOptions = {
    mipmap: hr.POW2,
    anisotropicLevel: 0,
    scaleMode: mr.LINEAR,
    wrapMode: Mr.CLAMP,
    alphaMode: qe.UNPACK,
    target: Di.TEXTURE_2D,
    format: W.RGBA,
    type: ot.UNSIGNED_BYTE
};
ct._globalBatch = 0;
class Vo {
    constructor() {
        this.texArray = null, this.blend = 0, this.type = tr.TRIANGLES, this.start = 0, this.size = 0, this.data = null
    }
}
let px = 0;
class Wt {
    constructor(t, r = !0, i = !1) {
        this.data = t || new Float32Array(1), this._glBuffers = {}, this._updateID = 0, this.index = i, this.static = r, this.id = px++, this.disposeRunner = new ze("disposeBuffer")
    }
    update(t) {
        t instanceof Array && (t = new Float32Array(t)), this.data = t || this.data, this._updateID++
    }
    dispose() {
        this.disposeRunner.emit(this, !1)
    }
    destroy() {
        this.dispose(), this.data = null
    }
    set index(t) {
        this.type = t ? ir.ELEMENT_ARRAY_BUFFER : ir.ARRAY_BUFFER
    }
    get index() {
        return this.type === ir.ELEMENT_ARRAY_BUFFER
    }
    static from(t) {
        return t instanceof Array && (t = new Float32Array(t)), new Wt(t)
    }
}
class Un {
    constructor(t, r = 0, i = !1, s = ot.FLOAT, n, a, o, h = 1) {
        this.buffer = t, this.size = r, this.normalized = i, this.type = s, this.stride = n, this.start = a, this.instance = o, this.divisor = h
    }
    destroy() {
        this.buffer = null
    }
    static from(t, r, i, s, n) {
        return new Un(t, r, i, s, n)
    }
}
const mx = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array
};

function gx(e, t) {
    let r = 0,
        i = 0;
    const s = {};
    for (let h = 0; h < e.length; h++) i += t[h], r += e[h].length;
    const n = new ArrayBuffer(r * 4);
    let a = null,
        o = 0;
    for (let h = 0; h < e.length; h++) {
        const l = t[h],
            c = e[h],
            f = Nf(c);
        s[f] || (s[f] = new mx[f](n)), a = s[f];
        for (let p = 0; p < c.length; p++) {
            const m = (p / l | 0) * i + o,
                v = p % l;
            a[m + v] = c[p]
        }
        o += l
    }
    return new Float32Array(n)
}
const qc = {
    5126: 4,
    5123: 2,
    5121: 1
};
let vx = 0;
const _x = {
    Float32Array,
    Uint32Array,
    Int32Array,
    Uint8Array,
    Uint16Array
};
class Dr {
    constructor(t = [], r = {}) {
        this.buffers = t, this.indexBuffer = null, this.attributes = r, this.glVertexArrayObjects = {}, this.id = vx++, this.instanced = !1, this.instanceCount = 1, this.disposeRunner = new ze("disposeGeometry"), this.refCount = 0
    }
    addAttribute(t, r, i = 0, s = !1, n, a, o, h = !1) {
        if (!r) throw new Error("You must pass a buffer when creating an attribute");
        r instanceof Wt || (r instanceof Array && (r = new Float32Array(r)), r = new Wt(r));
        const l = t.split("|");
        if (l.length > 1) {
            for (let f = 0; f < l.length; f++) this.addAttribute(l[f], r, i, s, n);
            return this
        }
        let c = this.buffers.indexOf(r);
        return c === -1 && (this.buffers.push(r), c = this.buffers.length - 1), this.attributes[t] = new Un(c, i, s, n, a, o, h), this.instanced = this.instanced || h, this
    }
    getAttribute(t) {
        return this.attributes[t]
    }
    getBuffer(t) {
        return this.buffers[this.getAttribute(t).buffer]
    }
    addIndex(t) {
        return t instanceof Wt || (t instanceof Array && (t = new Uint16Array(t)), t = new Wt(t)), t.type = ir.ELEMENT_ARRAY_BUFFER, this.indexBuffer = t, this.buffers.includes(t) || this.buffers.push(t), this
    }
    getIndex() {
        return this.indexBuffer
    }
    interleave() {
        if (this.buffers.length === 1 || this.buffers.length === 2 && this.indexBuffer) return this;
        const t = [],
            r = [],
            i = new Wt;
        let s;
        for (s in this.attributes) {
            const n = this.attributes[s],
                a = this.buffers[n.buffer];
            t.push(a.data), r.push(n.size * qc[n.type] / 4), n.buffer = 0
        }
        for (i.data = gx(t, r), s = 0; s < this.buffers.length; s++) this.buffers[s] !== this.indexBuffer && this.buffers[s].destroy();
        return this.buffers = [i], this.indexBuffer && this.buffers.push(this.indexBuffer), this
    }
    getSize() {
        for (const t in this.attributes) {
            const r = this.attributes[t];
            return this.buffers[r.buffer].data.length / (r.stride / 4 || r.size)
        }
        return 0
    }
    dispose() {
        this.disposeRunner.emit(this, !1)
    }
    destroy() {
        this.dispose(), this.buffers = null, this.indexBuffer = null, this.attributes = null
    }
    clone() {
        const t = new Dr;
        for (let r = 0; r < this.buffers.length; r++) t.buffers[r] = new Wt(this.buffers[r].data.slice(0));
        for (const r in this.attributes) {
            const i = this.attributes[r];
            t.attributes[r] = new Un(i.buffer, i.size, i.normalized, i.type, i.stride, i.start, i.instance)
        }
        return this.indexBuffer && (t.indexBuffer = t.buffers[this.buffers.indexOf(this.indexBuffer)], t.indexBuffer.type = ir.ELEMENT_ARRAY_BUFFER), t
    }
    static merge(t) {
        const r = new Dr,
            i = [],
            s = [],
            n = [];
        let a;
        for (let o = 0; o < t.length; o++) {
            a = t[o];
            for (let h = 0; h < a.buffers.length; h++) s[h] = s[h] || 0, s[h] += a.buffers[h].data.length, n[h] = 0
        }
        for (let o = 0; o < a.buffers.length; o++) i[o] = new _x[Nf(a.buffers[o].data)](s[o]), r.buffers[o] = new Wt(i[o]);
        for (let o = 0; o < t.length; o++) {
            a = t[o];
            for (let h = 0; h < a.buffers.length; h++) i[h].set(a.buffers[h].data, n[h]), n[h] += a.buffers[h].data.length
        }
        if (r.attributes = a.attributes, a.indexBuffer) {
            r.indexBuffer = r.buffers[a.buffers.indexOf(a.indexBuffer)], r.indexBuffer.type = ir.ELEMENT_ARRAY_BUFFER;
            let o = 0,
                h = 0,
                l = 0,
                c = 0;
            for (let f = 0; f < a.buffers.length; f++)
                if (a.buffers[f] !== a.indexBuffer) {
                    c = f;
                    break
                }
            for (const f in a.attributes) {
                const p = a.attributes[f];
                (p.buffer | 0) === c && (h += p.size * qc[p.type] / 4)
            }
            for (let f = 0; f < t.length; f++) {
                const p = t[f].indexBuffer.data;
                for (let m = 0; m < p.length; m++) r.indexBuffer.data[m + l] += o;
                o += t[f].buffers[c].data.length / h, l += p.length
            }
        }
        return r
    }
}
class Of extends Dr {
    constructor(t = !1) {
        super(), this._buffer = new Wt(null, t, !1), this._indexBuffer = new Wt(null, t, !0), this.addAttribute("aVertexPosition", this._buffer, 2, !1, ot.FLOAT).addAttribute("aTextureCoord", this._buffer, 2, !1, ot.FLOAT).addAttribute("aColor", this._buffer, 4, !0, ot.UNSIGNED_BYTE).addAttribute("aTextureId", this._buffer, 1, !0, ot.FLOAT).addIndex(this._indexBuffer)
    }
}
const Gn = Math.PI * 2,
    yx = 180 / Math.PI,
    xx = Math.PI / 180;
var le = (e => (e[e.POLY = 0] = "POLY", e[e.RECT = 1] = "RECT", e[e.CIRC = 2] = "CIRC", e[e.ELIP = 3] = "ELIP", e[e.RREC = 4] = "RREC", e))(le || {});
class Lt {
    constructor(t = 0, r = 0) {
        this.x = 0, this.y = 0, this.x = t, this.y = r
    }
    clone() {
        return new Lt(this.x, this.y)
    }
    copyFrom(t) {
        return this.set(t.x, t.y), this
    }
    copyTo(t) {
        return t.set(this.x, this.y), t
    }
    equals(t) {
        return t.x === this.x && t.y === this.y
    }
    set(t = 0, r = t) {
        return this.x = t, this.y = r, this
    }
    toString() {
        return `[@pixi/math:Point x=${this.x} y=${this.y}]`
    }
}
const tn = [new Lt, new Lt, new Lt, new Lt];
class _t {
    constructor(t = 0, r = 0, i = 0, s = 0) {
        this.x = Number(t), this.y = Number(r), this.width = Number(i), this.height = Number(s), this.type = le.RECT
    }
    get left() {
        return this.x
    }
    get right() {
        return this.x + this.width
    }
    get top() {
        return this.y
    }
    get bottom() {
        return this.y + this.height
    }
    static get EMPTY() {
        return new _t(0, 0, 0, 0)
    }
    clone() {
        return new _t(this.x, this.y, this.width, this.height)
    }
    copyFrom(t) {
        return this.x = t.x, this.y = t.y, this.width = t.width, this.height = t.height, this
    }
    copyTo(t) {
        return t.x = this.x, t.y = this.y, t.width = this.width, t.height = this.height, t
    }
    contains(t, r) {
        return this.width <= 0 || this.height <= 0 ? !1 : t >= this.x && t < this.x + this.width && r >= this.y && r < this.y + this.height
    }
    intersects(t, r) {
        if (!r) {
            const L = this.x < t.x ? t.x : this.x;
            if ((this.right > t.right ? t.right : this.right) <= L) return !1;
            const et = this.y < t.y ? t.y : this.y;
            return (this.bottom > t.bottom ? t.bottom : this.bottom) > et
        }
        const i = this.left,
            s = this.right,
            n = this.top,
            a = this.bottom;
        if (s <= i || a <= n) return !1;
        const o = tn[0].set(t.left, t.top),
            h = tn[1].set(t.left, t.bottom),
            l = tn[2].set(t.right, t.top),
            c = tn[3].set(t.right, t.bottom);
        if (l.x <= o.x || h.y <= o.y) return !1;
        const f = Math.sign(r.a * r.d - r.b * r.c);
        if (f === 0 || (r.apply(o, o), r.apply(h, h), r.apply(l, l), r.apply(c, c), Math.max(o.x, h.x, l.x, c.x) <= i || Math.min(o.x, h.x, l.x, c.x) >= s || Math.max(o.y, h.y, l.y, c.y) <= n || Math.min(o.y, h.y, l.y, c.y) >= a)) return !1;
        const p = f * (h.y - o.y),
            m = f * (o.x - h.x),
            v = p * i + m * n,
            _ = p * s + m * n,
            y = p * i + m * a,
            A = p * s + m * a;
        if (Math.max(v, _, y, A) <= p * o.x + m * o.y || Math.min(v, _, y, A) >= p * c.x + m * c.y) return !1;
        const I = f * (o.y - l.y),
            x = f * (l.x - o.x),
            S = I * i + x * n,
            $ = I * s + x * n,
            k = I * i + x * a,
            G = I * s + x * a;
        return !(Math.max(S, $, k, G) <= I * o.x + x * o.y || Math.min(S, $, k, G) >= I * c.x + x * c.y)
    }
    pad(t = 0, r = t) {
        return this.x -= t, this.y -= r, this.width += t * 2, this.height += r * 2, this
    }
    fit(t) {
        const r = Math.max(this.x, t.x),
            i = Math.min(this.x + this.width, t.x + t.width),
            s = Math.max(this.y, t.y),
            n = Math.min(this.y + this.height, t.y + t.height);
        return this.x = r, this.width = Math.max(i - r, 0), this.y = s, this.height = Math.max(n - s, 0), this
    }
    ceil(t = 1, r = .001) {
        const i = Math.ceil((this.x + this.width - r) * t) / t,
            s = Math.ceil((this.y + this.height - r) * t) / t;
        return this.x = Math.floor((this.x + r) * t) / t, this.y = Math.floor((this.y + r) * t) / t, this.width = i - this.x, this.height = s - this.y, this
    }
    enlarge(t) {
        const r = Math.min(this.x, t.x),
            i = Math.max(this.x + this.width, t.x + t.width),
            s = Math.min(this.y, t.y),
            n = Math.max(this.y + this.height, t.y + t.height);
        return this.x = r, this.width = i - r, this.y = s, this.height = n - s, this
    }
    toString() {
        return `[@pixi/math:Rectangle x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`
    }
}
class bh {
    constructor(t = 0, r = 0, i = 0) {
        this.x = t, this.y = r, this.radius = i, this.type = le.CIRC
    }
    clone() {
        return new bh(this.x, this.y, this.radius)
    }
    contains(t, r) {
        if (this.radius <= 0) return !1;
        const i = this.radius * this.radius;
        let s = this.x - t,
            n = this.y - r;
        return s *= s, n *= n, s + n <= i
    }
    getBounds() {
        return new _t(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2)
    }
    toString() {
        return `[@pixi/math:Circle x=${this.x} y=${this.y} radius=${this.radius}]`
    }
}
class wh {
    constructor(t = 0, r = 0, i = 0, s = 0) {
        this.x = t, this.y = r, this.width = i, this.height = s, this.type = le.ELIP
    }
    clone() {
        return new wh(this.x, this.y, this.width, this.height)
    }
    contains(t, r) {
        if (this.width <= 0 || this.height <= 0) return !1;
        let i = (t - this.x) / this.width,
            s = (r - this.y) / this.height;
        return i *= i, s *= s, i + s <= 1
    }
    getBounds() {
        return new _t(this.x - this.width, this.y - this.height, this.width, this.height)
    }
    toString() {
        return `[@pixi/math:Ellipse x=${this.x} y=${this.y} width=${this.width} height=${this.height}]`
    }
}
class Fi {
    constructor(...t) {
        let r = Array.isArray(t[0]) ? t[0] : t;
        if (typeof r[0] != "number") {
            const i = [];
            for (let s = 0, n = r.length; s < n; s++) i.push(r[s].x, r[s].y);
            r = i
        }
        this.points = r, this.type = le.POLY, this.closeStroke = !0
    }
    clone() {
        const t = this.points.slice(),
            r = new Fi(t);
        return r.closeStroke = this.closeStroke, r
    }
    contains(t, r) {
        let i = !1;
        const s = this.points.length / 2;
        for (let n = 0, a = s - 1; n < s; a = n++) {
            const o = this.points[n * 2],
                h = this.points[n * 2 + 1],
                l = this.points[a * 2],
                c = this.points[a * 2 + 1];
            h > r != c > r && t < (l - o) * ((r - h) / (c - h)) + o && (i = !i)
        }
        return i
    }
    toString() {
        return `[@pixi/math:PolygoncloseStroke=${this.closeStroke}points=${this.points.reduce((t,r)=>`${t}, ${r}`,"")}]`
    }
}
class Eh {
    constructor(t = 0, r = 0, i = 0, s = 0, n = 20) {
        this.x = t, this.y = r, this.width = i, this.height = s, this.radius = n, this.type = le.RREC
    }
    clone() {
        return new Eh(this.x, this.y, this.width, this.height, this.radius)
    }
    contains(t, r) {
        if (this.width <= 0 || this.height <= 0) return !1;
        if (t >= this.x && t <= this.x + this.width && r >= this.y && r <= this.y + this.height) {
            const i = Math.max(0, Math.min(this.radius, Math.min(this.width, this.height) / 2));
            if (r >= this.y + i && r <= this.y + this.height - i || t >= this.x + i && t <= this.x + this.width - i) return !0;
            let s = t - (this.x + i),
                n = r - (this.y + i);
            const a = i * i;
            if (s * s + n * n <= a || (s = t - (this.x + this.width - i), s * s + n * n <= a) || (n = r - (this.y + this.height - i), s * s + n * n <= a) || (s = t - (this.x + i), s * s + n * n <= a)) return !0
        }
        return !1
    }
    toString() {
        return `[@pixi/math:RoundedRectangle x=${this.x} y=${this.y}width=${this.width} height=${this.height} radius=${this.radius}]`
    }
}
class Gt {
    constructor(t = 1, r = 0, i = 0, s = 1, n = 0, a = 0) {
        this.array = null, this.a = t, this.b = r, this.c = i, this.d = s, this.tx = n, this.ty = a
    }
    fromArray(t) {
        this.a = t[0], this.b = t[1], this.c = t[3], this.d = t[4], this.tx = t[2], this.ty = t[5]
    }
    set(t, r, i, s, n, a) {
        return this.a = t, this.b = r, this.c = i, this.d = s, this.tx = n, this.ty = a, this
    }
    toArray(t, r) {
        this.array || (this.array = new Float32Array(9));
        const i = r || this.array;
        return t ? (i[0] = this.a, i[1] = this.b, i[2] = 0, i[3] = this.c, i[4] = this.d, i[5] = 0, i[6] = this.tx, i[7] = this.ty, i[8] = 1) : (i[0] = this.a, i[1] = this.c, i[2] = this.tx, i[3] = this.b, i[4] = this.d, i[5] = this.ty, i[6] = 0, i[7] = 0, i[8] = 1), i
    }
    apply(t, r) {
        r = r || new Lt;
        const i = t.x,
            s = t.y;
        return r.x = this.a * i + this.c * s + this.tx, r.y = this.b * i + this.d * s + this.ty, r
    }
    applyInverse(t, r) {
        r = r || new Lt;
        const i = 1 / (this.a * this.d + this.c * -this.b),
            s = t.x,
            n = t.y;
        return r.x = this.d * i * s + -this.c * i * n + (this.ty * this.c - this.tx * this.d) * i, r.y = this.a * i * n + -this.b * i * s + (-this.ty * this.a + this.tx * this.b) * i, r
    }
    translate(t, r) {
        return this.tx += t, this.ty += r, this
    }
    scale(t, r) {
        return this.a *= t, this.d *= r, this.c *= t, this.b *= r, this.tx *= t, this.ty *= r, this
    }
    rotate(t) {
        const r = Math.cos(t),
            i = Math.sin(t),
            s = this.a,
            n = this.c,
            a = this.tx;
        return this.a = s * r - this.b * i, this.b = s * i + this.b * r, this.c = n * r - this.d * i, this.d = n * i + this.d * r, this.tx = a * r - this.ty * i, this.ty = a * i + this.ty * r, this
    }
    append(t) {
        const r = this.a,
            i = this.b,
            s = this.c,
            n = this.d;
        return this.a = t.a * r + t.b * s, this.b = t.a * i + t.b * n, this.c = t.c * r + t.d * s, this.d = t.c * i + t.d * n, this.tx = t.tx * r + t.ty * s + this.tx, this.ty = t.tx * i + t.ty * n + this.ty, this
    }
    setTransform(t, r, i, s, n, a, o, h, l) {
        return this.a = Math.cos(o + l) * n, this.b = Math.sin(o + l) * n, this.c = -Math.sin(o - h) * a, this.d = Math.cos(o - h) * a, this.tx = t - (i * this.a + s * this.c), this.ty = r - (i * this.b + s * this.d), this
    }
    prepend(t) {
        const r = this.tx;
        if (t.a !== 1 || t.b !== 0 || t.c !== 0 || t.d !== 1) {
            const i = this.a,
                s = this.c;
            this.a = i * t.a + this.b * t.c, this.b = i * t.b + this.b * t.d, this.c = s * t.a + this.d * t.c, this.d = s * t.b + this.d * t.d
        }
        return this.tx = r * t.a + this.ty * t.c + t.tx, this.ty = r * t.b + this.ty * t.d + t.ty, this
    }
    decompose(t) {
        const r = this.a,
            i = this.b,
            s = this.c,
            n = this.d,
            a = t.pivot,
            o = -Math.atan2(-s, n),
            h = Math.atan2(i, r),
            l = Math.abs(o + h);
        return l < 1e-5 || Math.abs(Gn - l) < 1e-5 ? (t.rotation = h, t.skew.x = t.skew.y = 0) : (t.rotation = 0, t.skew.x = o, t.skew.y = h), t.scale.x = Math.sqrt(r * r + i * i), t.scale.y = Math.sqrt(s * s + n * n), t.position.x = this.tx + (a.x * r + a.y * s), t.position.y = this.ty + (a.x * i + a.y * n), t
    }
    invert() {
        const t = this.a,
            r = this.b,
            i = this.c,
            s = this.d,
            n = this.tx,
            a = t * s - r * i;
        return this.a = s / a, this.b = -r / a, this.c = -i / a, this.d = t / a, this.tx = (i * this.ty - s * n) / a, this.ty = -(t * this.ty - r * n) / a, this
    }
    identity() {
        return this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.tx = 0, this.ty = 0, this
    }
    clone() {
        const t = new Gt;
        return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t
    }
    copyTo(t) {
        return t.a = this.a, t.b = this.b, t.c = this.c, t.d = this.d, t.tx = this.tx, t.ty = this.ty, t
    }
    copyFrom(t) {
        return this.a = t.a, this.b = t.b, this.c = t.c, this.d = t.d, this.tx = t.tx, this.ty = t.ty, this
    }
    toString() {
        return `[@pixi/math:Matrix a=${this.a} b=${this.b} c=${this.c} d=${this.d} tx=${this.tx} ty=${this.ty}]`
    }
    static get IDENTITY() {
        return new Gt
    }
    static get TEMP_MATRIX() {
        return new Gt
    }
}
const zr = [1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1, 0, 1],
    Xr = [0, 1, 1, 1, 0, -1, -1, -1, 0, 1, 1, 1, 0, -1, -1, -1],
    jr = [0, -1, -1, -1, 0, 1, 1, 1, 0, 1, 1, 1, 0, -1, -1, -1],
    Wr = [1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, 1, 1, 1, 0, -1],
    zo = [],
    Ff = [],
    en = Math.sign;

function bx() {
    for (let e = 0; e < 16; e++) {
        const t = [];
        zo.push(t);
        for (let r = 0; r < 16; r++) {
            const i = en(zr[e] * zr[r] + jr[e] * Xr[r]),
                s = en(Xr[e] * zr[r] + Wr[e] * Xr[r]),
                n = en(zr[e] * jr[r] + jr[e] * Wr[r]),
                a = en(Xr[e] * jr[r] + Wr[e] * Wr[r]);
            for (let o = 0; o < 16; o++)
                if (zr[o] === i && Xr[o] === s && jr[o] === n && Wr[o] === a) {
                    t.push(o);
                    break
                }
        }
    }
    for (let e = 0; e < 16; e++) {
        const t = new Gt;
        t.set(zr[e], Xr[e], jr[e], Wr[e], 0, 0), Ff.push(t)
    }
}
bx();
const $t = {
    E: 0,
    SE: 1,
    S: 2,
    SW: 3,
    W: 4,
    NW: 5,
    N: 6,
    NE: 7,
    MIRROR_VERTICAL: 8,
    MAIN_DIAGONAL: 10,
    MIRROR_HORIZONTAL: 12,
    REVERSE_DIAGONAL: 14,
    uX: e => zr[e],
    uY: e => Xr[e],
    vX: e => jr[e],
    vY: e => Wr[e],
    inv: e => e & 8 ? e & 15 : -e & 7,
    add: (e, t) => zo[e][t],
    sub: (e, t) => zo[e][$t.inv(t)],
    rotate180: e => e ^ 4,
    isVertical: e => (e & 3) === 2,
    byDirection: (e, t) => Math.abs(e) * 2 <= Math.abs(t) ? t >= 0 ? $t.S : $t.N : Math.abs(t) * 2 <= Math.abs(e) ? e > 0 ? $t.E : $t.W : t > 0 ? e > 0 ? $t.SE : $t.SW : e > 0 ? $t.NE : $t.NW,
    matrixAppendRotationInv: (e, t, r = 0, i = 0) => {
        const s = Ff[$t.inv(t)];
        s.tx = r, s.ty = i, e.append(s)
    }
};
class gr {
    constructor(t, r, i = 0, s = 0) {
        this._x = i, this._y = s, this.cb = t, this.scope = r
    }
    clone(t = this.cb, r = this.scope) {
        return new gr(t, r, this._x, this._y)
    }
    set(t = 0, r = t) {
        return (this._x !== t || this._y !== r) && (this._x = t, this._y = r, this.cb.call(this.scope)), this
    }
    copyFrom(t) {
        return (this._x !== t.x || this._y !== t.y) && (this._x = t.x, this._y = t.y, this.cb.call(this.scope)), this
    }
    copyTo(t) {
        return t.set(this._x, this._y), t
    }
    equals(t) {
        return t.x === this._x && t.y === this._y
    }
    toString() {
        return `[@pixi/math:ObservablePoint x=0 y=0 scope=${this.scope}]`
    }
    get x() {
        return this._x
    }
    set x(t) {
        this._x !== t && (this._x = t, this.cb.call(this.scope))
    }
    get y() {
        return this._y
    }
    set y(t) {
        this._y !== t && (this._y = t, this.cb.call(this.scope))
    }
}
const kf = class {
    constructor() {
        this.worldTransform = new Gt, this.localTransform = new Gt, this.position = new gr(this.onChange, this, 0, 0), this.scale = new gr(this.onChange, this, 1, 1), this.pivot = new gr(this.onChange, this, 0, 0), this.skew = new gr(this.updateSkew, this, 0, 0), this._rotation = 0, this._cx = 1, this._sx = 0, this._cy = 0, this._sy = 1, this._localID = 0, this._currentLocalID = 0, this._worldID = 0, this._parentID = 0
    }
    onChange() {
        this._localID++
    }
    updateSkew() {
        this._cx = Math.cos(this._rotation + this.skew.y), this._sx = Math.sin(this._rotation + this.skew.y), this._cy = -Math.sin(this._rotation - this.skew.x), this._sy = Math.cos(this._rotation - this.skew.x), this._localID++
    }
    toString() {
        return `[@pixi/math:Transform position=(${this.position.x}, ${this.position.y}) rotation=${this.rotation} scale=(${this.scale.x}, ${this.scale.y}) skew=(${this.skew.x}, ${this.skew.y}) ]`
    }
    updateLocalTransform() {
        const e = this.localTransform;
        this._localID !== this._currentLocalID && (e.a = this._cx * this.scale.x, e.b = this._sx * this.scale.x, e.c = this._cy * this.scale.y, e.d = this._sy * this.scale.y, e.tx = this.position.x - (this.pivot.x * e.a + this.pivot.y * e.c), e.ty = this.position.y - (this.pivot.x * e.b + this.pivot.y * e.d), this._currentLocalID = this._localID, this._parentID = -1)
    }
    updateTransform(e) {
        const t = this.localTransform;
        if (this._localID !== this._currentLocalID && (t.a = this._cx * this.scale.x, t.b = this._sx * this.scale.x, t.c = this._cy * this.scale.y, t.d = this._sy * this.scale.y, t.tx = this.position.x - (this.pivot.x * t.a + this.pivot.y * t.c), t.ty = this.position.y - (this.pivot.x * t.b + this.pivot.y * t.d), this._currentLocalID = this._localID, this._parentID = -1), this._parentID !== e._worldID) {
            const r = e.worldTransform,
                i = this.worldTransform;
            i.a = t.a * r.a + t.b * r.c, i.b = t.a * r.b + t.b * r.d, i.c = t.c * r.a + t.d * r.c, i.d = t.c * r.b + t.d * r.d, i.tx = t.tx * r.a + t.ty * r.c + r.tx, i.ty = t.tx * r.b + t.ty * r.d + r.ty, this._parentID = e._worldID, this._worldID++
        }
    }
    setFromMatrix(e) {
        e.decompose(this), this._localID++
    }
    get rotation() {
        return this._rotation
    }
    set rotation(e) {
        this._rotation !== e && (this._rotation = e, this.updateSkew())
    }
};
let Th = kf;
Th.IDENTITY = new kf;
var wx = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor *= texture2D(uSampler, vTextureCoord);
}`,
    Ex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void){
   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
   vTextureCoord = aTextureCoord;
}
`;

function Zc(e, t, r) {
    const i = e.createShader(t);
    return e.shaderSource(i, r), e.compileShader(i), i
}

function ho(e) {
    const t = new Array(e);
    for (let r = 0; r < t.length; r++) t[r] = !1;
    return t
}

function Lf(e, t) {
    switch (e) {
        case "float":
            return 0;
        case "vec2":
            return new Float32Array(2 * t);
        case "vec3":
            return new Float32Array(3 * t);
        case "vec4":
            return new Float32Array(4 * t);
        case "int":
        case "uint":
        case "sampler2D":
        case "sampler2DArray":
            return 0;
        case "ivec2":
            return new Int32Array(2 * t);
        case "ivec3":
            return new Int32Array(3 * t);
        case "ivec4":
            return new Int32Array(4 * t);
        case "uvec2":
            return new Uint32Array(2 * t);
        case "uvec3":
            return new Uint32Array(3 * t);
        case "uvec4":
            return new Uint32Array(4 * t);
        case "bool":
            return !1;
        case "bvec2":
            return ho(2 * t);
        case "bvec3":
            return ho(3 * t);
        case "bvec4":
            return ho(4 * t);
        case "mat2":
            return new Float32Array([1, 0, 0, 1]);
        case "mat3":
            return new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        case "mat4":
            return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
    }
    return null
}
const ki = [{
        test: e => e.type === "float" && e.size === 1 && !e.isArray,
        code: e => `
            if(uv["${e}"] !== ud["${e}"].value)
            {
                ud["${e}"].value = uv["${e}"]
                gl.uniform1f(ud["${e}"].location, uv["${e}"])
            }
            `
    }, {
        test: (e, t) => (e.type === "sampler2D" || e.type === "samplerCube" || e.type === "sampler2DArray") && e.size === 1 && !e.isArray && (t == null || t.castToBaseTexture !== void 0),
        code: e => `t = syncData.textureCount++;

            renderer.texture.bind(uv["${e}"], t);

            if(ud["${e}"].value !== t)
            {
                ud["${e}"].value = t;
                gl.uniform1i(ud["${e}"].location, t);
; // eslint-disable-line max-len
            }`
    }, {
        test: (e, t) => e.type === "mat3" && e.size === 1 && !e.isArray && t.a !== void 0,
        code: e => `
            gl.uniformMatrix3fv(ud["${e}"].location, false, uv["${e}"].toArray(true));
            `,
        codeUbo: e => `
                var ${e}_matrix = uv.${e}.toArray(true);

                data[offset] = ${e}_matrix[0];
                data[offset+1] = ${e}_matrix[1];
                data[offset+2] = ${e}_matrix[2];
        
                data[offset + 4] = ${e}_matrix[3];
                data[offset + 5] = ${e}_matrix[4];
                data[offset + 6] = ${e}_matrix[5];
        
                data[offset + 8] = ${e}_matrix[6];
                data[offset + 9] = ${e}_matrix[7];
                data[offset + 10] = ${e}_matrix[8];
            `
    }, {
        test: (e, t) => e.type === "vec2" && e.size === 1 && !e.isArray && t.x !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.x || cv[1] !== v.y)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    gl.uniform2f(ud["${e}"].location, v.x, v.y);
                }`,
        codeUbo: e => `
                v = uv.${e};

                data[offset] = v.x;
                data[offset+1] = v.y;
            `
    }, {
        test: e => e.type === "vec2" && e.size === 1 && !e.isArray,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v[0] || cv[1] !== v[1])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    gl.uniform2f(ud["${e}"].location, v[0], v[1]);
                }
            `
    }, {
        test: (e, t) => e.type === "vec4" && e.size === 1 && !e.isArray && t.width !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height)
                {
                    cv[0] = v.x;
                    cv[1] = v.y;
                    cv[2] = v.width;
                    cv[3] = v.height;
                    gl.uniform4f(ud["${e}"].location, v.x, v.y, v.width, v.height)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.x;
                    data[offset+1] = v.y;
                    data[offset+2] = v.width;
                    data[offset+3] = v.height;
                `
    }, {
        test: (e, t) => e.type === "vec4" && e.size === 1 && !e.isArray && t.red !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
                    cv[3] = v.alpha;
                    gl.uniform4f(ud["${e}"].location, v.red, v.green, v.blue, v.alpha)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                    data[offset+3] = v.alpha;
                `
    }, {
        test: (e, t) => e.type === "vec3" && e.size === 1 && !e.isArray && t.red !== void 0,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.a)
                {
                    cv[0] = v.red;
                    cv[1] = v.green;
                    cv[2] = v.blue;
    
                    gl.uniform3f(ud["${e}"].location, v.red, v.green, v.blue)
                }`,
        codeUbo: e => `
                    v = uv.${e};

                    data[offset] = v.red;
                    data[offset+1] = v.green;
                    data[offset+2] = v.blue;
                `
    }, {
        test: e => e.type === "vec4" && e.size === 1 && !e.isArray,
        code: e => `
                cv = ud["${e}"].value;
                v = uv["${e}"];

                if(cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
                {
                    cv[0] = v[0];
                    cv[1] = v[1];
                    cv[2] = v[2];
                    cv[3] = v[3];

                    gl.uniform4f(ud["${e}"].location, v[0], v[1], v[2], v[3])
                }`
    }],
    Tx = {
        float: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1f(location, v);
    }`,
        vec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2f(location, v[0], v[1])
    }`,
        vec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3f(location, v[0], v[1], v[2])
    }`,
        vec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4f(location, v[0], v[1], v[2], v[3]);
    }`,
        int: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        ivec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
        ivec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
        ivec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
        uint: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1ui(location, v);
    }`,
        uvec2: `
    if (cv[0] !== v[0] || cv[1] !== v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2ui(location, v[0], v[1]);
    }`,
        uvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3ui(location, v[0], v[1], v[2]);
    }`,
        uvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
    }`,
        bool: `
    if (cv !== v)
    {
        cu.value = v;
        gl.uniform1i(location, v);
    }`,
        bvec2: `
    if (cv[0] != v[0] || cv[1] != v[1])
    {
        cv[0] = v[0];
        cv[1] = v[1];

        gl.uniform2i(location, v[0], v[1]);
    }`,
        bvec3: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];

        gl.uniform3i(location, v[0], v[1], v[2]);
    }`,
        bvec4: `
    if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3])
    {
        cv[0] = v[0];
        cv[1] = v[1];
        cv[2] = v[2];
        cv[3] = v[3];

        gl.uniform4i(location, v[0], v[1], v[2], v[3]);
    }`,
        mat2: "gl.uniformMatrix2fv(location, false, v)",
        mat3: "gl.uniformMatrix3fv(location, false, v)",
        mat4: "gl.uniformMatrix4fv(location, false, v)",
        sampler2D: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        samplerCube: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`,
        sampler2DArray: `
    if (cv !== v)
    {
        cu.value = v;

        gl.uniform1i(location, v);
    }`
    },
    Ax = {
        float: "gl.uniform1fv(location, v)",
        vec2: "gl.uniform2fv(location, v)",
        vec3: "gl.uniform3fv(location, v)",
        vec4: "gl.uniform4fv(location, v)",
        mat4: "gl.uniformMatrix4fv(location, false, v)",
        mat3: "gl.uniformMatrix3fv(location, false, v)",
        mat2: "gl.uniformMatrix2fv(location, false, v)",
        int: "gl.uniform1iv(location, v)",
        ivec2: "gl.uniform2iv(location, v)",
        ivec3: "gl.uniform3iv(location, v)",
        ivec4: "gl.uniform4iv(location, v)",
        uint: "gl.uniform1uiv(location, v)",
        uvec2: "gl.uniform2uiv(location, v)",
        uvec3: "gl.uniform3uiv(location, v)",
        uvec4: "gl.uniform4uiv(location, v)",
        bool: "gl.uniform1iv(location, v)",
        bvec2: "gl.uniform2iv(location, v)",
        bvec3: "gl.uniform3iv(location, v)",
        bvec4: "gl.uniform4iv(location, v)",
        sampler2D: "gl.uniform1iv(location, v)",
        samplerCube: "gl.uniform1iv(location, v)",
        sampler2DArray: "gl.uniform1iv(location, v)"
    };

function Cx(e, t) {
    var i;
    const r = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
    `];
    for (const s in e.uniforms) {
        const n = t[s];
        if (!n) {
            (i = e.uniforms[s]) != null && i.group && (e.uniforms[s].ubo ? r.push(`
                        renderer.shader.syncUniformBufferGroup(uv.${s}, '${s}');
                    `) : r.push(`
                        renderer.shader.syncUniformGroup(uv.${s}, syncData);
                    `));
            continue
        }
        const a = e.uniforms[s];
        let o = !1;
        for (let h = 0; h < ki.length; h++)
            if (ki[h].test(n, a)) {
                r.push(ki[h].code(s, a)), o = !0;
                break
            }
        if (!o) {
            const l = (n.size === 1 && !n.isArray ? Tx : Ax)[n.type].replace("location", `ud["${s}"].location`);
            r.push(`
            cu = ud["${s}"];
            cv = cu.value;
            v = uv["${s}"];
            ${l};`)
        }
    }
    return new Function("ud", "uv", "renderer", "syncData", r.join(`
`))
}
const Uf = {};
let _i = Uf;

function Sx() {
    if (_i === Uf || _i != null && _i.isContextLost()) {
        const e = K.ADAPTER.createCanvas();
        let t;
        K.PREFER_ENV >= si.WEBGL2 && (t = e.getContext("webgl2", {})), t || (t = e.getContext("webgl", {}) || e.getContext("experimental-webgl", {}), t ? t.getExtension("WEBGL_draw_buffers") : t = null), _i = t
    }
    return _i
}
let rn;

function Ix() {
    if (!rn) {
        rn = Re.MEDIUM;
        const e = Sx();
        e && e.getShaderPrecisionFormat && (rn = e.getShaderPrecisionFormat(e.FRAGMENT_SHADER, e.HIGH_FLOAT).precision ? Re.HIGH : Re.MEDIUM)
    }
    return rn
}

function Kc(e, t) {
    const r = e.getShaderSource(t).split(`
`).map((l, c) => `${c}: ${l}`),
        i = e.getShaderInfoLog(t),
        s = i.split(`
`),
        n = {},
        a = s.map(l => parseFloat(l.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter(l => l && !n[l] ? (n[l] = !0, !0) : !1),
        o = [""];
    a.forEach(l => {
        r[l - 1] = `%c${r[l-1]}%c`, o.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px")
    });
    const h = r.join(`
`);
    o[0] = h, console.error(i), console.groupCollapsed("click to view full shader code"), console.warn(...o), console.groupEnd()
}

function Rx(e, t, r, i) {
    e.getProgramParameter(t, e.LINK_STATUS) || (e.getShaderParameter(r, e.COMPILE_STATUS) || Kc(e, r), e.getShaderParameter(i, e.COMPILE_STATUS) || Kc(e, i), console.error("PixiJS Error: Could not initialize shader."), e.getProgramInfoLog(t) !== "" && console.warn("PixiJS Warning: gl.getProgramInfoLog()", e.getProgramInfoLog(t)))
}
const Mx = {
    float: 1,
    vec2: 2,
    vec3: 3,
    vec4: 4,
    int: 1,
    ivec2: 2,
    ivec3: 3,
    ivec4: 4,
    uint: 1,
    uvec2: 2,
    uvec3: 3,
    uvec4: 4,
    bool: 1,
    bvec2: 2,
    bvec3: 3,
    bvec4: 4,
    mat2: 4,
    mat3: 9,
    mat4: 16,
    sampler2D: 1
};

function Gf(e) {
    return Mx[e]
}
let sn = null;
const Jc = {
    FLOAT: "float",
    FLOAT_VEC2: "vec2",
    FLOAT_VEC3: "vec3",
    FLOAT_VEC4: "vec4",
    INT: "int",
    INT_VEC2: "ivec2",
    INT_VEC3: "ivec3",
    INT_VEC4: "ivec4",
    UNSIGNED_INT: "uint",
    UNSIGNED_INT_VEC2: "uvec2",
    UNSIGNED_INT_VEC3: "uvec3",
    UNSIGNED_INT_VEC4: "uvec4",
    BOOL: "bool",
    BOOL_VEC2: "bvec2",
    BOOL_VEC3: "bvec3",
    BOOL_VEC4: "bvec4",
    FLOAT_MAT2: "mat2",
    FLOAT_MAT3: "mat3",
    FLOAT_MAT4: "mat4",
    SAMPLER_2D: "sampler2D",
    INT_SAMPLER_2D: "sampler2D",
    UNSIGNED_INT_SAMPLER_2D: "sampler2D",
    SAMPLER_CUBE: "samplerCube",
    INT_SAMPLER_CUBE: "samplerCube",
    UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
    SAMPLER_2D_ARRAY: "sampler2DArray",
    INT_SAMPLER_2D_ARRAY: "sampler2DArray",
    UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
};

function $f(e, t) {
    if (!sn) {
        const r = Object.keys(Jc);
        sn = {};
        for (let i = 0; i < r.length; ++i) {
            const s = r[i];
            sn[e[s]] = Jc[s]
        }
    }
    return sn[t]
}

function Qc(e, t, r) {
    if (e.substring(0, 9) !== "precision") {
        let i = t;
        return t === Re.HIGH && r !== Re.HIGH && (i = Re.MEDIUM), `precision ${i} float;
${e}`
    } else if (r !== Re.HIGH && e.substring(0, 15) === "precision highp") return e.replace("precision highp", "precision mediump");
    return e
}
let es;

function Px() {
    if (typeof es == "boolean") return es;
    try {
        es = new Function("param1", "param2", "param3", "return param1[param2] === param3;")({
            a: "b"
        }, "a", "b") === !0
    } catch {
        es = !1
    }
    return es
}
let Nx = 0;
const nn = {},
    Ci = class {
        constructor(e, t, r = "pixi-shader", i = {}) {
            this.extra = {}, this.id = Nx++, this.vertexSrc = e || Ci.defaultVertexSrc, this.fragmentSrc = t || Ci.defaultFragmentSrc, this.vertexSrc = this.vertexSrc.trim(), this.fragmentSrc = this.fragmentSrc.trim(), this.extra = i, this.vertexSrc.substring(0, 8) !== "#version" && (r = r.replace(/\s+/g, "-"), nn[r] ? (nn[r]++, r += `-${nn[r]}`) : nn[r] = 1, this.vertexSrc = `#define SHADER_NAME ${r}
${this.vertexSrc}`, this.fragmentSrc = `#define SHADER_NAME ${r}
${this.fragmentSrc}`, this.vertexSrc = Qc(this.vertexSrc, Ci.defaultVertexPrecision, Re.HIGH), this.fragmentSrc = Qc(this.fragmentSrc, Ci.defaultFragmentPrecision, Ix())), this.glPrograms = {}, this.syncUniforms = null
        }
        static get defaultVertexSrc() {
            return Ex
        }
        static get defaultFragmentSrc() {
            return wx
        }
        static from(e, t, r) {
            const i = e + t;
            let s = Xc[i];
            return s || (Xc[i] = s = new Ci(e, t, r)), s
        }
    };
let $e = Ci;
$e.defaultVertexPrecision = Re.HIGH;
$e.defaultFragmentPrecision = Ii.apple.device ? Re.HIGH : Re.MEDIUM;
let Dx = 0;
class Xe {
    constructor(t, r, i) {
        this.group = !0, this.syncUniforms = {}, this.dirtyId = 0, this.id = Dx++, this.static = !!r, this.ubo = !!i, t instanceof Wt ? (this.buffer = t, this.buffer.type = ir.UNIFORM_BUFFER, this.autoManage = !1, this.ubo = !0) : (this.uniforms = t, this.ubo && (this.buffer = new Wt(new Float32Array(1)), this.buffer.type = ir.UNIFORM_BUFFER, this.autoManage = !0))
    }
    update() {
        this.dirtyId++, !this.autoManage && this.buffer && this.buffer.update()
    }
    add(t, r, i) {
        if (!this.ubo) this.uniforms[t] = new Xe(r, i);
        else throw new Error("[UniformGroup] uniform groups in ubo mode cannot be modified, or have uniform groups nested in them")
    }
    static from(t, r, i) {
        return new Xe(t, r, i)
    }
    static uboFrom(t, r) {
        return new Xe(t, r??!0, !0)
    }
}
class sr {
    constructor(t, r) {
        this.uniformBindCount = 0, this.program = t, r ? r instanceof Xe ? this.uniformGroup = r : this.uniformGroup = new Xe(r) : this.uniformGroup = new Xe({}), this.disposeRunner = new ze("disposeShader")
    }
    checkUniformExists(t, r) {
        if (r.uniforms[t]) return !0;
        for (const i in r.uniforms) {
            const s = r.uniforms[i];
            if (s.group && this.checkUniformExists(t, s)) return !0
        }
        return !1
    }
    destroy() {
        this.uniformGroup = null, this.disposeRunner.emit(this), this.disposeRunner.destroy()
    }
    get uniforms() {
        return this.uniformGroup.uniforms
    }
    static from(t, r, i) {
        const s = $e.from(t, r);
        return new sr(s, i)
    }
}
class Bx {
    constructor(t, r) {
        if (this.vertexSrc = t, this.fragTemplate = r, this.programCache = {}, this.defaultGroupCache = {}, !r.includes("%count%")) throw new Error('Fragment template must contain "%count%".');
        if (!r.includes("%forloop%")) throw new Error('Fragment template must contain "%forloop%".')
    }
    generateShader(t) {
        if (!this.programCache[t]) {
            const i = new Int32Array(t);
            for (let n = 0; n < t; n++) i[n] = n;
            this.defaultGroupCache[t] = Xe.from({
                uSamplers: i
            }, !0);
            let s = this.fragTemplate;
            s = s.replace(/%count%/gi, `${t}`), s = s.replace(/%forloop%/gi, this.generateSampleSrc(t)), this.programCache[t] = new $e(this.vertexSrc, s)
        }
        const r = {
            tint: new Float32Array([1, 1, 1, 1]),
            translationMatrix: new Gt,
            default: this.defaultGroupCache[t]
        };
        return new sr(this.programCache[t], r)
    }
    generateSampleSrc(t) {
        let r = "";
        r += `
`, r += `
`;
        for (let i = 0; i < t; i++) i > 0 && (r += `
else `), i < t - 1 && (r += `if(vTextureId < ${i}.5)`), r += `
{`, r += `
	color = texture2D(uSamplers[${i}], vTextureCoord);`, r += `
}`;
        return r += `
`, r += `
`, r
    }
}
class Xo {
    constructor() {
        this.elements = [], this.ids = [], this.count = 0
    }
    clear() {
        for (let t = 0; t < this.count; t++) this.elements[t] = null;
        this.count = 0
    }
}

function Ox() {
    return !Ii.apple.device
}

function Fx(e) {
    let t = !0;
    const r = K.ADAPTER.getNavigator();
    if (Ii.tablet || Ii.phone) {
        if (Ii.apple.device) {
            const i = r.userAgent.match(/OS (\d+)_(\d+)?/);
            i && parseInt(i[1], 10) < 11 && (t = !1)
        }
        if (Ii.android.device) {
            const i = r.userAgent.match(/Android\s([0-9.]*)/);
            i && parseInt(i[1], 10) < 7 && (t = !1)
        }
    }
    return t ? e : 4
}
class oa {
    constructor(t) {
        this.renderer = t
    }
    flush() {}
    destroy() {
        this.renderer = null
    }
    start() {}
    stop() {
        this.flush()
    }
    render(t) {}
}
var kx = `varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
    vec4 color;
    %forloop%
    gl_FragColor = color * vColor;
}
`,
    Lx = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vTextureId = aTextureId;
    vColor = aColor * tint;
}
`;
const Fe = class extends oa {
    constructor(e) {
        super(e), this.setShaderGenerator(), this.geometryClass = Of, this.vertexSize = 6, this.state = br.for2d(), this.size = Fe.defaultBatchSize * 4, this._vertexCount = 0, this._indexCount = 0, this._bufferedElements = [], this._bufferedTextures = [], this._bufferSize = 0, this._shader = null, this._packedGeometries = [], this._packedGeometryPoolSize = 2, this._flushId = 0, this._aBuffers = {}, this._iBuffers = {}, this.maxTextures = 1, this.renderer.on("prerender", this.onPrerender, this), e.runners.contextChange.add(this), this._dcIndex = 0, this._aIndex = 0, this._iIndex = 0, this._attributeBuffer = null, this._indexBuffer = null, this._tempBoundTextures = []
    }
    static get defaultMaxTextures() {
        return this._defaultMaxTextures = this._defaultMaxTextures??Fx(32), this._defaultMaxTextures
    }
    static set defaultMaxTextures(e) {
        this._defaultMaxTextures = e
    }
    static get canUploadSameBuffer() {
        return this._canUploadSameBuffer = this._canUploadSameBuffer??Ox(), this._canUploadSameBuffer
    }
    static set canUploadSameBuffer(e) {
        this._canUploadSameBuffer = e
    }
    get MAX_TEXTURES() {
        return Et("7.1.0", "BatchRenderer#MAX_TEXTURES renamed to BatchRenderer#maxTextures"), this.maxTextures
    }
    static get defaultVertexSrc() {
        return Lx
    }
    static get defaultFragmentTemplate() {
        return kx
    }
    setShaderGenerator({
        vertex: e = Fe.defaultVertexSrc,
        fragment: t = Fe.defaultFragmentTemplate
    } = {}) {
        this.shaderGenerator = new Bx(e, t)
    }
    contextChange() {
        const e = this.renderer.gl;
        K.PREFER_ENV === si.WEBGL_LEGACY ? this.maxTextures = 1 : (this.maxTextures = Math.min(e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS), Fe.defaultMaxTextures), this.maxTextures = fx(this.maxTextures, e)), this._shader = this.shaderGenerator.generateShader(this.maxTextures);
        for (let t = 0; t < this._packedGeometryPoolSize; t++) this._packedGeometries[t] = new this.geometryClass;
        this.initFlushBuffers()
    }
    initFlushBuffers() {
        const {
            _drawCallPool: e,
            _textureArrayPool: t
        } = Fe, r = this.size / 4, i = Math.floor(r / this.maxTextures) + 1;
        for (; e.length < r;) e.push(new Vo);
        for (; t.length < i;) t.push(new Xo);
        for (let s = 0; s < this.maxTextures; s++) this._tempBoundTextures[s] = null
    }
    onPrerender() {
        this._flushId = 0
    }
    render(e) {
        e._texture.valid && (this._vertexCount + e.vertexData.length / 2 > this.size && this.flush(), this._vertexCount += e.vertexData.length / 2, this._indexCount += e.indices.length, this._bufferedTextures[this._bufferSize] = e._texture.baseTexture, this._bufferedElements[this._bufferSize++] = e)
    }
    buildTexturesAndDrawCalls() {
        const {
            _bufferedTextures: e,
            maxTextures: t
        } = this, r = Fe._textureArrayPool, i = this.renderer.batch, s = this._tempBoundTextures, n = this.renderer.textureGC.count;
        let a = ++ct._globalBatch,
            o = 0,
            h = r[0],
            l = 0;
        i.copyBoundTextures(s, t);
        for (let c = 0; c < this._bufferSize; ++c) {
            const f = e[c];
            e[c] = null, f._batchEnabled !== a && (h.count >= t && (i.boundArray(h, s, a, t), this.buildDrawCalls(h, l, c), l = c, h = r[++o], ++a), f._batchEnabled = a, f.touched = n, h.elements[h.count++] = f)
        }
        h.count > 0 && (i.boundArray(h, s, a, t), this.buildDrawCalls(h, l, this._bufferSize), ++o, ++a);
        for (let c = 0; c < s.length; c++) s[c] = null;
        ct._globalBatch = a
    }
    buildDrawCalls(e, t, r) {
        const {
            _bufferedElements: i,
            _attributeBuffer: s,
            _indexBuffer: n,
            vertexSize: a
        } = this, o = Fe._drawCallPool;
        let h = this._dcIndex,
            l = this._aIndex,
            c = this._iIndex,
            f = o[h];
        f.start = this._iIndex, f.texArray = e;
        for (let p = t; p < r; ++p) {
            const m = i[p],
                v = m._texture.baseTexture,
                _ = Mf[v.alphaMode ? 1 : 0][m.blendMode];
            i[p] = null, t < p && f.blend !== _ && (f.size = c - f.start, t = p, f = o[++h], f.texArray = e, f.start = c), this.packInterleavedGeometry(m, s, n, l, c), l += m.vertexData.length / 2 * a, c += m.indices.length, f.blend = _
        }
        t < r && (f.size = c - f.start, ++h), this._dcIndex = h, this._aIndex = l, this._iIndex = c
    }
    bindAndClearTexArray(e) {
        const t = this.renderer.texture;
        for (let r = 0; r < e.count; r++) t.bind(e.elements[r], e.ids[r]), e.elements[r] = null;
        e.count = 0
    }
    updateGeometry() {
        const {
            _packedGeometries: e,
            _attributeBuffer: t,
            _indexBuffer: r
        } = this;
        Fe.canUploadSameBuffer ? (e[this._flushId]._buffer.update(t.rawBinaryData), e[this._flushId]._indexBuffer.update(r), this.renderer.geometry.updateBuffers()) : (this._packedGeometryPoolSize <= this._flushId && (this._packedGeometryPoolSize++, e[this._flushId] = new this.geometryClass), e[this._flushId]._buffer.update(t.rawBinaryData), e[this._flushId]._indexBuffer.update(r), this.renderer.geometry.bind(e[this._flushId]), this.renderer.geometry.updateBuffers(), this._flushId++)
    }
    drawBatches() {
        const e = this._dcIndex,
            {
                gl: t,
                state: r
            } = this.renderer,
            i = Fe._drawCallPool;
        let s = null;
        for (let n = 0; n < e; n++) {
            const {
                texArray: a,
                type: o,
                size: h,
                start: l,
                blend: c
            } = i[n];
            s !== a && (s = a, this.bindAndClearTexArray(a)), this.state.blendMode = c, r.set(this.state), t.drawElements(o, h, t.UNSIGNED_SHORT, l * 2)
        }
    }
    flush() {
        this._vertexCount !== 0 && (this._attributeBuffer = this.getAttributeBuffer(this._vertexCount), this._indexBuffer = this.getIndexBuffer(this._indexCount), this._aIndex = 0, this._iIndex = 0, this._dcIndex = 0, this.buildTexturesAndDrawCalls(), this.updateGeometry(), this.drawBatches(), this._bufferSize = 0, this._vertexCount = 0, this._indexCount = 0)
    }
    start() {
        this.renderer.state.set(this.state), this.renderer.texture.ensureSamplerType(this.maxTextures), this.renderer.shader.bind(this._shader), Fe.canUploadSameBuffer && this.renderer.geometry.bind(this._packedGeometries[this._flushId])
    }
    stop() {
        this.flush()
    }
    destroy() {
        for (let e = 0; e < this._packedGeometryPoolSize; e++) this._packedGeometries[e] && this._packedGeometries[e].destroy();
        this.renderer.off("prerender", this.onPrerender, this), this._aBuffers = null, this._iBuffers = null, this._packedGeometries = null, this._attributeBuffer = null, this._indexBuffer = null, this._shader && (this._shader.destroy(), this._shader = null), super.destroy()
    }
    getAttributeBuffer(e) {
        const t = Ln(Math.ceil(e / 8)),
            r = zc(t),
            i = t * 8;
        this._aBuffers.length <= r && (this._iBuffers.length = r + 1);
        let s = this._aBuffers[i];
        return s || (this._aBuffers[i] = s = new $o(i * this.vertexSize * 4)), s
    }
    getIndexBuffer(e) {
        const t = Ln(Math.ceil(e / 12)),
            r = zc(t),
            i = t * 12;
        this._iBuffers.length <= r && (this._iBuffers.length = r + 1);
        let s = this._iBuffers[r];
        return s || (this._iBuffers[r] = s = new Uint16Array(i)), s
    }
    packInterleavedGeometry(e, t, r, i, s) {
        const {
            uint32View: n,
            float32View: a
        } = t, o = i / this.vertexSize, h = e.uvs, l = e.indices, c = e.vertexData, f = e._texture.baseTexture._batchLocation, p = Math.min(e.worldAlpha, 1), m = Ot.shared.setValue(e._tintRGB).toPremultiplied(p, e._texture.baseTexture.alphaMode > 0);
        for (let v = 0; v < c.length; v += 2) a[i++] = c[v], a[i++] = c[v + 1], a[i++] = h[v], a[i++] = h[v + 1], n[i++] = m, a[i++] = f;
        for (let v = 0; v < l.length; v++) r[s++] = o + l[v]
    }
};
let Ie = Fe;
Ie.defaultBatchSize = 4096;
Ie.extension = {
    name: "batch",
    type: J.RendererPlugin
};
Ie._drawCallPool = [];
Ie._textureArrayPool = [];
nt.add(Ie);
var Ux = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void){
   gl_FragColor = texture2D(uSampler, vTextureCoord);
}
`,
    Gx = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;
const hs = class extends sr {
    constructor(e, t, r) {
        const i = $e.from(e || hs.defaultVertexSrc, t || hs.defaultFragmentSrc);
        super(i, r), this.padding = 0, this.resolution = hs.defaultResolution, this.multisample = hs.defaultMultisample, this.enabled = !0, this.autoFit = !0, this.state = new br
    }
    apply(e, t, r, i, s) {
        e.applyFilter(this, t, r, i)
    }
    get blendMode() {
        return this.state.blendMode
    }
    set blendMode(e) {
        this.state.blendMode = e
    }
    get resolution() {
        return this._resolution
    }
    set resolution(e) {
        this._resolution = e
    }
    static get defaultVertexSrc() {
        return Gx
    }
    static get defaultFragmentSrc() {
        return Ux
    }
};
let se = hs;
se.defaultResolution = 1;
se.defaultMultisample = Qt.NONE;
class ha {
    constructor() {
        this.clearBeforeRender = !0, this._backgroundColor = new Ot(0), this.alpha = 1
    }
    init(t) {
        this.clearBeforeRender = t.clearBeforeRender;
        const {
            backgroundColor: r,
            background: i,
            backgroundAlpha: s
        } = t, n = i??r;
        n !== void 0 && (this.color = n), this.alpha = s
    }
    get color() {
        return this._backgroundColor.value
    }
    set color(t) {
        this._backgroundColor.setValue(t)
    }
    get alpha() {
        return this._backgroundColor.alpha
    }
    set alpha(t) {
        this._backgroundColor.setAlpha(t)
    }
    get backgroundColor() {
        return this._backgroundColor
    }
    destroy() {}
}
ha.defaultOptions = {
    backgroundAlpha: 1,
    backgroundColor: 0,
    clearBeforeRender: !0
};
ha.extension = {
    type: [J.RendererSystem, J.CanvasRendererSystem],
    name: "background"
};
nt.add(ha);
class Hf {
    constructor(t) {
        this.renderer = t, this.emptyRenderer = new oa(t), this.currentRenderer = this.emptyRenderer
    }
    setObjectRenderer(t) {
        this.currentRenderer !== t && (this.currentRenderer.stop(), this.currentRenderer = t, this.currentRenderer.start())
    }
    flush() {
        this.setObjectRenderer(this.emptyRenderer)
    }
    reset() {
        this.setObjectRenderer(this.emptyRenderer)
    }
    copyBoundTextures(t, r) {
        const {
            boundTextures: i
        } = this.renderer.texture;
        for (let s = r - 1; s >= 0; --s) t[s] = i[s] || null, t[s] && (t[s]._batchLocation = s)
    }
    boundArray(t, r, i, s) {
        const {
            elements: n,
            ids: a,
            count: o
        } = t;
        let h = 0;
        for (let l = 0; l < o; l++) {
            const c = n[l],
                f = c._batchLocation;
            if (f >= 0 && f < s && r[f] === c) {
                a[l] = f;
                continue
            }
            for (; h < s;) {
                const p = r[h];
                if (p && p._batchEnabled === i && p._batchLocation === h) {
                    h++;
                    continue
                }
                a[l] = h, c._batchLocation = h, r[h] = c;
                break
            }
        }
    }
    destroy() {
        this.renderer = null
    }
}
Hf.extension = {
    type: J.RendererSystem,
    name: "batch"
};
nt.add(Hf);
let tu = 0;
class la {
    constructor(t) {
        this.renderer = t, this.webGLVersion = 1, this.extensions = {}, this.supports = {
            uint32Indices: !1
        }, this.handleContextLost = this.handleContextLost.bind(this), this.handleContextRestored = this.handleContextRestored.bind(this)
    }
    get isLost() {
        return !this.gl || this.gl.isContextLost()
    }
    contextChange(t) {
        this.gl = t, this.renderer.gl = t, this.renderer.CONTEXT_UID = tu++
    }
    init(t) {
        if (t.context) this.initFromContext(t.context);
        else {
            const r = this.renderer.background.alpha < 1,
                i = t.premultipliedAlpha;
            this.preserveDrawingBuffer = t.preserveDrawingBuffer, this.useContextAlpha = t.useContextAlpha, this.powerPreference = t.powerPreference, this.initFromOptions({
                alpha: r,
                premultipliedAlpha: i,
                antialias: t.antialias,
                stencil: !0,
                preserveDrawingBuffer: t.preserveDrawingBuffer,
                powerPreference: t.powerPreference
            })
        }
    }
    initFromContext(t) {
        this.gl = t, this.validateContext(t), this.renderer.gl = t, this.renderer.CONTEXT_UID = tu++, this.renderer.runners.contextChange.emit(t);
        const r = this.renderer.view;
        r.addEventListener !== void 0 && (r.addEventListener("webglcontextlost", this.handleContextLost, !1), r.addEventListener("webglcontextrestored", this.handleContextRestored, !1))
    }
    initFromOptions(t) {
        const r = this.createContext(this.renderer.view, t);
        this.initFromContext(r)
    }
    createContext(t, r) {
        let i;
        if (K.PREFER_ENV >= si.WEBGL2 && (i = t.getContext("webgl2", r)), i) this.webGLVersion = 2;
        else if (this.webGLVersion = 1, i = t.getContext("webgl", r) || t.getContext("experimental-webgl", r), !i) throw new Error("This browser does not support WebGL. Try using the canvas renderer");
        return this.gl = i, this.getExtensions(), this.gl
    }
    getExtensions() {
        const {
            gl: t
        } = this, r = {
            loseContext: t.getExtension("WEBGL_lose_context"),
            anisotropicFiltering: t.getExtension("EXT_texture_filter_anisotropic"),
            floatTextureLinear: t.getExtension("OES_texture_float_linear"),
            s3tc: t.getExtension("WEBGL_compressed_texture_s3tc"),
            s3tc_sRGB: t.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
            etc: t.getExtension("WEBGL_compressed_texture_etc"),
            etc1: t.getExtension("WEBGL_compressed_texture_etc1"),
            pvrtc: t.getExtension("WEBGL_compressed_texture_pvrtc") || t.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
            atc: t.getExtension("WEBGL_compressed_texture_atc"),
            astc: t.getExtension("WEBGL_compressed_texture_astc")
        };
        this.webGLVersion === 1 ? Object.assign(this.extensions, r, {
            drawBuffers: t.getExtension("WEBGL_draw_buffers"),
            depthTexture: t.getExtension("WEBGL_depth_texture"),
            vertexArrayObject: t.getExtension("OES_vertex_array_object") || t.getExtension("MOZ_OES_vertex_array_object") || t.getExtension("WEBKIT_OES_vertex_array_object"),
            uint32ElementIndex: t.getExtension("OES_element_index_uint"),
            floatTexture: t.getExtension("OES_texture_float"),
            floatTextureLinear: t.getExtension("OES_texture_float_linear"),
            textureHalfFloat: t.getExtension("OES_texture_half_float"),
            textureHalfFloatLinear: t.getExtension("OES_texture_half_float_linear")
        }) : this.webGLVersion === 2 && Object.assign(this.extensions, r, {
            colorBufferFloat: t.getExtension("EXT_color_buffer_float")
        })
    }
    handleContextLost(t) {
        t.preventDefault(), setTimeout(() => {
            this.gl.isContextLost() && this.extensions.loseContext && this.extensions.loseContext.restoreContext()
        }, 0)
    }
    handleContextRestored() {
        this.renderer.runners.contextChange.emit(this.gl)
    }
    destroy() {
        const t = this.renderer.view;
        this.renderer = null, t.removeEventListener !== void 0 && (t.removeEventListener("webglcontextlost", this.handleContextLost), t.removeEventListener("webglcontextrestored", this.handleContextRestored)), this.gl.useProgram(null), this.extensions.loseContext && this.extensions.loseContext.loseContext()
    }
    postrender() {
        this.renderer.objectRenderer.renderingToScreen && this.gl.flush()
    }
    validateContext(t) {
        const r = t.getContextAttributes(),
            i = "WebGL2RenderingContext" in globalThis && t instanceof globalThis.WebGL2RenderingContext;
        i && (this.webGLVersion = 2), r && !r.stencil && console.warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
        const s = i || !!t.getExtension("OES_element_index_uint");
        this.supports.uint32Indices = s, s || console.warn("Provided WebGL context does not support 32 index buffer, complex graphics may not render correctly")
    }
}
la.defaultOptions = {
    context: null,
    antialias: !1,
    premultipliedAlpha: !0,
    preserveDrawingBuffer: !1,
    powerPreference: "default"
};
la.extension = {
    type: J.RendererSystem,
    name: "context"
};
nt.add(la);
class $x extends Ms {
    upload(t, r, i) {
        const s = t.gl;
        s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r.alphaMode === qe.UNPACK);
        const n = r.realWidth,
            a = r.realHeight;
        return i.width === n && i.height === a ? s.texSubImage2D(r.target, 0, 0, 0, n, a, r.format, i.type, this.data) : (i.width = n, i.height = a, s.texImage2D(r.target, 0, i.internalFormat, n, a, 0, r.format, i.type, this.data)), !0
    }
}
class jo {
    constructor(t, r) {
        this.width = Math.round(t || 100), this.height = Math.round(r || 100), this.stencil = !1, this.depth = !1, this.dirtyId = 0, this.dirtyFormat = 0, this.dirtySize = 0, this.depthTexture = null, this.colorTextures = [], this.glFramebuffers = {}, this.disposeRunner = new ze("disposeFramebuffer"), this.multisample = Qt.NONE
    }
    get colorTexture() {
        return this.colorTextures[0]
    }
    addColorTexture(t = 0, r) {
        return this.colorTextures[t] = r || new ct(null, {
            scaleMode: mr.NEAREST,
            resolution: 1,
            mipmap: hr.OFF,
            width: this.width,
            height: this.height
        }), this.dirtyId++, this.dirtyFormat++, this
    }
    addDepthTexture(t) {
        return this.depthTexture = t || new ct(new $x(null, {
            width: this.width,
            height: this.height
        }), {
            scaleMode: mr.NEAREST,
            resolution: 1,
            width: this.width,
            height: this.height,
            mipmap: hr.OFF,
            format: W.DEPTH_COMPONENT,
            type: ot.UNSIGNED_SHORT
        }), this.dirtyId++, this.dirtyFormat++, this
    }
    enableDepth() {
        return this.depth = !0, this.dirtyId++, this.dirtyFormat++, this
    }
    enableStencil() {
        return this.stencil = !0, this.dirtyId++, this.dirtyFormat++, this
    }
    resize(t, r) {
        if (t = Math.round(t), r = Math.round(r), !(t === this.width && r === this.height)) {
            this.width = t, this.height = r, this.dirtyId++, this.dirtySize++;
            for (let i = 0; i < this.colorTextures.length; i++) {
                const s = this.colorTextures[i],
                    n = s.resolution;
                s.setSize(t / n, r / n)
            }
            if (this.depthTexture) {
                const i = this.depthTexture.resolution;
                this.depthTexture.setSize(t / i, r / i)
            }
        }
    }
    dispose() {
        this.disposeRunner.emit(this, !1)
    }
    destroyDepthTexture() {
        this.depthTexture && (this.depthTexture.destroy(), this.depthTexture = null, ++this.dirtyId, ++this.dirtyFormat)
    }
}
class Vf extends ct {
    constructor(t = {}) {
        if (typeof t == "number") {
            const r = arguments[0],
                i = arguments[1],
                s = arguments[2],
                n = arguments[3];
            t = {
                width: r,
                height: i,
                scaleMode: s,
                resolution: n
            }
        }
        t.width = t.width || 100, t.height = t.height || 100, t.multisample??(t.multisample = Qt.NONE), super(null, t), this.mipmap = hr.OFF, this.valid = !0, this._clear = new Ot([0, 0, 0, 0]), this.framebuffer = new jo(this.realWidth, this.realHeight).addColorTexture(0, this), this.framebuffer.multisample = t.multisample, this.maskStack = [], this.filterStack = [{}]
    }
    set clearColor(t) {
        this._clear.setValue(t)
    }
    get clearColor() {
        return this._clear.value
    }
    get clear() {
        return this._clear
    }
    resize(t, r) {
        this.framebuffer.resize(t * this.resolution, r * this.resolution), this.setRealSize(this.framebuffer.width, this.framebuffer.height)
    }
    dispose() {
        this.framebuffer.dispose(), super.dispose()
    }
    destroy() {
        super.destroy(), this.framebuffer.destroyDepthTexture(), this.framebuffer = null
    }
}
class Br extends Ts {
    constructor(t) {
        const r = t,
            i = r.naturalWidth || r.videoWidth || r.width,
            s = r.naturalHeight || r.videoHeight || r.height;
        super(i, s), this.source = t, this.noSubImage = !1
    }
    static crossOrigin(t, r, i) {
        i === void 0 && !r.startsWith("data:") ? t.crossOrigin = lx(r) : i !== !1 && (t.crossOrigin = typeof i == "string" ? i : "anonymous")
    }
    upload(t, r, i, s) {
        const n = t.gl,
            a = r.realWidth,
            o = r.realHeight;
        if (s = s || this.source, typeof HTMLImageElement < "u" && s instanceof HTMLImageElement) {
            if (!s.complete || s.naturalWidth === 0) return !1
        } else if (typeof HTMLVideoElement < "u" && s instanceof HTMLVideoElement && s.readyState <= 1 && s.buffered.length === 0) return !1;
        return n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, r.alphaMode === qe.UNPACK), !this.noSubImage && r.target === n.TEXTURE_2D && i.width === a && i.height === o ? n.texSubImage2D(n.TEXTURE_2D, 0, 0, 0, r.format, i.type, s) : (i.width = a, i.height = o, n.texImage2D(r.target, 0, i.internalFormat, r.format, i.type, s)), !0
    }
    update() {
        if (this.destroyed) return;
        const t = this.source,
            r = t.naturalWidth || t.videoWidth || t.width,
            i = t.naturalHeight || t.videoHeight || t.height;
        this.resize(r, i), super.update()
    }
    dispose() {
        this.source = null
    }
}
class zf extends Br {
    constructor(t, r) {
        if (r = r || {}, typeof t == "string") {
            const i = new Image;
            Br.crossOrigin(i, t, r.crossorigin), i.src = t, t = i
        }
        super(t), !t.complete && this._width && this._height && (this._width = 0, this._height = 0), this.url = t.src, this._process = null, this.preserveBitmap = !1, this.createBitmap = (r.createBitmap??K.CREATE_IMAGE_BITMAP) && !!globalThis.createImageBitmap, this.alphaMode = typeof r.alphaMode == "number" ? r.alphaMode : null, this.bitmap = null, this._load = null, r.autoLoad !== !1 && this.load()
    }
    load(t) {
        return this._load ? this._load : (t !== void 0 && (this.createBitmap = t), this._load = new Promise((r, i) => {
            const s = this.source;
            this.url = s.src;
            const n = () => {
                this.destroyed || (s.onload = null, s.onerror = null, this.resize(s.width, s.height), this._load = null, this.createBitmap ? r(this.process()) : r(this))
            };
            s.complete && s.src ? n() : (s.onload = n, s.onerror = a => {
                i(a), this.onError.emit(a)
            })
        }), this._load)
    }
    process() {
        const t = this.source;
        if (this._process !== null) return this._process;
        if (this.bitmap !== null || !globalThis.createImageBitmap) return Promise.resolve(this);
        const r = globalThis.createImageBitmap,
            i = !t.crossOrigin || t.crossOrigin === "anonymous";
        return this._process = fetch(t.src, {
            mode: i ? "cors" : "no-cors"
        }).then(s => s.blob()).then(s => r(s, 0, 0, t.width, t.height, {
            premultiplyAlpha: this.alphaMode === null || this.alphaMode === qe.UNPACK ? "premultiply" : "none"
        })).then(s => this.destroyed ? Promise.reject() : (this.bitmap = s, this.update(), this._process = null, Promise.resolve(this))), this._process
    }
    upload(t, r, i) {
        if (typeof this.alphaMode == "number" && (r.alphaMode = this.alphaMode), !this.createBitmap) return super.upload(t, r, i);
        if (!this.bitmap && (this.process(), !this.bitmap)) return !1;
        if (super.upload(t, r, i, this.bitmap), !this.preserveBitmap) {
            let s = !0;
            const n = r._glTextures;
            for (const a in n) {
                const o = n[a];
                if (o !== i && o.dirtyId !== r.dirtyId) {
                    s = !1;
                    break
                }
            }
            s && (this.bitmap.close && this.bitmap.close(), this.bitmap = null)
        }
        return !0
    }
    dispose() {
        this.source.onload = null, this.source.onerror = null, super.dispose(), this.bitmap && (this.bitmap.close(), this.bitmap = null), this._process = null, this._load = null
    }
    static test(t) {
        return typeof HTMLImageElement < "u" && (typeof t == "string" || t instanceof HTMLImageElement)
    }
}
class Xf {
    constructor() {
        this.x0 = 0, this.y0 = 0, this.x1 = 1, this.y1 = 0, this.x2 = 1, this.y2 = 1, this.x3 = 0, this.y3 = 1, this.uvsFloat32 = new Float32Array(8)
    }
    set(t, r, i) {
        const s = r.width,
            n = r.height;
        if (i) {
            const a = t.width / 2 / s,
                o = t.height / 2 / n,
                h = t.x / s + a,
                l = t.y / n + o;
            i = $t.add(i, $t.NW), this.x0 = h + a * $t.uX(i), this.y0 = l + o * $t.uY(i), i = $t.add(i, 2), this.x1 = h + a * $t.uX(i), this.y1 = l + o * $t.uY(i), i = $t.add(i, 2), this.x2 = h + a * $t.uX(i), this.y2 = l + o * $t.uY(i), i = $t.add(i, 2), this.x3 = h + a * $t.uX(i), this.y3 = l + o * $t.uY(i)
        } else this.x0 = t.x / s, this.y0 = t.y / n, this.x1 = (t.x + t.width) / s, this.y1 = t.y / n, this.x2 = (t.x + t.width) / s, this.y2 = (t.y + t.height) / n, this.x3 = t.x / s, this.y3 = (t.y + t.height) / n;
        this.uvsFloat32[0] = this.x0, this.uvsFloat32[1] = this.y0, this.uvsFloat32[2] = this.x1, this.uvsFloat32[3] = this.y1, this.uvsFloat32[4] = this.x2, this.uvsFloat32[5] = this.y2, this.uvsFloat32[6] = this.x3, this.uvsFloat32[7] = this.y3
    }
    toString() {
        return `[@pixi/core:TextureUvs x0=${this.x0} y0=${this.y0} x1=${this.x1} y1=${this.y1} x2=${this.x2} y2=${this.y2} x3=${this.x3} y3=${this.y3}]`
    }
}
const eu = new Xf;

function an(e) {
    e.destroy = function() {}, e.on = function() {}, e.once = function() {}, e.emit = function() {}
}
class st extends Hi {
    constructor(t, r, i, s, n, a, o) {
        if (super(), this.noFrame = !1, r || (this.noFrame = !0, r = new _t(0, 0, 1, 1)), t instanceof st && (t = t.baseTexture), this.baseTexture = t, this._frame = r, this.trim = s, this.valid = !1, this._uvs = eu, this.uvMatrix = null, this.orig = i || r, this._rotate = Number(n || 0), n === !0) this._rotate = 2;
        else if (this._rotate % 2 !== 0) throw new Error("attempt to use diamond-shaped UVs. If you are sure, set rotation manually");
        this.defaultAnchor = a ? new Lt(a.x, a.y) : new Lt(0, 0), this.defaultBorders = o, this._updateID = 0, this.textureCacheIds = [], t.valid ? this.noFrame ? t.valid && this.onBaseTextureUpdated(t) : this.frame = r : t.once("loaded", this.onBaseTextureUpdated, this), this.noFrame && t.on("update", this.onBaseTextureUpdated, this)
    }
    update() {
        this.baseTexture.resource && this.baseTexture.resource.update()
    }
    onBaseTextureUpdated(t) {
        if (this.noFrame) {
            if (!this.baseTexture.valid) return;
            this._frame.width = t.width, this._frame.height = t.height, this.valid = !0, this.updateUvs()
        } else this.frame = this._frame;
        this.emit("update", this)
    }
    destroy(t) {
        if (this.baseTexture) {
            if (t) {
                const {
                    resource: r
                } = this.baseTexture;
                r != null && r.url && Ke[r.url] && st.removeFromCache(r.url), this.baseTexture.destroy()
            }
            this.baseTexture.off("loaded", this.onBaseTextureUpdated, this), this.baseTexture.off("update", this.onBaseTextureUpdated, this), this.baseTexture = null
        }
        this._frame = null, this._uvs = null, this.trim = null, this.orig = null, this.valid = !1, st.removeFromCache(this), this.textureCacheIds = null
    }
    clone() {
        var s;
        const t = this._frame.clone(),
            r = this._frame === this.orig ? t : this.orig.clone(),
            i = new st(this.baseTexture, !this.noFrame && t, r, (s = this.trim) == null ? void 0 : s.clone(), this.rotate, this.defaultAnchor, this.defaultBorders);
        return this.noFrame && (i._frame = t), i
    }
    updateUvs() {
        this._uvs === eu && (this._uvs = new Xf), this._uvs.set(this._frame, this.baseTexture, this.rotate), this._updateID++
    }
    static from(t, r = {}, i = K.STRICT_TEXTURE_CACHE) {
        const s = typeof t == "string";
        let n = null;
        if (s) n = t;
        else if (t instanceof ct) {
            if (!t.cacheId) {
                const o = (r == null ? void 0 : r.pixiIdPrefix) || "pixiid";
                t.cacheId = `${o}-${ei()}`, ct.addToCache(t, t.cacheId)
            }
            n = t.cacheId
        } else {
            if (!t._pixiId) {
                const o = (r == null ? void 0 : r.pixiIdPrefix) || "pixiid";
                t._pixiId = `${o}_${ei()}`
            }
            n = t._pixiId
        }
        let a = Ke[n];
        if (s && i && !a) throw new Error(`The cacheId "${n}" does not exist in TextureCache.`);
        return !a && !(t instanceof ct) ? (r.resolution || (r.resolution = Nr(t)), a = new st(new ct(t, r)), a.baseTexture.cacheId = n, ct.addToCache(a.baseTexture, n), st.addToCache(a, n)) : !a && t instanceof ct && (a = new st(t), st.addToCache(a, n)), a
    }
    static fromURL(t, r) {
        const i = Object.assign({
                autoLoad: !1
            }, r == null ? void 0 : r.resourceOptions),
            s = st.from(t, Object.assign({
                resourceOptions: i
            }, r), !1),
            n = s.baseTexture.resource;
        return s.baseTexture.valid ? Promise.resolve(s) : n.load().then(() => Promise.resolve(s))
    }
    static fromBuffer(t, r, i, s) {
        return new st(ct.fromBuffer(t, r, i, s))
    }
    static fromLoader(t, r, i, s) {
        const n = new ct(t, Object.assign({
                scaleMode: ct.defaultOptions.scaleMode,
                resolution: Nr(r)
            }, s)),
            {
                resource: a
            } = n;
        a instanceof zf && (a.url = r);
        const o = new st(n);
        return i || (i = r), ct.addToCache(o.baseTexture, i), st.addToCache(o, i), i !== r && (ct.addToCache(o.baseTexture, r), st.addToCache(o, r)), o.baseTexture.valid ? Promise.resolve(o) : new Promise(h => {
            o.baseTexture.once("loaded", () => h(o))
        })
    }
    static addToCache(t, r) {
        r && (t.textureCacheIds.includes(r) || t.textureCacheIds.push(r), Ke[r] && Ke[r] !== t && console.warn(`Texture added to the cache with an id [${r}] that already had an entry`), Ke[r] = t)
    }
    static removeFromCache(t) {
        if (typeof t == "string") {
            const r = Ke[t];
            if (r) {
                const i = r.textureCacheIds.indexOf(t);
                return i > -1 && r.textureCacheIds.splice(i, 1), delete Ke[t], r
            }
        } else if (t != null && t.textureCacheIds) {
            for (let r = 0; r < t.textureCacheIds.length; ++r) Ke[t.textureCacheIds[r]] === t && delete Ke[t.textureCacheIds[r]];
            return t.textureCacheIds.length = 0, t
        }
        return null
    }
    get resolution() {
        return this.baseTexture.resolution
    }
    get frame() {
        return this._frame
    }
    set frame(t) {
        this._frame = t, this.noFrame = !1;
        const {
            x: r,
            y: i,
            width: s,
            height: n
        } = t, a = r + s > this.baseTexture.width, o = i + n > this.baseTexture.height;
        if (a || o) {
            const h = a && o ? "and" : "or",
                l = `X: ${r} + ${s} = ${r+s} > ${this.baseTexture.width}`,
                c = `Y: ${i} + ${n} = ${i+n} > ${this.baseTexture.height}`;
            throw new Error(`Texture Error: frame does not fit inside the base Texture dimensions: ${l} ${h} ${c}`)
        }
        this.valid = s && n && this.baseTexture.valid, !this.trim && !this.rotate && (this.orig = t), this.valid && this.updateUvs()
    }
    get rotate() {
        return this._rotate
    }
    set rotate(t) {
        this._rotate = t, this.valid && this.updateUvs()
    }
    get width() {
        return this.orig.width
    }
    get height() {
        return this.orig.height
    }
    castToBaseTexture() {
        return this.baseTexture
    }
    static get EMPTY() {
        return st._EMPTY || (st._EMPTY = new st(new ct), an(st._EMPTY), an(st._EMPTY.baseTexture)), st._EMPTY
    }
    static get WHITE() {
        if (!st._WHITE) {
            const t = K.ADAPTER.createCanvas(16, 16),
                r = t.getContext("2d");
            t.width = 16, t.height = 16, r.fillStyle = "white", r.fillRect(0, 0, 16, 16), st._WHITE = new st(ct.from(t)), an(st._WHITE), an(st._WHITE.baseTexture)
        }
        return st._WHITE
    }
}
class ni extends st {
    constructor(t, r) {
        super(t, r), this.valid = !0, this.filterFrame = null, this.filterPoolKey = null, this.updateUvs()
    }
    get framebuffer() {
        return this.baseTexture.framebuffer
    }
    get multisample() {
        return this.framebuffer.multisample
    }
    set multisample(t) {
        this.framebuffer.multisample = t
    }
    resize(t, r, i = !0) {
        const s = this.baseTexture.resolution,
            n = Math.round(t * s) / s,
            a = Math.round(r * s) / s;
        this.valid = n > 0 && a > 0, this._frame.width = this.orig.width = n, this._frame.height = this.orig.height = a, i && this.baseTexture.resize(n, a), this.updateUvs()
    }
    setResolution(t) {
        const {
            baseTexture: r
        } = this;
        r.resolution !== t && (r.setResolution(t), this.resize(r.width, r.height, !1))
    }
    static create(t) {
        return new ni(new Vf(t))
    }
}
class jf {
    constructor(t) {
        this.texturePool = {}, this.textureOptions = t || {}, this.enableFullScreen = !1, this._pixelsWidth = 0, this._pixelsHeight = 0
    }
    createTexture(t, r, i = Qt.NONE) {
        const s = new Vf(Object.assign({
            width: t,
            height: r,
            resolution: 1,
            multisample: i
        }, this.textureOptions));
        return new ni(s)
    }
    getOptimalTexture(t, r, i = 1, s = Qt.NONE) {
        let n;
        t = Math.ceil(t * i - 1e-6), r = Math.ceil(r * i - 1e-6), !this.enableFullScreen || t !== this._pixelsWidth || r !== this._pixelsHeight ? (t = Ln(t), r = Ln(r), n = ((t & 65535) << 16 | r & 65535) >>> 0, s > 1 && (n += s * 4294967296)) : n = s > 1 ? -s : -1, this.texturePool[n] || (this.texturePool[n] = []);
        let a = this.texturePool[n].pop();
        return a || (a = this.createTexture(t, r, s)), a.filterPoolKey = n, a.setResolution(i), a
    }
    getFilterTexture(t, r, i) {
        const s = this.getOptimalTexture(t.width, t.height, r || t.resolution, i || Qt.NONE);
        return s.filterFrame = t.filterFrame, s
    }
    returnTexture(t) {
        const r = t.filterPoolKey;
        t.filterFrame = null, this.texturePool[r].push(t)
    }
    returnFilterTexture(t) {
        this.returnTexture(t)
    }
    clear(t) {
        if (t = t !== !1, t)
            for (const r in this.texturePool) {
                const i = this.texturePool[r];
                if (i)
                    for (let s = 0; s < i.length; s++) i[s].destroy(!0)
            }
        this.texturePool = {}
    }
    setScreenSize(t) {
        if (!(t.width === this._pixelsWidth && t.height === this._pixelsHeight)) {
            this.enableFullScreen = t.width > 0 && t.height > 0;
            for (const r in this.texturePool) {
                if (!(Number(r) < 0)) continue;
                const i = this.texturePool[r];
                if (i)
                    for (let s = 0; s < i.length; s++) i[s].destroy(!0);
                this.texturePool[r] = []
            }
            this._pixelsWidth = t.width, this._pixelsHeight = t.height
        }
    }
}
jf.SCREEN_KEY = -1;
class Hx extends Dr {
    constructor() {
        super(), this.addAttribute("aVertexPosition", new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])).addIndex([0, 1, 3, 2])
    }
}
class Wf extends Dr {
    constructor() {
        super(), this.vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]), this.uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), this.vertexBuffer = new Wt(this.vertices), this.uvBuffer = new Wt(this.uvs), this.addAttribute("aVertexPosition", this.vertexBuffer).addAttribute("aTextureCoord", this.uvBuffer).addIndex([0, 1, 2, 0, 2, 3])
    }
    map(t, r) {
        let i = 0,
            s = 0;
        return this.uvs[0] = i, this.uvs[1] = s, this.uvs[2] = i + r.width / t.width, this.uvs[3] = s, this.uvs[4] = i + r.width / t.width, this.uvs[5] = s + r.height / t.height, this.uvs[6] = i, this.uvs[7] = s + r.height / t.height, i = r.x, s = r.y, this.vertices[0] = i, this.vertices[1] = s, this.vertices[2] = i + r.width, this.vertices[3] = s, this.vertices[4] = i + r.width, this.vertices[5] = s + r.height, this.vertices[6] = i, this.vertices[7] = s + r.height, this.invalidate(), this
    }
    invalidate() {
        return this.vertexBuffer._updateID++, this.uvBuffer._updateID++, this
    }
}
class Vx {
    constructor() {
        this.renderTexture = null, this.target = null, this.legacy = !1, this.resolution = 1, this.multisample = Qt.NONE, this.sourceFrame = new _t, this.destinationFrame = new _t, this.bindingSourceFrame = new _t, this.bindingDestinationFrame = new _t, this.filters = [], this.transform = null
    }
    clear() {
        this.target = null, this.filters = null, this.renderTexture = null
    }
}
const on = [new Lt, new Lt, new Lt, new Lt],
    lo = new Gt;
class Yf {
    constructor(t) {
        this.renderer = t, this.defaultFilterStack = [{}], this.texturePool = new jf, this.statePool = [], this.quad = new Hx, this.quadUv = new Wf, this.tempRect = new _t, this.activeState = {}, this.globalUniforms = new Xe({
            outputFrame: new _t,
            inputSize: new Float32Array(4),
            inputPixel: new Float32Array(4),
            inputClamp: new Float32Array(4),
            resolution: 1,
            filterArea: new Float32Array(4),
            filterClamp: new Float32Array(4)
        }, !0), this.forceClear = !1, this.useMaxPadding = !1
    }
    init() {
        this.texturePool.setScreenSize(this.renderer.view)
    }
    push(t, r) {
        const i = this.renderer,
            s = this.defaultFilterStack,
            n = this.statePool.pop() || new Vx,
            a = this.renderer.renderTexture;
        let o = r[0].resolution,
            h = r[0].multisample,
            l = r[0].padding,
            c = r[0].autoFit,
            f = r[0].legacy??!0;
        for (let v = 1; v < r.length; v++) {
            const _ = r[v];
            o = Math.min(o, _.resolution), h = Math.min(h, _.multisample), l = this.useMaxPadding ? Math.max(l, _.padding) : l + _.padding, c = c && _.autoFit, f = f || (_.legacy??!0)
        }
        s.length === 1 && (this.defaultFilterStack[0].renderTexture = a.current), s.push(n), n.resolution = o, n.multisample = h, n.legacy = f, n.target = t, n.sourceFrame.copyFrom(t.filterArea || t.getBounds(!0)), n.sourceFrame.pad(l);
        const p = this.tempRect.copyFrom(a.sourceFrame);
        i.projection.transform && this.transformAABB(lo.copyFrom(i.projection.transform).invert(), p), c ? (n.sourceFrame.fit(p), (n.sourceFrame.width <= 0 || n.sourceFrame.height <= 0) && (n.sourceFrame.width = 0, n.sourceFrame.height = 0)) : n.sourceFrame.intersects(p) || (n.sourceFrame.width = 0, n.sourceFrame.height = 0), this.roundFrame(n.sourceFrame, a.current ? a.current.resolution : i.resolution, a.sourceFrame, a.destinationFrame, i.projection.transform), n.renderTexture = this.getOptimalFilterTexture(n.sourceFrame.width, n.sourceFrame.height, o, h), n.filters = r, n.destinationFrame.width = n.renderTexture.width, n.destinationFrame.height = n.renderTexture.height;
        const m = this.tempRect;
        m.x = 0, m.y = 0, m.width = n.sourceFrame.width, m.height = n.sourceFrame.height, n.renderTexture.filterFrame = n.sourceFrame, n.bindingSourceFrame.copyFrom(a.sourceFrame), n.bindingDestinationFrame.copyFrom(a.destinationFrame), n.transform = i.projection.transform, i.projection.transform = null, a.bind(n.renderTexture, n.sourceFrame, m), i.framebuffer.clear(0, 0, 0, 0)
    }
    pop() {
        const t = this.defaultFilterStack,
            r = t.pop(),
            i = r.filters;
        this.activeState = r;
        const s = this.globalUniforms.uniforms;
        s.outputFrame = r.sourceFrame, s.resolution = r.resolution;
        const n = s.inputSize,
            a = s.inputPixel,
            o = s.inputClamp;
        if (n[0] = r.destinationFrame.width, n[1] = r.destinationFrame.height, n[2] = 1 / n[0], n[3] = 1 / n[1], a[0] = Math.round(n[0] * r.resolution), a[1] = Math.round(n[1] * r.resolution), a[2] = 1 / a[0], a[3] = 1 / a[1], o[0] = .5 * a[2], o[1] = .5 * a[3], o[2] = r.sourceFrame.width * n[2] - .5 * a[2], o[3] = r.sourceFrame.height * n[3] - .5 * a[3], r.legacy) {
            const l = s.filterArea;
            l[0] = r.destinationFrame.width, l[1] = r.destinationFrame.height, l[2] = r.sourceFrame.x, l[3] = r.sourceFrame.y, s.filterClamp = s.inputClamp
        }
        this.globalUniforms.update();
        const h = t[t.length - 1];
        if (this.renderer.framebuffer.blit(), i.length === 1) i[0].apply(this, r.renderTexture, h.renderTexture, Je.BLEND, r), this.returnFilterTexture(r.renderTexture);
        else {
            let l = r.renderTexture,
                c = this.getOptimalFilterTexture(l.width, l.height, r.resolution);
            c.filterFrame = l.filterFrame;
            let f = 0;
            for (f = 0; f < i.length - 1; ++f) {
                f === 1 && r.multisample > 1 && (c = this.getOptimalFilterTexture(l.width, l.height, r.resolution), c.filterFrame = l.filterFrame), i[f].apply(this, l, c, Je.CLEAR, r);
                const p = l;
                l = c, c = p
            }
            i[f].apply(this, l, h.renderTexture, Je.BLEND, r), f > 1 && r.multisample > 1 && this.returnFilterTexture(r.renderTexture), this.returnFilterTexture(l), this.returnFilterTexture(c)
        }
        r.clear(), this.statePool.push(r)
    }
    bindAndClear(t, r = Je.CLEAR) {
        const {
            renderTexture: i,
            state: s
        } = this.renderer;
        if (t === this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? this.renderer.projection.transform = this.activeState.transform : this.renderer.projection.transform = null, t != null && t.filterFrame) {
            const a = this.tempRect;
            a.x = 0, a.y = 0, a.width = t.filterFrame.width, a.height = t.filterFrame.height, i.bind(t, t.filterFrame, a)
        } else t !== this.defaultFilterStack[this.defaultFilterStack.length - 1].renderTexture ? i.bind(t) : this.renderer.renderTexture.bind(t, this.activeState.bindingSourceFrame, this.activeState.bindingDestinationFrame);
        const n = s.stateId & 1 || this.forceClear;
        (r === Je.CLEAR || r === Je.BLIT && n) && this.renderer.framebuffer.clear(0, 0, 0, 0)
    }
    applyFilter(t, r, i, s) {
        const n = this.renderer;
        n.state.set(t.state), this.bindAndClear(i, s), t.uniforms.uSampler = r, t.uniforms.filterGlobals = this.globalUniforms, n.shader.bind(t), t.legacy = !!t.program.attributeData.aTextureCoord, t.legacy ? (this.quadUv.map(r._frame, r.filterFrame), n.geometry.bind(this.quadUv), n.geometry.draw(tr.TRIANGLES)) : (n.geometry.bind(this.quad), n.geometry.draw(tr.TRIANGLE_STRIP))
    }
    calculateSpriteMatrix(t, r) {
        const {
            sourceFrame: i,
            destinationFrame: s
        } = this.activeState, {
            orig: n
        } = r._texture, a = t.set(s.width, 0, 0, s.height, i.x, i.y), o = r.worldTransform.copyTo(Gt.TEMP_MATRIX);
        return o.invert(), a.prepend(o), a.scale(1 / n.width, 1 / n.height), a.translate(r.anchor.x, r.anchor.y), a
    }
    destroy() {
        this.renderer = null, this.texturePool.clear(!1)
    }
    getOptimalFilterTexture(t, r, i = 1, s = Qt.NONE) {
        return this.texturePool.getOptimalTexture(t, r, i, s)
    }
    getFilterTexture(t, r, i) {
        if (typeof t == "number") {
            const n = t;
            t = r, r = n
        }
        t = t || this.activeState.renderTexture;
        const s = this.texturePool.getOptimalTexture(t.width, t.height, r || t.resolution, i || Qt.NONE);
        return s.filterFrame = t.filterFrame, s
    }
    returnFilterTexture(t) {
        this.texturePool.returnTexture(t)
    }
    emptyPool() {
        this.texturePool.clear(!0)
    }
    resize() {
        this.texturePool.setScreenSize(this.renderer.view)
    }
    transformAABB(t, r) {
        const i = on[0],
            s = on[1],
            n = on[2],
            a = on[3];
        i.set(r.left, r.top), s.set(r.left, r.bottom), n.set(r.right, r.top), a.set(r.right, r.bottom), t.apply(i, i), t.apply(s, s), t.apply(n, n), t.apply(a, a);
        const o = Math.min(i.x, s.x, n.x, a.x),
            h = Math.min(i.y, s.y, n.y, a.y),
            l = Math.max(i.x, s.x, n.x, a.x),
            c = Math.max(i.y, s.y, n.y, a.y);
        r.x = o, r.y = h, r.width = l - o, r.height = c - h
    }
    roundFrame(t, r, i, s, n) {
        if (!(t.width <= 0 || t.height <= 0 || i.width <= 0 || i.height <= 0)) {
            if (n) {
                const {
                    a,
                    b: o,
                    c: h,
                    d: l
                } = n;
                if ((Math.abs(o) > 1e-4 || Math.abs(h) > 1e-4) && (Math.abs(a) > 1e-4 || Math.abs(l) > 1e-4)) return
            }
            n = n ? lo.copyFrom(n) : lo.identity(), n.translate(-i.x, -i.y).scale(s.width / i.width, s.height / i.height).translate(s.x, s.y), this.transformAABB(n, t), t.ceil(r), this.transformAABB(n.invert(), t)
        }
    }
}
Yf.extension = {
    type: J.RendererSystem,
    name: "filter"
};
nt.add(Yf);
class zx {
    constructor(t) {
        this.framebuffer = t, this.stencil = null, this.dirtyId = -1, this.dirtyFormat = -1, this.dirtySize = -1, this.multisample = Qt.NONE, this.msaaBuffer = null, this.blitFramebuffer = null, this.mipLevel = 0
    }
}
const Xx = new _t;
class qf {
    constructor(t) {
        this.renderer = t, this.managedFramebuffers = [], this.unknownFramebuffer = new jo(10, 10), this.msaaSamples = null
    }
    contextChange() {
        this.disposeAll(!0);
        const t = this.gl = this.renderer.gl;
        if (this.CONTEXT_UID = this.renderer.CONTEXT_UID, this.current = this.unknownFramebuffer, this.viewport = new _t, this.hasMRT = !0, this.writeDepthTexture = !0, this.renderer.context.webGLVersion === 1) {
            let r = this.renderer.context.extensions.drawBuffers,
                i = this.renderer.context.extensions.depthTexture;
            K.PREFER_ENV === si.WEBGL_LEGACY && (r = null, i = null), r ? t.drawBuffers = s => r.drawBuffersWEBGL(s) : (this.hasMRT = !1, t.drawBuffers = () => {}), i || (this.writeDepthTexture = !1)
        } else this.msaaSamples = t.getInternalformatParameter(t.RENDERBUFFER, t.RGBA8, t.SAMPLES)
    }
    bind(t, r, i = 0) {
        const {
            gl: s
        } = this;
        if (t) {
            const n = t.glFramebuffers[this.CONTEXT_UID] || this.initFramebuffer(t);
            this.current !== t && (this.current = t, s.bindFramebuffer(s.FRAMEBUFFER, n.framebuffer)), n.mipLevel !== i && (t.dirtyId++, t.dirtyFormat++, n.mipLevel = i), n.dirtyId !== t.dirtyId && (n.dirtyId = t.dirtyId, n.dirtyFormat !== t.dirtyFormat ? (n.dirtyFormat = t.dirtyFormat, n.dirtySize = t.dirtySize, this.updateFramebuffer(t, i)) : n.dirtySize !== t.dirtySize && (n.dirtySize = t.dirtySize, this.resizeFramebuffer(t)));
            for (let a = 0; a < t.colorTextures.length; a++) {
                const o = t.colorTextures[a];
                this.renderer.texture.unbind(o.parentTextureArray || o)
            }
            if (t.depthTexture && this.renderer.texture.unbind(t.depthTexture), r) {
                const a = r.width >> i,
                    o = r.height >> i,
                    h = a / r.width;
                this.setViewport(r.x * h, r.y * h, a, o)
            } else {
                const a = t.width >> i,
                    o = t.height >> i;
                this.setViewport(0, 0, a, o)
            }
        } else this.current && (this.current = null, s.bindFramebuffer(s.FRAMEBUFFER, null)), r ? this.setViewport(r.x, r.y, r.width, r.height) : this.setViewport(0, 0, this.renderer.width, this.renderer.height)
    }
    setViewport(t, r, i, s) {
        const n = this.viewport;
        t = Math.round(t), r = Math.round(r), i = Math.round(i), s = Math.round(s), (n.width !== i || n.height !== s || n.x !== t || n.y !== r) && (n.x = t, n.y = r, n.width = i, n.height = s, this.gl.viewport(t, r, i, s))
    }
    get size() {
        return this.current ? {
            x: 0,
            y: 0,
            width: this.current.width,
            height: this.current.height
        } : {
            x: 0,
            y: 0,
            width: this.renderer.width,
            height: this.renderer.height
        }
    }
    clear(t, r, i, s, n = Ro.COLOR | Ro.DEPTH) {
        const {
            gl: a
        } = this;
        a.clearColor(t, r, i, s), a.clear(n)
    }
    initFramebuffer(t) {
        const {
            gl: r
        } = this, i = new zx(r.createFramebuffer());
        return i.multisample = this.detectSamples(t.multisample), t.glFramebuffers[this.CONTEXT_UID] = i, this.managedFramebuffers.push(t), t.disposeRunner.add(this), i
    }
    resizeFramebuffer(t) {
        const {
            gl: r
        } = this, i = t.glFramebuffers[this.CONTEXT_UID];
        i.stencil && (r.bindRenderbuffer(r.RENDERBUFFER, i.stencil), i.msaaBuffer ? r.renderbufferStorageMultisample(r.RENDERBUFFER, i.multisample, r.DEPTH24_STENCIL8, t.width, t.height) : r.renderbufferStorage(r.RENDERBUFFER, r.DEPTH_STENCIL, t.width, t.height));
        const s = t.colorTextures;
        let n = s.length;
        r.drawBuffers || (n = Math.min(n, 1));
        for (let a = 0; a < n; a++) {
            const o = s[a],
                h = o.parentTextureArray || o;
            this.renderer.texture.bind(h, 0), a === 0 && i.msaaBuffer && (r.bindRenderbuffer(r.RENDERBUFFER, i.msaaBuffer), r.renderbufferStorageMultisample(r.RENDERBUFFER, i.multisample, h._glTextures[this.CONTEXT_UID].internalFormat, t.width, t.height))
        }
        t.depthTexture && this.writeDepthTexture && this.renderer.texture.bind(t.depthTexture, 0)
    }
    updateFramebuffer(t, r) {
        const {
            gl: i
        } = this, s = t.glFramebuffers[this.CONTEXT_UID], n = t.colorTextures;
        let a = n.length;
        i.drawBuffers || (a = Math.min(a, 1)), s.multisample > 1 && this.canMultisampleFramebuffer(t) ? s.msaaBuffer = s.msaaBuffer || i.createRenderbuffer() : s.msaaBuffer && (i.deleteRenderbuffer(s.msaaBuffer), s.msaaBuffer = null, s.blitFramebuffer && (s.blitFramebuffer.dispose(), s.blitFramebuffer = null));
        const o = [];
        for (let h = 0; h < a; h++) {
            const l = n[h],
                c = l.parentTextureArray || l;
            this.renderer.texture.bind(c, 0), h === 0 && s.msaaBuffer ? (i.bindRenderbuffer(i.RENDERBUFFER, s.msaaBuffer), i.renderbufferStorageMultisample(i.RENDERBUFFER, s.multisample, c._glTextures[this.CONTEXT_UID].internalFormat, t.width, t.height), i.framebufferRenderbuffer(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0, i.RENDERBUFFER, s.msaaBuffer)) : (i.framebufferTexture2D(i.FRAMEBUFFER, i.COLOR_ATTACHMENT0 + h, l.target, c._glTextures[this.CONTEXT_UID].texture, r), o.push(i.COLOR_ATTACHMENT0 + h))
        }
        if (o.length > 1 && i.drawBuffers(o), t.depthTexture && this.writeDepthTexture) {
            const l = t.depthTexture;
            this.renderer.texture.bind(l, 0), i.framebufferTexture2D(i.FRAMEBUFFER, i.DEPTH_ATTACHMENT, i.TEXTURE_2D, l._glTextures[this.CONTEXT_UID].texture, r)
        }(t.stencil || t.depth) && !(t.depthTexture && this.writeDepthTexture) ? (s.stencil = s.stencil || i.createRenderbuffer(), i.bindRenderbuffer(i.RENDERBUFFER, s.stencil), s.msaaBuffer ? i.renderbufferStorageMultisample(i.RENDERBUFFER, s.multisample, i.DEPTH24_STENCIL8, t.width, t.height) : i.renderbufferStorage(i.RENDERBUFFER, i.DEPTH_STENCIL, t.width, t.height), i.framebufferRenderbuffer(i.FRAMEBUFFER, i.DEPTH_STENCIL_ATTACHMENT, i.RENDERBUFFER, s.stencil)) : s.stencil && (i.deleteRenderbuffer(s.stencil), s.stencil = null)
    }
    canMultisampleFramebuffer(t) {
        return this.renderer.context.webGLVersion !== 1 && t.colorTextures.length <= 1 && !t.depthTexture
    }
    detectSamples(t) {
        const {
            msaaSamples: r
        } = this;
        let i = Qt.NONE;
        if (t <= 1 || r === null) return i;
        for (let s = 0; s < r.length; s++)
            if (r[s] <= t) {
                i = r[s];
                break
            }
        return i === 1 && (i = Qt.NONE), i
    }
    blit(t, r, i) {
        const {
            current: s,
            renderer: n,
            gl: a,
            CONTEXT_UID: o
        } = this;
        if (n.context.webGLVersion !== 2 || !s) return;
        const h = s.glFramebuffers[o];
        if (!h) return;
        if (!t) {
            if (!h.msaaBuffer) return;
            const c = s.colorTextures[0];
            if (!c) return;
            h.blitFramebuffer || (h.blitFramebuffer = new jo(s.width, s.height), h.blitFramebuffer.addColorTexture(0, c)), t = h.blitFramebuffer, t.colorTextures[0] !== c && (t.colorTextures[0] = c, t.dirtyId++, t.dirtyFormat++), (t.width !== s.width || t.height !== s.height) && (t.width = s.width, t.height = s.height, t.dirtyId++, t.dirtySize++)
        }
        r || (r = Xx, r.width = s.width, r.height = s.height), i || (i = r);
        const l = r.width === i.width && r.height === i.height;
        this.bind(t), a.bindFramebuffer(a.READ_FRAMEBUFFER, h.framebuffer), a.blitFramebuffer(r.left, r.top, r.right, r.bottom, i.left, i.top, i.right, i.bottom, a.COLOR_BUFFER_BIT, l ? a.NEAREST : a.LINEAR), a.bindFramebuffer(a.READ_FRAMEBUFFER, t.glFramebuffers[this.CONTEXT_UID].framebuffer)
    }
    disposeFramebuffer(t, r) {
        const i = t.glFramebuffers[this.CONTEXT_UID],
            s = this.gl;
        if (!i) return;
        delete t.glFramebuffers[this.CONTEXT_UID];
        const n = this.managedFramebuffers.indexOf(t);
        n >= 0 && this.managedFramebuffers.splice(n, 1), t.disposeRunner.remove(this), r || (s.deleteFramebuffer(i.framebuffer), i.msaaBuffer && s.deleteRenderbuffer(i.msaaBuffer), i.stencil && s.deleteRenderbuffer(i.stencil)), i.blitFramebuffer && this.disposeFramebuffer(i.blitFramebuffer, r)
    }
    disposeAll(t) {
        const r = this.managedFramebuffers;
        this.managedFramebuffers = [];
        for (let i = 0; i < r.length; i++) this.disposeFramebuffer(r[i], t)
    }
    forceStencil() {
        const t = this.current;
        if (!t) return;
        const r = t.glFramebuffers[this.CONTEXT_UID];
        if (!r || r.stencil) return;
        t.stencil = !0;
        const i = t.width,
            s = t.height,
            n = this.gl,
            a = n.createRenderbuffer();
        n.bindRenderbuffer(n.RENDERBUFFER, a), r.msaaBuffer ? n.renderbufferStorageMultisample(n.RENDERBUFFER, r.multisample, n.DEPTH24_STENCIL8, i, s) : n.renderbufferStorage(n.RENDERBUFFER, n.DEPTH_STENCIL, i, s), r.stencil = a, n.framebufferRenderbuffer(n.FRAMEBUFFER, n.DEPTH_STENCIL_ATTACHMENT, n.RENDERBUFFER, a)
    }
    reset() {
        this.current = this.unknownFramebuffer, this.viewport = new _t
    }
    destroy() {
        this.renderer = null
    }
}
qf.extension = {
    type: J.RendererSystem,
    name: "framebuffer"
};
nt.add(qf);
const co = {
    5126: 4,
    5123: 2,
    5121: 1
};
class Zf {
    constructor(t) {
        this.renderer = t, this._activeGeometry = null, this._activeVao = null, this.hasVao = !0, this.hasInstance = !0, this.canUseUInt32ElementIndex = !1, this.managedGeometries = {}
    }
    contextChange() {
        this.disposeAll(!0);
        const t = this.gl = this.renderer.gl,
            r = this.renderer.context;
        if (this.CONTEXT_UID = this.renderer.CONTEXT_UID, r.webGLVersion !== 2) {
            let i = this.renderer.context.extensions.vertexArrayObject;
            K.PREFER_ENV === si.WEBGL_LEGACY && (i = null), i ? (t.createVertexArray = () => i.createVertexArrayOES(), t.bindVertexArray = s => i.bindVertexArrayOES(s), t.deleteVertexArray = s => i.deleteVertexArrayOES(s)) : (this.hasVao = !1, t.createVertexArray = () => null, t.bindVertexArray = () => null, t.deleteVertexArray = () => null)
        }
        if (r.webGLVersion !== 2) {
            const i = t.getExtension("ANGLE_instanced_arrays");
            i ? (t.vertexAttribDivisor = (s, n) => i.vertexAttribDivisorANGLE(s, n), t.drawElementsInstanced = (s, n, a, o, h) => i.drawElementsInstancedANGLE(s, n, a, o, h), t.drawArraysInstanced = (s, n, a, o) => i.drawArraysInstancedANGLE(s, n, a, o)) : this.hasInstance = !1
        }
        this.canUseUInt32ElementIndex = r.webGLVersion === 2 || !!r.extensions.uint32ElementIndex
    }
    bind(t, r) {
        r = r || this.renderer.shader.shader;
        const {
            gl: i
        } = this;
        let s = t.glVertexArrayObjects[this.CONTEXT_UID],
            n = !1;
        s || (this.managedGeometries[t.id] = t, t.disposeRunner.add(this), t.glVertexArrayObjects[this.CONTEXT_UID] = s = {}, n = !0);
        const a = s[r.program.id] || this.initGeometryVao(t, r, n);
        this._activeGeometry = t, this._activeVao !== a && (this._activeVao = a, this.hasVao ? i.bindVertexArray(a) : this.activateVao(t, r.program)), this.updateBuffers()
    }
    reset() {
        this.unbind()
    }
    updateBuffers() {
        const t = this._activeGeometry,
            r = this.renderer.buffer;
        for (let i = 0; i < t.buffers.length; i++) {
            const s = t.buffers[i];
            r.update(s)
        }
    }
    checkCompatibility(t, r) {
        const i = t.attributes,
            s = r.attributeData;
        for (const n in s)
            if (!i[n]) throw new Error(`shader and geometry incompatible, geometry missing the "${n}" attribute`)
    }
    getSignature(t, r) {
        const i = t.attributes,
            s = r.attributeData,
            n = ["g", t.id];
        for (const a in i) s[a] && n.push(a, s[a].location);
        return n.join("-")
    }
    initGeometryVao(t, r, i = !0) {
        const s = this.gl,
            n = this.CONTEXT_UID,
            a = this.renderer.buffer,
            o = r.program;
        o.glPrograms[n] || this.renderer.shader.generateProgram(r), this.checkCompatibility(t, o);
        const h = this.getSignature(t, o),
            l = t.glVertexArrayObjects[this.CONTEXT_UID];
        let c = l[h];
        if (c) return l[o.id] = c, c;
        const f = t.buffers,
            p = t.attributes,
            m = {},
            v = {};
        for (const _ in f) m[_] = 0, v[_] = 0;
        for (const _ in p) !p[_].size && o.attributeData[_] ? p[_].size = o.attributeData[_].size : p[_].size || console.warn(`PIXI Geometry attribute '${_}' size cannot be determined (likely the bound shader does not have the attribute)`), m[p[_].buffer] += p[_].size * co[p[_].type];
        for (const _ in p) {
            const y = p[_],
                A = y.size;
            y.stride === void 0 && (m[y.buffer] === A * co[y.type] ? y.stride = 0 : y.stride = m[y.buffer]), y.start === void 0 && (y.start = v[y.buffer], v[y.buffer] += A * co[y.type])
        }
        c = s.createVertexArray(), s.bindVertexArray(c);
        for (let _ = 0; _ < f.length; _++) {
            const y = f[_];
            a.bind(y), i && y._glBuffers[n].refCount++
        }
        return this.activateVao(t, o), l[o.id] = c, l[h] = c, s.bindVertexArray(null), a.unbind(ir.ARRAY_BUFFER), c
    }
    disposeGeometry(t, r) {
        var o;
        if (!this.managedGeometries[t.id]) return;
        delete this.managedGeometries[t.id];
        const i = t.glVertexArrayObjects[this.CONTEXT_UID],
            s = this.gl,
            n = t.buffers,
            a = (o = this.renderer) == null ? void 0 : o.buffer;
        if (t.disposeRunner.remove(this), !!i) {
            if (a)
                for (let h = 0; h < n.length; h++) {
                    const l = n[h]._glBuffers[this.CONTEXT_UID];
                    l && (l.refCount--, l.refCount === 0 && !r && a.dispose(n[h], r))
                }
            if (!r) {
                for (const h in i)
                    if (h[0] === "g") {
                        const l = i[h];
                        this._activeVao === l && this.unbind(), s.deleteVertexArray(l)
                    }
            }
            delete t.glVertexArrayObjects[this.CONTEXT_UID]
        }
    }
    disposeAll(t) {
        const r = Object.keys(this.managedGeometries);
        for (let i = 0; i < r.length; i++) this.disposeGeometry(this.managedGeometries[r[i]], t)
    }
    activateVao(t, r) {
        const i = this.gl,
            s = this.CONTEXT_UID,
            n = this.renderer.buffer,
            a = t.buffers,
            o = t.attributes;
        t.indexBuffer && n.bind(t.indexBuffer);
        let h = null;
        for (const l in o) {
            const c = o[l],
                f = a[c.buffer],
                p = f._glBuffers[s];
            if (r.attributeData[l]) {
                h !== p && (n.bind(f), h = p);
                const m = r.attributeData[l].location;
                if (i.enableVertexAttribArray(m), i.vertexAttribPointer(m, c.size, c.type || i.FLOAT, c.normalized, c.stride, c.start), c.instance)
                    if (this.hasInstance) i.vertexAttribDivisor(m, c.divisor);
                    else throw new Error("geometry error, GPU Instancing is not supported on this device")
            }
        }
    }
    draw(t, r, i, s) {
        const {
            gl: n
        } = this, a = this._activeGeometry;
        if (a.indexBuffer) {
            const o = a.indexBuffer.data.BYTES_PER_ELEMENT,
                h = o === 2 ? n.UNSIGNED_SHORT : n.UNSIGNED_INT;
            o === 2 || o === 4 && this.canUseUInt32ElementIndex ? a.instanced ? n.drawElementsInstanced(t, r || a.indexBuffer.data.length, h, (i || 0) * o, s || 1) : n.drawElements(t, r || a.indexBuffer.data.length, h, (i || 0) * o) : console.warn("unsupported index buffer type: uint32")
        } else a.instanced ? n.drawArraysInstanced(t, i, r || a.getSize(), s || 1) : n.drawArrays(t, i, r || a.getSize());
        return this
    }
    unbind() {
        this.gl.bindVertexArray(null), this._activeVao = null, this._activeGeometry = null
    }
    destroy() {
        this.renderer = null
    }
}
Zf.extension = {
    type: J.RendererSystem,
    name: "geometry"
};
nt.add(Zf);
const ru = new Gt;
class Kf {
    constructor(t, r) {
        this._texture = t, this.mapCoord = new Gt, this.uClampFrame = new Float32Array(4), this.uClampOffset = new Float32Array(2), this._textureID = -1, this._updateID = 0, this.clampOffset = 0, this.clampMargin = typeof r > "u" ? .5 : r, this.isSimple = !1
    }
    get texture() {
        return this._texture
    }
    set texture(t) {
        this._texture = t, this._textureID = -1
    }
    multiplyUvs(t, r) {
        r === void 0 && (r = t);
        const i = this.mapCoord;
        for (let s = 0; s < t.length; s += 2) {
            const n = t[s],
                a = t[s + 1];
            r[s] = n * i.a + a * i.c + i.tx, r[s + 1] = n * i.b + a * i.d + i.ty
        }
        return r
    }
    update(t) {
        const r = this._texture;
        if (!r || !r.valid || !t && this._textureID === r._updateID) return !1;
        this._textureID = r._updateID, this._updateID++;
        const i = r._uvs;
        this.mapCoord.set(i.x1 - i.x0, i.y1 - i.y0, i.x3 - i.x0, i.y3 - i.y0, i.x0, i.y0);
        const s = r.orig,
            n = r.trim;
        n && (ru.set(s.width / n.width, 0, 0, s.height / n.height, -n.x / n.width, -n.y / n.height), this.mapCoord.append(ru));
        const a = r.baseTexture,
            o = this.uClampFrame,
            h = this.clampMargin / a.resolution,
            l = this.clampOffset;
        return o[0] = (r._frame.x + h + l) / a.width, o[1] = (r._frame.y + h + l) / a.height, o[2] = (r._frame.x + r._frame.width - h + l) / a.width, o[3] = (r._frame.y + r._frame.height - h + l) / a.height, this.uClampOffset[0] = l / a.realWidth, this.uClampOffset[1] = l / a.realHeight, this.isSimple = r._frame.width === a.width && r._frame.height === a.height && r.rotate === 0, !0
    }
}
var jx = `varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D mask;
uniform float alpha;
uniform float npmAlpha;
uniform vec4 maskClamp;

void main(void)
{
    float clip = step(3.5,
        step(maskClamp.x, vMaskCoord.x) +
        step(maskClamp.y, vMaskCoord.y) +
        step(vMaskCoord.x, maskClamp.z) +
        step(vMaskCoord.y, maskClamp.w));

    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, vMaskCoord);
    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);

    original *= (alphaMul * masky.r * alpha * clip);

    gl_FragColor = original;
}
`,
    Wx = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec2 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;
}
`;
class Yx extends se {
    constructor(t, r, i) {
        let s = null;
        typeof t != "string" && r === void 0 && i === void 0 && (s = t, t = void 0, r = void 0, i = void 0), super(t || Wx, r || jx, i), this.maskSprite = s, this.maskMatrix = new Gt
    }
    get maskSprite() {
        return this._maskSprite
    }
    set maskSprite(t) {
        this._maskSprite = t, this._maskSprite && (this._maskSprite.renderable = !1)
    }
    apply(t, r, i, s) {
        const n = this._maskSprite,
            a = n._texture;
        a.valid && (a.uvMatrix || (a.uvMatrix = new Kf(a, 0)), a.uvMatrix.update(), this.uniforms.npmAlpha = a.baseTexture.alphaMode ? 0 : 1, this.uniforms.mask = a, this.uniforms.otherMatrix = t.calculateSpriteMatrix(this.maskMatrix, n).prepend(a.uvMatrix.mapCoord), this.uniforms.alpha = n.worldAlpha, this.uniforms.maskClamp = a.uvMatrix.uClampFrame, t.applyFilter(this, r, i, s))
    }
}
class qx {
    constructor(t = null) {
        this.type = te.NONE, this.autoDetect = !0, this.maskObject = t || null, this.pooled = !1, this.isMaskData = !0, this.resolution = null, this.multisample = se.defaultMultisample, this.enabled = !0, this.colorMask = 15, this._filters = null, this._stencilCounter = 0, this._scissorCounter = 0, this._scissorRect = null, this._scissorRectLocal = null, this._colorMask = 15, this._target = null
    }
    get filter() {
        return this._filters ? this._filters[0] : null
    }
    set filter(t) {
        t ? this._filters ? this._filters[0] = t : this._filters = [t] : this._filters = null
    }
    reset() {
        this.pooled && (this.maskObject = null, this.type = te.NONE, this.autoDetect = !0), this._target = null, this._scissorRectLocal = null
    }
    copyCountersOrReset(t) {
        t ? (this._stencilCounter = t._stencilCounter, this._scissorCounter = t._scissorCounter, this._scissorRect = t._scissorRect) : (this._stencilCounter = 0, this._scissorCounter = 0, this._scissorRect = null)
    }
}
class Jf {
    constructor(t) {
        this.renderer = t, this.enableScissor = !0, this.alphaMaskPool = [], this.maskDataPool = [], this.maskStack = [], this.alphaMaskIndex = 0
    }
    setMaskStack(t) {
        this.maskStack = t, this.renderer.scissor.setMaskStack(t), this.renderer.stencil.setMaskStack(t)
    }
    push(t, r) {
        let i = r;
        if (!i.isMaskData) {
            const n = this.maskDataPool.pop() || new qx;
            n.pooled = !0, n.maskObject = r, i = n
        }
        const s = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null;
        if (i.copyCountersOrReset(s), i._colorMask = s ? s._colorMask : 15, i.autoDetect && this.detect(i), i._target = t, i.type !== te.SPRITE && this.maskStack.push(i), i.enabled) switch (i.type) {
            case te.SCISSOR:
                this.renderer.scissor.push(i);
                break;
            case te.STENCIL:
                this.renderer.stencil.push(i);
                break;
            case te.SPRITE:
                i.copyCountersOrReset(null), this.pushSpriteMask(i);
                break;
            case te.COLOR:
                this.pushColorMask(i);
                break
        }
        i.type === te.SPRITE && this.maskStack.push(i)
    }
    pop(t) {
        const r = this.maskStack.pop();
        if (!(!r || r._target !== t)) {
            if (r.enabled) switch (r.type) {
                case te.SCISSOR:
                    this.renderer.scissor.pop(r);
                    break;
                case te.STENCIL:
                    this.renderer.stencil.pop(r.maskObject);
                    break;
                case te.SPRITE:
                    this.popSpriteMask(r);
                    break;
                case te.COLOR:
                    this.popColorMask(r);
                    break
            }
            if (r.reset(), r.pooled && this.maskDataPool.push(r), this.maskStack.length !== 0) {
                const i = this.maskStack[this.maskStack.length - 1];
                i.type === te.SPRITE && i._filters && (i._filters[0].maskSprite = i.maskObject)
            }
        }
    }
    detect(t) {
        const r = t.maskObject;
        r ? r.isSprite ? t.type = te.SPRITE : this.enableScissor && this.renderer.scissor.testScissor(t) ? t.type = te.SCISSOR : t.type = te.STENCIL : t.type = te.COLOR
    }
    pushSpriteMask(t) {
        const {
            maskObject: r
        } = t, i = t._target;
        let s = t._filters;
        s || (s = this.alphaMaskPool[this.alphaMaskIndex], s || (s = this.alphaMaskPool[this.alphaMaskIndex] = [new Yx]));
        const n = this.renderer,
            a = n.renderTexture;
        let o, h;
        if (a.current) {
            const c = a.current;
            o = t.resolution || c.resolution, h = t.multisample??c.multisample
        } else o = t.resolution || n.resolution, h = t.multisample??n.multisample;
        s[0].resolution = o, s[0].multisample = h, s[0].maskSprite = r;
        const l = i.filterArea;
        i.filterArea = r.getBounds(!0), n.filter.push(i, s), i.filterArea = l, t._filters || this.alphaMaskIndex++
    }
    popSpriteMask(t) {
        this.renderer.filter.pop(), t._filters ? t._filters[0].maskSprite = null : (this.alphaMaskIndex--, this.alphaMaskPool[this.alphaMaskIndex][0].maskSprite = null)
    }
    pushColorMask(t) {
        const r = t._colorMask,
            i = t._colorMask = r & t.colorMask;
        i !== r && this.renderer.gl.colorMask((i & 1) !== 0, (i & 2) !== 0, (i & 4) !== 0, (i & 8) !== 0)
    }
    popColorMask(t) {
        const r = t._colorMask,
            i = this.maskStack.length > 0 ? this.maskStack[this.maskStack.length - 1]._colorMask : 15;
        i !== r && this.renderer.gl.colorMask((i & 1) !== 0, (i & 2) !== 0, (i & 4) !== 0, (i & 8) !== 0)
    }
    destroy() {
        this.renderer = null
    }
}
Jf.extension = {
    type: J.RendererSystem,
    name: "mask"
};
nt.add(Jf);
class Qf {
    constructor(t) {
        this.renderer = t, this.maskStack = [], this.glConst = 0
    }
    getStackLength() {
        return this.maskStack.length
    }
    setMaskStack(t) {
        const {
            gl: r
        } = this.renderer, i = this.getStackLength();
        this.maskStack = t;
        const s = this.getStackLength();
        s !== i && (s === 0 ? r.disable(this.glConst) : (r.enable(this.glConst), this._useCurrent()))
    }
    _useCurrent() {}
    destroy() {
        this.renderer = null, this.maskStack = null
    }
}
const iu = new Gt,
    su = [],
    En = class extends Qf {
        constructor(e) {
            super(e), this.glConst = K.ADAPTER.getWebGLRenderingContext().SCISSOR_TEST
        }
        getStackLength() {
            const e = this.maskStack[this.maskStack.length - 1];
            return e ? e._scissorCounter : 0
        }
        calcScissorRect(e) {
            if (e._scissorRectLocal) return;
            const t = e._scissorRect,
                {
                    maskObject: r
                } = e,
                {
                    renderer: i
                } = this,
                s = i.renderTexture,
                n = r.getBounds(!0, su.pop()??new _t);
            this.roundFrameToPixels(n, s.current ? s.current.resolution : i.resolution, s.sourceFrame, s.destinationFrame, i.projection.transform), t && n.fit(t), e._scissorRectLocal = n
        }
        static isMatrixRotated(e) {
            if (!e) return !1;
            const {
                a: t,
                b: r,
                c: i,
                d: s
            } = e;
            return (Math.abs(r) > 1e-4 || Math.abs(i) > 1e-4) && (Math.abs(t) > 1e-4 || Math.abs(s) > 1e-4)
        }
        testScissor(e) {
            const {
                maskObject: t
            } = e;
            if (!t.isFastRect || !t.isFastRect() || En.isMatrixRotated(t.worldTransform) || En.isMatrixRotated(this.renderer.projection.transform)) return !1;
            this.calcScissorRect(e);
            const r = e._scissorRectLocal;
            return r.width > 0 && r.height > 0
        }
        roundFrameToPixels(e, t, r, i, s) {
            En.isMatrixRotated(s) || (s = s ? iu.copyFrom(s) : iu.identity(), s.translate(-r.x, -r.y).scale(i.width / r.width, i.height / r.height).translate(i.x, i.y), this.renderer.filter.transformAABB(s, e), e.fit(i), e.x = Math.round(e.x * t), e.y = Math.round(e.y * t), e.width = Math.round(e.width * t), e.height = Math.round(e.height * t))
        }
        push(e) {
            e._scissorRectLocal || this.calcScissorRect(e);
            const {
                gl: t
            } = this.renderer;
            e._scissorRect || t.enable(t.SCISSOR_TEST), e._scissorCounter++, e._scissorRect = e._scissorRectLocal, this._useCurrent()
        }
        pop(e) {
            const {
                gl: t
            } = this.renderer;
            e && su.push(e._scissorRectLocal), this.getStackLength() > 0 ? this._useCurrent() : t.disable(t.SCISSOR_TEST)
        }
        _useCurrent() {
            const e = this.maskStack[this.maskStack.length - 1]._scissorRect;
            let t;
            this.renderer.renderTexture.current ? t = e.y : t = this.renderer.height - e.height - e.y, this.renderer.gl.scissor(e.x, t, e.width, e.height)
        }
    };
let td = En;
td.extension = {
    type: J.RendererSystem,
    name: "scissor"
};
nt.add(td);
class ed extends Qf {
    constructor(t) {
        super(t), this.glConst = K.ADAPTER.getWebGLRenderingContext().STENCIL_TEST
    }
    getStackLength() {
        const t = this.maskStack[this.maskStack.length - 1];
        return t ? t._stencilCounter : 0
    }
    push(t) {
        const r = t.maskObject,
            {
                gl: i
            } = this.renderer,
            s = t._stencilCounter;
        s === 0 && (this.renderer.framebuffer.forceStencil(), i.clearStencil(0), i.clear(i.STENCIL_BUFFER_BIT), i.enable(i.STENCIL_TEST)), t._stencilCounter++;
        const n = t._colorMask;
        n !== 0 && (t._colorMask = 0, i.colorMask(!1, !1, !1, !1)), i.stencilFunc(i.EQUAL, s, 4294967295), i.stencilOp(i.KEEP, i.KEEP, i.INCR), r.renderable = !0, r.render(this.renderer), this.renderer.batch.flush(), r.renderable = !1, n !== 0 && (t._colorMask = n, i.colorMask((n & 1) !== 0, (n & 2) !== 0, (n & 4) !== 0, (n & 8) !== 0)), this._useCurrent()
    }
    pop(t) {
        const r = this.renderer.gl;
        if (this.getStackLength() === 0) r.disable(r.STENCIL_TEST);
        else {
            const i = this.maskStack.length !== 0 ? this.maskStack[this.maskStack.length - 1] : null,
                s = i ? i._colorMask : 15;
            s !== 0 && (i._colorMask = 0, r.colorMask(!1, !1, !1, !1)), r.stencilOp(r.KEEP, r.KEEP, r.DECR), t.renderable = !0, t.render(this.renderer), this.renderer.batch.flush(), t.renderable = !1, s !== 0 && (i._colorMask = s, r.colorMask((s & 1) !== 0, (s & 2) !== 0, (s & 4) !== 0, (s & 8) !== 0)), this._useCurrent()
        }
    }
    _useCurrent() {
        const t = this.renderer.gl;
        t.stencilFunc(t.EQUAL, this.getStackLength(), 4294967295), t.stencilOp(t.KEEP, t.KEEP, t.KEEP)
    }
}
ed.extension = {
    type: J.RendererSystem,
    name: "stencil"
};
nt.add(ed);
class rd {
    constructor(t) {
        this.renderer = t, this.plugins = {}, Object.defineProperties(this.plugins, {
            extract: {
                enumerable: !1,
                get() {
                    return Et("7.0.0", "renderer.plugins.extract has moved to renderer.extract"), t.extract
                }
            },
            prepare: {
                enumerable: !1,
                get() {
                    return Et("7.0.0", "renderer.plugins.prepare has moved to renderer.prepare"), t.prepare
                }
            },
            interaction: {
                enumerable: !1,
                get() {
                    return Et("7.0.0", "renderer.plugins.interaction has been deprecated, use renderer.events"), t.events
                }
            }
        })
    }
    init() {
        const t = this.rendererPlugins;
        for (const r in t) this.plugins[r] = new t[r](this.renderer)
    }
    destroy() {
        for (const t in this.plugins) this.plugins[t].destroy(), this.plugins[t] = null
    }
}
rd.extension = {
    type: [J.RendererSystem, J.CanvasRendererSystem],
    name: "_plugin"
};
nt.add(rd);
class id {
    constructor(t) {
        this.renderer = t, this.destinationFrame = null, this.sourceFrame = null, this.defaultFrame = null, this.projectionMatrix = new Gt, this.transform = null
    }
    update(t, r, i, s) {
        this.destinationFrame = t || this.destinationFrame || this.defaultFrame, this.sourceFrame = r || this.sourceFrame || t, this.calculateProjection(this.destinationFrame, this.sourceFrame, i, s), this.transform && this.projectionMatrix.append(this.transform);
        const n = this.renderer;
        n.globalUniforms.uniforms.projectionMatrix = this.projectionMatrix, n.globalUniforms.update(), n.shader.shader && n.shader.syncUniformGroup(n.shader.shader.uniforms.globals)
    }
    calculateProjection(t, r, i, s) {
        const n = this.projectionMatrix,
            a = s ? -1 : 1;
        n.identity(), n.a = 1 / r.width * 2, n.d = a * (1 / r.height * 2), n.tx = -1 - r.x * n.a, n.ty = -a - r.y * n.d
    }
    setTransform(t) {}
    destroy() {
        this.renderer = null
    }
}
id.extension = {
    type: J.RendererSystem,
    name: "projection"
};
nt.add(id);
const Zx = new Th;
class sd {
    constructor(t) {
        this.renderer = t, this._tempMatrix = new Gt
    }
    generateTexture(t, r) {
        const {
            region: i,
            ...s
        } = r || {}, n = i || t.getLocalBounds(null, !0);
        n.width === 0 && (n.width = 1), n.height === 0 && (n.height = 1);
        const a = ni.create({
            width: n.width,
            height: n.height,
            ...s
        });
        this._tempMatrix.tx = -n.x, this._tempMatrix.ty = -n.y;
        const o = t.transform;
        return t.transform = Zx, this.renderer.render(t, {
            renderTexture: a,
            transform: this._tempMatrix,
            skipUpdateTransform: !!t.parent,
            blit: !0
        }), t.transform = o, a
    }
    destroy() {}
}
sd.extension = {
    type: [J.RendererSystem, J.CanvasRendererSystem],
    name: "textureGenerator"
};
nt.add(sd);
const $r = new _t,
    rs = new _t;
class nd {
    constructor(t) {
        this.renderer = t, this.defaultMaskStack = [], this.current = null, this.sourceFrame = new _t, this.destinationFrame = new _t, this.viewportFrame = new _t
    }
    contextChange() {
        var r;
        const t = (r = this.renderer) == null ? void 0 : r.gl.getContextAttributes();
        this._rendererPremultipliedAlpha = !!(t && t.alpha && t.premultipliedAlpha)
    }
    bind(t = null, r, i) {
        const s = this.renderer;
        this.current = t;
        let n, a, o;
        t ? (n = t.baseTexture, o = n.resolution, r || ($r.width = t.frame.width, $r.height = t.frame.height, r = $r), i || (rs.x = t.frame.x, rs.y = t.frame.y, rs.width = r.width, rs.height = r.height, i = rs), a = n.framebuffer) : (o = s.resolution, r || ($r.width = s._view.screen.width, $r.height = s._view.screen.height, r = $r), i || (i = $r, i.width = r.width, i.height = r.height));
        const h = this.viewportFrame;
        h.x = i.x * o, h.y = i.y * o, h.width = i.width * o, h.height = i.height * o, t || (h.y = s.view.height - (h.y + h.height)), h.ceil(), this.renderer.framebuffer.bind(a, h), this.renderer.projection.update(i, r, o, !a), t ? this.renderer.mask.setMaskStack(n.maskStack) : this.renderer.mask.setMaskStack(this.defaultMaskStack), this.sourceFrame.copyFrom(r), this.destinationFrame.copyFrom(i)
    }
    clear(t, r) {
        const i = this.current ? this.current.baseTexture.clear : this.renderer.background.backgroundColor,
            s = Ot.shared.setValue(t || i);
        (this.current && this.current.baseTexture.alphaMode > 0 || !this.current && this._rendererPremultipliedAlpha) && s.premultiply(s.alpha);
        const n = this.destinationFrame,
            a = this.current ? this.current.baseTexture : this.renderer._view.screen,
            o = n.width !== a.width || n.height !== a.height;
        if (o) {
            let {
                x: h,
                y: l,
                width: c,
                height: f
            } = this.viewportFrame;
            h = Math.round(h), l = Math.round(l), c = Math.round(c), f = Math.round(f), this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST), this.renderer.gl.scissor(h, l, c, f)
        }
        this.renderer.framebuffer.clear(s.red, s.green, s.blue, s.alpha, r), o && this.renderer.scissor.pop()
    }
    resize() {
        this.bind(null)
    }
    reset() {
        this.bind(null)
    }
    destroy() {
        this.renderer = null
    }
}
nd.extension = {
    type: J.RendererSystem,
    name: "renderTexture"
};
nt.add(nd);
class Kx {
    constructor(t, r) {
        this.program = t, this.uniformData = r, this.uniformGroups = {}, this.uniformDirtyGroups = {}, this.uniformBufferBindings = {}
    }
    destroy() {
        this.uniformData = null, this.uniformGroups = null, this.uniformDirtyGroups = null, this.uniformBufferBindings = null, this.program = null
    }
}

function Jx(e, t) {
    const r = {},
        i = t.getProgramParameter(e, t.ACTIVE_ATTRIBUTES);
    for (let s = 0; s < i; s++) {
        const n = t.getActiveAttrib(e, s);
        if (n.name.startsWith("gl_")) continue;
        const a = $f(t, n.type),
            o = {
                type: a,
                name: n.name,
                size: Gf(a),
                location: t.getAttribLocation(e, n.name)
            };
        r[n.name] = o
    }
    return r
}

function Qx(e, t) {
    const r = {},
        i = t.getProgramParameter(e, t.ACTIVE_UNIFORMS);
    for (let s = 0; s < i; s++) {
        const n = t.getActiveUniform(e, s),
            a = n.name.replace(/\[.*?\]$/, ""),
            o = !!n.name.match(/\[.*?\]$/),
            h = $f(t, n.type);
        r[a] = {
            name: a,
            index: s,
            type: h,
            size: n.size,
            isArray: o,
            value: Lf(h, n.size)
        }
    }
    return r
}

function tb(e, t) {
    var h;
    const r = Zc(e, e.VERTEX_SHADER, t.vertexSrc),
        i = Zc(e, e.FRAGMENT_SHADER, t.fragmentSrc),
        s = e.createProgram();
    e.attachShader(s, r), e.attachShader(s, i);
    const n = (h = t.extra) == null ? void 0 : h.transformFeedbackVaryings;
    if (n && (typeof e.transformFeedbackVaryings != "function" ? console.warn("TransformFeedback is not supported but TransformFeedbackVaryings are given.") : e.transformFeedbackVaryings(s, n.names, n.bufferMode === "separate" ? e.SEPARATE_ATTRIBS : e.INTERLEAVED_ATTRIBS)), e.linkProgram(s), e.getProgramParameter(s, e.LINK_STATUS) || Rx(e, s, r, i), t.attributeData = Jx(s, e), t.uniformData = Qx(s, e), !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(t.vertexSrc)) {
        const l = Object.keys(t.attributeData);
        l.sort((c, f) => c > f ? 1 : -1);
        for (let c = 0; c < l.length; c++) t.attributeData[l[c]].location = c, e.bindAttribLocation(s, c, l[c]);
        e.linkProgram(s)
    }
    e.deleteShader(r), e.deleteShader(i);
    const a = {};
    for (const l in t.uniformData) {
        const c = t.uniformData[l];
        a[l] = {
            location: e.getUniformLocation(s, l),
            value: Lf(c.type, c.size)
        }
    }
    return new Kx(s, a)
}

function eb(e, t, r, i, s) {
    r.buffer.update(s)
}
const rb = {
        float: `
        data[offset] = v;
    `,
        vec2: `
        data[offset] = v[0];
        data[offset+1] = v[1];
    `,
        vec3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

    `,
        vec4: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];
        data[offset+3] = v[3];
    `,
        mat2: `
        data[offset] = v[0];
        data[offset+1] = v[1];

        data[offset+4] = v[2];
        data[offset+5] = v[3];
    `,
        mat3: `
        data[offset] = v[0];
        data[offset+1] = v[1];
        data[offset+2] = v[2];

        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];

        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];
    `,
        mat4: `
        for(var i = 0; i < 16; i++)
        {
            data[offset + i] = v[i];
        }
    `
    },
    ad = {
        float: 4,
        vec2: 8,
        vec3: 12,
        vec4: 16,
        int: 4,
        ivec2: 8,
        ivec3: 12,
        ivec4: 16,
        uint: 4,
        uvec2: 8,
        uvec3: 12,
        uvec4: 16,
        bool: 4,
        bvec2: 8,
        bvec3: 12,
        bvec4: 16,
        mat2: 16 * 2,
        mat3: 16 * 3,
        mat4: 16 * 4
    };

function ib(e) {
    const t = e.map(n => ({
        data: n,
        offset: 0,
        dataLen: 0,
        dirty: 0
    }));
    let r = 0,
        i = 0,
        s = 0;
    for (let n = 0; n < t.length; n++) {
        const a = t[n];
        if (r = ad[a.data.type], a.data.size > 1 && (r = Math.max(r, 16) * a.data.size), a.dataLen = r, i % r !== 0 && i < 16) {
            const o = i % r % 16;
            i += o, s += o
        }
        i + r > 16 ? (s = Math.ceil(s / 16) * 16, a.offset = s, s += r, i = r) : (a.offset = s, i += r, s += r)
    }
    return s = Math.ceil(s / 16) * 16, {
        uboElements: t,
        size: s
    }
}

function sb(e, t) {
    const r = [];
    for (const i in e) t[i] && r.push(t[i]);
    return r.sort((i, s) => i.index - s.index), r
}

function nb(e, t) {
    if (!e.autoManage) return {
        size: 0,
        syncFunc: eb
    };
    const r = sb(e.uniforms, t),
        {
            uboElements: i,
            size: s
        } = ib(r),
        n = [`
    var v = null;
    var v2 = null;
    var cv = null;
    var t = 0;
    var gl = renderer.gl
    var index = 0;
    var data = buffer.data;
    `];
    for (let a = 0; a < i.length; a++) {
        const o = i[a],
            h = e.uniforms[o.data.name],
            l = o.data.name;
        let c = !1;
        for (let f = 0; f < ki.length; f++) {
            const p = ki[f];
            if (p.codeUbo && p.test(o.data, h)) {
                n.push(`offset = ${o.offset/4};`, ki[f].codeUbo(o.data.name, h)), c = !0;
                break
            }
        }
        if (!c)
            if (o.data.size > 1) {
                const f = Gf(o.data.type),
                    p = Math.max(ad[o.data.type] / 16, 1),
                    m = f / p,
                    v = (4 - m % 4) % 4;
                n.push(`
                cv = ud.${l}.value;
                v = uv.${l};
                offset = ${o.offset/4};

                t = 0;

                for(var i=0; i < ${o.data.size*p}; i++)
                {
                    for(var j = 0; j < ${m}; j++)
                    {
                        data[offset++] = v[t++];
                    }
                    offset += ${v};
                }

                `)
            } else {
                const f = rb[o.data.type];
                n.push(`
                cv = ud.${l}.value;
                v = uv.${l};
                offset = ${o.offset/4};
                ${f};
                `)
            }
    }
    return n.push(`
       renderer.buffer.update(buffer);
    `), {
        size: s,
        syncFunc: new Function("ud", "uv", "renderer", "syncData", "buffer", n.join(`
`))
    }
}
let ab = 0;
const hn = {
    textureCount: 0,
    uboCount: 0
};
class od {
    constructor(t) {
        this.destroyed = !1, this.renderer = t, this.systemCheck(), this.gl = null, this.shader = null, this.program = null, this.cache = {}, this._uboCache = {}, this.id = ab++
    }
    systemCheck() {
        if (!Px()) throw new Error("Current environment does not allow unsafe-eval, please use @pixi/unsafe-eval module to enable support.")
    }
    contextChange(t) {
        this.gl = t, this.reset()
    }
    bind(t, r) {
        t.disposeRunner.add(this), t.uniforms.globals = this.renderer.globalUniforms;
        const i = t.program,
            s = i.glPrograms[this.renderer.CONTEXT_UID] || this.generateProgram(t);
        return this.shader = t, this.program !== i && (this.program = i, this.gl.useProgram(s.program)), r || (hn.textureCount = 0, hn.uboCount = 0, this.syncUniformGroup(t.uniformGroup, hn)), s
    }
    setUniforms(t) {
        const r = this.shader.program,
            i = r.glPrograms[this.renderer.CONTEXT_UID];
        r.syncUniforms(i.uniformData, t, this.renderer)
    }
    syncUniformGroup(t, r) {
        const i = this.getGlProgram();
        (!t.static || t.dirtyId !== i.uniformDirtyGroups[t.id]) && (i.uniformDirtyGroups[t.id] = t.dirtyId, this.syncUniforms(t, i, r))
    }
    syncUniforms(t, r, i) {
        (t.syncUniforms[this.shader.program.id] || this.createSyncGroups(t))(r.uniformData, t.uniforms, this.renderer, i)
    }
    createSyncGroups(t) {
        const r = this.getSignature(t, this.shader.program.uniformData, "u");
        return this.cache[r] || (this.cache[r] = Cx(t, this.shader.program.uniformData)), t.syncUniforms[this.shader.program.id] = this.cache[r], t.syncUniforms[this.shader.program.id]
    }
    syncUniformBufferGroup(t, r) {
        const i = this.getGlProgram();
        if (!t.static || t.dirtyId !== 0 || !i.uniformGroups[t.id]) {
            t.dirtyId = 0;
            const s = i.uniformGroups[t.id] || this.createSyncBufferGroup(t, i, r);
            t.buffer.update(), s(i.uniformData, t.uniforms, this.renderer, hn, t.buffer)
        }
        this.renderer.buffer.bindBufferBase(t.buffer, i.uniformBufferBindings[r])
    }
    createSyncBufferGroup(t, r, i) {
        const {
            gl: s
        } = this.renderer;
        this.renderer.buffer.bind(t.buffer);
        const n = this.gl.getUniformBlockIndex(r.program, i);
        r.uniformBufferBindings[i] = this.shader.uniformBindCount, s.uniformBlockBinding(r.program, n, this.shader.uniformBindCount), this.shader.uniformBindCount++;
        const a = this.getSignature(t, this.shader.program.uniformData, "ubo");
        let o = this._uboCache[a];
        if (o || (o = this._uboCache[a] = nb(t, this.shader.program.uniformData)), t.autoManage) {
            const h = new Float32Array(o.size / 4);
            t.buffer.update(h)
        }
        return r.uniformGroups[t.id] = o.syncFunc, r.uniformGroups[t.id]
    }
    getSignature(t, r, i) {
        const s = t.uniforms,
            n = [`${i}-`];
        for (const a in s) n.push(a), r[a] && n.push(r[a].type);
        return n.join("-")
    }
    getGlProgram() {
        return this.shader ? this.shader.program.glPrograms[this.renderer.CONTEXT_UID] : null
    }
    generateProgram(t) {
        const r = this.gl,
            i = t.program,
            s = tb(r, i);
        return i.glPrograms[this.renderer.CONTEXT_UID] = s, s
    }
    reset() {
        this.program = null, this.shader = null
    }
    disposeShader(t) {
        this.shader === t && (this.shader = null)
    }
    destroy() {
        this.renderer = null, this.destroyed = !0
    }
}
od.extension = {
    type: J.RendererSystem,
    name: "shader"
};
nt.add(od);
class ca {
    constructor(t) {
        this.renderer = t
    }
    run(t) {
        const {
            renderer: r
        } = this;
        r.runners.init.emit(r.options), t.hello && console.log(`PixiJS 7.2.4 - ${r.rendererLogId} - https://pixijs.com`), r.resize(r.screen.width, r.screen.height)
    }
    destroy() {}
}
ca.defaultOptions = {
    hello: !1
};
ca.extension = {
    type: [J.RendererSystem, J.CanvasRendererSystem],
    name: "startup"
};
nt.add(ca);

function ob(e, t = []) {
    return t[lt.NORMAL] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.ADD] = [e.ONE, e.ONE], t[lt.MULTIPLY] = [e.DST_COLOR, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.SCREEN] = [e.ONE, e.ONE_MINUS_SRC_COLOR, e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.OVERLAY] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.DARKEN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.LIGHTEN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.COLOR_DODGE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.COLOR_BURN] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.HARD_LIGHT] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.SOFT_LIGHT] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.DIFFERENCE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.EXCLUSION] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.HUE] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.SATURATION] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.COLOR] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.LUMINOSITY] = [e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.NONE] = [0, 0], t[lt.NORMAL_NPM] = [e.SRC_ALPHA, e.ONE_MINUS_SRC_ALPHA, e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.ADD_NPM] = [e.SRC_ALPHA, e.ONE, e.ONE, e.ONE], t[lt.SCREEN_NPM] = [e.SRC_ALPHA, e.ONE_MINUS_SRC_COLOR, e.ONE, e.ONE_MINUS_SRC_ALPHA], t[lt.SRC_IN] = [e.DST_ALPHA, e.ZERO], t[lt.SRC_OUT] = [e.ONE_MINUS_DST_ALPHA, e.ZERO], t[lt.SRC_ATOP] = [e.DST_ALPHA, e.ONE_MINUS_SRC_ALPHA], t[lt.DST_OVER] = [e.ONE_MINUS_DST_ALPHA, e.ONE], t[lt.DST_IN] = [e.ZERO, e.SRC_ALPHA], t[lt.DST_OUT] = [e.ZERO, e.ONE_MINUS_SRC_ALPHA], t[lt.DST_ATOP] = [e.ONE_MINUS_DST_ALPHA, e.SRC_ALPHA], t[lt.XOR] = [e.ONE_MINUS_DST_ALPHA, e.ONE_MINUS_SRC_ALPHA], t[lt.SUBTRACT] = [e.ONE, e.ONE, e.ONE, e.ONE, e.FUNC_REVERSE_SUBTRACT, e.FUNC_ADD], t
}
const hb = 0,
    lb = 1,
    cb = 2,
    ub = 3,
    fb = 4,
    db = 5,
    Wo = class {
        constructor() {
            this.gl = null, this.stateId = 0, this.polygonOffset = 0, this.blendMode = lt.NONE, this._blendEq = !1, this.map = [], this.map[hb] = this.setBlend, this.map[lb] = this.setOffset, this.map[cb] = this.setCullFace, this.map[ub] = this.setDepthTest, this.map[fb] = this.setFrontFace, this.map[db] = this.setDepthMask, this.checks = [], this.defaultState = new br, this.defaultState.blend = !0
        }
        contextChange(e) {
            this.gl = e, this.blendModes = ob(e), this.set(this.defaultState), this.reset()
        }
        set(e) {
            if (e = e || this.defaultState, this.stateId !== e.data) {
                let t = this.stateId ^ e.data,
                    r = 0;
                for (; t;) t & 1 && this.map[r].call(this, !!(e.data & 1 << r)), t = t >> 1, r++;
                this.stateId = e.data
            }
            for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e)
        }
        forceState(e) {
            e = e || this.defaultState;
            for (let t = 0; t < this.map.length; t++) this.map[t].call(this, !!(e.data & 1 << t));
            for (let t = 0; t < this.checks.length; t++) this.checks[t](this, e);
            this.stateId = e.data
        }
        setBlend(e) {
            this.updateCheck(Wo.checkBlendMode, e), this.gl[e ? "enable" : "disable"](this.gl.BLEND)
        }
        setOffset(e) {
            this.updateCheck(Wo.checkPolygonOffset, e), this.gl[e ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL)
        }
        setDepthTest(e) {
            this.gl[e ? "enable" : "disable"](this.gl.DEPTH_TEST)
        }
        setDepthMask(e) {
            this.gl.depthMask(e)
        }
        setCullFace(e) {
            this.gl[e ? "enable" : "disable"](this.gl.CULL_FACE)
        }
        setFrontFace(e) {
            this.gl.frontFace(this.gl[e ? "CW" : "CCW"])
        }
        setBlendMode(e) {
            if (e === this.blendMode) return;
            this.blendMode = e;
            const t = this.blendModes[e],
                r = this.gl;
            t.length === 2 ? r.blendFunc(t[0], t[1]) : r.blendFuncSeparate(t[0], t[1], t[2], t[3]), t.length === 6 ? (this._blendEq = !0, r.blendEquationSeparate(t[4], t[5])) : this._blendEq && (this._blendEq = !1, r.blendEquationSeparate(r.FUNC_ADD, r.FUNC_ADD))
        }
        setPolygonOffset(e, t) {
            this.gl.polygonOffset(e, t)
        }
        reset() {
            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, !1), this.forceState(this.defaultState), this._blendEq = !0, this.blendMode = -1, this.setBlendMode(0)
        }
        updateCheck(e, t) {
            const r = this.checks.indexOf(e);
            t && r === -1 ? this.checks.push(e) : !t && r !== -1 && this.checks.splice(r, 1)
        }
        static checkBlendMode(e, t) {
            e.setBlendMode(t.blendMode)
        }
        static checkPolygonOffset(e, t) {
            e.setPolygonOffset(1, t.polygonOffset)
        }
        destroy() {
            this.gl = null
        }
    };
let hd = Wo;
hd.extension = {
    type: J.RendererSystem,
    name: "state"
};
nt.add(hd);
class pb extends Hi {
    constructor() {
        super(...arguments), this.runners = {}, this._systemsHash = {}
    }
    setup(t) {
        this.addRunners(...t.runners);
        const r = (t.priority??[]).filter(s => t.systems[s]),
            i = [...r, ...Object.keys(t.systems).filter(s => !r.includes(s))];
        for (const s of i) this.addSystem(t.systems[s], s)
    }
    addRunners(...t) {
        t.forEach(r => {
            this.runners[r] = new ze(r)
        })
    }
    addSystem(t, r) {
        const i = new t(this);
        if (this[r]) throw new Error(`Whoops! The name "${r}" is already in use`);
        this[r] = i, this._systemsHash[r] = i;
        for (const s in this.runners) this.runners[s].add(i);
        return this
    }
    emitWithCustomOptions(t, r) {
        const i = Object.keys(this._systemsHash);
        t.items.forEach(s => {
            const n = i.find(a => this._systemsHash[a] === s);
            s[t.name](r[n])
        })
    }
    destroy() {
        Object.values(this.runners).forEach(t => {
            t.destroy()
        }), this._systemsHash = {}
    }
}
const Tn = class {
    constructor(e) {
        this.renderer = e, this.count = 0, this.checkCount = 0, this.maxIdle = Tn.defaultMaxIdle, this.checkCountMax = Tn.defaultCheckCountMax, this.mode = Tn.defaultMode
    }
    postrender() {
        this.renderer.objectRenderer.renderingToScreen && (this.count++, this.mode !== xh.MANUAL && (this.checkCount++, this.checkCount > this.checkCountMax && (this.checkCount = 0, this.run())))
    }
    run() {
        const e = this.renderer.texture,
            t = e.managedTextures;
        let r = !1;
        for (let i = 0; i < t.length; i++) {
            const s = t[i];
            !s.framebuffer && this.count - s.touched > this.maxIdle && (e.destroyTexture(s, !0), t[i] = null, r = !0)
        }
        if (r) {
            let i = 0;
            for (let s = 0; s < t.length; s++) t[s] !== null && (t[i++] = t[s]);
            t.length = i
        }
    }
    unload(e) {
        const t = this.renderer.texture,
            r = e._texture;
        r && !r.framebuffer && t.destroyTexture(r);
        for (let i = e.children.length - 1; i >= 0; i--) this.unload(e.children[i])
    }
    destroy() {
        this.renderer = null
    }
};
let Ue = Tn;
Ue.defaultMode = xh.AUTO;
Ue.defaultMaxIdle = 60 * 60;
Ue.defaultCheckCountMax = 60 * 10;
Ue.extension = {
    type: J.RendererSystem,
    name: "textureGC"
};
nt.add(Ue);
class uo {
    constructor(t) {
        this.texture = t, this.width = -1, this.height = -1, this.dirtyId = -1, this.dirtyStyleId = -1, this.mipmap = !1, this.wrapMode = 33071, this.type = ot.UNSIGNED_BYTE, this.internalFormat = W.RGBA, this.samplerType = 0
    }
}

function mb(e) {
    let t;
    return "WebGL2RenderingContext" in globalThis && e instanceof globalThis.WebGL2RenderingContext ? t = {
        [ot.UNSIGNED_BYTE]: {
            [W.RGBA]: e.RGBA8,
            [W.RGB]: e.RGB8,
            [W.RG]: e.RG8,
            [W.RED]: e.R8,
            [W.RGBA_INTEGER]: e.RGBA8UI,
            [W.RGB_INTEGER]: e.RGB8UI,
            [W.RG_INTEGER]: e.RG8UI,
            [W.RED_INTEGER]: e.R8UI,
            [W.ALPHA]: e.ALPHA,
            [W.LUMINANCE]: e.LUMINANCE,
            [W.LUMINANCE_ALPHA]: e.LUMINANCE_ALPHA
        },
        [ot.BYTE]: {
            [W.RGBA]: e.RGBA8_SNORM,
            [W.RGB]: e.RGB8_SNORM,
            [W.RG]: e.RG8_SNORM,
            [W.RED]: e.R8_SNORM,
            [W.RGBA_INTEGER]: e.RGBA8I,
            [W.RGB_INTEGER]: e.RGB8I,
            [W.RG_INTEGER]: e.RG8I,
            [W.RED_INTEGER]: e.R8I
        },
        [ot.UNSIGNED_SHORT]: {
            [W.RGBA_INTEGER]: e.RGBA16UI,
            [W.RGB_INTEGER]: e.RGB16UI,
            [W.RG_INTEGER]: e.RG16UI,
            [W.RED_INTEGER]: e.R16UI,
            [W.DEPTH_COMPONENT]: e.DEPTH_COMPONENT16
        },
        [ot.SHORT]: {
            [W.RGBA_INTEGER]: e.RGBA16I,
            [W.RGB_INTEGER]: e.RGB16I,
            [W.RG_INTEGER]: e.RG16I,
            [W.RED_INTEGER]: e.R16I
        },
        [ot.UNSIGNED_INT]: {
            [W.RGBA_INTEGER]: e.RGBA32UI,
            [W.RGB_INTEGER]: e.RGB32UI,
            [W.RG_INTEGER]: e.RG32UI,
            [W.RED_INTEGER]: e.R32UI,
            [W.DEPTH_COMPONENT]: e.DEPTH_COMPONENT24
        },
        [ot.INT]: {
            [W.RGBA_INTEGER]: e.RGBA32I,
            [W.RGB_INTEGER]: e.RGB32I,
            [W.RG_INTEGER]: e.RG32I,
            [W.RED_INTEGER]: e.R32I
        },
        [ot.FLOAT]: {
            [W.RGBA]: e.RGBA32F,
            [W.RGB]: e.RGB32F,
            [W.RG]: e.RG32F,
            [W.RED]: e.R32F,
            [W.DEPTH_COMPONENT]: e.DEPTH_COMPONENT32F
        },
        [ot.HALF_FLOAT]: {
            [W.RGBA]: e.RGBA16F,
            [W.RGB]: e.RGB16F,
            [W.RG]: e.RG16F,
            [W.RED]: e.R16F
        },
        [ot.UNSIGNED_SHORT_5_6_5]: {
            [W.RGB]: e.RGB565
        },
        [ot.UNSIGNED_SHORT_4_4_4_4]: {
            [W.RGBA]: e.RGBA4
        },
        [ot.UNSIGNED_SHORT_5_5_5_1]: {
            [W.RGBA]: e.RGB5_A1
        },
        [ot.UNSIGNED_INT_2_10_10_10_REV]: {
            [W.RGBA]: e.RGB10_A2,
            [W.RGBA_INTEGER]: e.RGB10_A2UI
        },
        [ot.UNSIGNED_INT_10F_11F_11F_REV]: {
            [W.RGB]: e.R11F_G11F_B10F
        },
        [ot.UNSIGNED_INT_5_9_9_9_REV]: {
            [W.RGB]: e.RGB9_E5
        },
        [ot.UNSIGNED_INT_24_8]: {
            [W.DEPTH_STENCIL]: e.DEPTH24_STENCIL8
        },
        [ot.FLOAT_32_UNSIGNED_INT_24_8_REV]: {
            [W.DEPTH_STENCIL]: e.DEPTH32F_STENCIL8
        }
    } : t = {
        [ot.UNSIGNED_BYTE]: {
            [W.RGBA]: e.RGBA,
            [W.RGB]: e.RGB,
            [W.ALPHA]: e.ALPHA,
            [W.LUMINANCE]: e.LUMINANCE,
            [W.LUMINANCE_ALPHA]: e.LUMINANCE_ALPHA
        },
        [ot.UNSIGNED_SHORT_5_6_5]: {
            [W.RGB]: e.RGB
        },
        [ot.UNSIGNED_SHORT_4_4_4_4]: {
            [W.RGBA]: e.RGBA
        },
        [ot.UNSIGNED_SHORT_5_5_5_1]: {
            [W.RGBA]: e.RGBA
        }
    }, t
}
class ld {
    constructor(t) {
        this.renderer = t, this.boundTextures = [], this.currentLocation = -1, this.managedTextures = [], this._unknownBoundTextures = !1, this.unknownTexture = new ct, this.hasIntegerTextures = !1
    }
    contextChange() {
        const t = this.gl = this.renderer.gl;
        this.CONTEXT_UID = this.renderer.CONTEXT_UID, this.webGLVersion = this.renderer.context.webGLVersion, this.internalFormats = mb(t);
        const r = t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS);
        this.boundTextures.length = r;
        for (let s = 0; s < r; s++) this.boundTextures[s] = null;
        this.emptyTextures = {};
        const i = new uo(t.createTexture());
        t.bindTexture(t.TEXTURE_2D, i.texture), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, 1, 1, 0, t.RGBA, t.UNSIGNED_BYTE, new Uint8Array(4)), this.emptyTextures[t.TEXTURE_2D] = i, this.emptyTextures[t.TEXTURE_CUBE_MAP] = new uo(t.createTexture()), t.bindTexture(t.TEXTURE_CUBE_MAP, this.emptyTextures[t.TEXTURE_CUBE_MAP].texture);
        for (let s = 0; s < 6; s++) t.texImage2D(t.TEXTURE_CUBE_MAP_POSITIVE_X + s, 0, t.RGBA, 1, 1, 0, t.RGBA, t.UNSIGNED_BYTE, null);
        t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_CUBE_MAP, t.TEXTURE_MIN_FILTER, t.LINEAR);
        for (let s = 0; s < this.boundTextures.length; s++) this.bind(null, s)
    }
    bind(t, r = 0) {
        const {
            gl: i
        } = this;
        if (t = t == null ? void 0 : t.castToBaseTexture(), t != null && t.valid && !t.parentTextureArray) {
            t.touched = this.renderer.textureGC.count;
            const s = t._glTextures[this.CONTEXT_UID] || this.initTexture(t);
            this.boundTextures[r] !== t && (this.currentLocation !== r && (this.currentLocation = r, i.activeTexture(i.TEXTURE0 + r)), i.bindTexture(t.target, s.texture)), s.dirtyId !== t.dirtyId ? (this.currentLocation !== r && (this.currentLocation = r, i.activeTexture(i.TEXTURE0 + r)), this.updateTexture(t)) : s.dirtyStyleId !== t.dirtyStyleId && this.updateTextureStyle(t), this.boundTextures[r] = t
        } else this.currentLocation !== r && (this.currentLocation = r, i.activeTexture(i.TEXTURE0 + r)), i.bindTexture(i.TEXTURE_2D, this.emptyTextures[i.TEXTURE_2D].texture), this.boundTextures[r] = null
    }
    reset() {
        this._unknownBoundTextures = !0, this.hasIntegerTextures = !1, this.currentLocation = -1;
        for (let t = 0; t < this.boundTextures.length; t++) this.boundTextures[t] = this.unknownTexture
    }
    unbind(t) {
        const {
            gl: r,
            boundTextures: i
        } = this;
        if (this._unknownBoundTextures) {
            this._unknownBoundTextures = !1;
            for (let s = 0; s < i.length; s++) i[s] === this.unknownTexture && this.bind(null, s)
        }
        for (let s = 0; s < i.length; s++) i[s] === t && (this.currentLocation !== s && (r.activeTexture(r.TEXTURE0 + s), this.currentLocation = s), r.bindTexture(t.target, this.emptyTextures[t.target].texture), i[s] = null)
    }
    ensureSamplerType(t) {
        const {
            boundTextures: r,
            hasIntegerTextures: i,
            CONTEXT_UID: s
        } = this;
        if (i)
            for (let n = t - 1; n >= 0; --n) {
                const a = r[n];
                a && a._glTextures[s].samplerType !== Mo.FLOAT && this.renderer.texture.unbind(a)
            }
    }
    initTexture(t) {
        const r = new uo(this.gl.createTexture());
        return r.dirtyId = -1, t._glTextures[this.CONTEXT_UID] = r, this.managedTextures.push(t), t.on("dispose", this.destroyTexture, this), r
    }
    initTextureType(t, r) {
        var i;
        r.internalFormat = ((i = this.internalFormats[t.type]) == null ? void 0 : i[t.format])??t.format, this.webGLVersion === 2 && t.type === ot.HALF_FLOAT ? r.type = this.gl.HALF_FLOAT : r.type = t.type
    }
    updateTexture(t) {
        var s;
        const r = t._glTextures[this.CONTEXT_UID];
        if (!r) return;
        const i = this.renderer;
        if (this.initTextureType(t, r), (s = t.resource) != null && s.upload(i, t, r)) r.samplerType !== Mo.FLOAT && (this.hasIntegerTextures = !0);
        else {
            const n = t.realWidth,
                a = t.realHeight,
                o = i.gl;
            (r.width !== n || r.height !== a || r.dirtyId < 0) && (r.width = n, r.height = a, o.texImage2D(t.target, 0, r.internalFormat, n, a, 0, t.format, r.type, null))
        }
        t.dirtyStyleId !== r.dirtyStyleId && this.updateTextureStyle(t), r.dirtyId = t.dirtyId
    }
    destroyTexture(t, r) {
        const {
            gl: i
        } = this;
        if (t = t.castToBaseTexture(), t._glTextures[this.CONTEXT_UID] && (this.unbind(t), i.deleteTexture(t._glTextures[this.CONTEXT_UID].texture), t.off("dispose", this.destroyTexture, this), delete t._glTextures[this.CONTEXT_UID], !r)) {
            const s = this.managedTextures.indexOf(t);
            s !== -1 && gs(this.managedTextures, s, 1)
        }
    }
    updateTextureStyle(t) {
        var i;
        const r = t._glTextures[this.CONTEXT_UID];
        r && ((t.mipmap === hr.POW2 || this.webGLVersion !== 2) && !t.isPowerOfTwo ? r.mipmap = !1 : r.mipmap = t.mipmap >= 1, this.webGLVersion !== 2 && !t.isPowerOfTwo ? r.wrapMode = Mr.CLAMP : r.wrapMode = t.wrapMode, (i = t.resource) != null && i.style(this.renderer, t, r) || this.setStyle(t, r), r.dirtyStyleId = t.dirtyStyleId)
    }
    setStyle(t, r) {
        const i = this.gl;
        if (r.mipmap && t.mipmap !== hr.ON_MANUAL && i.generateMipmap(t.target), i.texParameteri(t.target, i.TEXTURE_WRAP_S, r.wrapMode), i.texParameteri(t.target, i.TEXTURE_WRAP_T, r.wrapMode), r.mipmap) {
            i.texParameteri(t.target, i.TEXTURE_MIN_FILTER, t.scaleMode === mr.LINEAR ? i.LINEAR_MIPMAP_LINEAR : i.NEAREST_MIPMAP_NEAREST);
            const s = this.renderer.context.extensions.anisotropicFiltering;
            if (s && t.anisotropicLevel > 0 && t.scaleMode === mr.LINEAR) {
                const n = Math.min(t.anisotropicLevel, i.getParameter(s.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
                i.texParameterf(t.target, s.TEXTURE_MAX_ANISOTROPY_EXT, n)
            }
        } else i.texParameteri(t.target, i.TEXTURE_MIN_FILTER, t.scaleMode === mr.LINEAR ? i.LINEAR : i.NEAREST);
        i.texParameteri(t.target, i.TEXTURE_MAG_FILTER, t.scaleMode === mr.LINEAR ? i.LINEAR : i.NEAREST)
    }
    destroy() {
        this.renderer = null
    }
}
ld.extension = {
    type: J.RendererSystem,
    name: "texture"
};
nt.add(ld);
class cd {
    constructor(t) {
        this.renderer = t
    }
    contextChange() {
        this.gl = this.renderer.gl, this.CONTEXT_UID = this.renderer.CONTEXT_UID
    }
    bind(t) {
        const {
            gl: r,
            CONTEXT_UID: i
        } = this, s = t._glTransformFeedbacks[i] || this.createGLTransformFeedback(t);
        r.bindTransformFeedback(r.TRANSFORM_FEEDBACK, s)
    }
    unbind() {
        const {
            gl: t
        } = this;
        t.bindTransformFeedback(t.TRANSFORM_FEEDBACK, null)
    }
    beginTransformFeedback(t, r) {
        const {
            gl: i,
            renderer: s
        } = this;
        r && s.shader.bind(r), i.beginTransformFeedback(t)
    }
    endTransformFeedback() {
        const {
            gl: t
        } = this;
        t.endTransformFeedback()
    }
    createGLTransformFeedback(t) {
        const {
            gl: r,
            renderer: i,
            CONTEXT_UID: s
        } = this, n = r.createTransformFeedback();
        t._glTransformFeedbacks[s] = n, r.bindTransformFeedback(r.TRANSFORM_FEEDBACK, n);
        for (let a = 0; a < t.buffers.length; a++) {
            const o = t.buffers[a];
            o && (i.buffer.update(o), o._glBuffers[s].refCount++, r.bindBufferBase(r.TRANSFORM_FEEDBACK_BUFFER, a, o._glBuffers[s].buffer || null))
        }
        return r.bindTransformFeedback(r.TRANSFORM_FEEDBACK, null), t.disposeRunner.add(this), n
    }
    disposeTransformFeedback(t, r) {
        const i = t._glTransformFeedbacks[this.CONTEXT_UID],
            s = this.gl;
        t.disposeRunner.remove(this);
        const n = this.renderer.buffer;
        if (n)
            for (let a = 0; a < t.buffers.length; a++) {
                const o = t.buffers[a];
                if (!o) continue;
                const h = o._glBuffers[this.CONTEXT_UID];
                h && (h.refCount--, h.refCount === 0 && !r && n.dispose(o, r))
            }
        i && (r || s.deleteTransformFeedback(i), delete t._glTransformFeedbacks[this.CONTEXT_UID])
    }
    destroy() {
        this.renderer = null
    }
}
cd.extension = {
    type: J.RendererSystem,
    name: "transformFeedback"
};
nt.add(cd);
class ua {
    constructor(t) {
        this.renderer = t
    }
    init(t) {
        this.screen = new _t(0, 0, t.width, t.height), this.element = t.view || K.ADAPTER.createCanvas(), this.resolution = t.resolution || K.RESOLUTION, this.autoDensity = !!t.autoDensity
    }
    resizeView(t, r) {
        this.element.width = Math.round(t * this.resolution), this.element.height = Math.round(r * this.resolution);
        const i = this.element.width / this.resolution,
            s = this.element.height / this.resolution;
        this.screen.width = i, this.screen.height = s, this.autoDensity && (this.element.style.width = `${i}px`, this.element.style.height = `${s}px`), this.renderer.emit("resize", i, s), this.renderer.runners.resize.emit(this.screen.width, this.screen.height)
    }
    destroy(t) {
        var r;
        t && ((r = this.element.parentNode) == null || r.removeChild(this.element)), this.renderer = null, this.element = null, this.screen = null
    }
}
ua.defaultOptions = {
    width: 800,
    height: 600,
    resolution: K.RESOLUTION,
    autoDensity: !1
};
ua.extension = {
    type: [J.RendererSystem, J.CanvasRendererSystem],
    name: "_view"
};
nt.add(ua);
K.PREFER_ENV = si.WEBGL2;
K.STRICT_TEXTURE_CACHE = !1;
K.RENDER_OPTIONS = { ...la.defaultOptions,
    ...ha.defaultOptions,
    ...ua.defaultOptions,
    ...ca.defaultOptions
};
Object.defineProperties(K, {
    WRAP_MODE: {
        get() {
            return ct.defaultOptions.wrapMode
        },
        set(e) {
            Et("7.1.0", "settings.WRAP_MODE is deprecated, use BaseTexture.defaultOptions.wrapMode"), ct.defaultOptions.wrapMode = e
        }
    },
    SCALE_MODE: {
        get() {
            return ct.defaultOptions.scaleMode
        },
        set(e) {
            Et("7.1.0", "settings.SCALE_MODE is deprecated, use BaseTexture.defaultOptions.scaleMode"), ct.defaultOptions.scaleMode = e
        }
    },
    MIPMAP_TEXTURES: {
        get() {
            return ct.defaultOptions.mipmap
        },
        set(e) {
            Et("7.1.0", "settings.MIPMAP_TEXTURES is deprecated, use BaseTexture.defaultOptions.mipmap"), ct.defaultOptions.mipmap = e
        }
    },
    ANISOTROPIC_LEVEL: {
        get() {
            return ct.defaultOptions.anisotropicLevel
        },
        set(e) {
            Et("7.1.0", "settings.ANISOTROPIC_LEVEL is deprecated, use BaseTexture.defaultOptions.anisotropicLevel"), ct.defaultOptions.anisotropicLevel = e
        }
    },
    FILTER_RESOLUTION: {
        get() {
            return Et("7.1.0", "settings.FILTER_RESOLUTION is deprecated, use Filter.defaultResolution"), se.defaultResolution
        },
        set(e) {
            se.defaultResolution = e
        }
    },
    FILTER_MULTISAMPLE: {
        get() {
            return Et("7.1.0", "settings.FILTER_MULTISAMPLE is deprecated, use Filter.defaultMultisample"), se.defaultMultisample
        },
        set(e) {
            se.defaultMultisample = e
        }
    },
    SPRITE_MAX_TEXTURES: {
        get() {
            return Ie.defaultMaxTextures
        },
        set(e) {
            Et("7.1.0", "settings.SPRITE_MAX_TEXTURES is deprecated, use BatchRenderer.defaultMaxTextures"), Ie.defaultMaxTextures = e
        }
    },
    SPRITE_BATCH_SIZE: {
        get() {
            return Ie.defaultBatchSize
        },
        set(e) {
            Et("7.1.0", "settings.SPRITE_BATCH_SIZE is deprecated, use BatchRenderer.defaultBatchSize"), Ie.defaultBatchSize = e
        }
    },
    CAN_UPLOAD_SAME_BUFFER: {
        get() {
            return Ie.canUploadSameBuffer
        },
        set(e) {
            Et("7.1.0", "settings.CAN_UPLOAD_SAME_BUFFER is deprecated, use BatchRenderer.canUploadSameBuffer"), Ie.canUploadSameBuffer = e
        }
    },
    GC_MODE: {
        get() {
            return Ue.defaultMode
        },
        set(e) {
            Et("7.1.0", "settings.GC_MODE is deprecated, use TextureGCSystem.defaultMode"), Ue.defaultMode = e
        }
    },
    GC_MAX_IDLE: {
        get() {
            return Ue.defaultMaxIdle
        },
        set(e) {
            Et("7.1.0", "settings.GC_MAX_IDLE is deprecated, use TextureGCSystem.defaultMaxIdle"), Ue.defaultMaxIdle = e
        }
    },
    GC_MAX_CHECK_COUNT: {
        get() {
            return Ue.defaultCheckCountMax
        },
        set(e) {
            Et("7.1.0", "settings.GC_MAX_CHECK_COUNT is deprecated, use TextureGCSystem.defaultCheckCountMax"), Ue.defaultCheckCountMax = e
        }
    },
    PRECISION_VERTEX: {
        get() {
            return $e.defaultVertexPrecision
        },
        set(e) {
            Et("7.1.0", "settings.PRECISION_VERTEX is deprecated, use Program.defaultVertexPrecision"), $e.defaultVertexPrecision = e
        }
    },
    PRECISION_FRAGMENT: {
        get() {
            return $e.defaultFragmentPrecision
        },
        set(e) {
            Et("7.1.0", "settings.PRECISION_FRAGMENT is deprecated, use Program.defaultFragmentPrecision"), $e.defaultFragmentPrecision = e
        }
    }
});
var Vi = (e => (e[e.INTERACTION = 50] = "INTERACTION", e[e.HIGH = 25] = "HIGH", e[e.NORMAL = 0] = "NORMAL", e[e.LOW = -25] = "LOW", e[e.UTILITY = -50] = "UTILITY", e))(Vi || {});
class fo {
    constructor(t, r = null, i = 0, s = !1) {
        this.next = null, this.previous = null, this._destroyed = !1, this.fn = t, this.context = r, this.priority = i, this.once = s
    }
    match(t, r = null) {
        return this.fn === t && this.context === r
    }
    emit(t) {
        this.fn && (this.context ? this.fn.call(this.context, t) : this.fn(t));
        const r = this.next;
        return this.once && this.destroy(!0), this._destroyed && (this.next = null), r
    }
    connect(t) {
        this.previous = t, t.next && (t.next.previous = this), this.next = t.next, t.next = this
    }
    destroy(t = !1) {
        this._destroyed = !0, this.fn = null, this.context = null, this.previous && (this.previous.next = this.next), this.next && (this.next.previous = this.previous);
        const r = this.next;
        return this.next = t ? null : r, this.previous = null, r
    }
}
const Te = class {
    constructor() {
        this.autoStart = !1, this.deltaTime = 1, this.lastTime = -1, this.speed = 1, this.started = !1, this._requestId = null, this._maxElapsedMS = 100, this._minElapsedMS = 0, this._protected = !1, this._lastFrame = -1, this._head = new fo(null, null, 1 / 0), this.deltaMS = 1 / Te.targetFPMS, this.elapsedMS = 1 / Te.targetFPMS, this._tick = e => {
            this._requestId = null, this.started && (this.update(e), this.started && this._requestId === null && this._head.next && (this._requestId = requestAnimationFrame(this._tick)))
        }
    }
    _requestIfNeeded() {
        this._requestId === null && this._head.next && (this.lastTime = performance.now(), this._lastFrame = this.lastTime, this._requestId = requestAnimationFrame(this._tick))
    }
    _cancelIfNeeded() {
        this._requestId !== null && (cancelAnimationFrame(this._requestId), this._requestId = null)
    }
    _startIfPossible() {
        this.started ? this._requestIfNeeded() : this.autoStart && this.start()
    }
    add(e, t, r = Vi.NORMAL) {
        return this._addListener(new fo(e, t, r))
    }
    addOnce(e, t, r = Vi.NORMAL) {
        return this._addListener(new fo(e, t, r, !0))
    }
    _addListener(e) {
        let t = this._head.next,
            r = this._head;
        if (!t) e.connect(r);
        else {
            for (; t;) {
                if (e.priority > t.priority) {
                    e.connect(r);
                    break
                }
                r = t, t = t.next
            }
            e.previous || e.connect(r)
        }
        return this._startIfPossible(), this
    }
    remove(e, t) {
        let r = this._head.next;
        for (; r;) r.match(e, t) ? r = r.destroy() : r = r.next;
        return this._head.next || this._cancelIfNeeded(), this
    }
    get count() {
        if (!this._head) return 0;
        let e = 0,
            t = this._head;
        for (; t = t.next;) e++;
        return e
    }
    start() {
        this.started || (this.started = !0, this._requestIfNeeded())
    }
    stop() {
        this.started && (this.started = !1, this._cancelIfNeeded())
    }
    destroy() {
        if (!this._protected) {
            this.stop();
            let e = this._head.next;
            for (; e;) e = e.destroy(!0);
            this._head.destroy(), this._head = null
        }
    }
    update(e = performance.now()) {
        let t;
        if (e > this.lastTime) {
            if (t = this.elapsedMS = e - this.lastTime, t > this._maxElapsedMS && (t = this._maxElapsedMS), t *= this.speed, this._minElapsedMS) {
                const s = e - this._lastFrame | 0;
                if (s < this._minElapsedMS) return;
                this._lastFrame = e - s % this._minElapsedMS
            }
            this.deltaMS = t, this.deltaTime = this.deltaMS * Te.targetFPMS;
            const r = this._head;
            let i = r.next;
            for (; i;) i = i.emit(this.deltaTime);
            r.next || this._cancelIfNeeded()
        } else this.deltaTime = this.deltaMS = this.elapsedMS = 0;
        this.lastTime = e
    }
    get FPS() {
        return 1e3 / this.elapsedMS
    }
    get minFPS() {
        return 1e3 / this._maxElapsedMS
    }
    set minFPS(e) {
        const t = Math.min(this.maxFPS, e),
            r = Math.min(Math.max(0, t) / 1e3, Te.targetFPMS);
        this._maxElapsedMS = 1 / r
    }
    get maxFPS() {
        return this._minElapsedMS ? Math.round(1e3 / this._minElapsedMS) : 0
    }
    set maxFPS(e) {
        if (e === 0) this._minElapsedMS = 0;
        else {
            const t = Math.max(this.minFPS, e);
            this._minElapsedMS = 1 / (t / 1e3)
        }
    }
    static get shared() {
        if (!Te._shared) {
            const e = Te._shared = new Te;
            e.autoStart = !0, e._protected = !0
        }
        return Te._shared
    }
    static get system() {
        if (!Te._system) {
            const e = Te._system = new Te;
            e.autoStart = !0, e._protected = !0
        }
        return Te._system
    }
};
let ve = Te;
ve.targetFPMS = .06;
Object.defineProperties(K, {
    TARGET_FPMS: {
        get() {
            return ve.targetFPMS
        },
        set(e) {
            Et("7.1.0", "settings.TARGET_FPMS is deprecated, use Ticker.targetFPMS"), ve.targetFPMS = e
        }
    }
});
class ud {
    static init(t) {
        t = Object.assign({
            autoStart: !0,
            sharedTicker: !1
        }, t), Object.defineProperty(this, "ticker", {
            set(r) {
                this._ticker && this._ticker.remove(this.render, this), this._ticker = r, r && r.add(this.render, this, Vi.LOW)
            },
            get() {
                return this._ticker
            }
        }), this.stop = () => {
            this._ticker.stop()
        }, this.start = () => {
            this._ticker.start()
        }, this._ticker = null, this.ticker = t.sharedTicker ? ve.shared : new ve, t.autoStart && this.start()
    }
    static destroy() {
        if (this._ticker) {
            const t = this._ticker;
            this.ticker = null, t.destroy()
        }
    }
}
ud.extension = J.Application;
nt.add(ud);
const fd = [];
nt.handleByList(J.Renderer, fd);

function gb(e) {
    for (const t of fd)
        if (t.test(e)) return new t(e);
    throw new Error("Unable to auto-detect a suitable renderer.")
}
var vb = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`,
    _b = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;
const yb = vb,
    dd = _b;
class pd {
    constructor(t) {
        this.renderer = t
    }
    contextChange(t) {
        let r;
        if (this.renderer.context.webGLVersion === 1) {
            const i = t.getParameter(t.FRAMEBUFFER_BINDING);
            t.bindFramebuffer(t.FRAMEBUFFER, null), r = t.getParameter(t.SAMPLES), t.bindFramebuffer(t.FRAMEBUFFER, i)
        } else {
            const i = t.getParameter(t.DRAW_FRAMEBUFFER_BINDING);
            t.bindFramebuffer(t.DRAW_FRAMEBUFFER, null), r = t.getParameter(t.SAMPLES), t.bindFramebuffer(t.DRAW_FRAMEBUFFER, i)
        }
        r >= Qt.HIGH ? this.multisample = Qt.HIGH : r >= Qt.MEDIUM ? this.multisample = Qt.MEDIUM : r >= Qt.LOW ? this.multisample = Qt.LOW : this.multisample = Qt.NONE
    }
    destroy() {}
}
pd.extension = {
    type: J.RendererSystem,
    name: "_multisample"
};
nt.add(pd);
class xb {
    constructor(t) {
        this.buffer = t || null, this.updateID = -1, this.byteLength = -1, this.refCount = 0
    }
}
class md {
    constructor(t) {
        this.renderer = t, this.managedBuffers = {}, this.boundBufferBases = {}
    }
    destroy() {
        this.renderer = null
    }
    contextChange() {
        this.disposeAll(!0), this.gl = this.renderer.gl, this.CONTEXT_UID = this.renderer.CONTEXT_UID
    }
    bind(t) {
        const {
            gl: r,
            CONTEXT_UID: i
        } = this, s = t._glBuffers[i] || this.createGLBuffer(t);
        r.bindBuffer(t.type, s.buffer)
    }
    unbind(t) {
        const {
            gl: r
        } = this;
        r.bindBuffer(t, null)
    }
    bindBufferBase(t, r) {
        const {
            gl: i,
            CONTEXT_UID: s
        } = this;
        if (this.boundBufferBases[r] !== t) {
            const n = t._glBuffers[s] || this.createGLBuffer(t);
            this.boundBufferBases[r] = t, i.bindBufferBase(i.UNIFORM_BUFFER, r, n.buffer)
        }
    }
    bindBufferRange(t, r, i) {
        const {
            gl: s,
            CONTEXT_UID: n
        } = this;
        i = i || 0;
        const a = t._glBuffers[n] || this.createGLBuffer(t);
        s.bindBufferRange(s.UNIFORM_BUFFER, r || 0, a.buffer, i * 256, 256)
    }
    update(t) {
        const {
            gl: r,
            CONTEXT_UID: i
        } = this, s = t._glBuffers[i] || this.createGLBuffer(t);
        if (t._updateID !== s.updateID)
            if (s.updateID = t._updateID, r.bindBuffer(t.type, s.buffer), s.byteLength >= t.data.byteLength) r.bufferSubData(t.type, 0, t.data);
            else {
                const n = t.static ? r.STATIC_DRAW : r.DYNAMIC_DRAW;
                s.byteLength = t.data.byteLength, r.bufferData(t.type, t.data, n)
            }
    }
    dispose(t, r) {
        if (!this.managedBuffers[t.id]) return;
        delete this.managedBuffers[t.id];
        const i = t._glBuffers[this.CONTEXT_UID],
            s = this.gl;
        t.disposeRunner.remove(this), i && (r || s.deleteBuffer(i.buffer), delete t._glBuffers[this.CONTEXT_UID])
    }
    disposeAll(t) {
        const r = Object.keys(this.managedBuffers);
        for (let i = 0; i < r.length; i++) this.dispose(this.managedBuffers[r[i]], t)
    }
    createGLBuffer(t) {
        const {
            CONTEXT_UID: r,
            gl: i
        } = this;
        return t._glBuffers[r] = new xb(i.createBuffer()), this.managedBuffers[t.id] = t, t.disposeRunner.add(this), t._glBuffers[r]
    }
}
md.extension = {
    type: J.RendererSystem,
    name: "buffer"
};
nt.add(md);
class gd {
    constructor(t) {
        this.renderer = t
    }
    render(t, r) {
        const i = this.renderer;
        let s, n, a, o;
        if (r && (s = r.renderTexture, n = r.clear, a = r.transform, o = r.skipUpdateTransform), this.renderingToScreen = !s, i.runners.prerender.emit(), i.emit("prerender"), i.projection.transform = a, !i.context.isLost) {
            if (s || (this.lastObjectRendered = t), !o) {
                const h = t.enableTempParent();
                t.updateTransform(), t.disableTempParent(h)
            }
            i.renderTexture.bind(s), i.batch.currentRenderer.start(), (n??i.background.clearBeforeRender) && i.renderTexture.clear(), t.render(i), i.batch.currentRenderer.flush(), s && (r.blit && i.framebuffer.blit(), s.baseTexture.update()), i.runners.postrender.emit(), i.projection.transform = null, i.emit("postrender")
        }
    }
    destroy() {
        this.renderer = null, this.lastObjectRendered = null
    }
}
gd.extension = {
    type: J.RendererSystem,
    name: "objectRenderer"
};
nt.add(gd);
const Yo = class extends pb {
    constructor(e) {
        super(), this.type = yh.WEBGL, e = Object.assign({}, K.RENDER_OPTIONS, e), this.gl = null, this.CONTEXT_UID = 0, this.globalUniforms = new Xe({
            projectionMatrix: new Gt
        }, !0);
        const t = {
            runners: ["init", "destroy", "contextChange", "resolutionChange", "reset", "update", "postrender", "prerender", "resize"],
            systems: Yo.__systems,
            priority: ["_view", "textureGenerator", "background", "_plugin", "startup", "context", "state", "texture", "buffer", "geometry", "framebuffer", "transformFeedback", "mask", "scissor", "stencil", "projection", "textureGC", "filter", "renderTexture", "batch", "objectRenderer", "_multisample"]
        };
        this.setup(t), "useContextAlpha" in e && (Et("7.0.0", "options.useContextAlpha is deprecated, use options.premultipliedAlpha and options.backgroundAlpha instead"), e.premultipliedAlpha = e.useContextAlpha && e.useContextAlpha !== "notMultiplied", e.backgroundAlpha = e.useContextAlpha === !1 ? 1 : e.backgroundAlpha), this._plugin.rendererPlugins = Yo.__plugins, this.options = e, this.startup.run(this.options)
    }
    static test(e) {
        return e != null && e.forceCanvas ? !1 : Wy()
    }
    render(e, t) {
        this.objectRenderer.render(e, t)
    }
    resize(e, t) {
        this._view.resizeView(e, t)
    }
    reset() {
        return this.runners.reset.emit(), this
    }
    clear() {
        this.renderTexture.bind(), this.renderTexture.clear()
    }
    destroy(e = !1) {
        this.runners.destroy.items.reverse(), this.emitWithCustomOptions(this.runners.destroy, {
            _view: e
        }), super.destroy()
    }
    get plugins() {
        return this._plugin.plugins
    }
    get multisample() {
        return this._multisample.multisample
    }
    get width() {
        return this._view.element.width
    }
    get height() {
        return this._view.element.height
    }
    get resolution() {
        return this._view.resolution
    }
    set resolution(e) {
        this._view.resolution = e, this.runners.resolutionChange.emit(e)
    }
    get autoDensity() {
        return this._view.autoDensity
    }
    get view() {
        return this._view.element
    }
    get screen() {
        return this._view.screen
    }
    get lastObjectRendered() {
        return this.objectRenderer.lastObjectRendered
    }
    get renderingToScreen() {
        return this.objectRenderer.renderingToScreen
    }
    get rendererLogId() {
        return `WebGL ${this.context.webGLVersion}`
    }
    get clearBeforeRender() {
        return Et("7.0.0", "renderer.clearBeforeRender has been deprecated, please use renderer.background.clearBeforeRender instead."), this.background.clearBeforeRender
    }
    get useContextAlpha() {
        return Et("7.0.0", "renderer.useContextAlpha has been deprecated, please use renderer.context.premultipliedAlpha instead."), this.context.useContextAlpha
    }
    get preserveDrawingBuffer() {
        return Et("7.0.0", "renderer.preserveDrawingBuffer has been deprecated, we cannot truly know this unless pixi created the context"), this.context.preserveDrawingBuffer
    }
    get backgroundColor() {
        return Et("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."), this.background.color
    }
    set backgroundColor(e) {
        Et("7.0.0", "renderer.backgroundColor has been deprecated, use renderer.background.color instead."), this.background.color = e
    }
    get backgroundAlpha() {
        return Et("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."), this.background.alpha
    }
    set backgroundAlpha(e) {
        Et("7.0.0", "renderer.backgroundAlpha has been deprecated, use renderer.background.alpha instead."), this.background.alpha = e
    }
    get powerPreference() {
        return Et("7.0.0", "renderer.powerPreference has been deprecated, we can only know this if pixi creates the context"), this.context.powerPreference
    }
    generateTexture(e, t) {
        return this.textureGenerator.generateTexture(e, t)
    }
};
let qi = Yo;
qi.extension = {
    type: J.Renderer,
    priority: 1
};
qi.__plugins = {};
qi.__systems = {};
nt.handleByMap(J.RendererPlugin, qi.__plugins);
nt.handleByMap(J.RendererSystem, qi.__systems);
nt.add(qi);
class vd extends Ts {
    constructor(t, r) {
        const {
            width: i,
            height: s
        } = r || {};
        super(i, s), this.items = [], this.itemDirtyIds = [];
        for (let n = 0; n < t; n++) {
            const a = new ct;
            this.items.push(a), this.itemDirtyIds.push(-2)
        }
        this.length = t, this._load = null, this.baseTexture = null
    }
    initFromArray(t, r) {
        for (let i = 0; i < this.length; i++) t[i] && (t[i].castToBaseTexture ? this.addBaseTextureAt(t[i].castToBaseTexture(), i) : t[i] instanceof Ts ? this.addResourceAt(t[i], i) : this.addResourceAt(Bf(t[i], r), i))
    }
    dispose() {
        for (let t = 0, r = this.length; t < r; t++) this.items[t].destroy();
        this.items = null, this.itemDirtyIds = null, this._load = null
    }
    addResourceAt(t, r) {
        if (!this.items[r]) throw new Error(`Index ${r} is out of bounds`);
        return t.valid && !this.valid && this.resize(t.width, t.height), this.items[r].setResource(t), this
    }
    bind(t) {
        if (this.baseTexture !== null) throw new Error("Only one base texture per TextureArray is allowed");
        super.bind(t);
        for (let r = 0; r < this.length; r++) this.items[r].parentTextureArray = t, this.items[r].on("update", t.update, t)
    }
    unbind(t) {
        super.unbind(t);
        for (let r = 0; r < this.length; r++) this.items[r].parentTextureArray = null, this.items[r].off("update", t.update, t)
    }
    load() {
        if (this._load) return this._load;
        const r = this.items.map(i => i.resource).filter(i => i).map(i => i.load());
        return this._load = Promise.all(r).then(() => {
            const {
                realWidth: i,
                realHeight: s
            } = this.items[0];
            return this.resize(i, s), Promise.resolve(this)
        }), this._load
    }
}
class bb extends vd {
    constructor(t, r) {
        const {
            width: i,
            height: s
        } = r || {};
        let n, a;
        Array.isArray(t) ? (n = t, a = t.length) : a = t, super(a, {
            width: i,
            height: s
        }), n && this.initFromArray(n, r)
    }
    addBaseTextureAt(t, r) {
        if (t.resource) this.addResourceAt(t.resource, r);
        else throw new Error("ArrayResource does not support RenderTexture");
        return this
    }
    bind(t) {
        super.bind(t), t.target = Di.TEXTURE_2D_ARRAY
    }
    upload(t, r, i) {
        const {
            length: s,
            itemDirtyIds: n,
            items: a
        } = this, {
            gl: o
        } = t;
        i.dirtyId < 0 && o.texImage3D(o.TEXTURE_2D_ARRAY, 0, i.internalFormat, this._width, this._height, s, 0, r.format, i.type, null);
        for (let h = 0; h < s; h++) {
            const l = a[h];
            n[h] < l.dirtyId && (n[h] = l.dirtyId, l.valid && o.texSubImage3D(o.TEXTURE_2D_ARRAY, 0, 0, 0, h, l.resource.width, l.resource.height, 1, r.format, i.type, l.resource.source))
        }
        return !0
    }
}
class wb extends Br {
    constructor(t) {
        super(t)
    }
    static test(t) {
        const {
            OffscreenCanvas: r
        } = globalThis;
        return r && t instanceof r ? !0 : globalThis.HTMLCanvasElement && t instanceof HTMLCanvasElement
    }
}
const ls = class extends vd {
    constructor(e, t) {
        const {
            width: r,
            height: i,
            autoLoad: s,
            linkBaseTexture: n
        } = t || {};
        if (e && e.length !== ls.SIDES) throw new Error(`Invalid length. Got ${e.length}, expected 6`);
        super(6, {
            width: r,
            height: i
        });
        for (let a = 0; a < ls.SIDES; a++) this.items[a].target = Di.TEXTURE_CUBE_MAP_POSITIVE_X + a;
        this.linkBaseTexture = n !== !1, e && this.initFromArray(e, t), s !== !1 && this.load()
    }
    bind(e) {
        super.bind(e), e.target = Di.TEXTURE_CUBE_MAP
    }
    addBaseTextureAt(e, t, r) {
        if (r === void 0 && (r = this.linkBaseTexture), !this.items[t]) throw new Error(`Index ${t} is out of bounds`);
        if (!this.linkBaseTexture || e.parentTextureArray || Object.keys(e._glTextures).length > 0)
            if (e.resource) this.addResourceAt(e.resource, t);
            else throw new Error("CubeResource does not support copying of renderTexture.");
        else e.target = Di.TEXTURE_CUBE_MAP_POSITIVE_X + t, e.parentTextureArray = this.baseTexture, this.items[t] = e;
        return e.valid && !this.valid && this.resize(e.realWidth, e.realHeight), this.items[t] = e, this
    }
    upload(e, t, r) {
        const i = this.itemDirtyIds;
        for (let s = 0; s < ls.SIDES; s++) {
            const n = this.items[s];
            (i[s] < n.dirtyId || r.dirtyId < t.dirtyId) && (n.valid && n.resource ? (n.resource.upload(e, n, r), i[s] = n.dirtyId) : i[s] < -1 && (e.gl.texImage2D(n.target, 0, r.internalFormat, t.realWidth, t.realHeight, 0, t.format, r.type, null), i[s] = -1))
        }
        return !0
    }
    static test(e) {
        return Array.isArray(e) && e.length === ls.SIDES
    }
};
let _d = ls;
_d.SIDES = 6;
class Pi extends Br {
    constructor(t, r) {
        r = r || {};
        let i, s;
        typeof t == "string" ? (i = Pi.EMPTY, s = t) : (i = t, s = null), super(i), this.url = s, this.crossOrigin = r.crossOrigin??!0, this.alphaMode = typeof r.alphaMode == "number" ? r.alphaMode : null, this._load = null, r.autoLoad !== !1 && this.load()
    }
    load() {
        return this._load ? this._load : (this._load = new Promise(async (t, r) => {
            if (this.url === null) {
                t(this);
                return
            }
            try {
                const i = await K.ADAPTER.fetch(this.url, {
                    mode: this.crossOrigin ? "cors" : "no-cors"
                });
                if (this.destroyed) return;
                const s = await i.blob();
                if (this.destroyed) return;
                const n = await createImageBitmap(s, {
                    premultiplyAlpha: this.alphaMode === null || this.alphaMode === qe.UNPACK ? "premultiply" : "none"
                });
                if (this.destroyed) return;
                this.source = n, this.update(), t(this)
            } catch (i) {
                if (this.destroyed) return;
                r(i), this.onError.emit(i)
            }
        }), this._load)
    }
    upload(t, r, i) {
        return this.source instanceof ImageBitmap ? (typeof this.alphaMode == "number" && (r.alphaMode = this.alphaMode), super.upload(t, r, i)) : (this.load(), !1)
    }
    dispose() {
        this.source instanceof ImageBitmap && this.source.close(), super.dispose(), this._load = null
    }
    static test(t) {
        return !!globalThis.createImageBitmap && typeof ImageBitmap < "u" && (typeof t == "string" || t instanceof ImageBitmap)
    }
    static get EMPTY() {
        return Pi._EMPTY = Pi._EMPTY??K.ADAPTER.createCanvas(0, 0), Pi._EMPTY
    }
}
const An = class extends Br {
    constructor(e, t) {
        t = t || {}, super(K.ADAPTER.createCanvas()), this._width = 0, this._height = 0, this.svg = e, this.scale = t.scale || 1, this._overrideWidth = t.width, this._overrideHeight = t.height, this._resolve = null, this._crossorigin = t.crossorigin, this._load = null, t.autoLoad !== !1 && this.load()
    }
    load() {
        return this._load ? this._load : (this._load = new Promise(e => {
            if (this._resolve = () => {
                    this.resize(this.source.width, this.source.height), e(this)
                }, An.SVG_XML.test(this.svg.trim())) {
                if (!btoa) throw new Error("Your browser doesn't support base64 conversions.");
                this.svg = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(this.svg)))}`
            }
            this._loadSvg()
        }), this._load)
    }
    _loadSvg() {
        const e = new Image;
        Br.crossOrigin(e, this.svg, this._crossorigin), e.src = this.svg, e.onerror = t => {
            this._resolve && (e.onerror = null, this.onError.emit(t))
        }, e.onload = () => {
            if (!this._resolve) return;
            const t = e.width,
                r = e.height;
            if (!t || !r) throw new Error("The SVG image must have width and height defined (in pixels), canvas API needs them.");
            let i = t * this.scale,
                s = r * this.scale;
            (this._overrideWidth || this._overrideHeight) && (i = this._overrideWidth || this._overrideHeight / r * t, s = this._overrideHeight || this._overrideWidth / t * r), i = Math.round(i), s = Math.round(s);
            const n = this.source;
            n.width = i, n.height = s, n._pixiId = `canvas_${ei()}`, n.getContext("2d").drawImage(e, 0, 0, t, r, 0, 0, i, s), this._resolve(), this._resolve = null
        }
    }
    static getSize(e) {
        const t = An.SVG_SIZE.exec(e),
            r = {};
        return t && (r[t[1]] = Math.round(parseFloat(t[3])), r[t[5]] = Math.round(parseFloat(t[7]))), r
    }
    dispose() {
        super.dispose(), this._resolve = null, this._crossorigin = null
    }
    static test(e, t) {
        return t === "svg" || typeof e == "string" && e.startsWith("data:image/svg+xml") || typeof e == "string" && An.SVG_XML.test(e)
    }
};
let As = An;
As.SVG_XML = /^(<\?xml[^?]+\?>)?\s*(<!--[^(-->)]*-->)?\s*\<svg/m;
As.SVG_SIZE = /<svg[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*(?:\s(width|height)=('|")(\d*(?:\.\d+)?)(?:px)?('|"))[^>]*>/i;
const qo = class extends Br {
    constructor(e, t) {
        if (t = t || {}, !(e instanceof HTMLVideoElement)) {
            const r = document.createElement("video");
            r.setAttribute("preload", "auto"), r.setAttribute("webkit-playsinline", ""), r.setAttribute("playsinline", ""), typeof e == "string" && (e = [e]);
            const i = e[0].src || e[0];
            Br.crossOrigin(r, i, t.crossorigin);
            for (let s = 0; s < e.length; ++s) {
                const n = document.createElement("source");
                let {
                    src: a,
                    mime: o
                } = e[s];
                a = a || e[s];
                const h = a.split("?").shift().toLowerCase(),
                    l = h.slice(h.lastIndexOf(".") + 1);
                o = o || qo.MIME_TYPES[l] || `video/${l}`, n.src = a, n.type = o, r.appendChild(n)
            }
            e = r
        }
        super(e), this.noSubImage = !0, this._autoUpdate = !0, this._isConnectedToTicker = !1, this._updateFPS = t.updateFPS || 0, this._msToNextUpdate = 0, this.autoPlay = t.autoPlay !== !1, this._load = null, this._resolve = null, this._onCanPlay = this._onCanPlay.bind(this), this._onError = this._onError.bind(this), t.autoLoad !== !1 && this.load()
    }
    update(e = 0) {
        if (!this.destroyed) {
            const t = ve.shared.elapsedMS * this.source.playbackRate;
            this._msToNextUpdate = Math.floor(this._msToNextUpdate - t), (!this._updateFPS || this._msToNextUpdate <= 0) && (super.update(), this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0)
        }
    }
    load() {
        if (this._load) return this._load;
        const e = this.source;
        return (e.readyState === e.HAVE_ENOUGH_DATA || e.readyState === e.HAVE_FUTURE_DATA) && e.width && e.height && (e.complete = !0), e.addEventListener("play", this._onPlayStart.bind(this)), e.addEventListener("pause", this._onPlayStop.bind(this)), this._isSourceReady() ? this._onCanPlay() : (e.addEventListener("canplay", this._onCanPlay), e.addEventListener("canplaythrough", this._onCanPlay), e.addEventListener("error", this._onError, !0)), this._load = new Promise(t => {
            this.valid ? t(this) : (this._resolve = t, e.load())
        }), this._load
    }
    _onError(e) {
        this.source.removeEventListener("error", this._onError, !0), this.onError.emit(e)
    }
    _isSourcePlaying() {
        const e = this.source;
        return !e.paused && !e.ended && this._isSourceReady()
    }
    _isSourceReady() {
        return this.source.readyState > 2
    }
    _onPlayStart() {
        this.valid || this._onCanPlay(), this.autoUpdate && !this._isConnectedToTicker && (ve.shared.add(this.update, this), this._isConnectedToTicker = !0)
    }
    _onPlayStop() {
        this._isConnectedToTicker && (ve.shared.remove(this.update, this), this._isConnectedToTicker = !1)
    }
    _onCanPlay() {
        const e = this.source;
        e.removeEventListener("canplay", this._onCanPlay), e.removeEventListener("canplaythrough", this._onCanPlay);
        const t = this.valid;
        this.resize(e.videoWidth, e.videoHeight), !t && this._resolve && (this._resolve(this), this._resolve = null), this._isSourcePlaying() ? this._onPlayStart() : this.autoPlay && e.play()
    }
    dispose() {
        this._isConnectedToTicker && (ve.shared.remove(this.update, this), this._isConnectedToTicker = !1);
        const e = this.source;
        e && (e.removeEventListener("error", this._onError, !0), e.pause(), e.src = "", e.load()), super.dispose()
    }
    get autoUpdate() {
        return this._autoUpdate
    }
    set autoUpdate(e) {
        e !== this._autoUpdate && (this._autoUpdate = e, !this._autoUpdate && this._isConnectedToTicker ? (ve.shared.remove(this.update, this), this._isConnectedToTicker = !1) : this._autoUpdate && !this._isConnectedToTicker && this._isSourcePlaying() && (ve.shared.add(this.update, this), this._isConnectedToTicker = !0))
    }
    get updateFPS() {
        return this._updateFPS
    }
    set updateFPS(e) {
        e !== this._updateFPS && (this._updateFPS = e)
    }
    static test(e, t) {
        return globalThis.HTMLVideoElement && e instanceof HTMLVideoElement || qo.TYPES.includes(t)
    }
};
let Ah = qo;
Ah.TYPES = ["mp4", "m4v", "webm", "ogg", "ogv", "h264", "avi", "mov"];
Ah.MIME_TYPES = {
    ogv: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/mp4"
};
Ho.push(Pi, zf, wb, Ah, As, Ms, _d, bb);
class $n {
    constructor() {
        this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0, this.rect = null, this.updateID = -1
    }
    isEmpty() {
        return this.minX > this.maxX || this.minY > this.maxY
    }
    clear() {
        this.minX = 1 / 0, this.minY = 1 / 0, this.maxX = -1 / 0, this.maxY = -1 / 0
    }
    getRectangle(t) {
        return this.minX > this.maxX || this.minY > this.maxY ? _t.EMPTY : (t = t || new _t(0, 0, 1, 1), t.x = this.minX, t.y = this.minY, t.width = this.maxX - this.minX, t.height = this.maxY - this.minY, t)
    }
    addPoint(t) {
        this.minX = Math.min(this.minX, t.x), this.maxX = Math.max(this.maxX, t.x), this.minY = Math.min(this.minY, t.y), this.maxY = Math.max(this.maxY, t.y)
    }
    addPointMatrix(t, r) {
        const {
            a: i,
            b: s,
            c: n,
            d: a,
            tx: o,
            ty: h
        } = t, l = i * r.x + n * r.y + o, c = s * r.x + a * r.y + h;
        this.minX = Math.min(this.minX, l), this.maxX = Math.max(this.maxX, l), this.minY = Math.min(this.minY, c), this.maxY = Math.max(this.maxY, c)
    }
    addQuad(t) {
        let r = this.minX,
            i = this.minY,
            s = this.maxX,
            n = this.maxY,
            a = t[0],
            o = t[1];
        r = a < r ? a : r, i = o < i ? o : i, s = a > s ? a : s, n = o > n ? o : n, a = t[2], o = t[3], r = a < r ? a : r, i = o < i ? o : i, s = a > s ? a : s, n = o > n ? o : n, a = t[4], o = t[5], r = a < r ? a : r, i = o < i ? o : i, s = a > s ? a : s, n = o > n ? o : n, a = t[6], o = t[7], r = a < r ? a : r, i = o < i ? o : i, s = a > s ? a : s, n = o > n ? o : n, this.minX = r, this.minY = i, this.maxX = s, this.maxY = n
    }
    addFrame(t, r, i, s, n) {
        this.addFrameMatrix(t.worldTransform, r, i, s, n)
    }
    addFrameMatrix(t, r, i, s, n) {
        const a = t.a,
            o = t.b,
            h = t.c,
            l = t.d,
            c = t.tx,
            f = t.ty;
        let p = this.minX,
            m = this.minY,
            v = this.maxX,
            _ = this.maxY,
            y = a * r + h * i + c,
            A = o * r + l * i + f;
        p = y < p ? y : p, m = A < m ? A : m, v = y > v ? y : v, _ = A > _ ? A : _, y = a * s + h * i + c, A = o * s + l * i + f, p = y < p ? y : p, m = A < m ? A : m, v = y > v ? y : v, _ = A > _ ? A : _, y = a * r + h * n + c, A = o * r + l * n + f, p = y < p ? y : p, m = A < m ? A : m, v = y > v ? y : v, _ = A > _ ? A : _, y = a * s + h * n + c, A = o * s + l * n + f, p = y < p ? y : p, m = A < m ? A : m, v = y > v ? y : v, _ = A > _ ? A : _, this.minX = p, this.minY = m, this.maxX = v, this.maxY = _
    }
    addVertexData(t, r, i) {
        let s = this.minX,
            n = this.minY,
            a = this.maxX,
            o = this.maxY;
        for (let h = r; h < i; h += 2) {
            const l = t[h],
                c = t[h + 1];
            s = l < s ? l : s, n = c < n ? c : n, a = l > a ? l : a, o = c > o ? c : o
        }
        this.minX = s, this.minY = n, this.maxX = a, this.maxY = o
    }
    addVertices(t, r, i, s) {
        this.addVerticesMatrix(t.worldTransform, r, i, s)
    }
    addVerticesMatrix(t, r, i, s, n = 0, a = n) {
        const o = t.a,
            h = t.b,
            l = t.c,
            c = t.d,
            f = t.tx,
            p = t.ty;
        let m = this.minX,
            v = this.minY,
            _ = this.maxX,
            y = this.maxY;
        for (let A = i; A < s; A += 2) {
            const I = r[A],
                x = r[A + 1],
                S = o * I + l * x + f,
                $ = c * x + h * I + p;
            m = Math.min(m, S - n), _ = Math.max(_, S + n), v = Math.min(v, $ - a), y = Math.max(y, $ + a)
        }
        this.minX = m, this.minY = v, this.maxX = _, this.maxY = y
    }
    addBounds(t) {
        const r = this.minX,
            i = this.minY,
            s = this.maxX,
            n = this.maxY;
        this.minX = t.minX < r ? t.minX : r, this.minY = t.minY < i ? t.minY : i, this.maxX = t.maxX > s ? t.maxX : s, this.maxY = t.maxY > n ? t.maxY : n
    }
    addBoundsMask(t, r) {
        const i = t.minX > r.minX ? t.minX : r.minX,
            s = t.minY > r.minY ? t.minY : r.minY,
            n = t.maxX < r.maxX ? t.maxX : r.maxX,
            a = t.maxY < r.maxY ? t.maxY : r.maxY;
        if (i <= n && s <= a) {
            const o = this.minX,
                h = this.minY,
                l = this.maxX,
                c = this.maxY;
            this.minX = i < o ? i : o, this.minY = s < h ? s : h, this.maxX = n > l ? n : l, this.maxY = a > c ? a : c
        }
    }
    addBoundsMatrix(t, r) {
        this.addFrameMatrix(r, t.minX, t.minY, t.maxX, t.maxY)
    }
    addBoundsArea(t, r) {
        const i = t.minX > r.x ? t.minX : r.x,
            s = t.minY > r.y ? t.minY : r.y,
            n = t.maxX < r.x + r.width ? t.maxX : r.x + r.width,
            a = t.maxY < r.y + r.height ? t.maxY : r.y + r.height;
        if (i <= n && s <= a) {
            const o = this.minX,
                h = this.minY,
                l = this.maxX,
                c = this.maxY;
            this.minX = i < o ? i : o, this.minY = s < h ? s : h, this.maxX = n > l ? n : l, this.maxY = a > c ? a : c
        }
    }
    pad(t = 0, r = t) {
        this.isEmpty() || (this.minX -= t, this.maxX += t, this.minY -= r, this.maxY += r)
    }
    addFramePad(t, r, i, s, n, a) {
        t -= n, r -= a, i += n, s += a, this.minX = this.minX < t ? this.minX : t, this.maxX = this.maxX > i ? this.maxX : i, this.minY = this.minY < r ? this.minY : r, this.maxY = this.maxY > s ? this.maxY : s
    }
}
class Kt extends Hi {
    constructor() {
        super(), this.tempDisplayObjectParent = null, this.transform = new Th, this.alpha = 1, this.visible = !0, this.renderable = !0, this.cullable = !1, this.cullArea = null, this.parent = null, this.worldAlpha = 1, this._lastSortedIndex = 0, this._zIndex = 0, this.filterArea = null, this.filters = null, this._enabledFilters = null, this._bounds = new $n, this._localBounds = null, this._boundsID = 0, this._boundsRect = null, this._localBoundsRect = null, this._mask = null, this._maskRefCount = 0, this._destroyed = !1, this.isSprite = !1, this.isMask = !1
    }
    static mixin(t) {
        const r = Object.keys(t);
        for (let i = 0; i < r.length; ++i) {
            const s = r[i];
            Object.defineProperty(Kt.prototype, s, Object.getOwnPropertyDescriptor(t, s))
        }
    }
    get destroyed() {
        return this._destroyed
    }
    _recursivePostUpdateTransform() {
        this.parent ? (this.parent._recursivePostUpdateTransform(), this.transform.updateTransform(this.parent.transform)) : this.transform.updateTransform(this._tempDisplayObjectParent.transform)
    }
    updateTransform() {
        this._boundsID++, this.transform.updateTransform(this.parent.transform), this.worldAlpha = this.alpha * this.parent.worldAlpha
    }
    getBounds(t, r) {
        return t || (this.parent ? (this._recursivePostUpdateTransform(), this.updateTransform()) : (this.parent = this._tempDisplayObjectParent, this.updateTransform(), this.parent = null)), this._bounds.updateID !== this._boundsID && (this.calculateBounds(), this._bounds.updateID = this._boundsID), r || (this._boundsRect || (this._boundsRect = new _t), r = this._boundsRect), this._bounds.getRectangle(r)
    }
    getLocalBounds(t) {
        t || (this._localBoundsRect || (this._localBoundsRect = new _t), t = this._localBoundsRect), this._localBounds || (this._localBounds = new $n);
        const r = this.transform,
            i = this.parent;
        this.parent = null, this.transform = this._tempDisplayObjectParent.transform;
        const s = this._bounds,
            n = this._boundsID;
        this._bounds = this._localBounds;
        const a = this.getBounds(!1, t);
        return this.parent = i, this.transform = r, this._bounds = s, this._bounds.updateID += this._boundsID - n, a
    }
    toGlobal(t, r, i = !1) {
        return i || (this._recursivePostUpdateTransform(), this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent, this.displayObjectUpdateTransform(), this.parent = null)), this.worldTransform.apply(t, r)
    }
    toLocal(t, r, i, s) {
        return r && (t = r.toGlobal(t, i, s)), s || (this._recursivePostUpdateTransform(), this.parent ? this.displayObjectUpdateTransform() : (this.parent = this._tempDisplayObjectParent, this.displayObjectUpdateTransform(), this.parent = null)), this.worldTransform.applyInverse(t, i)
    }
    setParent(t) {
        if (!t || !t.addChild) throw new Error("setParent: Argument must be a Container");
        return t.addChild(this), t
    }
    removeFromParent() {
        var t;
        (t = this.parent) == null || t.removeChild(this)
    }
    setTransform(t = 0, r = 0, i = 1, s = 1, n = 0, a = 0, o = 0, h = 0, l = 0) {
        return this.position.x = t, this.position.y = r, this.scale.x = i || 1, this.scale.y = s || 1, this.rotation = n, this.skew.x = a, this.skew.y = o, this.pivot.x = h, this.pivot.y = l, this
    }
    destroy(t) {
        this.removeFromParent(), this._destroyed = !0, this.transform = null, this.parent = null, this._bounds = null, this.mask = null, this.cullArea = null, this.filters = null, this.filterArea = null, this.hitArea = null, this.eventMode = "auto", this.interactiveChildren = !1, this.emit("destroyed"), this.removeAllListeners()
    }
    get _tempDisplayObjectParent() {
        return this.tempDisplayObjectParent === null && (this.tempDisplayObjectParent = new Eb), this.tempDisplayObjectParent
    }
    enableTempParent() {
        const t = this.parent;
        return this.parent = this._tempDisplayObjectParent, t
    }
    disableTempParent(t) {
        this.parent = t
    }
    get x() {
        return this.position.x
    }
    set x(t) {
        this.transform.position.x = t
    }
    get y() {
        return this.position.y
    }
    set y(t) {
        this.transform.position.y = t
    }
    get worldTransform() {
        return this.transform.worldTransform
    }
    get localTransform() {
        return this.transform.localTransform
    }
    get position() {
        return this.transform.position
    }
    set position(t) {
        this.transform.position.copyFrom(t)
    }
    get scale() {
        return this.transform.scale
    }
    set scale(t) {
        this.transform.scale.copyFrom(t)
    }
    get pivot() {
        return this.transform.pivot
    }
    set pivot(t) {
        this.transform.pivot.copyFrom(t)
    }
    get skew() {
        return this.transform.skew
    }
    set skew(t) {
        this.transform.skew.copyFrom(t)
    }
    get rotation() {
        return this.transform.rotation
    }
    set rotation(t) {
        this.transform.rotation = t
    }
    get angle() {
        return this.transform.rotation * yx
    }
    set angle(t) {
        this.transform.rotation = t * xx
    }
    get zIndex() {
        return this._zIndex
    }
    set zIndex(t) {
        this._zIndex = t, this.parent && (this.parent.sortDirty = !0)
    }
    get worldVisible() {
        let t = this;
        do {
            if (!t.visible) return !1;
            t = t.parent
        } while (t);
        return !0
    }
    get mask() {
        return this._mask
    }
    set mask(t) {
        if (this._mask !== t) {
            if (this._mask) {
                const r = this._mask.isMaskData ? this._mask.maskObject : this._mask;
                r && (r._maskRefCount--, r._maskRefCount === 0 && (r.renderable = !0, r.isMask = !1))
            }
            if (this._mask = t, this._mask) {
                const r = this._mask.isMaskData ? this._mask.maskObject : this._mask;
                r && (r._maskRefCount === 0 && (r.renderable = !1, r.isMask = !0), r._maskRefCount++)
            }
        }
    }
}
class Eb extends Kt {
    constructor() {
        super(...arguments), this.sortDirty = null
    }
}
Kt.prototype.displayObjectUpdateTransform = Kt.prototype.updateTransform;
const Tb = new Gt;

function Ab(e, t) {
    return e.zIndex === t.zIndex ? e._lastSortedIndex - t._lastSortedIndex : e.zIndex - t.zIndex
}
const Zo = class extends Kt {
    constructor() {
        super(), this.children = [], this.sortableChildren = Zo.defaultSortableChildren, this.sortDirty = !1
    }
    onChildrenChange(e) {}
    addChild(...e) {
        if (e.length > 1)
            for (let t = 0; t < e.length; t++) this.addChild(e[t]);
        else {
            const t = e[0];
            t.parent && t.parent.removeChild(t), t.parent = this, this.sortDirty = !0, t.transform._parentID = -1, this.children.push(t), this._boundsID++, this.onChildrenChange(this.children.length - 1), this.emit("childAdded", t, this, this.children.length - 1), t.emit("added", this)
        }
        return e[0]
    }
    addChildAt(e, t) {
        if (t < 0 || t > this.children.length) throw new Error(`${e}addChildAt: The index ${t} supplied is out of bounds ${this.children.length}`);
        return e.parent && e.parent.removeChild(e), e.parent = this, this.sortDirty = !0, e.transform._parentID = -1, this.children.splice(t, 0, e), this._boundsID++, this.onChildrenChange(t), e.emit("added", this), this.emit("childAdded", e, this, t), e
    }
    swapChildren(e, t) {
        if (e === t) return;
        const r = this.getChildIndex(e),
            i = this.getChildIndex(t);
        this.children[r] = t, this.children[i] = e, this.onChildrenChange(r < i ? r : i)
    }
    getChildIndex(e) {
        const t = this.children.indexOf(e);
        if (t === -1) throw new Error("The supplied DisplayObject must be a child of the caller");
        return t
    }
    setChildIndex(e, t) {
        if (t < 0 || t >= this.children.length) throw new Error(`The index ${t} supplied is out of bounds ${this.children.length}`);
        const r = this.getChildIndex(e);
        gs(this.children, r, 1), this.children.splice(t, 0, e), this.onChildrenChange(t)
    }
    getChildAt(e) {
        if (e < 0 || e >= this.children.length) throw new Error(`getChildAt: Index (${e}) does not exist.`);
        return this.children[e]
    }
    removeChild(...e) {
        if (e.length > 1)
            for (let t = 0; t < e.length; t++) this.removeChild(e[t]);
        else {
            const t = e[0],
                r = this.children.indexOf(t);
            if (r === -1) return null;
            t.parent = null, t.transform._parentID = -1, gs(this.children, r, 1), this._boundsID++, this.onChildrenChange(r), t.emit("removed", this), this.emit("childRemoved", t, this, r)
        }
        return e[0]
    }
    removeChildAt(e) {
        const t = this.getChildAt(e);
        return t.parent = null, t.transform._parentID = -1, gs(this.children, e, 1), this._boundsID++, this.onChildrenChange(e), t.emit("removed", this), this.emit("childRemoved", t, this, e), t
    }
    removeChildren(e = 0, t = this.children.length) {
        const r = e,
            i = t,
            s = i - r;
        let n;
        if (s > 0 && s <= i) {
            n = this.children.splice(r, s);
            for (let a = 0; a < n.length; ++a) n[a].parent = null, n[a].transform && (n[a].transform._parentID = -1);
            this._boundsID++, this.onChildrenChange(e);
            for (let a = 0; a < n.length; ++a) n[a].emit("removed", this), this.emit("childRemoved", n[a], this, a);
            return n
        } else if (s === 0 && this.children.length === 0) return [];
        throw new RangeError("removeChildren: numeric values are outside the acceptable range.")
    }
    sortChildren() {
        let e = !1;
        for (let t = 0, r = this.children.length; t < r; ++t) {
            const i = this.children[t];
            i._lastSortedIndex = t, !e && i.zIndex !== 0 && (e = !0)
        }
        e && this.children.length > 1 && this.children.sort(Ab), this.sortDirty = !1
    }
    updateTransform() {
        this.sortableChildren && this.sortDirty && this.sortChildren(), this._boundsID++, this.transform.updateTransform(this.parent.transform), this.worldAlpha = this.alpha * this.parent.worldAlpha;
        for (let e = 0, t = this.children.length; e < t; ++e) {
            const r = this.children[e];
            r.visible && r.updateTransform()
        }
    }
    calculateBounds() {
        this._bounds.clear(), this._calculateBounds();
        for (let e = 0; e < this.children.length; e++) {
            const t = this.children[e];
            if (!(!t.visible || !t.renderable))
                if (t.calculateBounds(), t._mask) {
                    const r = t._mask.isMaskData ? t._mask.maskObject : t._mask;
                    r ? (r.calculateBounds(), this._bounds.addBoundsMask(t._bounds, r._bounds)) : this._bounds.addBounds(t._bounds)
                } else t.filterArea ? this._bounds.addBoundsArea(t._bounds, t.filterArea) : this._bounds.addBounds(t._bounds)
        }
        this._bounds.updateID = this._boundsID
    }
    getLocalBounds(e, t = !1) {
        const r = super.getLocalBounds(e);
        if (!t)
            for (let i = 0, s = this.children.length; i < s; ++i) {
                const n = this.children[i];
                n.visible && n.updateTransform()
            }
        return r
    }
    _calculateBounds() {}
    _renderWithCulling(e) {
        const t = e.renderTexture.sourceFrame;
        if (!(t.width > 0 && t.height > 0)) return;
        let r, i;
        this.cullArea ? (r = this.cullArea, i = this.worldTransform) : this._render !== Zo.prototype._render && (r = this.getBounds(!0));
        const s = e.projection.transform;
        if (s && (i ? (i = Tb.copyFrom(i), i.prepend(s)) : i = s), r && t.intersects(r, i)) this._render(e);
        else if (this.cullArea) return;
        for (let n = 0, a = this.children.length; n < a; ++n) {
            const o = this.children[n],
                h = o.cullable;
            o.cullable = h || !this.cullArea, o.render(e), o.cullable = h
        }
    }
    render(e) {
        var t;
        if (!(!this.visible || this.worldAlpha <= 0 || !this.renderable))
            if (this._mask || (t = this.filters) != null && t.length) this.renderAdvanced(e);
            else if (this.cullable) this._renderWithCulling(e);
        else {
            this._render(e);
            for (let r = 0, i = this.children.length; r < i; ++r) this.children[r].render(e)
        }
    }
    renderAdvanced(e) {
        var s, n, a;
        const t = this.filters,
            r = this._mask;
        if (t) {
            this._enabledFilters || (this._enabledFilters = []), this._enabledFilters.length = 0;
            for (let o = 0; o < t.length; o++) t[o].enabled && this._enabledFilters.push(t[o])
        }
        const i = t && ((s = this._enabledFilters) == null ? void 0 : s.length) || r && (!r.isMaskData || r.enabled && (r.autoDetect || r.type !== te.NONE));
        if (i && e.batch.flush(), t && ((n = this._enabledFilters) != null && n.length) && e.filter.push(this, this._enabledFilters), r && e.mask.push(this, this._mask), this.cullable) this._renderWithCulling(e);
        else {
            this._render(e);
            for (let o = 0, h = this.children.length; o < h; ++o) this.children[o].render(e)
        }
        i && e.batch.flush(), r && e.mask.pop(this), t && ((a = this._enabledFilters) != null && a.length) && e.filter.pop()
    }
    _render(e) {}
    destroy(e) {
        super.destroy(), this.sortDirty = !1;
        const t = typeof e == "boolean" ? e : e == null ? void 0 : e.children,
            r = this.removeChildren(0, this.children.length);
        if (t)
            for (let i = 0; i < r.length; ++i) r[i].destroy(e)
    }
    get width() {
        return this.scale.x * this.getLocalBounds().width
    }
    set width(e) {
        const t = this.getLocalBounds().width;
        t !== 0 ? this.scale.x = e / t : this.scale.x = 1, this._width = e
    }
    get height() {
        return this.scale.y * this.getLocalBounds().height
    }
    set height(e) {
        const t = this.getLocalBounds().height;
        t !== 0 ? this.scale.y = e / t : this.scale.y = 1, this._height = e
    }
};
let xe = Zo;
xe.defaultSortableChildren = !1;
xe.prototype.containerUpdateTransform = xe.prototype.updateTransform;
Object.defineProperties(K, {
    SORTABLE_CHILDREN: {
        get() {
            return xe.defaultSortableChildren
        },
        set(e) {
            Et("7.1.0", "settings.SORTABLE_CHILDREN is deprecated, use Container.defaultSortableChildren"), xe.defaultSortableChildren = e
        }
    }
});
const is = new Lt,
    Cb = new Uint16Array([0, 1, 2, 0, 2, 3]);
class Ps extends xe {
    constructor(t) {
        super(), this._anchor = new gr(this._onAnchorUpdate, this, t ? t.defaultAnchor.x : 0, t ? t.defaultAnchor.y : 0), this._texture = null, this._width = 0, this._height = 0, this._tintColor = new Ot(16777215), this._tintRGB = null, this.tint = 16777215, this.blendMode = lt.NORMAL, this._cachedTint = 16777215, this.uvs = null, this.texture = t || st.EMPTY, this.vertexData = new Float32Array(8), this.vertexTrimmedData = null, this._transformID = -1, this._textureID = -1, this._transformTrimmedID = -1, this._textureTrimmedID = -1, this.indices = Cb, this.pluginName = "batch", this.isSprite = !0, this._roundPixels = K.ROUND_PIXELS
    }
    _onTextureUpdate() {
        this._textureID = -1, this._textureTrimmedID = -1, this._cachedTint = 16777215, this._width && (this.scale.x = Mi(this.scale.x) * this._width / this._texture.orig.width), this._height && (this.scale.y = Mi(this.scale.y) * this._height / this._texture.orig.height)
    }
    _onAnchorUpdate() {
        this._transformID = -1, this._transformTrimmedID = -1
    }
    calculateVertices() {
        const t = this._texture;
        if (this._transformID === this.transform._worldID && this._textureID === t._updateID) return;
        this._textureID !== t._updateID && (this.uvs = this._texture._uvs.uvsFloat32), this._transformID = this.transform._worldID, this._textureID = t._updateID;
        const r = this.transform.worldTransform,
            i = r.a,
            s = r.b,
            n = r.c,
            a = r.d,
            o = r.tx,
            h = r.ty,
            l = this.vertexData,
            c = t.trim,
            f = t.orig,
            p = this._anchor;
        let m = 0,
            v = 0,
            _ = 0,
            y = 0;
        if (c ? (v = c.x - p._x * f.width, m = v + c.width, y = c.y - p._y * f.height, _ = y + c.height) : (v = -p._x * f.width, m = v + f.width, y = -p._y * f.height, _ = y + f.height), l[0] = i * v + n * y + o, l[1] = a * y + s * v + h, l[2] = i * m + n * y + o, l[3] = a * y + s * m + h, l[4] = i * m + n * _ + o, l[5] = a * _ + s * m + h, l[6] = i * v + n * _ + o, l[7] = a * _ + s * v + h, this._roundPixels) {
            const A = K.RESOLUTION;
            for (let I = 0; I < l.length; ++I) l[I] = Math.round(l[I] * A) / A
        }
    }
    calculateTrimmedVertices() {
        if (!this.vertexTrimmedData) this.vertexTrimmedData = new Float32Array(8);
        else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID) return;
        this._transformTrimmedID = this.transform._worldID, this._textureTrimmedID = this._texture._updateID;
        const t = this._texture,
            r = this.vertexTrimmedData,
            i = t.orig,
            s = this._anchor,
            n = this.transform.worldTransform,
            a = n.a,
            o = n.b,
            h = n.c,
            l = n.d,
            c = n.tx,
            f = n.ty,
            p = -s._x * i.width,
            m = p + i.width,
            v = -s._y * i.height,
            _ = v + i.height;
        r[0] = a * p + h * v + c, r[1] = l * v + o * p + f, r[2] = a * m + h * v + c, r[3] = l * v + o * m + f, r[4] = a * m + h * _ + c, r[5] = l * _ + o * m + f, r[6] = a * p + h * _ + c, r[7] = l * _ + o * p + f
    }
    _render(t) {
        this.calculateVertices(), t.batch.setObjectRenderer(t.plugins[this.pluginName]), t.plugins[this.pluginName].render(this)
    }
    _calculateBounds() {
        const t = this._texture.trim,
            r = this._texture.orig;
        !t || t.width === r.width && t.height === r.height ? (this.calculateVertices(), this._bounds.addQuad(this.vertexData)) : (this.calculateTrimmedVertices(), this._bounds.addQuad(this.vertexTrimmedData))
    }
    getLocalBounds(t) {
        return this.children.length === 0 ? (this._localBounds || (this._localBounds = new $n), this._localBounds.minX = this._texture.orig.width * -this._anchor._x, this._localBounds.minY = this._texture.orig.height * -this._anchor._y, this._localBounds.maxX = this._texture.orig.width * (1 - this._anchor._x), this._localBounds.maxY = this._texture.orig.height * (1 - this._anchor._y), t || (this._localBoundsRect || (this._localBoundsRect = new _t), t = this._localBoundsRect), this._localBounds.getRectangle(t)) : super.getLocalBounds.call(this, t)
    }
    containsPoint(t) {
        this.worldTransform.applyInverse(t, is);
        const r = this._texture.orig.width,
            i = this._texture.orig.height,
            s = -r * this.anchor.x;
        let n = 0;
        return is.x >= s && is.x < s + r && (n = -i * this.anchor.y, is.y >= n && is.y < n + i)
    }
    destroy(t) {
        if (super.destroy(t), this._texture.off("update", this._onTextureUpdate, this), this._anchor = null, typeof t == "boolean" ? t : t == null ? void 0 : t.texture) {
            const i = typeof t == "boolean" ? t : t == null ? void 0 : t.baseTexture;
            this._texture.destroy(!!i)
        }
        this._texture = null
    }
    static from(t, r) {
        const i = t instanceof st ? t : st.from(t, r);
        return new Ps(i)
    }
    set roundPixels(t) {
        this._roundPixels !== t && (this._transformID = -1), this._roundPixels = t
    }
    get roundPixels() {
        return this._roundPixels
    }
    get width() {
        return Math.abs(this.scale.x) * this._texture.orig.width
    }
    set width(t) {
        const r = Mi(this.scale.x) || 1;
        this.scale.x = r * t / this._texture.orig.width, this._width = t
    }
    get height() {
        return Math.abs(this.scale.y) * this._texture.orig.height
    }
    set height(t) {
        const r = Mi(this.scale.y) || 1;
        this.scale.y = r * t / this._texture.orig.height, this._height = t
    }
    get anchor() {
        return this._anchor
    }
    set anchor(t) {
        this._anchor.copyFrom(t)
    }
    get tint() {
        return this._tintColor.value
    }
    set tint(t) {
        this._tintColor.setValue(t), this._tintRGB = this._tintColor.toLittleEndianNumber()
    }
    get tintValue() {
        return this._tintColor.toNumber()
    }
    get texture() {
        return this._texture
    }
    set texture(t) {
        this._texture !== t && (this._texture && this._texture.off("update", this._onTextureUpdate, this), this._texture = t || st.EMPTY, this._cachedTint = 16777215, this._textureID = -1, this._textureTrimmedID = -1, t && (t.baseTexture.valid ? this._onTextureUpdate() : t.once("update", this._onTextureUpdate, this)))
    }
}
const yd = new Gt;
Kt.prototype._cacheAsBitmap = !1;
Kt.prototype._cacheData = null;
Kt.prototype._cacheAsBitmapResolution = null;
Kt.prototype._cacheAsBitmapMultisample = null;
class Sb {
    constructor() {
        this.textureCacheId = null, this.originalRender = null, this.originalRenderCanvas = null, this.originalCalculateBounds = null, this.originalGetLocalBounds = null, this.originalUpdateTransform = null, this.originalDestroy = null, this.originalMask = null, this.originalFilterArea = null, this.originalContainsPoint = null, this.sprite = null
    }
}
Object.defineProperties(Kt.prototype, {
    cacheAsBitmapResolution: {
        get() {
            return this._cacheAsBitmapResolution
        },
        set(e) {
            e !== this._cacheAsBitmapResolution && (this._cacheAsBitmapResolution = e, this.cacheAsBitmap && (this.cacheAsBitmap = !1, this.cacheAsBitmap = !0))
        }
    },
    cacheAsBitmapMultisample: {
        get() {
            return this._cacheAsBitmapMultisample
        },
        set(e) {
            e !== this._cacheAsBitmapMultisample && (this._cacheAsBitmapMultisample = e, this.cacheAsBitmap && (this.cacheAsBitmap = !1, this.cacheAsBitmap = !0))
        }
    },
    cacheAsBitmap: {
        get() {
            return this._cacheAsBitmap
        },
        set(e) {
            if (this._cacheAsBitmap === e) return;
            this._cacheAsBitmap = e;
            let t;
            e ? (this._cacheData || (this._cacheData = new Sb), t = this._cacheData, t.originalRender = this.render, t.originalRenderCanvas = this.renderCanvas, t.originalUpdateTransform = this.updateTransform, t.originalCalculateBounds = this.calculateBounds, t.originalGetLocalBounds = this.getLocalBounds, t.originalDestroy = this.destroy, t.originalContainsPoint = this.containsPoint, t.originalMask = this._mask, t.originalFilterArea = this.filterArea, this.render = this._renderCached, this.renderCanvas = this._renderCachedCanvas, this.destroy = this._cacheAsBitmapDestroy) : (t = this._cacheData, t.sprite && this._destroyCachedDisplayObject(), this.render = t.originalRender, this.renderCanvas = t.originalRenderCanvas, this.calculateBounds = t.originalCalculateBounds, this.getLocalBounds = t.originalGetLocalBounds, this.destroy = t.originalDestroy, this.updateTransform = t.originalUpdateTransform, this.containsPoint = t.originalContainsPoint, this._mask = t.originalMask, this.filterArea = t.originalFilterArea)
        }
    }
});
Kt.prototype._renderCached = function(t) {
    !this.visible || this.worldAlpha <= 0 || !this.renderable || (this._initCachedDisplayObject(t), this._cacheData.sprite.transform._worldID = this.transform._worldID, this._cacheData.sprite.worldAlpha = this.worldAlpha, this._cacheData.sprite._render(t))
};
Kt.prototype._initCachedDisplayObject = function(t) {
    var p, m;
    if ((p = this._cacheData) != null && p.sprite) return;
    const r = this.alpha;
    this.alpha = 1, t.batch.flush();
    const i = this.getLocalBounds(null, !0).clone();
    if ((m = this.filters) != null && m.length) {
        const v = this.filters[0].padding;
        i.pad(v)
    }
    i.ceil(K.RESOLUTION);
    const s = t.renderTexture.current,
        n = t.renderTexture.sourceFrame.clone(),
        a = t.renderTexture.destinationFrame.clone(),
        o = t.projection.transform,
        h = ni.create({
            width: i.width,
            height: i.height,
            resolution: this.cacheAsBitmapResolution || t.resolution,
            multisample: this.cacheAsBitmapMultisample??t.multisample
        }),
        l = `cacheAsBitmap_${ei()}`;
    this._cacheData.textureCacheId = l, ct.addToCache(h.baseTexture, l), st.addToCache(h, l);
    const c = this.transform.localTransform.copyTo(yd).invert().translate(-i.x, -i.y);
    this.render = this._cacheData.originalRender, t.render(this, {
        renderTexture: h,
        clear: !0,
        transform: c,
        skipUpdateTransform: !1
    }), t.framebuffer.blit(), t.projection.transform = o, t.renderTexture.bind(s, n, a), this.render = this._renderCached, this.updateTransform = this.displayObjectUpdateTransform, this.calculateBounds = this._calculateCachedBounds, this.getLocalBounds = this._getCachedLocalBounds, this._mask = null, this.filterArea = null, this.alpha = r;
    const f = new Ps(h);
    f.transform.worldTransform = this.transform.worldTransform, f.anchor.x = -(i.x / i.width), f.anchor.y = -(i.y / i.height), f.alpha = r, f._bounds = this._bounds, this._cacheData.sprite = f, this.transform._parentID = -1, this.parent ? this.updateTransform() : (this.enableTempParent(), this.updateTransform(), this.disableTempParent(null)), this.containsPoint = f.containsPoint.bind(f)
};
Kt.prototype._renderCachedCanvas = function(t) {
    !this.visible || this.worldAlpha <= 0 || !this.renderable || (this._initCachedDisplayObjectCanvas(t), this._cacheData.sprite.worldAlpha = this.worldAlpha, this._cacheData.sprite._renderCanvas(t))
};
Kt.prototype._initCachedDisplayObjectCanvas = function(t) {
    var c;
    if ((c = this._cacheData) != null && c.sprite) return;
    const r = this.getLocalBounds(null, !0),
        i = this.alpha;
    this.alpha = 1;
    const s = t.canvasContext.activeContext,
        n = t._projTransform;
    r.ceil(K.RESOLUTION);
    const a = ni.create({
            width: r.width,
            height: r.height
        }),
        o = `cacheAsBitmap_${ei()}`;
    this._cacheData.textureCacheId = o, ct.addToCache(a.baseTexture, o), st.addToCache(a, o);
    const h = yd;
    this.transform.localTransform.copyTo(h), h.invert(), h.tx -= r.x, h.ty -= r.y, this.renderCanvas = this._cacheData.originalRenderCanvas, t.render(this, {
        renderTexture: a,
        clear: !0,
        transform: h,
        skipUpdateTransform: !1
    }), t.canvasContext.activeContext = s, t._projTransform = n, this.renderCanvas = this._renderCachedCanvas, this.updateTransform = this.displayObjectUpdateTransform, this.calculateBounds = this._calculateCachedBounds, this.getLocalBounds = this._getCachedLocalBounds, this._mask = null, this.filterArea = null, this.alpha = i;
    const l = new Ps(a);
    l.transform.worldTransform = this.transform.worldTransform, l.anchor.x = -(r.x / r.width), l.anchor.y = -(r.y / r.height), l.alpha = i, l._bounds = this._bounds, this._cacheData.sprite = l, this.transform._parentID = -1, this.parent ? this.updateTransform() : (this.parent = t._tempDisplayObjectParent, this.updateTransform(), this.parent = null), this.containsPoint = l.containsPoint.bind(l)
};
Kt.prototype._calculateCachedBounds = function() {
    this._bounds.clear(), this._cacheData.sprite.transform._worldID = this.transform._worldID, this._cacheData.sprite._calculateBounds(), this._bounds.updateID = this._boundsID
};
Kt.prototype._getCachedLocalBounds = function() {
    return this._cacheData.sprite.getLocalBounds(null)
};
Kt.prototype._destroyCachedDisplayObject = function() {
    this._cacheData.sprite._texture.destroy(!0), this._cacheData.sprite = null, ct.removeFromCache(this._cacheData.textureCacheId), st.removeFromCache(this._cacheData.textureCacheId), this._cacheData.textureCacheId = null
};
Kt.prototype._cacheAsBitmapDestroy = function(t) {
    this.cacheAsBitmap = !1, this.destroy(t)
};
Kt.prototype.name = null;
xe.prototype.getChildByName = function(t, r) {
    for (let i = 0, s = this.children.length; i < s; i++)
        if (this.children[i].name === t) return this.children[i];
    if (r)
        for (let i = 0, s = this.children.length; i < s; i++) {
            const n = this.children[i];
            if (!n.getChildByName) continue;
            const a = n.getChildByName(t, !0);
            if (a) return a
        }
    return null
};
Kt.prototype.getGlobalPosition = function(t = new Lt, r = !1) {
    return this.parent ? this.parent.toGlobal(this.position, t, r) : (t.x = this.position.x, t.y = this.position.y), t
};
var Ib = `varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float uAlpha;

void main(void)
{
   gl_FragColor = texture2D(uSampler, vTextureCoord) * uAlpha;
}
`;
class xd extends se {
    constructor(t = 1) {
        super(yb, Ib, {
            uAlpha: 1
        }), this.alpha = t
    }
    get alpha() {
        return this.uniforms.uAlpha
    }
    set alpha(t) {
        this.uniforms.uAlpha = t
    }
}
const Rb = {
        5: [.153388, .221461, .250301],
        7: [.071303, .131514, .189879, .214607],
        9: [.028532, .067234, .124009, .179044, .20236],
        11: [.0093, .028002, .065984, .121703, .175713, .198596],
        13: [.002406, .009255, .027867, .065666, .121117, .174868, .197641],
        15: [489e-6, .002403, .009246, .02784, .065602, .120999, .174697, .197448]
    },
    Mb = ["varying vec2 vBlurTexCoords[%size%];", "uniform sampler2D uSampler;", "void main(void)", "{", "    gl_FragColor = vec4(0.0);", "    %blur%", "}"].join(`
`);

function Pb(e) {
    const t = Rb[e],
        r = t.length;
    let i = Mb,
        s = "";
    const n = "gl_FragColor += texture2D(uSampler, vBlurTexCoords[%index%]) * %value%;";
    let a;
    for (let o = 0; o < e; o++) {
        let h = n.replace("%index%", o.toString());
        a = o, o >= r && (a = e - o - 1), h = h.replace("%value%", t[a].toString()), s += h, s += `
`
    }
    return i = i.replace("%blur%", s), i = i.replace("%size%", e.toString()), i
}
const Nb = `
    attribute vec2 aVertexPosition;

    uniform mat3 projectionMatrix;

    uniform float strength;

    varying vec2 vBlurTexCoords[%size%];

    uniform vec4 inputSize;
    uniform vec4 outputFrame;

    vec4 filterVertexPosition( void )
    {
        vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

        return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
    }

    vec2 filterTextureCoord( void )
    {
        return aVertexPosition * (outputFrame.zw * inputSize.zw);
    }

    void main(void)
    {
        gl_Position = filterVertexPosition();

        vec2 textureCoord = filterTextureCoord();
        %blur%
    }`;

function Db(e, t) {
    const r = Math.ceil(e / 2);
    let i = Nb,
        s = "",
        n;
    t ? n = "vBlurTexCoords[%index%] =  textureCoord + vec2(%sampleIndex% * strength, 0.0);" : n = "vBlurTexCoords[%index%] =  textureCoord + vec2(0.0, %sampleIndex% * strength);";
    for (let a = 0; a < e; a++) {
        let o = n.replace("%index%", a.toString());
        o = o.replace("%sampleIndex%", `${a-(r-1)}.0`), s += o, s += `
`
    }
    return i = i.replace("%blur%", s), i = i.replace("%size%", e.toString()), i
}
class Ko extends se {
    constructor(t, r = 8, i = 4, s = se.defaultResolution, n = 5) {
        const a = Db(n, t),
            o = Pb(n);
        super(a, o), this.horizontal = t, this.resolution = s, this._quality = 0, this.quality = i, this.blur = r
    }
    apply(t, r, i, s) {
        if (i ? this.horizontal ? this.uniforms.strength = 1 / i.width * (i.width / r.width) : this.uniforms.strength = 1 / i.height * (i.height / r.height) : this.horizontal ? this.uniforms.strength = 1 / t.renderer.width * (t.renderer.width / r.width) : this.uniforms.strength = 1 / t.renderer.height * (t.renderer.height / r.height), this.uniforms.strength *= this.strength, this.uniforms.strength /= this.passes, this.passes === 1) t.applyFilter(this, r, i, s);
        else {
            const n = t.getFilterTexture(),
                a = t.renderer;
            let o = r,
                h = n;
            this.state.blend = !1, t.applyFilter(this, o, h, Je.CLEAR);
            for (let l = 1; l < this.passes - 1; l++) {
                t.bindAndClear(o, Je.BLIT), this.uniforms.uSampler = h;
                const c = h;
                h = o, o = c, a.shader.bind(this), a.geometry.draw(5)
            }
            this.state.blend = !0, t.applyFilter(this, h, i, s), t.returnFilterTexture(n)
        }
    }
    get blur() {
        return this.strength
    }
    set blur(t) {
        this.padding = 1 + Math.abs(t) * 2, this.strength = t
    }
    get quality() {
        return this._quality
    }
    set quality(t) {
        this._quality = t, this.passes = t
    }
}
class Bb extends se {
    constructor(t = 8, r = 4, i = se.defaultResolution, s = 5) {
        super(), this._repeatEdgePixels = !1, this.blurXFilter = new Ko(!0, t, r, i, s), this.blurYFilter = new Ko(!1, t, r, i, s), this.resolution = i, this.quality = r, this.blur = t, this.repeatEdgePixels = !1
    }
    apply(t, r, i, s) {
        const n = Math.abs(this.blurXFilter.strength),
            a = Math.abs(this.blurYFilter.strength);
        if (n && a) {
            const o = t.getFilterTexture();
            this.blurXFilter.apply(t, r, o, Je.CLEAR), this.blurYFilter.apply(t, o, i, s), t.returnFilterTexture(o)
        } else a ? this.blurYFilter.apply(t, r, i, s) : this.blurXFilter.apply(t, r, i, s)
    }
    updatePadding() {
        this._repeatEdgePixels ? this.padding = 0 : this.padding = Math.max(Math.abs(this.blurXFilter.strength), Math.abs(this.blurYFilter.strength)) * 2
    }
    get blur() {
        return this.blurXFilter.blur
    }
    set blur(t) {
        this.blurXFilter.blur = this.blurYFilter.blur = t, this.updatePadding()
    }
    get quality() {
        return this.blurXFilter.quality
    }
    set quality(t) {
        this.blurXFilter.quality = this.blurYFilter.quality = t
    }
    get blurX() {
        return this.blurXFilter.blur
    }
    set blurX(t) {
        this.blurXFilter.blur = t, this.updatePadding()
    }
    get blurY() {
        return this.blurYFilter.blur
    }
    set blurY(t) {
        this.blurYFilter.blur = t, this.updatePadding()
    }
    get blendMode() {
        return this.blurYFilter.blendMode
    }
    set blendMode(t) {
        this.blurYFilter.blendMode = t
    }
    get repeatEdgePixels() {
        return this._repeatEdgePixels
    }
    set repeatEdgePixels(t) {
        this._repeatEdgePixels = t, this.updatePadding()
    }
}
var Ob = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float m[20];
uniform float uAlpha;

void main(void)
{
    vec4 c = texture2D(uSampler, vTextureCoord);

    if (uAlpha == 0.0) {
        gl_FragColor = c;
        return;
    }

    // Un-premultiply alpha before applying the color matrix. See issue #3539.
    if (c.a > 0.0) {
      c.rgb /= c.a;
    }

    vec4 result;

    result.r = (m[0] * c.r);
        result.r += (m[1] * c.g);
        result.r += (m[2] * c.b);
        result.r += (m[3] * c.a);
        result.r += m[4];

    result.g = (m[5] * c.r);
        result.g += (m[6] * c.g);
        result.g += (m[7] * c.b);
        result.g += (m[8] * c.a);
        result.g += m[9];

    result.b = (m[10] * c.r);
       result.b += (m[11] * c.g);
       result.b += (m[12] * c.b);
       result.b += (m[13] * c.a);
       result.b += m[14];

    result.a = (m[15] * c.r);
       result.a += (m[16] * c.g);
       result.a += (m[17] * c.b);
       result.a += (m[18] * c.a);
       result.a += m[19];

    vec3 rgb = mix(c.rgb, result.rgb, uAlpha);

    // Premultiply alpha again.
    rgb *= result.a;

    gl_FragColor = vec4(rgb, result.a);
}
`;
class Jo extends se {
    constructor() {
        const t = {
            m: new Float32Array([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]),
            uAlpha: 1
        };
        super(dd, Ob, t), this.alpha = 1
    }
    _loadMatrix(t, r = !1) {
        let i = t;
        r && (this._multiply(i, this.uniforms.m, t), i = this._colorMatrix(i)), this.uniforms.m = i
    }
    _multiply(t, r, i) {
        return t[0] = r[0] * i[0] + r[1] * i[5] + r[2] * i[10] + r[3] * i[15], t[1] = r[0] * i[1] + r[1] * i[6] + r[2] * i[11] + r[3] * i[16], t[2] = r[0] * i[2] + r[1] * i[7] + r[2] * i[12] + r[3] * i[17], t[3] = r[0] * i[3] + r[1] * i[8] + r[2] * i[13] + r[3] * i[18], t[4] = r[0] * i[4] + r[1] * i[9] + r[2] * i[14] + r[3] * i[19] + r[4], t[5] = r[5] * i[0] + r[6] * i[5] + r[7] * i[10] + r[8] * i[15], t[6] = r[5] * i[1] + r[6] * i[6] + r[7] * i[11] + r[8] * i[16], t[7] = r[5] * i[2] + r[6] * i[7] + r[7] * i[12] + r[8] * i[17], t[8] = r[5] * i[3] + r[6] * i[8] + r[7] * i[13] + r[8] * i[18], t[9] = r[5] * i[4] + r[6] * i[9] + r[7] * i[14] + r[8] * i[19] + r[9], t[10] = r[10] * i[0] + r[11] * i[5] + r[12] * i[10] + r[13] * i[15], t[11] = r[10] * i[1] + r[11] * i[6] + r[12] * i[11] + r[13] * i[16], t[12] = r[10] * i[2] + r[11] * i[7] + r[12] * i[12] + r[13] * i[17], t[13] = r[10] * i[3] + r[11] * i[8] + r[12] * i[13] + r[13] * i[18], t[14] = r[10] * i[4] + r[11] * i[9] + r[12] * i[14] + r[13] * i[19] + r[14], t[15] = r[15] * i[0] + r[16] * i[5] + r[17] * i[10] + r[18] * i[15], t[16] = r[15] * i[1] + r[16] * i[6] + r[17] * i[11] + r[18] * i[16], t[17] = r[15] * i[2] + r[16] * i[7] + r[17] * i[12] + r[18] * i[17], t[18] = r[15] * i[3] + r[16] * i[8] + r[17] * i[13] + r[18] * i[18], t[19] = r[15] * i[4] + r[16] * i[9] + r[17] * i[14] + r[18] * i[19] + r[19], t
    }
    _colorMatrix(t) {
        const r = new Float32Array(t);
        return r[4] /= 255, r[9] /= 255, r[14] /= 255, r[19] /= 255, r
    }
    brightness(t, r) {
        const i = [t, 0, 0, 0, 0, 0, t, 0, 0, 0, 0, 0, t, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(i, r)
    }
    tint(t, r) {
        const [i, s, n] = Ot.shared.setValue(t).toArray(), a = [i, 0, 0, 0, 0, 0, s, 0, 0, 0, 0, 0, n, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(a, r)
    }
    greyscale(t, r) {
        const i = [t, t, t, 0, 0, t, t, t, 0, 0, t, t, t, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(i, r)
    }
    blackAndWhite(t) {
        const r = [.3, .6, .1, 0, 0, .3, .6, .1, 0, 0, .3, .6, .1, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    hue(t, r) {
        t = (t || 0) / 180 * Math.PI;
        const i = Math.cos(t),
            s = Math.sin(t),
            n = Math.sqrt,
            a = 1 / 3,
            o = n(a),
            h = i + (1 - i) * a,
            l = a * (1 - i) - o * s,
            c = a * (1 - i) + o * s,
            f = a * (1 - i) + o * s,
            p = i + a * (1 - i),
            m = a * (1 - i) - o * s,
            v = a * (1 - i) - o * s,
            _ = a * (1 - i) + o * s,
            y = i + a * (1 - i),
            A = [h, l, c, 0, 0, f, p, m, 0, 0, v, _, y, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(A, r)
    }
    contrast(t, r) {
        const i = (t || 0) + 1,
            s = -.5 * (i - 1),
            n = [i, 0, 0, 0, s, 0, i, 0, 0, s, 0, 0, i, 0, s, 0, 0, 0, 1, 0];
        this._loadMatrix(n, r)
    }
    saturate(t = 0, r) {
        const i = t * 2 / 3 + 1,
            s = (i - 1) * -.5,
            n = [i, s, s, 0, 0, s, i, s, 0, 0, s, s, i, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(n, r)
    }
    desaturate() {
        this.saturate(-1)
    }
    negative(t) {
        const r = [-1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    sepia(t) {
        const r = [.393, .7689999, .18899999, 0, 0, .349, .6859999, .16799999, 0, 0, .272, .5339999, .13099999, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    technicolor(t) {
        const r = [1.9125277891456083, -.8545344976951645, -.09155508482755585, 0, 11.793603434377337, -.3087833385928097, 1.7658908555458428, -.10601743074722245, 0, -70.35205161461398, -.231103377548616, -.7501899197440212, 1.847597816108189, 0, 30.950940869491138, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    polaroid(t) {
        const r = [1.438, -.062, -.062, 0, 0, -.122, 1.378, -.122, 0, 0, -.016, -.016, 1.483, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    toBGR(t) {
        const r = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    kodachrome(t) {
        const r = [1.1285582396593525, -.3967382283601348, -.03992559172921793, 0, 63.72958762196502, -.16404339962244616, 1.0835251566291304, -.05498805115633132, 0, 24.732407896706203, -.16786010706155763, -.5603416277695248, 1.6014850761964943, 0, 35.62982807460946, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    browni(t) {
        const r = [.5997023498159715, .34553243048391263, -.2708298674538042, 0, 47.43192855600873, -.037703249837783157, .8609577587992641, .15059552388459913, 0, -36.96841498319127, .24113635128153335, -.07441037908422492, .44972182064877153, 0, -7.562075277591283, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    vintage(t) {
        const r = [.6279345635605994, .3202183420819367, -.03965408211312453, 0, 9.651285835294123, .02578397704808868, .6441188644374771, .03259127616149294, 0, 7.462829176470591, .0466055556782719, -.0851232987247891, .5241648018700465, 0, 5.159190588235296, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    colorTone(t, r, i, s, n) {
        t = t || .2, r = r || .15, i = i || 16770432, s = s || 3375104;
        const a = Ot.shared,
            [o, h, l] = a.setValue(i).toArray(),
            [c, f, p] = a.setValue(s).toArray(),
            m = [.3, .59, .11, 0, 0, o, h, l, t, 0, c, f, p, r, 0, o - c, h - f, l - p, 0, 0];
        this._loadMatrix(m, n)
    }
    night(t, r) {
        t = t || .1;
        const i = [t * -2, -t, 0, 0, 0, -t, 0, t, 0, 0, 0, t, t * 2, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(i, r)
    }
    predator(t, r) {
        const i = [11.224130630493164 * t, -4.794486999511719 * t, -2.8746118545532227 * t, 0 * t, .40342438220977783 * t, -3.6330697536468506 * t, 9.193157196044922 * t, -2.951810836791992 * t, 0 * t, -1.316135048866272 * t, -3.2184197902679443 * t, -4.2375030517578125 * t, 7.476448059082031 * t, 0 * t, .8044459223747253 * t, 0, 0, 0, 1, 0];
        this._loadMatrix(i, r)
    }
    lsd(t) {
        const r = [2, -.4, .5, 0, 0, -.5, 2, -.4, 0, 0, -.4, -.5, 3, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(r, t)
    }
    reset() {
        const t = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
        this._loadMatrix(t, !1)
    }
    get matrix() {
        return this.uniforms.m
    }
    set matrix(t) {
        this.uniforms.m = t
    }
    get alpha() {
        return this.uniforms.uAlpha
    }
    set alpha(t) {
        this.uniforms.uAlpha = t
    }
}
Jo.prototype.grayscale = Jo.prototype.greyscale;
var Fb = `varying vec2 vFilterCoord;
varying vec2 vTextureCoord;

uniform vec2 scale;
uniform mat2 rotation;
uniform sampler2D uSampler;
uniform sampler2D mapSampler;

uniform highp vec4 inputSize;
uniform vec4 inputClamp;

void main(void)
{
  vec4 map =  texture2D(mapSampler, vFilterCoord);

  map -= 0.5;
  map.xy = scale * inputSize.zw * (rotation * map.xy);

  gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), inputClamp.xy, inputClamp.zw));
}
`,
    kb = `attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 filterMatrix;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
	gl_Position = filterVertexPosition();
	vTextureCoord = filterTextureCoord();
	vFilterCoord = ( filterMatrix * vec3( vTextureCoord, 1.0)  ).xy;
}
`;
class Lb extends se {
    constructor(t, r) {
        const i = new Gt;
        t.renderable = !1, super(kb, Fb, {
            mapSampler: t._texture,
            filterMatrix: i,
            scale: {
                x: 1,
                y: 1
            },
            rotation: new Float32Array([1, 0, 0, 1])
        }), this.maskSprite = t, this.maskMatrix = i, r == null && (r = 20), this.scale = new Lt(r, r)
    }
    apply(t, r, i, s) {
        this.uniforms.filterMatrix = t.calculateSpriteMatrix(this.maskMatrix, this.maskSprite), this.uniforms.scale.x = this.scale.x, this.uniforms.scale.y = this.scale.y;
        const n = this.maskSprite.worldTransform,
            a = Math.sqrt(n.a * n.a + n.b * n.b),
            o = Math.sqrt(n.c * n.c + n.d * n.d);
        a !== 0 && o !== 0 && (this.uniforms.rotation[0] = n.a / a, this.uniforms.rotation[1] = n.b / a, this.uniforms.rotation[2] = n.c / o, this.uniforms.rotation[3] = n.d / o), t.applyFilter(this, r, i, s)
    }
    get map() {
        return this.uniforms.mapSampler
    }
    set map(t) {
        this.uniforms.mapSampler = t
    }
}
var Ub = `varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

varying vec2 vFragCoord;
uniform sampler2D uSampler;
uniform highp vec4 inputSize;


/**
 Basic FXAA implementation based on the code on geeks3d.com with the
 modification that the texture2DLod stuff was removed since it's
 unsupported by WebGL.

 --

 From:
 https://github.com/mitsuhiko/webgl-meincraft

 Copyright (c) 2011 by Armin Ronacher.

 Some rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are
 met:

 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above
 copyright notice, this list of conditions and the following
 disclaimer in the documentation and/or other materials provided
 with the distribution.

 * The names of the contributors may not be used to endorse or
 promote products derived from this software without specific
 prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef FXAA_REDUCE_MIN
#define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
#define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
#define FXAA_SPAN_MAX     8.0
#endif

//optimized version for mobile, where dependent
//texture reads can be a bottleneck
vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 inverseVP,
          vec2 v_rgbNW, vec2 v_rgbNE,
          vec2 v_rgbSW, vec2 v_rgbSE,
          vec2 v_rgbM) {
    vec4 color;
    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;
    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;
    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;
    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;
    vec4 texColor = texture2D(tex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
                  dir * rcpDirMin)) * inverseVP;

    vec3 rgbA = 0.5 * (
                       texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
                       texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
                                     texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +
                                     texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        color = vec4(rgbA, texColor.a);
    else
        color = vec4(rgbB, texColor.a);
    return color;
}

void main() {

      vec4 color;

      color = fxaa(uSampler, vFragCoord, inputSize.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);

      gl_FragColor = color;
}
`,
    Gb = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

varying vec2 vFragCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

void texcoords(vec2 fragCoord, vec2 inverseVP,
               out vec2 v_rgbNW, out vec2 v_rgbNE,
               out vec2 v_rgbSW, out vec2 v_rgbSE,
               out vec2 v_rgbM) {
    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
    v_rgbM = vec2(fragCoord * inverseVP);
}

void main(void) {

   gl_Position = filterVertexPosition();

   vFragCoord = aVertexPosition * outputFrame.zw;

   texcoords(vFragCoord, inputSize.zw, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`;
class $b extends se {
    constructor() {
        super(Gb, Ub)
    }
}
var Hb = `precision highp float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform float uNoise;
uniform float uSeed;
uniform sampler2D uSampler;

float rand(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec4 color = texture2D(uSampler, vTextureCoord);
    float randomValue = rand(gl_FragCoord.xy * uSeed);
    float diff = (randomValue - 0.5) * uNoise;

    // Un-premultiply alpha before applying the color matrix. See issue #3539.
    if (color.a > 0.0) {
        color.rgb /= color.a;
    }

    color.r += diff;
    color.g += diff;
    color.b += diff;

    // Premultiply alpha again.
    color.rgb *= color.a;

    gl_FragColor = color;
}
`;
class Vb extends se {
    constructor(t = .5, r = Math.random()) {
        super(dd, Hb, {
            uNoise: 0,
            uSeed: 0
        }), this.noise = t, this.seed = r
    }
    get noise() {
        return this.uniforms.uNoise
    }
    set noise(t) {
        this.uniforms.uNoise = t
    }
    get seed() {
        return this.uniforms.uSeed
    }
    set seed(t) {
        this.uniforms.uSeed = t
    }
}
const nu = {
    AlphaFilter: xd,
    BlurFilter: Bb,
    BlurFilterPass: Ko,
    ColorMatrixFilter: Jo,
    DisplacementFilter: Lb,
    FXAAFilter: $b,
    NoiseFilter: Vb
};
Object.entries(nu).forEach(([e, t]) => {
    Object.defineProperty(nu, e, {
        get() {
            return Et("7.1.0", `filters.${e} has moved to ${e}`), t
        }
    })
});
const Qo = class {
    constructor(e) {
        this.stage = new xe, e = Object.assign({
            forceCanvas: !1
        }, e), this.renderer = gb(e), Qo._plugins.forEach(t => {
            t.init.call(this, e)
        })
    }
    render() {
        this.renderer.render(this.stage)
    }
    get view() {
        return this.renderer.view
    }
    get screen() {
        return this.renderer.screen
    }
    destroy(e, t) {
        const r = Qo._plugins.slice(0);
        r.reverse(), r.forEach(i => {
            i.destroy.call(this)
        }), this.stage.destroy(t), this.stage = null, this.renderer.destroy(e), this.renderer = null
    }
};
let Ch = Qo;
Ch._plugins = [];
nt.handleByList(J.Application, Ch._plugins);
class bd {
    static init(t) {
        Object.defineProperty(this, "resizeTo", {
            set(r) {
                globalThis.removeEventListener("resize", this.queueResize), this._resizeTo = r, r && (globalThis.addEventListener("resize", this.queueResize), this.resize())
            },
            get() {
                return this._resizeTo
            }
        }), this.queueResize = () => {
            this._resizeTo && (this.cancelResize(), this._resizeId = requestAnimationFrame(() => this.resize()))
        }, this.cancelResize = () => {
            this._resizeId && (cancelAnimationFrame(this._resizeId), this._resizeId = null)
        }, this.resize = () => {
            if (!this._resizeTo) return;
            this.cancelResize();
            let r, i;
            if (this._resizeTo === globalThis.window) r = globalThis.innerWidth, i = globalThis.innerHeight;
            else {
                const {
                    clientWidth: s,
                    clientHeight: n
                } = this._resizeTo;
                r = s, i = n
            }
            this.renderer.resize(r, i), this.render()
        }, this._resizeId = null, this._resizeTo = null, this.resizeTo = t.resizeTo || null
    }
    static destroy() {
        globalThis.removeEventListener("resize", this.queueResize), this.cancelResize(), this.cancelResize = null, this.queueResize = null, this.resizeTo = null, this.resize = null
    }
}
bd.extension = J.Application;
nt.add(bd);
const au = {
    loader: J.LoadParser,
    resolver: J.ResolveParser,
    cache: J.CacheParser,
    detection: J.DetectionParser
};
nt.handle(J.Asset, e => {
    const t = e.ref;
    Object.entries(au).filter(([r]) => !!t[r]).forEach(([r, i]) => nt.add(Object.assign(t[r], {
        extension: t[r].extension??i
    })))
}, e => {
    const t = e.ref;
    Object.keys(au).filter(r => !!t[r]).forEach(r => nt.remove(t[r]))
});
class zb {
    constructor(t, r = !1) {
        this._loader = t, this._assetList = [], this._isLoading = !1, this._maxConcurrent = 1, this.verbose = r
    }
    add(t) {
        t.forEach(r => {
            this._assetList.push(r)
        }), this.verbose && console.log("[BackgroundLoader] assets: ", this._assetList), this._isActive && !this._isLoading && this._next()
    }
    async _next() {
        if (this._assetList.length && this._isActive) {
            this._isLoading = !0;
            const t = [],
                r = Math.min(this._assetList.length, this._maxConcurrent);
            for (let i = 0; i < r; i++) t.push(this._assetList.pop());
            await this._loader.load(t), this._isLoading = !1, this._next()
        }
    }
    get active() {
        return this._isActive
    }
    set active(t) {
        this._isActive !== t && (this._isActive = t, t && !this._isLoading && this._next())
    }
}

function Ns(e, t) {
    if (Array.isArray(t)) {
        for (const r of t)
            if (e.startsWith(`data:${r}`)) return !0;
        return !1
    }
    return e.startsWith(`data:${t}`)
}

function ai(e, t) {
    const r = e.split("?")[0],
        i = ye.extname(r).toLowerCase();
    return Array.isArray(t) ? t.includes(i) : i === t
}
const vr = (e, t) => (Array.isArray(e) || (e = [e]), t ? e.map(r => typeof r == "string" ? t(r) : r) : e),
    th = (e, t) => {
        const r = t.split("?")[1];
        return r && (e += `?${r}`), e
    };

function wd(e, t, r, i, s) {
    const n = t[r];
    for (let a = 0; a < n.length; a++) {
        const o = n[a];
        r < t.length - 1 ? wd(e.replace(i[r], o), t, r + 1, i, s) : s.push(e.replace(i[r], o))
    }
}

function Xb(e) {
    const t = /\{(.*?)\}/g,
        r = e.match(t),
        i = [];
    if (r) {
        const s = [];
        r.forEach(n => {
            const a = n.substring(1, n.length - 1).split(",");
            s.push(a)
        }), wd(e, s, 0, r, i)
    } else i.push(e);
    return i
}
const Hn = e => !Array.isArray(e);
class jb {
    constructor() {
        this._parsers = [], this._cache = new Map, this._cacheMap = new Map
    }
    reset() {
        this._cacheMap.clear(), this._cache.clear()
    }
    has(t) {
        return this._cache.has(t)
    }
    get(t) {
        const r = this._cache.get(t);
        return r || console.warn(`[Assets] Asset id ${t} was not found in the Cache`), r
    }
    set(t, r) {
        const i = vr(t);
        let s;
        for (let o = 0; o < this.parsers.length; o++) {
            const h = this.parsers[o];
            if (h.test(r)) {
                s = h.getCacheableAssets(i, r);
                break
            }
        }
        s || (s = {}, i.forEach(o => {
            s[o] = r
        }));
        const n = Object.keys(s),
            a = {
                cacheKeys: n,
                keys: i
            };
        if (i.forEach(o => {
                this._cacheMap.set(o, a)
            }), n.forEach(o => {
                this._cache.has(o) && this._cache.get(o) !== r && console.warn("[Cache] already has key:", o), this._cache.set(o, s[o])
            }), r instanceof st) {
            const o = r;
            i.forEach(h => {
                o.baseTexture !== st.EMPTY.baseTexture && ct.addToCache(o.baseTexture, h), st.addToCache(o, h)
            })
        }
    }
    remove(t) {
        if (this._cacheMap.get(t), !this._cacheMap.has(t)) {
            console.warn(`[Assets] Asset id ${t} was not found in the Cache`);
            return
        }
        const r = this._cacheMap.get(t);
        r.cacheKeys.forEach(s => {
            this._cache.delete(s)
        }), r.keys.forEach(s => {
            this._cacheMap.delete(s)
        })
    }
    get parsers() {
        return this._parsers
    }
}
const ss = new jb;
class Wb {
    constructor() {
        this._parsers = [], this._parsersValidated = !1, this.parsers = new Proxy(this._parsers, {
            set: (t, r, i) => (this._parsersValidated = !1, t[r] = i, !0)
        }), this.promiseCache = {}
    }
    reset() {
        this._parsersValidated = !1, this.promiseCache = {}
    }
    _getLoadPromiseAndParser(t, r) {
        const i = {
            promise: null,
            parser: null
        };
        return i.promise = (async () => {
            var a, o;
            let s = null,
                n = null;
            if (r.loadParser && (n = this._parserHash[r.loadParser], n || console.warn(`[Assets] specified load parser "${r.loadParser}" not found while loading ${t}`)), !n) {
                for (let h = 0; h < this.parsers.length; h++) {
                    const l = this.parsers[h];
                    if (l.load && ((a = l.test) != null && a.call(l, t, r, this))) {
                        n = l;
                        break
                    }
                }
                if (!n) return console.warn(`[Assets] ${t} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`), null
            }
            s = await n.load(t, r, this), i.parser = n;
            for (let h = 0; h < this.parsers.length; h++) {
                const l = this.parsers[h];
                l.parse && l.parse && await ((o = l.testParse) == null ? void 0 : o.call(l, s, r, this)) && (s = await l.parse(s, r, this) || s, i.parser = l)
            }
            return s
        })(), i
    }
    async load(t, r) {
        this._parsersValidated || this._validateParsers();
        let i = 0;
        const s = {},
            n = Hn(t),
            a = vr(t, l => ({
                src: l
            })),
            o = a.length,
            h = a.map(async l => {
                const c = ye.toAbsolute(l.src);
                if (!s[l.src]) try {
                    this.promiseCache[c] || (this.promiseCache[c] = this._getLoadPromiseAndParser(c, l)), s[l.src] = await this.promiseCache[c].promise, r && r(++i / o)
                } catch (f) {
                    throw delete this.promiseCache[c], delete s[l.src], new Error(`[Loader.load] Failed to load ${c}.
${f}`)
                }
            });
        return await Promise.all(h), n ? s[a[0].src] : s
    }
    async unload(t) {
        const i = vr(t, s => ({
            src: s
        })).map(async s => {
            var o, h;
            const n = ye.toAbsolute(s.src),
                a = this.promiseCache[n];
            if (a) {
                const l = await a.promise;
                (h = (o = a.parser) == null ? void 0 : o.unload) == null || h.call(o, l, s, this), delete this.promiseCache[n]
            }
        });
        await Promise.all(i)
    }
    _validateParsers() {
        this._parsersValidated = !0, this._parserHash = this._parsers.filter(t => t.name).reduce((t, r) => (t[r.name] && console.warn(`[Assets] loadParser name conflict "${r.name}"`), { ...t,
            [r.name]: r
        }), {})
    }
}
var lr = (e => (e[e.Low = 0] = "Low", e[e.Normal = 1] = "Normal", e[e.High = 2] = "High", e))(lr || {});
const Yb = ".json",
    qb = "application/json",
    Zb = {
        extension: {
            type: J.LoadParser,
            priority: lr.Low
        },
        name: "loadJson",
        test(e) {
            return Ns(e, qb) || ai(e, Yb)
        },
        async load(e) {
            return await (await K.ADAPTER.fetch(e)).json()
        }
    };
nt.add(Zb);
const Kb = ".txt",
    Jb = "text/plain",
    Qb = {
        name: "loadTxt",
        extension: {
            type: J.LoadParser,
            priority: lr.Low
        },
        test(e) {
            return Ns(e, Jb) || ai(e, Kb)
        },
        async load(e) {
            return await (await K.ADAPTER.fetch(e)).text()
        }
    };
nt.add(Qb);
const t1 = ["normal", "bold", "100", "200", "300", "400", "500", "600", "700", "800", "900"],
    e1 = [".ttf", ".otf", ".woff", ".woff2"],
    r1 = ["font/ttf", "font/otf", "font/woff", "font/woff2"],
    i1 = /^(--|-?[A-Z_])[0-9A-Z_-]*$/i;

function s1(e) {
    const t = ye.extname(e),
        s = ye.basename(e, t).replace(/(-|_)/g, " ").toLowerCase().split(" ").map(o => o.charAt(0).toUpperCase() + o.slice(1));
    let n = s.length > 0;
    for (const o of s)
        if (!o.match(i1)) {
            n = !1;
            break
        }
    let a = s.join(" ");
    return n || (a = `"${a.replace(/[\\"]/g,"\\$&")}"`), a
}
const n1 = {
    extension: {
        type: J.LoadParser,
        priority: lr.Low
    },
    name: "loadWebFont",
    test(e) {
        return Ns(e, r1) || ai(e, e1)
    },
    async load(e, t) {
        var i, s, n;
        const r = K.ADAPTER.getFontFaceSet();
        if (r) {
            const a = [],
                o = ((i = t.data) == null ? void 0 : i.family)??s1(e),
                h = ((n = (s = t.data) == null ? void 0 : s.weights) == null ? void 0 : n.filter(c => t1.includes(c)))??["normal"],
                l = t.data??{};
            for (let c = 0; c < h.length; c++) {
                const f = h[c],
                    p = new FontFace(o, `url(${encodeURI(e)})`, { ...l,
                        weight: f
                    });
                await p.load(), r.add(p), a.push(p)
            }
            return a.length === 1 ? a[0] : a
        }
        return console.warn("[loadWebFont] FontFace API is not supported. Skipping loading font"), null
    },
    unload(e) {
        (Array.isArray(e) ? e : [e]).forEach(t => K.ADAPTER.getFontFaceSet().delete(t))
    }
};
nt.add(n1);
let ou = 0,
    po;
const a1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
    o1 = {
        id: "checkImageBitmap",
        code: `
    async function checkImageBitmap()
    {
        try
        {
            if (typeof createImageBitmap !== 'function') return false;

            const response = await fetch('${a1}');
            const imageBlob =  await response.blob();
            const imageBitmap = await createImageBitmap(imageBlob);

            return imageBitmap.width === 1 && imageBitmap.height === 1;
        }
        catch (e)
        {
            return false;
        }
    }
    checkImageBitmap().then((result) => { self.postMessage(result); });
    `
    },
    h1 = {
        id: "loadImageBitmap",
        code: `
    async function loadImageBitmap(url)
    {
        const response = await fetch(url);

        if (!response.ok)
        {
            throw new Error(\`[WorkerManager.loadImageBitmap] Failed to fetch \${url}: \`
                + \`\${response.status} \${response.statusText}\`);
        }

        const imageBlob =  await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);

        return imageBitmap;
    }
    self.onmessage = async (event) =>
    {
        try
        {
            const imageBitmap = await loadImageBitmap(event.data.data[0]);

            self.postMessage({
                data: imageBitmap,
                uuid: event.data.uuid,
                id: event.data.id,
            }, [imageBitmap]);
        }
        catch(e)
        {
            self.postMessage({
                error: e,
                uuid: event.data.uuid,
                id: event.data.id,
            });
        }
    };`
    };
let mo;
class l1 {
    constructor() {
        this._initialized = !1, this._createdWorkers = 0, this.workerPool = [], this.queue = [], this.resolveHash = {}
    }
    isImageBitmapSupported() {
        return this._isImageBitmapSupported !== void 0 ? this._isImageBitmapSupported : (this._isImageBitmapSupported = new Promise(t => {
            const r = URL.createObjectURL(new Blob([o1.code], {
                    type: "application/javascript"
                })),
                i = new Worker(r);
            i.addEventListener("message", s => {
                i.terminate(), URL.revokeObjectURL(r), t(s.data)
            })
        }), this._isImageBitmapSupported)
    }
    loadImageBitmap(t) {
        return this._run("loadImageBitmap", [t])
    }
    async _initWorkers() {
        this._initialized || (this._initialized = !0)
    }
    getWorker() {
        po === void 0 && (po = navigator.hardwareConcurrency || 4);
        let t = this.workerPool.pop();
        return !t && this._createdWorkers < po && (mo || (mo = URL.createObjectURL(new Blob([h1.code], {
            type: "application/javascript"
        }))), this._createdWorkers++, t = new Worker(mo), t.addEventListener("message", r => {
            this.complete(r.data), this.returnWorker(r.target), this.next()
        })), t
    }
    returnWorker(t) {
        this.workerPool.push(t)
    }
    complete(t) {
        t.error !== void 0 ? this.resolveHash[t.uuid].reject(t.error) : this.resolveHash[t.uuid].resolve(t.data), this.resolveHash[t.uuid] = null
    }
    async _run(t, r) {
        await this._initWorkers();
        const i = new Promise((s, n) => {
            this.queue.push({
                id: t,
                arguments: r,
                resolve: s,
                reject: n
            })
        });
        return this.next(), i
    }
    next() {
        if (!this.queue.length) return;
        const t = this.getWorker();
        if (!t) return;
        const r = this.queue.pop(),
            i = r.id;
        this.resolveHash[ou] = {
            resolve: r.resolve,
            reject: r.reject
        }, t.postMessage({
            data: r.arguments,
            uuid: ou++,
            id: i
        })
    }
}
const hu = new l1;

function fa(e, t, r) {
    const i = new st(e);
    return i.baseTexture.on("dispose", () => {
        delete t.promiseCache[r]
    }), i
}
const c1 = [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    u1 = ["image/jpeg", "image/png", "image/webp", "image/avif"];
async function f1(e) {
    const t = await K.ADAPTER.fetch(e);
    if (!t.ok) throw new Error(`[loadImageBitmap] Failed to fetch ${e}: ${t.status} ${t.statusText}`);
    const r = await t.blob();
    return await createImageBitmap(r)
}
const da = {
    name: "loadTextures",
    extension: {
        type: J.LoadParser,
        priority: lr.High
    },
    config: {
        preferWorkers: !0,
        preferCreateImageBitmap: !0,
        crossOrigin: "anonymous"
    },
    test(e) {
        return Ns(e, u1) || ai(e, c1)
    },
    async load(e, t, r) {
        let i = null;
        globalThis.createImageBitmap && this.config.preferCreateImageBitmap ? this.config.preferWorkers && await hu.isImageBitmapSupported() ? i = await hu.loadImageBitmap(e) : i = await f1(e) : i = await new Promise(n => {
            i = new Image, i.crossOrigin = this.config.crossOrigin, i.src = e, i.complete ? n(i) : i.onload = () => {
                n(i)
            }
        });
        const s = new ct(i, {
            resolution: Nr(e),
            ...t.data
        });
        return s.resource.src = e, fa(s, r, e)
    },
    unload(e) {
        e.destroy(!0)
    }
};
nt.add(da);
const d1 = ".svg",
    p1 = "image/svg+xml",
    m1 = {
        extension: {
            type: J.LoadParser,
            priority: lr.High
        },
        name: "loadSVG",
        test(e) {
            return Ns(e, p1) || ai(e, d1)
        },
        async testParse(e) {
            return As.test(e)
        },
        async parse(e, t, r) {
            var a;
            const i = new As(e, (a = t == null ? void 0 : t.data) == null ? void 0 : a.resourceOptions);
            await i.load();
            const s = new ct(i, {
                resolution: Nr(e),
                ...t == null ? void 0 : t.data
            });
            return s.resource.src = e, fa(s, r, e)
        },
        async load(e, t) {
            return (await K.ADAPTER.fetch(e)).text()
        },
        unload: da.unload
    };
nt.add(m1);
class g1 {
    constructor() {
        this._defaultBundleIdentifierOptions = {
            connector: "-",
            createBundleAssetId: (t, r) => `${t}${this._bundleIdConnector}${r}`,
            extractAssetIdFromBundle: (t, r) => r.replace(`${t}${this._bundleIdConnector}`, "")
        }, this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector, this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId, this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle, this._assetMap = {}, this._preferredOrder = [], this._parsers = [], this._resolverHash = {}, this._bundles = {}
    }
    setBundleIdentifier(t) {
        if (this._bundleIdConnector = t.connector??this._bundleIdConnector, this._createBundleAssetId = t.createBundleAssetId??this._createBundleAssetId, this._extractAssetIdFromBundle = t.extractAssetIdFromBundle??this._extractAssetIdFromBundle, this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar") throw new Error("[Resolver] GenerateBundleAssetId are not working correctly")
    }
    prefer(...t) {
        t.forEach(r => {
            this._preferredOrder.push(r), r.priority || (r.priority = Object.keys(r.params))
        }), this._resolverHash = {}
    }
    set basePath(t) {
        this._basePath = t
    }
    get basePath() {
        return this._basePath
    }
    set rootPath(t) {
        this._rootPath = t
    }
    get rootPath() {
        return this._rootPath
    }
    get parsers() {
        return this._parsers
    }
    reset() {
        this.setBundleIdentifier(this._defaultBundleIdentifierOptions), this._assetMap = {}, this._preferredOrder = [], this._resolverHash = {}, this._rootPath = null, this._basePath = null, this._manifest = null, this._bundles = {}, this._defaultSearchParams = null
    }
    setDefaultSearchParams(t) {
        if (typeof t == "string") this._defaultSearchParams = t;
        else {
            const r = t;
            this._defaultSearchParams = Object.keys(r).map(i => `${encodeURIComponent(i)}=${encodeURIComponent(r[i])}`).join("&")
        }
    }
    addManifest(t) {
        this._manifest && console.warn("[Resolver] Manifest already exists, this will be overwritten"), this._manifest = t, t.bundles.forEach(r => {
            this.addBundle(r.name, r.assets)
        })
    }
    addBundle(t, r) {
        const i = [];
        Array.isArray(r) ? r.forEach(s => {
            if (typeof s.name == "string") {
                const n = this._createBundleAssetId(t, s.name);
                i.push(n), this.add([s.name, n], s.srcs, s.data)
            } else {
                const n = s.name.map(a => this._createBundleAssetId(t, a));
                n.forEach(a => {
                    i.push(a)
                }), this.add([...s.name, ...n], s.srcs)
            }
        }) : Object.keys(r).forEach(s => {
            i.push(this._createBundleAssetId(t, s)), this.add([s, this._createBundleAssetId(t, s)], r[s])
        }), this._bundles[t] = i
    }
    add(t, r, i) {
        const s = vr(t);
        s.forEach(a => {
            this.hasKey(a) && console.warn(`[Resolver] already has key: ${a} overwriting`)
        }), Array.isArray(r) || (typeof r == "string" ? r = Xb(r) : r = [r]);
        const n = r.map(a => {
            let o = a;
            if (typeof a == "string") {
                let h = !1;
                for (let l = 0; l < this._parsers.length; l++) {
                    const c = this._parsers[l];
                    if (c.test(a)) {
                        o = c.parse(a), h = !0;
                        break
                    }
                }
                h || (o = {
                    src: a
                })
            }
            return o.format || (o.format = o.src.split(".").pop()), o.alias || (o.alias = s), (this._basePath || this._rootPath) && (o.src = ye.toAbsolute(o.src, this._basePath, this._rootPath)), o.src = this._appendDefaultSearchParams(o.src), o.data = o.data??i, o
        });
        s.forEach(a => {
            this._assetMap[a] = n
        })
    }
    resolveBundle(t) {
        const r = Hn(t);
        t = vr(t);
        const i = {};
        return t.forEach(s => {
            const n = this._bundles[s];
            if (n) {
                const a = this.resolve(n),
                    o = {};
                for (const h in a) {
                    const l = a[h];
                    o[this._extractAssetIdFromBundle(s, h)] = l
                }
                i[s] = o
            }
        }), r ? i[t[0]] : i
    }
    resolveUrl(t) {
        const r = this.resolve(t);
        if (typeof t != "string") {
            const i = {};
            for (const s in r) i[s] = r[s].src;
            return i
        }
        return r.src
    }
    resolve(t) {
        const r = Hn(t);
        t = vr(t);
        const i = {};
        return t.forEach(s => {
            if (!this._resolverHash[s])
                if (this._assetMap[s]) {
                    let n = this._assetMap[s];
                    const a = this._getPreferredOrder(n),
                        o = n[0];
                    a == null || a.priority.forEach(h => {
                        a.params[h].forEach(l => {
                            const c = n.filter(f => f[h] ? f[h] === l : !1);
                            c.length && (n = c)
                        })
                    }), this._resolverHash[s] = n[0]??o
                } else {
                    let n = s;
                    (this._basePath || this._rootPath) && (n = ye.toAbsolute(n, this._basePath, this._rootPath)), n = this._appendDefaultSearchParams(n), this._resolverHash[s] = {
                        src: n
                    }
                }
            i[s] = this._resolverHash[s]
        }), r ? i[t[0]] : i
    }
    hasKey(t) {
        return !!this._assetMap[t]
    }
    hasBundle(t) {
        return !!this._bundles[t]
    }
    _getPreferredOrder(t) {
        for (let r = 0; r < t.length; r++) {
            const i = t[0],
                s = this._preferredOrder.find(n => n.params.format.includes(i.format));
            if (s) return s
        }
        return this._preferredOrder[0]
    }
    _appendDefaultSearchParams(t) {
        if (!this._defaultSearchParams) return t;
        const r = /\?/.test(t) ? "&" : "?";
        return `${t}${r}${this._defaultSearchParams}`
    }
}
class v1 {
    constructor() {
        this._detections = [], this._initialized = !1, this.resolver = new g1, this.loader = new Wb, this.cache = ss, this._backgroundLoader = new zb(this.loader), this._backgroundLoader.active = !0, this.reset()
    }
    async init(t = {}) {
        var n, a, o;
        if (this._initialized) {
            console.warn("[Assets]AssetManager already initialized, did you load before calling this Asset.init()?");
            return
        }
        if (this._initialized = !0, t.defaultSearchParams && this.resolver.setDefaultSearchParams(t.defaultSearchParams), t.basePath && (this.resolver.basePath = t.basePath), t.bundleIdentifier && this.resolver.setBundleIdentifier(t.bundleIdentifier), t.manifest) {
            let h = t.manifest;
            typeof h == "string" && (h = await this.load(h)), this.resolver.addManifest(h)
        }
        const r = ((n = t.texturePreference) == null ? void 0 : n.resolution)??1,
            i = typeof r == "number" ? [r] : r;
        let s = [];
        if ((a = t.texturePreference) != null && a.format) {
            const h = (o = t.texturePreference) == null ? void 0 : o.format;
            s = typeof h == "string" ? [h] : h;
            for (const l of this._detections) await l.test() || (s = await l.remove(s))
        } else
            for (const h of this._detections) await h.test() && (s = await h.add(s));
        this.resolver.prefer({
            params: {
                format: s,
                resolution: i
            }
        }), t.preferences && this.setPreferences(t.preferences)
    }
    add(t, r, i) {
        this.resolver.add(t, r, i)
    }
    async load(t, r) {
        this._initialized || await this.init();
        const i = Hn(t),
            s = vr(t).map(o => typeof o != "string" ? (this.resolver.add(o.src, o), o.src) : (this.resolver.hasKey(o) || this.resolver.add(o, o), o)),
            n = this.resolver.resolve(s),
            a = await this._mapLoadToResolve(n, r);
        return i ? a[s[0]] : a
    }
    addBundle(t, r) {
        this.resolver.addBundle(t, r)
    }
    async loadBundle(t, r) {
        this._initialized || await this.init();
        let i = !1;
        typeof t == "string" && (i = !0, t = [t]);
        const s = this.resolver.resolveBundle(t),
            n = {},
            a = Object.keys(s);
        let o = 0,
            h = 0;
        const l = () => {
                r == null || r(++o / h)
            },
            c = a.map(f => {
                const p = s[f];
                return h += Object.keys(p).length, this._mapLoadToResolve(p, l).then(m => {
                    n[f] = m
                })
            });
        return await Promise.all(c), i ? n[t[0]] : n
    }
    async backgroundLoad(t) {
        this._initialized || await this.init(), typeof t == "string" && (t = [t]);
        const r = this.resolver.resolve(t);
        this._backgroundLoader.add(Object.values(r))
    }
    async backgroundLoadBundle(t) {
        this._initialized || await this.init(), typeof t == "string" && (t = [t]);
        const r = this.resolver.resolveBundle(t);
        Object.values(r).forEach(i => {
            this._backgroundLoader.add(Object.values(i))
        })
    }
    reset() {
        this.resolver.reset(), this.loader.reset(), this.cache.reset(), this._initialized = !1
    }
    get(t) {
        if (typeof t == "string") return ss.get(t);
        const r = {};
        for (let i = 0; i < t.length; i++) r[i] = ss.get(t[i]);
        return r
    }
    async _mapLoadToResolve(t, r) {
        const i = Object.values(t),
            s = Object.keys(t);
        this._backgroundLoader.active = !1;
        const n = await this.loader.load(i, r);
        this._backgroundLoader.active = !0;
        const a = {};
        return i.forEach((o, h) => {
            const l = n[o.src],
                c = [o.src];
            o.alias && c.push(...o.alias), a[s[h]] = l, ss.set(c, l)
        }), a
    }
    async unload(t) {
        this._initialized || await this.init();
        const r = vr(t).map(s => typeof s != "string" ? s.src : s),
            i = this.resolver.resolve(r);
        await this._unloadFromResolved(i)
    }
    async unloadBundle(t) {
        this._initialized || await this.init(), t = vr(t);
        const r = this.resolver.resolveBundle(t),
            i = Object.keys(r).map(s => this._unloadFromResolved(r[s]));
        await Promise.all(i)
    }
    async _unloadFromResolved(t) {
        const r = Object.values(t);
        r.forEach(i => {
            ss.remove(i.src)
        }), await this.loader.unload(r)
    }
    get detections() {
        return this._detections
    }
    get preferWorkers() {
        return da.config.preferWorkers
    }
    set preferWorkers(t) {
        Et("7.2.0", "Assets.prefersWorkers is deprecated, use Assets.setPreferences({ preferWorkers: true }) instead."), this.setPreferences({
            preferWorkers: t
        })
    }
    setPreferences(t) {
        this.loader.parsers.forEach(r => {
            r.config && Object.keys(r.config).filter(i => i in t).forEach(i => {
                r.config[i] = t[i]
            })
        })
    }
}
const ln = new v1;
nt.handleByList(J.LoadParser, ln.loader.parsers).handleByList(J.ResolveParser, ln.resolver.parsers).handleByList(J.CacheParser, ln.cache.parsers).handleByList(J.DetectionParser, ln.detections);
const _1 = {
    extension: J.CacheParser,
    test: e => Array.isArray(e) && e.every(t => t instanceof st),
    getCacheableAssets: (e, t) => {
        const r = {};
        return e.forEach(i => {
            t.forEach((s, n) => {
                r[i + (n === 0 ? "" : n + 1)] = s
            })
        }), r
    }
};
nt.add(_1);
const y1 = {
    extension: {
        type: J.DetectionParser,
        priority: 1
    },
    test: async () => {
        if (!globalThis.createImageBitmap) return !1;
        const e = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=",
            t = await K.ADAPTER.fetch(e).then(r => r.blob());
        return createImageBitmap(t).then(() => !0, () => !1)
    },
    add: async e => [...e, "avif"],
    remove: async e => e.filter(t => t !== "avif")
};
nt.add(y1);
const x1 = {
    extension: {
        type: J.DetectionParser,
        priority: 0
    },
    test: async () => {
        if (!globalThis.createImageBitmap) return !1;
        const e = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
            t = await K.ADAPTER.fetch(e).then(r => r.blob());
        return createImageBitmap(t).then(() => !0, () => !1)
    },
    add: async e => [...e, "webp"],
    remove: async e => e.filter(t => t !== "webp")
};
nt.add(x1);
const lu = ["png", "jpg", "jpeg"],
    b1 = {
        extension: {
            type: J.DetectionParser,
            priority: -1
        },
        test: () => Promise.resolve(!0),
        add: async e => [...e, ...lu],
        remove: async e => e.filter(t => !lu.includes(t))
    };
nt.add(b1);
const w1 = {
    extension: J.ResolveParser,
    test: da.test,
    parse: e => {
        var t;
        return {
            resolution: parseFloat(((t = K.RETINA_PREFIX.exec(e)) == null ? void 0 : t[1])??"1"),
            format: e.split(".").pop(),
            src: e
        }
    }
};
nt.add(w1);
var Ae = (e => (e[e.COMPRESSED_RGB_S3TC_DXT1_EXT = 33776] = "COMPRESSED_RGB_S3TC_DXT1_EXT", e[e.COMPRESSED_RGBA_S3TC_DXT1_EXT = 33777] = "COMPRESSED_RGBA_S3TC_DXT1_EXT", e[e.COMPRESSED_RGBA_S3TC_DXT3_EXT = 33778] = "COMPRESSED_RGBA_S3TC_DXT3_EXT", e[e.COMPRESSED_RGBA_S3TC_DXT5_EXT = 33779] = "COMPRESSED_RGBA_S3TC_DXT5_EXT", e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 35917] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT", e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 35918] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT", e[e.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 35919] = "COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT", e[e.COMPRESSED_SRGB_S3TC_DXT1_EXT = 35916] = "COMPRESSED_SRGB_S3TC_DXT1_EXT", e[e.COMPRESSED_R11_EAC = 37488] = "COMPRESSED_R11_EAC", e[e.COMPRESSED_SIGNED_R11_EAC = 37489] = "COMPRESSED_SIGNED_R11_EAC", e[e.COMPRESSED_RG11_EAC = 37490] = "COMPRESSED_RG11_EAC", e[e.COMPRESSED_SIGNED_RG11_EAC = 37491] = "COMPRESSED_SIGNED_RG11_EAC", e[e.COMPRESSED_RGB8_ETC2 = 37492] = "COMPRESSED_RGB8_ETC2", e[e.COMPRESSED_RGBA8_ETC2_EAC = 37496] = "COMPRESSED_RGBA8_ETC2_EAC", e[e.COMPRESSED_SRGB8_ETC2 = 37493] = "COMPRESSED_SRGB8_ETC2", e[e.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 37497] = "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC", e[e.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37494] = "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", e[e.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37495] = "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", e[e.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 35840] = "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", e[e.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 35842] = "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", e[e.COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 35841] = "COMPRESSED_RGB_PVRTC_2BPPV1_IMG", e[e.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 35843] = "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG", e[e.COMPRESSED_RGB_ETC1_WEBGL = 36196] = "COMPRESSED_RGB_ETC1_WEBGL", e[e.COMPRESSED_RGB_ATC_WEBGL = 35986] = "COMPRESSED_RGB_ATC_WEBGL", e[e.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 35986] = "COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL", e[e.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 34798] = "COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL", e[e.COMPRESSED_RGBA_ASTC_4x4_KHR = 37808] = "COMPRESSED_RGBA_ASTC_4x4_KHR", e))(Ae || {});
const Vn = {
    [33776]: .5,
    [33777]: .5,
    [33778]: 1,
    [33779]: 1,
    [35916]: .5,
    [35917]: .5,
    [35918]: 1,
    [35919]: 1,
    [37488]: .5,
    [37489]: .5,
    [37490]: 1,
    [37491]: 1,
    [37492]: .5,
    [37496]: 1,
    [37493]: .5,
    [37497]: 1,
    [37494]: .5,
    [37495]: .5,
    [35840]: .5,
    [35842]: .5,
    [35841]: .25,
    [35843]: .25,
    [36196]: .5,
    [35986]: .5,
    [35986]: 1,
    [34798]: 1,
    [37808]: 1
};
let pr, Si;

function cu() {
    Si = {
        s3tc: pr.getExtension("WEBGL_compressed_texture_s3tc"),
        s3tc_sRGB: pr.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
        etc: pr.getExtension("WEBGL_compressed_texture_etc"),
        etc1: pr.getExtension("WEBGL_compressed_texture_etc1"),
        pvrtc: pr.getExtension("WEBGL_compressed_texture_pvrtc") || pr.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
        atc: pr.getExtension("WEBGL_compressed_texture_atc"),
        astc: pr.getExtension("WEBGL_compressed_texture_astc")
    }
}
const E1 = {
    extension: {
        type: J.DetectionParser,
        priority: 2
    },
    test: async () => {
        const t = K.ADAPTER.createCanvas().getContext("webgl");
        return t ? (pr = t, !0) : (console.warn("WebGL not available for compressed textures."), !1)
    },
    add: async e => {
        Si || cu();
        const t = [];
        for (const r in Si) Si[r] && t.push(r);
        return [...t, ...e]
    },
    remove: async e => (Si || cu(), e.filter(t => !(t in Si)))
};
nt.add(E1);
class T1 extends Ms {
    constructor(t, r = {
        width: 1,
        height: 1,
        autoLoad: !0
    }) {
        let i, s;
        typeof t == "string" ? (i = t, s = new Uint8Array) : (i = null, s = t), super(s, r), this.origin = i, this.buffer = s ? new $o(s) : null, this._load = null, this.loaded = !1, this.origin !== null && r.autoLoad !== !1 && this.load(), this.origin === null && this.buffer && (this._load = Promise.resolve(this), this.loaded = !0, this.onBlobLoaded(this.buffer.rawBinaryData))
    }
    onBlobLoaded(t) {}
    load() {
        return this._load ? this._load : (this._load = fetch(this.origin).then(t => t.blob()).then(t => t.arrayBuffer()).then(t => (this.data = new Uint32Array(t), this.buffer = new $o(t), this.loaded = !0, this.onBlobLoaded(t), this.update(), this)), this._load)
    }
}
class Zr extends T1 {
    constructor(t, r) {
        super(t, r), this.format = r.format, this.levels = r.levels || 1, this._width = r.width, this._height = r.height, this._extension = Zr._formatToExtension(this.format), (r.levelBuffers || this.buffer) && (this._levelBuffers = r.levelBuffers || Zr._createLevelBuffers(t instanceof Uint8Array ? t : this.buffer.uint8View, this.format, this.levels, 4, 4, this.width, this.height))
    }
    upload(t, r, i) {
        const s = t.gl;
        if (!t.context.extensions[this._extension]) throw new Error(`${this._extension} textures are not supported on the current machine`);
        if (!this._levelBuffers) return !1;
        for (let a = 0, o = this.levels; a < o; a++) {
            const {
                levelID: h,
                levelWidth: l,
                levelHeight: c,
                levelBuffer: f
            } = this._levelBuffers[a];
            s.compressedTexImage2D(s.TEXTURE_2D, h, this.format, l, c, 0, f)
        }
        return !0
    }
    onBlobLoaded() {
        this._levelBuffers = Zr._createLevelBuffers(this.buffer.uint8View, this.format, this.levels, 4, 4, this.width, this.height)
    }
    static _formatToExtension(t) {
        if (t >= 33776 && t <= 33779) return "s3tc";
        if (t >= 37488 && t <= 37497) return "etc";
        if (t >= 35840 && t <= 35843) return "pvrtc";
        if (t >= 36196) return "etc1";
        if (t >= 35986 && t <= 34798) return "atc";
        throw new Error("Invalid (compressed) texture format given!")
    }
    static _createLevelBuffers(t, r, i, s, n, a, o) {
        const h = new Array(i);
        let l = t.byteOffset,
            c = a,
            f = o,
            p = c + s - 1 & ~(s - 1),
            m = f + n - 1 & ~(n - 1),
            v = p * m * Vn[r];
        for (let _ = 0; _ < i; _++) h[_] = {
            levelID: _,
            levelWidth: i > 1 ? c : p,
            levelHeight: i > 1 ? f : m,
            levelBuffer: new Uint8Array(t.buffer, l, v)
        }, l += v, c = c >> 1 || 1, f = f >> 1 || 1, p = c + s - 1 & ~(s - 1), m = f + n - 1 & ~(n - 1), v = p * m * Vn[r];
        return h
    }
}
const go = 4,
    cn = 124,
    A1 = 32,
    uu = 20,
    C1 = 542327876,
    un = {
        SIZE: 1,
        FLAGS: 2,
        HEIGHT: 3,
        WIDTH: 4,
        MIPMAP_COUNT: 7,
        PIXEL_FORMAT: 19
    },
    S1 = {
        SIZE: 0,
        FLAGS: 1,
        FOURCC: 2,
        RGB_BITCOUNT: 3,
        R_BIT_MASK: 4,
        G_BIT_MASK: 5,
        B_BIT_MASK: 6,
        A_BIT_MASK: 7
    },
    fn = {
        DXGI_FORMAT: 0,
        RESOURCE_DIMENSION: 1,
        MISC_FLAG: 2,
        ARRAY_SIZE: 3,
        MISC_FLAGS2: 4
    },
    I1 = 1,
    R1 = 2,
    M1 = 4,
    P1 = 64,
    N1 = 512,
    D1 = 131072,
    B1 = 827611204,
    O1 = 861165636,
    F1 = 894720068,
    k1 = 808540228,
    L1 = 4,
    U1 = {
        [B1]: Ae.COMPRESSED_RGBA_S3TC_DXT1_EXT,
        [O1]: Ae.COMPRESSED_RGBA_S3TC_DXT3_EXT,
        [F1]: Ae.COMPRESSED_RGBA_S3TC_DXT5_EXT
    },
    G1 = {
        [70]: Ae.COMPRESSED_RGBA_S3TC_DXT1_EXT,
        [71]: Ae.COMPRESSED_RGBA_S3TC_DXT1_EXT,
        [73]: Ae.COMPRESSED_RGBA_S3TC_DXT3_EXT,
        [74]: Ae.COMPRESSED_RGBA_S3TC_DXT3_EXT,
        [76]: Ae.COMPRESSED_RGBA_S3TC_DXT5_EXT,
        [77]: Ae.COMPRESSED_RGBA_S3TC_DXT5_EXT,
        [72]: Ae.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
        [75]: Ae.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
        [78]: Ae.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
    };

function $1(e) {
    const t = new Uint32Array(e);
    if (t[0] !== C1) throw new Error("Invalid DDS file magic word");
    const i = new Uint32Array(e, 0, cn / Uint32Array.BYTES_PER_ELEMENT),
        s = i[un.HEIGHT],
        n = i[un.WIDTH],
        a = i[un.MIPMAP_COUNT],
        o = new Uint32Array(e, un.PIXEL_FORMAT * Uint32Array.BYTES_PER_ELEMENT, A1 / Uint32Array.BYTES_PER_ELEMENT),
        h = o[I1];
    if (h & M1) {
        const l = o[S1.FOURCC];
        if (l !== k1) {
            const x = U1[l],
                S = go + cn,
                $ = new Uint8Array(e, S);
            return [new Zr($, {
                format: x,
                width: n,
                height: s,
                levels: a
            })]
        }
        const c = go + cn,
            f = new Uint32Array(t.buffer, c, uu / Uint32Array.BYTES_PER_ELEMENT),
            p = f[fn.DXGI_FORMAT],
            m = f[fn.RESOURCE_DIMENSION],
            v = f[fn.MISC_FLAG],
            _ = f[fn.ARRAY_SIZE],
            y = G1[p];
        if (y === void 0) throw new Error(`DDSParser cannot parse texture data with DXGI format ${p}`);
        if (v === L1) throw new Error("DDSParser does not support cubemap textures");
        if (m === 6) throw new Error("DDSParser does not supported 3D texture data");
        const A = new Array,
            I = go + cn + uu;
        if (_ === 1) A.push(new Uint8Array(e, I));
        else {
            const x = Vn[y];
            let S = 0,
                $ = n,
                k = s;
            for (let L = 0; L < a; L++) {
                const Y = Math.max(1, $ + 3 & -4),
                    et = Math.max(1, k + 3 & -4),
                    E = Y * et * x;
                S += E, $ = $ >>> 1, k = k >>> 1
            }
            let G = I;
            for (let L = 0; L < _; L++) A.push(new Uint8Array(e, G, S)), G += S
        }
        return A.map(x => new Zr(x, {
            format: y,
            width: n,
            height: s,
            levels: a
        }))
    }
    throw h & P1 ? new Error("DDSParser does not support uncompressed texture data.") : h & N1 ? new Error("DDSParser does not supported YUV uncompressed texture data.") : h & D1 ? new Error("DDSParser does not support single-channel (lumninance) texture data!") : h & R1 ? new Error("DDSParser does not support single-channel (alpha) texture data!") : new Error("DDSParser failed to load a texture file due to an unknown reason!")
}
const fu = [171, 75, 84, 88, 32, 49, 49, 187, 13, 10, 26, 10],
    H1 = 67305985,
    Oe = {
        FILE_IDENTIFIER: 0,
        ENDIANNESS: 12,
        GL_TYPE: 16,
        GL_TYPE_SIZE: 20,
        GL_FORMAT: 24,
        GL_INTERNAL_FORMAT: 28,
        GL_BASE_INTERNAL_FORMAT: 32,
        PIXEL_WIDTH: 36,
        PIXEL_HEIGHT: 40,
        PIXEL_DEPTH: 44,
        NUMBER_OF_ARRAY_ELEMENTS: 48,
        NUMBER_OF_FACES: 52,
        NUMBER_OF_MIPMAP_LEVELS: 56,
        BYTES_OF_KEY_VALUE_DATA: 60
    },
    eh = 64,
    du = {
        [ot.UNSIGNED_BYTE]: 1,
        [ot.UNSIGNED_SHORT]: 2,
        [ot.INT]: 4,
        [ot.UNSIGNED_INT]: 4,
        [ot.FLOAT]: 4,
        [ot.HALF_FLOAT]: 8
    },
    V1 = {
        [W.RGBA]: 4,
        [W.RGB]: 3,
        [W.RG]: 2,
        [W.RED]: 1,
        [W.LUMINANCE]: 1,
        [W.LUMINANCE_ALPHA]: 2,
        [W.ALPHA]: 1
    },
    z1 = {
        [ot.UNSIGNED_SHORT_4_4_4_4]: 2,
        [ot.UNSIGNED_SHORT_5_5_5_1]: 2,
        [ot.UNSIGNED_SHORT_5_6_5]: 2
    };

function X1(e, t, r = !1) {
    const i = new DataView(t);
    if (!j1(e, i)) return null;
    const s = i.getUint32(Oe.ENDIANNESS, !0) === H1,
        n = i.getUint32(Oe.GL_TYPE, s),
        a = i.getUint32(Oe.GL_FORMAT, s),
        o = i.getUint32(Oe.GL_INTERNAL_FORMAT, s),
        h = i.getUint32(Oe.PIXEL_WIDTH, s),
        l = i.getUint32(Oe.PIXEL_HEIGHT, s) || 1,
        c = i.getUint32(Oe.PIXEL_DEPTH, s) || 1,
        f = i.getUint32(Oe.NUMBER_OF_ARRAY_ELEMENTS, s) || 1,
        p = i.getUint32(Oe.NUMBER_OF_FACES, s),
        m = i.getUint32(Oe.NUMBER_OF_MIPMAP_LEVELS, s),
        v = i.getUint32(Oe.BYTES_OF_KEY_VALUE_DATA, s);
    if (l === 0 || c !== 1) throw new Error("Only 2D textures are supported");
    if (p !== 1) throw new Error("CubeTextures are not supported by KTXLoader yet!");
    if (f !== 1) throw new Error("WebGL does not support array textures");
    const _ = 4,
        y = 4,
        A = h + 3 & -4,
        I = l + 3 & -4,
        x = new Array(f);
    let S = h * l;
    n === 0 && (S = A * I);
    let $;
    if (n !== 0 ? du[n] ? $ = du[n] * V1[a] : $ = z1[n] : $ = Vn[o], $ === void 0) throw new Error("Unable to resolve the pixel format stored in the *.ktx file!");
    const k = r ? Y1(i, v, s) : null;
    let L = S * $,
        Y = h,
        et = l,
        E = A,
        D = I,
        N = eh + v;
    for (let R = 0; R < m; R++) {
        const j = i.getUint32(N, s);
        let H = N + 4;
        for (let U = 0; U < f; U++) {
            let it = x[U];
            it || (it = x[U] = new Array(m)), it[R] = {
                levelID: R,
                levelWidth: m > 1 || n !== 0 ? Y : E,
                levelHeight: m > 1 || n !== 0 ? et : D,
                levelBuffer: new Uint8Array(t, H, L)
            }, H += L
        }
        N += j + 4, N = N % 4 !== 0 ? N + 4 - N % 4 : N, Y = Y >> 1 || 1, et = et >> 1 || 1, E = Y + _ - 1 & ~(_ - 1), D = et + y - 1 & ~(y - 1), L = E * D * $
    }
    return n !== 0 ? {
        uncompressed: x.map(R => {
            let j = R[0].levelBuffer,
                H = !1;
            return n === ot.FLOAT ? j = new Float32Array(R[0].levelBuffer.buffer, R[0].levelBuffer.byteOffset, R[0].levelBuffer.byteLength / 4) : n === ot.UNSIGNED_INT ? (H = !0, j = new Uint32Array(R[0].levelBuffer.buffer, R[0].levelBuffer.byteOffset, R[0].levelBuffer.byteLength / 4)) : n === ot.INT && (H = !0, j = new Int32Array(R[0].levelBuffer.buffer, R[0].levelBuffer.byteOffset, R[0].levelBuffer.byteLength / 4)), {
                resource: new Ms(j, {
                    width: R[0].levelWidth,
                    height: R[0].levelHeight
                }),
                type: n,
                format: H ? W1(a) : a
            }
        }),
        kvData: k
    } : {
        compressed: x.map(R => new Zr(null, {
            format: o,
            width: h,
            height: l,
            levels: m,
            levelBuffers: R
        })),
        kvData: k
    }
}

function j1(e, t) {
    for (let r = 0; r < fu.length; r++)
        if (t.getUint8(r) !== fu[r]) return console.error(`${e} is not a valid *.ktx file!`), !1;
    return !0
}

function W1(e) {
    switch (e) {
        case W.RGBA:
            return W.RGBA_INTEGER;
        case W.RGB:
            return W.RGB_INTEGER;
        case W.RG:
            return W.RG_INTEGER;
        case W.RED:
            return W.RED_INTEGER;
        default:
            return e
    }
}

function Y1(e, t, r) {
    const i = new Map;
    let s = 0;
    for (; s < t;) {
        const n = e.getUint32(eh + s, r),
            a = eh + s + 4,
            o = 3 - (n + 3) % 4;
        if (n === 0 || n > t - s) {
            console.error("KTXLoader: keyAndValueByteSize out of bounds");
            break
        }
        let h = 0;
        for (; h < n && e.getUint8(a + h) !== 0; h++);
        if (h === -1) {
            console.error("KTXLoader: Failed to find null byte terminating kvData key");
            break
        }
        const l = new TextDecoder().decode(new Uint8Array(e.buffer, a, h)),
            c = new DataView(e.buffer, a + h + 1, n - h - 1);
        i.set(l, c), s += 4 + n + o
    }
    return i
}
const q1 = {
    extension: {
        type: J.LoadParser,
        priority: lr.High
    },
    name: "loadDDS",
    test(e) {
        return ai(e, ".dds")
    },
    async load(e, t, r) {
        const s = await (await K.ADAPTER.fetch(e)).arrayBuffer(),
            a = $1(s).map(o => {
                const h = new ct(o, {
                    mipmap: hr.OFF,
                    alphaMode: qe.NO_PREMULTIPLIED_ALPHA,
                    resolution: Nr(e),
                    ...t.data
                });
                return fa(h, r, e)
            });
        return a.length === 1 ? a[0] : a
    },
    unload(e) {
        Array.isArray(e) ? e.forEach(t => t.destroy(!0)) : e.destroy(!0)
    }
};
nt.add(q1);
const Z1 = {
    extension: {
        type: J.LoadParser,
        priority: lr.High
    },
    name: "loadKTX",
    test(e) {
        return ai(e, ".ktx")
    },
    async load(e, t, r) {
        const s = await (await K.ADAPTER.fetch(e)).arrayBuffer(),
            {
                compressed: n,
                uncompressed: a,
                kvData: o
            } = X1(e, s),
            h = n??a,
            l = {
                mipmap: hr.OFF,
                alphaMode: qe.NO_PREMULTIPLIED_ALPHA,
                resolution: Nr(e),
                ...t.data
            },
            c = h.map(f => {
                h === a && Object.assign(l, {
                    type: f.type,
                    format: f.format
                });
                const p = new ct(f, l);
                return p.ktxKeyValueData = o, fa(p, r, e)
            });
        return c.length === 1 ? c[0] : c
    },
    unload(e) {
        Array.isArray(e) ? e.forEach(t => t.destroy(!0)) : e.destroy(!0)
    }
};
nt.add(Z1);
const K1 = {
    extension: J.ResolveParser,
    test: e => {
        const r = e.split("?")[0].split(".").pop();
        return ["basis", "ktx", "dds"].includes(r)
    },
    parse: e => {
        var i, s;
        if (e.split("?")[0].split(".").pop() === "ktx") {
            const n = [".s3tc.ktx", ".s3tc_sRGB.ktx", ".etc.ktx", ".etc1.ktx", ".pvrt.ktx", ".atc.ktx", ".astc.ktx"];
            if (n.some(a => e.endsWith(a))) return {
                resolution: parseFloat(((i = K.RETINA_PREFIX.exec(e)) == null ? void 0 : i[1])??"1"),
                format: n.find(a => e.endsWith(a)),
                src: e
            }
        }
        return {
            resolution: parseFloat(((s = K.RETINA_PREFIX.exec(e)) == null ? void 0 : s[1])??"1"),
            format: e.split(".").pop(),
            src: e
        }
    }
};
nt.add(K1);
const J1 = new _t,
    Q1 = 4,
    cs = class {
        constructor(e) {
            this.renderer = e
        }
        async image(e, t, r) {
            const i = new Image;
            return i.src = await this.base64(e, t, r), i
        }
        async base64(e, t, r) {
            const i = this.canvas(e);
            if (i.toBlob !== void 0) return new Promise((s, n) => {
                i.toBlob(a => {
                    if (!a) {
                        n(new Error("ICanvas.toBlob failed!"));
                        return
                    }
                    const o = new FileReader;
                    o.onload = () => s(o.result), o.onerror = n, o.readAsDataURL(a)
                }, t, r)
            });
            if (i.toDataURL !== void 0) return i.toDataURL(t, r);
            if (i.convertToBlob !== void 0) {
                const s = await i.convertToBlob({
                    type: t,
                    quality: r
                });
                return new Promise((n, a) => {
                    const o = new FileReader;
                    o.onload = () => n(o.result), o.onerror = a, o.readAsDataURL(s)
                })
            }
            throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented")
        }
        canvas(e, t) {
            const {
                pixels: r,
                width: i,
                height: s,
                flipY: n
            } = this._rawPixels(e, t);
            n && cs._flipY(r, i, s), cs._unpremultiplyAlpha(r);
            const a = new ax(i, s, 1),
                o = new ImageData(new Uint8ClampedArray(r.buffer), i, s);
            return a.context.putImageData(o, 0, 0), a.canvas
        }
        pixels(e, t) {
            const {
                pixels: r,
                width: i,
                height: s,
                flipY: n
            } = this._rawPixels(e, t);
            return n && cs._flipY(r, i, s), cs._unpremultiplyAlpha(r), r
        }
        _rawPixels(e, t) {
            const r = this.renderer;
            if (!r) throw new Error("The Extract has already been destroyed");
            let i, s = !1,
                n, a = !1;
            if (e && (e instanceof ni ? n = e : (n = r.generateTexture(e, {
                    resolution: r.resolution,
                    multisample: r.multisample
                }), a = !0)), n) {
                if (i = n.baseTexture.resolution, t = t??n.frame, s = !1, !a) {
                    r.renderTexture.bind(n);
                    const f = n.framebuffer.glFramebuffers[r.CONTEXT_UID];
                    f.blitFramebuffer && r.framebuffer.bind(f.blitFramebuffer)
                }
            } else i = r.resolution, t || (t = J1, t.width = r.width / i, t.height = r.height / i), s = !0, r.renderTexture.bind();
            const o = Math.round(t.width * i),
                h = Math.round(t.height * i),
                l = new Uint8Array(Q1 * o * h),
                c = r.gl;
            return c.readPixels(Math.round(t.x * i), Math.round(t.y * i), o, h, c.RGBA, c.UNSIGNED_BYTE, l), a && (n == null || n.destroy(!0)), {
                pixels: l,
                width: o,
                height: h,
                flipY: s
            }
        }
        destroy() {
            this.renderer = null
        }
        static _flipY(e, t, r) {
            const i = t << 2,
                s = r >> 1,
                n = new Uint8Array(i);
            for (let a = 0; a < s; a++) {
                const o = a * i,
                    h = (r - a - 1) * i;
                n.set(e.subarray(o, o + i)), e.copyWithin(o, h, h + i), e.set(n, h)
            }
        }
        static _unpremultiplyAlpha(e) {
            e instanceof Uint8ClampedArray && (e = new Uint8Array(e.buffer));
            const t = e.length;
            for (let r = 0; r < t; r += 4) {
                const i = e[r + 3];
                if (i !== 0) {
                    const s = 255.001 / i;
                    e[r] = e[r] * s + .5, e[r + 1] = e[r + 1] * s + .5, e[r + 2] = e[r + 2] * s + .5
                }
            }
        }
    };
let Ed = cs;
Ed.extension = {
    name: "extract",
    type: J.RendererSystem
};
nt.add(Ed);
const zn = {
    build(e) {
        const t = e.points;
        let r, i, s, n, a, o;
        if (e.type === le.CIRC) {
            const v = e.shape;
            r = v.x, i = v.y, a = o = v.radius, s = n = 0
        } else if (e.type === le.ELIP) {
            const v = e.shape;
            r = v.x, i = v.y, a = v.width, o = v.height, s = n = 0
        } else {
            const v = e.shape,
                _ = v.width / 2,
                y = v.height / 2;
            r = v.x + _, i = v.y + y, a = o = Math.max(0, Math.min(v.radius, Math.min(_, y))), s = _ - a, n = y - o
        }
        if (!(a >= 0 && o >= 0 && s >= 0 && n >= 0)) {
            t.length = 0;
            return
        }
        const h = Math.ceil(2.3 * Math.sqrt(a + o)),
            l = h * 8 + (s ? 4 : 0) + (n ? 4 : 0);
        if (t.length = l, l === 0) return;
        if (h === 0) {
            t.length = 8, t[0] = t[6] = r + s, t[1] = t[3] = i + n, t[2] = t[4] = r - s, t[5] = t[7] = i - n;
            return
        }
        let c = 0,
            f = h * 4 + (s ? 2 : 0) + 2,
            p = f,
            m = l; {
            const v = s + a,
                _ = n,
                y = r + v,
                A = r - v,
                I = i + _;
            if (t[c++] = y, t[c++] = I, t[--f] = I, t[--f] = A, n) {
                const x = i - _;
                t[p++] = A, t[p++] = x, t[--m] = x, t[--m] = y
            }
        }
        for (let v = 1; v < h; v++) {
            const _ = Math.PI / 2 * (v / h),
                y = s + Math.cos(_) * a,
                A = n + Math.sin(_) * o,
                I = r + y,
                x = r - y,
                S = i + A,
                $ = i - A;
            t[c++] = I, t[c++] = S, t[--f] = S, t[--f] = x, t[p++] = x, t[p++] = $, t[--m] = $, t[--m] = I
        } {
            const v = s,
                _ = n + o,
                y = r + v,
                A = r - v,
                I = i + _,
                x = i - _;
            t[c++] = y, t[c++] = I, t[--m] = x, t[--m] = y, s && (t[c++] = A, t[c++] = I, t[--m] = x, t[--m] = A)
        }
    },
    triangulate(e, t) {
        const r = e.points,
            i = t.points,
            s = t.indices;
        if (r.length === 0) return;
        let n = i.length / 2;
        const a = n;
        let o, h;
        if (e.type !== le.RREC) {
            const c = e.shape;
            o = c.x, h = c.y
        } else {
            const c = e.shape;
            o = c.x + c.width / 2, h = c.y + c.height / 2
        }
        const l = e.matrix;
        i.push(e.matrix ? l.a * o + l.c * h + l.tx : o, e.matrix ? l.b * o + l.d * h + l.ty : h), n++, i.push(r[0], r[1]);
        for (let c = 2; c < r.length; c += 2) i.push(r[c], r[c + 1]), s.push(n++, a, n);
        s.push(a + 1, a, n)
    }
};

function pu(e, t = !1) {
    const r = e.length;
    if (r < 6) return;
    let i = 0;
    for (let s = 0, n = e[r - 2], a = e[r - 1]; s < r; s += 2) {
        const o = e[s],
            h = e[s + 1];
        i += (o - n) * (h + a), n = o, a = h
    }
    if (!t && i > 0 || t && i <= 0) {
        const s = r / 2;
        for (let n = s + s % 2; n < r; n += 2) {
            const a = r - n - 2,
                o = r - n - 1,
                h = n,
                l = n + 1;
            [e[a], e[h]] = [e[h], e[a]], [e[o], e[l]] = [e[l], e[o]]
        }
    }
}
const Td = {
        build(e) {
            e.points = e.shape.points.slice()
        },
        triangulate(e, t) {
            let r = e.points;
            const i = e.holes,
                s = t.points,
                n = t.indices;
            if (r.length >= 6) {
                pu(r, !1);
                const a = [];
                for (let l = 0; l < i.length; l++) {
                    const c = i[l];
                    pu(c.points, !0), a.push(r.length / 2), r = r.concat(c.points)
                }
                const o = Fn(r, a, 2);
                if (!o) return;
                const h = s.length / 2;
                for (let l = 0; l < o.length; l += 3) n.push(o[l] + h), n.push(o[l + 1] + h), n.push(o[l + 2] + h);
                for (let l = 0; l < r.length; l++) s.push(r[l])
            }
        }
    },
    tw = {
        build(e) {
            const t = e.shape,
                r = t.x,
                i = t.y,
                s = t.width,
                n = t.height,
                a = e.points;
            a.length = 0, s >= 0 && n >= 0 && a.push(r, i, r + s, i, r + s, i + n, r, i + n)
        },
        triangulate(e, t) {
            const r = e.points,
                i = t.points;
            if (r.length === 0) return;
            const s = i.length / 2;
            i.push(r[0], r[1], r[2], r[3], r[6], r[7], r[4], r[5]), t.indices.push(s, s + 1, s + 2, s + 1, s + 2, s + 3)
        }
    },
    ew = {
        build(e) {
            zn.build(e)
        },
        triangulate(e, t) {
            zn.triangulate(e, t)
        }
    };
var de = (e => (e.MITER = "miter", e.BEVEL = "bevel", e.ROUND = "round", e))(de || {}),
    He = (e => (e.BUTT = "butt", e.ROUND = "round", e.SQUARE = "square", e))(He || {});
const zi = {
    adaptive: !0,
    maxLength: 10,
    minSegments: 8,
    maxSegments: 2048,
    epsilon: 1e-4,
    _segmentsCount(e, t = 20) {
        if (!this.adaptive || !e || isNaN(e)) return t;
        let r = Math.ceil(e / this.maxLength);
        return r < this.minSegments ? r = this.minSegments : r > this.maxSegments && (r = this.maxSegments), r
    }
};
class mu {
    static curveTo(t, r, i, s, n, a) {
        const o = a[a.length - 2],
            l = a[a.length - 1] - r,
            c = o - t,
            f = s - r,
            p = i - t,
            m = Math.abs(l * p - c * f);
        if (m < 1e-8 || n === 0) return (a[a.length - 2] !== t || a[a.length - 1] !== r) && a.push(t, r), null;
        const v = l * l + c * c,
            _ = f * f + p * p,
            y = l * f + c * p,
            A = n * Math.sqrt(v) / m,
            I = n * Math.sqrt(_) / m,
            x = A * y / v,
            S = I * y / _,
            $ = A * p + I * c,
            k = A * f + I * l,
            G = c * (I + x),
            L = l * (I + x),
            Y = p * (A + S),
            et = f * (A + S),
            E = Math.atan2(L - k, G - $),
            D = Math.atan2(et - k, Y - $);
        return {
            cx: $ + t,
            cy: k + r,
            radius: n,
            startAngle: E,
            endAngle: D,
            anticlockwise: c * f > p * l
        }
    }
    static arc(t, r, i, s, n, a, o, h, l) {
        const c = o - a,
            f = zi._segmentsCount(Math.abs(c) * n, Math.ceil(Math.abs(c) / Gn) * 40),
            p = c / (f * 2),
            m = p * 2,
            v = Math.cos(p),
            _ = Math.sin(p),
            y = f - 1,
            A = y % 1 / y;
        for (let I = 0; I <= y; ++I) {
            const x = I + A * I,
                S = p + a + m * x,
                $ = Math.cos(S),
                k = -Math.sin(S);
            l.push((v * $ + _ * k) * n + i, (v * -k + _ * $) * n + s)
        }
    }
}
class rw {
    constructor() {
        this.reset()
    }
    begin(t, r, i) {
        this.reset(), this.style = t, this.start = r, this.attribStart = i
    }
    end(t, r) {
        this.attribSize = r - this.attribStart, this.size = t - this.start
    }
    reset() {
        this.style = null, this.size = 0, this.start = 0, this.attribStart = 0, this.attribSize = 0
    }
}
class Sh {
    static curveLength(t, r, i, s, n, a, o, h) {
        let c = 0,
            f = 0,
            p = 0,
            m = 0,
            v = 0,
            _ = 0,
            y = 0,
            A = 0,
            I = 0,
            x = 0,
            S = 0,
            $ = t,
            k = r;
        for (let G = 1; G <= 10; ++G) f = G / 10, p = f * f, m = p * f, v = 1 - f, _ = v * v, y = _ * v, A = y * t + 3 * _ * f * i + 3 * v * p * n + m * o, I = y * r + 3 * _ * f * s + 3 * v * p * a + m * h, x = $ - A, S = k - I, $ = A, k = I, c += Math.sqrt(x * x + S * S);
        return c
    }
    static curveTo(t, r, i, s, n, a, o) {
        const h = o[o.length - 2],
            l = o[o.length - 1];
        o.length -= 2;
        const c = zi._segmentsCount(Sh.curveLength(h, l, t, r, i, s, n, a));
        let f = 0,
            p = 0,
            m = 0,
            v = 0,
            _ = 0;
        o.push(h, l);
        for (let y = 1, A = 0; y <= c; ++y) A = y / c, f = 1 - A, p = f * f, m = p * f, v = A * A, _ = v * A, o.push(m * h + 3 * p * A * t + 3 * f * v * i + _ * n, m * l + 3 * p * A * r + 3 * f * v * s + _ * a)
    }
}

function gu(e, t, r, i, s, n, a, o) {
    const h = e - r * s,
        l = t - i * s,
        c = e + r * n,
        f = t + i * n;
    let p, m;
    a ? (p = i, m = -r) : (p = -i, m = r);
    const v = h + p,
        _ = l + m,
        y = c + p,
        A = f + m;
    return o.push(v, _, y, A), 2
}

function Hr(e, t, r, i, s, n, a, o) {
    const h = r - e,
        l = i - t;
    let c = Math.atan2(h, l),
        f = Math.atan2(s - e, n - t);
    o && c < f ? c += Math.PI * 2 : !o && c > f && (f += Math.PI * 2);
    let p = c;
    const m = f - c,
        v = Math.abs(m),
        _ = Math.sqrt(h * h + l * l),
        y = (15 * v * Math.sqrt(_) / Math.PI >> 0) + 1,
        A = m / y;
    if (p += A, o) {
        a.push(e, t, r, i);
        for (let I = 1, x = p; I < y; I++, x += A) a.push(e, t, e + Math.sin(x) * _, t + Math.cos(x) * _);
        a.push(e, t, s, n)
    } else {
        a.push(r, i, e, t);
        for (let I = 1, x = p; I < y; I++, x += A) a.push(e + Math.sin(x) * _, t + Math.cos(x) * _, e, t);
        a.push(s, n, e, t)
    }
    return y * 2
}

function iw(e, t) {
    const r = e.shape;
    let i = e.points || r.points.slice();
    const s = t.closePointEps;
    if (i.length === 0) return;
    const n = e.lineStyle,
        a = new Lt(i[0], i[1]),
        o = new Lt(i[i.length - 2], i[i.length - 1]),
        h = r.type !== le.POLY || r.closeStroke,
        l = Math.abs(a.x - o.x) < s && Math.abs(a.y - o.y) < s;
    if (h) {
        i = i.slice(), l && (i.pop(), i.pop(), o.set(i[i.length - 2], i[i.length - 1]));
        const U = (a.x + o.x) * .5,
            it = (o.y + a.y) * .5;
        i.unshift(U, it), i.push(U, it)
    }
    const c = t.points,
        f = i.length / 2;
    let p = i.length;
    const m = c.length / 2,
        v = n.width / 2,
        _ = v * v,
        y = n.miterLimit * n.miterLimit;
    let A = i[0],
        I = i[1],
        x = i[2],
        S = i[3],
        $ = 0,
        k = 0,
        G = -(I - S),
        L = A - x,
        Y = 0,
        et = 0,
        E = Math.sqrt(G * G + L * L);
    G /= E, L /= E, G *= v, L *= v;
    const D = n.alignment,
        N = (1 - D) * 2,
        R = D * 2;
    h || (n.cap === He.ROUND ? p += Hr(A - G * (N - R) * .5, I - L * (N - R) * .5, A - G * N, I - L * N, A + G * R, I + L * R, c, !0) + 2 : n.cap === He.SQUARE && (p += gu(A, I, G, L, N, R, !0, c))), c.push(A - G * N, I - L * N, A + G * R, I + L * R);
    for (let U = 1; U < f - 1; ++U) {
        A = i[(U - 1) * 2], I = i[(U - 1) * 2 + 1], x = i[U * 2], S = i[U * 2 + 1], $ = i[(U + 1) * 2], k = i[(U + 1) * 2 + 1], G = -(I - S), L = A - x, E = Math.sqrt(G * G + L * L), G /= E, L /= E, G *= v, L *= v, Y = -(S - k), et = x - $, E = Math.sqrt(Y * Y + et * et), Y /= E, et /= E, Y *= v, et *= v;
        const it = x - A,
            at = I - S,
            O = x - $,
            Z = k - S,
            ut = it * O + at * Z,
            ft = at * O - Z * it,
            dt = ft < 0;
        if (Math.abs(ft) < .001 * Math.abs(ut)) {
            c.push(x - G * N, S - L * N, x + G * R, S + L * R), ut >= 0 && (n.join === de.ROUND ? p += Hr(x, S, x - G * N, S - L * N, x - Y * N, S - et * N, c, !1) + 4 : p += 2, c.push(x - Y * R, S - et * R, x + Y * N, S + et * N));
            continue
        }
        const Nt = (-G + A) * (-L + S) - (-G + x) * (-L + I),
            xt = (-Y + $) * (-et + S) - (-Y + x) * (-et + k),
            Dt = (it * xt - O * Nt) / ft,
            Ft = (Z * Nt - at * xt) / ft,
            zt = (Dt - x) * (Dt - x) + (Ft - S) * (Ft - S),
            Ut = x + (Dt - x) * N,
            Pt = S + (Ft - S) * N,
            Xt = x - (Dt - x) * R,
            jt = S - (Ft - S) * R,
            pe = Math.min(it * it + at * at, O * O + Z * Z),
            Ce = dt ? N : R,
            kr = pe + Ce * Ce * _,
            xa = zt <= kr;
        let Er = n.join;
        if (Er === de.MITER && zt / _ > y && (Er = de.BEVEL), xa) switch (Er) {
            case de.MITER:
                {
                    c.push(Ut, Pt, Xt, jt);
                    break
                }
            case de.BEVEL:
                {
                    dt ? c.push(Ut, Pt, x + G * R, S + L * R, Ut, Pt, x + Y * R, S + et * R) : c.push(x - G * N, S - L * N, Xt, jt, x - Y * N, S - et * N, Xt, jt),
                    p += 2;
                    break
                }
            case de.ROUND:
                {
                    dt ? (c.push(Ut, Pt, x + G * R, S + L * R), p += Hr(x, S, x + G * R, S + L * R, x + Y * R, S + et * R, c, !0) + 4, c.push(Ut, Pt, x + Y * R, S + et * R)) : (c.push(x - G * N, S - L * N, Xt, jt), p += Hr(x, S, x - G * N, S - L * N, x - Y * N, S - et * N, c, !1) + 4, c.push(x - Y * N, S - et * N, Xt, jt));
                    break
                }
        } else {
            switch (c.push(x - G * N, S - L * N, x + G * R, S + L * R), Er) {
                case de.MITER:
                    {
                        dt ? c.push(Xt, jt, Xt, jt) : c.push(Ut, Pt, Ut, Pt),
                        p += 2;
                        break
                    }
                case de.ROUND:
                    {
                        dt ? p += Hr(x, S, x + G * R, S + L * R, x + Y * R, S + et * R, c, !0) + 2 : p += Hr(x, S, x - G * N, S - L * N, x - Y * N, S - et * N, c, !1) + 2;
                        break
                    }
            }
            c.push(x - Y * N, S - et * N, x + Y * R, S + et * R), p += 2
        }
    }
    A = i[(f - 2) * 2], I = i[(f - 2) * 2 + 1], x = i[(f - 1) * 2], S = i[(f - 1) * 2 + 1], G = -(I - S), L = A - x, E = Math.sqrt(G * G + L * L), G /= E, L /= E, G *= v, L *= v, c.push(x - G * N, S - L * N, x + G * R, S + L * R), h || (n.cap === He.ROUND ? p += Hr(x - G * (N - R) * .5, S - L * (N - R) * .5, x - G * N, S - L * N, x + G * R, S + L * R, c, !1) + 2 : n.cap === He.SQUARE && (p += gu(x, S, G, L, N, R, !1, c)));
    const j = t.indices,
        H = zi.epsilon * zi.epsilon;
    for (let U = m; U < p + m - 2; ++U) A = c[U * 2], I = c[U * 2 + 1], x = c[(U + 1) * 2], S = c[(U + 1) * 2 + 1], $ = c[(U + 2) * 2], k = c[(U + 2) * 2 + 1], !(Math.abs(A * (S - k) + x * (k - I) + $ * (I - S)) < H) && j.push(U, U + 1, U + 2)
}

function sw(e, t) {
    let r = 0;
    const i = e.shape,
        s = e.points || i.points,
        n = i.type !== le.POLY || i.closeStroke;
    if (s.length === 0) return;
    const a = t.points,
        o = t.indices,
        h = s.length / 2,
        l = a.length / 2;
    let c = l;
    for (a.push(s[0], s[1]), r = 1; r < h; r++) a.push(s[r * 2], s[r * 2 + 1]), o.push(c, c + 1), c++;
    n && o.push(c, l)
}

function vu(e, t) {
    e.lineStyle.native ? sw(e, t) : iw(e, t)
}
class Ih {
    static curveLength(t, r, i, s, n, a) {
        const o = t - 2 * i + n,
            h = r - 2 * s + a,
            l = 2 * i - 2 * t,
            c = 2 * s - 2 * r,
            f = 4 * (o * o + h * h),
            p = 4 * (o * l + h * c),
            m = l * l + c * c,
            v = 2 * Math.sqrt(f + p + m),
            _ = Math.sqrt(f),
            y = 2 * f * _,
            A = 2 * Math.sqrt(m),
            I = p / _;
        return (y * v + _ * p * (v - A) + (4 * m * f - p * p) * Math.log((2 * _ + I + v) / (I + A))) / (4 * y)
    }
    static curveTo(t, r, i, s, n) {
        const a = n[n.length - 2],
            o = n[n.length - 1],
            h = zi._segmentsCount(Ih.curveLength(a, o, t, r, i, s));
        let l = 0,
            c = 0;
        for (let f = 1; f <= h; ++f) {
            const p = f / h;
            l = a + (t - a) * p, c = o + (r - o) * p, n.push(l + (t + (i - t) * p - l) * p, c + (r + (s - r) * p - c) * p)
        }
    }
}
const vo = {
        [le.POLY]: Td,
        [le.CIRC]: zn,
        [le.ELIP]: zn,
        [le.RECT]: tw,
        [le.RREC]: ew
    },
    _u = [],
    dn = [];
class Xn {
    constructor(t, r = null, i = null, s = null) {
        this.points = [], this.holes = [], this.shape = t, this.lineStyle = i, this.fillStyle = r, this.matrix = s, this.type = t.type
    }
    clone() {
        return new Xn(this.shape, this.fillStyle, this.lineStyle, this.matrix)
    }
    destroy() {
        this.shape = null, this.holes.length = 0, this.holes = null, this.points.length = 0, this.points = null, this.lineStyle = null, this.fillStyle = null
    }
}
const yi = new Lt,
    Ad = class extends Of {
        constructor() {
            super(), this.closePointEps = 1e-4, this.boundsPadding = 0, this.uvsFloat32 = null, this.indicesUint16 = null, this.batchable = !1, this.points = [], this.colors = [], this.uvs = [], this.indices = [], this.textureIds = [], this.graphicsData = [], this.drawCalls = [], this.batchDirty = -1, this.batches = [], this.dirty = 0, this.cacheDirty = -1, this.clearDirty = 0, this.shapeIndex = 0, this._bounds = new $n, this.boundsDirty = -1
        }
        get bounds() {
            return this.updateBatches(), this.boundsDirty !== this.dirty && (this.boundsDirty = this.dirty, this.calculateBounds()), this._bounds
        }
        invalidate() {
            this.boundsDirty = -1, this.dirty++, this.batchDirty++, this.shapeIndex = 0, this.points.length = 0, this.colors.length = 0, this.uvs.length = 0, this.indices.length = 0, this.textureIds.length = 0;
            for (let e = 0; e < this.drawCalls.length; e++) this.drawCalls[e].texArray.clear(), dn.push(this.drawCalls[e]);
            this.drawCalls.length = 0;
            for (let e = 0; e < this.batches.length; e++) {
                const t = this.batches[e];
                t.reset(), _u.push(t)
            }
            this.batches.length = 0
        }
        clear() {
            return this.graphicsData.length > 0 && (this.invalidate(), this.clearDirty++, this.graphicsData.length = 0), this
        }
        drawShape(e, t = null, r = null, i = null) {
            const s = new Xn(e, t, r, i);
            return this.graphicsData.push(s), this.dirty++, this
        }
        drawHole(e, t = null) {
            if (!this.graphicsData.length) return null;
            const r = new Xn(e, null, null, t),
                i = this.graphicsData[this.graphicsData.length - 1];
            return r.lineStyle = i.lineStyle, i.holes.push(r), this.dirty++, this
        }
        destroy() {
            super.destroy();
            for (let e = 0; e < this.graphicsData.length; ++e) this.graphicsData[e].destroy();
            this.points.length = 0, this.points = null, this.colors.length = 0, this.colors = null, this.uvs.length = 0, this.uvs = null, this.indices.length = 0, this.indices = null, this.indexBuffer.destroy(), this.indexBuffer = null, this.graphicsData.length = 0, this.graphicsData = null, this.drawCalls.length = 0, this.drawCalls = null, this.batches.length = 0, this.batches = null, this._bounds = null
        }
        containsPoint(e) {
            const t = this.graphicsData;
            for (let r = 0; r < t.length; ++r) {
                const i = t[r];
                if (i.fillStyle.visible && i.shape && (i.matrix ? i.matrix.applyInverse(e, yi) : yi.copyFrom(e), i.shape.contains(yi.x, yi.y))) {
                    let s = !1;
                    if (i.holes) {
                        for (let n = 0; n < i.holes.length; n++)
                            if (i.holes[n].shape.contains(yi.x, yi.y)) {
                                s = !0;
                                break
                            }
                    }
                    if (!s) return !0
                }
            }
            return !1
        }
        updateBatches() {
            if (!this.graphicsData.length) {
                this.batchable = !0;
                return
            }
            if (!this.validateBatching()) return;
            this.cacheDirty = this.dirty;
            const e = this.uvs,
                t = this.graphicsData;
            let r = null,
                i = null;
            this.batches.length > 0 && (r = this.batches[this.batches.length - 1], i = r.style);
            for (let o = this.shapeIndex; o < t.length; o++) {
                this.shapeIndex++;
                const h = t[o],
                    l = h.fillStyle,
                    c = h.lineStyle;
                vo[h.type].build(h), h.matrix && this.transformPoints(h.points, h.matrix), (l.visible || c.visible) && this.processHoles(h.holes);
                for (let p = 0; p < 2; p++) {
                    const m = p === 0 ? l : c;
                    if (!m.visible) continue;
                    const v = m.texture.baseTexture,
                        _ = this.indices.length,
                        y = this.points.length / 2;
                    v.wrapMode = Mr.REPEAT, p === 0 ? this.processFill(h) : this.processLine(h);
                    const A = this.points.length / 2 - y;
                    A !== 0 && (r && !this._compareStyles(i, m) && (r.end(_, y), r = null), r || (r = _u.pop() || new rw, r.begin(m, _, y), this.batches.push(r), i = m), this.addUvs(this.points, e, m.texture, y, A, m.matrix))
                }
            }
            const s = this.indices.length,
                n = this.points.length / 2;
            if (r && r.end(s, n), this.batches.length === 0) {
                this.batchable = !0;
                return
            }
            const a = n > 65535;
            this.indicesUint16 && this.indices.length === this.indicesUint16.length && a === this.indicesUint16.BYTES_PER_ELEMENT > 2 ? this.indicesUint16.set(this.indices) : this.indicesUint16 = a ? new Uint32Array(this.indices) : new Uint16Array(this.indices), this.batchable = this.isBatchable(), this.batchable ? this.packBatches() : this.buildDrawCalls()
        }
        _compareStyles(e, t) {
            return !(!e || !t || e.texture.baseTexture !== t.texture.baseTexture || e.color + e.alpha !== t.color + t.alpha || !!e.native != !!t.native)
        }
        validateBatching() {
            if (this.dirty === this.cacheDirty || !this.graphicsData.length) return !1;
            for (let e = 0, t = this.graphicsData.length; e < t; e++) {
                const r = this.graphicsData[e],
                    i = r.fillStyle,
                    s = r.lineStyle;
                if (i && !i.texture.baseTexture.valid || s && !s.texture.baseTexture.valid) return !1
            }
            return !0
        }
        packBatches() {
            this.batchDirty++, this.uvsFloat32 = new Float32Array(this.uvs);
            const e = this.batches;
            for (let t = 0, r = e.length; t < r; t++) {
                const i = e[t];
                for (let s = 0; s < i.size; s++) {
                    const n = i.start + s;
                    this.indicesUint16[n] = this.indicesUint16[n] - i.attribStart
                }
            }
        }
        isBatchable() {
            if (this.points.length > 65535 * 2) return !1;
            const e = this.batches;
            for (let t = 0; t < e.length; t++)
                if (e[t].style.native) return !1;
            return this.points.length < Ad.BATCHABLE_SIZE * 2
        }
        buildDrawCalls() {
            let e = ++ct._globalBatch;
            for (let c = 0; c < this.drawCalls.length; c++) this.drawCalls[c].texArray.clear(), dn.push(this.drawCalls[c]);
            this.drawCalls.length = 0;
            const t = this.colors,
                r = this.textureIds;
            let i = dn.pop();
            i || (i = new Vo, i.texArray = new Xo), i.texArray.count = 0, i.start = 0, i.size = 0, i.type = tr.TRIANGLES;
            let s = 0,
                n = null,
                a = 0,
                o = !1,
                h = tr.TRIANGLES,
                l = 0;
            this.drawCalls.push(i);
            for (let c = 0; c < this.batches.length; c++) {
                const f = this.batches[c],
                    p = 8,
                    m = f.style,
                    v = m.texture.baseTexture;
                o !== !!m.native && (o = !!m.native, h = o ? tr.LINES : tr.TRIANGLES, n = null, s = p, e++), n !== v && (n = v, v._batchEnabled !== e && (s === p && (e++, s = 0, i.size > 0 && (i = dn.pop(), i || (i = new Vo, i.texArray = new Xo), this.drawCalls.push(i)), i.start = l, i.size = 0, i.texArray.count = 0, i.type = h), v.touched = 1, v._batchEnabled = e, v._batchLocation = s, v.wrapMode = Mr.REPEAT, i.texArray.elements[i.texArray.count++] = v, s++)), i.size += f.size, l += f.size, a = v._batchLocation, this.addColors(t, m.color, m.alpha, f.attribSize, f.attribStart), this.addTextureIds(r, a, f.attribSize, f.attribStart)
            }
            ct._globalBatch = e, this.packAttributes()
        }
        packAttributes() {
            const e = this.points,
                t = this.uvs,
                r = this.colors,
                i = this.textureIds,
                s = new ArrayBuffer(e.length * 3 * 4),
                n = new Float32Array(s),
                a = new Uint32Array(s);
            let o = 0;
            for (let h = 0; h < e.length / 2; h++) n[o++] = e[h * 2], n[o++] = e[h * 2 + 1], n[o++] = t[h * 2], n[o++] = t[h * 2 + 1], a[o++] = r[h], n[o++] = i[h];
            this._buffer.update(s), this._indexBuffer.update(this.indicesUint16)
        }
        processFill(e) {
            e.holes.length ? Td.triangulate(e, this) : vo[e.type].triangulate(e, this)
        }
        processLine(e) {
            vu(e, this);
            for (let t = 0; t < e.holes.length; t++) vu(e.holes[t], this)
        }
        processHoles(e) {
            for (let t = 0; t < e.length; t++) {
                const r = e[t];
                vo[r.type].build(r), r.matrix && this.transformPoints(r.points, r.matrix)
            }
        }
        calculateBounds() {
            const e = this._bounds;
            e.clear(), e.addVertexData(this.points, 0, this.points.length), e.pad(this.boundsPadding, this.boundsPadding)
        }
        transformPoints(e, t) {
            for (let r = 0; r < e.length / 2; r++) {
                const i = e[r * 2],
                    s = e[r * 2 + 1];
                e[r * 2] = t.a * i + t.c * s + t.tx, e[r * 2 + 1] = t.b * i + t.d * s + t.ty
            }
        }
        addColors(e, t, r, i, s = 0) {
            const n = Ot.shared.setValue(t).toLittleEndianNumber(),
                a = Ot.shared.setValue(n).toPremultiplied(r);
            e.length = Math.max(e.length, s + i);
            for (let o = 0; o < i; o++) e[s + o] = a
        }
        addTextureIds(e, t, r, i = 0) {
            e.length = Math.max(e.length, i + r);
            for (let s = 0; s < r; s++) e[i + s] = t
        }
        addUvs(e, t, r, i, s, n = null) {
            let a = 0;
            const o = t.length,
                h = r.frame;
            for (; a < s;) {
                let c = e[(i + a) * 2],
                    f = e[(i + a) * 2 + 1];
                if (n) {
                    const p = n.a * c + n.c * f + n.tx;
                    f = n.b * c + n.d * f + n.ty, c = p
                }
                a++, t.push(c / h.width, f / h.height)
            }
            const l = r.baseTexture;
            (h.width < l.width || h.height < l.height) && this.adjustUvs(t, r, o, s)
        }
        adjustUvs(e, t, r, i) {
            const s = t.baseTexture,
                n = 1e-6,
                a = r + i * 2,
                o = t.frame,
                h = o.width / s.width,
                l = o.height / s.height;
            let c = o.x / o.width,
                f = o.y / o.height,
                p = Math.floor(e[r] + n),
                m = Math.floor(e[r + 1] + n);
            for (let v = r + 2; v < a; v += 2) p = Math.min(p, Math.floor(e[v] + n)), m = Math.min(m, Math.floor(e[v + 1] + n));
            c -= p, f -= m;
            for (let v = r; v < a; v += 2) e[v] = (e[v] + c) * h, e[v + 1] = (e[v + 1] + f) * l
        }
    };
let Cd = Ad;
Cd.BATCHABLE_SIZE = 100;
class pa {
    constructor() {
        this.color = 16777215, this.alpha = 1, this.texture = st.WHITE, this.matrix = null, this.visible = !1, this.reset()
    }
    clone() {
        const t = new pa;
        return t.color = this.color, t.alpha = this.alpha, t.texture = this.texture, t.matrix = this.matrix, t.visible = this.visible, t
    }
    reset() {
        this.color = 16777215, this.alpha = 1, this.texture = st.WHITE, this.matrix = null, this.visible = !1
    }
    destroy() {
        this.texture = null, this.matrix = null
    }
}
class Rh extends pa {
    constructor() {
        super(...arguments), this.width = 0, this.alignment = .5, this.native = !1, this.cap = He.BUTT, this.join = de.MITER, this.miterLimit = 10
    }
    clone() {
        const t = new Rh;
        return t.color = this.color, t.alpha = this.alpha, t.texture = this.texture, t.matrix = this.matrix, t.visible = this.visible, t.width = this.width, t.alignment = this.alignment, t.native = this.native, t.cap = this.cap, t.join = this.join, t.miterLimit = this.miterLimit, t
    }
    reset() {
        super.reset(), this.color = 0, this.alignment = .5, this.width = 0, this.native = !1
    }
}
const _o = {},
    Cn = class extends xe {
        constructor(e = null) {
            super(), this.shader = null, this.pluginName = "batch", this.currentPath = null, this.batches = [], this.batchTint = -1, this.batchDirty = -1, this.vertexData = null, this._fillStyle = new pa, this._lineStyle = new Rh, this._matrix = null, this._holeMode = !1, this.state = br.for2d(), this._geometry = e || new Cd, this._geometry.refCount++, this._transformID = -1, this._tintColor = new Ot(16777215), this.blendMode = lt.NORMAL
        }
        get geometry() {
            return this._geometry
        }
        clone() {
            return this.finishPoly(), new Cn(this._geometry)
        }
        set blendMode(e) {
            this.state.blendMode = e
        }
        get blendMode() {
            return this.state.blendMode
        }
        get tint() {
            return this._tintColor.value
        }
        set tint(e) {
            this._tintColor.setValue(e)
        }
        get fill() {
            return this._fillStyle
        }
        get line() {
            return this._lineStyle
        }
        lineStyle(e = null, t = 0, r, i = .5, s = !1) {
            return typeof e == "number" && (e = {
                width: e,
                color: t,
                alpha: r,
                alignment: i,
                native: s
            }), this.lineTextureStyle(e)
        }
        lineTextureStyle(e) {
            const t = {
                width: 0,
                texture: st.WHITE,
                color: e != null && e.texture ? 16777215 : 0,
                matrix: null,
                alignment: .5,
                native: !1,
                cap: He.BUTT,
                join: de.MITER,
                miterLimit: 10
            };
            e = Object.assign(t, e), this.normalizeColor(e), this.currentPath && this.startPoly();
            const r = e.width > 0 && e.alpha > 0;
            return r ? (e.matrix && (e.matrix = e.matrix.clone(), e.matrix.invert()), Object.assign(this._lineStyle, {
                visible: r
            }, e)) : this._lineStyle.reset(), this
        }
        startPoly() {
            if (this.currentPath) {
                const e = this.currentPath.points,
                    t = this.currentPath.points.length;
                t > 2 && (this.drawShape(this.currentPath), this.currentPath = new Fi, this.currentPath.closeStroke = !1, this.currentPath.points.push(e[t - 2], e[t - 1]))
            } else this.currentPath = new Fi, this.currentPath.closeStroke = !1
        }
        finishPoly() {
            this.currentPath && (this.currentPath.points.length > 2 ? (this.drawShape(this.currentPath), this.currentPath = null) : this.currentPath.points.length = 0)
        }
        moveTo(e, t) {
            return this.startPoly(), this.currentPath.points[0] = e, this.currentPath.points[1] = t, this
        }
        lineTo(e, t) {
            this.currentPath || this.moveTo(0, 0);
            const r = this.currentPath.points,
                i = r[r.length - 2],
                s = r[r.length - 1];
            return (i !== e || s !== t) && r.push(e, t), this
        }
        _initCurve(e = 0, t = 0) {
            this.currentPath ? this.currentPath.points.length === 0 && (this.currentPath.points = [e, t]) : this.moveTo(e, t)
        }
        quadraticCurveTo(e, t, r, i) {
            this._initCurve();
            const s = this.currentPath.points;
            return s.length === 0 && this.moveTo(0, 0), Ih.curveTo(e, t, r, i, s), this
        }
        bezierCurveTo(e, t, r, i, s, n) {
            return this._initCurve(), Sh.curveTo(e, t, r, i, s, n, this.currentPath.points), this
        }
        arcTo(e, t, r, i, s) {
            this._initCurve(e, t);
            const n = this.currentPath.points,
                a = mu.curveTo(e, t, r, i, s, n);
            if (a) {
                const {
                    cx: o,
                    cy: h,
                    radius: l,
                    startAngle: c,
                    endAngle: f,
                    anticlockwise: p
                } = a;
                this.arc(o, h, l, c, f, p)
            }
            return this
        }
        arc(e, t, r, i, s, n = !1) {
            if (i === s) return this;
            if (!n && s <= i ? s += Gn : n && i <= s && (i += Gn), s - i === 0) return this;
            const o = e + Math.cos(i) * r,
                h = t + Math.sin(i) * r,
                l = this._geometry.closePointEps;
            let c = this.currentPath ? this.currentPath.points : null;
            if (c) {
                const f = Math.abs(c[c.length - 2] - o),
                    p = Math.abs(c[c.length - 1] - h);
                f < l && p < l || c.push(o, h)
            } else this.moveTo(o, h), c = this.currentPath.points;
            return mu.arc(o, h, e, t, r, i, s, n, c), this
        }
        beginFill(e = 0, t) {
            return this.beginTextureFill({
                texture: st.WHITE,
                color: e,
                alpha: t
            })
        }
        normalizeColor(e) {
            const t = Ot.shared.setValue(e.color??0);
            e.color = t.toNumber(), e.alpha??(e.alpha = t.alpha)
        }
        beginTextureFill(e) {
            const t = {
                texture: st.WHITE,
                color: 16777215,
                matrix: null
            };
            e = Object.assign(t, e), this.normalizeColor(e), this.currentPath && this.startPoly();
            const r = e.alpha > 0;
            return r ? (e.matrix && (e.matrix = e.matrix.clone(), e.matrix.invert()), Object.assign(this._fillStyle, {
                visible: r
            }, e)) : this._fillStyle.reset(), this
        }
        endFill() {
            return this.finishPoly(), this._fillStyle.reset(), this
        }
        drawRect(e, t, r, i) {
            return this.drawShape(new _t(e, t, r, i))
        }
        drawRoundedRect(e, t, r, i, s) {
            return this.drawShape(new Eh(e, t, r, i, s))
        }
        drawCircle(e, t, r) {
            return this.drawShape(new bh(e, t, r))
        }
        drawEllipse(e, t, r, i) {
            return this.drawShape(new wh(e, t, r, i))
        }
        drawPolygon(...e) {
            let t, r = !0;
            const i = e[0];
            i.points ? (r = i.closeStroke, t = i.points) : Array.isArray(e[0]) ? t = e[0] : t = e;
            const s = new Fi(t);
            return s.closeStroke = r, this.drawShape(s), this
        }
        drawShape(e) {
            return this._holeMode ? this._geometry.drawHole(e, this._matrix) : this._geometry.drawShape(e, this._fillStyle.clone(), this._lineStyle.clone(), this._matrix), this
        }
        clear() {
            return this._geometry.clear(), this._lineStyle.reset(), this._fillStyle.reset(), this._boundsID++, this._matrix = null, this._holeMode = !1, this.currentPath = null, this
        }
        isFastRect() {
            const e = this._geometry.graphicsData;
            return e.length === 1 && e[0].shape.type === le.RECT && !e[0].matrix && !e[0].holes.length && !(e[0].lineStyle.visible && e[0].lineStyle.width)
        }
        _render(e) {
            this.finishPoly();
            const t = this._geometry;
            t.updateBatches(), t.batchable ? (this.batchDirty !== t.batchDirty && this._populateBatches(), this._renderBatched(e)) : (e.batch.flush(), this._renderDirect(e))
        }
        _populateBatches() {
            const e = this._geometry,
                t = this.blendMode,
                r = e.batches.length;
            this.batchTint = -1, this._transformID = -1, this.batchDirty = e.batchDirty, this.batches.length = r, this.vertexData = new Float32Array(e.points);
            for (let i = 0; i < r; i++) {
                const s = e.batches[i],
                    n = s.style.color,
                    a = new Float32Array(this.vertexData.buffer, s.attribStart * 4 * 2, s.attribSize * 2),
                    o = new Float32Array(e.uvsFloat32.buffer, s.attribStart * 4 * 2, s.attribSize * 2),
                    h = new Uint16Array(e.indicesUint16.buffer, s.start * 2, s.size),
                    l = {
                        vertexData: a,
                        blendMode: t,
                        indices: h,
                        uvs: o,
                        _batchRGB: Ot.shared.setValue(n).toRgbArray(),
                        _tintRGB: n,
                        _texture: s.style.texture,
                        alpha: s.style.alpha,
                        worldAlpha: 1
                    };
                this.batches[i] = l
            }
        }
        _renderBatched(e) {
            if (this.batches.length) {
                e.batch.setObjectRenderer(e.plugins[this.pluginName]), this.calculateVertices(), this.calculateTints();
                for (let t = 0, r = this.batches.length; t < r; t++) {
                    const i = this.batches[t];
                    i.worldAlpha = this.worldAlpha * i.alpha, e.plugins[this.pluginName].render(i)
                }
            }
        }
        _renderDirect(e) {
            const t = this._resolveDirectShader(e),
                r = this._geometry,
                i = this.worldAlpha,
                s = t.uniforms,
                n = r.drawCalls;
            s.translationMatrix = this.transform.worldTransform, Ot.shared.setValue(this._tintColor).premultiply(i).toArray(s.tint), e.shader.bind(t), e.geometry.bind(r, t), e.state.set(this.state);
            for (let a = 0, o = n.length; a < o; a++) this._renderDrawCallDirect(e, r.drawCalls[a])
        }
        _renderDrawCallDirect(e, t) {
            const {
                texArray: r,
                type: i,
                size: s,
                start: n
            } = t, a = r.count;
            for (let o = 0; o < a; o++) e.texture.bind(r.elements[o], o);
            e.geometry.draw(i, s, n)
        }
        _resolveDirectShader(e) {
            let t = this.shader;
            const r = this.pluginName;
            if (!t) {
                if (!_o[r]) {
                    const {
                        maxTextures: i
                    } = e.plugins[r], s = new Int32Array(i);
                    for (let o = 0; o < i; o++) s[o] = o;
                    const n = {
                            tint: new Float32Array([1, 1, 1, 1]),
                            translationMatrix: new Gt,
                            default: Xe.from({
                                uSamplers: s
                            }, !0)
                        },
                        a = e.plugins[r]._shader.program;
                    _o[r] = new sr(a, n)
                }
                t = _o[r]
            }
            return t
        }
        _calculateBounds() {
            this.finishPoly();
            const e = this._geometry;
            if (!e.graphicsData.length) return;
            const {
                minX: t,
                minY: r,
                maxX: i,
                maxY: s
            } = e.bounds;
            this._bounds.addFrame(this.transform, t, r, i, s)
        }
        containsPoint(e) {
            return this.worldTransform.applyInverse(e, Cn._TEMP_POINT), this._geometry.containsPoint(Cn._TEMP_POINT)
        }
        calculateTints() {
            if (this.batchTint !== this.tint) {
                this.batchTint = this._tintColor.toNumber();
                for (let e = 0; e < this.batches.length; e++) {
                    const t = this.batches[e];
                    t._tintRGB = Ot.shared.setValue(this._tintColor).multiply(t._batchRGB).toLittleEndianNumber()
                }
            }
        }
        calculateVertices() {
            const e = this.transform._worldID;
            if (this._transformID === e) return;
            this._transformID = e;
            const t = this.transform.worldTransform,
                r = t.a,
                i = t.b,
                s = t.c,
                n = t.d,
                a = t.tx,
                o = t.ty,
                h = this._geometry.points,
                l = this.vertexData;
            let c = 0;
            for (let f = 0; f < h.length; f += 2) {
                const p = h[f],
                    m = h[f + 1];
                l[c++] = r * p + s * m + a, l[c++] = n * m + i * p + o
            }
        }
        closePath() {
            const e = this.currentPath;
            return e && (e.closeStroke = !0, this.finishPoly()), this
        }
        setMatrix(e) {
            return this._matrix = e, this
        }
        beginHole() {
            return this.finishPoly(), this._holeMode = !0, this
        }
        endHole() {
            return this.finishPoly(), this._holeMode = !1, this
        }
        destroy(e) {
            this._geometry.refCount--, this._geometry.refCount === 0 && this._geometry.dispose(), this._matrix = null, this.currentPath = null, this._lineStyle.destroy(), this._lineStyle = null, this._fillStyle.destroy(), this._fillStyle = null, this._geometry = null, this.shader = null, this.vertexData = null, this.batches.length = 0, this.batches = null, super.destroy(e)
        }
    };
let Ds = Cn;
Ds.curves = zi;
Ds._TEMP_POINT = new Lt;
class nw {
    constructor(t, r) {
        this.uvBuffer = t, this.uvMatrix = r, this.data = null, this._bufferUpdateId = -1, this._textureUpdateId = -1, this._updateID = 0
    }
    update(t) {
        if (!t && this._bufferUpdateId === this.uvBuffer._updateID && this._textureUpdateId === this.uvMatrix._updateID) return;
        this._bufferUpdateId = this.uvBuffer._updateID, this._textureUpdateId = this.uvMatrix._updateID;
        const r = this.uvBuffer.data;
        (!this.data || this.data.length !== r.length) && (this.data = new Float32Array(r.length)), this.uvMatrix.multiplyUvs(r, this.data), this._updateID++
    }
}
const yo = new Lt,
    yu = new Fi,
    Sd = class extends xe {
        constructor(e, t, r, i = tr.TRIANGLES) {
            super(), this.geometry = e, this.shader = t, this.state = r || br.for2d(), this.drawMode = i, this.start = 0, this.size = 0, this.uvs = null, this.indices = null, this.vertexData = new Float32Array(1), this.vertexDirty = -1, this._transformID = -1, this._roundPixels = K.ROUND_PIXELS, this.batchUvs = null
        }
        get geometry() {
            return this._geometry
        }
        set geometry(e) {
            this._geometry !== e && (this._geometry && (this._geometry.refCount--, this._geometry.refCount === 0 && this._geometry.dispose()), this._geometry = e, this._geometry && this._geometry.refCount++, this.vertexDirty = -1)
        }
        get uvBuffer() {
            return this.geometry.buffers[1]
        }
        get verticesBuffer() {
            return this.geometry.buffers[0]
        }
        set material(e) {
            this.shader = e
        }
        get material() {
            return this.shader
        }
        set blendMode(e) {
            this.state.blendMode = e
        }
        get blendMode() {
            return this.state.blendMode
        }
        set roundPixels(e) {
            this._roundPixels !== e && (this._transformID = -1), this._roundPixels = e
        }
        get roundPixels() {
            return this._roundPixels
        }
        get tint() {
            return "tint" in this.shader ? this.shader.tint : null
        }
        set tint(e) {
            this.shader.tint = e
        }
        get tintValue() {
            return this.shader.tintValue
        }
        get texture() {
            return "texture" in this.shader ? this.shader.texture : null
        }
        set texture(e) {
            this.shader.texture = e
        }
        _render(e) {
            const t = this.geometry.buffers[0].data;
            this.shader.batchable && this.drawMode === tr.TRIANGLES && t.length < Sd.BATCHABLE_SIZE * 2 ? this._renderToBatch(e) : this._renderDefault(e)
        }
        _renderDefault(e) {
            const t = this.shader;
            t.alpha = this.worldAlpha, t.update && t.update(), e.batch.flush(), t.uniforms.translationMatrix = this.transform.worldTransform.toArray(!0), e.shader.bind(t), e.state.set(this.state), e.geometry.bind(this.geometry, t), e.geometry.draw(this.drawMode, this.size, this.start, this.geometry.instanceCount)
        }
        _renderToBatch(e) {
            const t = this.geometry,
                r = this.shader;
            r.uvMatrix && (r.uvMatrix.update(), this.calculateUvs()), this.calculateVertices(), this.indices = t.indexBuffer.data, this._tintRGB = r._tintRGB, this._texture = r.texture;
            const i = this.material.pluginName;
            e.batch.setObjectRenderer(e.plugins[i]), e.plugins[i].render(this)
        }
        calculateVertices() {
            const t = this.geometry.buffers[0],
                r = t.data,
                i = t._updateID;
            if (i === this.vertexDirty && this._transformID === this.transform._worldID) return;
            this._transformID = this.transform._worldID, this.vertexData.length !== r.length && (this.vertexData = new Float32Array(r.length));
            const s = this.transform.worldTransform,
                n = s.a,
                a = s.b,
                o = s.c,
                h = s.d,
                l = s.tx,
                c = s.ty,
                f = this.vertexData;
            for (let p = 0; p < f.length / 2; p++) {
                const m = r[p * 2],
                    v = r[p * 2 + 1];
                f[p * 2] = n * m + o * v + l, f[p * 2 + 1] = a * m + h * v + c
            }
            if (this._roundPixels) {
                const p = K.RESOLUTION;
                for (let m = 0; m < f.length; ++m) f[m] = Math.round(f[m] * p) / p
            }
            this.vertexDirty = i
        }
        calculateUvs() {
            const e = this.geometry.buffers[1],
                t = this.shader;
            t.uvMatrix.isSimple ? this.uvs = e.data : (this.batchUvs || (this.batchUvs = new nw(e, t.uvMatrix)), this.batchUvs.update(), this.uvs = this.batchUvs.data)
        }
        _calculateBounds() {
            this.calculateVertices(), this._bounds.addVertexData(this.vertexData, 0, this.vertexData.length)
        }
        containsPoint(e) {
            if (!this.getBounds().contains(e.x, e.y)) return !1;
            this.worldTransform.applyInverse(e, yo);
            const t = this.geometry.getBuffer("aVertexPosition").data,
                r = yu.points,
                i = this.geometry.getIndex().data,
                s = i.length,
                n = this.drawMode === 4 ? 3 : 1;
            for (let a = 0; a + 2 < s; a += n) {
                const o = i[a] * 2,
                    h = i[a + 1] * 2,
                    l = i[a + 2] * 2;
                if (r[0] = t[o], r[1] = t[o + 1], r[2] = t[h], r[3] = t[h + 1], r[4] = t[l], r[5] = t[l + 1], yu.contains(yo.x, yo.y)) return !0
            }
            return !1
        }
        destroy(e) {
            super.destroy(e), this._cachedTexture && (this._cachedTexture.destroy(), this._cachedTexture = null), this.geometry = null, this.shader = null, this.state = null, this.uvs = null, this.indices = null, this.vertexData = null
        }
    };
let rh = Sd;
rh.BATCHABLE_SIZE = 100;
class aw extends Dr {
    constructor(t, r, i) {
        super();
        const s = new Wt(t),
            n = new Wt(r, !0),
            a = new Wt(i, !0, !0);
        this.addAttribute("aVertexPosition", s, 2, !1, ot.FLOAT).addAttribute("aTextureCoord", n, 2, !1, ot.FLOAT).addIndex(a), this._updateId = -1
    }
    get vertexDirtyId() {
        return this.buffers[0]._updateID
    }
}
var ow = `varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;
}
`,
    hw = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
}
`;
class xu extends sr {
    constructor(t, r) {
        const i = {
            uSampler: t,
            alpha: 1,
            uTextureMatrix: Gt.IDENTITY,
            uColor: new Float32Array([1, 1, 1, 1])
        };
        r = Object.assign({
            tint: 16777215,
            alpha: 1,
            pluginName: "batch"
        }, r), r.uniforms && Object.assign(i, r.uniforms), super(r.program || $e.from(hw, ow), i), this._colorDirty = !1, this.uvMatrix = new Kf(t), this.batchable = r.program === void 0, this.pluginName = r.pluginName, this._tintColor = new Ot(r.tint), this._tintRGB = this._tintColor.toLittleEndianNumber(), this._colorDirty = !0, this.alpha = r.alpha
    }
    get texture() {
        return this.uniforms.uSampler
    }
    set texture(t) {
        this.uniforms.uSampler !== t && (!this.uniforms.uSampler.baseTexture.alphaMode != !t.baseTexture.alphaMode && (this._colorDirty = !0), this.uniforms.uSampler = t, this.uvMatrix.texture = t)
    }
    set alpha(t) {
        t !== this._alpha && (this._alpha = t, this._colorDirty = !0)
    }
    get alpha() {
        return this._alpha
    }
    set tint(t) {
        t !== this.tint && (this._tintColor.setValue(t), this._tintRGB = this._tintColor.toLittleEndianNumber(), this._colorDirty = !0)
    }
    get tint() {
        return this._tintColor.value
    }
    get tintValue() {
        return this._tintColor.toNumber()
    }
    update() {
        if (this._colorDirty) {
            this._colorDirty = !1;
            const r = this.texture.baseTexture.alphaMode;
            Ot.shared.setValue(this._tintColor).premultiply(this._alpha, r).toArray(this.uniforms.uColor)
        }
        this.uvMatrix.update() && (this.uniforms.uTextureMatrix = this.uvMatrix.mapCoord)
    }
}
class bu {
    constructor(t, r, i) {
        this.geometry = new Dr, this.indexBuffer = null, this.size = i, this.dynamicProperties = [], this.staticProperties = [];
        for (let s = 0; s < t.length; ++s) {
            let n = t[s];
            n = {
                attributeName: n.attributeName,
                size: n.size,
                uploadFunction: n.uploadFunction,
                type: n.type || ot.FLOAT,
                offset: n.offset
            }, r[s] ? this.dynamicProperties.push(n) : this.staticProperties.push(n)
        }
        this.staticStride = 0, this.staticBuffer = null, this.staticData = null, this.staticDataUint32 = null, this.dynamicStride = 0, this.dynamicBuffer = null, this.dynamicData = null, this.dynamicDataUint32 = null, this._updateID = 0, this.initBuffers()
    }
    initBuffers() {
        const t = this.geometry;
        let r = 0;
        this.indexBuffer = new Wt(sx(this.size), !0, !0), t.addIndex(this.indexBuffer), this.dynamicStride = 0;
        for (let a = 0; a < this.dynamicProperties.length; ++a) {
            const o = this.dynamicProperties[a];
            o.offset = r, r += o.size, this.dynamicStride += o.size
        }
        const i = new ArrayBuffer(this.size * this.dynamicStride * 4 * 4);
        this.dynamicData = new Float32Array(i), this.dynamicDataUint32 = new Uint32Array(i), this.dynamicBuffer = new Wt(this.dynamicData, !1, !1);
        let s = 0;
        this.staticStride = 0;
        for (let a = 0; a < this.staticProperties.length; ++a) {
            const o = this.staticProperties[a];
            o.offset = s, s += o.size, this.staticStride += o.size
        }
        const n = new ArrayBuffer(this.size * this.staticStride * 4 * 4);
        this.staticData = new Float32Array(n), this.staticDataUint32 = new Uint32Array(n), this.staticBuffer = new Wt(this.staticData, !0, !1);
        for (let a = 0; a < this.dynamicProperties.length; ++a) {
            const o = this.dynamicProperties[a];
            t.addAttribute(o.attributeName, this.dynamicBuffer, 0, o.type === ot.UNSIGNED_BYTE, o.type, this.dynamicStride * 4, o.offset * 4)
        }
        for (let a = 0; a < this.staticProperties.length; ++a) {
            const o = this.staticProperties[a];
            t.addAttribute(o.attributeName, this.staticBuffer, 0, o.type === ot.UNSIGNED_BYTE, o.type, this.staticStride * 4, o.offset * 4)
        }
    }
    uploadDynamic(t, r, i) {
        for (let s = 0; s < this.dynamicProperties.length; s++) {
            const n = this.dynamicProperties[s];
            n.uploadFunction(t, r, i, n.type === ot.UNSIGNED_BYTE ? this.dynamicDataUint32 : this.dynamicData, this.dynamicStride, n.offset)
        }
        this.dynamicBuffer._updateID++
    }
    uploadStatic(t, r, i) {
        for (let s = 0; s < this.staticProperties.length; s++) {
            const n = this.staticProperties[s];
            n.uploadFunction(t, r, i, n.type === ot.UNSIGNED_BYTE ? this.staticDataUint32 : this.staticData, this.staticStride, n.offset)
        }
        this.staticBuffer._updateID++
    }
    destroy() {
        this.indexBuffer = null, this.dynamicProperties = null, this.dynamicBuffer = null, this.dynamicData = null, this.dynamicDataUint32 = null, this.staticProperties = null, this.staticBuffer = null, this.staticData = null, this.staticDataUint32 = null, this.geometry.destroy()
    }
}
var lw = `varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;

void main(void){
    vec4 color = texture2D(uSampler, vTextureCoord) * vColor;
    gl_FragColor = color;
}`,
    cw = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;

attribute vec2 aPositionCoord;
attribute float aRotation;

uniform mat3 translationMatrix;
uniform vec4 uColor;

varying vec2 vTextureCoord;
varying vec4 vColor;

void main(void){
    float x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);
    float y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);

    vec2 v = vec2(x, y);
    v = v + aPositionCoord;

    gl_Position = vec4((translationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = aTextureCoord;
    vColor = aColor * uColor;
}
`;
class Id extends oa {
    constructor(t) {
        super(t), this.shader = null, this.properties = null, this.tempMatrix = new Gt, this.properties = [{
            attributeName: "aVertexPosition",
            size: 2,
            uploadFunction: this.uploadVertices,
            offset: 0
        }, {
            attributeName: "aPositionCoord",
            size: 2,
            uploadFunction: this.uploadPosition,
            offset: 0
        }, {
            attributeName: "aRotation",
            size: 1,
            uploadFunction: this.uploadRotation,
            offset: 0
        }, {
            attributeName: "aTextureCoord",
            size: 2,
            uploadFunction: this.uploadUvs,
            offset: 0
        }, {
            attributeName: "aColor",
            size: 1,
            type: ot.UNSIGNED_BYTE,
            uploadFunction: this.uploadTint,
            offset: 0
        }], this.shader = sr.from(cw, lw, {}), this.state = br.for2d()
    }
    render(t) {
        const r = t.children,
            i = t._maxSize,
            s = t._batchSize,
            n = this.renderer;
        let a = r.length;
        if (a === 0) return;
        a > i && !t.autoResize && (a = i);
        let o = t._buffers;
        o || (o = t._buffers = this.generateBuffers(t));
        const h = r[0]._texture.baseTexture,
            l = h.alphaMode > 0;
        this.state.blendMode = Pf(t.blendMode, l), n.state.set(this.state);
        const c = n.gl,
            f = t.worldTransform.copyTo(this.tempMatrix);
        f.prepend(n.globalUniforms.uniforms.projectionMatrix), this.shader.uniforms.translationMatrix = f.toArray(!0), this.shader.uniforms.uColor = Ot.shared.setValue(t.tintRgb).premultiply(t.worldAlpha, l).toArray(this.shader.uniforms.uColor), this.shader.uniforms.uSampler = h, this.renderer.shader.bind(this.shader);
        let p = !1;
        for (let m = 0, v = 0; m < a; m += s, v += 1) {
            let _ = a - m;
            _ > s && (_ = s), v >= o.length && o.push(this._generateOneMoreBuffer(t));
            const y = o[v];
            y.uploadDynamic(r, m, _);
            const A = t._bufferUpdateIDs[v] || 0;
            p = p || y._updateID < A, p && (y._updateID = t._updateID, y.uploadStatic(r, m, _)), n.geometry.bind(y.geometry), c.drawElements(c.TRIANGLES, _ * 6, c.UNSIGNED_SHORT, 0)
        }
    }
    generateBuffers(t) {
        const r = [],
            i = t._maxSize,
            s = t._batchSize,
            n = t._properties;
        for (let a = 0; a < i; a += s) r.push(new bu(this.properties, n, s));
        return r
    }
    _generateOneMoreBuffer(t) {
        const r = t._batchSize,
            i = t._properties;
        return new bu(this.properties, i, r)
    }
    uploadVertices(t, r, i, s, n, a) {
        let o = 0,
            h = 0,
            l = 0,
            c = 0;
        for (let f = 0; f < i; ++f) {
            const p = t[r + f],
                m = p._texture,
                v = p.scale.x,
                _ = p.scale.y,
                y = m.trim,
                A = m.orig;
            y ? (h = y.x - p.anchor.x * A.width, o = h + y.width, c = y.y - p.anchor.y * A.height, l = c + y.height) : (o = A.width * (1 - p.anchor.x), h = A.width * -p.anchor.x, l = A.height * (1 - p.anchor.y), c = A.height * -p.anchor.y), s[a] = h * v, s[a + 1] = c * _, s[a + n] = o * v, s[a + n + 1] = c * _, s[a + n * 2] = o * v, s[a + n * 2 + 1] = l * _, s[a + n * 3] = h * v, s[a + n * 3 + 1] = l * _, a += n * 4
        }
    }
    uploadPosition(t, r, i, s, n, a) {
        for (let o = 0; o < i; o++) {
            const h = t[r + o].position;
            s[a] = h.x, s[a + 1] = h.y, s[a + n] = h.x, s[a + n + 1] = h.y, s[a + n * 2] = h.x, s[a + n * 2 + 1] = h.y, s[a + n * 3] = h.x, s[a + n * 3 + 1] = h.y, a += n * 4
        }
    }
    uploadRotation(t, r, i, s, n, a) {
        for (let o = 0; o < i; o++) {
            const h = t[r + o].rotation;
            s[a] = h, s[a + n] = h, s[a + n * 2] = h, s[a + n * 3] = h, a += n * 4
        }
    }
    uploadUvs(t, r, i, s, n, a) {
        for (let o = 0; o < i; ++o) {
            const h = t[r + o]._texture._uvs;
            h ? (s[a] = h.x0, s[a + 1] = h.y0, s[a + n] = h.x1, s[a + n + 1] = h.y1, s[a + n * 2] = h.x2, s[a + n * 2 + 1] = h.y2, s[a + n * 3] = h.x3, s[a + n * 3 + 1] = h.y3, a += n * 4) : (s[a] = 0, s[a + 1] = 0, s[a + n] = 0, s[a + n + 1] = 0, s[a + n * 2] = 0, s[a + n * 2 + 1] = 0, s[a + n * 3] = 0, s[a + n * 3 + 1] = 0, a += n * 4)
        }
    }
    uploadTint(t, r, i, s, n, a) {
        for (let o = 0; o < i; ++o) {
            const h = t[r + o],
                l = Ot.shared.setValue(h._tintRGB).toPremultiplied(h.alpha, h.texture.baseTexture.alphaMode > 0);
            s[a] = l, s[a + n] = l, s[a + n * 2] = l, s[a + n * 3] = l, a += n * 4
        }
    }
    destroy() {
        super.destroy(), this.shader && (this.shader.destroy(), this.shader = null), this.tempMatrix = null
    }
}
Id.extension = {
    name: "particle",
    type: J.RendererPlugin
};
nt.add(Id);
var ma = (e => (e[e.LINEAR_VERTICAL = 0] = "LINEAR_VERTICAL", e[e.LINEAR_HORIZONTAL = 1] = "LINEAR_HORIZONTAL", e))(ma || {});
const pn = {
        willReadFrequently: !0
    },
    rt = class {
        static get experimentalLetterSpacingSupported() {
            let e = rt._experimentalLetterSpacingSupported;
            if (e !== void 0) {
                const t = K.ADAPTER.getCanvasRenderingContext2D().prototype;
                e = rt._experimentalLetterSpacingSupported = "letterSpacing" in t || "textLetterSpacing" in t
            }
            return e
        }
        constructor(e, t, r, i, s, n, a, o, h) {
            this.text = e, this.style = t, this.width = r, this.height = i, this.lines = s, this.lineWidths = n, this.lineHeight = a, this.maxLineWidth = o, this.fontProperties = h
        }
        static measureText(e, t, r, i = rt._canvas) {
            r = r??t.wordWrap;
            const s = t.toFontString(),
                n = rt.measureFont(s);
            n.fontSize === 0 && (n.fontSize = t.fontSize, n.ascent = t.fontSize);
            const a = i.getContext("2d", pn);
            a.font = s;
            const h = (r ? rt.wordWrap(e, t, i) : e).split(/(?:\r\n|\r|\n)/),
                l = new Array(h.length);
            let c = 0;
            for (let v = 0; v < h.length; v++) {
                const _ = rt._measureText(h[v], t.letterSpacing, a);
                l[v] = _, c = Math.max(c, _)
            }
            let f = c + t.strokeThickness;
            t.dropShadow && (f += t.dropShadowDistance);
            const p = t.lineHeight || n.fontSize + t.strokeThickness;
            let m = Math.max(p, n.fontSize + t.strokeThickness * 2) + (h.length - 1) * (p + t.leading);
            return t.dropShadow && (m += t.dropShadowDistance), new rt(e, t, f, m, h, l, p + t.leading, c, n)
        }
        static _measureText(e, t, r) {
            let i = !1;
            rt.experimentalLetterSpacingSupported && (rt.experimentalLetterSpacing ? (r.letterSpacing = `${t}px`, r.textLetterSpacing = `${t}px`, i = !0) : (r.letterSpacing = "0px", r.textLetterSpacing = "0px"));
            let s = r.measureText(e).width;
            return s > 0 && (i ? s -= t : s += (rt.graphemeSegmenter(e).length - 1) * t), s
        }
        static wordWrap(e, t, r = rt._canvas) {
            const i = r.getContext("2d", pn);
            let s = 0,
                n = "",
                a = "";
            const o = Object.create(null),
                {
                    letterSpacing: h,
                    whiteSpace: l
                } = t,
                c = rt.collapseSpaces(l),
                f = rt.collapseNewlines(l);
            let p = !c;
            const m = t.wordWrapWidth + h,
                v = rt.tokenize(e);
            for (let _ = 0; _ < v.length; _++) {
                let y = v[_];
                if (rt.isNewline(y)) {
                    if (!f) {
                        a += rt.addLine(n), p = !c, n = "", s = 0;
                        continue
                    }
                    y = " "
                }
                if (c) {
                    const I = rt.isBreakingSpace(y),
                        x = rt.isBreakingSpace(n[n.length - 1]);
                    if (I && x) continue
                }
                const A = rt.getFromCache(y, h, o, i);
                if (A > m)
                    if (n !== "" && (a += rt.addLine(n), n = "", s = 0), rt.canBreakWords(y, t.breakWords)) {
                        const I = rt.wordWrapSplit(y);
                        for (let x = 0; x < I.length; x++) {
                            let S = I[x],
                                $ = S,
                                k = 1;
                            for (; I[x + k];) {
                                const L = I[x + k];
                                if (!rt.canBreakChars($, L, y, x, t.breakWords)) S += L;
                                else break;
                                $ = L, k++
                            }
                            x += k - 1;
                            const G = rt.getFromCache(S, h, o, i);
                            G + s > m && (a += rt.addLine(n), p = !1, n = "", s = 0), n += S, s += G
                        }
                    } else {
                        n.length > 0 && (a += rt.addLine(n), n = "", s = 0);
                        const I = _ === v.length - 1;
                        a += rt.addLine(y, !I), p = !1, n = "", s = 0
                    }
                else A + s > m && (p = !1, a += rt.addLine(n), n = "", s = 0), (n.length > 0 || !rt.isBreakingSpace(y) || p) && (n += y, s += A)
            }
            return a += rt.addLine(n, !1), a
        }
        static addLine(e, t = !0) {
            return e = rt.trimRight(e), e = t ? `${e}
` : e, e
        }
        static getFromCache(e, t, r, i) {
            let s = r[e];
            return typeof s != "number" && (s = rt._measureText(e, t, i) + t, r[e] = s), s
        }
        static collapseSpaces(e) {
            return e === "normal" || e === "pre-line"
        }
        static collapseNewlines(e) {
            return e === "normal"
        }
        static trimRight(e) {
            if (typeof e != "string") return "";
            for (let t = e.length - 1; t >= 0; t--) {
                const r = e[t];
                if (!rt.isBreakingSpace(r)) break;
                e = e.slice(0, -1)
            }
            return e
        }
        static isNewline(e) {
            return typeof e != "string" ? !1 : rt._newlines.includes(e.charCodeAt(0))
        }
        static isBreakingSpace(e, t) {
            return typeof e != "string" ? !1 : rt._breakingSpaces.includes(e.charCodeAt(0))
        }
        static tokenize(e) {
            const t = [];
            let r = "";
            if (typeof e != "string") return t;
            for (let i = 0; i < e.length; i++) {
                const s = e[i],
                    n = e[i + 1];
                if (rt.isBreakingSpace(s, n) || rt.isNewline(s)) {
                    r !== "" && (t.push(r), r = ""), t.push(s);
                    continue
                }
                r += s
            }
            return r !== "" && t.push(r), t
        }
        static canBreakWords(e, t) {
            return t
        }
        static canBreakChars(e, t, r, i, s) {
            return !0
        }
        static wordWrapSplit(e) {
            return rt.graphemeSegmenter(e)
        }
        static measureFont(e) {
            if (rt._fonts[e]) return rt._fonts[e];
            const t = {
                    ascent: 0,
                    descent: 0,
                    fontSize: 0
                },
                r = rt._canvas,
                i = rt._context;
            i.font = e;
            const s = rt.METRICS_STRING + rt.BASELINE_SYMBOL,
                n = Math.ceil(i.measureText(s).width);
            let a = Math.ceil(i.measureText(rt.BASELINE_SYMBOL).width);
            const o = Math.ceil(rt.HEIGHT_MULTIPLIER * a);
            if (a = a * rt.BASELINE_MULTIPLIER | 0, n === 0 || o === 0) return rt._fonts[e] = t, t;
            r.width = n, r.height = o, i.fillStyle = "#f00", i.fillRect(0, 0, n, o), i.font = e, i.textBaseline = "alphabetic", i.fillStyle = "#000", i.fillText(s, 0, a);
            const h = i.getImageData(0, 0, n, o).data,
                l = h.length,
                c = n * 4;
            let f = 0,
                p = 0,
                m = !1;
            for (f = 0; f < a; ++f) {
                for (let v = 0; v < c; v += 4)
                    if (h[p + v] !== 255) {
                        m = !0;
                        break
                    }
                if (!m) p += c;
                else break
            }
            for (t.ascent = a - f, p = l - c, m = !1, f = o; f > a; --f) {
                for (let v = 0; v < c; v += 4)
                    if (h[p + v] !== 255) {
                        m = !0;
                        break
                    }
                if (!m) p -= c;
                else break
            }
            return t.descent = f - a, t.fontSize = t.ascent + t.descent, rt._fonts[e] = t, t
        }
        static clearMetrics(e = "") {
            e ? delete rt._fonts[e] : rt._fonts = {}
        }
        static get _canvas() {
            if (!rt.__canvas) {
                let e;
                try {
                    const t = new OffscreenCanvas(0, 0),
                        r = t.getContext("2d", pn);
                    if (r != null && r.measureText) return rt.__canvas = t, t;
                    e = K.ADAPTER.createCanvas()
                } catch {
                    e = K.ADAPTER.createCanvas()
                }
                e.width = e.height = 10, rt.__canvas = e
            }
            return rt.__canvas
        }
        static get _context() {
            return rt.__context || (rt.__context = rt._canvas.getContext("2d", pn)), rt.__context
        }
    };
let he = rt;
he.METRICS_STRING = "|ÉqÅ";
he.BASELINE_SYMBOL = "M";
he.BASELINE_MULTIPLIER = 1.4;
he.HEIGHT_MULTIPLIER = 2;
he.graphemeSegmenter = (() => {
    if (typeof(Intl == null ? void 0 : Intl.Segmenter) == "function") {
        const e = new Intl.Segmenter;
        return t => [...e.segment(t)].map(r => r.segment)
    }
    return e => [...e]
})();
he.experimentalLetterSpacing = !1;
he._fonts = {};
he._newlines = [10, 13];
he._breakingSpaces = [9, 32, 8192, 8193, 8194, 8195, 8196, 8197, 8198, 8200, 8201, 8202, 8287, 12288];
const uw = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"],
    us = class {
        constructor(e) {
            this.styleID = 0, this.reset(), bo(this, e, e)
        }
        clone() {
            const e = {};
            return bo(e, this, us.defaultStyle), new us(e)
        }
        reset() {
            bo(this, us.defaultStyle, us.defaultStyle)
        }
        get align() {
            return this._align
        }
        set align(e) {
            this._align !== e && (this._align = e, this.styleID++)
        }
        get breakWords() {
            return this._breakWords
        }
        set breakWords(e) {
            this._breakWords !== e && (this._breakWords = e, this.styleID++)
        }
        get dropShadow() {
            return this._dropShadow
        }
        set dropShadow(e) {
            this._dropShadow !== e && (this._dropShadow = e, this.styleID++)
        }
        get dropShadowAlpha() {
            return this._dropShadowAlpha
        }
        set dropShadowAlpha(e) {
            this._dropShadowAlpha !== e && (this._dropShadowAlpha = e, this.styleID++)
        }
        get dropShadowAngle() {
            return this._dropShadowAngle
        }
        set dropShadowAngle(e) {
            this._dropShadowAngle !== e && (this._dropShadowAngle = e, this.styleID++)
        }
        get dropShadowBlur() {
            return this._dropShadowBlur
        }
        set dropShadowBlur(e) {
            this._dropShadowBlur !== e && (this._dropShadowBlur = e, this.styleID++)
        }
        get dropShadowColor() {
            return this._dropShadowColor
        }
        set dropShadowColor(e) {
            const t = xo(e);
            this._dropShadowColor !== t && (this._dropShadowColor = t, this.styleID++)
        }
        get dropShadowDistance() {
            return this._dropShadowDistance
        }
        set dropShadowDistance(e) {
            this._dropShadowDistance !== e && (this._dropShadowDistance = e, this.styleID++)
        }
        get fill() {
            return this._fill
        }
        set fill(e) {
            const t = xo(e);
            this._fill !== t && (this._fill = t, this.styleID++)
        }
        get fillGradientType() {
            return this._fillGradientType
        }
        set fillGradientType(e) {
            this._fillGradientType !== e && (this._fillGradientType = e, this.styleID++)
        }
        get fillGradientStops() {
            return this._fillGradientStops
        }
        set fillGradientStops(e) {
            fw(this._fillGradientStops, e) || (this._fillGradientStops = e, this.styleID++)
        }
        get fontFamily() {
            return this._fontFamily
        }
        set fontFamily(e) {
            this.fontFamily !== e && (this._fontFamily = e, this.styleID++)
        }
        get fontSize() {
            return this._fontSize
        }
        set fontSize(e) {
            this._fontSize !== e && (this._fontSize = e, this.styleID++)
        }
        get fontStyle() {
            return this._fontStyle
        }
        set fontStyle(e) {
            this._fontStyle !== e && (this._fontStyle = e, this.styleID++)
        }
        get fontVariant() {
            return this._fontVariant
        }
        set fontVariant(e) {
            this._fontVariant !== e && (this._fontVariant = e, this.styleID++)
        }
        get fontWeight() {
            return this._fontWeight
        }
        set fontWeight(e) {
            this._fontWeight !== e && (this._fontWeight = e, this.styleID++)
        }
        get letterSpacing() {
            return this._letterSpacing
        }
        set letterSpacing(e) {
            this._letterSpacing !== e && (this._letterSpacing = e, this.styleID++)
        }
        get lineHeight() {
            return this._lineHeight
        }
        set lineHeight(e) {
            this._lineHeight !== e && (this._lineHeight = e, this.styleID++)
        }
        get leading() {
            return this._leading
        }
        set leading(e) {
            this._leading !== e && (this._leading = e, this.styleID++)
        }
        get lineJoin() {
            return this._lineJoin
        }
        set lineJoin(e) {
            this._lineJoin !== e && (this._lineJoin = e, this.styleID++)
        }
        get miterLimit() {
            return this._miterLimit
        }
        set miterLimit(e) {
            this._miterLimit !== e && (this._miterLimit = e, this.styleID++)
        }
        get padding() {
            return this._padding
        }
        set padding(e) {
            this._padding !== e && (this._padding = e, this.styleID++)
        }
        get stroke() {
            return this._stroke
        }
        set stroke(e) {
            const t = xo(e);
            this._stroke !== t && (this._stroke = t, this.styleID++)
        }
        get strokeThickness() {
            return this._strokeThickness
        }
        set strokeThickness(e) {
            this._strokeThickness !== e && (this._strokeThickness = e, this.styleID++)
        }
        get textBaseline() {
            return this._textBaseline
        }
        set textBaseline(e) {
            this._textBaseline !== e && (this._textBaseline = e, this.styleID++)
        }
        get trim() {
            return this._trim
        }
        set trim(e) {
            this._trim !== e && (this._trim = e, this.styleID++)
        }
        get whiteSpace() {
            return this._whiteSpace
        }
        set whiteSpace(e) {
            this._whiteSpace !== e && (this._whiteSpace = e, this.styleID++)
        }
        get wordWrap() {
            return this._wordWrap
        }
        set wordWrap(e) {
            this._wordWrap !== e && (this._wordWrap = e, this.styleID++)
        }
        get wordWrapWidth() {
            return this._wordWrapWidth
        }
        set wordWrapWidth(e) {
            this._wordWrapWidth !== e && (this._wordWrapWidth = e, this.styleID++)
        }
        toFontString() {
            const e = typeof this.fontSize == "number" ? `${this.fontSize}px` : this.fontSize;
            let t = this.fontFamily;
            Array.isArray(this.fontFamily) || (t = this.fontFamily.split(","));
            for (let r = t.length - 1; r >= 0; r--) {
                let i = t[r].trim();
                !/([\"\'])[^\'\"]+\1/.test(i) && !uw.includes(i) && (i = `"${i}"`), t[r] = i
            }
            return `${this.fontStyle} ${this.fontVariant} ${this.fontWeight} ${e} ${t.join(",")}`
        }
    };
let ri = us;
ri.defaultStyle = {
    align: "left",
    breakWords: !1,
    dropShadow: !1,
    dropShadowAlpha: 1,
    dropShadowAngle: Math.PI / 6,
    dropShadowBlur: 0,
    dropShadowColor: "black",
    dropShadowDistance: 5,
    fill: "black",
    fillGradientType: ma.LINEAR_VERTICAL,
    fillGradientStops: [],
    fontFamily: "Arial",
    fontSize: 26,
    fontStyle: "normal",
    fontVariant: "normal",
    fontWeight: "normal",
    leading: 0,
    letterSpacing: 0,
    lineHeight: 0,
    lineJoin: "miter",
    miterLimit: 10,
    padding: 0,
    stroke: "black",
    strokeThickness: 0,
    textBaseline: "alphabetic",
    trim: !1,
    whiteSpace: "pre",
    wordWrap: !1,
    wordWrapWidth: 100
};

function xo(e) {
    const t = Ot.shared;
    return Array.isArray(e) ? e.map(r => t.setValue(r).toHex()) : t.setValue(e).toHex()
}

function fw(e, t) {
    if (!Array.isArray(e) || !Array.isArray(t) || e.length !== t.length) return !1;
    for (let r = 0; r < e.length; ++r)
        if (e[r] !== t[r]) return !1;
    return !0
}

function bo(e, t, r) {
    for (const i in r) Array.isArray(t[i]) ? e[i] = t[i].slice() : e[i] = t[i]
}
const dw = {
        texture: !0,
        children: !1,
        baseTexture: !0
    },
    ih = class extends Ps {
        constructor(e, t, r) {
            let i = !1;
            r || (r = K.ADAPTER.createCanvas(), i = !0), r.width = 3, r.height = 3;
            const s = st.from(r);
            s.orig = new _t, s.trim = new _t, super(s), this._ownCanvas = i, this.canvas = r, this.context = r.getContext("2d", {
                willReadFrequently: !0
            }), this._resolution = ih.defaultResolution??K.RESOLUTION, this._autoResolution = ih.defaultAutoResolution, this._text = null, this._style = null, this._styleListener = null, this._font = "", this.text = e, this.style = t, this.localStyleID = -1
        }
        static get experimentalLetterSpacing() {
            return he.experimentalLetterSpacing
        }
        static set experimentalLetterSpacing(e) {
            Et("7.1.0", "Text.experimentalLetterSpacing is deprecated, use TextMetrics.experimentalLetterSpacing"), he.experimentalLetterSpacing = e
        }
        updateText(e) {
            const t = this._style;
            if (this.localStyleID !== t.styleID && (this.dirty = !0, this.localStyleID = t.styleID), !this.dirty && e) return;
            this._font = this._style.toFontString();
            const r = this.context,
                i = he.measureText(this._text || " ", this._style, this._style.wordWrap, this.canvas),
                s = i.width,
                n = i.height,
                a = i.lines,
                o = i.lineHeight,
                h = i.lineWidths,
                l = i.maxLineWidth,
                c = i.fontProperties;
            this.canvas.width = Math.ceil(Math.ceil(Math.max(1, s) + t.padding * 2) * this._resolution), this.canvas.height = Math.ceil(Math.ceil(Math.max(1, n) + t.padding * 2) * this._resolution), r.scale(this._resolution, this._resolution), r.clearRect(0, 0, this.canvas.width, this.canvas.height), r.font = this._font, r.lineWidth = t.strokeThickness, r.textBaseline = t.textBaseline, r.lineJoin = t.lineJoin, r.miterLimit = t.miterLimit;
            let f, p;
            const m = t.dropShadow ? 2 : 1;
            for (let v = 0; v < m; ++v) {
                const _ = t.dropShadow && v === 0,
                    y = _ ? Math.ceil(Math.max(1, n) + t.padding * 2) : 0,
                    A = y * this._resolution;
                if (_) {
                    r.fillStyle = "black", r.strokeStyle = "black";
                    const x = t.dropShadowColor,
                        S = t.dropShadowBlur * this._resolution,
                        $ = t.dropShadowDistance * this._resolution;
                    r.shadowColor = Ot.shared.setValue(x).setAlpha(t.dropShadowAlpha).toRgbaString(), r.shadowBlur = S, r.shadowOffsetX = Math.cos(t.dropShadowAngle) * $, r.shadowOffsetY = Math.sin(t.dropShadowAngle) * $ + A
                } else r.fillStyle = this._generateFillStyle(t, a, i), r.strokeStyle = t.stroke, r.shadowColor = "black", r.shadowBlur = 0, r.shadowOffsetX = 0, r.shadowOffsetY = 0;
                let I = (o - c.fontSize) / 2;
                o - c.fontSize < 0 && (I = 0);
                for (let x = 0; x < a.length; x++) f = t.strokeThickness / 2, p = t.strokeThickness / 2 + x * o + c.ascent + I, t.align === "right" ? f += l - h[x] : t.align === "center" && (f += (l - h[x]) / 2), t.stroke && t.strokeThickness && this.drawLetterSpacing(a[x], f + t.padding, p + t.padding - y, !0), t.fill && this.drawLetterSpacing(a[x], f + t.padding, p + t.padding - y)
            }
            this.updateTexture()
        }
        drawLetterSpacing(e, t, r, i = !1) {
            const n = this._style.letterSpacing;
            let a = !1;
            if (he.experimentalLetterSpacingSupported && (he.experimentalLetterSpacing ? (this.context.letterSpacing = `${n}px`, this.context.textLetterSpacing = `${n}px`, a = !0) : (this.context.letterSpacing = "0px", this.context.textLetterSpacing = "0px")), n === 0 || a) {
                i ? this.context.strokeText(e, t, r) : this.context.fillText(e, t, r);
                return
            }
            let o = t;
            const h = he.graphemeSegmenter(e);
            let l = this.context.measureText(e).width,
                c = 0;
            for (let f = 0; f < h.length; ++f) {
                const p = h[f];
                i ? this.context.strokeText(p, o, r) : this.context.fillText(p, o, r);
                let m = "";
                for (let v = f + 1; v < h.length; ++v) m += h[v];
                c = this.context.measureText(m).width, o += l - c + n, l = c
            }
        }
        updateTexture() {
            const e = this.canvas;
            if (this._style.trim) {
                const n = hx(e);
                n.data && (e.width = n.width, e.height = n.height, this.context.putImageData(n.data, 0, 0))
            }
            const t = this._texture,
                r = this._style,
                i = r.trim ? 0 : r.padding,
                s = t.baseTexture;
            t.trim.width = t._frame.width = e.width / this._resolution, t.trim.height = t._frame.height = e.height / this._resolution, t.trim.x = -i, t.trim.y = -i, t.orig.width = t._frame.width - i * 2, t.orig.height = t._frame.height - i * 2, this._onTextureUpdate(), s.setRealSize(e.width, e.height, this._resolution), t.updateUvs(), this.dirty = !1
        }
        _render(e) {
            this._autoResolution && this._resolution !== e.resolution && (this._resolution = e.resolution, this.dirty = !0), this.updateText(!0), super._render(e)
        }
        updateTransform() {
            this.updateText(!0), super.updateTransform()
        }
        getBounds(e, t) {
            return this.updateText(!0), this._textureID === -1 && (e = !1), super.getBounds(e, t)
        }
        getLocalBounds(e) {
            return this.updateText(!0), super.getLocalBounds.call(this, e)
        }
        _calculateBounds() {
            this.calculateVertices(), this._bounds.addQuad(this.vertexData)
        }
        _generateFillStyle(e, t, r) {
            const i = e.fill;
            if (Array.isArray(i)) {
                if (i.length === 1) return i[0]
            } else return i;
            let s;
            const n = e.dropShadow ? e.dropShadowDistance : 0,
                a = e.padding || 0,
                o = this.canvas.width / this._resolution - n - a * 2,
                h = this.canvas.height / this._resolution - n - a * 2,
                l = i.slice(),
                c = e.fillGradientStops.slice();
            if (!c.length) {
                const f = l.length + 1;
                for (let p = 1; p < f; ++p) c.push(p / f)
            }
            if (l.unshift(i[0]), c.unshift(0), l.push(i[i.length - 1]), c.push(1), e.fillGradientType === ma.LINEAR_VERTICAL) {
                s = this.context.createLinearGradient(o / 2, a, o / 2, h + a);
                const f = r.fontProperties.fontSize + e.strokeThickness;
                for (let p = 0; p < t.length; p++) {
                    const m = r.lineHeight * (p - 1) + f,
                        v = r.lineHeight * p;
                    let _ = v;
                    p > 0 && m > v && (_ = (v + m) / 2);
                    const y = v + f,
                        A = r.lineHeight * (p + 1);
                    let I = y;
                    p + 1 < t.length && A < y && (I = (y + A) / 2);
                    const x = (I - _) / h;
                    for (let S = 0; S < l.length; S++) {
                        let $ = 0;
                        typeof c[S] == "number" ? $ = c[S] : $ = S / l.length;
                        let k = Math.min(1, Math.max(0, _ / h + $ * x));
                        k = Number(k.toFixed(5)), s.addColorStop(k, l[S])
                    }
                }
            } else {
                s = this.context.createLinearGradient(a, h / 2, o + a, h / 2);
                const f = l.length + 1;
                let p = 1;
                for (let m = 0; m < l.length; m++) {
                    let v;
                    typeof c[m] == "number" ? v = c[m] : v = p / f, s.addColorStop(v, l[m]), p++
                }
            }
            return s
        }
        destroy(e) {
            typeof e == "boolean" && (e = {
                children: e
            }), e = Object.assign({}, dw, e), super.destroy(e), this._ownCanvas && (this.canvas.height = this.canvas.width = 0), this.context = null, this.canvas = null, this._style = null
        }
        get width() {
            return this.updateText(!0), Math.abs(this.scale.x) * this._texture.orig.width
        }
        set width(e) {
            this.updateText(!0);
            const t = Mi(this.scale.x) || 1;
            this.scale.x = t * e / this._texture.orig.width, this._width = e
        }
        get height() {
            return this.updateText(!0), Math.abs(this.scale.y) * this._texture.orig.height
        }
        set height(e) {
            this.updateText(!0);
            const t = Mi(this.scale.y) || 1;
            this.scale.y = t * e / this._texture.orig.height, this._height = e
        }
        get style() {
            return this._style
        }
        set style(e) {
            e = e || {}, e instanceof ri ? this._style = e : this._style = new ri(e), this.localStyleID = -1, this.dirty = !0
        }
        get text() {
            return this._text
        }
        set text(e) {
            e = String(e??""), this._text !== e && (this._text = e, this.dirty = !0)
        }
        get resolution() {
            return this._resolution
        }
        set resolution(e) {
            this._autoResolution = !1, this._resolution !== e && (this._resolution = e, this.dirty = !0)
        }
    };
let Mh = ih;
Mh.defaultAutoResolution = !0;
class pw {
    constructor(t) {
        this.maxItemsPerFrame = t, this.itemsLeft = 0
    }
    beginFrame() {
        this.itemsLeft = this.maxItemsPerFrame
    }
    allowedToUpload() {
        return this.itemsLeft-- > 0
    }
}

function mw(e, t) {
    var i;
    let r = !1;
    if ((i = e == null ? void 0 : e._textures) != null && i.length) {
        for (let s = 0; s < e._textures.length; s++)
            if (e._textures[s] instanceof st) {
                const n = e._textures[s].baseTexture;
                t.includes(n) || (t.push(n), r = !0)
            }
    }
    return r
}

function gw(e, t) {
    if (e.baseTexture instanceof ct) {
        const r = e.baseTexture;
        return t.includes(r) || t.push(r), !0
    }
    return !1
}

function vw(e, t) {
    if (e._texture && e._texture instanceof st) {
        const r = e._texture.baseTexture;
        return t.includes(r) || t.push(r), !0
    }
    return !1
}

function _w(e, t) {
    return t instanceof Mh ? (t.updateText(!0), !0) : !1
}

function yw(e, t) {
    if (t instanceof ri) {
        const r = t.toFontString();
        return he.measureFont(r), !0
    }
    return !1
}

function xw(e, t) {
    if (e instanceof Mh) {
        t.includes(e.style) || t.push(e.style), t.includes(e) || t.push(e);
        const r = e._texture.baseTexture;
        return t.includes(r) || t.push(r), !0
    }
    return !1
}

function bw(e, t) {
    return e instanceof ri ? (t.includes(e) || t.push(e), !0) : !1
}
const Rd = class {
    constructor(e) {
        this.limiter = new pw(Rd.uploadsPerFrame), this.renderer = e, this.uploadHookHelper = null, this.queue = [], this.addHooks = [], this.uploadHooks = [], this.completes = [], this.ticking = !1, this.delayedTick = () => {
            this.queue && this.prepareItems()
        }, this.registerFindHook(xw), this.registerFindHook(bw), this.registerFindHook(mw), this.registerFindHook(gw), this.registerFindHook(vw), this.registerUploadHook(_w), this.registerUploadHook(yw)
    }
    upload(e) {
        return new Promise(t => {
            e && this.add(e), this.queue.length ? (this.completes.push(t), this.ticking || (this.ticking = !0, ve.system.addOnce(this.tick, this, Vi.UTILITY))) : t()
        })
    }
    tick() {
        setTimeout(this.delayedTick, 0)
    }
    prepareItems() {
        for (this.limiter.beginFrame(); this.queue.length && this.limiter.allowedToUpload();) {
            const e = this.queue[0];
            let t = !1;
            if (e && !e._destroyed) {
                for (let r = 0, i = this.uploadHooks.length; r < i; r++)
                    if (this.uploadHooks[r](this.uploadHookHelper, e)) {
                        this.queue.shift(), t = !0;
                        break
                    }
            }
            t || this.queue.shift()
        }
        if (this.queue.length) ve.system.addOnce(this.tick, this, Vi.UTILITY);
        else {
            this.ticking = !1;
            const e = this.completes.slice(0);
            this.completes.length = 0;
            for (let t = 0, r = e.length; t < r; t++) e[t]()
        }
    }
    registerFindHook(e) {
        return e && this.addHooks.push(e), this
    }
    registerUploadHook(e) {
        return e && this.uploadHooks.push(e), this
    }
    add(e) {
        for (let t = 0, r = this.addHooks.length; t < r && !this.addHooks[t](e, this.queue); t++);
        if (e instanceof xe)
            for (let t = e.children.length - 1; t >= 0; t--) this.add(e.children[t]);
        return this
    }
    destroy() {
        this.ticking && ve.system.remove(this.tick, this), this.ticking = !1, this.addHooks = null, this.uploadHooks = null, this.renderer = null, this.completes = null, this.queue = null, this.limiter = null, this.uploadHookHelper = null
    }
};
let jn = Rd;
jn.uploadsPerFrame = 4;
Object.defineProperties(K, {
    UPLOADS_PER_FRAME: {
        get() {
            return jn.uploadsPerFrame
        },
        set(e) {
            Et("7.1.0", "settings.UPLOADS_PER_FRAME is deprecated, use prepare.BasePrepare.uploadsPerFrame"), jn.uploadsPerFrame = e
        }
    }
});

function Md(e, t) {
    return t instanceof ct ? (t._glTextures[e.CONTEXT_UID] || e.texture.bind(t), !0) : !1
}

function ww(e, t) {
    if (!(t instanceof Ds)) return !1;
    const {
        geometry: r
    } = t;
    t.finishPoly(), r.updateBatches();
    const {
        batches: i
    } = r;
    for (let s = 0; s < i.length; s++) {
        const {
            texture: n
        } = i[s].style;
        n && Md(e, n.baseTexture)
    }
    return r.batchable || e.geometry.bind(r, t._resolveDirectShader(e)), !0
}

function Ew(e, t) {
    return e instanceof Ds ? (t.push(e), !0) : !1
}
class Pd extends jn {
    constructor(t) {
        super(t), this.uploadHookHelper = this.renderer, this.registerFindHook(Ew), this.registerUploadHook(Md), this.registerUploadHook(ww)
    }
}
Pd.extension = {
    name: "prepare",
    type: J.RendererSystem
};
nt.add(Pd);
var Tw = `#version 300 es
#define SHADER_NAME Tiling-Sprite-100

precision lowp float;

in vec2 vTextureCoord;

out vec4 fragmentColor;

uniform sampler2D uSampler;
uniform vec4 uColor;
uniform mat3 uMapCoord;
uniform vec4 uClampFrame;
uniform vec2 uClampOffset;

void main(void)
{
    vec2 coord = vTextureCoord + ceil(uClampOffset - vTextureCoord);
    coord = (uMapCoord * vec3(coord, 1.0)).xy;
    vec2 unclamped = coord;
    coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

    vec4 texSample = texture(uSampler, coord, unclamped == coord ? 0.0f : -32.0f);// lod-bias very negative to force lod 0

    fragmentColor = texSample * uColor;
}
`,
    Aw = `#version 300 es
#define SHADER_NAME Tiling-Sprite-300

precision lowp float;

in vec2 aVertexPosition;
in vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

out vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;
}
`,
    Cw = `#version 100
#ifdef GL_EXT_shader_texture_lod
    #extension GL_EXT_shader_texture_lod : enable
#endif
#define SHADER_NAME Tiling-Sprite-100

precision lowp float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;
uniform mat3 uMapCoord;
uniform vec4 uClampFrame;
uniform vec2 uClampOffset;

void main(void)
{
    vec2 coord = vTextureCoord + ceil(uClampOffset - vTextureCoord);
    coord = (uMapCoord * vec3(coord, 1.0)).xy;
    vec2 unclamped = coord;
    coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

    #ifdef GL_EXT_shader_texture_lod
        vec4 texSample = unclamped == coord
            ? texture2D(uSampler, coord) 
            : texture2DLodEXT(uSampler, coord, 0);
    #else
        vec4 texSample = texture2D(uSampler, coord);
    #endif

    gl_FragColor = texSample * uColor;
}
`,
    wu = `#version 100
#define SHADER_NAME Tiling-Sprite-100

precision lowp float;

attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = (uTransform * vec3(aTextureCoord, 1.0)).xy;
}
`,
    Sw = `#version 100
#define SHADER_NAME Tiling-Sprite-Simple-100

precision lowp float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void)
{
    vec4 texSample = texture2D(uSampler, vTextureCoord);
    gl_FragColor = texSample * uColor;
}
`;
const mn = new Gt;
class Nd extends oa {
    constructor(t) {
        super(t), t.runners.contextChange.add(this), this.quad = new Wf, this.state = br.for2d()
    }
    contextChange() {
        const t = this.renderer,
            r = {
                globals: t.globalUniforms
            };
        this.simpleShader = sr.from(wu, Sw, r), this.shader = t.context.webGLVersion > 1 ? sr.from(Aw, Tw, r) : sr.from(wu, Cw, r)
    }
    render(t) {
        const r = this.renderer,
            i = this.quad;
        let s = i.vertices;
        s[0] = s[6] = t._width * -t.anchor.x, s[1] = s[3] = t._height * -t.anchor.y, s[2] = s[4] = t._width * (1 - t.anchor.x), s[5] = s[7] = t._height * (1 - t.anchor.y);
        const n = t.uvRespectAnchor ? t.anchor.x : 0,
            a = t.uvRespectAnchor ? t.anchor.y : 0;
        s = i.uvs, s[0] = s[6] = -n, s[1] = s[3] = -a, s[2] = s[4] = 1 - n, s[5] = s[7] = 1 - a, i.invalidate();
        const o = t._texture,
            h = o.baseTexture,
            l = h.alphaMode > 0,
            c = t.tileTransform.localTransform,
            f = t.uvMatrix;
        let p = h.isPowerOfTwo && o.frame.width === h.width && o.frame.height === h.height;
        p && (h._glTextures[r.CONTEXT_UID] ? p = h.wrapMode !== Mr.CLAMP : h.wrapMode === Mr.CLAMP && (h.wrapMode = Mr.REPEAT));
        const m = p ? this.simpleShader : this.shader,
            v = o.width,
            _ = o.height,
            y = t._width,
            A = t._height;
        mn.set(c.a * v / y, c.b * v / A, c.c * _ / y, c.d * _ / A, c.tx / y, c.ty / A), mn.invert(), p ? mn.prepend(f.mapCoord) : (m.uniforms.uMapCoord = f.mapCoord.toArray(!0), m.uniforms.uClampFrame = f.uClampFrame, m.uniforms.uClampOffset = f.uClampOffset), m.uniforms.uTransform = mn.toArray(!0), m.uniforms.uColor = Ot.shared.setValue(t.tint).premultiply(t.worldAlpha, l).toArray(m.uniforms.uColor), m.uniforms.translationMatrix = t.transform.worldTransform.toArray(!0), m.uniforms.uSampler = o, r.shader.bind(m), r.geometry.bind(i), this.state.blendMode = Pf(t.blendMode, l), r.state.set(this.state), r.geometry.draw(this.renderer.gl.TRIANGLES, 6, 0)
    }
}
Nd.extension = {
    name: "tilingSprite",
    type: J.RendererPlugin
};
nt.add(Nd);
const fs = class {
    constructor(e, t, r = null) {
        this.linkedSheets = [], this._texture = e instanceof st ? e : null, this.baseTexture = e instanceof ct ? e : this._texture.baseTexture, this.textures = {}, this.animations = {}, this.data = t;
        const i = this.baseTexture.resource;
        this.resolution = this._updateResolution(r || (i ? i.url : null)), this._frames = this.data.frames, this._frameKeys = Object.keys(this._frames), this._batchIndex = 0, this._callback = null
    }
    _updateResolution(e = null) {
        const {
            scale: t
        } = this.data.meta;
        let r = Nr(e, null);
        return r === null && (r = parseFloat(t??"1")), r !== 1 && this.baseTexture.setResolution(r), r
    }
    parse() {
        return new Promise(e => {
            this._callback = e, this._batchIndex = 0, this._frameKeys.length <= fs.BATCH_SIZE ? (this._processFrames(0), this._processAnimations(), this._parseComplete()) : this._nextBatch()
        })
    }
    _processFrames(e) {
        let t = e;
        const r = fs.BATCH_SIZE;
        for (; t - e < r && t < this._frameKeys.length;) {
            const i = this._frameKeys[t],
                s = this._frames[i],
                n = s.frame;
            if (n) {
                let a = null,
                    o = null;
                const h = s.trimmed !== !1 && s.sourceSize ? s.sourceSize : s.frame,
                    l = new _t(0, 0, Math.floor(h.w) / this.resolution, Math.floor(h.h) / this.resolution);
                s.rotated ? a = new _t(Math.floor(n.x) / this.resolution, Math.floor(n.y) / this.resolution, Math.floor(n.h) / this.resolution, Math.floor(n.w) / this.resolution) : a = new _t(Math.floor(n.x) / this.resolution, Math.floor(n.y) / this.resolution, Math.floor(n.w) / this.resolution, Math.floor(n.h) / this.resolution), s.trimmed !== !1 && s.spriteSourceSize && (o = new _t(Math.floor(s.spriteSourceSize.x) / this.resolution, Math.floor(s.spriteSourceSize.y) / this.resolution, Math.floor(n.w) / this.resolution, Math.floor(n.h) / this.resolution)), this.textures[i] = new st(this.baseTexture, a, l, o, s.rotated ? 2 : 0, s.anchor, s.borders), st.addToCache(this.textures[i], i)
            }
            t++
        }
    }
    _processAnimations() {
        const e = this.data.animations || {};
        for (const t in e) {
            this.animations[t] = [];
            for (let r = 0; r < e[t].length; r++) {
                const i = e[t][r];
                this.animations[t].push(this.textures[i])
            }
        }
    }
    _parseComplete() {
        const e = this._callback;
        this._callback = null, this._batchIndex = 0, e.call(this, this.textures)
    }
    _nextBatch() {
        this._processFrames(this._batchIndex * fs.BATCH_SIZE), this._batchIndex++, setTimeout(() => {
            this._batchIndex * fs.BATCH_SIZE < this._frameKeys.length ? this._nextBatch() : (this._processAnimations(), this._parseComplete())
        }, 0)
    }
    destroy(e = !1) {
        var t;
        for (const r in this.textures) this.textures[r].destroy();
        this._frames = null, this._frameKeys = null, this.data = null, this.textures = null, e && ((t = this._texture) == null || t.destroy(), this.baseTexture.destroy()), this._texture = null, this.baseTexture = null, this.linkedSheets = []
    }
};
let sh = fs;
sh.BATCH_SIZE = 1e3;
const Iw = ["jpg", "png", "jpeg", "avif", "webp"];

function Dd(e, t, r) {
    const i = {};
    if (e.forEach(s => {
            i[s] = t
        }), Object.keys(t.textures).forEach(s => {
            i[s] = t.textures[s]
        }), !r) {
        const s = ye.dirname(e[0]);
        t.linkedSheets.forEach((n, a) => {
            const o = Dd([`${s}/${t.data.meta.related_multi_packs[a]}`], n, !0);
            Object.assign(i, o)
        })
    }
    return i
}
const Rw = {
    extension: J.Asset,
    cache: {
        test: e => e instanceof sh,
        getCacheableAssets: (e, t) => Dd(e, t, !1)
    },
    resolver: {
        test: e => {
            const r = e.split("?")[0].split("."),
                i = r.pop(),
                s = r.pop();
            return i === "json" && Iw.includes(s)
        },
        parse: e => {
            var r;
            const t = e.split(".");
            return {
                resolution: parseFloat(((r = K.RETINA_PREFIX.exec(e)) == null ? void 0 : r[1])??"1"),
                format: t[t.length - 2],
                src: e
            }
        }
    },
    loader: {
        name: "spritesheetLoader",
        extension: {
            type: J.LoadParser,
            priority: lr.Normal
        },
        async testParse(e, t) {
            return ye.extname(t.src).toLowerCase() === ".json" && !!e.frames
        },
        async parse(e, t, r) {
            var l, c;
            let i = ye.dirname(t.src);
            i && i.lastIndexOf("/") !== i.length - 1 && (i += "/");
            let s = i + e.meta.image;
            s = th(s, t.src);
            const a = (await r.load([s]))[s],
                o = new sh(a.baseTexture, e, t.src);
            await o.parse();
            const h = (l = e == null ? void 0 : e.meta) == null ? void 0 : l.related_multi_packs;
            if (Array.isArray(h)) {
                const f = [];
                for (const m of h) {
                    if (typeof m != "string") continue;
                    let v = i + m;
                    (c = t.data) != null && c.ignoreMultiPack || (v = th(v, t.src), f.push(r.load({
                        src: v,
                        data: {
                            ignoreMultiPack: !0
                        }
                    })))
                }
                const p = await Promise.all(f);
                o.linkedSheets = p, p.forEach(m => {
                    m.linkedSheets = [o].concat(o.linkedSheets.filter(v => v !== m))
                })
            }
            return o
        },
        unload(e) {
            e.destroy(!0)
        }
    }
};
nt.add(Rw);
class Wn {
    constructor() {
        this.info = [], this.common = [], this.page = [], this.char = [], this.kerning = [], this.distanceField = []
    }
}
class Sn {
    static test(t) {
        return typeof t == "string" && t.startsWith("info face=")
    }
    static parse(t) {
        const r = t.match(/^[a-z]+\s+.+$/gm),
            i = {
                info: [],
                common: [],
                page: [],
                char: [],
                chars: [],
                kerning: [],
                kernings: [],
                distanceField: []
            };
        for (const n in r) {
            const a = r[n].match(/^[a-z]+/gm)[0],
                o = r[n].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm),
                h = {};
            for (const l in o) {
                const c = o[l].split("="),
                    f = c[0],
                    p = c[1].replace(/"/gm, ""),
                    m = parseFloat(p),
                    v = isNaN(m) ? p : m;
                h[f] = v
            }
            i[a].push(h)
        }
        const s = new Wn;
        return i.info.forEach(n => s.info.push({
            face: n.face,
            size: parseInt(n.size, 10)
        })), i.common.forEach(n => s.common.push({
            lineHeight: parseInt(n.lineHeight, 10)
        })), i.page.forEach(n => s.page.push({
            id: parseInt(n.id, 10),
            file: n.file
        })), i.char.forEach(n => s.char.push({
            id: parseInt(n.id, 10),
            page: parseInt(n.page, 10),
            x: parseInt(n.x, 10),
            y: parseInt(n.y, 10),
            width: parseInt(n.width, 10),
            height: parseInt(n.height, 10),
            xoffset: parseInt(n.xoffset, 10),
            yoffset: parseInt(n.yoffset, 10),
            xadvance: parseInt(n.xadvance, 10)
        })), i.kerning.forEach(n => s.kerning.push({
            first: parseInt(n.first, 10),
            second: parseInt(n.second, 10),
            amount: parseInt(n.amount, 10)
        })), i.distanceField.forEach(n => s.distanceField.push({
            distanceRange: parseInt(n.distanceRange, 10),
            fieldType: n.fieldType
        })), s
    }
}
class nh {
    static test(t) {
        const r = t;
        return "getElementsByTagName" in r && r.getElementsByTagName("page").length && r.getElementsByTagName("info")[0].getAttribute("face") !== null
    }
    static parse(t) {
        const r = new Wn,
            i = t.getElementsByTagName("info"),
            s = t.getElementsByTagName("common"),
            n = t.getElementsByTagName("page"),
            a = t.getElementsByTagName("char"),
            o = t.getElementsByTagName("kerning"),
            h = t.getElementsByTagName("distanceField");
        for (let l = 0; l < i.length; l++) r.info.push({
            face: i[l].getAttribute("face"),
            size: parseInt(i[l].getAttribute("size"), 10)
        });
        for (let l = 0; l < s.length; l++) r.common.push({
            lineHeight: parseInt(s[l].getAttribute("lineHeight"), 10)
        });
        for (let l = 0; l < n.length; l++) r.page.push({
            id: parseInt(n[l].getAttribute("id"), 10) || 0,
            file: n[l].getAttribute("file")
        });
        for (let l = 0; l < a.length; l++) {
            const c = a[l];
            r.char.push({
                id: parseInt(c.getAttribute("id"), 10),
                page: parseInt(c.getAttribute("page"), 10) || 0,
                x: parseInt(c.getAttribute("x"), 10),
                y: parseInt(c.getAttribute("y"), 10),
                width: parseInt(c.getAttribute("width"), 10),
                height: parseInt(c.getAttribute("height"), 10),
                xoffset: parseInt(c.getAttribute("xoffset"), 10),
                yoffset: parseInt(c.getAttribute("yoffset"), 10),
                xadvance: parseInt(c.getAttribute("xadvance"), 10)
            })
        }
        for (let l = 0; l < o.length; l++) r.kerning.push({
            first: parseInt(o[l].getAttribute("first"), 10),
            second: parseInt(o[l].getAttribute("second"), 10),
            amount: parseInt(o[l].getAttribute("amount"), 10)
        });
        for (let l = 0; l < h.length; l++) r.distanceField.push({
            fieldType: h[l].getAttribute("fieldType"),
            distanceRange: parseInt(h[l].getAttribute("distanceRange"), 10)
        });
        return r
    }
}
class ah {
    static test(t) {
        return typeof t == "string" && t.includes("<font>") ? nh.test(K.ADAPTER.parseXML(t)) : !1
    }
    static parse(t) {
        return nh.parse(K.ADAPTER.parseXML(t))
    }
}
const wo = [Sn, nh, ah];

function Mw(e) {
    for (let t = 0; t < wo.length; t++)
        if (wo[t].test(e)) return wo[t];
    return null
}

function Pw(e, t, r, i, s, n) {
    const a = r.fill;
    if (Array.isArray(a)) {
        if (a.length === 1) return a[0]
    } else return a;
    let o;
    const h = r.dropShadow ? r.dropShadowDistance : 0,
        l = r.padding || 0,
        c = e.width / i - h - l * 2,
        f = e.height / i - h - l * 2,
        p = a.slice(),
        m = r.fillGradientStops.slice();
    if (!m.length) {
        const v = p.length + 1;
        for (let _ = 1; _ < v; ++_) m.push(_ / v)
    }
    if (p.unshift(a[0]), m.unshift(0), p.push(a[a.length - 1]), m.push(1), r.fillGradientType === ma.LINEAR_VERTICAL) {
        o = t.createLinearGradient(c / 2, l, c / 2, f + l);
        let v = 0;
        const y = (n.fontProperties.fontSize + r.strokeThickness) / f;
        for (let A = 0; A < s.length; A++) {
            const I = n.lineHeight * A;
            for (let x = 0; x < p.length; x++) {
                let S = 0;
                typeof m[x] == "number" ? S = m[x] : S = x / p.length;
                const $ = I / f + S * y;
                let k = Math.max(v, $);
                k = Math.min(k, 1), o.addColorStop(k, p[x]), v = k
            }
        }
    } else {
        o = t.createLinearGradient(l, f / 2, c + l, f / 2);
        const v = p.length + 1;
        let _ = 1;
        for (let y = 0; y < p.length; y++) {
            let A;
            typeof m[y] == "number" ? A = m[y] : A = _ / v, o.addColorStop(A, p[y]), _++
        }
    }
    return o
}

function Nw(e, t, r, i, s, n, a) {
    const o = r.text,
        h = r.fontProperties;
    t.translate(i, s), t.scale(n, n);
    const l = a.strokeThickness / 2,
        c = -(a.strokeThickness / 2);
    if (t.font = a.toFontString(), t.lineWidth = a.strokeThickness, t.textBaseline = a.textBaseline, t.lineJoin = a.lineJoin, t.miterLimit = a.miterLimit, t.fillStyle = Pw(e, t, a, n, [o], r), t.strokeStyle = a.stroke, a.dropShadow) {
        const f = a.dropShadowColor,
            p = a.dropShadowBlur * n,
            m = a.dropShadowDistance * n;
        t.shadowColor = Ot.shared.setValue(f).setAlpha(a.dropShadowAlpha).toRgbaString(), t.shadowBlur = p, t.shadowOffsetX = Math.cos(a.dropShadowAngle) * m, t.shadowOffsetY = Math.sin(a.dropShadowAngle) * m
    } else t.shadowColor = "black", t.shadowBlur = 0, t.shadowOffsetX = 0, t.shadowOffsetY = 0;
    a.stroke && a.strokeThickness && t.strokeText(o, l, c + r.lineHeight - h.descent), a.fill && t.fillText(o, l, c + r.lineHeight - h.descent), t.setTransform(1, 0, 0, 1, 0, 0), t.fillStyle = "rgba(0, 0, 0, 0)"
}

function In(e) {
    return e.codePointAt ? e.codePointAt(0) : e.charCodeAt(0)
}

function Bd(e) {
    return Array.from ? Array.from(e) : e.split("")
}

function Dw(e) {
    typeof e == "string" && (e = [e]);
    const t = [];
    for (let r = 0, i = e.length; r < i; r++) {
        const s = e[r];
        if (Array.isArray(s)) {
            if (s.length !== 2) throw new Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${s.length}.`);
            const n = s[0].charCodeAt(0),
                a = s[1].charCodeAt(0);
            if (a < n) throw new Error("[BitmapFont]: Invalid character range.");
            for (let o = n, h = a; o <= h; o++) t.push(String.fromCharCode(o))
        } else t.push(...Bd(s))
    }
    if (t.length === 0) throw new Error("[BitmapFont]: Empty set when resolving characters.");
    return t
}
const ke = class {
    constructor(e, t, r) {
        var l;
        const [i] = e.info, [s] = e.common, [n] = e.page, [a] = e.distanceField, o = Nr(n.file), h = {};
        this._ownsTextures = r, this.font = i.face, this.size = i.size, this.lineHeight = s.lineHeight / o, this.chars = {}, this.pageTextures = h;
        for (let c = 0; c < e.page.length; c++) {
            const {
                id: f,
                file: p
            } = e.page[c];
            h[f] = t instanceof Array ? t[c] : t[p], a != null && a.fieldType && a.fieldType !== "none" && (h[f].baseTexture.alphaMode = qe.NO_PREMULTIPLIED_ALPHA, h[f].baseTexture.mipmap = hr.OFF)
        }
        for (let c = 0; c < e.char.length; c++) {
            const {
                id: f,
                page: p
            } = e.char[c];
            let {
                x: m,
                y: v,
                width: _,
                height: y,
                xoffset: A,
                yoffset: I,
                xadvance: x
            } = e.char[c];
            m /= o, v /= o, _ /= o, y /= o, A /= o, I /= o, x /= o;
            const S = new _t(m + h[p].frame.x / o, v + h[p].frame.y / o, _, y);
            this.chars[f] = {
                xOffset: A,
                yOffset: I,
                xAdvance: x,
                kerning: {},
                texture: new st(h[p].baseTexture, S),
                page: p
            }
        }
        for (let c = 0; c < e.kerning.length; c++) {
            let {
                first: f,
                second: p,
                amount: m
            } = e.kerning[c];
            f /= o, p /= o, m /= o, this.chars[p] && (this.chars[p].kerning[f] = m)
        }
        this.distanceFieldRange = a == null ? void 0 : a.distanceRange, this.distanceFieldType = ((l = a == null ? void 0 : a.fieldType) == null ? void 0 : l.toLowerCase())??"none"
    }
    destroy() {
        for (const e in this.chars) this.chars[e].texture.destroy(), this.chars[e].texture = null;
        for (const e in this.pageTextures) this._ownsTextures && this.pageTextures[e].destroy(!0), this.pageTextures[e] = null;
        this.chars = null, this.pageTextures = null
    }
    static install(e, t, r) {
        let i;
        if (e instanceof Wn) i = e;
        else {
            const n = Mw(e);
            if (!n) throw new Error("Unrecognized data format for font.");
            i = n.parse(e)
        }
        t instanceof st && (t = [t]);
        const s = new ke(i, t, r);
        return ke.available[s.font] = s, s
    }
    static uninstall(e) {
        const t = ke.available[e];
        if (!t) throw new Error(`No font found named '${e}'`);
        t.destroy(), delete ke.available[e]
    }
    static from(e, t, r) {
        if (!e) throw new Error("[BitmapFont] Property `name` is required.");
        const {
            chars: i,
            padding: s,
            resolution: n,
            textureWidth: a,
            textureHeight: o,
            ...h
        } = Object.assign({}, ke.defaultOptions, r), l = Dw(i), c = t instanceof ri ? t : new ri(t), f = a, p = new Wn;
        p.info[0] = {
            face: c.fontFamily,
            size: c.fontSize
        }, p.common[0] = {
            lineHeight: c.fontSize
        };
        let m = 0,
            v = 0,
            _, y, A, I = 0;
        const x = [];
        for (let $ = 0; $ < l.length; $++) {
            _ || (_ = K.ADAPTER.createCanvas(), _.width = a, _.height = o, y = _.getContext("2d"), A = new ct(_, {
                resolution: n,
                ...h
            }), x.push(new st(A)), p.page.push({
                id: x.length - 1,
                file: ""
            }));
            const k = l[$],
                G = he.measureText(k, c, !1, _),
                L = G.width,
                Y = Math.ceil(G.height),
                et = Math.ceil((c.fontStyle === "italic" ? 2 : 1) * L);
            if (v >= o - Y * n) {
                if (v === 0) throw new Error(`[BitmapFont] textureHeight ${o}px is too small (fontFamily: '${c.fontFamily}', fontSize: ${c.fontSize}px, char: '${k}')`);
                --$, _ = null, y = null, A = null, v = 0, m = 0, I = 0;
                continue
            }
            if (I = Math.max(Y + G.fontProperties.descent, I), et * n + m >= f) {
                if (m === 0) throw new Error(`[BitmapFont] textureWidth ${a}px is too small (fontFamily: '${c.fontFamily}', fontSize: ${c.fontSize}px, char: '${k}')`);
                --$, v += I * n, v = Math.ceil(v), m = 0, I = 0;
                continue
            }
            Nw(_, y, G, m, v, n, c);
            const E = In(G.text);
            p.char.push({
                id: E,
                page: x.length - 1,
                x: m / n,
                y: v / n,
                width: et,
                height: Y,
                xoffset: 0,
                yoffset: 0,
                xadvance: L - (c.dropShadow ? c.dropShadowDistance : 0) - (c.stroke ? c.strokeThickness : 0)
            }), m += (et + 2 * s) * n, m = Math.ceil(m)
        }
        for (let $ = 0, k = l.length; $ < k; $++) {
            const G = l[$];
            for (let L = 0; L < k; L++) {
                const Y = l[L],
                    et = y.measureText(G).width,
                    E = y.measureText(Y).width,
                    N = y.measureText(G + Y).width - (et + E);
                N && p.kerning.push({
                    first: In(G),
                    second: In(Y),
                    amount: N
                })
            }
        }
        const S = new ke(p, x, !0);
        return ke.available[e] !== void 0 && ke.uninstall(e), ke.available[e] = S, S
    }
};
let ge = ke;
ge.ALPHA = [
    ["a", "z"],
    ["A", "Z"], " "
];
ge.NUMERIC = [
    ["0", "9"]
];
ge.ALPHANUMERIC = [
    ["a", "z"],
    ["A", "Z"],
    ["0", "9"], " "
];
ge.ASCII = [
    [" ", "~"]
];
ge.defaultOptions = {
    resolution: 1,
    textureWidth: 512,
    textureHeight: 512,
    padding: 4,
    chars: ke.ALPHANUMERIC
};
ge.available = {};
var Bw = `// Pixi texture info\r
varying vec2 vTextureCoord;\r
uniform sampler2D uSampler;\r
\r
// Tint\r
uniform vec4 uColor;\r
\r
// on 2D applications fwidth is screenScale / glyphAtlasScale * distanceFieldRange\r
uniform float uFWidth;\r
\r
void main(void) {\r
\r
  // To stack MSDF and SDF we need a non-pre-multiplied-alpha texture.\r
  vec4 texColor = texture2D(uSampler, vTextureCoord);\r
\r
  // MSDF\r
  float median = texColor.r + texColor.g + texColor.b -\r
                  min(texColor.r, min(texColor.g, texColor.b)) -\r
                  max(texColor.r, max(texColor.g, texColor.b));\r
  // SDF\r
  median = min(median, texColor.a);\r
\r
  float screenPxDistance = uFWidth * (median - 0.5);\r
  float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);\r
  if (median < 0.01) {\r
    alpha = 0.0;\r
  } else if (median > 0.99) {\r
    alpha = 1.0;\r
  }\r
\r
  // Gamma correction for coverage-like alpha\r
  float luma = dot(uColor.rgb, vec3(0.299, 0.587, 0.114));\r
  float gamma = mix(1.0, 1.0 / 2.2, luma);\r
  float coverage = pow(uColor.a * alpha, gamma);  \r
\r
  // NPM Textures, NPM outputs\r
  gl_FragColor = vec4(uColor.rgb, coverage);\r
}\r
`,
    Ow = `// Mesh material default fragment\r
attribute vec2 aVertexPosition;\r
attribute vec2 aTextureCoord;\r
\r
uniform mat3 projectionMatrix;\r
uniform mat3 translationMatrix;\r
uniform mat3 uTextureMatrix;\r
\r
varying vec2 vTextureCoord;\r
\r
void main(void)\r
{\r
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\r
\r
    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;\r
}\r
`;
const Eu = [],
    Tu = [],
    Au = [],
    Od = class extends xe {
        constructor(e, t = {}) {
            super();
            const {
                align: r,
                tint: i,
                maxWidth: s,
                letterSpacing: n,
                fontName: a,
                fontSize: o
            } = Object.assign({}, Od.styleDefaults, t);
            if (!ge.available[a]) throw new Error(`Missing BitmapFont "${a}"`);
            this._activePagesMeshData = [], this._textWidth = 0, this._textHeight = 0, this._align = r, this._tintColor = new Ot(i), this._font = void 0, this._fontName = a, this._fontSize = o, this.text = e, this._maxWidth = s, this._maxLineHeight = 0, this._letterSpacing = n, this._anchor = new gr(() => {
                this.dirty = !0
            }, this, 0, 0), this._roundPixels = K.ROUND_PIXELS, this.dirty = !0, this._resolution = K.RESOLUTION, this._autoResolution = !0, this._textureCache = {}
        }
        updateText() {
            var et;
            const e = ge.available[this._fontName],
                t = this.fontSize,
                r = t / e.size,
                i = new Lt,
                s = [],
                n = [],
                a = [],
                o = this._text.replace(/(?:\r\n|\r)/g, `
`) || " ",
                h = Bd(o),
                l = this._maxWidth * e.size / t,
                c = e.distanceFieldType === "none" ? Eu : Tu;
            let f = null,
                p = 0,
                m = 0,
                v = 0,
                _ = -1,
                y = 0,
                A = 0,
                I = 0,
                x = 0;
            for (let E = 0; E < h.length; E++) {
                const D = h[E],
                    N = In(D);
                if (/(?:\s)/.test(D) && (_ = E, y = p, x++), D === "\r" || D === `
`) {
                    n.push(p), a.push(-1), m = Math.max(m, p), ++v, ++A, i.x = 0, i.y += e.lineHeight, f = null, x = 0;
                    continue
                }
                const R = e.chars[N];
                if (!R) continue;
                f && R.kerning[f] && (i.x += R.kerning[f]);
                const j = Au.pop() || {
                    texture: st.EMPTY,
                    line: 0,
                    charCode: 0,
                    prevSpaces: 0,
                    position: new Lt
                };
                j.texture = R.texture, j.line = v, j.charCode = N, j.position.x = Math.round(i.x + R.xOffset + this._letterSpacing / 2), j.position.y = Math.round(i.y + R.yOffset), j.prevSpaces = x, s.push(j), p = j.position.x + Math.max(R.xAdvance - R.xOffset, R.texture.orig.width), i.x += R.xAdvance + this._letterSpacing, I = Math.max(I, R.yOffset + R.texture.height), f = N, _ !== -1 && l > 0 && i.x > l && (++A, gs(s, 1 + _ - A, 1 + E - _), E = _, _ = -1, n.push(y), a.push(s.length > 0 ? s[s.length - 1].prevSpaces : 0), m = Math.max(m, y), v++, i.x = 0, i.y += e.lineHeight, f = null, x = 0)
            }
            const S = h[h.length - 1];
            S !== "\r" && S !== `
` && (/(?:\s)/.test(S) && (p = y), n.push(p), m = Math.max(m, p), a.push(-1));
            const $ = [];
            for (let E = 0; E <= v; E++) {
                let D = 0;
                this._align === "right" ? D = m - n[E] : this._align === "center" ? D = (m - n[E]) / 2 : this._align === "justify" && (D = a[E] < 0 ? 0 : (m - n[E]) / a[E]), $.push(D)
            }
            const k = s.length,
                G = {},
                L = [],
                Y = this._activePagesMeshData;
            c.push(...Y);
            for (let E = 0; E < k; E++) {
                const D = s[E].texture,
                    N = D.baseTexture.uid;
                if (!G[N]) {
                    let R = c.pop();
                    if (!R) {
                        const H = new aw;
                        let U, it;
                        e.distanceFieldType === "none" ? (U = new xu(st.EMPTY), it = lt.NORMAL) : (U = new xu(st.EMPTY, {
                            program: $e.from(Ow, Bw),
                            uniforms: {
                                uFWidth: 0
                            }
                        }), it = lt.NORMAL_NPM);
                        const at = new rh(H, U);
                        at.blendMode = it, R = {
                            index: 0,
                            indexCount: 0,
                            vertexCount: 0,
                            uvsCount: 0,
                            total: 0,
                            mesh: at,
                            vertices: null,
                            uvs: null,
                            indices: null
                        }
                    }
                    R.index = 0, R.indexCount = 0, R.vertexCount = 0, R.uvsCount = 0, R.total = 0;
                    const {
                        _textureCache: j
                    } = this;
                    j[N] = j[N] || new st(D.baseTexture), R.mesh.texture = j[N], R.mesh.tint = this._tintColor.value, L.push(R), G[N] = R
                }
                G[N].total++
            }
            for (let E = 0; E < Y.length; E++) L.includes(Y[E]) || this.removeChild(Y[E].mesh);
            for (let E = 0; E < L.length; E++) L[E].mesh.parent !== this && this.addChild(L[E].mesh);
            this._activePagesMeshData = L;
            for (const E in G) {
                const D = G[E],
                    N = D.total;
                if (!(((et = D.indices) == null ? void 0 : et.length) > 6 * N) || D.vertices.length < rh.BATCHABLE_SIZE * 2) D.vertices = new Float32Array(4 * 2 * N), D.uvs = new Float32Array(4 * 2 * N), D.indices = new Uint16Array(6 * N);
                else {
                    const R = D.total,
                        j = D.vertices;
                    for (let H = R * 4 * 2; H < j.length; H++) j[H] = 0
                }
                D.mesh.size = 6 * N
            }
            for (let E = 0; E < k; E++) {
                const D = s[E];
                let N = D.position.x + $[D.line] * (this._align === "justify" ? D.prevSpaces : 1);
                this._roundPixels && (N = Math.round(N));
                const R = N * r,
                    j = D.position.y * r,
                    H = D.texture,
                    U = G[H.baseTexture.uid],
                    it = H.frame,
                    at = H._uvs,
                    O = U.index++;
                U.indices[O * 6 + 0] = 0 + O * 4, U.indices[O * 6 + 1] = 1 + O * 4, U.indices[O * 6 + 2] = 2 + O * 4, U.indices[O * 6 + 3] = 0 + O * 4, U.indices[O * 6 + 4] = 2 + O * 4, U.indices[O * 6 + 5] = 3 + O * 4, U.vertices[O * 8 + 0] = R, U.vertices[O * 8 + 1] = j, U.vertices[O * 8 + 2] = R + it.width * r, U.vertices[O * 8 + 3] = j, U.vertices[O * 8 + 4] = R + it.width * r, U.vertices[O * 8 + 5] = j + it.height * r, U.vertices[O * 8 + 6] = R, U.vertices[O * 8 + 7] = j + it.height * r, U.uvs[O * 8 + 0] = at.x0, U.uvs[O * 8 + 1] = at.y0, U.uvs[O * 8 + 2] = at.x1, U.uvs[O * 8 + 3] = at.y1, U.uvs[O * 8 + 4] = at.x2, U.uvs[O * 8 + 5] = at.y2, U.uvs[O * 8 + 6] = at.x3, U.uvs[O * 8 + 7] = at.y3
            }
            this._textWidth = m * r, this._textHeight = (i.y + e.lineHeight) * r;
            for (const E in G) {
                const D = G[E];
                if (this.anchor.x !== 0 || this.anchor.y !== 0) {
                    let H = 0;
                    const U = this._textWidth * this.anchor.x,
                        it = this._textHeight * this.anchor.y;
                    for (let at = 0; at < D.total; at++) D.vertices[H++] -= U, D.vertices[H++] -= it, D.vertices[H++] -= U, D.vertices[H++] -= it, D.vertices[H++] -= U, D.vertices[H++] -= it, D.vertices[H++] -= U, D.vertices[H++] -= it
                }
                this._maxLineHeight = I * r;
                const N = D.mesh.geometry.getBuffer("aVertexPosition"),
                    R = D.mesh.geometry.getBuffer("aTextureCoord"),
                    j = D.mesh.geometry.getIndex();
                N.data = D.vertices, R.data = D.uvs, j.data = D.indices, N.update(), R.update(), j.update()
            }
            for (let E = 0; E < s.length; E++) Au.push(s[E]);
            this._font = e, this.dirty = !1
        }
        updateTransform() {
            this.validate(), this.containerUpdateTransform()
        }
        _render(e) {
            this._autoResolution && this._resolution !== e.resolution && (this._resolution = e.resolution, this.dirty = !0);
            const {
                distanceFieldRange: t,
                distanceFieldType: r,
                size: i
            } = ge.available[this._fontName];
            if (r !== "none") {
                const {
                    a: s,
                    b: n,
                    c: a,
                    d: o
                } = this.worldTransform, h = Math.sqrt(s * s + n * n), l = Math.sqrt(a * a + o * o), c = (Math.abs(h) + Math.abs(l)) / 2, f = this.fontSize / i, p = e._view.resolution;
                for (const m of this._activePagesMeshData) m.mesh.shader.uniforms.uFWidth = c * t * f * p
            }
            super._render(e)
        }
        getLocalBounds() {
            return this.validate(), super.getLocalBounds()
        }
        validate() {
            const e = ge.available[this._fontName];
            if (!e) throw new Error(`Missing BitmapFont "${this._fontName}"`);
            this._font !== e && (this.dirty = !0), this.dirty && this.updateText()
        }
        get tint() {
            return this._tintColor.value
        }
        set tint(e) {
            if (this.tint !== e) {
                this._tintColor.setValue(e);
                for (let t = 0; t < this._activePagesMeshData.length; t++) this._activePagesMeshData[t].mesh.tint = e
            }
        }
        get align() {
            return this._align
        }
        set align(e) {
            this._align !== e && (this._align = e, this.dirty = !0)
        }
        get fontName() {
            return this._fontName
        }
        set fontName(e) {
            if (!ge.available[e]) throw new Error(`Missing BitmapFont "${e}"`);
            this._fontName !== e && (this._fontName = e, this.dirty = !0)
        }
        get fontSize() {
            return this._fontSize??ge.available[this._fontName].size
        }
        set fontSize(e) {
            this._fontSize !== e && (this._fontSize = e, this.dirty = !0)
        }
        get anchor() {
            return this._anchor
        }
        set anchor(e) {
            typeof e == "number" ? this._anchor.set(e) : this._anchor.copyFrom(e)
        }
        get text() {
            return this._text
        }
        set text(e) {
            e = String(e??""), this._text !== e && (this._text = e, this.dirty = !0)
        }
        get maxWidth() {
            return this._maxWidth
        }
        set maxWidth(e) {
            this._maxWidth !== e && (this._maxWidth = e, this.dirty = !0)
        }
        get maxLineHeight() {
            return this.validate(), this._maxLineHeight
        }
        get textWidth() {
            return this.validate(), this._textWidth
        }
        get letterSpacing() {
            return this._letterSpacing
        }
        set letterSpacing(e) {
            this._letterSpacing !== e && (this._letterSpacing = e, this.dirty = !0)
        }
        get roundPixels() {
            return this._roundPixels
        }
        set roundPixels(e) {
            e !== this._roundPixels && (this._roundPixels = e, this.dirty = !0)
        }
        get textHeight() {
            return this.validate(), this._textHeight
        }
        get resolution() {
            return this._resolution
        }
        set resolution(e) {
            this._autoResolution = !1, this._resolution !== e && (this._resolution = e, this.dirty = !0)
        }
        destroy(e) {
            const {
                _textureCache: t
            } = this, i = ge.available[this._fontName].distanceFieldType === "none" ? Eu : Tu;
            i.push(...this._activePagesMeshData);
            for (const s of this._activePagesMeshData) this.removeChild(s.mesh);
            this._activePagesMeshData = [], i.filter(s => t[s.mesh.texture.baseTexture.uid]).forEach(s => {
                s.mesh.texture = st.EMPTY
            });
            for (const s in t) t[s].destroy(), delete t[s];
            this._font = null, this._tintColor = null, this._textureCache = null, super.destroy(e)
        }
    };
let Fw = Od;
Fw.styleDefaults = {
    align: "left",
    tint: 16777215,
    maxWidth: 0,
    letterSpacing: 0
};
const kw = [".xml", ".fnt"],
    Lw = {
        extension: {
            type: J.LoadParser,
            priority: lr.Normal
        },
        name: "loadBitmapFont",
        test(e) {
            return kw.includes(ye.extname(e).toLowerCase())
        },
        async testParse(e) {
            return Sn.test(e) || ah.test(e)
        },
        async parse(e, t, r) {
            const i = Sn.test(e) ? Sn.parse(e) : ah.parse(e),
                {
                    src: s
                } = t,
                {
                    page: n
                } = i,
                a = [];
            for (let l = 0; l < n.length; ++l) {
                const c = n[l].file;
                let f = ye.join(ye.dirname(s), c);
                f = th(f, s), a.push(f)
            }
            const o = await r.load(a),
                h = a.map(l => o[l]);
            return ge.install(i, h, !0)
        },
        async load(e, t) {
            return (await K.ADAPTER.fetch(e)).text()
        },
        unload(e) {
            e.destroy()
        }
    };
nt.add(Lw);
var Fr = {},
    wr = {};

function Uw(e, t, r) {
    if (r === void 0 && (r = Array.prototype), e && typeof r.find == "function") return r.find.call(e, t);
    for (var i = 0; i < e.length; i++)
        if (Object.prototype.hasOwnProperty.call(e, i)) {
            var s = e[i];
            if (t.call(void 0, s, i, e)) return s
        }
}

function Ph(e, t) {
    return t === void 0 && (t = Object), t && typeof t.freeze == "function" ? t.freeze(e) : e
}

function Gw(e, t) {
    if (e === null || typeof e != "object") throw new TypeError("target is not an object");
    for (var r in t) Object.prototype.hasOwnProperty.call(t, r) && (e[r] = t[r]);
    return e
}
var Fd = Ph({
        HTML: "text/html",
        isHTML: function(e) {
            return e === Fd.HTML
        },
        XML_APPLICATION: "application/xml",
        XML_TEXT: "text/xml",
        XML_XHTML_APPLICATION: "application/xhtml+xml",
        XML_SVG_IMAGE: "image/svg+xml"
    }),
    kd = Ph({
        HTML: "http://www.w3.org/1999/xhtml",
        isHTML: function(e) {
            return e === kd.HTML
        },
        SVG: "http://www.w3.org/2000/svg",
        XML: "http://www.w3.org/XML/1998/namespace",
        XMLNS: "http://www.w3.org/2000/xmlns/"
    });
wr.assign = Gw;
wr.find = Uw;
wr.freeze = Ph;
wr.MIME_TYPE = Fd;
wr.NAMESPACE = kd;
var Ld = wr,
    nr = Ld.find,
    Cs = Ld.NAMESPACE;

function $w(e) {
    return e !== ""
}

function Hw(e) {
    return e ? e.split(/[\t\n\f\r ]+/).filter($w) : []
}

function Vw(e, t) {
    return e.hasOwnProperty(t) || (e[t] = !0), e
}

function Cu(e) {
    if (!e) return [];
    var t = Hw(e);
    return Object.keys(t.reduce(Vw, {}))
}

function zw(e) {
    return function(t) {
        return e && e.indexOf(t) !== -1
    }
}

function Bs(e, t) {
    for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r])
}

function be(e, t) {
    var r = e.prototype;
    if (!(r instanceof t)) {
        let i = function() {};
        i.prototype = t.prototype, i = new i, Bs(r, i), e.prototype = r = i
    }
    r.constructor != e && (typeof e != "function" && console.error("unknown Class:" + e), r.constructor = e)
}
var we = {},
    je = we.ELEMENT_NODE = 1,
    Xi = we.ATTRIBUTE_NODE = 2,
    Yn = we.TEXT_NODE = 3,
    Ud = we.CDATA_SECTION_NODE = 4,
    Gd = we.ENTITY_REFERENCE_NODE = 5,
    Xw = we.ENTITY_NODE = 6,
    $d = we.PROCESSING_INSTRUCTION_NODE = 7,
    Hd = we.COMMENT_NODE = 8,
    Vd = we.DOCUMENT_NODE = 9,
    zd = we.DOCUMENT_TYPE_NODE = 10,
    yr = we.DOCUMENT_FRAGMENT_NODE = 11,
    jw = we.NOTATION_NODE = 12,
    fe = {},
    ne = {};
fe.INDEX_SIZE_ERR = (ne[1] = "Index size error", 1);
fe.DOMSTRING_SIZE_ERR = (ne[2] = "DOMString size error", 2);
var _e = fe.HIERARCHY_REQUEST_ERR = (ne[3] = "Hierarchy request error", 3);
fe.WRONG_DOCUMENT_ERR = (ne[4] = "Wrong document", 4);
fe.INVALID_CHARACTER_ERR = (ne[5] = "Invalid character", 5);
fe.NO_DATA_ALLOWED_ERR = (ne[6] = "No data allowed", 6);
fe.NO_MODIFICATION_ALLOWED_ERR = (ne[7] = "No modification allowed", 7);
var Xd = fe.NOT_FOUND_ERR = (ne[8] = "Not found", 8);
fe.NOT_SUPPORTED_ERR = (ne[9] = "Not supported", 9);
var Su = fe.INUSE_ATTRIBUTE_ERR = (ne[10] = "Attribute in use", 10);
fe.INVALID_STATE_ERR = (ne[11] = "Invalid state", 11);
fe.SYNTAX_ERR = (ne[12] = "Syntax error", 12);
fe.INVALID_MODIFICATION_ERR = (ne[13] = "Invalid modification", 13);
fe.NAMESPACE_ERR = (ne[14] = "Invalid namespace", 14);
fe.INVALID_ACCESS_ERR = (ne[15] = "Invalid access", 15);

function qt(e, t) {
    if (t instanceof Error) var r = t;
    else r = this, Error.call(this, ne[e]), this.message = ne[e], Error.captureStackTrace && Error.captureStackTrace(this, qt);
    return r.code = e, t && (this.message = this.message + ": " + t), r
}
qt.prototype = Error.prototype;
Bs(fe, qt);

function _r() {}
_r.prototype = {
    length: 0,
    item: function(e) {
        return this[e] || null
    },
    toString: function(e, t) {
        for (var r = [], i = 0; i < this.length; i++) Ni(this[i], r, e, t);
        return r.join("")
    },
    filter: function(e) {
        return Array.prototype.filter.call(this, e)
    },
    indexOf: function(e) {
        return Array.prototype.indexOf.call(this, e)
    }
};

function ji(e, t) {
    this._node = e, this._refresh = t, Nh(this)
}

function Nh(e) {
    var t = e._node._inc || e._node.ownerDocument._inc;
    if (e._inc != t) {
        var r = e._refresh(e._node);
        ip(e, "length", r.length), Bs(r, e), e._inc = t
    }
}
ji.prototype.item = function(e) {
    return Nh(this), this[e]
};
be(ji, _r);

function qn() {}

function jd(e, t) {
    for (var r = e.length; r--;)
        if (e[r] === t) return r
}

function Iu(e, t, r, i) {
    if (i ? t[jd(t, i)] = r : t[t.length++] = r, e) {
        r.ownerElement = e;
        var s = e.ownerDocument;
        s && (i && qd(s, e, i), Ww(s, e, r))
    }
}

function Ru(e, t, r) {
    var i = jd(t, r);
    if (i >= 0) {
        for (var s = t.length - 1; i < s;) t[i] = t[++i];
        if (t.length = s, e) {
            var n = e.ownerDocument;
            n && (qd(n, e, r), r.ownerElement = null)
        }
    } else throw new qt(Xd, new Error(e.tagName + "@" + r))
}
qn.prototype = {
    length: 0,
    item: _r.prototype.item,
    getNamedItem: function(e) {
        for (var t = this.length; t--;) {
            var r = this[t];
            if (r.nodeName == e) return r
        }
    },
    setNamedItem: function(e) {
        var t = e.ownerElement;
        if (t && t != this._ownerElement) throw new qt(Su);
        var r = this.getNamedItem(e.nodeName);
        return Iu(this._ownerElement, this, e, r), r
    },
    setNamedItemNS: function(e) {
        var t = e.ownerElement,
            r;
        if (t && t != this._ownerElement) throw new qt(Su);
        return r = this.getNamedItemNS(e.namespaceURI, e.localName), Iu(this._ownerElement, this, e, r), r
    },
    removeNamedItem: function(e) {
        var t = this.getNamedItem(e);
        return Ru(this._ownerElement, this, t), t
    },
    removeNamedItemNS: function(e, t) {
        var r = this.getNamedItemNS(e, t);
        return Ru(this._ownerElement, this, r), r
    },
    getNamedItemNS: function(e, t) {
        for (var r = this.length; r--;) {
            var i = this[r];
            if (i.localName == t && i.namespaceURI == e) return i
        }
        return null
    }
};

function Wd() {}
Wd.prototype = {
    hasFeature: function(e, t) {
        return !0
    },
    createDocument: function(e, t, r) {
        var i = new Os;
        if (i.implementation = this, i.childNodes = new _r, i.doctype = r || null, r && i.appendChild(r), t) {
            var s = i.createElementNS(e, t);
            i.appendChild(s)
        }
        return i
    },
    createDocumentType: function(e, t, r) {
        var i = new ga;
        return i.name = e, i.nodeName = e, i.publicId = t || "", i.systemId = r || "", i
    }
};

function Mt() {}
Mt.prototype = {
    firstChild: null,
    lastChild: null,
    previousSibling: null,
    nextSibling: null,
    attributes: null,
    parentNode: null,
    childNodes: null,
    ownerDocument: null,
    nodeValue: null,
    namespaceURI: null,
    prefix: null,
    localName: null,
    insertBefore: function(e, t) {
        return Zn(this, e, t)
    },
    replaceChild: function(e, t) {
        Zn(this, e, t, Kd), t && this.removeChild(t)
    },
    removeChild: function(e) {
        return Zd(this, e)
    },
    appendChild: function(e) {
        return this.insertBefore(e, null)
    },
    hasChildNodes: function() {
        return this.firstChild != null
    },
    cloneNode: function(e) {
        return oh(this.ownerDocument || this, this, e)
    },
    normalize: function() {
        for (var e = this.firstChild; e;) {
            var t = e.nextSibling;
            t && t.nodeType == Yn && e.nodeType == Yn ? (this.removeChild(t), e.appendData(t.data)) : (e.normalize(), e = t)
        }
    },
    isSupported: function(e, t) {
        return this.ownerDocument.implementation.hasFeature(e, t)
    },
    hasAttributes: function() {
        return this.attributes.length > 0
    },
    lookupPrefix: function(e) {
        for (var t = this; t;) {
            var r = t._nsMap;
            if (r) {
                for (var i in r)
                    if (Object.prototype.hasOwnProperty.call(r, i) && r[i] === e) return i
            }
            t = t.nodeType == Xi ? t.ownerDocument : t.parentNode
        }
        return null
    },
    lookupNamespaceURI: function(e) {
        for (var t = this; t;) {
            var r = t._nsMap;
            if (r && Object.prototype.hasOwnProperty.call(r, e)) return r[e];
            t = t.nodeType == Xi ? t.ownerDocument : t.parentNode
        }
        return null
    },
    isDefaultNamespace: function(e) {
        var t = this.lookupPrefix(e);
        return t == null
    }
};

function Yd(e) {
    return e == "<" && "&lt;" || e == ">" && "&gt;" || e == "&" && "&amp;" || e == '"' && "&quot;" || "&#" + e.charCodeAt() + ";"
}
Bs(we, Mt);
Bs(we, Mt.prototype);

function Ss(e, t) {
    if (t(e)) return !0;
    if (e = e.firstChild)
        do
            if (Ss(e, t)) return !0; while (e = e.nextSibling)
}

function Os() {
    this.ownerDocument = this
}

function Ww(e, t, r) {
    e && e._inc++;
    var i = r.namespaceURI;
    i === Cs.XMLNS && (t._nsMap[r.prefix ? r.localName : ""] = r.value)
}

function qd(e, t, r, i) {
    e && e._inc++;
    var s = r.namespaceURI;
    s === Cs.XMLNS && delete t._nsMap[r.prefix ? r.localName : ""]
}

function Dh(e, t, r) {
    if (e && e._inc) {
        e._inc++;
        var i = t.childNodes;
        if (r) i[i.length++] = r;
        else {
            for (var s = t.firstChild, n = 0; s;) i[n++] = s, s = s.nextSibling;
            i.length = n, delete i[i.length]
        }
    }
}

function Zd(e, t) {
    var r = t.previousSibling,
        i = t.nextSibling;
    return r ? r.nextSibling = i : e.firstChild = i, i ? i.previousSibling = r : e.lastChild = r, t.parentNode = null, t.previousSibling = null, t.nextSibling = null, Dh(e.ownerDocument, e), t
}

function Yw(e) {
    return e && (e.nodeType === Mt.DOCUMENT_NODE || e.nodeType === Mt.DOCUMENT_FRAGMENT_NODE || e.nodeType === Mt.ELEMENT_NODE)
}

function qw(e) {
    return e && (ar(e) || Bh(e) || xr(e) || e.nodeType === Mt.DOCUMENT_FRAGMENT_NODE || e.nodeType === Mt.COMMENT_NODE || e.nodeType === Mt.PROCESSING_INSTRUCTION_NODE)
}

function xr(e) {
    return e && e.nodeType === Mt.DOCUMENT_TYPE_NODE
}

function ar(e) {
    return e && e.nodeType === Mt.ELEMENT_NODE
}

function Bh(e) {
    return e && e.nodeType === Mt.TEXT_NODE
}

function Mu(e, t) {
    var r = e.childNodes || [];
    if (nr(r, ar) || xr(t)) return !1;
    var i = nr(r, xr);
    return !(t && i && r.indexOf(i) > r.indexOf(t))
}

function Pu(e, t) {
    var r = e.childNodes || [];

    function i(n) {
        return ar(n) && n !== t
    }
    if (nr(r, i)) return !1;
    var s = nr(r, xr);
    return !(t && s && r.indexOf(s) > r.indexOf(t))
}

function Zw(e, t, r) {
    if (!Yw(e)) throw new qt(_e, "Unexpected parent node type " + e.nodeType);
    if (r && r.parentNode !== e) throw new qt(Xd, "child not in parent");
    if (!qw(t) || xr(t) && e.nodeType !== Mt.DOCUMENT_NODE) throw new qt(_e, "Unexpected node type " + t.nodeType + " for parent node type " + e.nodeType)
}

function Kw(e, t, r) {
    var i = e.childNodes || [],
        s = t.childNodes || [];
    if (t.nodeType === Mt.DOCUMENT_FRAGMENT_NODE) {
        var n = s.filter(ar);
        if (n.length > 1 || nr(s, Bh)) throw new qt(_e, "More than one element or text in fragment");
        if (n.length === 1 && !Mu(e, r)) throw new qt(_e, "Element in fragment can not be inserted before doctype")
    }
    if (ar(t) && !Mu(e, r)) throw new qt(_e, "Only one element can be added and only after doctype");
    if (xr(t)) {
        if (nr(i, xr)) throw new qt(_e, "Only one doctype is allowed");
        var a = nr(i, ar);
        if (r && i.indexOf(a) < i.indexOf(r)) throw new qt(_e, "Doctype can only be inserted before an element");
        if (!r && a) throw new qt(_e, "Doctype can not be appended since element is present")
    }
}

function Kd(e, t, r) {
    var i = e.childNodes || [],
        s = t.childNodes || [];
    if (t.nodeType === Mt.DOCUMENT_FRAGMENT_NODE) {
        var n = s.filter(ar);
        if (n.length > 1 || nr(s, Bh)) throw new qt(_e, "More than one element or text in fragment");
        if (n.length === 1 && !Pu(e, r)) throw new qt(_e, "Element in fragment can not be inserted before doctype")
    }
    if (ar(t) && !Pu(e, r)) throw new qt(_e, "Only one element can be added and only after doctype");
    if (xr(t)) {
        if (nr(i, function(h) {
                return xr(h) && h !== r
            })) throw new qt(_e, "Only one doctype is allowed");
        var a = nr(i, ar);
        if (r && i.indexOf(a) < i.indexOf(r)) throw new qt(_e, "Doctype can only be inserted before an element")
    }
}

function Zn(e, t, r, i) {
    Zw(e, t, r), e.nodeType === Mt.DOCUMENT_NODE && (i || Kw)(e, t, r);
    var s = t.parentNode;
    if (s && s.removeChild(t), t.nodeType === yr) {
        var n = t.firstChild;
        if (n == null) return t;
        var a = t.lastChild
    } else n = a = t;
    var o = r ? r.previousSibling : e.lastChild;
    n.previousSibling = o, a.nextSibling = r, o ? o.nextSibling = n : e.firstChild = n, r == null ? e.lastChild = a : r.previousSibling = a;
    do n.parentNode = e; while (n !== a && (n = n.nextSibling));
    return Dh(e.ownerDocument || e, e), t.nodeType == yr && (t.firstChild = t.lastChild = null), t
}

function Jw(e, t) {
    return t.parentNode && t.parentNode.removeChild(t), t.parentNode = e, t.previousSibling = e.lastChild, t.nextSibling = null, t.previousSibling ? t.previousSibling.nextSibling = t : e.firstChild = t, e.lastChild = t, Dh(e.ownerDocument, e, t), t
}
Os.prototype = {
    nodeName: "#document",
    nodeType: Vd,
    doctype: null,
    documentElement: null,
    _inc: 1,
    insertBefore: function(e, t) {
        if (e.nodeType == yr) {
            for (var r = e.firstChild; r;) {
                var i = r.nextSibling;
                this.insertBefore(r, t), r = i
            }
            return e
        }
        return Zn(this, e, t), e.ownerDocument = this, this.documentElement === null && e.nodeType === je && (this.documentElement = e), e
    },
    removeChild: function(e) {
        return this.documentElement == e && (this.documentElement = null), Zd(this, e)
    },
    replaceChild: function(e, t) {
        Zn(this, e, t, Kd), e.ownerDocument = this, t && this.removeChild(t), ar(e) && (this.documentElement = e)
    },
    importNode: function(e, t) {
        return rp(this, e, t)
    },
    getElementById: function(e) {
        var t = null;
        return Ss(this.documentElement, function(r) {
            if (r.nodeType == je && r.getAttribute("id") == e) return t = r, !0
        }), t
    },
    getElementsByClassName: function(e) {
        var t = Cu(e);
        return new ji(this, function(r) {
            var i = [];
            return t.length > 0 && Ss(r.documentElement, function(s) {
                if (s !== r && s.nodeType === je) {
                    var n = s.getAttribute("class");
                    if (n) {
                        var a = e === n;
                        if (!a) {
                            var o = Cu(n);
                            a = t.every(zw(o))
                        }
                        a && i.push(s)
                    }
                }
            }), i
        })
    },
    createElement: function(e) {
        var t = new ii;
        t.ownerDocument = this, t.nodeName = e, t.tagName = e, t.localName = e, t.childNodes = new _r;
        var r = t.attributes = new qn;
        return r._ownerElement = t, t
    },
    createDocumentFragment: function() {
        var e = new va;
        return e.ownerDocument = this, e.childNodes = new _r, e
    },
    createTextNode: function(e) {
        var t = new Oh;
        return t.ownerDocument = this, t.appendData(e), t
    },
    createComment: function(e) {
        var t = new Fh;
        return t.ownerDocument = this, t.appendData(e), t
    },
    createCDATASection: function(e) {
        var t = new kh;
        return t.ownerDocument = this, t.appendData(e), t
    },
    createProcessingInstruction: function(e, t) {
        var r = new Uh;
        return r.ownerDocument = this, r.tagName = r.target = e, r.nodeValue = r.data = t, r
    },
    createAttribute: function(e) {
        var t = new Kn;
        return t.ownerDocument = this, t.name = e, t.nodeName = e, t.localName = e, t.specified = !0, t
    },
    createEntityReference: function(e) {
        var t = new Lh;
        return t.ownerDocument = this, t.nodeName = e, t
    },
    createElementNS: function(e, t) {
        var r = new ii,
            i = t.split(":"),
            s = r.attributes = new qn;
        return r.childNodes = new _r, r.ownerDocument = this, r.nodeName = t, r.tagName = t, r.namespaceURI = e, i.length == 2 ? (r.prefix = i[0], r.localName = i[1]) : r.localName = t, s._ownerElement = r, r
    },
    createAttributeNS: function(e, t) {
        var r = new Kn,
            i = t.split(":");
        return r.ownerDocument = this, r.nodeName = t, r.name = t, r.namespaceURI = e, r.specified = !0, i.length == 2 ? (r.prefix = i[0], r.localName = i[1]) : r.localName = t, r
    }
};
be(Os, Mt);

function ii() {
    this._nsMap = {}
}
ii.prototype = {
    nodeType: je,
    hasAttribute: function(e) {
        return this.getAttributeNode(e) != null
    },
    getAttribute: function(e) {
        var t = this.getAttributeNode(e);
        return t && t.value || ""
    },
    getAttributeNode: function(e) {
        return this.attributes.getNamedItem(e)
    },
    setAttribute: function(e, t) {
        var r = this.ownerDocument.createAttribute(e);
        r.value = r.nodeValue = "" + t, this.setAttributeNode(r)
    },
    removeAttribute: function(e) {
        var t = this.getAttributeNode(e);
        t && this.removeAttributeNode(t)
    },
    appendChild: function(e) {
        return e.nodeType === yr ? this.insertBefore(e, null) : Jw(this, e)
    },
    setAttributeNode: function(e) {
        return this.attributes.setNamedItem(e)
    },
    setAttributeNodeNS: function(e) {
        return this.attributes.setNamedItemNS(e)
    },
    removeAttributeNode: function(e) {
        return this.attributes.removeNamedItem(e.nodeName)
    },
    removeAttributeNS: function(e, t) {
        var r = this.getAttributeNodeNS(e, t);
        r && this.removeAttributeNode(r)
    },
    hasAttributeNS: function(e, t) {
        return this.getAttributeNodeNS(e, t) != null
    },
    getAttributeNS: function(e, t) {
        var r = this.getAttributeNodeNS(e, t);
        return r && r.value || ""
    },
    setAttributeNS: function(e, t, r) {
        var i = this.ownerDocument.createAttributeNS(e, t);
        i.value = i.nodeValue = "" + r, this.setAttributeNode(i)
    },
    getAttributeNodeNS: function(e, t) {
        return this.attributes.getNamedItemNS(e, t)
    },
    getElementsByTagName: function(e) {
        return new ji(this, function(t) {
            var r = [];
            return Ss(t, function(i) {
                i !== t && i.nodeType == je && (e === "*" || i.tagName == e) && r.push(i)
            }), r
        })
    },
    getElementsByTagNameNS: function(e, t) {
        return new ji(this, function(r) {
            var i = [];
            return Ss(r, function(s) {
                s !== r && s.nodeType === je && (e === "*" || s.namespaceURI === e) && (t === "*" || s.localName == t) && i.push(s)
            }), i
        })
    }
};
Os.prototype.getElementsByTagName = ii.prototype.getElementsByTagName;
Os.prototype.getElementsByTagNameNS = ii.prototype.getElementsByTagNameNS;
be(ii, Mt);

function Kn() {}
Kn.prototype.nodeType = Xi;
be(Kn, Mt);

function Fs() {}
Fs.prototype = {
    data: "",
    substringData: function(e, t) {
        return this.data.substring(e, e + t)
    },
    appendData: function(e) {
        e = this.data + e, this.nodeValue = this.data = e, this.length = e.length
    },
    insertData: function(e, t) {
        this.replaceData(e, 0, t)
    },
    appendChild: function(e) {
        throw new Error(ne[_e])
    },
    deleteData: function(e, t) {
        this.replaceData(e, t, "")
    },
    replaceData: function(e, t, r) {
        var i = this.data.substring(0, e),
            s = this.data.substring(e + t);
        r = i + r + s, this.nodeValue = this.data = r, this.length = r.length
    }
};
be(Fs, Mt);

function Oh() {}
Oh.prototype = {
    nodeName: "#text",
    nodeType: Yn,
    splitText: function(e) {
        var t = this.data,
            r = t.substring(e);
        t = t.substring(0, e), this.data = this.nodeValue = t, this.length = t.length;
        var i = this.ownerDocument.createTextNode(r);
        return this.parentNode && this.parentNode.insertBefore(i, this.nextSibling), i
    }
};
be(Oh, Fs);

function Fh() {}
Fh.prototype = {
    nodeName: "#comment",
    nodeType: Hd
};
be(Fh, Fs);

function kh() {}
kh.prototype = {
    nodeName: "#cdata-section",
    nodeType: Ud
};
be(kh, Fs);

function ga() {}
ga.prototype.nodeType = zd;
be(ga, Mt);

function Jd() {}
Jd.prototype.nodeType = jw;
be(Jd, Mt);

function Qd() {}
Qd.prototype.nodeType = Xw;
be(Qd, Mt);

function Lh() {}
Lh.prototype.nodeType = Gd;
be(Lh, Mt);

function va() {}
va.prototype.nodeName = "#document-fragment";
va.prototype.nodeType = yr;
be(va, Mt);

function Uh() {}
Uh.prototype.nodeType = $d;
be(Uh, Mt);

function tp() {}
tp.prototype.serializeToString = function(e, t, r) {
    return ep.call(e, t, r)
};
Mt.prototype.toString = ep;

function ep(e, t) {
    var r = [],
        i = this.nodeType == 9 && this.documentElement || this,
        s = i.prefix,
        n = i.namespaceURI;
    if (n && s == null) {
        var s = i.lookupPrefix(n);
        if (s == null) var a = [{
            namespace: n,
            prefix: null
        }]
    }
    return Ni(this, r, e, t, a), r.join("")
}

function Nu(e, t, r) {
    var i = e.prefix || "",
        s = e.namespaceURI;
    if (!s || i === "xml" && s === Cs.XML || s === Cs.XMLNS) return !1;
    for (var n = r.length; n--;) {
        var a = r[n];
        if (a.prefix === i) return a.namespace !== s
    }
    return !0
}

function Eo(e, t, r) {
    e.push(" ", t, '="', r.replace(/[<>&"\t\n\r]/g, Yd), '"')
}

function Ni(e, t, r, i, s) {
    if (s || (s = []), i)
        if (e = i(e), e) {
            if (typeof e == "string") {
                t.push(e);
                return
            }
        } else return;
    switch (e.nodeType) {
        case je:
            var n = e.attributes,
                a = n.length,
                A = e.firstChild,
                o = e.tagName;
            r = Cs.isHTML(e.namespaceURI) || r;
            var h = o;
            if (!r && !e.prefix && e.namespaceURI) {
                for (var l, c = 0; c < n.length; c++)
                    if (n.item(c).name === "xmlns") {
                        l = n.item(c).value;
                        break
                    }
                if (!l)
                    for (var f = s.length - 1; f >= 0; f--) {
                        var p = s[f];
                        if (p.prefix === "" && p.namespace === e.namespaceURI) {
                            l = p.namespace;
                            break
                        }
                    }
                if (l !== e.namespaceURI)
                    for (var f = s.length - 1; f >= 0; f--) {
                        var p = s[f];
                        if (p.namespace === e.namespaceURI) {
                            p.prefix && (h = p.prefix + ":" + o);
                            break
                        }
                    }
            }
            t.push("<", h);
            for (var m = 0; m < a; m++) {
                var v = n.item(m);
                v.prefix == "xmlns" ? s.push({
                    prefix: v.localName,
                    namespace: v.value
                }) : v.nodeName == "xmlns" && s.push({
                    prefix: "",
                    namespace: v.value
                })
            }
            for (var m = 0; m < a; m++) {
                var v = n.item(m);
                if (Nu(v, r, s)) {
                    var _ = v.prefix || "",
                        y = v.namespaceURI;
                    Eo(t, _ ? "xmlns:" + _ : "xmlns", y), s.push({
                        prefix: _,
                        namespace: y
                    })
                }
                Ni(v, t, r, i, s)
            }
            if (o === h && Nu(e, r, s)) {
                var _ = e.prefix || "",
                    y = e.namespaceURI;
                Eo(t, _ ? "xmlns:" + _ : "xmlns", y), s.push({
                    prefix: _,
                    namespace: y
                })
            }
            if (A || r && !/^(?:meta|link|img|br|hr|input)$/i.test(o)) {
                if (t.push(">"), r && /^script$/i.test(o))
                    for (; A;) A.data ? t.push(A.data) : Ni(A, t, r, i, s.slice()), A = A.nextSibling;
                else
                    for (; A;) Ni(A, t, r, i, s.slice()), A = A.nextSibling;
                t.push("</", h, ">")
            } else t.push("/>");
            return;
        case Vd:
        case yr:
            for (var A = e.firstChild; A;) Ni(A, t, r, i, s.slice()), A = A.nextSibling;
            return;
        case Xi:
            return Eo(t, e.name, e.value);
        case Yn:
            return t.push(e.data.replace(/[<&>]/g, Yd));
        case Ud:
            return t.push("<![CDATA[", e.data, "]]>");
        case Hd:
            return t.push("<!--", e.data, "-->");
        case zd:
            var I = e.publicId,
                x = e.systemId;
            if (t.push("<!DOCTYPE ", e.name), I) t.push(" PUBLIC ", I), x && x != "." && t.push(" ", x), t.push(">");
            else if (x && x != ".") t.push(" SYSTEM ", x, ">");
            else {
                var S = e.internalSubset;
                S && t.push(" [", S, "]"), t.push(">")
            }
            return;
        case $d:
            return t.push("<?", e.target, " ", e.data, "?>");
        case Gd:
            return t.push("&", e.nodeName, ";");
        default:
            t.push("??", e.nodeName)
    }
}

function rp(e, t, r) {
    var i;
    switch (t.nodeType) {
        case je:
            i = t.cloneNode(!1), i.ownerDocument = e;
        case yr:
            break;
        case Xi:
            r = !0;
            break
    }
    if (i || (i = t.cloneNode(!1)), i.ownerDocument = e, i.parentNode = null, r)
        for (var s = t.firstChild; s;) i.appendChild(rp(e, s, r)), s = s.nextSibling;
    return i
}

function oh(e, t, r) {
    var i = new t.constructor;
    for (var s in t)
        if (Object.prototype.hasOwnProperty.call(t, s)) {
            var n = t[s];
            typeof n != "object" && n != i[s] && (i[s] = n)
        }
    switch (t.childNodes && (i.childNodes = new _r), i.ownerDocument = e, i.nodeType) {
        case je:
            var a = t.attributes,
                o = i.attributes = new qn,
                h = a.length;
            o._ownerElement = i;
            for (var l = 0; l < h; l++) i.setAttributeNode(oh(e, a.item(l), !0));
            break;
        case Xi:
            r = !0
    }
    if (r)
        for (var c = t.firstChild; c;) i.appendChild(oh(e, c, r)), c = c.nextSibling;
    return i
}

function ip(e, t, r) {
    e[t] = r
}
try {
    if (Object.defineProperty) {
        let e = function(t) {
            switch (t.nodeType) {
                case je:
                case yr:
                    var r = [];
                    for (t = t.firstChild; t;) t.nodeType !== 7 && t.nodeType !== 8 && r.push(e(t)), t = t.nextSibling;
                    return r.join("");
                default:
                    return t.nodeValue
            }
        };
        Object.defineProperty(ji.prototype, "length", {
            get: function() {
                return Nh(this), this.$$length
            }
        }), Object.defineProperty(Mt.prototype, "textContent", {
            get: function() {
                return e(this)
            },
            set: function(t) {
                switch (this.nodeType) {
                    case je:
                    case yr:
                        for (; this.firstChild;) this.removeChild(this.firstChild);
                        (t || String(t)) && this.appendChild(this.ownerDocument.createTextNode(t));
                        break;
                    default:
                        this.data = t, this.value = t, this.nodeValue = t
                }
            }
        }), ip = function(t, r, i) {
            t["$$" + r] = i
        }
    }
} catch {}
Fr.DocumentType = ga;
Fr.DOMException = qt;
Fr.DOMImplementation = Wd;
Fr.Element = ii;
Fr.Node = Mt;
Fr.NodeList = _r;
Fr.XMLSerializer = tp;
var _a = {},
    sp = {};
(function(e) {
    var t = wr.freeze;
    e.XML_ENTITIES = t({
        amp: "&",
        apos: "'",
        gt: ">",
        lt: "<",
        quot: '"'
    }), e.HTML_ENTITIES = t({
        lt: "<",
        gt: ">",
        amp: "&",
        quot: '"',
        apos: "'",
        Agrave: "À",
        Aacute: "Á",
        Acirc: "Â",
        Atilde: "Ã",
        Auml: "Ä",
        Aring: "Å",
        AElig: "Æ",
        Ccedil: "Ç",
        Egrave: "È",
        Eacute: "É",
        Ecirc: "Ê",
        Euml: "Ë",
        Igrave: "Ì",
        Iacute: "Í",
        Icirc: "Î",
        Iuml: "Ï",
        ETH: "Ð",
        Ntilde: "Ñ",
        Ograve: "Ò",
        Oacute: "Ó",
        Ocirc: "Ô",
        Otilde: "Õ",
        Ouml: "Ö",
        Oslash: "Ø",
        Ugrave: "Ù",
        Uacute: "Ú",
        Ucirc: "Û",
        Uuml: "Ü",
        Yacute: "Ý",
        THORN: "Þ",
        szlig: "ß",
        agrave: "à",
        aacute: "á",
        acirc: "â",
        atilde: "ã",
        auml: "ä",
        aring: "å",
        aelig: "æ",
        ccedil: "ç",
        egrave: "è",
        eacute: "é",
        ecirc: "ê",
        euml: "ë",
        igrave: "ì",
        iacute: "í",
        icirc: "î",
        iuml: "ï",
        eth: "ð",
        ntilde: "ñ",
        ograve: "ò",
        oacute: "ó",
        ocirc: "ô",
        otilde: "õ",
        ouml: "ö",
        oslash: "ø",
        ugrave: "ù",
        uacute: "ú",
        ucirc: "û",
        uuml: "ü",
        yacute: "ý",
        thorn: "þ",
        yuml: "ÿ",
        nbsp: " ",
        iexcl: "¡",
        cent: "¢",
        pound: "£",
        curren: "¤",
        yen: "¥",
        brvbar: "¦",
        sect: "§",
        uml: "¨",
        copy: "©",
        ordf: "ª",
        laquo: "«",
        not: "¬",
        shy: "­­",
        reg: "®",
        macr: "¯",
        deg: "°",
        plusmn: "±",
        sup2: "²",
        sup3: "³",
        acute: "´",
        micro: "µ",
        para: "¶",
        middot: "·",
        cedil: "¸",
        sup1: "¹",
        ordm: "º",
        raquo: "»",
        frac14: "¼",
        frac12: "½",
        frac34: "¾",
        iquest: "¿",
        times: "×",
        divide: "÷",
        forall: "∀",
        part: "∂",
        exist: "∃",
        empty: "∅",
        nabla: "∇",
        isin: "∈",
        notin: "∉",
        ni: "∋",
        prod: "∏",
        sum: "∑",
        minus: "−",
        lowast: "∗",
        radic: "√",
        prop: "∝",
        infin: "∞",
        ang: "∠",
        and: "∧",
        or: "∨",
        cap: "∩",
        cup: "∪",
        int: "∫",
        there4: "∴",
        sim: "∼",
        cong: "≅",
        asymp: "≈",
        ne: "≠",
        equiv: "≡",
        le: "≤",
        ge: "≥",
        sub: "⊂",
        sup: "⊃",
        nsub: "⊄",
        sube: "⊆",
        supe: "⊇",
        oplus: "⊕",
        otimes: "⊗",
        perp: "⊥",
        sdot: "⋅",
        Alpha: "Α",
        Beta: "Β",
        Gamma: "Γ",
        Delta: "Δ",
        Epsilon: "Ε",
        Zeta: "Ζ",
        Eta: "Η",
        Theta: "Θ",
        Iota: "Ι",
        Kappa: "Κ",
        Lambda: "Λ",
        Mu: "Μ",
        Nu: "Ν",
        Xi: "Ξ",
        Omicron: "Ο",
        Pi: "Π",
        Rho: "Ρ",
        Sigma: "Σ",
        Tau: "Τ",
        Upsilon: "Υ",
        Phi: "Φ",
        Chi: "Χ",
        Psi: "Ψ",
        Omega: "Ω",
        alpha: "α",
        beta: "β",
        gamma: "γ",
        delta: "δ",
        epsilon: "ε",
        zeta: "ζ",
        eta: "η",
        theta: "θ",
        iota: "ι",
        kappa: "κ",
        lambda: "λ",
        mu: "μ",
        nu: "ν",
        xi: "ξ",
        omicron: "ο",
        pi: "π",
        rho: "ρ",
        sigmaf: "ς",
        sigma: "σ",
        tau: "τ",
        upsilon: "υ",
        phi: "φ",
        chi: "χ",
        psi: "ψ",
        omega: "ω",
        thetasym: "ϑ",
        upsih: "ϒ",
        piv: "ϖ",
        OElig: "Œ",
        oelig: "œ",
        Scaron: "Š",
        scaron: "š",
        Yuml: "Ÿ",
        fnof: "ƒ",
        circ: "ˆ",
        tilde: "˜",
        ensp: " ",
        emsp: " ",
        thinsp: " ",
        zwnj: "‌",
        zwj: "‍",
        lrm: "‎",
        rlm: "‏",
        ndash: "–",
        mdash: "—",
        lsquo: "‘",
        rsquo: "’",
        sbquo: "‚",
        ldquo: "“",
        rdquo: "”",
        bdquo: "„",
        dagger: "†",
        Dagger: "‡",
        bull: "•",
        hellip: "…",
        permil: "‰",
        prime: "′",
        Prime: "″",
        lsaquo: "‹",
        rsaquo: "›",
        oline: "‾",
        euro: "€",
        trade: "™",
        larr: "←",
        uarr: "↑",
        rarr: "→",
        darr: "↓",
        harr: "↔",
        crarr: "↵",
        lceil: "⌈",
        rceil: "⌉",
        lfloor: "⌊",
        rfloor: "⌋",
        loz: "◊",
        spades: "♠",
        clubs: "♣",
        hearts: "♥",
        diams: "♦"
    }), e.entityMap = e.HTML_ENTITIES
})(sp);
var Gh = {},
    Is = wr.NAMESPACE,
    hh = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,
    Du = new RegExp("[\\-\\.0-9" + hh.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"),
    Bu = new RegExp("^" + hh.source + Du.source + "*(?::" + hh.source + Du.source + "*)?$"),
    ns = 0,
    Rr = 1,
    xi = 2,
    as = 3,
    bi = 4,
    wi = 5,
    os = 6,
    gn = 7;

function Wi(e, t) {
    this.message = e, this.locator = t, Error.captureStackTrace && Error.captureStackTrace(this, Wi)
}
Wi.prototype = new Error;
Wi.prototype.name = Wi.name;

function np() {}
np.prototype = {
    parse: function(e, t, r) {
        var i = this.domBuilder;
        i.startDocument(), ap(t, t = {}), Qw(e, t, r, i, this.errorHandler), i.endDocument()
    }
};

function Qw(e, t, r, i, s) {
    function n(H) {
        if (H > 65535) {
            H -= 65536;
            var U = 55296 + (H >> 10),
                it = 56320 + (H & 1023);
            return String.fromCharCode(U, it)
        } else return String.fromCharCode(H)
    }

    function a(H) {
        var U = H.slice(1, -1);
        return Object.hasOwnProperty.call(r, U) ? r[U] : U.charAt(0) === "#" ? n(parseInt(U.substr(1).replace("x", "0x"))) : (s.error("entity not found:" + H), H)
    }

    function o(H) {
        if (H > _) {
            var U = e.substring(_, H).replace(/&#?\w+;/g, a);
            p && h(_), i.characters(U, 0, H - _), _ = H
        }
    }

    function h(H, U) {
        for (; H >= c && (U = f.exec(e));) l = U.index, c = l + U[0].length, p.lineNumber++;
        p.columnNumber = H - l + 1
    }
    for (var l = 0, c = 0, f = /.*(?:\r\n?|\n)|.*$/g, p = i.locator, m = [{
            currentNSMap: t
        }], v = {}, _ = 0;;) {
        try {
            var y = e.indexOf("<", _);
            if (y < 0) {
                if (!e.substr(_).match(/^\s*$/)) {
                    var A = i.doc,
                        I = A.createTextNode(e.substr(_));
                    A.appendChild(I), i.currentElement = I
                }
                return
            }
            switch (y > _ && o(y), e.charAt(y + 1)) {
                case "/":
                    var E = e.indexOf(">", y + 3),
                        x = e.substring(y + 2, E).replace(/[ \t\n\r]+$/g, ""),
                        S = m.pop();
                    E < 0 ? (x = e.substring(y + 2).replace(/[\s<].*/, ""), s.error("end tag name: " + x + " is not complete:" + S.tagName), E = y + 1 + x.length) : x.match(/\s</) && (x = x.replace(/[\s<].*/, ""), s.error("end tag name: " + x + " maybe not complete"), E = y + 1 + x.length);
                    var $ = S.localNSMap,
                        k = S.tagName == x,
                        G = k || S.tagName && S.tagName.toLowerCase() == x.toLowerCase();
                    if (G) {
                        if (i.endElement(S.uri, S.localName, x), $)
                            for (var L in $) Object.prototype.hasOwnProperty.call($, L) && i.endPrefixMapping(L);
                        k || s.fatalError("end tag name: " + x + " is not match the current start tagName:" + S.tagName)
                    } else m.push(S);
                    E++;
                    break;
                case "?":
                    p && h(y), E = sE(e, y, i);
                    break;
                case "!":
                    p && h(y), E = iE(e, y, i, s);
                    break;
                default:
                    p && h(y);
                    var Y = new op,
                        et = m[m.length - 1].currentNSMap,
                        E = tE(e, y, Y, et, a, s),
                        D = Y.length;
                    if (!Y.closed && rE(e, E, Y.tagName, v) && (Y.closed = !0, r.nbsp || s.warning("unclosed xml attribute")), p && D) {
                        for (var N = Ou(p, {}), R = 0; R < D; R++) {
                            var j = Y[R];
                            h(j.offset), j.locator = Ou(p, {})
                        }
                        i.locator = N, Fu(Y, i, et) && m.push(Y), i.locator = p
                    } else Fu(Y, i, et) && m.push(Y);
                    Is.isHTML(Y.uri) && !Y.closed ? E = eE(e, E, Y.tagName, a, i) : E++
            }
        } catch (H) {
            if (H instanceof Wi) throw H;
            s.error("element parse error: " + H), E = -1
        }
        E > _ ? _ = E : o(Math.max(y, _) + 1)
    }
}

function Ou(e, t) {
    return t.lineNumber = e.lineNumber, t.columnNumber = e.columnNumber, t
}

function tE(e, t, r, i, s, n) {
    function a(p, m, v) {
        r.attributeNames.hasOwnProperty(p) && n.fatalError("Attribute " + p + " redefined"), r.addValue(p, m.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, s), v)
    }
    for (var o, h, l = ++t, c = ns;;) {
        var f = e.charAt(l);
        switch (f) {
            case "=":
                if (c === Rr) o = e.slice(t, l), c = as;
                else if (c === xi) c = as;
                else throw new Error("attribute equal must after attrName");
                break;
            case "'":
            case '"':
                if (c === as || c === Rr)
                    if (c === Rr && (n.warning('attribute value must after "="'), o = e.slice(t, l)), t = l + 1, l = e.indexOf(f, t), l > 0) h = e.slice(t, l), a(o, h, t - 1), c = wi;
                    else throw new Error("attribute value no end '" + f + "' match");
                else if (c == bi) h = e.slice(t, l), a(o, h, t), n.warning('attribute "' + o + '" missed start quot(' + f + ")!!"), t = l + 1, c = wi;
                else throw new Error('attribute value must after "="');
                break;
            case "/":
                switch (c) {
                    case ns:
                        r.setTagName(e.slice(t, l));
                    case wi:
                    case os:
                    case gn:
                        c = gn, r.closed = !0;
                    case bi:
                    case Rr:
                        break;
                    case xi:
                        r.closed = !0;
                        break;
                    default:
                        throw new Error("attribute invalid close char('/')")
                }
                break;
            case "":
                return n.error("unexpected end of input"), c == ns && r.setTagName(e.slice(t, l)), l;
            case ">":
                switch (c) {
                    case ns:
                        r.setTagName(e.slice(t, l));
                    case wi:
                    case os:
                    case gn:
                        break;
                    case bi:
                    case Rr:
                        h = e.slice(t, l), h.slice(-1) === "/" && (r.closed = !0, h = h.slice(0, -1));
                    case xi:
                        c === xi && (h = o), c == bi ? (n.warning('attribute "' + h + '" missed quot(")!'), a(o, h, t)) : ((!Is.isHTML(i[""]) || !h.match(/^(?:disabled|checked|selected)$/i)) && n.warning('attribute "' + h + '" missed value!! "' + h + '" instead!!'), a(h, h, t));
                        break;
                    case as:
                        throw new Error("attribute value missed!!")
                }
                return l;
            case "":
                f = " ";
            default:
                if (f <= " ") switch (c) {
                    case ns:
                        r.setTagName(e.slice(t, l)), c = os;
                        break;
                    case Rr:
                        o = e.slice(t, l), c = xi;
                        break;
                    case bi:
                        var h = e.slice(t, l);
                        n.warning('attribute "' + h + '" missed quot(")!!'), a(o, h, t);
                    case wi:
                        c = os;
                        break
                } else switch (c) {
                    case xi:
                        r.tagName, (!Is.isHTML(i[""]) || !o.match(/^(?:disabled|checked|selected)$/i)) && n.warning('attribute "' + o + '" missed value!! "' + o + '" instead2!!'), a(o, o, t), t = l, c = Rr;
                        break;
                    case wi:
                        n.warning('attribute space is required"' + o + '"!!');
                    case os:
                        c = Rr, t = l;
                        break;
                    case as:
                        c = bi, t = l;
                        break;
                    case gn:
                        throw new Error("elements closed character '/' and '>' must be connected to")
                }
        }
        l++
    }
}

function Fu(e, t, r) {
    for (var i = e.tagName, s = null, f = e.length; f--;) {
        var n = e[f],
            a = n.qName,
            o = n.value,
            p = a.indexOf(":");
        if (p > 0) var h = n.prefix = a.slice(0, p),
            l = a.slice(p + 1),
            c = h === "xmlns" && l;
        else l = a, h = null, c = a === "xmlns" && "";
        n.localName = l, c !== !1 && (s == null && (s = {}, ap(r, r = {})), r[c] = s[c] = o, n.uri = Is.XMLNS, t.startPrefixMapping(c, o))
    }
    for (var f = e.length; f--;) {
        n = e[f];
        var h = n.prefix;
        h && (h === "xml" && (n.uri = Is.XML), h !== "xmlns" && (n.uri = r[h || ""]))
    }
    var p = i.indexOf(":");
    p > 0 ? (h = e.prefix = i.slice(0, p), l = e.localName = i.slice(p + 1)) : (h = null, l = e.localName = i);
    var m = e.uri = r[h || ""];
    if (t.startElement(m, l, i, e), e.closed) {
        if (t.endElement(m, l, i), s)
            for (h in s) Object.prototype.hasOwnProperty.call(s, h) && t.endPrefixMapping(h)
    } else return e.currentNSMap = r, e.localNSMap = s, !0
}

function eE(e, t, r, i, s) {
    if (/^(?:script|textarea)$/i.test(r)) {
        var n = e.indexOf("</" + r + ">", t),
            a = e.substring(t + 1, n);
        if (/[&<]/.test(a)) return /^script$/i.test(r) ? (s.characters(a, 0, a.length), n) : (a = a.replace(/&#?\w+;/g, i), s.characters(a, 0, a.length), n)
    }
    return t + 1
}

function rE(e, t, r, i) {
    var s = i[r];
    return s == null && (s = e.lastIndexOf("</" + r + ">"), s < t && (s = e.lastIndexOf("</" + r)), i[r] = s), s < t
}

function ap(e, t) {
    for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r])
}

function iE(e, t, r, i) {
    var s = e.charAt(t + 2);
    switch (s) {
        case "-":
            if (e.charAt(t + 3) === "-") {
                var n = e.indexOf("-->", t + 4);
                return n > t ? (r.comment(e, t + 4, n - t - 4), n + 3) : (i.error("Unclosed comment"), -1)
            } else return -1;
        default:
            if (e.substr(t + 3, 6) == "CDATA[") {
                var n = e.indexOf("]]>", t + 9);
                return r.startCDATA(), r.characters(e, t + 9, n - t - 9), r.endCDATA(), n + 3
            }
            var a = nE(e, t),
                o = a.length;
            if (o > 1 && /!doctype/i.test(a[0][0])) {
                var h = a[1][0],
                    l = !1,
                    c = !1;
                o > 3 && (/^public$/i.test(a[2][0]) ? (l = a[3][0], c = o > 4 && a[4][0]) : /^system$/i.test(a[2][0]) && (c = a[3][0]));
                var f = a[o - 1];
                return r.startDTD(h, l, c), r.endDTD(), f.index + f[0].length
            }
    }
    return -1
}

function sE(e, t, r) {
    var i = e.indexOf("?>", t);
    if (i) {
        var s = e.substring(t, i).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
        return s ? (s[0].length, r.processingInstruction(s[1], s[2]), i + 2) : -1
    }
    return -1
}

function op() {
    this.attributeNames = {}
}
op.prototype = {
    setTagName: function(e) {
        if (!Bu.test(e)) throw new Error("invalid tagName:" + e);
        this.tagName = e
    },
    addValue: function(e, t, r) {
        if (!Bu.test(e)) throw new Error("invalid attribute:" + e);
        this.attributeNames[e] = this.length, this[this.length++] = {
            qName: e,
            value: t,
            offset: r
        }
    },
    length: 0,
    getLocalName: function(e) {
        return this[e].localName
    },
    getLocator: function(e) {
        return this[e].locator
    },
    getQName: function(e) {
        return this[e].qName
    },
    getURI: function(e) {
        return this[e].uri
    },
    getValue: function(e) {
        return this[e].value
    }
};

function nE(e, t) {
    var r, i = [],
        s = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
    for (s.lastIndex = t, s.exec(e); r = s.exec(e);)
        if (i.push(r), r[1]) return i
}
Gh.XMLReader = np;
Gh.ParseError = Wi;
var aE = wr,
    oE = Fr,
    ku = sp,
    hp = Gh,
    hE = oE.DOMImplementation,
    Lu = aE.NAMESPACE,
    lE = hp.ParseError,
    cE = hp.XMLReader;

function lp(e) {
    return e.replace(/\r[\n\u0085]/g, `
`).replace(/[\r\u0085\u2028]/g, `
`)
}

function cp(e) {
    this.options = e || {
        locator: {}
    }
}
cp.prototype.parseFromString = function(e, t) {
    var r = this.options,
        i = new cE,
        s = r.domBuilder || new ks,
        n = r.errorHandler,
        a = r.locator,
        o = r.xmlns || {},
        h = /\/x?html?$/.test(t),
        l = h ? ku.HTML_ENTITIES : ku.XML_ENTITIES;
    a && s.setDocumentLocator(a), i.errorHandler = uE(n, s, a), i.domBuilder = r.domBuilder || s, h && (o[""] = Lu.HTML), o.xml = o.xml || Lu.XML;
    var c = r.normalizeLineEndings || lp;
    return e && typeof e == "string" ? i.parse(c(e), o, l) : i.errorHandler.error("invalid doc source"), s.doc
};

function uE(e, t, r) {
    if (!e) {
        if (t instanceof ks) return t;
        e = t
    }
    var i = {},
        s = e instanceof Function;
    r = r || {};

    function n(a) {
        var o = e[a];
        !o && s && (o = e.length == 2 ? function(h) {
            e(a, h)
        } : e), i[a] = o && function(h) {
            o("[xmldom " + a + "]	" + h + lh(r))
        } || function() {}
    }
    return n("warning"), n("error"), n("fatalError"), i
}

function ks() {
    this.cdata = !1
}

function Ei(e, t) {
    t.lineNumber = e.lineNumber, t.columnNumber = e.columnNumber
}
ks.prototype = {
    startDocument: function() {
        this.doc = new hE().createDocument(null, null, null), this.locator && (this.doc.documentURI = this.locator.systemId)
    },
    startElement: function(e, t, r, i) {
        var s = this.doc,
            n = s.createElementNS(e, r || t),
            a = i.length;
        vn(this, n), this.currentElement = n, this.locator && Ei(this.locator, n);
        for (var o = 0; o < a; o++) {
            var e = i.getURI(o),
                h = i.getValue(o),
                r = i.getQName(o),
                l = s.createAttributeNS(e, r);
            this.locator && Ei(i.getLocator(o), l), l.value = l.nodeValue = h, n.setAttributeNode(l)
        }
    },
    endElement: function(e, t, r) {
        var i = this.currentElement;
        i.tagName, this.currentElement = i.parentNode
    },
    startPrefixMapping: function(e, t) {},
    endPrefixMapping: function(e) {},
    processingInstruction: function(e, t) {
        var r = this.doc.createProcessingInstruction(e, t);
        this.locator && Ei(this.locator, r), vn(this, r)
    },
    ignorableWhitespace: function(e, t, r) {},
    characters: function(e, t, r) {
        if (e = Uu.apply(this, arguments), e) {
            if (this.cdata) var i = this.doc.createCDATASection(e);
            else var i = this.doc.createTextNode(e);
            this.currentElement ? this.currentElement.appendChild(i) : /^\s*$/.test(e) && this.doc.appendChild(i), this.locator && Ei(this.locator, i)
        }
    },
    skippedEntity: function(e) {},
    endDocument: function() {
        this.doc.normalize()
    },
    setDocumentLocator: function(e) {
        (this.locator = e) && (e.lineNumber = 0)
    },
    comment: function(e, t, r) {
        e = Uu.apply(this, arguments);
        var i = this.doc.createComment(e);
        this.locator && Ei(this.locator, i), vn(this, i)
    },
    startCDATA: function() {
        this.cdata = !0
    },
    endCDATA: function() {
        this.cdata = !1
    },
    startDTD: function(e, t, r) {
        var i = this.doc.implementation;
        if (i && i.createDocumentType) {
            var s = i.createDocumentType(e, t, r);
            this.locator && Ei(this.locator, s), vn(this, s), this.doc.doctype = s
        }
    },
    warning: function(e) {
        console.warn("[xmldom warning]	" + e, lh(this.locator))
    },
    error: function(e) {
        console.error("[xmldom error]	" + e, lh(this.locator))
    },
    fatalError: function(e) {
        throw new lE(e, this.locator)
    }
};

function lh(e) {
    if (e) return `
@` + (e.systemId || "") + "#[line:" + e.lineNumber + ",col:" + e.columnNumber + "]"
}

function Uu(e, t, r) {
    return typeof e == "string" ? e.substr(t, r) : e.length >= t + r || t ? new java.lang.String(e, t, r) + "" : e
}
"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(e) {
    ks.prototype[e] = function() {
        return null
    }
});

function vn(e, t) {
    e.currentElement ? e.currentElement.appendChild(t) : e.doc.appendChild(t)
}
_a.__DOMHandler = ks;
_a.normalizeLineEndings = lp;
_a.DOMParser = cp;
var fE = _a.DOMParser;
const dE = {
    createCanvas: (e, t) => new OffscreenCanvas(e??0, t??0),
    getCanvasRenderingContext2D: () => OffscreenCanvasRenderingContext2D,
    getWebGLRenderingContext: () => WebGLRenderingContext,
    getNavigator: () => navigator,
    getBaseUrl: () => globalThis.location.href,
    getFontFaceSet: () => globalThis.fonts,
    fetch: (e, t) => fetch(e, t),
    parseXML: e => new fE().parseFromString(e, "text/xml")
};
K.ADAPTER = dE;
var ch = {},
    pE = {
        get exports() {
            return ch
        },
        set exports(e) {
            ch = e
        }
    };
/**
 * chroma.js - JavaScript library for color conversions
 *
 * Copyright (c) 2011-2019, Gregor Aisch
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. The name Gregor Aisch may not be used to endorse or promote products
 * derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * -------------------------------------------------------
 *
 * chroma.js includes colors from colorbrewer2.org, which are released under
 * the following license:
 *
 * Copyright (c) 2002 Cynthia Brewer, Mark Harrower,
 * and The Pennsylvania State University.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific
 * language governing permissions and limitations under the License.
 *
 * ------------------------------------------------------
 *
 * Named colors are taken from X11 Color Names.
 * http://www.w3.org/TR/css3-color/#svg-color
 *
 * @preserve
 */
(function(e, t) {
    (function(r, i) {
        e.exports = i()
    })(wn, function() {
        for (var r = function(u, d, g) {
                return d === void 0 && (d = 0), g === void 0 && (g = 1), u < d ? d : u > g ? g : u
            }, i = r, s = function(u) {
                u._clipped = !1, u._unclipped = u.slice(0);
                for (var d = 0; d <= 3; d++) d < 3 ? ((u[d] < 0 || u[d] > 255) && (u._clipped = !0), u[d] = i(u[d], 0, 255)) : d === 3 && (u[d] = i(u[d], 0, 1));
                return u
            }, n = {}, a = 0, o = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Undefined", "Null"]; a < o.length; a += 1) {
            var h = o[a];
            n["[object " + h + "]"] = h.toLowerCase()
        }
        var l = function(u) {
                return n[Object.prototype.toString.call(u)] || "object"
            },
            c = l,
            f = function(u, d) {
                return d === void 0 && (d = null), u.length >= 3 ? Array.prototype.slice.call(u) : c(u[0]) == "object" && d ? d.split("").filter(function(g) {
                    return u[0][g] !== void 0
                }).map(function(g) {
                    return u[0][g]
                }) : u[0]
            },
            p = l,
            m = function(u) {
                if (u.length < 2) return null;
                var d = u.length - 1;
                return p(u[d]) == "string" ? u[d].toLowerCase() : null
            },
            v = Math.PI,
            _ = {
                clip_rgb: s,
                limit: r,
                type: l,
                unpack: f,
                last: m,
                PI: v,
                TWOPI: v * 2,
                PITHIRD: v / 3,
                DEG2RAD: v / 180,
                RAD2DEG: 180 / v
            },
            y = {
                format: {},
                autodetect: []
            },
            A = _.last,
            I = _.clip_rgb,
            x = _.type,
            S = y,
            $ = function() {
                for (var d = [], g = arguments.length; g--;) d[g] = arguments[g];
                var b = this;
                if (x(d[0]) === "object" && d[0].constructor && d[0].constructor === this.constructor) return d[0];
                var T = A(d),
                    C = !1;
                if (!T) {
                    C = !0, S.sorted || (S.autodetect = S.autodetect.sort(function(V, q) {
                        return q.p - V.p
                    }), S.sorted = !0);
                    for (var w = 0, M = S.autodetect; w < M.length; w += 1) {
                        var P = M[w];
                        if (T = P.test.apply(P, d), T) break
                    }
                }
                if (S.format[T]) {
                    var F = S.format[T].apply(null, C ? d : d.slice(0, -1));
                    b._rgb = I(F)
                } else throw new Error("unknown format: " + d);
                b._rgb.length === 3 && b._rgb.push(1)
            };
        $.prototype.toString = function() {
            return x(this.hex) == "function" ? this.hex() : "[" + this._rgb.join(",") + "]"
        };
        var k = $,
            G = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                return new(Function.prototype.bind.apply(G.Color, [null].concat(u)))
            };
        G.Color = k, G.version = "2.4.2";
        var L = G,
            Y = _.unpack,
            et = Math.max,
            E = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Y(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2];
                b = b / 255, T = T / 255, C = C / 255;
                var w = 1 - et(b, et(T, C)),
                    M = w < 1 ? 1 / (1 - w) : 0,
                    P = (1 - b - w) * M,
                    F = (1 - T - w) * M,
                    V = (1 - C - w) * M;
                return [P, F, V, w]
            },
            D = E,
            N = _.unpack,
            R = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = N(u, "cmyk");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C = u[3],
                    w = u.length > 4 ? u[4] : 1;
                return C === 1 ? [0, 0, 0, w] : [g >= 1 ? 0 : 255 * (1 - g) * (1 - C), b >= 1 ? 0 : 255 * (1 - b) * (1 - C), T >= 1 ? 0 : 255 * (1 - T) * (1 - C), w]
            },
            j = R,
            H = L,
            U = k,
            it = y,
            at = _.unpack,
            O = _.type,
            Z = D;
        U.prototype.cmyk = function() {
            return Z(this._rgb)
        }, H.cmyk = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(U, [null].concat(u, ["cmyk"])))
        }, it.format.cmyk = j, it.autodetect.push({
            p: 2,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = at(u, "cmyk"), O(u) === "array" && u.length === 4) return "cmyk"
            }
        });
        var ut = _.unpack,
            ft = _.last,
            dt = function(u) {
                return Math.round(u * 100) / 100
            },
            Nt = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = ut(u, "hsla"),
                    b = ft(u) || "lsa";
                return g[0] = dt(g[0] || 0), g[1] = dt(g[1] * 100) + "%", g[2] = dt(g[2] * 100) + "%", b === "hsla" || g.length > 3 && g[3] < 1 ? (g[3] = g.length > 3 ? g[3] : 1, b = "hsla") : g.length = 3, b + "(" + g.join(",") + ")"
            },
            xt = Nt,
            Dt = _.unpack,
            Ft = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = Dt(u, "rgba");
                var g = u[0],
                    b = u[1],
                    T = u[2];
                g /= 255, b /= 255, T /= 255;
                var C = Math.min(g, b, T),
                    w = Math.max(g, b, T),
                    M = (w + C) / 2,
                    P, F;
                return w === C ? (P = 0, F = Number.NaN) : P = M < .5 ? (w - C) / (w + C) : (w - C) / (2 - w - C), g == w ? F = (b - T) / (w - C) : b == w ? F = 2 + (T - g) / (w - C) : T == w && (F = 4 + (g - b) / (w - C)), F *= 60, F < 0 && (F += 360), u.length > 3 && u[3] !== void 0 ? [F, P, M, u[3]] : [F, P, M]
            },
            zt = Ft,
            Ut = _.unpack,
            Pt = _.last,
            Xt = xt,
            jt = zt,
            pe = Math.round,
            Ce = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Ut(u, "rgba"),
                    b = Pt(u) || "rgb";
                return b.substr(0, 3) == "hsl" ? Xt(jt(g), b) : (g[0] = pe(g[0]), g[1] = pe(g[1]), g[2] = pe(g[2]), (b === "rgba" || g.length > 3 && g[3] < 1) && (g[3] = g.length > 3 ? g[3] : 1, b = "rgba"), b + "(" + g.slice(0, b === "rgb" ? 3 : 4).join(",") + ")")
            },
            kr = Ce,
            xa = _.unpack,
            Er = Math.round,
            fp = function() {
                for (var u, d = [], g = arguments.length; g--;) d[g] = arguments[g];
                d = xa(d, "hsl");
                var b = d[0],
                    T = d[1],
                    C = d[2],
                    w, M, P;
                if (T === 0) w = M = P = C * 255;
                else {
                    var F = [0, 0, 0],
                        V = [0, 0, 0],
                        q = C < .5 ? C * (1 + T) : C + T - C * T,
                        z = 2 * C - q,
                        tt = b / 360;
                    F[0] = tt + 1 / 3, F[1] = tt, F[2] = tt - 1 / 3;
                    for (var Q = 0; Q < 3; Q++) F[Q] < 0 && (F[Q] += 1), F[Q] > 1 && (F[Q] -= 1), 6 * F[Q] < 1 ? V[Q] = z + (q - z) * 6 * F[Q] : 2 * F[Q] < 1 ? V[Q] = q : 3 * F[Q] < 2 ? V[Q] = z + (q - z) * (2 / 3 - F[Q]) * 6 : V[Q] = z;
                    u = [Er(V[0] * 255), Er(V[1] * 255), Er(V[2] * 255)], w = u[0], M = u[1], P = u[2]
                }
                return d.length > 3 ? [w, M, P, d[3]] : [w, M, P, 1]
            },
            $h = fp,
            Hh = $h,
            Vh = y,
            zh = /^rgb\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/,
            Xh = /^rgba\(\s*(-?\d+),\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([01]|[01]?\.\d+)\)$/,
            jh = /^rgb\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/,
            Wh = /^rgba\(\s*(-?\d+(?:\.\d+)?)%,\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/,
            Yh = /^hsl\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*\)$/,
            qh = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/,
            Zh = Math.round,
            Kh = function(u) {
                u = u.toLowerCase().trim();
                var d;
                if (Vh.format.named) try {
                    return Vh.format.named(u)
                } catch {}
                if (d = u.match(zh)) {
                    for (var g = d.slice(1, 4), b = 0; b < 3; b++) g[b] = +g[b];
                    return g[3] = 1, g
                }
                if (d = u.match(Xh)) {
                    for (var T = d.slice(1, 5), C = 0; C < 4; C++) T[C] = +T[C];
                    return T
                }
                if (d = u.match(jh)) {
                    for (var w = d.slice(1, 4), M = 0; M < 3; M++) w[M] = Zh(w[M] * 2.55);
                    return w[3] = 1, w
                }
                if (d = u.match(Wh)) {
                    for (var P = d.slice(1, 5), F = 0; F < 3; F++) P[F] = Zh(P[F] * 2.55);
                    return P[3] = +P[3], P
                }
                if (d = u.match(Yh)) {
                    var V = d.slice(1, 4);
                    V[1] *= .01, V[2] *= .01;
                    var q = Hh(V);
                    return q[3] = 1, q
                }
                if (d = u.match(qh)) {
                    var z = d.slice(1, 4);
                    z[1] *= .01, z[2] *= .01;
                    var tt = Hh(z);
                    return tt[3] = +d[4], tt
                }
            };
        Kh.test = function(u) {
            return zh.test(u) || Xh.test(u) || jh.test(u) || Wh.test(u) || Yh.test(u) || qh.test(u)
        };
        var dp = Kh,
            pp = L,
            Jh = k,
            Qh = y,
            mp = _.type,
            gp = kr,
            tl = dp;
        Jh.prototype.css = function(u) {
            return gp(this._rgb, u)
        }, pp.css = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Jh, [null].concat(u, ["css"])))
        }, Qh.format.css = tl, Qh.autodetect.push({
            p: 5,
            test: function(u) {
                for (var d = [], g = arguments.length - 1; g-- > 0;) d[g] = arguments[g + 1];
                if (!d.length && mp(u) === "string" && tl.test(u)) return "css"
            }
        });
        var el = k,
            vp = L,
            _p = y,
            yp = _.unpack;
        _p.format.gl = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            var g = yp(u, "rgba");
            return g[0] *= 255, g[1] *= 255, g[2] *= 255, g
        }, vp.gl = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(el, [null].concat(u, ["gl"])))
        }, el.prototype.gl = function() {
            var u = this._rgb;
            return [u[0] / 255, u[1] / 255, u[2] / 255, u[3]]
        };
        var xp = _.unpack,
            bp = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = xp(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = Math.min(b, T, C),
                    M = Math.max(b, T, C),
                    P = M - w,
                    F = P * 100 / 255,
                    V = w / (255 - P) * 100,
                    q;
                return P === 0 ? q = Number.NaN : (b === M && (q = (T - C) / P), T === M && (q = 2 + (C - b) / P), C === M && (q = 4 + (b - T) / P), q *= 60, q < 0 && (q += 360)), [q, F, V]
            },
            wp = bp,
            Ep = _.unpack,
            Tp = Math.floor,
            Ap = function() {
                for (var u, d, g, b, T, C, w = [], M = arguments.length; M--;) w[M] = arguments[M];
                w = Ep(w, "hcg");
                var P = w[0],
                    F = w[1],
                    V = w[2],
                    q, z, tt;
                V = V * 255;
                var Q = F * 255;
                if (F === 0) q = z = tt = V;
                else {
                    P === 360 && (P = 0), P > 360 && (P -= 360), P < 0 && (P += 360), P /= 60;
                    var pt = Tp(P),
                        vt = P - pt,
                        bt = V * (1 - F),
                        Tt = bt + Q * (1 - vt),
                        ae = bt + Q * vt,
                        re = bt + Q;
                    switch (pt) {
                        case 0:
                            u = [re, ae, bt], q = u[0], z = u[1], tt = u[2];
                            break;
                        case 1:
                            d = [Tt, re, bt], q = d[0], z = d[1], tt = d[2];
                            break;
                        case 2:
                            g = [bt, re, ae], q = g[0], z = g[1], tt = g[2];
                            break;
                        case 3:
                            b = [bt, Tt, re], q = b[0], z = b[1], tt = b[2];
                            break;
                        case 4:
                            T = [ae, bt, re], q = T[0], z = T[1], tt = T[2];
                            break;
                        case 5:
                            C = [re, bt, Tt], q = C[0], z = C[1], tt = C[2];
                            break
                    }
                }
                return [q, z, tt, w.length > 3 ? w[3] : 1]
            },
            Cp = Ap,
            Sp = _.unpack,
            Ip = _.type,
            Rp = L,
            rl = k,
            il = y,
            Mp = wp;
        rl.prototype.hcg = function() {
            return Mp(this._rgb)
        }, Rp.hcg = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(rl, [null].concat(u, ["hcg"])))
        }, il.format.hcg = Cp, il.autodetect.push({
            p: 1,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = Sp(u, "hcg"), Ip(u) === "array" && u.length === 3) return "hcg"
            }
        });
        var Pp = _.unpack,
            Np = _.last,
            Ls = Math.round,
            Dp = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Pp(u, "rgba"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = g[3],
                    M = Np(u) || "auto";
                w === void 0 && (w = 1), M === "auto" && (M = w < 1 ? "rgba" : "rgb"), b = Ls(b), T = Ls(T), C = Ls(C);
                var P = b << 16 | T << 8 | C,
                    F = "000000" + P.toString(16);
                F = F.substr(F.length - 6);
                var V = "0" + Ls(w * 255).toString(16);
                switch (V = V.substr(V.length - 2), M.toLowerCase()) {
                    case "rgba":
                        return "#" + F + V;
                    case "argb":
                        return "#" + V + F;
                    default:
                        return "#" + F
                }
            },
            sl = Dp,
            Bp = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            Op = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/,
            Fp = function(u) {
                if (u.match(Bp)) {
                    (u.length === 4 || u.length === 7) && (u = u.substr(1)), u.length === 3 && (u = u.split(""), u = u[0] + u[0] + u[1] + u[1] + u[2] + u[2]);
                    var d = parseInt(u, 16),
                        g = d >> 16,
                        b = d >> 8 & 255,
                        T = d & 255;
                    return [g, b, T, 1]
                }
                if (u.match(Op)) {
                    (u.length === 5 || u.length === 9) && (u = u.substr(1)), u.length === 4 && (u = u.split(""), u = u[0] + u[0] + u[1] + u[1] + u[2] + u[2] + u[3] + u[3]);
                    var C = parseInt(u, 16),
                        w = C >> 24 & 255,
                        M = C >> 16 & 255,
                        P = C >> 8 & 255,
                        F = Math.round((C & 255) / 255 * 100) / 100;
                    return [w, M, P, F]
                }
                throw new Error("unknown hex color: " + u)
            },
            nl = Fp,
            kp = L,
            al = k,
            Lp = _.type,
            ol = y,
            Up = sl;
        al.prototype.hex = function(u) {
            return Up(this._rgb, u)
        }, kp.hex = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(al, [null].concat(u, ["hex"])))
        }, ol.format.hex = nl, ol.autodetect.push({
            p: 4,
            test: function(u) {
                for (var d = [], g = arguments.length - 1; g-- > 0;) d[g] = arguments[g + 1];
                if (!d.length && Lp(u) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(u.length) >= 0) return "hex"
            }
        });
        var Gp = _.unpack,
            hl = _.TWOPI,
            $p = Math.min,
            Hp = Math.sqrt,
            Vp = Math.acos,
            zp = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Gp(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2];
                b /= 255, T /= 255, C /= 255;
                var w, M = $p(b, T, C),
                    P = (b + T + C) / 3,
                    F = P > 0 ? 1 - M / P : 0;
                return F === 0 ? w = NaN : (w = (b - T + (b - C)) / 2, w /= Hp((b - T) * (b - T) + (b - C) * (T - C)), w = Vp(w), C > T && (w = hl - w), w /= hl), [w * 360, F, P]
            },
            Xp = zp,
            jp = _.unpack,
            ba = _.limit,
            oi = _.TWOPI,
            wa = _.PITHIRD,
            hi = Math.cos,
            Wp = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = jp(u, "hsi");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C, w, M;
                return isNaN(g) && (g = 0), isNaN(b) && (b = 0), g > 360 && (g -= 360), g < 0 && (g += 360), g /= 360, g < 1 / 3 ? (M = (1 - b) / 3, C = (1 + b * hi(oi * g) / hi(wa - oi * g)) / 3, w = 1 - (M + C)) : g < 2 / 3 ? (g -= 1 / 3, C = (1 - b) / 3, w = (1 + b * hi(oi * g) / hi(wa - oi * g)) / 3, M = 1 - (C + w)) : (g -= 2 / 3, w = (1 - b) / 3, M = (1 + b * hi(oi * g) / hi(wa - oi * g)) / 3, C = 1 - (w + M)), C = ba(T * C * 3), w = ba(T * w * 3), M = ba(T * M * 3), [C * 255, w * 255, M * 255, u.length > 3 ? u[3] : 1]
            },
            Yp = Wp,
            qp = _.unpack,
            Zp = _.type,
            Kp = L,
            ll = k,
            cl = y,
            Jp = Xp;
        ll.prototype.hsi = function() {
            return Jp(this._rgb)
        }, Kp.hsi = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(ll, [null].concat(u, ["hsi"])))
        }, cl.format.hsi = Yp, cl.autodetect.push({
            p: 2,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = qp(u, "hsi"), Zp(u) === "array" && u.length === 3) return "hsi"
            }
        });
        var Qp = _.unpack,
            tm = _.type,
            em = L,
            ul = k,
            fl = y,
            rm = zt;
        ul.prototype.hsl = function() {
            return rm(this._rgb)
        }, em.hsl = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(ul, [null].concat(u, ["hsl"])))
        }, fl.format.hsl = $h, fl.autodetect.push({
            p: 2,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = Qp(u, "hsl"), tm(u) === "array" && u.length === 3) return "hsl"
            }
        });
        var im = _.unpack,
            sm = Math.min,
            nm = Math.max,
            am = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = im(u, "rgb");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C = sm(g, b, T),
                    w = nm(g, b, T),
                    M = w - C,
                    P, F, V;
                return V = w / 255, w === 0 ? (P = Number.NaN, F = 0) : (F = M / w, g === w && (P = (b - T) / M), b === w && (P = 2 + (T - g) / M), T === w && (P = 4 + (g - b) / M), P *= 60, P < 0 && (P += 360)), [P, F, V]
            },
            om = am,
            hm = _.unpack,
            lm = Math.floor,
            cm = function() {
                for (var u, d, g, b, T, C, w = [], M = arguments.length; M--;) w[M] = arguments[M];
                w = hm(w, "hsv");
                var P = w[0],
                    F = w[1],
                    V = w[2],
                    q, z, tt;
                if (V *= 255, F === 0) q = z = tt = V;
                else {
                    P === 360 && (P = 0), P > 360 && (P -= 360), P < 0 && (P += 360), P /= 60;
                    var Q = lm(P),
                        pt = P - Q,
                        vt = V * (1 - F),
                        bt = V * (1 - F * pt),
                        Tt = V * (1 - F * (1 - pt));
                    switch (Q) {
                        case 0:
                            u = [V, Tt, vt], q = u[0], z = u[1], tt = u[2];
                            break;
                        case 1:
                            d = [bt, V, vt], q = d[0], z = d[1], tt = d[2];
                            break;
                        case 2:
                            g = [vt, V, Tt], q = g[0], z = g[1], tt = g[2];
                            break;
                        case 3:
                            b = [vt, bt, V], q = b[0], z = b[1], tt = b[2];
                            break;
                        case 4:
                            T = [Tt, vt, V], q = T[0], z = T[1], tt = T[2];
                            break;
                        case 5:
                            C = [V, vt, bt], q = C[0], z = C[1], tt = C[2];
                            break
                    }
                }
                return [q, z, tt, w.length > 3 ? w[3] : 1]
            },
            um = cm,
            fm = _.unpack,
            dm = _.type,
            pm = L,
            dl = k,
            pl = y,
            mm = om;
        dl.prototype.hsv = function() {
            return mm(this._rgb)
        }, pm.hsv = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(dl, [null].concat(u, ["hsv"])))
        }, pl.format.hsv = um, pl.autodetect.push({
            p: 2,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = fm(u, "hsv"), dm(u) === "array" && u.length === 3) return "hsv"
            }
        });
        var Us = {
                Kn: 18,
                Xn: .95047,
                Yn: 1,
                Zn: 1.08883,
                t0: .137931034,
                t1: .206896552,
                t2: .12841855,
                t3: .008856452
            },
            li = Us,
            gm = _.unpack,
            ml = Math.pow,
            vm = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = gm(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = _m(b, T, C),
                    M = w[0],
                    P = w[1],
                    F = w[2],
                    V = 116 * P - 16;
                return [V < 0 ? 0 : V, 500 * (M - P), 200 * (P - F)]
            },
            Ea = function(u) {
                return (u /= 255) <= .04045 ? u / 12.92 : ml((u + .055) / 1.055, 2.4)
            },
            Ta = function(u) {
                return u > li.t3 ? ml(u, 1 / 3) : u / li.t2 + li.t0
            },
            _m = function(u, d, g) {
                u = Ea(u), d = Ea(d), g = Ea(g);
                var b = Ta((.4124564 * u + .3575761 * d + .1804375 * g) / li.Xn),
                    T = Ta((.2126729 * u + .7151522 * d + .072175 * g) / li.Yn),
                    C = Ta((.0193339 * u + .119192 * d + .9503041 * g) / li.Zn);
                return [b, T, C]
            },
            gl = vm,
            ci = Us,
            ym = _.unpack,
            xm = Math.pow,
            bm = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = ym(u, "lab");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C, w, M, P, F, V;
                return w = (g + 16) / 116, C = isNaN(b) ? w : w + b / 500, M = isNaN(T) ? w : w - T / 200, w = ci.Yn * Ca(w), C = ci.Xn * Ca(C), M = ci.Zn * Ca(M), P = Aa(3.2404542 * C - 1.5371385 * w - .4985314 * M), F = Aa(-.969266 * C + 1.8760108 * w + .041556 * M), V = Aa(.0556434 * C - .2040259 * w + 1.0572252 * M), [P, F, V, u.length > 3 ? u[3] : 1]
            },
            Aa = function(u) {
                return 255 * (u <= .00304 ? 12.92 * u : 1.055 * xm(u, 1 / 2.4) - .055)
            },
            Ca = function(u) {
                return u > ci.t1 ? u * u * u : ci.t2 * (u - ci.t0)
            },
            vl = bm,
            wm = _.unpack,
            Em = _.type,
            Tm = L,
            _l = k,
            yl = y,
            Am = gl;
        _l.prototype.lab = function() {
            return Am(this._rgb)
        }, Tm.lab = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(_l, [null].concat(u, ["lab"])))
        }, yl.format.lab = vl, yl.autodetect.push({
            p: 2,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = wm(u, "lab"), Em(u) === "array" && u.length === 3) return "lab"
            }
        });
        var Cm = _.unpack,
            Sm = _.RAD2DEG,
            Im = Math.sqrt,
            Rm = Math.atan2,
            Mm = Math.round,
            Pm = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Cm(u, "lab"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = Im(T * T + C * C),
                    M = (Rm(C, T) * Sm + 360) % 360;
                return Mm(w * 1e4) === 0 && (M = Number.NaN), [b, w, M]
            },
            xl = Pm,
            Nm = _.unpack,
            Dm = gl,
            Bm = xl,
            Om = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Nm(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = Dm(b, T, C),
                    M = w[0],
                    P = w[1],
                    F = w[2];
                return Bm(M, P, F)
            },
            Fm = Om,
            km = _.unpack,
            Lm = _.DEG2RAD,
            Um = Math.sin,
            Gm = Math.cos,
            $m = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = km(u, "lch"),
                    b = g[0],
                    T = g[1],
                    C = g[2];
                return isNaN(C) && (C = 0), C = C * Lm, [b, Gm(C) * T, Um(C) * T]
            },
            bl = $m,
            Hm = _.unpack,
            Vm = bl,
            zm = vl,
            Xm = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = Hm(u, "lch");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C = Vm(g, b, T),
                    w = C[0],
                    M = C[1],
                    P = C[2],
                    F = zm(w, M, P),
                    V = F[0],
                    q = F[1],
                    z = F[2];
                return [V, q, z, u.length > 3 ? u[3] : 1]
            },
            wl = Xm,
            jm = _.unpack,
            Wm = wl,
            Ym = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = jm(u, "hcl").reverse();
                return Wm.apply(void 0, g)
            },
            qm = Ym,
            Zm = _.unpack,
            Km = _.type,
            El = L,
            Gs = k,
            Sa = y,
            Tl = Fm;
        Gs.prototype.lch = function() {
            return Tl(this._rgb)
        }, Gs.prototype.hcl = function() {
            return Tl(this._rgb).reverse()
        }, El.lch = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Gs, [null].concat(u, ["lch"])))
        }, El.hcl = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Gs, [null].concat(u, ["hcl"])))
        }, Sa.format.lch = wl, Sa.format.hcl = qm, ["lch", "hcl"].forEach(function(u) {
            return Sa.autodetect.push({
                p: 2,
                test: function() {
                    for (var d = [], g = arguments.length; g--;) d[g] = arguments[g];
                    if (d = Zm(d, u), Km(d) === "array" && d.length === 3) return u
                }
            })
        });
        var Jm = {
                aliceblue: "#f0f8ff",
                antiquewhite: "#faebd7",
                aqua: "#00ffff",
                aquamarine: "#7fffd4",
                azure: "#f0ffff",
                beige: "#f5f5dc",
                bisque: "#ffe4c4",
                black: "#000000",
                blanchedalmond: "#ffebcd",
                blue: "#0000ff",
                blueviolet: "#8a2be2",
                brown: "#a52a2a",
                burlywood: "#deb887",
                cadetblue: "#5f9ea0",
                chartreuse: "#7fff00",
                chocolate: "#d2691e",
                coral: "#ff7f50",
                cornflower: "#6495ed",
                cornflowerblue: "#6495ed",
                cornsilk: "#fff8dc",
                crimson: "#dc143c",
                cyan: "#00ffff",
                darkblue: "#00008b",
                darkcyan: "#008b8b",
                darkgoldenrod: "#b8860b",
                darkgray: "#a9a9a9",
                darkgreen: "#006400",
                darkgrey: "#a9a9a9",
                darkkhaki: "#bdb76b",
                darkmagenta: "#8b008b",
                darkolivegreen: "#556b2f",
                darkorange: "#ff8c00",
                darkorchid: "#9932cc",
                darkred: "#8b0000",
                darksalmon: "#e9967a",
                darkseagreen: "#8fbc8f",
                darkslateblue: "#483d8b",
                darkslategray: "#2f4f4f",
                darkslategrey: "#2f4f4f",
                darkturquoise: "#00ced1",
                darkviolet: "#9400d3",
                deeppink: "#ff1493",
                deepskyblue: "#00bfff",
                dimgray: "#696969",
                dimgrey: "#696969",
                dodgerblue: "#1e90ff",
                firebrick: "#b22222",
                floralwhite: "#fffaf0",
                forestgreen: "#228b22",
                fuchsia: "#ff00ff",
                gainsboro: "#dcdcdc",
                ghostwhite: "#f8f8ff",
                gold: "#ffd700",
                goldenrod: "#daa520",
                gray: "#808080",
                green: "#008000",
                greenyellow: "#adff2f",
                grey: "#808080",
                honeydew: "#f0fff0",
                hotpink: "#ff69b4",
                indianred: "#cd5c5c",
                indigo: "#4b0082",
                ivory: "#fffff0",
                khaki: "#f0e68c",
                laserlemon: "#ffff54",
                lavender: "#e6e6fa",
                lavenderblush: "#fff0f5",
                lawngreen: "#7cfc00",
                lemonchiffon: "#fffacd",
                lightblue: "#add8e6",
                lightcoral: "#f08080",
                lightcyan: "#e0ffff",
                lightgoldenrod: "#fafad2",
                lightgoldenrodyellow: "#fafad2",
                lightgray: "#d3d3d3",
                lightgreen: "#90ee90",
                lightgrey: "#d3d3d3",
                lightpink: "#ffb6c1",
                lightsalmon: "#ffa07a",
                lightseagreen: "#20b2aa",
                lightskyblue: "#87cefa",
                lightslategray: "#778899",
                lightslategrey: "#778899",
                lightsteelblue: "#b0c4de",
                lightyellow: "#ffffe0",
                lime: "#00ff00",
                limegreen: "#32cd32",
                linen: "#faf0e6",
                magenta: "#ff00ff",
                maroon: "#800000",
                maroon2: "#7f0000",
                maroon3: "#b03060",
                mediumaquamarine: "#66cdaa",
                mediumblue: "#0000cd",
                mediumorchid: "#ba55d3",
                mediumpurple: "#9370db",
                mediumseagreen: "#3cb371",
                mediumslateblue: "#7b68ee",
                mediumspringgreen: "#00fa9a",
                mediumturquoise: "#48d1cc",
                mediumvioletred: "#c71585",
                midnightblue: "#191970",
                mintcream: "#f5fffa",
                mistyrose: "#ffe4e1",
                moccasin: "#ffe4b5",
                navajowhite: "#ffdead",
                navy: "#000080",
                oldlace: "#fdf5e6",
                olive: "#808000",
                olivedrab: "#6b8e23",
                orange: "#ffa500",
                orangered: "#ff4500",
                orchid: "#da70d6",
                palegoldenrod: "#eee8aa",
                palegreen: "#98fb98",
                paleturquoise: "#afeeee",
                palevioletred: "#db7093",
                papayawhip: "#ffefd5",
                peachpuff: "#ffdab9",
                peru: "#cd853f",
                pink: "#ffc0cb",
                plum: "#dda0dd",
                powderblue: "#b0e0e6",
                purple: "#800080",
                purple2: "#7f007f",
                purple3: "#a020f0",
                rebeccapurple: "#663399",
                red: "#ff0000",
                rosybrown: "#bc8f8f",
                royalblue: "#4169e1",
                saddlebrown: "#8b4513",
                salmon: "#fa8072",
                sandybrown: "#f4a460",
                seagreen: "#2e8b57",
                seashell: "#fff5ee",
                sienna: "#a0522d",
                silver: "#c0c0c0",
                skyblue: "#87ceeb",
                slateblue: "#6a5acd",
                slategray: "#708090",
                slategrey: "#708090",
                snow: "#fffafa",
                springgreen: "#00ff7f",
                steelblue: "#4682b4",
                tan: "#d2b48c",
                teal: "#008080",
                thistle: "#d8bfd8",
                tomato: "#ff6347",
                turquoise: "#40e0d0",
                violet: "#ee82ee",
                wheat: "#f5deb3",
                white: "#ffffff",
                whitesmoke: "#f5f5f5",
                yellow: "#ffff00",
                yellowgreen: "#9acd32"
            },
            Al = Jm,
            Qm = k,
            Cl = y,
            tg = _.type,
            Zi = Al,
            eg = nl,
            rg = sl;
        Qm.prototype.name = function() {
            for (var u = rg(this._rgb, "rgb"), d = 0, g = Object.keys(Zi); d < g.length; d += 1) {
                var b = g[d];
                if (Zi[b] === u) return b.toLowerCase()
            }
            return u
        }, Cl.format.named = function(u) {
            if (u = u.toLowerCase(), Zi[u]) return eg(Zi[u]);
            throw new Error("unknown color name: " + u)
        }, Cl.autodetect.push({
            p: 5,
            test: function(u) {
                for (var d = [], g = arguments.length - 1; g-- > 0;) d[g] = arguments[g + 1];
                if (!d.length && tg(u) === "string" && Zi[u.toLowerCase()]) return "named"
            }
        });
        var ig = _.unpack,
            sg = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = ig(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2];
                return (b << 16) + (T << 8) + C
            },
            ng = sg,
            ag = _.type,
            og = function(u) {
                if (ag(u) == "number" && u >= 0 && u <= 16777215) {
                    var d = u >> 16,
                        g = u >> 8 & 255,
                        b = u & 255;
                    return [d, g, b, 1]
                }
                throw new Error("unknown num color: " + u)
            },
            hg = og,
            lg = L,
            Sl = k,
            Il = y,
            cg = _.type,
            ug = ng;
        Sl.prototype.num = function() {
            return ug(this._rgb)
        }, lg.num = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Sl, [null].concat(u, ["num"])))
        }, Il.format.num = hg, Il.autodetect.push({
            p: 5,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u.length === 1 && cg(u[0]) === "number" && u[0] >= 0 && u[0] <= 16777215) return "num"
            }
        });
        var fg = L,
            Ia = k,
            Rl = y,
            Ml = _.unpack,
            Pl = _.type,
            Nl = Math.round;
        Ia.prototype.rgb = function(u) {
            return u === void 0 && (u = !0), u === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(Nl)
        }, Ia.prototype.rgba = function(u) {
            return u === void 0 && (u = !0), this._rgb.slice(0, 4).map(function(d, g) {
                return g < 3 ? u === !1 ? d : Nl(d) : d
            })
        }, fg.rgb = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Ia, [null].concat(u, ["rgb"])))
        }, Rl.format.rgb = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            var g = Ml(u, "rgba");
            return g[3] === void 0 && (g[3] = 1), g
        }, Rl.autodetect.push({
            p: 3,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = Ml(u, "rgba"), Pl(u) === "array" && (u.length === 3 || u.length === 4 && Pl(u[3]) == "number" && u[3] >= 0 && u[3] <= 1)) return "rgb"
            }
        });
        var $s = Math.log,
            dg = function(u) {
                var d = u / 100,
                    g, b, T;
                return d < 66 ? (g = 255, b = d < 6 ? 0 : -155.25485562709179 - .44596950469579133 * (b = d - 2) + 104.49216199393888 * $s(b), T = d < 20 ? 0 : -254.76935184120902 + .8274096064007395 * (T = d - 10) + 115.67994401066147 * $s(T)) : (g = 351.97690566805693 + .114206453784165 * (g = d - 55) - 40.25366309332127 * $s(g), b = 325.4494125711974 + .07943456536662342 * (b = d - 50) - 28.0852963507957 * $s(b), T = 255), [g, b, T, 1]
            },
            Dl = dg,
            pg = Dl,
            mg = _.unpack,
            gg = Math.round,
            vg = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                for (var g = mg(u, "rgb"), b = g[0], T = g[2], C = 1e3, w = 4e4, M = .4, P; w - C > M;) {
                    P = (w + C) * .5;
                    var F = pg(P);
                    F[2] / F[0] >= T / b ? w = P : C = P
                }
                return gg(P)
            },
            _g = vg,
            Ra = L,
            Hs = k,
            Ma = y,
            yg = _g;
        Hs.prototype.temp = Hs.prototype.kelvin = Hs.prototype.temperature = function() {
            return yg(this._rgb)
        }, Ra.temp = Ra.kelvin = Ra.temperature = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Hs, [null].concat(u, ["temp"])))
        }, Ma.format.temp = Ma.format.kelvin = Ma.format.temperature = Dl;
        var xg = _.unpack,
            Pa = Math.cbrt,
            bg = Math.pow,
            wg = Math.sign,
            Eg = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = xg(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = [Na(b / 255), Na(T / 255), Na(C / 255)],
                    M = w[0],
                    P = w[1],
                    F = w[2],
                    V = Pa(.4122214708 * M + .5363325363 * P + .0514459929 * F),
                    q = Pa(.2119034982 * M + .6806995451 * P + .1073969566 * F),
                    z = Pa(.0883024619 * M + .2817188376 * P + .6299787005 * F);
                return [.2104542553 * V + .793617785 * q - .0040720468 * z, 1.9779984951 * V - 2.428592205 * q + .4505937099 * z, .0259040371 * V + .7827717662 * q - .808675766 * z]
            },
            Bl = Eg;

        function Na(u) {
            var d = Math.abs(u);
            return d < .04045 ? u / 12.92 : (wg(u) || 1) * bg((d + .055) / 1.055, 2.4)
        }
        var Tg = _.unpack,
            Vs = Math.pow,
            Ag = Math.sign,
            Cg = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = Tg(u, "lab");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C = Vs(g + .3963377774 * b + .2158037573 * T, 3),
                    w = Vs(g - .1055613458 * b - .0638541728 * T, 3),
                    M = Vs(g - .0894841775 * b - 1.291485548 * T, 3);
                return [255 * Da(4.0767416621 * C - 3.3077115913 * w + .2309699292 * M), 255 * Da(-1.2684380046 * C + 2.6097574011 * w - .3413193965 * M), 255 * Da(-.0041960863 * C - .7034186147 * w + 1.707614701 * M), u.length > 3 ? u[3] : 1]
            },
            Ol = Cg;

        function Da(u) {
            var d = Math.abs(u);
            return d > .0031308 ? (Ag(u) || 1) * (1.055 * Vs(d, 1 / 2.4) - .055) : u * 12.92
        }
        var Sg = _.unpack,
            Ig = _.type,
            Rg = L,
            Fl = k,
            kl = y,
            Mg = Bl;
        Fl.prototype.oklab = function() {
            return Mg(this._rgb)
        }, Rg.oklab = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Fl, [null].concat(u, ["oklab"])))
        }, kl.format.oklab = Ol, kl.autodetect.push({
            p: 3,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = Sg(u, "oklab"), Ig(u) === "array" && u.length === 3) return "oklab"
            }
        });
        var Pg = _.unpack,
            Ng = Bl,
            Dg = xl,
            Bg = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                var g = Pg(u, "rgb"),
                    b = g[0],
                    T = g[1],
                    C = g[2],
                    w = Ng(b, T, C),
                    M = w[0],
                    P = w[1],
                    F = w[2];
                return Dg(M, P, F)
            },
            Og = Bg,
            Fg = _.unpack,
            kg = bl,
            Lg = Ol,
            Ug = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                u = Fg(u, "lch");
                var g = u[0],
                    b = u[1],
                    T = u[2],
                    C = kg(g, b, T),
                    w = C[0],
                    M = C[1],
                    P = C[2],
                    F = Lg(w, M, P),
                    V = F[0],
                    q = F[1],
                    z = F[2];
                return [V, q, z, u.length > 3 ? u[3] : 1]
            },
            Gg = Ug,
            $g = _.unpack,
            Hg = _.type,
            Vg = L,
            Ll = k,
            Ul = y,
            zg = Og;
        Ll.prototype.oklch = function() {
            return zg(this._rgb)
        }, Vg.oklch = function() {
            for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
            return new(Function.prototype.bind.apply(Ll, [null].concat(u, ["oklch"])))
        }, Ul.format.oklch = Gg, Ul.autodetect.push({
            p: 3,
            test: function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                if (u = $g(u, "oklch"), Hg(u) === "array" && u.length === 3) return "oklch"
            }
        });
        var Gl = k,
            Xg = _.type;
        Gl.prototype.alpha = function(u, d) {
            return d === void 0 && (d = !1), u !== void 0 && Xg(u) === "number" ? d ? (this._rgb[3] = u, this) : new Gl([this._rgb[0], this._rgb[1], this._rgb[2], u], "rgb") : this._rgb[3]
        };
        var jg = k;
        jg.prototype.clipped = function() {
            return this._rgb._clipped || !1
        };
        var Lr = k,
            Wg = Us;
        Lr.prototype.darken = function(u) {
            u === void 0 && (u = 1);
            var d = this,
                g = d.lab();
            return g[0] -= Wg.Kn * u, new Lr(g, "lab").alpha(d.alpha(), !0)
        }, Lr.prototype.brighten = function(u) {
            return u === void 0 && (u = 1), this.darken(-u)
        }, Lr.prototype.darker = Lr.prototype.darken, Lr.prototype.brighter = Lr.prototype.brighten;
        var Yg = k;
        Yg.prototype.get = function(u) {
            var d = u.split("."),
                g = d[0],
                b = d[1],
                T = this[g]();
            if (b) {
                var C = g.indexOf(b) - (g.substr(0, 2) === "ok" ? 2 : 0);
                if (C > -1) return T[C];
                throw new Error("unknown channel " + b + " in mode " + g)
            } else return T
        };
        var ui = k,
            qg = _.type,
            Zg = Math.pow,
            Kg = 1e-7,
            Jg = 20;
        ui.prototype.luminance = function(u) {
            if (u !== void 0 && qg(u) === "number") {
                if (u === 0) return new ui([0, 0, 0, this._rgb[3]], "rgb");
                if (u === 1) return new ui([255, 255, 255, this._rgb[3]], "rgb");
                var d = this.luminance(),
                    g = "rgb",
                    b = Jg,
                    T = function(w, M) {
                        var P = w.interpolate(M, .5, g),
                            F = P.luminance();
                        return Math.abs(u - F) < Kg || !b-- ? P : F > u ? T(w, P) : T(P, M)
                    },
                    C = (d > u ? T(new ui([0, 0, 0]), this) : T(this, new ui([255, 255, 255]))).rgb();
                return new ui(C.concat([this._rgb[3]]))
            }
            return Qg.apply(void 0, this._rgb.slice(0, 3))
        };
        var Qg = function(u, d, g) {
                return u = Ba(u), d = Ba(d), g = Ba(g), .2126 * u + .7152 * d + .0722 * g
            },
            Ba = function(u) {
                return u /= 255, u <= .03928 ? u / 12.92 : Zg((u + .055) / 1.055, 2.4)
            },
            Ee = {},
            $l = k,
            Hl = _.type,
            zs = Ee,
            Vl = function(u, d, g) {
                g === void 0 && (g = .5);
                for (var b = [], T = arguments.length - 3; T-- > 0;) b[T] = arguments[T + 3];
                var C = b[0] || "lrgb";
                if (!zs[C] && !b.length && (C = Object.keys(zs)[0]), !zs[C]) throw new Error("interpolation mode " + C + " is not defined");
                return Hl(u) !== "object" && (u = new $l(u)), Hl(d) !== "object" && (d = new $l(d)), zs[C](u, d, g).alpha(u.alpha() + g * (d.alpha() - u.alpha()))
            },
            zl = k,
            t0 = Vl;
        zl.prototype.mix = zl.prototype.interpolate = function(u, d) {
            d === void 0 && (d = .5);
            for (var g = [], b = arguments.length - 2; b-- > 0;) g[b] = arguments[b + 2];
            return t0.apply(void 0, [this, u, d].concat(g))
        };
        var Xl = k;
        Xl.prototype.premultiply = function(u) {
            u === void 0 && (u = !1);
            var d = this._rgb,
                g = d[3];
            return u ? (this._rgb = [d[0] * g, d[1] * g, d[2] * g, g], this) : new Xl([d[0] * g, d[1] * g, d[2] * g, g], "rgb")
        };
        var Oa = k,
            e0 = Us;
        Oa.prototype.saturate = function(u) {
            u === void 0 && (u = 1);
            var d = this,
                g = d.lch();
            return g[1] += e0.Kn * u, g[1] < 0 && (g[1] = 0), new Oa(g, "lch").alpha(d.alpha(), !0)
        }, Oa.prototype.desaturate = function(u) {
            return u === void 0 && (u = 1), this.saturate(-u)
        };
        var jl = k,
            Wl = _.type;
        jl.prototype.set = function(u, d, g) {
            g === void 0 && (g = !1);
            var b = u.split("."),
                T = b[0],
                C = b[1],
                w = this[T]();
            if (C) {
                var M = T.indexOf(C) - (T.substr(0, 2) === "ok" ? 2 : 0);
                if (M > -1) {
                    if (Wl(d) == "string") switch (d.charAt(0)) {
                            case "+":
                                w[M] += +d;
                                break;
                            case "-":
                                w[M] += +d;
                                break;
                            case "*":
                                w[M] *= +d.substr(1);
                                break;
                            case "/":
                                w[M] /= +d.substr(1);
                                break;
                            default:
                                w[M] = +d
                        } else if (Wl(d) === "number") w[M] = d;
                        else throw new Error("unsupported value for Color.set");
                    var P = new jl(w, T);
                    return g ? (this._rgb = P._rgb, this) : P
                }
                throw new Error("unknown channel " + C + " in mode " + T)
            } else return w
        };
        var r0 = k,
            i0 = function(u, d, g) {
                var b = u._rgb,
                    T = d._rgb;
                return new r0(b[0] + g * (T[0] - b[0]), b[1] + g * (T[1] - b[1]), b[2] + g * (T[2] - b[2]), "rgb")
            };
        Ee.rgb = i0;
        var s0 = k,
            Fa = Math.sqrt,
            fi = Math.pow,
            n0 = function(u, d, g) {
                var b = u._rgb,
                    T = b[0],
                    C = b[1],
                    w = b[2],
                    M = d._rgb,
                    P = M[0],
                    F = M[1],
                    V = M[2];
                return new s0(Fa(fi(T, 2) * (1 - g) + fi(P, 2) * g), Fa(fi(C, 2) * (1 - g) + fi(F, 2) * g), Fa(fi(w, 2) * (1 - g) + fi(V, 2) * g), "rgb")
            };
        Ee.lrgb = n0;
        var a0 = k,
            o0 = function(u, d, g) {
                var b = u.lab(),
                    T = d.lab();
                return new a0(b[0] + g * (T[0] - b[0]), b[1] + g * (T[1] - b[1]), b[2] + g * (T[2] - b[2]), "lab")
            };
        Ee.lab = o0;
        var Yl = k,
            di = function(u, d, g, b) {
                var T, C, w, M;
                b === "hsl" ? (w = u.hsl(), M = d.hsl()) : b === "hsv" ? (w = u.hsv(), M = d.hsv()) : b === "hcg" ? (w = u.hcg(), M = d.hcg()) : b === "hsi" ? (w = u.hsi(), M = d.hsi()) : b === "lch" || b === "hcl" ? (b = "hcl", w = u.hcl(), M = d.hcl()) : b === "oklch" && (w = u.oklch().reverse(), M = d.oklch().reverse());
                var P, F, V, q, z, tt;
                (b.substr(0, 1) === "h" || b === "oklch") && (T = w, P = T[0], V = T[1], z = T[2], C = M, F = C[0], q = C[1], tt = C[2]);
                var Q, pt, vt, bt;
                return !isNaN(P) && !isNaN(F) ? (F > P && F - P > 180 ? bt = F - (P + 360) : F < P && P - F > 180 ? bt = F + 360 - P : bt = F - P, pt = P + g * bt) : isNaN(P) ? isNaN(F) ? pt = Number.NaN : (pt = F, (z == 1 || z == 0) && b != "hsv" && (Q = q)) : (pt = P, (tt == 1 || tt == 0) && b != "hsv" && (Q = V)), Q === void 0 && (Q = V + g * (q - V)), vt = z + g * (tt - z), b === "oklch" ? new Yl([vt, Q, pt], b) : new Yl([pt, Q, vt], b)
            },
            h0 = di,
            ql = function(u, d, g) {
                return h0(u, d, g, "lch")
            };
        Ee.lch = ql, Ee.hcl = ql;
        var l0 = k,
            c0 = function(u, d, g) {
                var b = u.num(),
                    T = d.num();
                return new l0(b + g * (T - b), "num")
            };
        Ee.num = c0;
        var u0 = di,
            f0 = function(u, d, g) {
                return u0(u, d, g, "hcg")
            };
        Ee.hcg = f0;
        var d0 = di,
            p0 = function(u, d, g) {
                return d0(u, d, g, "hsi")
            };
        Ee.hsi = p0;
        var m0 = di,
            g0 = function(u, d, g) {
                return m0(u, d, g, "hsl")
            };
        Ee.hsl = g0;
        var v0 = di,
            _0 = function(u, d, g) {
                return v0(u, d, g, "hsv")
            };
        Ee.hsv = _0;
        var y0 = k,
            x0 = function(u, d, g) {
                var b = u.oklab(),
                    T = d.oklab();
                return new y0(b[0] + g * (T[0] - b[0]), b[1] + g * (T[1] - b[1]), b[2] + g * (T[2] - b[2]), "oklab")
            };
        Ee.oklab = x0;
        var b0 = di,
            w0 = function(u, d, g) {
                return b0(u, d, g, "oklch")
            };
        Ee.oklch = w0;
        var ka = k,
            E0 = _.clip_rgb,
            La = Math.pow,
            Ua = Math.sqrt,
            Ga = Math.PI,
            Zl = Math.cos,
            Kl = Math.sin,
            T0 = Math.atan2,
            A0 = function(u, d, g) {
                d === void 0 && (d = "lrgb"), g === void 0 && (g = null);
                var b = u.length;
                g || (g = Array.from(new Array(b)).map(function() {
                    return 1
                }));
                var T = b / g.reduce(function(pt, vt) {
                    return pt + vt
                });
                if (g.forEach(function(pt, vt) {
                        g[vt] *= T
                    }), u = u.map(function(pt) {
                        return new ka(pt)
                    }), d === "lrgb") return C0(u, g);
                for (var C = u.shift(), w = C.get(d), M = [], P = 0, F = 0, V = 0; V < w.length; V++)
                    if (w[V] = (w[V] || 0) * g[0], M.push(isNaN(w[V]) ? 0 : g[0]), d.charAt(V) === "h" && !isNaN(w[V])) {
                        var q = w[V] / 180 * Ga;
                        P += Zl(q) * g[0], F += Kl(q) * g[0]
                    }
                var z = C.alpha() * g[0];
                u.forEach(function(pt, vt) {
                    var bt = pt.get(d);
                    z += pt.alpha() * g[vt + 1];
                    for (var Tt = 0; Tt < w.length; Tt++)
                        if (!isNaN(bt[Tt]))
                            if (M[Tt] += g[vt + 1], d.charAt(Tt) === "h") {
                                var ae = bt[Tt] / 180 * Ga;
                                P += Zl(ae) * g[vt + 1], F += Kl(ae) * g[vt + 1]
                            } else w[Tt] += bt[Tt] * g[vt + 1]
                });
                for (var tt = 0; tt < w.length; tt++)
                    if (d.charAt(tt) === "h") {
                        for (var Q = T0(F / M[tt], P / M[tt]) / Ga * 180; Q < 0;) Q += 360;
                        for (; Q >= 360;) Q -= 360;
                        w[tt] = Q
                    } else w[tt] = w[tt] / M[tt];
                return z /= b, new ka(w, d).alpha(z > .99999 ? 1 : z, !0)
            },
            C0 = function(u, d) {
                for (var g = u.length, b = [0, 0, 0, 0], T = 0; T < u.length; T++) {
                    var C = u[T],
                        w = d[T] / g,
                        M = C._rgb;
                    b[0] += La(M[0], 2) * w, b[1] += La(M[1], 2) * w, b[2] += La(M[2], 2) * w, b[3] += M[3] * w
                }
                return b[0] = Ua(b[0]), b[1] = Ua(b[1]), b[2] = Ua(b[2]), b[3] > .9999999 && (b[3] = 1), new ka(E0(b))
            },
            Pe = L,
            pi = _.type,
            S0 = Math.pow,
            $a = function(u) {
                var d = "rgb",
                    g = Pe("#ccc"),
                    b = 0,
                    T = [0, 1],
                    C = [],
                    w = [0, 0],
                    M = !1,
                    P = [],
                    F = !1,
                    V = 0,
                    q = 1,
                    z = !1,
                    tt = {},
                    Q = !0,
                    pt = 1,
                    vt = function(X) {
                        if (X = X || ["#fff", "#000"], X && pi(X) === "string" && Pe.brewer && Pe.brewer[X.toLowerCase()] && (X = Pe.brewer[X.toLowerCase()]), pi(X) === "array") {
                            X.length === 1 && (X = [X[0], X[0]]), X = X.slice(0);
                            for (var ht = 0; ht < X.length; ht++) X[ht] = Pe(X[ht]);
                            C.length = 0;
                            for (var gt = 0; gt < X.length; gt++) C.push(gt / (X.length - 1))
                        }
                        return me(), P = X
                    },
                    bt = function(X) {
                        if (M != null) {
                            for (var ht = M.length - 1, gt = 0; gt < ht && X >= M[gt];) gt++;
                            return gt - 1
                        }
                        return 0
                    },
                    Tt = function(X) {
                        return X
                    },
                    ae = function(X) {
                        return X
                    },
                    re = function(X, ht) {
                        var gt, mt;
                        if (ht == null && (ht = !1), isNaN(X) || X === null) return g;
                        if (ht) mt = X;
                        else if (M && M.length > 2) {
                            var oe = bt(X);
                            mt = oe / (M.length - 2)
                        } else q !== V ? mt = (X - V) / (q - V) : mt = 1;
                        mt = ae(mt), ht || (mt = Tt(mt)), pt !== 1 && (mt = S0(mt, pt)), mt = w[0] + mt * (1 - w[0] - w[1]), mt = Math.min(1, Math.max(0, mt));
                        var Bt = Math.floor(mt * 1e4);
                        if (Q && tt[Bt]) gt = tt[Bt];
                        else {
                            if (pi(P) === "array")
                                for (var wt = 0; wt < C.length; wt++) {
                                    var At = C[wt];
                                    if (mt <= At) {
                                        gt = P[wt];
                                        break
                                    }
                                    if (mt >= At && wt === C.length - 1) {
                                        gt = P[wt];
                                        break
                                    }
                                    if (mt > At && mt < C[wt + 1]) {
                                        mt = (mt - At) / (C[wt + 1] - At), gt = Pe.interpolate(P[wt], P[wt + 1], mt, d);
                                        break
                                    }
                                } else pi(P) === "function" && (gt = P(mt));
                            Q && (tt[Bt] = gt)
                        }
                        return gt
                    },
                    me = function() {
                        return tt = {}
                    };
                vt(u);
                var yt = function(X) {
                    var ht = Pe(re(X));
                    return F && ht[F] ? ht[F]() : ht
                };
                return yt.classes = function(X) {
                    if (X != null) {
                        if (pi(X) === "array") M = X, T = [X[0], X[X.length - 1]];
                        else {
                            var ht = Pe.analyze(T);
                            X === 0 ? M = [ht.min, ht.max] : M = Pe.limits(ht, "e", X)
                        }
                        return yt
                    }
                    return M
                }, yt.domain = function(X) {
                    if (!arguments.length) return T;
                    V = X[0], q = X[X.length - 1], C = [];
                    var ht = P.length;
                    if (X.length === ht && V !== q)
                        for (var gt = 0, mt = Array.from(X); gt < mt.length; gt += 1) {
                            var oe = mt[gt];
                            C.push((oe - V) / (q - V))
                        } else {
                            for (var Bt = 0; Bt < ht; Bt++) C.push(Bt / (ht - 1));
                            if (X.length > 2) {
                                var wt = X.map(function(Ct, Rt) {
                                        return Rt / (X.length - 1)
                                    }),
                                    At = X.map(function(Ct) {
                                        return (Ct - V) / (q - V)
                                    });
                                At.every(function(Ct, Rt) {
                                    return wt[Rt] === Ct
                                }) || (ae = function(Ct) {
                                    if (Ct <= 0 || Ct >= 1) return Ct;
                                    for (var Rt = 0; Ct >= At[Rt + 1];) Rt++;
                                    var De = (Ct - At[Rt]) / (At[Rt + 1] - At[Rt]),
                                        Cr = wt[Rt] + De * (wt[Rt + 1] - wt[Rt]);
                                    return Cr
                                })
                            }
                        }
                    return T = [V, q], yt
                }, yt.mode = function(X) {
                    return arguments.length ? (d = X, me(), yt) : d
                }, yt.range = function(X, ht) {
                    return vt(X), yt
                }, yt.out = function(X) {
                    return F = X, yt
                }, yt.spread = function(X) {
                    return arguments.length ? (b = X, yt) : b
                }, yt.correctLightness = function(X) {
                    return X == null && (X = !0), z = X, me(), z ? Tt = function(ht) {
                        for (var gt = re(0, !0).lab()[0], mt = re(1, !0).lab()[0], oe = gt > mt, Bt = re(ht, !0).lab()[0], wt = gt + (mt - gt) * ht, At = Bt - wt, Ct = 0, Rt = 1, De = 20; Math.abs(At) > .01 && De-- > 0;)(function() {
                            return oe && (At *= -1), At < 0 ? (Ct = ht, ht += (Rt - ht) * .5) : (Rt = ht, ht += (Ct - ht) * .5), Bt = re(ht, !0).lab()[0], At = Bt - wt
                        })();
                        return ht
                    } : Tt = function(ht) {
                        return ht
                    }, yt
                }, yt.padding = function(X) {
                    return X != null ? (pi(X) === "number" && (X = [X, X]), w = X, yt) : w
                }, yt.colors = function(X, ht) {
                    arguments.length < 2 && (ht = "hex");
                    var gt = [];
                    if (arguments.length === 0) gt = P.slice(0);
                    else if (X === 1) gt = [yt(.5)];
                    else if (X > 1) {
                        var mt = T[0],
                            oe = T[1] - mt;
                        gt = I0(0, X, !1).map(function(Rt) {
                            return yt(mt + Rt / (X - 1) * oe)
                        })
                    } else {
                        u = [];
                        var Bt = [];
                        if (M && M.length > 2)
                            for (var wt = 1, At = M.length, Ct = 1 <= At; Ct ? wt < At : wt > At; Ct ? wt++ : wt--) Bt.push((M[wt - 1] + M[wt]) * .5);
                        else Bt = T;
                        gt = Bt.map(function(Rt) {
                            return yt(Rt)
                        })
                    }
                    return Pe[ht] && (gt = gt.map(function(Rt) {
                        return Rt[ht]()
                    })), gt
                }, yt.cache = function(X) {
                    return X != null ? (Q = X, yt) : Q
                }, yt.gamma = function(X) {
                    return X != null ? (pt = X, yt) : pt
                }, yt.nodata = function(X) {
                    return X != null ? (g = Pe(X), yt) : g
                }, yt
            };

        function I0(u, d, g) {
            for (var b = [], T = u < d, C = g ? T ? d + 1 : d - 1 : d, w = u; T ? w < C : w > C; T ? w++ : w--) b.push(w);
            return b
        }
        var Ki = k,
            R0 = $a,
            M0 = function(u) {
                for (var d = [1, 1], g = 1; g < u; g++) {
                    for (var b = [1], T = 1; T <= d.length; T++) b[T] = (d[T] || 0) + d[T - 1];
                    d = b
                }
                return d
            },
            P0 = function(u) {
                var d, g, b, T, C, w, M;
                if (u = u.map(function(z) {
                        return new Ki(z)
                    }), u.length === 2) d = u.map(function(z) {
                    return z.lab()
                }), C = d[0], w = d[1], T = function(z) {
                    var tt = [0, 1, 2].map(function(Q) {
                        return C[Q] + z * (w[Q] - C[Q])
                    });
                    return new Ki(tt, "lab")
                };
                else if (u.length === 3) g = u.map(function(z) {
                    return z.lab()
                }), C = g[0], w = g[1], M = g[2], T = function(z) {
                    var tt = [0, 1, 2].map(function(Q) {
                        return (1 - z) * (1 - z) * C[Q] + 2 * (1 - z) * z * w[Q] + z * z * M[Q]
                    });
                    return new Ki(tt, "lab")
                };
                else if (u.length === 4) {
                    var P;
                    b = u.map(function(z) {
                        return z.lab()
                    }), C = b[0], w = b[1], M = b[2], P = b[3], T = function(z) {
                        var tt = [0, 1, 2].map(function(Q) {
                            return (1 - z) * (1 - z) * (1 - z) * C[Q] + 3 * (1 - z) * (1 - z) * z * w[Q] + 3 * (1 - z) * z * z * M[Q] + z * z * z * P[Q]
                        });
                        return new Ki(tt, "lab")
                    }
                } else if (u.length >= 5) {
                    var F, V, q;
                    F = u.map(function(z) {
                        return z.lab()
                    }), q = u.length - 1, V = M0(q), T = function(z) {
                        var tt = 1 - z,
                            Q = [0, 1, 2].map(function(pt) {
                                return F.reduce(function(vt, bt, Tt) {
                                    return vt + V[Tt] * Math.pow(tt, q - Tt) * Math.pow(z, Tt) * bt[pt]
                                }, 0)
                            });
                        return new Ki(Q, "lab")
                    }
                } else throw new RangeError("No point in running bezier with only one color.");
                return T
            },
            N0 = function(u) {
                var d = P0(u);
                return d.scale = function() {
                    return R0(d)
                }, d
            },
            Ha = L,
            Ne = function(u, d, g) {
                if (!Ne[g]) throw new Error("unknown blend mode " + g);
                return Ne[g](u, d)
            },
            Tr = function(u) {
                return function(d, g) {
                    var b = Ha(g).rgb(),
                        T = Ha(d).rgb();
                    return Ha.rgb(u(b, T))
                }
            },
            Ar = function(u) {
                return function(d, g) {
                    var b = [];
                    return b[0] = u(d[0], g[0]), b[1] = u(d[1], g[1]), b[2] = u(d[2], g[2]), b
                }
            },
            D0 = function(u) {
                return u
            },
            B0 = function(u, d) {
                return u * d / 255
            },
            O0 = function(u, d) {
                return u > d ? d : u
            },
            F0 = function(u, d) {
                return u > d ? u : d
            },
            k0 = function(u, d) {
                return 255 * (1 - (1 - u / 255) * (1 - d / 255))
            },
            L0 = function(u, d) {
                return d < 128 ? 2 * u * d / 255 : 255 * (1 - 2 * (1 - u / 255) * (1 - d / 255))
            },
            U0 = function(u, d) {
                return 255 * (1 - (1 - d / 255) / (u / 255))
            },
            G0 = function(u, d) {
                return u === 255 ? 255 : (u = 255 * (d / 255) / (1 - u / 255), u > 255 ? 255 : u)
            };
        Ne.normal = Tr(Ar(D0)), Ne.multiply = Tr(Ar(B0)), Ne.screen = Tr(Ar(k0)), Ne.overlay = Tr(Ar(L0)), Ne.darken = Tr(Ar(O0)), Ne.lighten = Tr(Ar(F0)), Ne.dodge = Tr(Ar(G0)), Ne.burn = Tr(Ar(U0));
        for (var $0 = Ne, Va = _.type, H0 = _.clip_rgb, V0 = _.TWOPI, z0 = Math.pow, X0 = Math.sin, j0 = Math.cos, Jl = L, W0 = function(u, d, g, b, T) {
                u === void 0 && (u = 300), d === void 0 && (d = -1.5), g === void 0 && (g = 1), b === void 0 && (b = 1), T === void 0 && (T = [0, 1]);
                var C = 0,
                    w;
                Va(T) === "array" ? w = T[1] - T[0] : (w = 0, T = [T, T]);
                var M = function(P) {
                    var F = V0 * ((u + 120) / 360 + d * P),
                        V = z0(T[0] + w * P, b),
                        q = C !== 0 ? g[0] + P * C : g,
                        z = q * V * (1 - V) / 2,
                        tt = j0(F),
                        Q = X0(F),
                        pt = V + z * (-.14861 * tt + 1.78277 * Q),
                        vt = V + z * (-.29227 * tt - .90649 * Q),
                        bt = V + z * (1.97294 * tt);
                    return Jl(H0([pt * 255, vt * 255, bt * 255, 1]))
                };
                return M.start = function(P) {
                    return P == null ? u : (u = P, M)
                }, M.rotations = function(P) {
                    return P == null ? d : (d = P, M)
                }, M.gamma = function(P) {
                    return P == null ? b : (b = P, M)
                }, M.hue = function(P) {
                    return P == null ? g : (g = P, Va(g) === "array" ? (C = g[1] - g[0], C === 0 && (g = g[1])) : C = 0, M)
                }, M.lightness = function(P) {
                    return P == null ? T : (Va(P) === "array" ? (T = P, w = P[1] - P[0]) : (T = [P, P], w = 0), M)
                }, M.scale = function() {
                    return Jl.scale(M)
                }, M.hue(g), M
            }, Y0 = k, q0 = "0123456789abcdef", Z0 = Math.floor, K0 = Math.random, J0 = function() {
                for (var u = "#", d = 0; d < 6; d++) u += q0.charAt(Z0(K0() * 16));
                return new Y0(u, "hex")
            }, za = l, Ql = Math.log, Q0 = Math.pow, tv = Math.floor, ev = Math.abs, tc = function(u, d) {
                d === void 0 && (d = null);
                var g = {
                    min: Number.MAX_VALUE,
                    max: Number.MAX_VALUE * -1,
                    sum: 0,
                    values: [],
                    count: 0
                };
                return za(u) === "object" && (u = Object.values(u)), u.forEach(function(b) {
                    d && za(b) === "object" && (b = b[d]), b != null && !isNaN(b) && (g.values.push(b), g.sum += b, b < g.min && (g.min = b), b > g.max && (g.max = b), g.count += 1)
                }), g.domain = [g.min, g.max], g.limits = function(b, T) {
                    return ec(g, b, T)
                }, g
            }, ec = function(u, d, g) {
                d === void 0 && (d = "equal"), g === void 0 && (g = 7), za(u) == "array" && (u = tc(u));
                var b = u.min,
                    T = u.max,
                    C = u.values.sort(function(ja, Wa) {
                        return ja - Wa
                    });
                if (g === 1) return [b, T];
                var w = [];
                if (d.substr(0, 1) === "c" && (w.push(b), w.push(T)), d.substr(0, 1) === "e") {
                    w.push(b);
                    for (var M = 1; M < g; M++) w.push(b + M / g * (T - b));
                    w.push(T)
                } else if (d.substr(0, 1) === "l") {
                    if (b <= 0) throw new Error("Logarithmic scales are only possible for values > 0");
                    var P = Math.LOG10E * Ql(b),
                        F = Math.LOG10E * Ql(T);
                    w.push(b);
                    for (var V = 1; V < g; V++) w.push(Q0(10, P + V / g * (F - P)));
                    w.push(T)
                } else if (d.substr(0, 1) === "q") {
                    w.push(b);
                    for (var q = 1; q < g; q++) {
                        var z = (C.length - 1) * q / g,
                            tt = tv(z);
                        if (tt === z) w.push(C[tt]);
                        else {
                            var Q = z - tt;
                            w.push(C[tt] * (1 - Q) + C[tt + 1] * Q)
                        }
                    }
                    w.push(T)
                } else if (d.substr(0, 1) === "k") {
                    var pt, vt = C.length,
                        bt = new Array(vt),
                        Tt = new Array(g),
                        ae = !0,
                        re = 0,
                        me = null;
                    me = [], me.push(b);
                    for (var yt = 1; yt < g; yt++) me.push(b + yt / g * (T - b));
                    for (me.push(T); ae;) {
                        for (var X = 0; X < g; X++) Tt[X] = 0;
                        for (var ht = 0; ht < vt; ht++)
                            for (var gt = C[ht], mt = Number.MAX_VALUE, oe = void 0, Bt = 0; Bt < g; Bt++) {
                                var wt = ev(me[Bt] - gt);
                                wt < mt && (mt = wt, oe = Bt), Tt[oe]++, bt[ht] = oe
                            }
                        for (var At = new Array(g), Ct = 0; Ct < g; Ct++) At[Ct] = null;
                        for (var Rt = 0; Rt < vt; Rt++) pt = bt[Rt], At[pt] === null ? At[pt] = C[Rt] : At[pt] += C[Rt];
                        for (var De = 0; De < g; De++) At[De] *= 1 / Tt[De];
                        ae = !1;
                        for (var Cr = 0; Cr < g; Cr++)
                            if (At[Cr] !== me[Cr]) {
                                ae = !0;
                                break
                            }
                        me = At, re++, re > 200 && (ae = !1)
                    }
                    for (var Sr = {}, mi = 0; mi < g; mi++) Sr[mi] = [];
                    for (var gi = 0; gi < vt; gi++) pt = bt[gi], Sr[pt].push(C[gi]);
                    for (var ur = [], Ur = 0; Ur < g; Ur++) ur.push(Sr[Ur][0]), ur.push(Sr[Ur][Sr[Ur].length - 1]);
                    ur = ur.sort(function(ja, Wa) {
                        return ja - Wa
                    }), w.push(ur[0]);
                    for (var Ji = 1; Ji < ur.length; Ji += 2) {
                        var Gr = ur[Ji];
                        !isNaN(Gr) && w.indexOf(Gr) === -1 && w.push(Gr)
                    }
                }
                return w
            }, rc = {
                analyze: tc,
                limits: ec
            }, ic = k, rv = function(u, d) {
                u = new ic(u), d = new ic(d);
                var g = u.luminance(),
                    b = d.luminance();
                return g > b ? (g + .05) / (b + .05) : (b + .05) / (g + .05)
            }, sc = k, cr = Math.sqrt, Jt = Math.pow, iv = Math.min, sv = Math.max, nc = Math.atan2, ac = Math.abs, Xs = Math.cos, oc = Math.sin, nv = Math.exp, hc = Math.PI, av = function(u, d, g, b, T) {
                g === void 0 && (g = 1), b === void 0 && (b = 1), T === void 0 && (T = 1);
                var C = function(Gr) {
                        return 360 * Gr / (2 * hc)
                    },
                    w = function(Gr) {
                        return 2 * hc * Gr / 360
                    };
                u = new sc(u), d = new sc(d);
                var M = Array.from(u.lab()),
                    P = M[0],
                    F = M[1],
                    V = M[2],
                    q = Array.from(d.lab()),
                    z = q[0],
                    tt = q[1],
                    Q = q[2],
                    pt = (P + z) / 2,
                    vt = cr(Jt(F, 2) + Jt(V, 2)),
                    bt = cr(Jt(tt, 2) + Jt(Q, 2)),
                    Tt = (vt + bt) / 2,
                    ae = .5 * (1 - cr(Jt(Tt, 7) / (Jt(Tt, 7) + Jt(25, 7)))),
                    re = F * (1 + ae),
                    me = tt * (1 + ae),
                    yt = cr(Jt(re, 2) + Jt(V, 2)),
                    X = cr(Jt(me, 2) + Jt(Q, 2)),
                    ht = (yt + X) / 2,
                    gt = C(nc(V, re)),
                    mt = C(nc(Q, me)),
                    oe = gt >= 0 ? gt : gt + 360,
                    Bt = mt >= 0 ? mt : mt + 360,
                    wt = ac(oe - Bt) > 180 ? (oe + Bt + 360) / 2 : (oe + Bt) / 2,
                    At = 1 - .17 * Xs(w(wt - 30)) + .24 * Xs(w(2 * wt)) + .32 * Xs(w(3 * wt + 6)) - .2 * Xs(w(4 * wt - 63)),
                    Ct = Bt - oe;
                Ct = ac(Ct) <= 180 ? Ct : Bt <= oe ? Ct + 360 : Ct - 360, Ct = 2 * cr(yt * X) * oc(w(Ct) / 2);
                var Rt = z - P,
                    De = X - yt,
                    Cr = 1 + .015 * Jt(pt - 50, 2) / cr(20 + Jt(pt - 50, 2)),
                    Sr = 1 + .045 * ht,
                    mi = 1 + .015 * ht * At,
                    gi = 30 * nv(-Jt((wt - 275) / 25, 2)),
                    ur = 2 * cr(Jt(ht, 7) / (Jt(ht, 7) + Jt(25, 7))),
                    Ur = -ur * oc(2 * w(gi)),
                    Ji = cr(Jt(Rt / (g * Cr), 2) + Jt(De / (b * Sr), 2) + Jt(Ct / (T * mi), 2) + Ur * (De / (b * Sr)) * (Ct / (T * mi)));
                return sv(0, iv(100, Ji))
            }, lc = k, ov = function(u, d, g) {
                g === void 0 && (g = "lab"), u = new lc(u), d = new lc(d);
                var b = u.get(g),
                    T = d.get(g),
                    C = 0;
                for (var w in b) {
                    var M = (b[w] || 0) - (T[w] || 0);
                    C += M * M
                }
                return Math.sqrt(C)
            }, hv = k, lv = function() {
                for (var u = [], d = arguments.length; d--;) u[d] = arguments[d];
                try {
                    return new(Function.prototype.bind.apply(hv, [null].concat(u))), !0
                } catch {
                    return !1
                }
            }, cc = L, uc = $a, cv = {
                cool: function() {
                    return uc([cc.hsl(180, 1, .9), cc.hsl(250, .7, .4)])
                },
                hot: function() {
                    return uc(["#000", "#f00", "#ff0", "#fff"]).mode("rgb")
                }
            }, js = {
                OrRd: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"],
                PuBu: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"],
                BuPu: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"],
                Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
                BuGn: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#006d2c", "#00441b"],
                YlOrBr: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"],
                YlGn: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"],
                Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
                RdPu: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"],
                Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
                YlGnBu: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
                GnBu: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"],
                Greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
                YlOrRd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
                PuRd: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"],
                Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
                PuBuGn: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"],
                Viridis: ["#440154", "#482777", "#3f4a8a", "#31678e", "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"],
                Spectral: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
                RdYlGn: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
                RdBu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
                PiYG: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
                PRGn: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],
                RdYlBu: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
                BrBG: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
                RdGy: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"],
                PuOr: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"],
                Set2: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"],
                Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
                Set1: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"],
                Set3: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"],
                Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
                Paired: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"],
                Pastel2: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"],
                Pastel1: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]
            }, Xa = 0, fc = Object.keys(js); Xa < fc.length; Xa += 1) {
            var dc = fc[Xa];
            js[dc.toLowerCase()] = js[dc]
        }
        var uv = js,
            ee = L;
        ee.average = A0, ee.bezier = N0, ee.blend = $0, ee.cubehelix = W0, ee.mix = ee.interpolate = Vl, ee.random = J0, ee.scale = $a, ee.analyze = rc.analyze, ee.contrast = rv, ee.deltaE = av, ee.distance = ov, ee.limits = rc.limits, ee.valid = lv, ee.scales = cv, ee.colors = Al, ee.brewer = uv;
        var fv = ee;
        return fv
    })
})(pE);
var mE = ch;
const uh = 16777215,
    gE = 1,
    up = 0,
    vE = 1,
    _E = .25,
    yE = !1,
    fh = 100,
    xE = () => Math.floor(Math.random() * 16777215),
    bE = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    wE = {
        units: Rs,
        darkColor: uh,
        darkAlpha: gE,
        clearColor: up,
        clearAlpha: vE,
        outlineWidth: _E,
        outlineMode: yE,
        scale: fh,
        index: 0,
        shape: void 0
    };
class Se extends Ds {
    constructor(r = {}, i = void 0) {
        super(i);
        ue(this, "properties");
        if (this.properties = { ...wE,
                ...r
            }, this.properties.units === Rs) this.properties.scale = fh;
        else if (this.properties.units === Qn) this.properties.scale = fh / 25.4;
        else throw new Error(`Unknown units: ${this.properties.units}`)
    }
    renderGraphic(r, i = void 0) {
        const {
            scale: s,
            darkAlpha: n,
            clearAlpha: a,
            darkColor: o,
            clearColor: h,
            outlineMode: l,
            outlineWidth: c
        } = this.properties;
        if (r.type === yn) i != null ? (this.position.x = r.location[0] * s, this.position.y = r.location[1] * s, i = void 0) : (l ? (this.beginFill(o, 0), this.lineStyle({
            color: o,
            width: c,
            alpha: 1,
            cap: He.ROUND,
            join: de.ROUND
        })) : (r.polarity == Le ? this.beginFill(o, n) : r.polarity == hf ? this.beginFill(h, a) : this.beginFill(h, a), this.lineStyle({
            width: 0,
            alpha: 0
        })), this.renderShape(r));
        else if (r.type === bf)
            if (i != null) {
                for (const f of r.segments) {
                    const p = new Se(this.properties, i);
                    p.x = f.start[0] * s, p.y = f.start[1] * s, this.addChild(p);
                    const m = new Se(this.properties, i);
                    m.x = f.end[0] * s, m.y = f.end[1] * s, this.addChild(m);
                    const v = new Se(this.properties);
                    r.polarity == Le ? v.beginFill(o, n) : v.beginFill(h, a), v.lineStyle({
                        width: 0,
                        color: r.polarity == Le ? o : h,
                        alpha: 0
                    });
                    const _ = v.contourizeCirclePath(f, r.width);
                    v.drawContour(_), this.addChild(v)
                }
                i = void 0
            } else l ? (this.beginFill(o, 0), this.lineStyle({
                color: o,
                width: c,
                alpha: 1,
                cap: He.ROUND,
                join: de.ROUND
            })) : (r.polarity == Le ? this.beginFill(o, 0) : this.beginFill(h, 0), this.lineStyle({
                width: r.width * s,
                color: r.polarity == Le ? o : h,
                alpha: r.polarity == Le ? n : a,
                cap: He.ROUND,
                join: de.ROUND
            })), this.drawPolyLine(r.segments);
        else l ? (this.beginFill(o, 0), this.lineStyle({
            color: o,
            width: c,
            alpha: 1,
            cap: He.ROUND,
            join: de.ROUND
        }), this.drawPolyLine(r.segments).lineTo(r.segments[0].start[0] * s, r.segments[0].start[1] * s)) : (r.polarity == Le ? this.beginFill(o, n) : this.beginFill(h, a), this.lineStyle({
            width: 0,
            color: r.polarity == Le ? o : h,
            alpha: 0
        }), this.drawContour(r.segments));
        return this.endFill(), this
    }
    renderShape(r) {
        const {
            shape: i
        } = r, {
            outlineMode: s
        } = this.properties;
        return s ? this.shapeToOutline(i) : this.shapeToElement(i)
    }
    shapeToElement(r) {
        const {
            scale: i,
            darkAlpha: s,
            clearAlpha: n,
            darkColor: a,
            clearColor: o
        } = this.properties;
        switch (r.type) {
            case Gi:
                {
                    const {
                        cx: h,
                        cy: l,
                        r: c
                    } = r;
                    return this.drawCircle(h * i, l * i, c * i),
                    this
                }
            case Dn:
                {
                    const {
                        x: h,
                        y: l,
                        xSize: c,
                        ySize: f,
                        r: p
                    } = r;
                    return this.drawRoundedRect(h * i, l * i, c * i, f * i, p ? p * i : 0),
                    this
                }
            case Ye:
                return this.drawPolygon(r.points.flat().map(h => h * i)), this;
            case _s:
                return this.drawContour(r.segments), this;
            case Bn:
                {
                    const h = this._fillStyle.color;
                    for (const l of r.shapes) {
                        const c = h == a ? l.erase === !0 ? o : a : l.erase === !0 ? a : o;
                        this.beginFill(c, h == a ? s : n), this.shapeToElement(l), this.endFill(), this.moveTo(0, 0)
                    }
                    return this
                }
            default:
                return console.log("RENDERING (UNKNOWN): ", r), this
        }
    }
    shapeToOutline(r) {
        const {
            scale: i
        } = this.properties;
        switch (r.type) {
            case Gi:
                {
                    const {
                        cx: s,
                        cy: n,
                        r: a
                    } = r;
                    return this.moveTo(s * i + a * i, n * i),
                    this.arc(s * i, n * i, a * i, 0, 2 * Math.PI),
                    this
                }
            case Dn:
                {
                    const {
                        x: s,
                        y: n,
                        xSize: a,
                        ySize: o,
                        r: h
                    } = r;
                    return h ? (this.moveTo(s * i, n * i + h * i), this.arc(s * i + h * i, n * i + h * i, h * i, Math.PI, 3 * Math.PI / 2), this.lineTo(s * i + a * i - h * i, n * i), this.arc(s * i + a * i - h * i, n * i + h * i, h * i, 3 * Math.PI / 2, 2 * Math.PI), this.lineTo(s * i + a * i, n * i + o * i - h * i), this.arc(s * i + a * i - h * i, n * i + o * i - h * i, h * i, 0, Math.PI / 2), this.lineTo(s * i + h * i, n * i + o * i), this.arc(s * i + h * i, n * i + o * i - h * i, h * i, Math.PI / 2, Math.PI), this.lineTo(s * i, n * i + h * i)) : (this.moveTo(s * i, n * i), this.lineTo(s * i + a * i, n * i), this.lineTo(s * i + a * i, n * i + o * i), this.lineTo(s * i, n * i + o * i), this.lineTo(s * i, n * i)),
                    this
                }
            case Ye:
                {
                    const [s, ...n] = r.points;this.moveTo(s[0] * i, s[1] * i);
                    for (const a of n) this.lineTo(a[0] * i, a[1] * i);
                    return this.lineTo(s[0] * i, s[1] * i),
                    this
                }
            case _s:
                return this.drawPolyLine(r.segments), this;
            case Bn:
                {
                    for (const s of r.shapes) this.shapeToOutline(s);
                    return this
                }
            default:
                return console.log("RENDERING (UNKNOWN): ", r), this
        }
    }
    drawPolyLine(r) {
        const {
            scale: i
        } = this.properties;
        for (const [s, n] of r.entries()) {
            const a = s > 0 ? r[s - 1] : void 0,
                {
                    start: o,
                    end: h
                } = n;
            if ((a === void 0 || !bn(a.end, o)) && this.moveTo(o[0] * i, o[1] * i), n.type === Ht) this.lineTo(h[0] * i, h[1] * i);
            else {
                const {
                    start: l,
                    end: c,
                    radius: f,
                    center: p
                } = n, m = l[2] - c[2];
                this.arc(p[0] * i, p[1] * i, f * i, l[2], c[2], m > 0)
            }
        }
        return this
    }
    drawContour(r) {
        const {
            scale: i
        } = this.properties;
        for (const [s, n] of r.entries()) {
            const a = s > 0 ? r[s - 1] : void 0,
                {
                    start: o,
                    end: h
                } = n;
            if (a === void 0 ? this.moveTo(o[0] * i, o[1] * i) : bn(a.end, o) || this.moveTo(o[0] * i, o[1] * i), n.type === Ht) this.lineTo(h[0] * i, h[1] * i);
            else {
                const {
                    start: l,
                    end: c,
                    radius: f,
                    center: p
                } = n, m = l[2] - c[2];
                this.arc(p[0] * i, p[1] * i, f * i, l[2], c[2], m > 0)
            }
        }
        return this
    }
    contourizeCirclePath(r, i) {
        const {
            start: s,
            end: n
        } = r;
        if (r.type === Ht) {
            const [a, o] = s, [h, l] = n, c = Math.atan2(l - o, h - a), f = -(i / 2) * Math.sin(c), p = i / 2 * Math.cos(c);
            return [{
                type: Ht,
                start: [a + f, o + p],
                end: [h + f, l + p]
            }, {
                type: Ht,
                start: [h + f, l + p],
                end: [h - f, l - p]
            }, {
                type: Ht,
                start: [h - f, l - p],
                end: [a - f, o - p]
            }, {
                type: Ht,
                start: [a - f, o - p],
                end: [a + f, o + p]
            }]
        } else {
            const {
                start: a,
                end: o,
                radius: h,
                center: l
            } = r, [c, f] = a, [p, m] = o, [v, _] = l, y = a[2], A = o[2], I = -(i / 2) * Math.sin(y - Math.PI / 2), x = i / 2 * Math.cos(y - Math.PI / 2), S = -(i / 2) * Math.sin(A - Math.PI / 2), $ = i / 2 * Math.cos(A - Math.PI / 2);
            return y > A ? [{
                type: Ge,
                start: [c + I, f + x, y],
                end: [p + S, m + $, A],
                center: [v, _],
                radius: h + i / 2
            }, {
                type: Ht,
                start: [p + S, m + $],
                end: [p - S, m - $]
            }, {
                type: Ge,
                start: [p - S, m - $, A],
                end: [c - I, f - x, y],
                center: [v, _],
                radius: h - i / 2
            }, {
                type: Ht,
                start: [c - I, f - x],
                end: [c + I, f + x]
            }] : [{
                type: Ge,
                start: [c + I, f + x, y],
                end: [p + S, m + $, A],
                center: [v, _],
                radius: h + i / 2
            }, {
                type: Ht,
                start: [p + S, m + $],
                end: [p - S, m - $]
            }, {
                type: Ge,
                start: [p - S, m - $, A],
                end: [c - I, f - x, y],
                center: [v, _],
                radius: h - i / 2
            }, {
                type: Ht,
                start: [c - I, f - x],
                end: [c + I, f + x]
            }]
        }
    }
    drawTesselatedContour(r) {
        const {
            scale: i
        } = this.properties;
        let s = [0, 0];
        for (const [n, a] of r.entries()) {
            const o = n > 0 ? r[n - 1] : void 0,
                {
                    start: h,
                    end: l
                } = a;
            if (o === void 0 ? (this.moveTo(0, 0), this.lineTo(h[0] * i, h[1] * i), s = h) : bn(o.end, h) || (this.lineTo(s[0] * i, s[1] * i), this.lineTo(0, 0), this.lineTo(h[0] * i, h[1] * i), s = h), a.type === Ht) this.lineTo(l[0] * i, l[1] * i);
            else {
                const {
                    start: c,
                    end: f,
                    radius: p,
                    center: m
                } = a, v = c[2] - f[2];
                this.arc(m[0] * i, m[1] * i, p * i, c[2], f[2], v > 0)
            }
        }
        return this.lineTo(s[0] * i, s[1] * i), this
    }
}
class Jn extends Se {
    constructor(r, i = {}) {
        super({
            units: r.units,
            ...i
        });
        ue(this, "uid");
        ue(this, "geometryStore");
        ue(this, "toolStore");
        this.filters = [ya], this.tint = xE(), this.uid = bE(), this.geometryStore = {}, this.toolStore = {}, this.renderImageTree(r)
    }
    saveGeometry(r, i) {
        const s = {
                units: this.properties.units,
                darkColor: 16776960,
                darkAlpha: .5,
                clearColor: 16776960,
                clearAlpha: .5
            },
            n = {
                startPoint: {
                    x: 0,
                    y: 0
                },
                endPoint: {
                    x: 0,
                    y: 0
                },
                arcOffsets: {
                    i: 0,
                    j: 0,
                    a: 0
                }
            },
            a = new Se(s);
        if (i.type === X_) {
            const o = {
                type: yn,
                shape: Y_(i, n),
                polarity: Le,
                dcode: i.dcode,
                location: [n.endPoint.x, n.endPoint.y]
            };
            a.renderGraphic(o)
        } else if (i.type === z_) {
            const o = {
                type: yn,
                shape: j_(i, n),
                polarity: Le,
                dcode: i.dcode,
                location: [n.endPoint.x, n.endPoint.y]
            };
            a.renderGraphic(o)
        }
        this.geometryStore[r] = a.geometry, a.destroy()
    }
    retrieveGraphic(r, i) {
        const {
            dcode: s
        } = r, n = {
            units: this.properties.units,
            darkColor: uh,
            darkAlpha: .5,
            clearColor: uh,
            clearAlpha: .5,
            index: i,
            shape: r
        };
        if (s != null && r.type == yn) {
            const a = this.toolStore[s];
            !(s in this.geometryStore) && a && this.saveGeometry(s, a);
            const o = new Se(n);
            return o.renderGraphic(r, this.geometryStore[s]), o
        } else if (s != null && r.type == bf) {
            const a = this.toolStore[s];
            !(s in this.geometryStore) && a && this.saveGeometry(s, a);
            const o = new Se(n);
            return o.renderGraphic(r, this.geometryStore[s]), o
        } else {
            const a = new Se(n);
            return a.renderGraphic(r), a
        }
    }
    renderImageTree(r) {
        const {
            children: i,
            tools: s
        } = r;
        Object.assign(this.toolStore, s), console.time("render");
        for (const [n, a] of i.entries()) this.renderGraphic(a);
        return console.timeEnd("render"), this
    }
    featuresAtPosition(r, i) {
        const s = o => {
            const h = [];
            return o.visible = !0, o.updateTransform(), o.containsPoint(new Lt(r, i)) ? h.push(o) : o.visible = !1, h
        };
        let n = [],
            a = [];
        return this.children.forEach(o => {
            o instanceof Se && (a = a.concat(s(o)))
        }), n = a.map(o => ({
            bounds: {
                minX: o._bounds.minX,
                minY: o._bounds.minY,
                maxX: o._bounds.maxX,
                maxY: o._bounds.maxY
            },
            properties: o.properties,
            position: {
                x: o.x,
                y: o.y
            }
        })), n
    }
    getElementByIndex(r) {
        return this.children.find(i => i instanceof Se && i.properties.index === r)
    }
}
const ya = new se(void 0, ["varying vec2 vTextureCoord;", "uniform float thresholdSensitivity;", "uniform float smoothing;", "uniform vec3 colorToReplace;", "uniform sampler2D uSampler;", "void main() {", "vec4 textureColor = texture2D(uSampler, vTextureCoord);", "float maskY = 0.2989 * colorToReplace.r + 0.5866 * colorToReplace.g + 0.1145 * colorToReplace.b;", "float maskCr = 0.7132 * (colorToReplace.r - maskY);", "float maskCb = 0.5647 * (colorToReplace.b - maskY);", "float Y = 0.2989 * textureColor.r + 0.5866 * textureColor.g + 0.1145 * textureColor.b;", "float Cr = 0.7132 * (textureColor.r - Y);", "float Cb = 0.5647 * (textureColor.b - Y);", "float blendValue = smoothstep(thresholdSensitivity, thresholdSensitivity + smoothing, distance(vec2(Cr, Cb), vec2(maskCr, maskCb)));", "gl_FragColor = vec4(textureColor.rgb, textureColor.a * blendValue);", "}"].join(`
`));
ya.uniforms.thresholdSensitivity = 0;
ya.uniforms.smoothing = .2;
ya.uniforms.colorToReplace = mE(up).rgb();
const Vr = new _t;
class EE {
    constructor(t = {}) {
        this._recursive = typeof t.recursive == "boolean" ? t.recursive : !0, this._toggle = t.toggle || "visible", this._targetList = new Set
    }
    add(t) {
        return this._targetList.add(t), this
    }
    addAll(t) {
        for (let r = 0, i = t.length; r < i; r++) this._targetList.add(t[r]);
        return this
    }
    remove(t) {
        return this._targetList.delete(t), this
    }
    removeAll(t) {
        for (let r = 0, i = t.length; r < i; r++) this._targetList.delete(t[r]);
        return this
    }
    clear() {
        return this._targetList.clear(), this
    }
    cull(t, r = !1) {
        return r || this.uncull(), this._targetList.forEach(i => {
            r || i.getBounds(!1, Vr), this._recursive ? this.cullRecursive(t, i, r) : (r && i._bounds.getRectangle(t), i[this._toggle] = Vr.right > t.left && Vr.left < t.right && Vr.bottom > t.top && Vr.top < t.bottom)
        }), this
    }
    uncull() {
        return this._targetList.forEach(t => {
            this._recursive ? this.uncullRecursive(t) : t[this._toggle] = !1
        }), this
    }
    cullRecursive(t, r, i) {
        const s = i ? r._bounds.getRectangle(Vr) : r.getBounds(!0, Vr);
        if (r[this._toggle] = s.right > t.left && s.left < t.right && s.bottom > t.top && s.top < t.bottom, !(s.left >= t.left && s.top >= t.top && s.right <= t.right && s.bottom <= t.bottom) && r[this._toggle] && r.children && r.children.length) {
            const a = r.children;
            for (let o = 0, h = a.length; o < h; o++) this.cullRecursive(t, a[o])
        }
    }
    uncullRecursive(t) {
        if (t[this._toggle] = !0, t.children && t.children.length) {
            const r = t.children;
            for (let i = 0, s = r.length; i < s; i++) this.uncullRecursive(r[i])
        }
    }
}

function TE() {
    return new Worker("" + new URL("gerber_parser.js",
        import.meta.url).href, {
        type: "module"
    })
}
Ie.canUploadSameBuffer = !0;
class AE extends Ch {
    constructor(r) {
        super(r);
        ue(this, "viewport");
        ue(this, "cull");
        ue(this, "origin");
        ue(this, "cachedGerberGraphics", !0);
        ue(this, "cullDirty", !0);
        ue(this, "outlineMode", !1);
        this.renderer.type == yh.WEBGL ? console.log("Gerber Renderer is using WebGL Canvas") : console.log("Gerber Renderer is using HTML Canvas"), this.viewport = new CE, this.stage.addChild(this.viewport), this.cull = new EE({
            recursive: !0,
            toggle: "renderable"
        }), this.origin = new gr(() => {}, this.viewport, 0, this.renderer.height / this.renderer.resolution)
    }
    changeBackgroundColor(r) {
        this.renderer.background.color = r
    }
    getOrigin() {
        return {
            x: this.origin.x,
            y: this.origin.y
        }
    }
    featuresAtPosition(r, i) {
        let s = [];
        return this.viewport.children.forEach(n => {
            if (n instanceof ds) {
                if (n.visible == !1) return;
                n.children.forEach(a => {
                    a instanceof Jn && (s = s.concat(a.featuresAtPosition(r, i)))
                })
            }
        }), this.cullViewport(!0), s
    }
    cullViewport(r = !1) {
        this.viewport.transform.scale.x < 1 ? this.cachedGerberGraphics || (this.cullDirty = !0, this.cacheViewport()) : this.cachedGerberGraphics && (this.cullDirty = !0, this.uncacheViewport()), this.cachedGerberGraphics !== !0 && (this.cullDirty === !0 || r === !0) && (this.cullDirty = !1, this.cull.cull(this.renderer.screen), setTimeout(() => {
            this.cullDirty = !0
        }, 40))
    }
    cacheViewport() {
        this.cull.uncull(), this.cachedGerberGraphics = !0, this.viewport.children.forEach(async r => {
            r.cacheAsBitmap = !0
        })
    }
    uncacheViewport() {
        this.cachedGerberGraphics = !1, this.viewport.children.forEach(async r => {
            r.cacheAsBitmap = !1
        })
    }
    uncull() {
        this.cull.uncull()
    }
    moveViewport(r, i, s) {
        this.viewport.position.set(r, i), this.viewport.scale.set(s), this.cullViewport()
    }
    resizeViewport(r, i) {
        this.renderer.resize(r, i), this.cullViewport()
    }
    getViewportBounds() {
        return this.viewport.getLocalBounds()
    }
    getRendererBounds() {
        return this.renderer.screen
    }
    tintLayer(r, i) {
        this.uncacheViewport();
        const s = this.viewport.getChildByUID(r);
        s && (s.tint = i), this.cullViewport()
    }
    setLayerOutlineMode(r, i) {
        this.uncacheViewport();
        const s = this.viewport.getChildByUID(r);
        s && (s.outLineMode = i), this.cullViewport()
    }
    setAllOutlineMode(r) {
        this.uncacheViewport(), this.outlineMode = r, this.viewport.children.forEach(i => {
            i instanceof ds && (i.outLineMode = r)
        }), this.cullViewport()
    }
    getLayerTintColor(r) {
        const i = this.viewport.getChildByUID(r);
        return i ? i.tint : 16777215
    }
    showLayer(r) {
        this.uncacheViewport();
        const i = this.viewport.getChildByUID(r);
        i && (i.visible = !0), this.cullViewport()
    }
    hideLayer(r) {
        this.uncacheViewport();
        const i = this.viewport.getChildByUID(r);
        i && (i.visible = !1), this.cullViewport()
    }
    get layers() {
        const r = [];
        return this.viewport.children.forEach(i => {
            i instanceof ds && r.push({
                uid: i.uid,
                name: i.name,
                color: i.tint,
                visible: i.visible,
                zIndex: i.zIndex,
                tools: i.tools
            })
        }), r
    }
    addLayer(r, i, s) {
        const n = new ds({
            image: i,
            position: this.origin,
            name: r,
            uid: s,
            tools: i.tools,
            extract: this.renderer.extract
        });
        n.addChild(new Jn(i, {
            outlineMode: this.outlineMode
        })), n.cacheAsBitmapResolution = 1, n.cacheAsBitmap = this.cachedGerberGraphics, this.viewport.addChild(n), this.cull.addAll(n.children)
    }
    async removeLayer(r) {
        const i = this.viewport.getChildByUID(r);
        i && (this.viewport.removeChild(i), this.cull.removeAll(i.children), i.destroy({
            children: !0
        }))
    }
    async addGerber(r, i, s) {
        const n = new TE,
            a = Xu(n),
            o = await a.parseGerber(i);
        a[$u](), n.terminate(), this.addLayer(r, o, s)
    }
    addViewportListener(r, i) {
        function s() {
            i()
        }
        this.viewport.on(r, s)
    }
    async getLayerFeaturePng(r, i) {
        const s = this.viewport.getChildByUID(r);
        if (s === void 0) throw new Error("Layer not found");
        const n = s.getElementByIndex(i);
        if (n === void 0) throw new Error("Element not found");
        const a = n.cacheAsBitmap,
            o = n.visible;
        n.visible = !0, n.cacheAsBitmap = !1;
        const h = await this.renderer.extract.base64(n, "image/webp", 1);
        return n.visible = o, n.cacheAsBitmap = a, h
    }
    async computeLayerFeaturesHistogram(r) {
        const i = [],
            s = this.viewport.getChildByUID(r);
        if (s === void 0) throw new Error("Layer not found");
        const n = s.tools;
        return s.graphic.children.forEach(o => {
            var h, l, c, f;
            o instanceof Se && i.push({
                dcode: (h = o.properties.shape) == null ? void 0 : h.dcode,
                tool: (l = o.properties.shape) != null && l.dcode ? n[(c = o.properties.shape) == null ? void 0 : c.dcode] : void 0,
                indexes: [o.properties.index],
                polarity: (f = o.properties.shape) == null ? void 0 : f.polarity
            })
        }), i.reduce((o, h) => {
            const l = o.findIndex(c => c.dcode === h.dcode && c.polarity === h.polarity);
            return l === -1 ? o.push(h) : o[l].indexes.push(...h.indexes), o
        }, [])
    }
    destroy(r, i) {
        this.viewport.removeAllListeners(), super.destroy(r, i)
    }
}
class ds extends xe {
    constructor(r) {
        super();
        ue(this, "image");
        ue(this, "name");
        ue(this, "uid");
        ue(this, "tools");
        ue(this, "extract");
        this.image = r.image, this.position = r.position, this.name = r.name, this.uid = r.uid??this.generateUid(), this.tools = r.tools, this.extract = r.extract, this.filters = [new xd(.5)], this.scale = {
            x: 1,
            y: -1
        }, this.interactiveChildren = !1
    }
    addImage(r, i = {}) {
        this.addChild(new Jn(r, i))
    }
    generateUid() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    get tint() {
        return this.children[0].tint
    }
    set tint(r) {
        const i = this.children[0];
        i.tint = r
    }
    set outLineMode(r) {
        let i = this.tint;
        this.removeChildren(), this.addChild(new Jn(this.image, {
            outlineMode: r
        })), this.tint = i
    }
    get graphic() {
        return this.children[0]
    }
    getElementByIndex(r) {
        return this.children[0].getElementByIndex(r)
    }
    async getLayerFeaturePng(r) {
        const i = this.getElementByIndex(r);
        if (i === void 0) throw new Error("Fearure not found");
        const s = i.cacheAsBitmap,
            n = i.visible;
        i.visible = !0, i.cacheAsBitmap = !1;
        const a = await this.extract.base64(i, "image/webp", 1);
        return i.visible = n, i.cacheAsBitmap = s, a
    }
}
class CE extends xe {
    constructor() {
        super()
    }
    getChildByUID(t) {
        let r;
        return this.children.forEach(i => {
            i instanceof ds && i.uid === t && (r = i)
        }), r
    }
}
class SE extends AE {
    constructor(t, r) {
        super({ ...r,
            view: t
        })
    }
}
dh(SE);