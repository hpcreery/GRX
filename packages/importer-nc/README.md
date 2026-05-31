# @grx/importer-nc

### Blazingly fast Excellon / NC drill-and-rout parsing for GRX.

This package tokenizes NC drill files with Chevrotain, builds a CST, and converts supported commands into GRX artwork shapes such as pads, lines, arcs, datum marks, and step-repeat structures.

It is designed for:

- Fast parsing of Excellon-style NC drill and rout programs
- Distinguishing parser compatibility from geometry generation
- Reusing the low-level lexer/parser/visitor when you need full control

## What it exports

- `NCLexer`: low-level lexer
- `NCParser`: parser class
- `NCToShapesVisitor`: CST visitor that converts commands into GRX shapes
- `parseNC(input, params?)`: high-level helper that runs lexer, parser, and visitor in one call

## Quick start

```ts
import { parseNC } from "@grx/importer-nc"

const source = `M48
INCH,TZ
T01C0.04
%
G90
T01
X0Y0
M30
`

const result = parseNC(source)

if (result.lexingResult.errors.length || result.parseErrors.length) {
	throw new Error("NC file contains syntax errors")
}

console.log(result.shapes)
console.log(result.visitor.state.units)
console.log(result.visitor.toolStore)
```

## Example API implementation

If you want a small application-facing wrapper, keep the exported low-level details but fail fast on syntax issues.

```ts
import type * as Shapes from "@grx/artwork-format/shape"
import { parseNC } from "@grx/importer-nc"

export interface ParsedNCProgram {
	shapes: Shapes.Shape[]
	units: "inch" | "mm"
	coordinateFormat: [number, number]
	zeros: "leading" | "trailing"
}

export function parseNCProgram(source: string): ParsedNCProgram {
	const result = parseNC(source)

	if (result.errors.length > 0) {
		const first = result.errors[0]
		throw new Error(`NC parsing failed: ${first.message}`)
	}

	return {
		shapes: result.shapes,
		units: result.visitor.state.units,
		coordinateFormat: result.visitor.state.coordinateFormat,
		zeros: result.visitor.state.zeros,
	}
}
```

## Parsing model

The package currently has three practical support levels:

- `Parsed`: accepted by the grammar without syntax errors
- `State`: parsed and updates parser/visitor state
- `Shapes`: parsed and produces GRX geometry or datum annotations

That distinction matters because several Excellon commands are intentionally recognized for compatibility before full geometry generation is implemented.

## Supported commands

