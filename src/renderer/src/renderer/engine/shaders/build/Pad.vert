precision highp float;
#define GLSLIFY 1

#define PI 3.1415926535897932384626433832795
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
uniform vec2 u_Resolution;
uniform float u_IndexOffset;

// COMMON ATTRIBUTES
attribute vec2 a_Vertex_Position;

// COMMON VARYINGS
varying float v_Aspect;

// PAD ATTRIBUTES
attribute float a_Index;
attribute vec2 a_Location;
attribute float a_SymNum;
attribute float a_ResizeFactor;
attribute float a_Polarity;
attribute float a_Rotation;
attribute float a_Mirror;

// PAD VARYINGS
varying float v_Index;
varying vec2 v_Location;
varying float v_SymNum;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror;

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

float pullSymbolParameter(int offset, int SymNum) {
  vec2 texcoord = (vec2(float(offset), SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 Size = vec2(pullSymbolParameter(u_Parameters.width, int(a_SymNum)), pullSymbolParameter(u_Parameters.height, int(a_SymNum)));

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0) * a_ResizeFactor;
  vec2 RotatedPostion = SizedPosition * rotateCW(radians(a_Rotation));
  vec2 OffsetPosition = RotatedPostion + a_Location;
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition.x, OffsetPosition.y, 1);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Location = a_Location;
  v_Rotation = a_Rotation;
  v_Mirror = a_Mirror;
  v_Polarity = a_Polarity;
  v_ResizeFactor = a_ResizeFactor;

  float Index = u_IndexOffset / u_QtyFeatures + a_Index / u_QtyFeatures;

  gl_Position = vec4(FinalPosition.xy, Index, 1);
  // gl_Position = vec4(clamp(FinalPosition.xy, vec2(-1.0, -1.0), vec2(1.0, 1.0)), a_Index / u_QtyFeatures, 1);

}
