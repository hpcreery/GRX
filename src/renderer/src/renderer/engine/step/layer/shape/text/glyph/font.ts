export interface FontInfo {
  letterHeight: number
  letterWidth: number
  // spaceWidth: number;
  // spacing: number;
  textureWidth: number
  textureHeight: number
  glyphInfos: Record<string, { x: number; y: number }>
}

export const fontInfo: FontInfo = {
  letterHeight: 8,
  letterWidth: 8,
  // spaceWidth: 8,
  // spacing: -1,
  textureWidth: 64,
  textureHeight: 40,
  glyphInfos: {
    a: { x: 0, y: 0 },
    b: { x: 8, y: 0 },
    c: { x: 16, y: 0 },
    d: { x: 24, y: 0 },
    e: { x: 32, y: 0 },
    f: { x: 40, y: 0 },
    g: { x: 48, y: 0 },
    h: { x: 56, y: 0 },
    i: { x: 0, y: 8 },
    j: { x: 8, y: 8 },
    k: { x: 16, y: 8 },
    l: { x: 24, y: 8 },
    m: { x: 32, y: 8 },
    n: { x: 40, y: 8 },
    o: { x: 48, y: 8 },
    p: { x: 56, y: 8 },
    q: { x: 0, y: 16 },
    r: { x: 8, y: 16 },
    s: { x: 16, y: 16 },
    t: { x: 24, y: 16 },
    u: { x: 32, y: 16 },
    v: { x: 40, y: 16 },
    w: { x: 48, y: 16 },
    x: { x: 56, y: 16 },
    y: { x: 0, y: 24 },
    z: { x: 8, y: 24 },
    "0": { x: 16, y: 24 },
    "1": { x: 24, y: 24 },
    "2": { x: 32, y: 24 },
    "3": { x: 40, y: 24 },
    "4": { x: 48, y: 24 },
    "5": { x: 56, y: 24 },
    "6": { x: 0, y: 32 },
    "7": { x: 8, y: 32 },
    "8": { x: 16, y: 32 },
    "9": { x: 24, y: 32 },
    "-": { x: 32, y: 32 },
    "*": { x: 40, y: 32 },
    "!": { x: 48, y: 32 },
    "?": { x: 56, y: 32 },
  },
}
