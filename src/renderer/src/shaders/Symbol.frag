precision mediump float;

varying vec3 v_Color;
varying float v_Polarity;
varying vec2 v_Center;
varying float v_Radius;
varying vec2 v_Position;
varying float v_Aspect;

uniform vec2 u_Resolution;
uniform vec2 u_Screen;
uniform float u_PixelSize;
uniform float u_OutlineMode;
uniform vec3 u_Color;

void main() {
  // vec2 uv = gl_FragCoord.xy + vec2(0.5, 0.5);

  // draw a circle
  float d = distance(v_Position, v_Center);

  if(d > v_Radius) {
    discard;
  }

  float alpha = v_Polarity;
  if(u_OutlineMode == 1.0) {
    if(d < v_Radius - u_PixelSize) {
      discard;
    }
    alpha = 1.0;
  }

  gl_FragColor = vec4(u_Color, alpha);
}
