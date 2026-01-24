precision highp float;

uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec3 u_Color;
uniform float u_Alpha;
uniform bool u_Perspective3D;

varying vec2 v_Location;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)


mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;
  vec4 v = transformLocation3DVert(((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0));
  float pixel_size = u_PixelSize * (v.z + 1.0) / (scale);


  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);

  vec2 movedFragCoord = (FragCoord.xy - v_Location) * rotateCCW(PI / 4.0);
  if ((abs(movedFragCoord.x) <= pixel_size * 0.4 && abs(movedFragCoord.y) <= pixel_size * 10.0) || (abs(movedFragCoord.y) <= pixel_size * 0.4 && abs(movedFragCoord.x) <= pixel_size * 10.0)) {
    gl_FragColor = vec4(u_Color, u_Alpha);
    return;
  }
  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
