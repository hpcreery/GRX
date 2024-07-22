// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var _: any;
declare var comment: any;
declare var T: any;
declare var C: any;
declare var number: any;
declare var F: any;
declare var S: any;
declare var B: any;
declare var H: any;
declare var Z: any;
declare var X: any;
declare var Y: any;
declare var XorY: any;
declare var A: any;
declare var I: any;
declare var J: any;
declare var units: any;
declare var comma: any;
declare var leadingZeros: any;
declare var trailingZeros: any;
declare var M00: any;
declare var M06: any;
declare var M09: any;
declare var M15: any;
declare var M16: any;
declare var M17: any;
declare var M30: any;
declare var M45: any;
declare var text: any;
declare var endText: any;
declare var M47: any;
declare var M48: any;
declare var M71: any;
declare var M72: any;
declare var G00: any;
declare var G01: any;
declare var G02: any;
declare var G03: any;
declare var G04: any;
declare var G05: any;
declare var G32: any;
declare var G33: any;
declare var G40: any;
declare var G41: any;
declare var G42: any;
declare var G90: any;
declare var G91: any;
declare var G93: any;
declare var percent: any;
declare var unknown: any;

import moo from 'moo'
import * as Tree from '../parser/tree'
import * as Constants from '../parser/constants'
const lexer = moo.states({
  main: {
    _: { match: /[ \t\r\n\v\f]/, lineBreaks: true },
    number: /[+-]?(?:\d+\.?(?:\d+)?|\.\d+)/,

    units: { match: /METRIC|INCH/, value: v => {return {unit: v}} },
    trailingZeros: { match: /TZ/, value: v => {return {trailingZeros: true}} },
    leadingZeros: { match: /LZ/, value: v => {return {leadingZeros: true}} },

    // Tool Codes
    T: { match: /T\d{1,2}(?:\d{1,2})?/, value: v => {return {code: v.slice(1,3), index: v.slice(3,5) || null}} },
    F: 'F',
    S: 'S',
    C: 'C',
    B: 'B',
    H: 'H',
    Z: 'Z',

    // Axis Codes
    // XorY: { match: /(?:[XY][+-]?(?:\d+\.?(?:\d+)?|\.\d+)){1,2}/, value: v => {return {axis: v}} },
    XorY: /X|Y/,
    // X: 'X',
    // Y: 'Y',
    A: 'A',
    I: 'I',
    J: 'J',

    // M Codes
    M00: 'M00',
    M06: 'M06',
    M09: 'M09',
    M15: 'M15',
    M16: 'M16',
    M17: 'M17',
    M30: 'M30',
    M45: {match: 'M45', push: 'text'},
    M47: {match: 'M47', push: 'text'},
    M48: 'M48',
    M71: 'M71',
    M72: 'M72',

    // G Codes
    G00: 'G00',
    G01: 'G01',
    G02: 'G02',
    G03: 'G03',
    G04: 'G04',
    G05: 'G05',
    G32: 'G32',
    G33: 'G33',
    G40: 'G40',
    G41: 'G41',
    G42: 'G42',
    G90: 'G90',
    G91: 'G91',
    G93: 'G93',

    percent: '%',
    comma: ',',

    comment: {match: /[\(;][^\)\r?\n]*\)?/, value: v => {return v.split(/\;|\(\)/).join('')}},
    lparen: {match: '(', push: 'comment'},
    rparen: ')',
    semicolon: {match: ';', push: 'comment'},
    space: { match: /\s+/, lineBreaks: true },
    unknown: /.+/,
  },
  comment: {
    commentText: /[^\)\r?\n]+/,
    endComment: { match: /(?:\r?\n|\))/, lineBreaks: true, pop: 1 },
  },
  text: {
    text: { match: /[^\r?\n]+/, lineBreaks: true },
    endText: { match: /(?:\r?\n)/, lineBreaks: true, pop: 1 },
  },
  // longText: {
  //   text: { match: /[^\\]+/, lineBreaks: true },
  //   endText: { match: /(?:\\)/, lineBreaks: true, pop: 1 },
  // },
});

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "main", "symbols": ["commands"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("_") ? {type: "_"} : _)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": () => null},
    {"name": "commands", "symbols": ["_", "command", "_", "commands"], "postprocess": ([,i,,j]) => {return [i[0],...j]}},
    {"name": "commands", "symbols": ["_", "command", "_"], "postprocess": ([,i,]) => {return [i[0]]}},
    {"name": "command", "symbols": ["m48"]},
    {"name": "command", "symbols": ["toolDeclaration"]},
    {"name": "command", "symbols": ["units"]},
    {"name": "command", "symbols": ["end_header"]},
    {"name": "command", "symbols": ["selectTool"]},
    {"name": "command", "symbols": ["feed"]},
    {"name": "command", "symbols": ["speed"]},
    {"name": "command", "symbols": ["m00"]},
    {"name": "command", "symbols": ["m06"]},
    {"name": "command", "symbols": ["m09"]},
    {"name": "command", "symbols": ["m15"]},
    {"name": "command", "symbols": ["m16"]},
    {"name": "command", "symbols": ["m17"]},
    {"name": "command", "symbols": ["m30"]},
    {"name": "command", "symbols": ["m45"]},
    {"name": "command", "symbols": ["m47"]},
    {"name": "command", "symbols": ["m71"]},
    {"name": "command", "symbols": ["m72"]},
    {"name": "command", "symbols": ["g00"]},
    {"name": "command", "symbols": ["g01"]},
    {"name": "command", "symbols": ["g02"]},
    {"name": "command", "symbols": ["g03"]},
    {"name": "command", "symbols": ["g04"]},
    {"name": "command", "symbols": ["g05"]},
    {"name": "command", "symbols": ["g32"]},
    {"name": "command", "symbols": ["g33"]},
    {"name": "command", "symbols": ["g40"]},
    {"name": "command", "symbols": ["g41"]},
    {"name": "command", "symbols": ["g42"]},
    {"name": "command", "symbols": ["g90"]},
    {"name": "command", "symbols": ["g91"]},
    {"name": "command", "symbols": ["g93"]},
    {"name": "command", "symbols": ["drill_hit"]},
    {"name": "command", "symbols": ["comment"]},
    {"name": "command", "symbols": ["unknown"]},
    {"name": "comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": ([c]) => {return {type: 'COMMENT', info: c.value}}},
    {"name": "selectTool", "symbols": [(lexer.has("T") ? {type: "T"} : T)], "postprocess": ([t]) => {return {type: "TOOL_CHANGE", ...t.value}}},
    {"name": "toolDeclaration", "symbols": ["selectTool", (lexer.has("C") ? {type: "C"} : C), (lexer.has("number") ? {type: "number"} : number), "toolParameters"], "postprocess": ([selectTool, C, tool, ...params]) => {return {...selectTool, type: 'TOOL_DECLARATION', toolDia: tool.value, params: params[0].map(p => p[0])}}},
    {"name": "toolParameters", "symbols": []},
    {"name": "toolParameters", "symbols": ["_toolParameters"], "postprocess": function(d) { return d[0] }},
    {"name": "_toolParameters", "symbols": ["toolParameter"], "postprocess": function(d) { return d }},
    {"name": "_toolParameters", "symbols": ["_toolParameters", "toolParameter"], "postprocess": function(d) { var a = d[0]; a.push(d[1]); return a }},
    {"name": "toolParameter", "symbols": ["feed"]},
    {"name": "toolParameter", "symbols": ["speed"]},
    {"name": "toolParameter", "symbols": ["retractRate"]},
    {"name": "toolParameter", "symbols": ["hitCount"]},
    {"name": "toolParameter", "symbols": ["depthOffset"]},
    {"name": "feed", "symbols": [(lexer.has("F") ? {type: "F"} : F), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([f, value]) => {return {type: 'FEED', value: value.value}}},
    {"name": "feed", "symbols": [(lexer.has("F") ? {type: "F"} : F)], "postprocess": ([f]) => {return {type: 'FEED', value: null}}},
    {"name": "speed", "symbols": [(lexer.has("S") ? {type: "S"} : S), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([f, value]) => {return {type: 'SPEED', value: value.value}}},
    {"name": "speed", "symbols": [(lexer.has("S") ? {type: "S"} : S)], "postprocess": ([f]) => {return {type: 'SPEED', value: null}}},
    {"name": "retractRate", "symbols": [(lexer.has("B") ? {type: "B"} : B), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([f, value]) => {return {type: 'RETRACT_RATE', value: value.value}}},
    {"name": "retractRate", "symbols": [(lexer.has("B") ? {type: "B"} : B)], "postprocess": ([f]) => {return {type: 'RETRACT_RATE', value: null}}},
    {"name": "hitCount", "symbols": [(lexer.has("H") ? {type: "H"} : H), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([f, value]) => {return {type: 'HIT_COUNT', value: value.value}}},
    {"name": "hitCount", "symbols": [(lexer.has("H") ? {type: "H"} : H)], "postprocess": ([f]) => {return {type: 'HIT_COUNT', value: null}}},
    {"name": "depthOffset", "symbols": [(lexer.has("Z") ? {type: "Z"} : Z), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([f, value]) => {return {type: 'DEPTH', value: value.value}}},
    {"name": "depthOffset", "symbols": [(lexer.has("Z") ? {type: "Z"} : Z)], "postprocess": ([f]) => {return {type: 'DEPTH', value: null}}},
    {"name": "x", "symbols": [(lexer.has("X") ? {type: "X"} : X), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([x, xValue]) => {return {x: xValue.value}}},
    {"name": "y", "symbols": [(lexer.has("Y") ? {type: "Y"} : Y), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([y, yValue]) => {return {y: yValue.value}}},
    {"name": "xy", "symbols": ["xory", "xory"], "postprocess": ([x, y]) => {return Object.assign({}, x, y)}},
    {"name": "xory", "symbols": [(lexer.has("XorY") ? {type: "XorY"} : XorY), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([axis, value]) => {return {[axis.value]: value.value}}},
    {"name": "a", "symbols": [(lexer.has("A") ? {type: "A"} : A), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([a, aValue]) => {return {a: aValue.value}}},
    {"name": "i", "symbols": [(lexer.has("I") ? {type: "I"} : I), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([i, iValue]) => {return {i: iValue.value}}},
    {"name": "j", "symbols": [(lexer.has("J") ? {type: "J"} : J), (lexer.has("number") ? {type: "number"} : number)], "postprocess": ([j, jValue]) => {return {j: jValue.value}}},
    {"name": "ij", "symbols": ["i", "j"], "postprocess": ([i, j]) => {return Object.assign({}, i, j)}},
    {"name": "drill_hit", "symbols": ["xy"], "postprocess": ([xy]) => {return Object.assign({type: 'DRILL_HIT'}, xy)}},
    {"name": "units", "symbols": [(lexer.has("units") ? {type: "units"} : units)], "postprocess": ([u]) => {return {type: 'UNITS', ...u.value}}},
    {"name": "units$subexpression$1", "symbols": [(lexer.has("leadingZeros") ? {type: "leadingZeros"} : leadingZeros)]},
    {"name": "units$subexpression$1", "symbols": [(lexer.has("trailingZeros") ? {type: "trailingZeros"} : trailingZeros)]},
    {"name": "units", "symbols": [(lexer.has("units") ? {type: "units"} : units), (lexer.has("comma") ? {type: "comma"} : comma), "units$subexpression$1"], "postprocess": ([u,,z]) => {return {type: 'UNITS', ...u.value, ...z[0].value}}},
    {"name": "m00", "symbols": [(lexer.has("M00") ? {type: "M00"} : M00)], "postprocess": ([]) => {return {type: 'END_PROGRAM', rewind: false}}},
    {"name": "m06$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "m06$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "m06", "symbols": [(lexer.has("M06") ? {type: "M06"} : M06), "m06$ebnf$1"], "postprocess": ([,xy]) => {return {type: 'OPTIONAL_STOP', ...xy}}},
    {"name": "m09$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "m09$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "m09", "symbols": [(lexer.has("M09") ? {type: "M09"} : M09), "m09$ebnf$1"], "postprocess": ([,xy]) => {return {type: 'STOP_FOR_INSPECTION', ...xy}}},
    {"name": "m15", "symbols": [(lexer.has("M15") ? {type: "M15"} : M15)], "postprocess": ([]) => {return {type: 'PLUNGE'}}},
    {"name": "m16", "symbols": [(lexer.has("M16") ? {type: "M16"} : M16)], "postprocess": ([]) => {return {type: 'RETRACT', pressureFoot: true}}},
    {"name": "m17", "symbols": [(lexer.has("M17") ? {type: "M17"} : M17)], "postprocess": ([]) => {return {type: 'RETRACT', pressureFoot: false}}},
    {"name": "m30", "symbols": [(lexer.has("M30") ? {type: "M30"} : M30)], "postprocess": ([]) => {return {type: 'END_PROGRAM', rewind: true}}},
    {"name": "m45$ebnf$1", "symbols": [(lexer.has("endText") ? {type: "endText"} : endText)], "postprocess": id},
    {"name": "m45$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "m45", "symbols": [(lexer.has("M45") ? {type: "M45"} : M45), (lexer.has("text") ? {type: "text"} : text), "m45$ebnf$1"], "postprocess": ([,t]) => {return {type: 'LONG_OPERATOR_MESSAGE', text: t.value}}},
    {"name": "m47$ebnf$1", "symbols": [(lexer.has("endText") ? {type: "endText"} : endText)], "postprocess": id},
    {"name": "m47$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "m47", "symbols": [(lexer.has("M47") ? {type: "M47"} : M47), (lexer.has("text") ? {type: "text"} : text), "m47$ebnf$1"], "postprocess": ([,t]) => {return {type: 'OPERATOR_MESSAGE', text: t.value}}},
    {"name": "m48", "symbols": [(lexer.has("M48") ? {type: "M48"} : M48)], "postprocess": id},
    {"name": "m71", "symbols": [(lexer.has("M71") ? {type: "M71"} : M71)], "postprocess": ([]) => {return {type: 'UNITS', units: 'METRIC'}}},
    {"name": "m72", "symbols": [(lexer.has("M72") ? {type: "M72"} : M72)], "postprocess": ([]) => {return {type: 'UNITS', units: 'INCH'}}},
    {"name": "g00$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "g00$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "g00", "symbols": [(lexer.has("G00") ? {type: "G00"} : G00), "g00$ebnf$1"], "postprocess": ([,xy]) => {return Object.assign({type: 'ROUT_MODE'}, xy)}},
    {"name": "g01$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "g01$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "g01", "symbols": [(lexer.has("G01") ? {type: "G01"} : G01), "g01$ebnf$1"], "postprocess": ([,xy]) => {return Object.assign({type: 'LINEAR_MOVE'}, xy)}},
    {"name": "g02$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "g02$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "g02$subexpression$1", "symbols": ["a"]},
    {"name": "g02$subexpression$1", "symbols": ["ij"]},
    {"name": "g02", "symbols": [(lexer.has("G02") ? {type: "G02"} : G02), "g02$ebnf$1", "g02$subexpression$1"], "postprocess": ([,xy,a]) => {return Object.assign({type: 'CW_MOVE'}, xy, a[0])}},
    {"name": "g03$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "g03$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "g03$subexpression$1", "symbols": ["a"]},
    {"name": "g03$subexpression$1", "symbols": ["ij"]},
    {"name": "g03", "symbols": [(lexer.has("G03") ? {type: "G03"} : G03), "g03$ebnf$1", "g03$subexpression$1"], "postprocess": ([,xy,a]) => {return Object.assign({type: 'CCW_MOVE'}, xy, a[0])}},
    {"name": "g04", "symbols": [(lexer.has("G04") ? {type: "G04"} : G04)], "postprocess": ([]) => {return {type: 'DWELL'}}},
    {"name": "g05", "symbols": [(lexer.has("G05") ? {type: "G05"} : G05)], "postprocess": ([]) => {return {type: 'DRILL_MODE'}}},
    {"name": "g32", "symbols": [(lexer.has("G32") ? {type: "G32"} : G32), "xy", "a"], "postprocess": ([,xy,a]) => {return Object.assign({type: 'CW_CIRCLE'}, xy, a)}},
    {"name": "g33", "symbols": [(lexer.has("G33") ? {type: "G33"} : G33), "xy", "a"], "postprocess": ([,xy,a]) => {return Object.assign({type: 'CCW_CIRCLE'}, xy, a)}},
    {"name": "g40", "symbols": [(lexer.has("G40") ? {type: "G40"} : G40)], "postprocess": ([]) => {return {type: 'CUTTER_COMP_OFF'}}},
    {"name": "g41", "symbols": [(lexer.has("G41") ? {type: "G41"} : G41)], "postprocess": ([]) => {return {type: 'CUTTER_COMP_LEFT'}}},
    {"name": "g42", "symbols": [(lexer.has("G42") ? {type: "G42"} : G42)], "postprocess": ([]) => {return {type: 'CUTTER_COMP_RIGHT'}}},
    {"name": "g90", "symbols": [(lexer.has("G90") ? {type: "G90"} : G90)], "postprocess": ([]) => {return {type: 'ABSOLUTE'}}},
    {"name": "g91", "symbols": [(lexer.has("G91") ? {type: "G91"} : G91)], "postprocess": ([]) => {return {type: 'INCREMENTAL'}}},
    {"name": "g93$ebnf$1", "symbols": ["xy"], "postprocess": id},
    {"name": "g93$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "g93", "symbols": [(lexer.has("G93") ? {type: "G93"} : G93), "g93$ebnf$1"], "postprocess": ([,xy]) => {return Object.assign({type: 'ZERO_SET'}, xy)}},
    {"name": "end_header", "symbols": [(lexer.has("percent") ? {type: "percent"} : percent)], "postprocess": ([]) => {return {type: 'END_HEADER'}}},
    {"name": "unknown", "symbols": [(lexer.has("unknown") ? {type: "unknown"} : unknown)], "postprocess": id}
  ],
  ParserStart: "main",
};

export default grammar;
