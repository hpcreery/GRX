import { vec2 } from 'gl-matrix'
import { characters } from './characters'
// const fontWidth = 13
// const fontHeight = 13
const fontSize = 13
const radius = Math.ceil(Math.sqrt(characters.length))
const textureWidth = radius * fontSize
const textureHeight = radius * fontSize
export const fontInfo = {
  // fontWidth,
  // fontHeight,
  fontSize,
  fontSpacing: vec2.fromValues(-6, 3),
  textureWidth,
  textureHeight,
  glyphInfos: characters.reduce((acc, char, i) => {
    const x = i % radius
    const y = Math.floor(i / radius)
    acc[char] = { x: x * fontSize, y: y * fontSize }
    return acc
  }, {} as Record<string, { x: number; y: number }>)
}
