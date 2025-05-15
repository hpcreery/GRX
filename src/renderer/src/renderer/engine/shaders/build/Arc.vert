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
uniform vec2 u_Resolution;
uniform float u_IndexOffset;
uniform float u_PixelSize;
uniform bool u_QueryMode;

// COMMON ATTRIBUTES
attribute vec2 a_Vertex_Position;

// COMMON VARYINGS
varying float v_Aspect;

// ARC ATTRIBUTES
attribute float a_Index;
attribute vec2 a_Start_Location;
attribute vec2 a_End_Location;
attribute vec2 a_Center_Location;
attribute float a_SymNum;
attribute float a_Polarity;
attribute float a_Clockwise;

// ARC VARYINGS
varying float v_Index;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying vec2 v_Center_Location;
varying float v_SymNum;
varying float v_Polarity;
varying float v_Clockwise;

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
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  float Aspect = u_Resolution.y / u_Resolution.x;

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height));

  vec2 ShapeSize = vec2(OD, OD) + vec2(pixel_size, pixel_size);
  // vec2 ShapeSize = vec2(pullSymbolParameter(u_Parameters.outer_dia, int(a_SymNum)), pullSymbolParameter(u_Parameters.outer_dia, int(a_SymNum)));

  float radius = distance(a_Start_Location, a_Center_Location);
  float radius2 = distance(a_End_Location, a_Center_Location);
  vec2 Size = vec2(radius * 2.0, radius * 2.0) + ShapeSize;

  float dX = a_Start_Location.x - a_End_Location.x;
  float dY = a_Start_Location.y - a_End_Location.y;
  float Rotation = atan(dY, dX);

  float angle_dot = acos(dot(normalize(a_Start_Location - a_Center_Location), normalize(a_End_Location - a_Center_Location)));
  if (a_Start_Location == a_End_Location) {
    angle_dot = 2.0 * PI;
  }
  vec3 cross_prod = cross(vec3(a_Start_Location - a_Center_Location, 0), vec3(a_End_Location - a_Center_Location, 0));
  float cw = sign(cross_prod.z);

  float Sagitta = radius * (1.0 - cos((angle_dot / 2.0)));
  float Width = length(a_Start_Location - a_End_Location);
  if (a_Start_Location == a_End_Location) {
    Width = radius * 2.0;
  }
  if (cw == -1.0 && a_Clockwise == 0.0 ) {
    Sagitta = radius * (1.0 + cos((angle_dot / 2.0)));
    Width = radius * 2.0;
  }
  if (cw == 1.0 && a_Clockwise == 1.0) {
    Sagitta = radius * (1.0 + cos((angle_dot / 2.0)));
    Width = radius * 2.0;
  }

  Size = vec2(Width, Sagitta) + (ShapeSize * 2.0);
  // Size += vec2(pixel_size * 4.0, pixel_size * 4.0);

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0) + vec2(0.0, (a_Clockwise == 0.0 ? 1.0 : -1.0) * (radius - (Sagitta / 2.0)));
  vec2 RotatedPostion = SizedPosition * rotateCW(Rotation);
  vec2 OffsetPosition = RotatedPostion + a_Center_Location;
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition, 1);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Start_Location = a_Start_Location;
  v_End_Location = a_End_Location;
  v_Polarity = a_Polarity;
  v_Center_Location = a_Center_Location;
  v_Clockwise = a_Clockwise;

  if (u_QueryMode) {
    FinalPosition.xy = ((((a_Vertex_Position + vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x))) / u_Resolution) * 2.0) - vec2(1.0,1.0));
  }

  float Index = u_IndexOffset + (a_Index / u_QtyFeatures);
  gl_Position = vec4(FinalPosition.xy, Index, 1);
}
