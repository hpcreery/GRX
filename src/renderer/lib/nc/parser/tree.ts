import type {Position} from 'unist'

import type * as Types from './types'
// import type * as Constants from './constants'

/**
 * {@linkcode Root} node type
 *
 * @category Node
 */
export const ROOT = 'root'

/**
 * {@linkcode Comment} node type
 *
 * @category Node
 */
export const COMMENT = 'comment'

/**
 * {@linkcode DrillHeader} node type
 *
 * @category Node
 */
export const DRILL_HEADER = 'drillHeader'

/**
 * {@linkcode Done} node type
 *
 * @category Node
 */
export const DONE = 'done'

/**
 * {@linkcode Units} node type
 *
 * @category Node
 */
export const UNITS = 'units'

/**
 * {@linkcode CoordinateFormat} node type
 *
 * @category Node
 */
export const COORDINATE_FORMAT = 'coordinateFormat'

/**
 * {@linkcode ToolDefinition} node type
 *
 * @category Node
 */
export const TOOL_DEFINITION = 'toolDefinition'

/**
 * {@linkcode ToolChange} node type
 *
 * @category Node
 */
export const TOOL_CHANGE = 'toolChange'

/**
 * {@linkcode Graphic} node type
 *
 * @category Node
 */
export const GRAPHIC = 'graphic'

/**
 * {@linkcode StepRepeatOpen} node type
 *
 * @category Node
 */
export const STEP_REPEAT_OPEN = 'stepRepeatOpen'

/**
 * {@linkcode StepRepeatOpen} node type
 *
 * @category Node
 */
export const STEP_REPEAT_CLOSE = 'stepRepeatClose'

/**
 * {@linkcode InterpolateMode} node type
 *
 * @category Node
 */
export const INTERPOLATE_MODE = 'interpolateMode'

/**
 * {@linkcode Unimplemented} node type
 *
 * @category Node
 */
export const UNIMPLEMENTED = 'unimplemented'

export const OPERATOR_MESSAGE = 'operatorMessage'

interface BaseNode {
  type: string
  /** Location in the source file the node was parsed from */
  position?: Position
}

interface BaseParent extends BaseNode {
  children: BaseNode[]
}

/**
 * Syntax tree node
 *
 * @category Node
 */
export type Node = Root | ChildNode

/**
 * Child of the tree's {@linkcode Root} node
 *
 * @category Node
 */
export type ChildNode =
  | Comment
  | DrillHeader
  | Done
  | Units
  | CoordinateFormat
  | ToolDefinition
  | ToolChange
  | InterpolateMode
  | StepRepeatOpen
  | StepRepeatClose
  | Graphic
  | OperatorMessage
  | Unimplemented

/**
 * Root node of the syntax tree, identifying the filetype and whether or not
 * the entire file seems to have been read. Filetype, if known, will be
 * either {@linkcode GERBER | gerber} or {@linkcode DRILL | drill}.
 *
 * @category Node
 */
export interface Root extends BaseParent {
  /** Node type */
  type: typeof ROOT

  /** Parse results */
  children: ChildNode[]
}

/**
 * Node representing a comment in the file. Usually, comment nodes can be
 * ignored, but in NC drill files, they may contain important format
 * specifications that are not able to be expressed in the file itself.
 *
 *  @category Node
 */
export interface Comment extends BaseNode {
  /** Node type */
  type: typeof COMMENT
  /** Contents of the comment as a string */
  comment: string
}

export interface OperatorMessage extends BaseNode {
  /** Node type */
  type: typeof OPERATOR_MESSAGE
  /** Contents of the comment as a string */
  message: string
}


/**
 * Node representing drill file's header start or end.
 *
 *  @category Node
 */
export interface DrillHeader extends BaseNode {
  /** Node type */
  type: typeof DRILL_HEADER
}

/**
 * Node representing a done command. This represents an `M02` or `M00` command
 * in a Gerber file or an `M00` or `M30` in an NC drill file. Its presence in a
 * tree means the full source file was parsed.
 *
 * @category Node
 */
export interface Done extends BaseNode {
  /** Node type */
  type: typeof DONE
}

