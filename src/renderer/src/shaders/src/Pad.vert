precision mediump float;

#pragma glslify: import('../modules/Constants.glsl')

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


#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)


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

  gl_Position = vec4(FinalPosition.xy, a_Index, 1);

}