Commands are supported with best effort based on the drill and rout family syntax, which includes but is not limited to:
- Excellon 2 ([superset of IPC-NC-349](https://en.wikipedia.org/wiki/PCB_NC_formats#:~:text=Excellon%202%20is%20a%20superset%20of%20IPC%2DNC%2D349))
- [XNC](https://www.ucamco.com/files/downloads/file_en/305/xnc-format-specification_en.pdf?41a95d04a3e7b30d7e8ccff8a4241931) ([subset of IPC-NC-349](https://en.wikipedia.org/wiki/PCB_NC_formats#:~:text=The%20XNC%20format%20is%20strict%20subset%20of%20the%20IPC%2DNC%2D349))
- IPC-NC-349

### Header, tools, comments, and coordinates

| Command | Form | Level | Notes | Supported | Todo |
| --- | --- | --- | --- | --- | --- |
| Units | `INCH[,TZ\|LZ][,format]`, `METRIC[,TZ\|LZ][,format]` | State | Sets units, zero suppression, and optional coordinate format. | ✅ | |
| Incremental switch | `ICI,ON` / `ICI,OFF` | State | Header-style coordinate mode switch. | ✅ | |
| Header start | `M48` | Parsed | Header marker. | ✅ | |
| Header end | `%` or `M95` | Parsed | Both forms terminate the header. | ✅ | |
| Comments | `; comment` or `(comment)` | Parsed | `#@!` attributes are tokenized inside comment mode. | ✅ | |
| Compensation index | `CP,index,value` | State | Stores cutter compensation lookup entries. | ✅ | |
| Tool definition | `TnnCdia[F][S][B][H][Z]` | State | Stores round tools by diameter. Feed/speed metadata is parsed, but only diameter is used for geometry today. | ✅ | |
| Tool change | `Tnn` or `Tnncc` | State | Selects tool and optional compensation index. | ✅ | |
| Coordinates | `X...`, `Y...`, `X...Y...` | State | Supports explicit decimals plus leading/trailing zero suppression modes. | ✅ | |
| Arc radius | `A...` | State | Sets pending arc radius for arc interpolation. | ✅ | |
| Arc center | `I...J...` | State | Sets pending arc center offset for arc interpolation. | ✅ | |
| Repeat hole | `R<count>X...Y...` | Shapes | Emits repeated pads using the current tool. | ✅ | |

### M-codes

| Code | Meaning | Level | Notes | Supported | Todo |
| --- | --- | --- | --- | --- | --- |
| `M00` | End of program without rewind | Parsed | Coordinate suffix is parsed but does not affect output. | ✅ | |
| `M01` | End of pattern | State | Closes the current pattern for step-repeat assembly. | ✅ | |
| `M02` | Repeat pattern offset | State | Adds step-repeat offsets and optional mirror/rotate modifiers. | ✅ | |
| `M06` | Optional stop | Parsed | Recognized for compatibility; no geometry/state effect yet. | ⚠️ | |
| `M08` | End of step-and-repeat | Shapes | Finalizes and emits the accumulated step-repeat block. | ✅ | |
| `M09` | Stop for inspect | Parsed | Recognized for compatibility; no geometry/state effect yet. | ⚠️ | |
| `M14` | Z-axis rout position with depth-controlled contouring | Shapes | Starts a routed chain and emits plunge datums. | ✅ | |
| `M15` | Z-axis rout position | Shapes | Starts a routed chain and emits plunge datums. | ✅ | |
| `M16` | Retract with clamping | State | Ends plunge state. | ✅ | |
| `M17` | Retract | State | Ends plunge state. | ✅ | |
| `M25` | Begin pattern | State | Starts buffering shapes for step-repeat. | ✅ | |
| `M30` | End of program with rewind | Parsed | Recognized end marker. | ✅ | |
| `M45` | Long operator message | Parsed | Message text is parsed, but no output is generated yet. | ⚠️ | |
| `M47` | Operator message | Parsed | Message text is parsed, but no output is generated yet. | ⚠️ | |
| `M48` | Header start | Parsed | Included here because it is also the Excellon header control code. | ✅ | |
| `M70` | Step-repeat transform modifier | State | Used with `M02` to add rotation/mirroring behavior. | ✅ | |
| `M71` | Metric mode | State | Switches in-body units to millimeters. | ✅ | |
| `M72` | Inch mode | State | Switches in-body units to inches. | ✅ | |
| `M80` | Step-repeat transform modifier | State | Used with `M02` to mirror step-repeat placements. | ✅ | |
| `M90` | Step-repeat transform modifier | State | Used with `M02` to mirror step-repeat placements. | ✅ | |
| `M95` | Header end | Parsed | Alternate header terminator. | ✅ | |

### G-codes

| Code | Meaning | Level | Notes | Supported | Todo |
| --- | --- | --- | --- | --- | --- |
| `G00` | Rout mode / rapid move | State | Switches to rout mode and updates current position. Without plunge, only datum movement is produced. | ✅ | |
| `G01` | Linear interpolation | Shapes | Produces routed lines only while plunged. Otherwise it updates position and datums only. | ✅ | |
| `G02` | Clockwise arc interpolation | Shapes | Produces routed arcs only while plunged. Supports `A...` or `I...J...`. | ✅ | |
| `G03` | Counterclockwise arc interpolation | Shapes | Produces routed arcs only while plunged. Supports `A...` or `I...J...`. | ✅ | |
| `G04` | Dwell | Parsed | Time value is parsed, but no output/state effect yet. | ⚠️ | |
| `G05` | Drill mode | State | Returns to drill mode and clears plunge state. | ✅ | |
| `G32` | Clockwise circle | Shapes | Emits a circular arc sweep using the current tool diameter as the cutter basis. | ✅ | |
| `G33` | Counterclockwise circle | Shapes | Emits a circular arc sweep using the current tool diameter as the cutter basis. | ✅ | |
| `G34` | Select vision tool | Parsed | Accepted for compatibility; text payload is parsed but not applied. | ⚠️ | |
| `G35` | Single-point vision offset | Shapes | Emits alignment-point datums and updates position. | ✅ | |
| `G36` | Multi-point vision offset | Shapes | Emits alignment-point datums and updates position. | ✅ | |
| `G37` | Cancel vision offset | Parsed | Accepted for compatibility; currently a no-op. | ⚠️ | |
| `G38` | Vision-corrected single hole | Shapes | Emits vision-correction datums and updates position. | ✅ | |
| `G39` | Vision auto calibration | Parsed | Accepted for compatibility; text payload is parsed but currently ignored. | ⚠️ | |
| `G40` | Cutter compensation off | State | Disables compensation for routed geometry. | ✅ | |
| `G41` | Cutter compensation left | State | Enables left compensation for routed geometry. | ✅ | |
| `G42` | Cutter compensation right | State | Enables right compensation for routed geometry. | ✅ | |
| `G45` | Relative single-point vision offset | Shapes | Emits alignment-point datums and updates position. | ✅ | |
| `G46` | Relative multi-point vision offset | Shapes | Emits alignment-point datums and updates position. | ✅ | |
| `G47` | Cancel relative vision offset | Parsed | Accepted for compatibility; currently a no-op. | ⚠️ | |
| `G48` | Relative vision-corrected single hole | Shapes | Emits vision-correction datums and updates position. | ✅ | |
| `G82` | Canned dual in-line package | Parsed | Parsed for compatibility only; geometry generation is not implemented yet. | ⚠️ | ✔️ |
| `G83` | Canned eight-pin L pack | Parsed | Parsed for compatibility only; geometry generation is not implemented yet. | ⚠️ | ✔️ |
| `G84` | Canned circle | Shapes | Emits a circular pad at the current location. | ✅ | |
| `G85` | Canned slot | Shapes | Emits a routed slot line plus datum and end pad. | ✅ | |
| `G87` | Routed step slot | Shapes | Emits a routed slot line. `Z...` and `U...` are parsed as part of the command form. | ✅ | |
| `G90` | Absolute mode | State | Sets absolute coordinates. | ✅ | |
| `G91` | Incremental mode | State | Sets incremental coordinates. | ✅ | |
| `G93` | Zero set | Shapes | Emits a zero-set datum point and label. | ✅ | |

## ⚠️ What may not be fully supported yet

The parser intentionally accepts more Excellon syntax than it currently turns into geometry. The main gaps today are:

- `G82` canned dual in-line package: parsed only
- `G83` canned eight-pin L pack: parsed only
- `G34` select vision tool: parsed payload, no applied behavior yet
- `G37` and `G47` cancel vision offset commands: parsed no-ops
- `G39` vision auto calibration: parsed payload, no applied behavior yet
- `G04`, `M06`, `M09`, `M45`, and `M47`: recognized for compatibility, but currently do not emit shapes or significant state changes
- Additional Excellon canned cycle commands beyond the implemented `G84`, `G85`, and `G87` family are still open work

## Notes on geometry generation

- In drill mode, coordinate moves emit pads and datum markers using the current tool.
- In rout mode, `G01`, `G02`, and `G03` only emit routed geometry after `M14` or `M15` plunges.
- Cutter compensation (`G40` / `G41` / `G42`) is applied to routed output when geometry is generated.
- Step-repeat is modeled through `M25`, `M01`, `M02`, and `M08`.

## Development

```bash
pnpm --filter @grx/importer-nc test
pnpm --filter @grx/importer-nc typecheck
```
