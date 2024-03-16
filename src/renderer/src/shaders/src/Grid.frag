precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
varying vec2 v_UV;
uniform vec2 u_Spacing;
uniform vec2 u_Offset;
uniform int u_Type;
void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0));
  float pixel_size = u_PixelSize / scale;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  if (pixel_size > 0.1 * u_Spacing.x || pixel_size > 0.1 * u_Spacing.y) {
    discard;
  }
  float mody = mod(FragCoord.y - u_Offset.y, u_Spacing.y);
  float modx = mod(FragCoord.x - u_Offset.x, u_Spacing.x);
  if (u_Type == 0) {
    if ((modx < pixel_size || modx > u_Spacing.x - pixel_size) && (mody < pixel_size|| mody > u_Spacing.y - pixel_size)) {
      gl_FragColor = vec4(1, 1, 1, 0.1);
    }
  } else if (u_Type == 1) {
    if ((modx < pixel_size * 0.5 || modx > u_Spacing.x - pixel_size * 0.5) || (mody < pixel_size * 0.5 || mody > u_Spacing.y - pixel_size * 0.5)) {
      gl_FragColor = vec4(1, 1, 1, 0.1);
    }
  } else {
    discard;
  }
}
