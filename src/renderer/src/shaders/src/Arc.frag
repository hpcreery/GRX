precision highp float;

#pragma glslify: import('../modules/Constants.glsl')

#pragma glslify: import('../modules/structs/Shapes.glsl')
uniform Shapes u_Shapes;

#pragma glslify: import('../modules/structs/Parameters.glsl')
uniform Parameters u_Parameters;


// COMMON UNIFORMS
uniform sampler2D u_SymbolsTexture;
uniform vec2 u_SymbolsTextureDimensions;
uniform float u_QtyFeatures;
uniform mat3 u_Transform;
uniform mat3 u_InverseTransform;
uniform vec2 u_Resolution;
uniform float u_PixelSize;
uniform bool u_OutlineMode;
uniform bool u_SkeletonMode;
uniform vec3 u_Color;
uniform float u_Alpha;
uniform float u_Polarity;
uniform vec2 u_PointerPosition;
uniform bool u_PointerDown;
uniform bool u_QueryMode;

// COMMON VARYINGS
varying float v_Aspect;

// ARC VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying vec2 v_Center_Location;
varying float v_Polarity;
varying float v_Clockwise;
varying float v_ResizeFactor;

//////////////////////////////////////
// Combine distance field functions //
//////////////////////////////////////


float merge(float d1, float d2) {
  return min(d1, d2);
}

float substract(float d1, float d2) {
  return max(-d1, d2);
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

float pie(vec2 p, float angle) {
  angle = radians(angle) / 2.0;
  vec2 n = vec2(cos(angle), sin(angle));
  return abs(p).x * n.x + p.y * n.y;
}

float sdPie(in vec2 p, in float angle, in float radius) {
  vec2 c = vec2(sin(angle), cos(angle));
  p.x = abs(p.x);
  float l = length(p) - radius;
  float m = length(p - c * clamp(dot(p, c), 0.0, radius));
  return max(l, m * sign(c.y * p.x - c.x * p.y));
}

float slice(in vec2 p, in float angle) {
  vec2 c = vec2(cos(angle), sin(angle));
  //p.x = abs(p.x);
  p.y = abs(p.y);
  float n = length(p - c * dot(p, c));
  return n * sign(c.y * p.x - c.x * p.y);
}

float circleDist(vec2 p, float radius) {
  return length(p) - radius;
}

float roundArcDist( in vec2 p, in float curve, in float radius, float thickness )
{
    // sc is the sin/cos of the arc's aperture
    vec2 sc = vec2(sin(curve), cos(curve));
    p.x = abs(p.x);
    return ((sc.y*p.x>sc.x*p.y) ? length(p-sc*radius) : abs(length(p)-radius)) - thickness;
}

float flatArcDist( in vec2 p, in float curve, in float radius, float thickness )
{
    // sc is the sin/cos of the arc's aperture
    vec2 sc = vec2(sin(curve), cos(curve));
    p.x = abs(p.x);

    p = mat2(sc.x,sc.y,-sc.y,sc.x)*p;

    return max( abs(length(p)-radius)-thickness*0.5,
                length(vec2(p.x,max(0.0,abs(radius-p.y)-thickness*0.5)))*sign(p.x) );
}

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
// #pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
// Here we can redefine drawShape with a much smaller footprint to improve comiling performance. Limiting arcs to only be drawn with circles.
float drawShape(vec2 FragCoord, int SymNum) {

  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, SymNum);
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, SymNum);

  float dist = SDF_FAR_AWAY;

  if (t_Symbol == u_Shapes.Round || t_Symbol == u_Shapes.Hole) {
    dist = circleDist(FragCoord.xy, t_Outer_Dia / 2.0);
  }
  return dist;
}


//////////////////////////////
//     Draw functions       //
//////////////////////////////

float draw(float dist, float pixel_size) {
  // if (DEBUG == 1) {
  //   return dist;
  // }
  if (dist > pixel_size / 2.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -pixel_size / 2.0) {
    discard;
  }
  return dist;
}



