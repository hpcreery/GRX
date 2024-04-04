precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

uniform struct parameters {
  highp int width;
  highp int height;
} u_Parameters;

// COMMON UNIFROMS
uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform float u_QtyFeatures;
uniform float u_IndexOffset;

// COMMON ATTRIBUTES
attribute vec2 a_Vertex_Position;

// SURFACE UNIFORMS
uniform sampler2D u_ContoursTexture;
uniform vec2 u_ContoursTextureDimensions;

// SURFACE ATTRIBUTES
attribute float a_Index;
attribute float a_Polarity;
attribute vec4 a_Box;
attribute float a_SegmentsCount;


// SURFACE VARYINGS
varying float v_Index;
varying float v_Polarity;
varying vec4 v_Box;

varying float v_Aspect;

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 Location = vec2((a_Box.y + a_Box.w) / 2.0, (a_Box.x + a_Box.z) / 2.0);
  vec2 Size = vec2(a_Box.y - a_Box.w, a_Box.x - a_Box.z);

  vec2 SizedPosition = a_Vertex_Position * (Size / 2.0);
  vec2 OffsetPosition = SizedPosition + Location;
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition.x, OffsetPosition.y, 1);

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_Polarity = a_Polarity;
  v_Box = a_Box;

  float Index = u_IndexOffset / u_QtyFeatures + a_Index / u_QtyFeatures;

  gl_Position = vec4(FinalPosition.xy, Index, 1);
}
