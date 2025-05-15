precision highp float;
#define GLSLIFY 1

//For NASA JPL's highest accuracy calculations, which are for interplanetary navigation, we use 3.141592653589793.
#define PI 3.1415926535//897932384626433832795
#define DEBUG 0
#define ALPHA 1.0

struct Shapes {
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
  float Rectangle_Donut;
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
  // float Moire;
  float MoireODB;
  float MoireGerber;
  float Hole;
  float Null;
  float Polygon;
};

uniform Shapes u_Shapes;

struct Parameters {
  // highp int type;
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
};
uniform Parameters u_Parameters;

// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Polarity;
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;

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
varying float v_ResizeFactor;

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

float pullSymbolParameter(int offset, int SymNum) {
  vec2 texcoord = (vec2(float(offset), SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

// #pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
// Here we can redefine drawShape with a much smaller footprint to improve comiling performance. Limiting arcs to only be drawn with circles.
float drawShape(vec2 FragCoord, int SymNum) {

  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, SymNum);

  float dist = 10.0;

  if (t_Symbol == u_Shapes.Round || t_Symbol == u_Shapes.Hole) {
    dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
  } else {
    dist = 1.0;
  }
  return dist;
}

//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist, float pixel_size) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > pixel_size / 2.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -pixel_size / 2.0) {
    discard;
  }
  return dist;
}

float arcDistance(vec2 FragCoord) {
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height));

  // ? radius can be different bewtween these two
  float radius = distance(v_Start_Location, v_Center_Location);
  float radius2 = distance(v_End_Location, v_Center_Location);

  float sdX = v_Start_Location.x - v_Center_Location.x;
  float sdY = v_Start_Location.y - v_Center_Location.y;
  float start_angle = atan(sdY, sdX);
  float edX = v_End_Location.x - v_Center_Location.x;
  float edY = v_End_Location.y - v_Center_Location.y;
  float end_angle = atan(edY, edX);

  float start = drawShape(translate(FragCoord, (v_Start_Location - v_Center_Location)) * rotateCW(-start_angle), int(v_SymNum));
  float end = drawShape(translate(FragCoord, (v_End_Location - v_Center_Location)) * rotateCW(-end_angle), int(v_SymNum));
  float con = (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
  con = substract(con, abs(circleDist(FragCoord, radius)) - OD / 2.0);
  float dist = merge(start, end);
  dist = merge(dist, con);
  return dist;
}

vec2 transfromLocation(vec2 pixel_location) {
  vec2 normal_coord = ((pixel_location.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = u_InverseTransform * vec3(normal_coord, 1.0);
  vec2 offset_postition = transformed_position.xy - v_Center_Location;
  vec2 true_coord = offset_postition;
  return true_coord;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = ALPHA * max(float(u_OutlineMode), polarity);

  vec2 FragCoord = transfromLocation(gl_FragCoord.xy);
  float dist = arcDistance(FragCoord);

  if (u_QueryMode) {
    vec2 PointerPosition = transfromLocation(u_PointerPosition);
    float PointerDist = arcDistance(PointerPosition);

    if (PointerDist < pixel_size) {
      if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
      } else {
        discard;
      }
    } else {
      discard;
    }
  }

  // This module shall be imported in the main method of a fragment shader. It provides a function to render a signed distance field.

  if (DEBUG == 1) {
    float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
    float pixel_size = u_PixelSize / scale;
    vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-3.0*abs(dist * 0.01 / pixel_size));
    col *= 0.8 + 0.25*cos(dist / pixel_size);
    // col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,u_PixelSize,abs(dist)) );
    if (dist < 0.0 && dist > -pixel_size) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  dist = draw(dist, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
