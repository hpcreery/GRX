precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform mat4 u_Transform3D;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec4 u_Color;
uniform bool u_Perspective3D;

#pragma glslify: import('../modules/Constants.glsl')
float u_ZOffset = 0.0;
#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = transformLocation3D(normal_frag_coord).xyz;
  transformed_position = u_InverseTransform * vec3(transformed_position.xy, 1.0);
  return transformed_position.xy;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3DVert(((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0));
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);

  // vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  // vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  if ((abs(FragCoord.x) <= pixel_size * 0.5 && abs(FragCoord.y) <= pixel_size * 10.0) || (abs(FragCoord.y) <= pixel_size * 0.5 && abs(FragCoord.x) <= pixel_size * 10.0)) {
    gl_FragColor = u_Color;
    return;
  }
  discard;
}