/**
 * A `Units` node specifies the units used for the file. Units may be
 * {@linkcode IN | in} or {@linkcode MM | mm}.
 *
 * @category Node
 */
export interface Units extends BaseNode {
  /** Node type */
  type: typeof UNITS
  /** Inches or millimeters */
  units: Types.UnitsType
}

/**
 * A `CoordinateFormat` node specifies the format of coordinate value strings.
 *
 * In Gerber and drill files, coordinates are (almost always) specified as
 * strings of digits without decimal points. `format` is a tuple where the
 * first element is the number of integer places in the string and the second
 * is the number of decimal places. Leading or trailing zeros may also be
 * omitted from the coordinate strings.
 *
 * For example, with `format` set to `[2, 4]`, some (intermediate) coordinate
 * strings could be:
 *
 * - `0.012` > `000120`
 * - `3.45` > `034500`
 * - `67` > `670000`
 *
 * With those same numbers, either {@linkcode LEADING | leading} or
 * {@linkcode TRAILING | trailing} zeros may be omitted depending on the
 * `zeroSuppression` setting:
 *
 * - `0.012` > `000120` > leading omitted: `120`, trailing omitted: `00012`
 * - `3.45` > `024500` > leading omitted: `24500`, trailing omitted: `0245`
 * - `67` > `670000` > leading omitted: `670000`, trailing omitted: `67`
 *
 * Some important things to keep in mind when processing coordinate strings
 * according to the `CoordinateFormat` node:
 *
 * - `format`, `zeroSuppression`, and/or `mode` could be left unspecified
 *     - In this case, `format` and `zeroSuppression` should be assumed or
 *       inferred, if possible
 *     - It's very safe to assume `mode` is always {@linkcode ABSOLUTE | absolute};
 *       {@linkcode INCREMENTAL | incremental} mode is deprecated and very rare
 * - Just because `zeroSuppression` is set doesn't mean zeros are dropped
 *     - It's common to see Gerber writers keep all zeros to ensure there is no
 *       ambiguity, but `zeroSuppression` still needs to be set to _something_
 * - A Gerber or NC drill file may choose to include decimal points! This is
 *   not necessarily "in spec", but it is unambiguous and easy to parse
 *
 * @category Node
 */
export interface CoordinateFormat extends BaseNode {
  /** Node type */
  type: typeof COORDINATE_FORMAT
  /** Integer/decimal format setting, if known */
  format: Types.Format | undefined
  /** Zero suppression setting, if known */
  zeroSuppression: Types.ZeroSuppression | undefined
  /** Absolute or incremental coordinate system, if known */
  mode: Types.Mode | undefined
}

/**
 * A `ToolDefinition` node defines a "tool" that may be used to either create a
 * shape ("pad" or "drill hit") or a stroke ("trace" or "route") in a later
 * graphic command.
 *
 * A tool shape may be one of:
 *
 * - {@linkcode Types.Circle} - A circle defined by a diameter
 * - {@linkcode Types.Rectangle} - A rectangle defined by sizes in the x and y axis
 * - {@linkcode Types.Obround} - A "pill" rectangle, with a border-radius equal to half of its shorter side
 * - {@linkcode Types.Polygon} - A regular polygon defined by its diameter, number of vertices, and rotation
 * - {@linkcode Types.MacroShape} - A shape defined by a previous {@linkcode ToolMacro}
 *
 * A tool may have a hole in its center; the `hole`, if not `undefined`, may be a:
 *
 * - {@linkcode Types.Circle}
 * - {@linkcode Types.Rectangle} (deprecated by the Gerber specification)
 *
 * Only `Circle` or `Rectangle` tools without a `hole` may create strokes.
 * `MacroShape` tools may not have a `hole` defined.gfrfdr
 *
 * @category Node
 */
export interface ToolDefinition extends BaseNode {
  /** Node type */
  type: typeof TOOL_DEFINITION
  /** Unique tool identifier */
  code: string
  /** Tool shape */
  shape: Types.ToolShape
  /** Hole shape, if applicable */
  hole: Types.HoleShape | undefined
  /** Tool Parameters */
  // parameters: Object<string, string>
}

