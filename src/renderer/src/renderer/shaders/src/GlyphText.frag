

precision mediump float;

// Passed in from the vertex shader.
varying vec2 v_Texcoord;

uniform sampler2D u_Texture;

void main() {
  gl_FragColor = texture2D(u_Texture, v_Texcoord);
  // gl_FragColor.a = 1.0;
}
