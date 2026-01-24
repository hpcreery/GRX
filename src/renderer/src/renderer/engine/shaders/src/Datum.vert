precision highp float;


attribute vec2 a_Vertex_Position;
attribute vec2 a_Location;
// attribute float ZERO;

// uniform mat4 u_matrix;
uniform mat3 u_Transform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_Perspective3D;

varying vec2 v_Location;

#pragma glslify: transformLocation3D = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

void main() {
  vec2 Transformed_Position = (u_Transform * vec3(a_Location, 1)).xy;
  vec4 Transformed_Position3D = transformLocation3D(Transformed_Position.xy);

  v_Location = a_Location;

  // add 1.0 to w to avoid issues with w=0 in perspective divide
  Transformed_Position3D.w += 1.0;
  gl_Position = vec4(Transformed_Position + (a_Vertex_Position/u_Resolution)*20.0, 0, Transformed_Position3D.w);
}
