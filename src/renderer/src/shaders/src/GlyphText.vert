
attribute vec2 a_position;
attribute vec2 a_texcoord;
attribute vec2 a_Vertex_Position;
// attribute float a_GlyphWidth;
attribute float a_StringIndex;

// uniform mat4 u_matrix;
uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform vec2 u_TextureDimensions;
uniform float u_PixelSize;
uniform vec2 u_LetterDimensions;

varying vec2 v_texcoord;

void main() {
  // Multiply the position by the matrix.

  vec2 character_move = vec2(u_PixelSize * a_StringIndex * (u_LetterDimensions.x / u_Resolution.x), 0.0);

  vec2 Transformed_Position = (u_Transform * vec3(a_position, 1)).xy;
  gl_Position = vec4(Transformed_Position + (a_Vertex_Position/u_Resolution) * u_LetterDimensions * u_PixelSize + character_move, 0, 1);

  // Pass the texcoord to the fragment shader.
  v_texcoord = (a_texcoord / u_TextureDimensions) + (a_Vertex_Position * vec2(1.0,-1.0) * (u_LetterDimensions / u_TextureDimensions)) + vec2(0, u_LetterDimensions.y/u_TextureDimensions.y);
}
