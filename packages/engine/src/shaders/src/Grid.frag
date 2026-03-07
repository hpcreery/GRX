#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform mat4 u_Transform3D;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform vec2 u_Spacing;
uniform vec2 u_Offset;
uniform int u_Type;
uniform vec4 u_Color;
uniform vec4 u_BackgroundColor;
uniform bool u_Perspective3D;

#pragma glslify: import('../modules/Constants.glsl')

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float u_ZOffset = 0.0;

#pragma glslify: transformLocation3D = require('../modules/Transform3D.frag',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)
#pragma glslify: transformLocation3DVert = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)


vec2 transformLocation(vec2 pixel_coord) {
  vec2 normal_frag_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = transformLocation3D(normal_frag_coord).xyz;
  transformed_position = u_InverseTransform * vec3(transformed_position.xy, 1.0);
  return transformed_position.xy;
}

float max2(vec2 v) {
  return max(v.x, v.y);
}

float log10(float x) {
  return log(x) / log(10.0);
}

float lines(vec2 uv){
    return max(
        smoothstep(2.*length(vec2(dFdx(uv.x), dFdy(uv.x))), 0., abs(fract(uv.x)-.5)),
        smoothstep(2.*length(vec2(dFdx(uv.y), dFdy(uv.y))), 0., abs(fract(uv.y)-.5))
    );
}

vec2 lines2(vec2 uv){
    return vec2(
        smoothstep(2.*length(vec2(dFdx(uv.x), dFdy(uv.x))), 0., abs(fract(uv.x)-.5)),
        smoothstep(2.*length(vec2(dFdx(uv.y), dFdy(uv.y))), 0., abs(fract(uv.y)-.5))
    );
}

// https://www.shadertoy.com/view/7tGBDK
vec4 grid(vec2 uv) {
  // float minCellSize = 0.00001 * u_Spacing.x;
  float minCellSizex = 0.00001 * u_Spacing.x;
  float minCellSizey = 0.00001 * u_Spacing.y;
  float minCellPixelWidth = 0.5;
  float lineWidth = 1.0;
  if (u_Type == 0) {
    lineWidth = 2.0;
  }

  vec2 dudv = vec2(
    length(vec2(dFdx(uv.x), dFdy(uv.x))),
    length(vec2(dFdx(uv.y), dFdy(uv.y)))
  );

  // float lod = max(0.0, log10((max2(dudv) * minCellPixelWidth) / minCellSize) + 1.0);
  float lodx = max(0.0, log10((dudv.x * minCellPixelWidth) / minCellSizex) + 1.0);
  float lody = max(0.0, log10((dudv.y * minCellPixelWidth) / minCellSizey) + 1.0);
  // float fade = fract(lod);
  float fadex = fract(lodx);
  float fadey = fract(lody);

  // float lod0 = minCellSize * pow(10.0, floor(lod));
  float lod0x = minCellSizex * pow(10.0, floor(lodx));
  float lod0y = minCellSizey * pow(10.0, floor(lody));
  // float lod1 = lod0 * 10.0;
  float lod1x = lod0x * 10.0;
  float lod1y = lod0y * 10.0;
  // float lod2 = lod1 * 10.0;
  float lod2x = lod1x * 10.0;
  float lod2y = lod1y * 10.0;

  // float lod0a = max2(vec2(1.0) - abs(clamp(mod(uv, lod0) / dudv / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod0ax = max2(vec2(1.0) - abs(clamp(mod(uv.x, lod0x) / dudv.x / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod0ay = max2(vec2(1.0) - abs(clamp(mod(uv.y, lod0y) / dudv.y / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  // float lod1a = max2(vec2(1.0) - abs(clamp(mod(uv, lod1) / dudv / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod1ax = max2(vec2(1.0) - abs(clamp(mod(uv.x, lod1x) / dudv.x / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod1ay = max2(vec2(1.0) - abs(clamp(mod(uv.y, lod1y) / dudv.y / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  // float lod2a = max2(vec2(1.0) - abs(clamp(mod(uv, lod2) / dudv / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod2ax = max2(vec2(1.0) - abs(clamp(mod(uv.x, lod2x) / dudv.x / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));
  float lod2ay = max2(vec2(1.0) - abs(clamp(mod(uv.y, lod2y) / dudv.y / lineWidth, 0.0, 1.0) * 2.0 - vec2(1.0)));

  vec4 x_markers = vec4(0.0, 0.0, 0.0, 0.0);
  if (lod1ax > 0.0) {
     x_markers = mix(u_Color, u_BackgroundColor, fadex);
  }
  if (lod2ax > 0.0) {
    x_markers = u_Color;
  }

  vec4 y_markers = vec4(0.0, 0.0, 0.0, 0.0);
  if (lod1ay > 0.0) {
    y_markers = mix(u_Color, u_BackgroundColor, fadey);
  }
  if (lod2ay > 0.0) {
    y_markers = u_Color;
  }


  if (u_Type == 0) {
    return min(x_markers, y_markers);
  } else if (u_Type == 1) {
    if (x_markers.a > y_markers.a) {
      return x_markers;
    } else {
      return y_markers;
    }
  } else {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
}

void main() {
  // float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  // float pixel_size = u_PixelSize / scale;

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  // gl_FragColor = grid(FragCoord - u_Offset);
  vec4 color = grid(FragCoord - u_Offset);
  if (color.a == 0.0) {
    discard;
  }
  gl_FragColor = color;
  return;
}
