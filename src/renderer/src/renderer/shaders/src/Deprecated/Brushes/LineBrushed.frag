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
uniform float u_Polarity;

// COMMON VARYINGS
varying float v_Aspect;

// LINE VARYINGS
varying float v_Index;
varying float v_SymNum;
varying vec2 v_Start_Location;
varying vec2 v_End_Location;
varying float v_ResizeFactor;
varying float v_Polarity;
varying float v_Rotation;
varying float v_Mirror_X;
varying float v_Mirror_Y;

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

vec2 mirror_x(float m) {
  return vec2(m == 1.0 ? -1.0 : 1.0, 1.0);
}

vec2 mirror_y(float m) {
  return vec2(1.0, m == 1.0 ? -1.0 : 1.0);
}

//////////////////////////////
// Distance field functions //
//////////////////////////////



float boxDist(vec2 p, vec2 size) {
  size /= 2.0;
  vec2 d = abs(p) - size;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

#pragma glslify: pullSymbolParameter = require('../modules/PullSymbolParameter.frag',u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)
#pragma glslify: drawShape = require('../modules/SignedDistanceShapes.frag',u_Parameters=u_Parameters,u_Shapes=u_Shapes,u_SymbolsTexture=u_SymbolsTexture,u_SymbolsTextureDimensions=u_SymbolsTextureDimensions)

float brushEndsDist(vec2 p) {
  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;
  float start = drawShape(translate(p, (v_Start_Location - Center_Location)) * (1.0/v_ResizeFactor) * rotateCW(radians(v_Rotation)) * mirror_x(v_Mirror_X) * mirror_y(v_Mirror_Y), int(v_SymNum));
  float end = drawShape(translate(p, (v_End_Location - Center_Location)) * (1.0/v_ResizeFactor) * rotateCW(radians(v_Rotation)) * mirror_x(v_Mirror_X) * mirror_y(v_Mirror_Y), int(v_SymNum));
  return merge(start,end) * v_ResizeFactor;
}

//////////////////////////////
//     Draw functions       //
//////////////////////////////

const int BRUSH_ITERATIONS = 64;
float brush(vec2 frag_coord)
{
  vec2 direction = normalize(v_End_Location - v_Start_Location);

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height)) * 1.5 * v_ResizeFactor;

	// distance traveled
	float distance_traveled = 0.0;
  float climb = 0.0;
  float return_value = 0.0;
  float signed_distance = 0.0;
  float prev_signed_distance = signed_distance;
	for (int i = 0; i < BRUSH_ITERATIONS; ++i)
	{
    // distance to scene at current position
    prev_signed_distance = signed_distance;
		signed_distance = brushEndsDist(frag_coord - direction * distance_traveled);

    if (signed_distance <= 0.0) {
      return_value = 1.0;
      break;
    }

    if (i == 0) {
      climb = sign(brushEndsDist(frag_coord + direction * u_PixelSize) - signed_distance);
    } else {
      float temp_dt = abs((signed_distance * prev_signed_distance) / abs(prev_signed_distance - signed_distance)) * -climb * 1.5;
      float sd2 = brushEndsDist(frag_coord - direction * (distance_traveled + temp_dt));
      if (sd2 <= 0.0) {
        return_value = 1.0;
        break;
      }
    }

    distance_traveled += max(u_PixelSize, abs(signed_distance)) * -climb;
    if (distance_traveled > length(v_End_Location - v_Start_Location) + OD) {
      break;
    }
	}
	return return_value;
}

float draw(float dist) {
  if (DEBUG == 1) {
    return dist;
  }
  if (dist > 0.0) {
    discard;
  }
  if (dist * float(u_OutlineMode) < -u_PixelSize) {
    discard;
  }
  // if(outline) {
  //   if(dist < -scale * u_PixelSize) {
  //     discard;
  //   }
  // }
  return dist;
}

void main() {

  vec2 Center_Location = (v_Start_Location + v_End_Location) / 2.0;

  vec2 NormalFragCoord = ((gl_FragCoord.xy / u_Resolution.xy) * vec2(2.0, 2.0)) - vec2(1.0, 1.0);
  vec3 TransformedPosition = u_InverseTransform * vec3(NormalFragCoord, 1.0);
  vec2 OffsetPosition = TransformedPosition.xy - Center_Location;
  vec2 FragCoord = OffsetPosition;

  float polarity = bool(v_Polarity) ^^ bool(u_Polarity) ? 0.0 : 1.0;
  vec3 color = u_Color * max(float(u_OutlineMode), polarity);
  float alpha = ALPHA * max(float(u_OutlineMode), polarity);

  float dist = brushEndsDist(FragCoord);
  float br = brush(FragCoord);
  // dist = min(dist, br);
  if (br == 1.0) {
    dist = min(dist, -u_PixelSize / 2.0);
  }


  #pragma glslify: import('../modules/Debug.glsl')
  dist = draw(dist);

  gl_FragColor = vec4(color, alpha);
}
