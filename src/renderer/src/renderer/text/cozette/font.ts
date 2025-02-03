import { vec2 } from 'gl-matrix'
import { characters } from './characters'
const fontWidth = 13
const fontHeight = 13
const radius = Math.ceil(Math.sqrt(characters.length))
const textureWidth = radius * fontWidth
const textureHeight = radius * fontHeight
export const fontInfo = {
  fontSize: vec2.fromValues(fontWidth, fontHeight),
  fontSpacing: vec2.fromValues(-6, 3),
  textureSize: vec2.fromValues(textureWidth, textureHeight),
  characterLocation: characters.reduce((acc, char, i) => {
    const x = i % radius
    const y = Math.floor(i / radius)
    acc[char] = { x: x * fontWidth, y: y * fontHeight }
    return acc
  }, {} as Record<string, { x: number; y: number }>)
}
