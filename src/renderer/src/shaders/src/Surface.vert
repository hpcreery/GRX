precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

// COMMON UNIFROMS
uniform mat3 u_Transform;
uniform vec2 u_Resolution;
uniform float u_QtyFeatures;
uniform float u_QtyContours;
uniform float u_PixelSize;
uniform float u_Index;

// COMMON ATTRIBUTES
attribute vec2 a_Vertex_Position;

// SURFACE UNIFORMS
uniform sampler2D u_Vertices;
uniform vec2 u_VerticesDimensions;

// SURFACE ATTRIBUTES
attribute float a_Index;
attribute float a_Polarity;
attribute float a_Offset;
attribute vec3 a_Indicies;
attribute float a_QtyVerts;

// SURFACE VARYINGS
varying float v_Index;
varying float v_Polarity;
varying float v_Offset;
varying vec3 v_Indicies;
varying float v_QtyVerts;

vec4 texelFetch(sampler2D tex, vec2 texSize, vec2 pixelCoord) {
  vec2 uv = (pixelCoord + 0.5) / texSize;
  return texture2D(tex, uv);
}

vec2 getVertexPosition(float index) {
  float xcol = mod(index, u_VerticesDimensions.x);
  float xrow = floor(index / u_VerticesDimensions.x);
  float x = texelFetch(u_Vertices, u_VerticesDimensions, vec2(xcol, xrow)).z;
  float ycol = mod(index + 1.0, u_VerticesDimensions.x);
  float yrow = floor((index + 1.0) / u_VerticesDimensions.x);
  float y = texelFetch(u_Vertices, u_VerticesDimensions, vec2(ycol, yrow)).z;
  // if (x < y+0.1 && x > y-0.1) {
  //   x = mod(index, u_VerticesDimensions.x);
  //   y = mod(index, u_VerticesDimensions.x);
  // }
  return vec2(x, y);
}


void main() {

  vec2 point1 = getVertexPosition(a_Indicies.x * 2.0 + a_Offset);
  vec2 point2 = getVertexPosition(a_Indicies.y * 2.0 + a_Offset);
  vec2 point3 = getVertexPosition(a_Indicies.z * 2.0 + a_Offset);

  vec2 OffsetPosition = vec2(0.0, 0.0);
  if (a_Vertex_Position.x == 0.0)
    OffsetPosition = point1;
  else if (a_Vertex_Position.x == 1.0)
    OffsetPosition = point2;
  else if (a_Vertex_Position.x == 2.0)
    OffsetPosition = point3;

  // vec2 OffsetPosition = getVertexPosition(index * 2.0 + a_Offset);
  vec3 FinalPosition = u_Transform * vec3(OffsetPosition.x, OffsetPosition.y, 1);

  v_Index = a_Index;
  v_Polarity = a_Polarity;
  v_Offset = a_Offset;
  v_Indicies = a_Indicies;
  v_QtyVerts = a_QtyVerts;

  float Index = u_Index / u_QtyFeatures + a_Index / (u_QtyContours * u_QtyFeatures);

  gl_Position = vec4(FinalPosition.xy, Index, 1);
}
