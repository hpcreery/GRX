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
uniform vec2 u_Screen;
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
varying float v_Mirror;

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

vec2 mirror(float m) {
  return vec2(m == 1.0 ? -1.0 : 1.0, 1.0);
}

vec2 mirror(vec2 p, float m) {
  return p * mirror(m);
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
  // p = mirror(p, v_Mirror);
  float start = drawShape(mirror(translate(p, (v_Start_Location - Center_Location)) * rotateCW(-radians(v_Rotation)), v_Mirror), int(v_SymNum));
  float end = drawShape(mirror(translate(p, (v_End_Location - Center_Location)) * rotateCW(-radians(v_Rotation)), v_Mirror), int(v_SymNum));
  return merge(start,end);
}

//////////////////////////////
//     Draw functions       //
//////////////////////////////

const int BRUSH_ITERATIONS = 64;
float brush(vec2 p)
{
  vec2 dir = normalize(v_End_Location - v_Start_Location);

  float t_Outer_Dia = pullSymbolParameter(u_Parameters.outer_dia, int(v_SymNum));
  float t_Width = pullSymbolParameter(u_Parameters.width, int(v_SymNum));
  float t_Height = pullSymbolParameter(u_Parameters.height, int(v_SymNum));
  float OD = max(t_Outer_Dia, max(t_Width, t_Height)) * 1.5 * v_ResizeFactor;

	// distance traveled
	float dt = 0.0;
  float climb = 0.0;
  float returnValue = 0.0;
  float sd = 0.0;
  float prev_sd = sd;
	for (int i = 0; i < BRUSH_ITERATIONS; ++i)
	{
    // distance to scene at current position
    prev_sd = sd;
		sd = brushEndsDist(p - dir * dt);

    if (sd <= 0.0) {
      returnValue = 1.0;
      break;
    }

    if (i == 0) {
      climb = sign(brushEndsDist(p + dir * u_PixelSize) - sd);
    } else {
      float temp_dt = abs((sd * prev_sd) / abs(prev_sd - sd)) * -climb * 1.5;
      float sd2 = brushEndsDist(p - dir * (dt + temp_dt));
      if (sd2 <= 0.0) {
        returnValue = 1.0;
        break;
      }
    }

    dt += max(u_PixelSize, abs(sd)) * -climb;
	}
	return returnValue;
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
