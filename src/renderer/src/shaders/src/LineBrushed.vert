precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
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


// LINE ATTRIBUTES
attribute float a_Index;
attribute vec2 a_Start_Location;
attribute vec2 a_End_Location;
attribute float a_SymNum;
attribute float a_ResizeFactor;
attribute float a_Polarity;
attribute float a_Rotation;
attribute float a_Mirror_X;
attribute float a_Mirror_Y;

// LINE VARYINGS
varying float v_Index;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying float v_SymNum;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror_X;
varying float v_Mirror_Y;

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

float pullParam(int offset) {
  vec2 texcoord = (vec2(float(offset), a_SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)


void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height)) * 1.5 * a_ResizeFactor;
  float len = distance(a_Start_Location, a_End_Location);
  // vec2 Size = vec2(pullParam(u_Parameters.outer_dia) + len, pullParam(u_Parameters.outer_dia));
  vec2 Size = vec2(OD + len, OD);

  vec2 Center_Location = (a_Start_Location + a_End_Location) / 2.0;

  float dX = a_Start_Location.x - a_End_Location.x;
  float dY = a_Start_Location.y - a_End_Location.y;
  float Rotation = atan(dY/dX);

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0);
  vec2 RotatedPostion = SizedPosition * rotateCW(Rotation);
  vec2 OffsetPosition = RotatedPostion + Center_Location;
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition.x, OffsetPosition.y, 1);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Start_Location = a_Start_Location;
  v_End_Location = a_End_Location;
  v_Polarity = a_Polarity;
  v_ResizeFactor = a_ResizeFactor;
  v_Rotation = a_Rotation;
  v_Mirror_X = a_Mirror_X;
  v_Mirror_Y = a_Mirror_Y;

  float Index = u_IndexOffset / u_QtyFeatures + a_Index / u_QtyFeatures;

  gl_Position = vec4(FinalPosition.xy, Index, 1);
  // gl_Position = vec4(clamp(FinalPosition.xy, vec2(-1.0, -1.0), vec2(1.0, 1.0)), a_Index / u_QtyFeatures, 1);

}
