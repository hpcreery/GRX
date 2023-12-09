precision mediump float;

#define PI 3.1415926535897932384626433832795

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;


// COMMON UNIFORMS
uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;

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

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 ShapeSize = vec2(pullSymbolParameter(u_Parameters.outer_dia, int(a_SymNum)), pullSymbolParameter(u_Parameters.outer_dia, int(a_SymNum)));

  float radius = distance(a_Start_Location, a_Center_Location);
  float radius2 = distance(a_End_Location, a_Center_Location);
  vec2 Size = vec2(radius * 2.0, radius * 2.0) + ShapeSize;

  float dX = a_Start_Location.x - a_End_Location.x;
  float dY = a_Start_Location.y - a_End_Location.y;
  float Rotation = atan(dY, dX);

  float angle_dot = acos(dot(normalize(a_Start_Location - a_Center_Location), normalize(a_End_Location - a_Center_Location)));
  vec3 cross_prod = cross(vec3(a_Start_Location - a_Center_Location, 0), vec3(a_End_Location - a_Center_Location, 0));
  float cw = sign(cross_prod.z);

  float Sagitta = radius * (1.0 - cos((angle_dot / 2.0)));
  float Width = length(a_Start_Location - a_End_Location);
  if (cw == -1.0 && a_Clockwise == 0.0 ) {
    Sagitta = radius * (1.0 + cos((angle_dot / 2.0)));
    Width = radius * 2.0;
  }
  if (cw == 1.0 && a_Clockwise == 1.0) {
    Sagitta = radius * (1.0 + cos((angle_dot / 2.0)));
    Width = radius * 2.0;
  }

  Size = vec2(Width, Sagitta) + ShapeSize;

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0) + vec2(0.0, (a_Clockwise == 0.0 ? 1.0 : -1.0) * (radius - (Sagitta / 2.0)));
  vec2 RotatedPostion = SizedPosition * rotateCW(Rotation);
  vec2 OffsetPosition = RotatedPostion + a_Center_Location;
  vec3 AspectPosition = vec3(OffsetPosition.x * Aspect, OffsetPosition.y, 1);
  vec3 FinalPosition = u_Transform * AspectPosition;

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Start_Location = a_Start_Location;
  v_End_Location = a_End_Location;
  v_Polarity = a_Polarity;
  v_Center_Location = a_Center_Location;
  v_Clockwise = a_Clockwise;

  gl_Position = vec4(FinalPosition.xy, a_Index, 1);

}
