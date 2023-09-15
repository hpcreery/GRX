precision mediump float;

#define PI 3.1415926535897932384626433832795

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
  float Open_Cornders_Square_Thermal;
  float Line_Thermal;
  float Square_Round_Thermal;
  float Rectangular_Thermal;
  float Rectangular_thermal_Open_Corners;
  float Rounded_Square_Thermal;
  float Rounded_Square_Thermal_Open_Corners;
  float Rounded_Rectangular_Thermal;
  float Oval_Thermal;
  float Oblong_Thermal;
  float Home_Plate;
  float Inverted_Home_Plate;
  float Flat_Home_Plate;
  float Radiused_Inverted_Home_Plate;
  float Radiused_Home_Plate;
  float Cross;
  float Dogbone;
  float DPack;
  float Ellipse;
  float Moire;
} u_Shapes;

uniform struct parameters {
  int symbol;
  int width;
  int height;
  int corner_radius;
  int corners;
  int outer_dia;
  int inner_dia;
  int line_width;
  int angle;
  int gap;
  int num_spokes;
  int round;
  int cut_size;
} u_Parameters;

uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform float u_Scale;
uniform vec3 u_Color;
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;

attribute vec3 a_Color;
attribute float a_SymNum;
attribute vec2 a_Position;
attribute float a_X;
attribute float a_Y;
attribute float a_ResizeFactor;
attribute float a_Index;
attribute float a_Polarity;
attribute float a_Rotation;
attribute float a_Mirror;

varying float v_Index;
varying float v_SymNum;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror;

varying vec3 v_Color;
varying float v_Aspect;


mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

float pullParam(int offset) {
  vec2 texcoord = (vec2(float(offset), a_SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 Size = vec2(pullParam(u_Parameters.width), pullParam(u_Parameters.height));
  // float Rotation = pullParam(u_Parameters.rotation);
  // float Mirror = pullParam(u_Parameters.mirror);
  // vec2 Location = vec2(pullParam(u_Parameters.x), pullParam(u_Parameters.y));
  // float Index = pullParam(u_Parameters.index);

  // vec2 Size = vec2(a_Width, a_Height);
  float Rotation = a_Rotation;
  float Mirror = a_Mirror;
  vec2 Location = vec2(a_X, a_Y);
  float Index = a_Index;


  // vec2 SizedPosition = a_Position * vec2(a_Width / 2.0, a_Height / 2.0);
  vec2 SizedPosition = a_Position * (Size / 2.0);
  // vec2 RotatedPostion = SizedPosition * rotate2d(radians(u_Scale * 30.0));
  vec2 RotatedPostion = SizedPosition * rotate2d(radians(Rotation));
  vec2 OffsetPosition = RotatedPostion + Location;
  vec3 AspectPosition = vec3(OffsetPosition.x * Aspect, OffsetPosition.y, 1);
  vec3 FinalPosition = u_Transform * AspectPosition;

  v_SymNum = a_SymNum;
  v_Location = Location;
  v_Aspect = Aspect;
  v_Rotation = Rotation;
  v_Mirror = Mirror;
  v_Color = a_Color;
  v_Polarity = a_Polarity;

  gl_Position = vec4(FinalPosition.xy, Index, 1);

}
