
attribute vec2 a_Position;
attribute vec2 a_Texcoord;
attribute vec2 a_VertexPosition;
// attribute float a_GlyphWidth;
attribute vec2 a_CharPosition;

// uniform mat4 u_matrix;
uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform vec2 u_TextureDimensions;
uniform float u_PixelSize;
uniform vec2 u_CharDimensions;
uniform vec2 u_CharSpacing;

varying vec2 v_Texcoord;

void main() {
  // Multiply the position by the matrix.

  vec2 character_move = vec2(u_PixelSize * a_CharPosition * ((u_CharDimensions + u_CharSpacing) / u_Resolution));

  vec2 Transformed_Position = (u_Transform * vec3(a_Position, 1)).xy;
  gl_Position = vec4(Transformed_Position + (a_VertexPosition/u_Resolution) * u_CharDimensions * u_PixelSize + character_move, 0, 1);

  // Pass the texcoord to the fragment shader.
  v_Texcoord = (a_Texcoord / u_TextureDimensions) + (a_VertexPosition * vec2(1.0,-1.0) * (u_CharDimensions / u_TextureDimensions)) + vec2(0, u_CharDimensions.y/u_TextureDimensions.y);
}
