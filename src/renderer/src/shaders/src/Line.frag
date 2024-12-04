precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;

// COMMIN UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform vec3 u_Color;
uniform float u_Alpha;
uniform float u_Polarity;
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;

// COMMON VARYINGS
varying float v_Aspect;

// LINE VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying float v_Polarity;
varying float v_ResizeFactor;

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////

float merge(float d1, float d2) {
  return min(d1, d2);
}

//////////////////////////////
// Rotation and translation //
//////////////////////////////

vec2 rotateCCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
  return p * m;
}

vec2 rotateCW(vec2 p, float angle) {
  mat2 m = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  return p * m;
}

mat2 rotateCCW(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

mat2 rotateCW(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec2 translate(vec2 p, vec2 t) {
  return p - t;
}

//////////////////////////////
// Distance field functions //
//////////////////////////////

float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}



#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
// #pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
// Here we can redefine drawShape with a much smaller footprint to improve compiling performance. Limiting lines to only be drawn with squares and circles.
float drawShape(vec2 FragCoord, int SymNum) {

  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, SymNum);
  float t_Width = pullSymbolParameter(u_Parameters.width, SymNum);
  float t_Height = pullSymbolParameter(u_Parameters.height, SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, SymNum);

  float dist = SDF_FAR_AWAY;

  if (t_Symbol == u_Shapes.Round || t_Symbol == u_Shapes.Hole) {
    dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
  } else if (t_Symbol == u_Shapes.Square || t_Symbol == u_Shapes.Rectangle) {
    dist = boxDist(FragCoord.xy, vec2(t_Width, t_Height));
  }
  return dist;
}

//////////////////////////////
//     Draw functions       //
//////////////////////////////


float draw(float dist, float pixel_size) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > pixel_size / 2.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -pixel_size / 2.0) {
    discard;
  }
  return dist;
}

float lineDistMain(vec2 coord) {
  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height));

  float dX = v_Start_Location.x - v_End_Location.x;
  float dY = v_Start_Location.y - v_End_Location.y;
  float len = distance(v_Start_Location, v_End_Location);
  float angle = atan(dY/dX);
  float start = drawShape(translate(coord, (v_Start_Location - Center_Location)) * rotateCW(-angle + PI/2.0), int(v_SymNum));
  float end = drawShape(translate(coord, (v_End_Location - Center_Location)) * rotateCW(-angle + PI/2.0), int(v_SymNum));
  float con = boxDist(coord * rotateCW(-angle), vec2(len, OD));
  float dist = merge(start,end);
  dist = merge(dist, con);
  return dist;
}

vec2 transfromLocation(vec2 pixel_coord) {
  vec2 center_location = (v_Start_Location + v_End_Location) / 2.0;
  vec2 normal_coord = ((pixel_coord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = u_InverseTransform * vec3(normal_coord, 1.0);
  vec2 offset_postition = transformed_position.xy - center_location;
  vec2 true_coord = offset_postition;
  return true_coord;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = u_Alpha * max(float(u_OutlineMode), polarity);

  vec2 FragCoord = transfromLocation(gl_FragCoord.xy);
  float dist = lineDistMain(FragCoord);




  if (u_QueryMode) {
    vec2 PointerCoord = transfromLocation(u_PointerPosition);
    float PointerDist = lineDistMain(PointerCoord);

    if (PointerDist < pixel_size) {
      if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        return;
      } else {
        discard;
      }
    } else {
      discard;
    }
  }

  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
