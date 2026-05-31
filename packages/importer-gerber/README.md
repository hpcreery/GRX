# 🚀 Blazingly Fast Gerber Parser

A high-performance, fully-featured **Gerber (RS-274X X3) parser** written in TypeScript. Parse PCB design files with lightning-fast speed and complete standard compliance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- **⚡ Blazingly Fast** – Optimized parsing engine for large PCB files
- **✅ Full RS-274X X3 Support** – Complete Gerber format compliance
- **🎯 Accurate Geometry** – Proper arc calculation and coordinate handling
- **📦 Zero Dependencies** – Minimal runtime dependencies
- **🔧 TypeScript Native** – Full type safety
- **🧵 Web Worker Ready** – WebWorker support for background parsing
- **🎨 Shape Conversion** – Built-in conversion to standardized shape formats

## 📦 Installation

```bash
pnpm add @grx/parser-gerber
```

Or with npm/yarn:

```bash
npm install @grx/parser-gerber
yarn add @grx/parser-gerber
```

## 🚀 Quick Start

```typescript
import { parseGerber } from '@grx/parser-gerber'

// Parse a Gerber file
const gerberContent = `
%FSLAX25Y25*%
%MOIN*%
%ADD10C,0.01*%
D10*
X0Y0D02*
X100Y100D01*
M02*
`

const result = parseGerber(gerberContent)

// Access parsed elements
console.log(result.apertures)    // Defined apertures
console.log(result.operations)   // Drawing operations
console.log(result.shapes)       // Converted shapes
```

## 📋 What is Gerber?

[Gerber](https://www.ucamco.com/en/guest/article/gerber-format-specification) (RS-274X) is the industry-standard file format for PCB (Printed Circuit Board) design and manufacturing. It describes:

- **Layers** – Individual copper, silk-screen, mask layers
- **Apertures** – Drawing tools (circles, rectangles, polygons)
- **Operations** – Draw, move, and flash operations
- **Transformations** – Rotation, mirroring, scaling

This parser extracts and validates all Gerber data, converting it into a structured format ready for visualization or manufacturing workflows.

## 🔌 API

### `parse(file: string): GerberParseResult`

Parse a Gerber file and return a complete document representation.

**Parameters:**
- `file` – Gerber file content as string

**Returns:**
- `GerberParseResult` – Object containing:
  - `image` – Array of shape primitives of type Shapes.Shape[]. See `@grx/artwork-format` for shape definitions.
  - `errors` – Array of error messages encountered during parsing

**Example:**
```typescript
const doc = parse(fileContent)

doc.image.forEach((shape, index) => {
  console.log(`Shape ${index}: ${shape.type}`)
})

doc.errors.forEach((error, index) => {
  console.log(`Error ${index}: ${error}`)
})
```

## 🎯 Performance

This parser is optimized for speed:

Much appreciation from the [Chevrotain](https://chevrotain.io/) team for their incredible parsing library.

## 🛠️ Development

### Build
```bash
pnpm build
```

### Type Check
```bash
pnpm typecheck
```

### Test Data

Sample Gerber files are included in the `src/testdata/` directory for development and validation.

## 📚 Monorepo Integration

This package is part of the **GRX** monorepo and integrates with:
- `@grx/artwork-format` – Shape and symbol definitions
- `@grx/engine` – Rendering engine

## 📄 License

MIT © [GRX Contributors](LICENSE)

## 🔗 References

- [Gerber Format Specification](https://www.ucamco.com/en/gerber) – Official RS-274X spec
- [Ucamco](https://www.ucamco.com/) – Gerber standard maintainer
- [Chevrotain](https://chevrotain.io/) – Parser library used for tokenization and parsing

---

**Made with ⚡ for lightning-fast PCB parsing**
