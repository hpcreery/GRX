precision mediump float;

#define PI 3.1415926535897932384626433832795
#define DEBUG 0

uniform struct shapes {
  float Round;
  float Square;
  float Rectangle;
  float Rounded_Rectangle;
  float Chamfered_Rectangle;
  float Oval;
  float Diamond;
  float Octagon;
  float Round_Donut;
  float Square_Donut;
  float SquareRound_Donut;
  float Rounded_Square_Donut;
  float Rectange_Donut;
  float Rounded_Rectangle_Donut;
  float Oval_Donut;
  float Horizontal_Hexagon;
  float Vertical_Hexagon;
  float Butterfly;
  float Square_Butterfly;
  float Triangle;
  float Half_Oval;
  float Rounded_Round_Thermal;
  float Squared_Round_Thermal;
  float Square_Thermal;
  float Open_Corners_Square_Thermal;
  float Line_Thermal;
  float Square_Round_Thermal;
  float Rectangular_Thermal;
  float Rectangular_Thermal_Open_Corners;
  float Rounded_Square_Thermal;
  float Rounded_Square_Thermal_Open_Corners;
  float Rounded_Rectangular_Thermal;
  float Oval_Thermal;
  float Oblong_Thermal;
  // float Home_Plate;
  // float Inverted_Home_Plate;
  // float Flat_Home_Plate;
  // float Radiused_Inverted_Home_Plate;
  // float Radiused_Home_Plate;
  // float Cross;
  // float Dogbone;
  // float DPack;
  float Ellipse;
  float Moire;
  float Hole;
  float Null;
} u_Shapes;

uniform struct parameters {
  highp int symbol;
  highp int width;
  highp int height;
  highp int corner_radius;
  highp int corners;
  highp int outer_dia;
  highp int inner_dia;
  highp int line_width;
  highp int line_length;
  highp int angle;
  highp int gap;
  highp int num_spokes;
  highp int round;
  highp int cut_size;
  highp int ring_width;
  highp int ring_gap;
  highp int num_rings;
} u_Parameters;


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

// //////////////////////////////////////
// // Combine distance field functions //
// //////////////////////////////////////

// float smoothMerge(float d1, float d2, float k) {
//   float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
//   return mix(d2, d1, h) - k * h * (1.0 - h);
// }

float merge(float d1, float d2) {
  return min(d1, d2);
}

// float mergeExclude(float d1, float d2) {
//   return min(max(-d1, d2), max(-d2, d1));
// }

float substract(float d1, float d2) {
  return max(-d1, d2);
}

// float intersect(float d1, float d2) {
//   return max(d1, d2);
// }

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

// //////////////////////////////
// // Distance field functions //
// //////////////////////////////

// float pie(vec2 p, float angle) {
//   angle = radians(angle) / 2.0;
//   vec2 n = vec2(cos(angle), sin(angle));
//   return abs(p).x * n.x + p.y * n.y;
// }

// float sdPie(in vec2 p, in float angle, in float radius) {
//   vec2 c = vec2(sin(angle), cos(angle));
//   p.x = abs(p.x);
//   float l = length(p) - radius;
//   float m = length(p - c * clamp(dot(p, c), 0.0, radius));
//   return max(l, m * sign(c.y * p.x - c.x * p.y));
// }

// // float slice(in vec2 p, in float angle) {
// //   vec2 c = vec2(sin(angle), cos(angle));
// //   p.x = abs(p.x);
// //   float n = length(p - c * dot(p, c));
// //   return n * sign(c.y * p.x - c.x * p.y);
// // }
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
#pragma glslify: drawShape = require('../modules/Shapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions,PI=PI,DEBUG=DEBUG)


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

float atan2(in float y, in float x) {
  bool s = (abs(x) > abs(y));
  return mix(PI / 2.0 - atan(x, y), atan(y, x), float(s));
}

float atan2(vec2 dir) {
  float angle = asin(dir.x) > 0.0 ? acos(dir.y) : -acos(dir.y);
  return angle;
}

void main() {

  // gl_FragColor = vec4(1.0,1.0,1.0, 1.0);
  // return;

  float scale = u_InverseTransform[0][0];

  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - v_Center_Location;
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


  if (DEBUG == 1) {
    // if(dist < 0.0 && dist > -u_PixelSize * scale) {
    //   dist = 1.0;
    // }
    // gl_FragColor = vec4(-dist, dist, dist, 1.0);
    vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-6.0 * abs(dist));
    col *= 0.8 + 0.5 * cos(500.0 * dist);
    // col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, u_PixelSize * scale, abs(dist)));
    if (dist < 0.0 && dist > -u_PixelSize * scale) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
    return;
  }
  dist = draw(dist);
  gl_FragColor = vec4(color, Alpha);
}
