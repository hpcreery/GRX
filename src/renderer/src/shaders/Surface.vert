precision mediump float;

#define PI 3.1415926535897932384626433832795

uniform struct parameters {
  highp int width;
  highp int height;
} u_Parameters;

// COMMON UNIFROMS
uniform mat3 u_Transform;
uniform vec2 u_Resolution;

// COMMON ATTRIBUTES
attribute vec2 a_Vertex_Position;


// SURFACE ATTRIBUTES
attribute float a_Index;
attribute vec2 a_Location;
attribute float a_ResizeFactor;
attribute float a_Polarity;
attribute vec2 a_Size;


// SURFACE VARYINGS
varying float v_Index;
varying vec2 v_Location;
varying float v_ResizeFactor;
varying float v_Polarity;

varying float v_Aspect;

void main() {

  float Aspect = u_Resolution.y / u_Resolution.x;

  vec2 Location = a_Location;
  float Index = a_Index;

  vec2 SizedPosition = a_Vertex_Position * (a_Size / 2.0);
  vec2 OffsetPosition = SizedPosition + Location;
  vec3 AspectPosition = vec3(OffsetPosition.x * Aspect, OffsetPosition.y, 1);
  vec3 FinalPosition = u_Transform * AspectPosition;

  v_Aspect = Aspect;
  v_Index = a_Index;
  v_Location = a_Location;
  v_Polarity = a_Polarity;
  v_ResizeFactor = a_ResizeFactor;

  gl_Position = vec4(FinalPosition.xy, Index, 1);

}
