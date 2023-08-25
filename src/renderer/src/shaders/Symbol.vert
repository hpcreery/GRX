precision mediump float;

#define PI 3.1415926535897932384626433832795

attribute float a_Symbol;
attribute vec2 a_Position;
attribute vec3 a_Color;
attribute float a_X;
attribute float a_Y;
attribute float a_Index;
attribute float a_Width;
attribute float a_Height;
attribute float a_Polarity;
attribute float a_Rotation;
attribute float a_Mirror;

uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform float u_Scale;
uniform vec3 u_Color;

varying mat3 v_Transform;
varying float v_Symbol;
varying vec3 v_Color;
varying float v_Polarity;
varying float v_Radius;
varying vec2 v_Position;
varying vec2 v_Center;
varying float v_Aspect;
varying float v_X;
varying float v_Y;
varying float v_Width;
varying float v_Height;
varying float v_Rotation;
varying float v_Mirror;

mat2 rotate2d(float _angle) {
  return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
}

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  // vec2 SizedPosition = a_Position * rotate2d(sin(u_Scale) * PI) * vec2(a_Width, a_Height);
  // vec3 FinalPosition = u_Transform * vec3(vec2((SizedPosition.x + a_X) * Aspect, (SizedPosition.y + a_Y)), 1);
  vec2 RotatedPostion = a_Position * rotate2d(sin(u_Scale) * PI);
  vec2 SizedPosition = RotatedPostion * vec2(a_Width, a_Height);
  vec2 OffsetPosition = SizedPosition + vec2(a_X, a_Y);
  vec3 AspectPosition = vec3(OffsetPosition.x * Aspect, OffsetPosition.y, 1);
  vec3 FinalPosition = u_Transform * AspectPosition;

  // vec2 SizedCenter = vec2(0, 0) * rotate2d(sin(u_Scale) * PI) * vec2(a_Width, a_Height);
  // vec3 FinalCenter = u_Transform * vec3(vec2((SizedCenter.x + a_X) * Aspect, (SizedCenter.y + a_Y)), 1);
  vec2 RotatedCenter = vec2(0, 0) * rotate2d(sin(u_Scale) * PI);
  vec2 SizedCenter = RotatedCenter * vec2(a_Width, a_Height);
  vec2 OffsetCenter = SizedCenter + vec2(a_X, a_Y);
  vec3 AspectCenter = vec3(OffsetCenter.x * Aspect, OffsetCenter.y, 1);
  vec3 FinalCenter = u_Transform * AspectCenter;

  v_Symbol = a_Symbol;
  v_Color = a_Color;
  v_Polarity = a_Polarity;
  v_Radius = a_Width;
  v_X = a_X;
  v_Y = a_Y;
  v_Width = a_Width;
  v_Height = a_Height;
  v_Position = FinalPosition.xy;
  v_Center = FinalCenter.xy;
  v_Aspect = Aspect;
  v_Rotation = a_Rotation;
  v_Mirror = a_Mirror;

  gl_Position = vec4(FinalPosition.xy, a_Index, 1);

}
