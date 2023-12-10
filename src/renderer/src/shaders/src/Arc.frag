precision mediump float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;


// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;

// COMMON VARYINGS
varying float v_Aspect;

// ARC VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying vec2 v_Center_Location;
varying float v_Polarity;
varying float v_Clockwise;

const float ALPHA = 1.0;

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////


float merge(float d1, float d2) {
  return min(d1, d2);
}

float substract(float d1, float d2) {
  return max(-d1, d2);
}


//////////////////////////////
// Rotation and translation //
//////////////////////////////

vec2 rotateCCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  return p * m;
}

vec2 rotateCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  return p * m;
}

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec2 translate(vec2 p, vec2 t) {
  return p - t;
}

//////////////////////////////
// Distance field functions //
//////////////////////////////

float pie(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float sdPie(in vec2 p, in float angle, in float radius) {
  vec2 c = vec2(sin(angle), cos(angle));
  p.x = abs(p.x);
  float l = length(p) - radius;
  float m = length(p - c * clamp(dot(p, c), 0.0, radius));
  return max(l, m * sign(c.y * p.x - c.x * p.y));
}

float slice(in vec2 p, in float angle) {
  vec2 c = vec2(cos(angle), sin(angle));
  //p.x = abs(p.x);
  p.y = abs(p.y);
  float n = length(p - c * dot(p, c));
  return n * sign(c.y * p.x - c.x * p.y);
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist) {
  if (dist > 0.0) {
    discard;
  }
  float scale = u_InverseTransform[0][0];
  if (dist * float(u_OutlineMode) < -scale * u_PixelSize) {
    discard;
  }
  return dist;
}

void main() {

  float scale = u_InverseTransform[0][0];

  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - v_Center_Location;
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  vec2 FragCoord = OffsetPosition;

  // vec3 color = vec3(1.0);
  vec3 color = u_Color * max(float(u_OutlineMode), v_Polarity);
  float Alpha = ALPHA * max(float(u_OutlineMode), v_Polarity);

  // ? which one to go by for line width...
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));

  // ? radius can be different bewtween these two
  float radius = distance(v_Start_Location, v_Center_Location);
  float radius2 = distance(v_End_Location, v_Center_Location);

  float angle_between_vectors = acos(dot(normalize(v_Start_Location - v_Center_Location), normalize(v_End_Location - v_Center_Location)));

  float sdX = v_Start_Location.x - v_Center_Location.x;
  float sdY = v_Start_Location.y - v_Center_Location.y;
  float start_angle = atan(sdY, sdX);
  float edX = v_End_Location.x - v_Center_Location.x;
  float edY = v_End_Location.y - v_Center_Location.y;
  float end_angle = atan(edY, edX);

  float start = drawShape(translate(FragCoord, (v_Start_Location - v_Center_Location)) * rotateCW(-start_angle), int(v_SymNum));
  float end = drawShape(translate(FragCoord, (v_End_Location - v_Center_Location)) * rotateCW(-end_angle), int(v_SymNum));
  // float con = boxDist(FragCoord * rotateCW(-angle), vec2(len, t_Width));
  // vec2 p, float radius, float angle, float width
  float con = (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
  con = substract(con, abs(circleDist(FragCoord, radius)) - t_Width / 2.0);
  float dist = merge(start, end);
  dist = merge(dist, con);

  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist);

  gl_FragColor = vec4(color, Alpha);
}
