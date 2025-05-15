precision highp float;
attribute vec2 a_Vertex_Position;
void main() {
  gl_Position = vec4(a_Vertex_Position, 0, 1);
}
