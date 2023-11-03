precision mediump float;

#define PI 3.1415926535897932384626433832795
#define DEBUG 0

const float ALPHA = 1.0;

uniform struct parameters {
  highp int width;
  highp int height;
} u_Parameters;

uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;

varying float v_Index;
varying float v_SymNum;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror;

varying float v_Aspect;

void main() {

  float scale = u_InverseTransform[0][0];

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec3 AspectPosition = vec3(TransformedPosition.x / v_Aspect, TransformedPosition.y, 1);
  vec2 OffsetPosition = AspectPosition.xy - v_Location;
  // vec2 SizedPosition = OffsetPosition * vec2(v_Width, v_Height);
  // vec2 FragCoord = OffsetPosition * rotateCW(radians(-v_Rotation));
  vec2 FragCoord = OffsetPosition;

  // vec3 color = vec3(1.0);
  vec3 color = u_Color * max(float(u_OutlineMode), v_Polarity);
  float Alpha = ALPHA * max(float(u_OutlineMode), v_Polarity);


  float dist = 0.0;

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
  gl_FragColor = vec4(color, Alpha);
}
