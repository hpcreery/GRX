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
  int index;
  int polarity;
  int x;
  int y;
  int width;
  int height;
  int rotation;
  int mirror;
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
uniform sampler2D u_Features;
uniform vec2 u_FeaturesDimensions;

attribute float a_TexCoord;
attribute vec2 a_Position;
attribute vec3 a_Color;

varying mat3 v_Transform;
varying float v_Symbol;
varying vec3 v_Color;
varying float v_Polarity;
varying float v_Radius;
varying vec2 v_Position;
varying float v_Aspect;
varying vec2 v_Location;
varying float v_Width;
varying float v_Height;
varying float v_Rotation;
varying float v_Mirror;
varying float v_Corner_Radius;
varying float v_Corners;
varying float v_Outer_Dia;
varying float v_Inner_Dia;
varying float v_Line_Width;
varying float v_Angle;
varying float v_Gap;
varying float v_Num_Spokes;


mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

float pullParam(int offset) {
  vec2 texcoord = (vec2(float(offset), a_TexCoord) + 0.5) / u_FeaturesDimensions;
  vec4 pixelValue = texture2D(u_Features, texcoord);
  return pixelValue.x;
}

vec4 texelFetch(vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / u_FeaturesDimensions;
  return texture2D(u_Features, uv);
}

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 Size = vec2(pullParam(u_Parameters.width), pullParam(u_Parameters.height));
  float Rotation = pullParam(u_Parameters.rotation);
  float Mirror = pullParam(u_Parameters.mirror);
  vec2 Location = vec2(pullParam(u_Parameters.x), pullParam(u_Parameters.y));
  float Index = pullParam(u_Parameters.index);

  // vec2 SizedPosition = a_Position * vec2(a_Width / 2.0, a_Height / 2.0);
  vec2 SizedPosition = a_Position * (Size / 2.0);
  // vec2 RotatedPostion = SizedPosition * rotate2d(radians(u_Scale * 30.0));
  vec2 RotatedPostion = SizedPosition * rotate2d(radians(Rotation));
  vec2 OffsetPosition = RotatedPostion + Location;
  vec3 AspectPosition = vec3(OffsetPosition.x * Aspect, OffsetPosition.y, 1);
  vec3 FinalPosition = u_Transform * AspectPosition;

  v_Location = Location;
  v_Aspect = Aspect;
  v_Rotation = Rotation;
  v_Mirror = Mirror;
  v_Symbol = pullParam(u_Parameters.symbol);
  v_Color = a_Color;
  v_Polarity = pullParam(u_Parameters.polarity);
  v_Width = Size.x;
  v_Height = Size.y;
  v_Position = FinalPosition.xy;
  v_Corner_Radius = pullParam(u_Parameters.corner_radius);
  v_Corners = pullParam(u_Parameters.corners);
  v_Outer_Dia = pullParam(u_Parameters.outer_dia);
  v_Inner_Dia = pullParam(u_Parameters.inner_dia);
  v_Line_Width = pullParam(u_Parameters.line_width);
  v_Angle = pullParam(u_Parameters.angle);
  v_Gap = pullParam(u_Parameters.gap);
  v_Num_Spokes = pullParam(u_Parameters.num_spokes);

  gl_Position = vec4(FinalPosition.xy, Index, 1);

}