float arcDistMain(vec2 FragCoord) {
  float t_Symbol = pullSymbolParameter(u_Parameters.symbol, int(v_SymNum));
  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height));

  // ? radius can be different bewtween these two
  float radius = distance(v_Start_Location, v_Center_Location);
  float radius2 = distance(v_End_Location, v_Center_Location);

  float sdX = v_Start_Location.x - v_Center_Location.x;
  float sdY = v_Start_Location.y - v_Center_Location.y;
  float start_angle = atan(sdY, sdX);
  float edX = v_End_Location.x - v_Center_Location.x;
  float edY = v_End_Location.y - v_Center_Location.y;
  float end_angle = atan(edY, edX);

  // invalid SDF
  // float start = drawShape(translate(FragCoord, (v_Start_Location - v_Center_Location)) * rotateCW(-start_angle), int(v_SymNum));
  // float end = drawShape(translate(FragCoord, (v_End_Location - v_Center_Location)) * rotateCW(-end_angle), int(v_SymNum));
  // float con = (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
  // if (start_angle == end_angle) {
  //   con = circleDist(FragCoord, radius - (OD / 2.0));
  // }
  // con = substract(con, abs(circleDist(FragCoord, radius)) - OD / 2.0);
  // float dist = merge(start, end);
  // dist = merge(dist, con);

  float dist = SDF_FAR_AWAY;
  float rotation_direction = PI/2.0 * (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0);
  float angle_diff = abs(start_angle - end_angle)/2.0;
  float curve_direction = rotation_direction > 0.0 ? angle_diff : PI - angle_diff;
  if (t_Symbol == u_Shapes.Round || t_Symbol == u_Shapes.Hole) {
    dist = roundArcDist(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0) - rotation_direction), curve_direction, radius, OD / 2.0);
  } else {
    dist = flatArcDist(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0) - rotation_direction), curve_direction, radius, OD);
  }
  if (start_angle == end_angle) {
    dist = abs(circleDist(FragCoord, radius)) - OD / 2.0;
  }
  return dist;
}

float arcDistSkeleton(vec2 FragCoord) {
  float OD = 0.0;

  // ? radius can be different bewtween these two
  float radius = distance(v_Start_Location, v_Center_Location);
  float radius2 = distance(v_End_Location, v_Center_Location);

  float sdX = v_Start_Location.x - v_Center_Location.x;
  float sdY = v_Start_Location.y - v_Center_Location.y;
  float start_angle = atan(sdY, sdX);
  float edX = v_End_Location.x - v_Center_Location.x;
  float edY = v_End_Location.y - v_Center_Location.y;
  float end_angle = atan(edY, edX);

  // float dist = (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0) * slice(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0)), abs(start_angle - end_angle) / 2.0);
  // if (start_angle == end_angle) {
  //   dist = circleDist(FragCoord, radius - (OD / 2.0));
  // }
  // dist = substract(dist, abs(circleDist(FragCoord, radius)) - OD / 2.0);
  // return dist;

  float dist = SDF_FAR_AWAY;
  float rotation_direction = PI/2.0 * (v_Clockwise == 0.0 ? -1.0 : 1.0) * (start_angle - end_angle >= 0.0 ? 1.0 : -1.0);
  float angle_diff = abs(start_angle - end_angle)/2.0;
  float curve_direction = rotation_direction > 0.0 ? angle_diff : PI - angle_diff;
  dist = roundArcDist(FragCoord * rotateCCW(((start_angle + end_angle) / 2.0) - rotation_direction), curve_direction, radius, 0.0);
  if (start_angle == end_angle) {
    dist = abs(circleDist(FragCoord, radius));
  }
  return dist;
}

float arcDist(vec2 FragCoord) {
  float dist = arcDistMain(FragCoord);

  if (u_SkeletonMode) {
    float skeleton = arcDistSkeleton(FragCoord);
    if (u_OutlineMode) {
      dist = max(dist, -skeleton);
    } else {
      dist = skeleton;
    }
  }
  return dist;
}


vec2 transformLocation(vec2 pixel_location) {
  vec2 normal_coord = ((pixel_location.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 transformed_position = u_InverseTransform * vec3(normal_coord, 1.0);
  vec2 offset_postition = transformed_position.xy - v_Center_Location;
  vec2 true_coord = offset_postition;
  return true_coord;
}

void main() {
  float scale = sqrt(pow(u_Transform[0][0], 2.0) + pow(u_Transform[1][0], 2.0)) * u_Resolution.x;
  float pixel_size = u_PixelSize / scale;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = u_Alpha * max(float(u_OutlineMode), polarity);

  vec2 FragCoord = transformLocation(gl_FragCoord.xy);
  if (u_QueryMode) {
    FragCoord = u_PointerPosition;
  }

  float dist = arcDist(FragCoord);


  if (u_QueryMode) {
    if (gl_FragCoord.xy == vec2(mod(v_Index, u_Resolution.x) + 0.5, floor(v_Index / u_Resolution.x) + 0.5)) {
      vec2 direction = normalize(vec2(
          (arcDist(FragCoord + vec2(1, 0) * EPSILON) - arcDist(FragCoord + vec2(-1, 0) * EPSILON)),
          (arcDist(FragCoord + vec2(0, 1) * EPSILON) - arcDist(FragCoord + vec2(0, -1) * EPSILON))
      ));
      // the first value is the distance to the border of the shape
      // the second value is the direction of the border of the shape
      // the third value is the indicator of a measurement
      gl_FragColor = vec4(dist, direction, 1.0);
      return;
    } else {
      discard;
    }
  }

  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist, pixel_size);

  gl_FragColor = vec4(color, alpha);
}
