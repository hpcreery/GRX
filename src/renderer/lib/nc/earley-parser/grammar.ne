@preprocessor typescript

@{%
import moo from 'moo'
import * as Tree from '../parser/tree'
import * as Constants from '../parser/constants'
const lexer = moo.states({
  main: {
    _: { match: /[ \t\r\n\v\f]+/, lineBreaks: true },
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
%}

@lexer lexer

main -> commands

# commands -> command commands {% ([i,j]) => {return [i,j]} %}
# commands -> command commands {% ([i,j]) => {return [i[0],...j]} %}
# commands -> command {% ([i]) => {return [i[0]]} %}
# commands -> command %_:* comment %_:* commands {% ([i,,c,,j]) => {return [i[0],c,...j]} %}
# commands -> command %_:* comment %_:* {% ([i,,c]) => {return [i[0],c]} %}
commands -> %_:? command %_:? commands {% ([,i,,j]) => {return [i[0],...j]} %}
commands -> %_:? command %_:? {% ([,i,]) => {return [i[0]]} %}
# commands -> %_:? command %_:? {% id %}
command ->
  m48 |
  toolDeclaration |
  units |
  end_header |
  selectTool |
  feed |
  speed |
  m00 |
  m06 |
  m09 |
  m15 |
  m16 |
  m17 |
  m30 |
  m45 |
  m47 |
  m71 |
  m72 |
  g00 |
  g01 |
  g02 |
  g03 |
  g04 |
  g05 |
  g32 |
  g33 |
  g40 |
  g41 |
  g42 |
  g90 |
  g91 |
  g93 |
  drill_hit |


  comment |
  unknown

# comment -> %lparen %commentText:? %endComment:? {% ([,i,]) => {return {type: 'COMMENT', info: i}} %}
# comment -> %semicolon %commentText:? %endComment:? {% ([,i,]) => {return {type: 'COMMENT', info: i}} %}
comment -> %comment {% ([c]) => {return {type: 'COMMENT', info: c.value}} %}

selectTool -> %T {% ([t]) => {return {type: "TOOL_CHANGE", ...t.value}} %}

# toolDeclaration -> selectTool %C %number (feed | speed | retractRate | hitCount | depthOffset):* {% ([selectTool, C, tool, ...params]) => {return {...selectTool, type: 'TOOL_DECLARATION', toolDia: tool.value, params: params[0].map(p => p[0])}} %}
#   feed -> %F %number {% ([f, value]) => {return {type: 'FEED', value: value.value}} %}
#   feed -> %F {% ([f]) => {return {type: 'FEED', value: null}} %}
#   speed -> %S %number {% ([f, value]) => {return {type: 'SPEED', value: value.value}} %}
#   speed -> %S {% ([f]) => {return {type: 'SPEED', value: null}} %}
#   retractRate -> %B %number {% ([f, value]) => {return {type: 'RETRACT_RATE', value: value.value}} %}
#   retractRate -> %B {% ([f]) => {return {type: 'RETRACT_RATE', value: null}} %}
#   hitCount -> %H %number {% ([f, value]) => {return {type: 'HIT_COUNT', value: value.value}} %}
#   hitCount -> %H {% ([f]) => {return {type: 'HIT_COUNT', value: null}} %}
#   depthOffset -> %Z %number {% ([f, value]) => {return {type: 'DEPTH', value: value.value}} %}
#   depthOffset -> %Z {% ([f]) => {return {type: 'DEPTH', value: null}} %}

toolDeclaration -> selectTool %C %number toolParameters {% ([selectTool, C, tool, ...params]) => {return {...selectTool, type: 'TOOL_DECLARATION', toolDia: tool.value, params: params[0].map(p => p[0])}} %}
toolParameters -> null | _toolParameters {% function(d) { return d[0] } %}
_toolParameters -> toolParameter {% function(d) { return d } %}
_toolParameters -> _toolParameters toolParameter {% function(d) { var a = d[0]; a.push(d[1]); return a } %}

toolParameter ->
  feed | speed | retractRate | hitCount | depthOffset


  feed -> %F %number {% ([f, value]) => {return {type: 'FEED', value: value.value}} %}
  feed -> %F {% ([f]) => {return {type: 'FEED', value: null}} %}
  speed -> %S %number {% ([f, value]) => {return {type: 'SPEED', value: value.value}} %}
  speed -> %S {% ([f]) => {return {type: 'SPEED', value: null}} %}
  retractRate -> %B %number {% ([f, value]) => {return {type: 'RETRACT_RATE', value: value.value}} %}
  retractRate -> %B {% ([f]) => {return {type: 'RETRACT_RATE', value: null}} %}
  hitCount -> %H %number {% ([f, value]) => {return {type: 'HIT_COUNT', value: value.value}} %}
  hitCount -> %H {% ([f]) => {return {type: 'HIT_COUNT', value: null}} %}
  depthOffset -> %Z %number {% ([f, value]) => {return {type: 'DEPTH', value: value.value}} %}
  depthOffset -> %Z {% ([f]) => {return {type: 'DEPTH', value: null}} %}


x -> %X %number {% ([x, xValue]) => {return {x: xValue.value}} %}
y -> %Y %number {% ([y, yValue]) => {return {y: yValue.value}} %}
# xy -> x y {% ([x, y]) => {return {...x, ...y}} %}
# xy -> xory xory {% ([x, y]) => {return Object.assign({}, x, y)} %}
xy -> xory:+ {% ([x]) => {return Object.assign({}, ...x)} %}
xory -> %XorY %number {% ([axis, value]) => {return {[axis.value]: value.value}} %}
# xy -> x {% ([x]) => {return {...x, y: null}} %}
# xy -> y {% ([y]) => {return {x: null, ...y}} %}
a -> %A %number {% ([a, aValue]) => {return {a: aValue.value}} %}
i -> %I %number {% ([i, iValue]) => {return {i: iValue.value}} %}
j -> %J %number {% ([j, jValue]) => {return {j: jValue.value}} %}
ij -> i j {% ([i, j]) => {return Object.assign({}, i, j)} %}

drill_hit -> xy {% ([xy]) => {return Object.assign({type: 'DRILL_HIT'}, xy)} %}

units -> %units {% ([u]) => {return {type: 'UNITS', ...u.value}} %}
units -> %units %comma (%leadingZeros | %trailingZeros) {% ([u,,z]) => {return {type: 'UNITS', ...u.value, ...z[0].value}} %}

m00 -> %M00 {% ([]) => {return {type: 'END_PROGRAM', rewind: false}} %}
m06 -> %M06 xy:? {% ([,xy]) => {return {type: 'OPTIONAL_STOP', ...xy}} %}
m09 -> %M09 xy:? {% ([,xy]) => {return {type: 'STOP_FOR_INSPECTION', ...xy}} %}
m15 -> %M15 {% ([]) => {return {type: 'PLUNGE'}} %}
m16 -> %M16 {% ([]) => {return {type: 'RETRACT', pressureFoot: true}} %}
m17 -> %M17 {% ([]) => {return {type: 'RETRACT', pressureFoot: false}} %}
m30 -> %M30 {% ([]) => {return {type: 'END_PROGRAM', rewind: true}} %}
m45 -> %M45 %text %endText:? {% ([,t]) => {return {type: 'LONG_OPERATOR_MESSAGE', text: t.value}} %}
m47 -> %M47 %text %endText:? {% ([,t]) => {return {type: 'OPERATOR_MESSAGE', text: t.value}} %}
m48 -> %M48 {% id %}
m71 -> %M71 {% ([]) => {return {type: 'UNITS', units: 'METRIC'}} %}
m72 -> %M72 {% ([]) => {return {type: 'UNITS', units: 'INCH'}} %}

g00 -> %G00 xy:? {% ([,xy]) => {return Object.assign({type: 'ROUT_MODE'}, xy)} %}
g01 -> %G01 xy:? {% ([,xy]) => {return Object.assign({type: 'LINEAR_MOVE'}, xy)} %}
g02 -> %G02 xy:? (a | ij) {% ([,xy,a]) => {return Object.assign({type: 'CW_MOVE'}, xy, a[0])} %}
g03 -> %G03 xy:? (a | ij) {% ([,xy,a]) => {return Object.assign({type: 'CCW_MOVE'}, xy, a[0])} %}
g04 -> %G04 {% ([]) => {return {type: 'DWELL'}} %}
g05 -> %G05 {% ([]) => {return {type: 'DRILL_MODE'}} %}
g32 -> %G32 xy a {% ([,xy,a]) => {return Object.assign({type: 'CW_CIRCLE'}, xy, a)} %}
g33 -> %G33 xy a {% ([,xy,a]) => {return Object.assign({type: 'CCW_CIRCLE'}, xy, a)} %}
g40 -> %G40 {% ([]) => {return {type: 'CUTTER_COMP_OFF'}} %}
g41 -> %G41 {% ([]) => {return {type: 'CUTTER_COMP_LEFT'}} %}
g42 -> %G42 {% ([]) => {return {type: 'CUTTER_COMP_RIGHT'}} %}
g90 -> %G90 {% ([]) => {return {type: 'ABSOLUTE'}} %}
g91 -> %G91 {% ([]) => {return {type: 'INCREMENTAL'}} %}
g93 -> %G93 xy:? {% ([,xy]) => {return Object.assign({type: 'ZERO_SET'}, xy)} %}

end_header -> %percent {% ([]) => {return {type: 'END_HEADER'}} %}

unknown -> %unknown {% id %}

# {% ([]) => {return {type: ''}} %}
