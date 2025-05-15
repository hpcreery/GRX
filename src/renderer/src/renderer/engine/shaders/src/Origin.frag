precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec4 u_Color;

#pragma glslify: import('../modules/Constants.glsl')

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  if ((abs(FragCoord.x) <= pixel_size * 0.5 && abs(FragCoord.y) <= pixel_size * 10.0) || (abs(FragCoord.y) <= pixel_size * 0.5 && abs(FragCoord.x) <= pixel_size * 10.0)) {
    gl_FragColor = u_Color;
    return;
  }
  discard;
}
