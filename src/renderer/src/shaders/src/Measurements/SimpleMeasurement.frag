precision highp float;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
// uniform vec2 u_Spacing;
// uniform vec2 u_Offset;
// uniform int u_Type;
// uniform vec4 u_Color;

uniform vec2 u_Point1;
uniform vec2 u_Point2;

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

vec2 translate(vec2 p, vec2 t) {
  return p - t;
}

float lineDist(vec2 p, vec2 start, vec2 end, float width) {
  vec2 dir = start - end;
  float lngth = length(dir);
  dir /= lngth;
  vec2 proj = max(0.0, min(lngth, dot((start - p), dir))) * dir;
  return length((start - p) - proj) - (width / 2.0);
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * 2.0) - 1.0;
  vec3 FragCoord = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  // if (pixel_size > 0.1 * u_Spacing.x || pixel_size > 0.1 * u_Spacing.y) {
  //    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  //    return;
  // }
  // float mody = mod(FragCoord.y - u_Offset.y, u_Spacing.y);
  // float modx = mod(FragCoord.x - u_Offset.x, u_Spacing.x);
  // if (u_Type == 0) {
  //   if ((modx < pixel_size || modx > u_Spacing.x - pixel_size) && (mody < pixel_size|| mody > u_Spacing.y - pixel_size)) {
  //     gl_FragColor = vec4(u_Color);
  //   }
  // } else if (u_Type == 1) {
  //   if ((modx < pixel_size * 0.5 || modx > u_Spacing.x - pixel_size * 0.5) || (mody < pixel_size * 0.5 || mody > u_Spacing.y - pixel_size * 0.5)) {
  //     gl_FragColor = vec4(u_Color);
  //   }
  // } else {
  //   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  //   return;
  // }

  // vec2 p1 = u_Point1;
  // vec2 p2 = u_Point2;
  // vec2 v = p2 - p1;
  // vec2 w = FragCoord.xy - p1;
  // float c1 = dot(w, v);
  // float c2 = dot(v, v);
  // float b = c1 / c2;
  // vec2 pb = p1 + b * v;
  // float radius = 5.0;
  // float d = circleDist(FragCoord.xy - pb, radius);
  // if (d < 0.0) {
  //   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  // } else {
  //   gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  // }

  float radius = 5.0;
  // float dist = circleDist(translate(FragCoord.xy, u_Point1), radius);
  float dist = lineDist(FragCoord.xy, u_Point1, u_Point2, pixel_size);
  if (dist < 0.0) {
    gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0);
  } else {
    discard;
  }

}
