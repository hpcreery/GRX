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
uniform bool u_QueryMode;
uniform bool u_Perspective3D;

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

#pragma glslify: transformLocation3D = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3D(a_Vertex_Position);
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);

  float Aspect = u_Resolution.y / u_Resolution.x;

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, a_SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, a_SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, a_SymNum);
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
  vec4 FinalPosition3D = transformLocation3D(FinalPosition.xy);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_SymNum = a_SymNum;
  v_Start_Location = a_Start_Location;
  v_End_Location = a_End_Location;
  v_Polarity = a_Polarity;
  v_Center_Location = a_Center_Location;
  v_Clockwise = a_Clockwise;


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
