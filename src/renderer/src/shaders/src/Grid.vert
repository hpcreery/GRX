precision highp float;
attribute vec2 a_Vertex_Position;
varying vec2 v_UV;
void main() {
  v_UV = a_Vertex_Position;
  gl_Position = vec4(a_Vertex_Position, 0, 1);
}
