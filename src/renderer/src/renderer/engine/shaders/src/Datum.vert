precision highp float;


attribute vec2 a_Vertex_Position;
attribute vec2 a_Location;
// attribute float ZERO;

// uniform mat4 u_matrix;
uniform mat3 u_Transform;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_PixelSize;

varying vec2 v_Location;

void main() {
  vec2 Transformed_Position = (u_Transform * vec3(a_Location, 1)).xy;

  v_Location = a_Location;

  gl_Position = vec4(Transformed_Position + (a_Vertex_Position/u_Resolution)*20.0, 0, 1);
}
