precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Symbols.glsl')
uniform Symbols u_Symbols;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;


// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_IndexOffset;
uniform float u_PixelSize;
uniform bool u_PointerDown;
uniform bool u_QueryMode;
uniform bool u_Perspective3D;

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
attribute float a_Mirror_X;
attribute float a_Mirror_Y;

// PAD VARYINGS
varying float v_Index;
varying vec2 v_Location;
varying float v_SymNum;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror_X;
varying float v_Mirror_Y;
varying float v_Z;

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
#pragma glslify: transformLocation3D = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  if (u_Perspective3D) {
    scale *= 0.5;
  }
  // float scale3D = sqrt(pow(u_Transform3D[0][0], 2.0) + pow(u_Transform3D[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3D(a_Vertex_Position);
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);

  float Aspect = u_Resolution.y / u_Resolution.x;

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, a_SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, a_SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, a_SymNum);
  float t_Line_Length = pullSymbolParameter(u_Parameters.line_length, a_SymNum);
  float OD = max(t_Line_Length, max(t_Outer_Dia, max(t_Width, t_Height)));

  vec2 Size = vec2(t_Width, t_Height);
  if (Size.x == 0.0) {
    Size.x = OD;
  }
  if (Size.y == 0.0) {
    Size.y = OD;
  }

  Size += vec2(pixel_size);

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0) * a_ResizeFactor;
  vec2 RotatedPostion = SizedPosition * rotateCW(radians(a_Rotation));
  if (a_Mirror_X == 1.0) {
    RotatedPostion.x = -RotatedPostion.x;
  }
  if (a_Mirror_Y == 1.0) {
    RotatedPostion.y = -RotatedPostion.y;
  }
  vec2 OffsetPosition = RotatedPostion + a_Location;
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition, 1.0);
  vec4 FinalPosition3D = transformLocation3D(FinalPosition.xy);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Location = a_Location;
  v_Rotation = a_Rotation;
  v_Mirror_X = a_Mirror_X;
  v_Mirror_Y = a_Mirror_Y;
  v_Polarity = a_Polarity;
  v_ResizeFactor = a_ResizeFactor;


  if (u_QueryMode) {
    FinalPosition3D.xy = ((((a_Vertex_Position + vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x))) / u_Resolution) * 2.0) - vec2(1.0,1.0));
    FinalPosition3D.zw = vec2(0.0);
  }

  float Index = u_IndexOffset + (a_Index / u_QtyFeatures);
  // affix the index to the z position, this sorts the rendering order without perspective issues
  FinalPosition3D.z = Index;
  // add 1.0 to w to avoid issues with w=0 in perspective divide
  FinalPosition3D.w += 1.0;
  gl_Position = vec4(FinalPosition3D);
}