/**
 * A `ToolChange` node sets the current active "tool". At a given point in the
 * file, the active tool determines the image that graphical operations produce.
 *
 * @category Node
 */
export interface ToolChange extends BaseNode {
  /** Node type */
  type: typeof TOOL_CHANGE
  /** Tool identifier */
  code: string
}

/**
 * A `StepRepeat` node starts or ends a step repeat block.
 *
 * See the {@link https://www.ucamco.com/gerber | Gerber file specification}
 * for an in-depth description of step repeat blocks.
 *
 * @category Node
 */
export interface StepRepeatOpen extends BaseNode {
  /** Node type */
  type: typeof STEP_REPEAT_OPEN
  /** Step repeat parameters */
  stepRepeat: Types.StepRepeatParameters
}

/**
 * A `StepRepeat` node starts or ends a step repeat block.
 *
 * See the {@link https://www.ucamco.com/gerber | Gerber file specification}
 * for an in-depth description of step repeat blocks.
 *
 * @category Node
 */
export interface StepRepeatClose extends BaseNode {
  /** Node type */
  type: typeof STEP_REPEAT_CLOSE
}


/**
 * A `Graphic` node that represents an image being draw to the active layer.
 * The type of image "drawn" is dependent on the value of `graphic`:
 *
 * - {@linkcode SHAPE | shape} - the shape of the current tool is added to the
 *   image at `coordinates`
 * - {@linkcode MOVE | move} - the plotter is "moved" to `coordinates` **without
 *   drawing anything to the image**
 * - {@linkcode SEGMENT | segment} - the tool is "stroked" from the plotter's
 *   current location to `coordinates`
 *     - The path the tool takes is determined by the current {@linkcode InterpolateMode}
 *     - The segment may be a standalone path, or it may be a part of a region
 *       fill set by a {@linkcode RegionMode}
 *     - Only {@linkcode Circle} or {@linkcode Rectangle} tools may create
 *       standalone paths
 * - {@linkcode SLOT | slot} - a drill-file-specific graphic that creates a
 *   slot from `(coordinates.x1, coordinates.y1)` to `(coordinates.x2, coordinates.y2)`
 * - `undefined` - The graphic type was not explicitly specified in the source file
 *     - This is deprecated syntax in Gerber files, but if present the last
 *       used graphic type should be repeated
 *     - In a drill file, this means `shape` if in `drill` mode (default),
 *       `move` if in `move` mode, or `segment` if in a routing mode
 *
 * @category Node
 */
export interface Graphic extends BaseNode {
  /** Node type */
  type: typeof GRAPHIC
  /** Graphical operation */
  graphic: Types.GraphicType | undefined
  /** Coordinates where the graphic will be applied */
  coordinates: Types.Coordinates
}

/**
 * An `InterpolateMode` node is a command to define how subsequent `segment`
 * (or `undefined`, if you're processing a drill file) graphic nodes are rendered.
 * The `mode` may be one of:
 *
 * - {@linkcode LINE | line} - Draw a straight line segment
 * - {@linkcode CW_ARC | cwArc} - Draw a clockwise arc segment
 * - {@linkcode CCW_ARC | ccwArc} - Draw a counterclockwise arc segment
 * - {@linkcode MOVE | move } - (Drill file only) Move the current coordinate without drawing
 * - {@linkcode DRILL | drill} - (Drill file only) Draw a shape with the current tool
 *
 * @category Node
 */
export interface InterpolateMode extends BaseNode {
  type: typeof INTERPOLATE_MODE
  mode: Types.InterpolateModeType | undefined
}

/**
 * An `Unimplemented` node is a chunk that the parser recognizes as part of a
 * Gerber file, but that it doesn't know how to process. These Nodes may be
 * implemented in a future minor release of the parser and should be used with
 * caution.
 *
 * Most unimplemented nodes will either be deprecated commands or valid
 * commands in the {@link https://www.ucamco.com/gerber | Gerber specification}
 * that we don't yet support.
 *
 * @category Node
 */
export interface Unimplemented extends BaseNode {
  /** Node type */
  type: typeof UNIMPLEMENTED
  /** String value of chunk */
  value: string
}

export type Tree = Root
