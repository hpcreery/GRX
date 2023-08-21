precision mediump float;

attribute vec2 a_Position;
attribute vec3 a_Color;
attribute float a_X;
attribute float a_Y;
attribute float a_Index;
attribute float a_Width;
attribute float a_Height;
attribute float a_Polarity;

uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform float u_Scale;
uniform vec3 u_Color;

varying vec3 v_Color;
varying float v_Polarity;
varying vec2 v_Center;
varying float v_Radius;
varying vec2 v_Position;
varying float v_Aspect;

void main() {

  float aspect = u_Resolution.y / u_Resolution.x;
  vec2 finaldim = a_Position * vec2(a_Width, a_Height);
  vec3 final = u_Transform * vec3(vec2((finaldim.x + a_X) * aspect, (finaldim.y + a_Y)), 1);

  vec2 finalcenter = vec2(0, 0) * vec2(a_Width, a_Height);
  vec3 finalcenter3 = u_Transform * vec3(vec2((finalcenter.x + a_X) * aspect, (finalcenter.y + a_Y)), 1);

  v_Color = a_Color;
  v_Polarity = a_Polarity;
  v_Center = vec2(finalcenter3.x / aspect, finalcenter3.y);
  v_Radius = a_Width * u_Scale;
  v_Position = vec2(final.x / aspect, final.y);
  v_Aspect = aspect;

  gl_Position = vec4(final.xy, a_Index, 1);

}
