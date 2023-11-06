precision mediump float;

#define PI 3.1415926535897932384626433832795
#define DEBUG 2

const float ALPHA = 1.0;

uniform struct parameters {
  highp int width;
  highp int height;
} u_Parameters;

// COMMON UNIFORMS
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;

// COMMON VARYINGS
varying float v_Aspect;

// SURFACE UNIFORMS
uniform sampler2D u_ContoursTexture;
uniform vec2 u_ContoursTextureDimensions;

// SURFACE VARYINGS
varying float v_Index;
varying float v_Polarity;
varying float v_SegmentsCount;

float dot2(in vec2 v) {
  return dot(v, v);
}
float cross2d(in vec2 v0, in vec2 v1) {
  return v0.x * v1.y - v0.y * v1.x;
}

const float N = 50.0;
// #define N 5.0

// https://math.stackexchange.com/questions/3020095/signed-angle-in-plane:
// "the ratio of the cross product and scalar product is the tangent of the angle"
// From [1]: "The tangent of the signed angle between a and b is det([ab]) / dot(ab)"
float signedAngle(vec2 a, vec2 b) {
    // atan(y, x) returns the angle whose arctangent is y / x. Value in [-pi, pi]
  return atan(a.x * b.y - a.y * b.x, dot(a, b));
}

vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}

float getValueByIndexFromTexture(float index) {
  float col = mod(index, u_ContoursTextureDimensions.x);
  float row = floor(index / u_ContoursTextureDimensions.x);
  return texelFetch(u_ContoursTexture, u_ContoursTextureDimensions, vec2(col, row)).x;
}

void main() {

  float scale = u_InverseTransform[0][0];

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - vec2(0.0, 0.0);
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  // vec2 FragCoord = OffsetPosition * rotateCW(radians(-v_Rotation));
  vec2 FragCoord = OffsetPosition;

  // vec3 color = vec3(1.0);
  vec3 color = u_Color * max(float(u_OutlineMode), v_Polarity);
  float Alpha = ALPHA * max(float(u_OutlineMode), v_Polarity);

  float dist = 0.0;

  float angle = 0.0;
    // float N = 16.0;

  float radius = 1.0;

  vec2 c0;
  vec2 c1;
  // float t = speed * iTime;

  float currentType = 0.0;
  vec2 prevPoint = vec2(0.0);
  for (float i = 0.0; i < N; i += 1.0) {
    // if (i > v_SegmentsCount) {
    //   break;
    // }
    float a = getValueByIndexFromTexture(i);
    // END OF CONTOUR
    if (a == 999.0) {
      break;
    }
    // SURFACE TYPE
    if (a == 222.0) {
      currentType = 222.0;
      continue;
    }
    // NEW CONTOUR
    if (a == 333.0) {
      currentType = 333.0;
      prevPoint = vec2(getValueByIndexFromTexture(i + 1.0), getValueByIndexFromTexture(i + 2.0));
      continue;
    }
    // NEW LINE SEGMENT
    if (a == 444.0) {
      currentType = 444.0;
      // c0 = radius * getValueByIndexFromTexture(i + 1.0);
      c1 = vec2(getValueByIndexFromTexture(i + 1.0), getValueByIndexFromTexture(i + 2.0));
      angle += signedAngle(prevPoint - FragCoord, c1 - FragCoord);
      prevPoint = c1;
      continue;
    }
    // NEW ARC SEGMENT
    if (a == 555.0) {
      currentType = 555.0;
      continue;
    }

    // if (currentType == 222.0) {
    //   continue;
    // }
    // if (currentType == 333.0) {
    //   continue;
    // }

    // c0 = radius * getValueByIndexFromTexture(i);
    // c1 = radius * getValueByIndexFromTexture(i + 1.0);
    // angle += signedAngle(c0 - FragCoord, c1 - FragCoord);

  }

  if (DEBUG == 1) {
    // if(dist < 0.0 && dist > -u_PixelSize * scale) {
    //   dist = 1.0;
    // }
    // gl_FragColor = vec4(-dist, dist, dist, 1.0);
    vec3 col = (dist > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
    col *= 1.0 - exp(-6.0 * abs(dist));
    col *= 0.8 + 0.5 * cos(500.0 * dist);
    // col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, u_PixelSize * scale, abs(dist)));
    if (dist < 0.0 && dist > -u_PixelSize * scale) {
      col = vec3(1.0, 1.0, 1.0);
    }
    gl_FragColor = vec4(col, 1.0);
    return;
  }
  if (DEBUG == 2) {
    // if (angle < 0.0) {
    //   angle += 2.0 * PI;
    // }
    // angle = mod(angle, 2.0 * PI);
    angle = angle / (2.0 * PI);
    if (angle <= 0.0001) {
      discard;
    }
    gl_FragColor = vec4(angle, angle, angle, 1.0);
    return;
  }
  gl_FragColor = vec4(color, Alpha);
}
