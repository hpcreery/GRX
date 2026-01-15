precision highp float;

uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec3 u_Color;
uniform float u_Alpha;

varying vec2 v_Location;

#pragma glslify: import('../modules/Constants.glsl')

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;
  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);

  vec2 movedFragCoord = (FragCoord.xy - v_Location) * rotateCCW(PI / 4.0);
  if ((abs(movedFragCoord.x) <= pixel_size * 0.4 && abs(movedFragCoord.y) <= pixel_size * 10.0) || (abs(movedFragCoord.y) <= pixel_size * 0.4 && abs(movedFragCoord.x) <= pixel_size * 10.0)) {
    gl_FragColor = vec4(u_Color, u_Alpha);
    return;
  }
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
