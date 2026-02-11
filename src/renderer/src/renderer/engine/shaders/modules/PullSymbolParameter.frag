float pullSymbolParameter(int offset, float SymNum) {
  vec2 texcoord = (vec2(float(offset), SymNum) + 0.5) / u_SymbolsTextureDimensions;
  vec4 pixelValue = texture2D(u_SymbolsTexture, texcoord);
  return pixelValue.x;
}

#pragma glslify: export(pullSymbolParameter)
