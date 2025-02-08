precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec2 u_Spacing;
uniform vec2 u_Offset;
uniform int u_Type;
uniform vec4 u_Color;

#pragma glslify: import('../modules/Constants.glsl')

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = u_InverseTransform * vec3(normal_frag_coord, 1.0);
  return transformed_position.xy;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  // // origin
  // if ((abs(FragCoord.x) <= pixel_size * 0.5 && abs(FragCoord.y) <= pixel_size * 10.0) || (abs(FragCoord.y) <= pixel_size * 0.5 && abs(FragCoord.x) <= pixel_size * 10.0)) {
  //   // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  //   // gl_FragColor = u_Color;
  //   gl_FragColor = u_Color;
  //   return;
  // }
  // datum
  // vec2 movedFragCoord = (FragCoord.xy - u_Offset) * rotateCCW(PI / 4.0);
  // if ((abs(movedFragCoord.x) <= pixel_size * 0.4 && abs(movedFragCoord.y) <= pixel_size * 10.0) || (abs(movedFragCoord.y) <= pixel_size * 0.4 && abs(movedFragCoord.x) <= pixel_size * 10.0)) {
  //   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  //   return;
  // }
  if (pixel_size > 0.1 * u_Spacing.x || pixel_size > 0.1 * u_Spacing.y) {
     gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
     return;
  }
  float mody = mod(FragCoord.y - u_Offset.y, u_Spacing.y);
  float modx = mod(FragCoord.x - u_Offset.x, u_Spacing.x);
  if (u_Type == 0) {
    if ((modx < pixel_size || modx > u_Spacing.x - pixel_size) && (mody < pixel_size || mody > u_Spacing.y - pixel_size)) {
      gl_FragColor = u_Color;
    }
  } else if (u_Type == 1) {
    if ((modx < pixel_size * 0.5 || modx > u_Spacing.x - pixel_size * 0.5) || (mody < pixel_size * 0.5 || mody > u_Spacing.y - pixel_size * 0.5)) {
      gl_FragColor = u_Color;
    }
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }
}
