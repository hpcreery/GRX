
attribute vec2 a_Position;
attribute vec2 a_Texcoord;
attribute vec2 a_VertexPosition;
// attribute float a_GlyphWidth;
attribute vec2 a_CharPosition;

// uniform mat4 u_matrix;
uniform mat3 u_Transform;
uniform mat4 u_Transform3D;
uniform float u_ZOffset;
uniform vec2 u_Resolution;
uniform vec2 u_TextureDimensions;
uniform float u_PixelSize;
uniform vec2 u_CharDimensions;
uniform vec2 u_CharSpacing;
uniform bool u_Perspective3D;

varying vec2 v_Texcoord;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: transformLocation3D = require('../modules/Transform3D.vert',u_Transform3D=u_Transform3D,u_ZOffset=u_ZOffset,u_Perspective3D=u_Perspective3D)

void main() {
  // Multiply the position by the matrix.


  vec2 Transformed_Position = (u_Transform * vec3(a_Position, 1)).xy;
  vec4 Transformed_Position3D = transformLocation3D(Transformed_Position.xy);
  // add 1.0 to w to avoid issues with w=0 in perspective divide
  Transformed_Position3D.w += 1.0;

  vec2 character_move = vec2((4.0/u_PixelSize) * a_CharPosition * ((u_CharDimensions + u_CharSpacing) / u_Resolution));
  gl_Position = vec4(Transformed_Position3D.xy + (a_VertexPosition/u_Resolution) * u_CharDimensions * (4.0/u_PixelSize) + character_move, 0, Transformed_Position3D.w);

  // Pass the texcoord to the fragment shader.
  v_Texcoord = (a_Texcoord / u_TextureDimensions) + (a_VertexPosition * vec2(1.0,-1.0) * (u_CharDimensions / u_TextureDimensions)) + vec2(0, u_CharDimensions.y/u_TextureDimensions.y);
}
