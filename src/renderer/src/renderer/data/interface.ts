import * as Shapes from "./shape/shape"
import { StepLayer, Layer, Project, PROJECTS, Step } from "./project"
import { ArtworkBufferCollection } from "./artwork-collections"
import importFormats from "./import-plugins"
import type { importFormatName, ImportPluginSignature } from "./import-plugins"
import * as Comlink from "comlink"
import { TypedEventTarget } from "typescript-event-target"

enum ErrorCode {
  UNKNOWN = 1,
  INVALID_INPUT = 1001,
  PROJECT_NOT_FOUND = 1002,
  STEP_NOT_FOUND = 2002,
  LAYER_NOT_FOUND = 3002,
}

class CommandError extends Error {
  errorCode: ErrorCode
  constructor(message: string, errorCode: ErrorCode) {
    super(message)
    this.name = "CommandError"
    this.errorCode = errorCode
  }
}

class InternalError extends Error {
  errorCode: ErrorCode
  constructor(message: string, errorCode: ErrorCode) {
    super(message)
    this.name = "InternalError"
    this.errorCode = errorCode
  }
}

export interface DataEventsMap {
  matrix_changed: CustomEvent<MatrixEventDetail>
  projects_list_changed: CustomEvent<ProjectListEventDetail>
}


export interface ProjectListEventDetail {
}

export interface MatrixEventDetail {
  project: Project
}


/**
 * dataInterface object provides all the methods to manage projects.
 * Rules for methods:
 *   - All methods are static and can be called without instantiating the class.
 *   - All methods throw CommandError on failure. Other errors are considered internal errors.
 *   - All methods validate input and state before performing operations.
 *   - All methods ensure the integrity of the project structure.
 *   - All methods are documented with JSDoc comments.
 *   - All methods are named using snake_case.
 *   - Methods prefixed with _ are considered private and should not be used outside this class.
 *       - This is because these methods either return return or consume references to abstract data structures. (non-primitives or non JSON serializable data)
 *   - All public methods are designed to be used in a command-line interface context.
 *   - All public methods return void or primitive types (string, number, boolean) or JSON serilizable types.
 *   - All public method parameters are primitive types (string, number, boolean) or JSON serilizable types.
 *   - Methods should not have side effects outside of the project management context.
 *   - Methods, when applicable, should be named using verbs that clearly indicate their action. ie CRUD operations should be named create_*, read_*, update_*, delete_*.
 */
export const DataInterface = {
  eventTarget: new TypedEventTarget<DataEventsMap>(),

  subscribe_to_matrix(project: Project, callback: (event: CustomEvent<MatrixEventDetail>) => void, options?: AddEventListenerOptions): void {
    this.eventTarget.addEventListener("matrix_changed", (event) => {
      if (event.detail.project === project) {
        callback(event)
      }
    }, options)
  },

  subscribe_to_projects_list(callback: (event: CustomEvent<ProjectListEventDetail>) => void, options?: AddEventListenerOptions): void {
    this.eventTarget.addEventListener("projects_list_changed", (event) => {
      callback(event)
    }, options)
  },

  /**
   * Creates a new project with the given name.
   * @param project_name Name of the new project to create.
   * @return void
   * @throws CommandError if a project with the same name already exists.
   */
  create_project(project_name: string): void {
    if (PROJECTS.has(project_name)) {
      throw new CommandError(`Project with name ${project_name} already exists`, ErrorCode.INVALID_INPUT)
    }
    PROJECTS.set(project_name, new Project(project_name))
    this.eventTarget.dispatchTypedEvent(
      "projects_list_changed",
      new CustomEvent("projects_list_changed"),
    )
  },

  /**
   * Retrieves a project by name.
   * @param project_name Name of the project to retrieve.
   * @returns The project object.
   * @throws CommandError if the project is not found.
   */
  _read_project_object(project_name: string): Project {
    const project = PROJECTS.get(project_name)
    if (!project) {
      throw new CommandError(`Project with name ${project_name} not found`, ErrorCode.PROJECT_NOT_FOUND)
    }
    return project
  },

  /**
   * Lists all existing project names.
   * @returns An array of project names. In JSON format.
   */
  read_projects(): string[] {
    return Array.from(PROJECTS.keys())
  },

  /**
   * Renames an existing project.
   * @param old_name Current name of the project to rename.
   * @param new_name New name for the project.
   * @returns void
   * @throws CommandError if the project is not found or if a project with the new name already exists.
   */
  update_project_name(old_name: string, new_name: string): void {
    if (!PROJECTS.has(old_name)) {
      throw new CommandError(`Project with name ${old_name} not found`, ErrorCode.PROJECT_NOT_FOUND)
    }
    if (PROJECTS.has(new_name)) {
      throw new CommandError(`Project with name ${new_name} already exists`, ErrorCode.INVALID_INPUT)
    }
    const project = PROJECTS.get(old_name)!
    PROJECTS.delete(old_name)
    project.name = new_name
    PROJECTS.set(new_name, project)
  },

  /**
   * Adds a new layer to all steps in the specified project.
   * @param project_name Name of the project to which the layer will be added.
   * @param layer_name Name of the new layer to add.
   * @returns void
   * @throws CommandError if the project is not found, if there are no steps in
   * the project, or if a layer with the same name already exists.
   */
  create_layer(project_name: string, layer_name: string): void {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Please add a step before adding layers.", ErrorCode.STEP_NOT_FOUND)
    }
    if (project.matrix.layers.find((layer) => layer.name === layer_name)) {
      throw new CommandError(`Layer with name ${layer_name} already exists`, ErrorCode.LAYER_NOT_FOUND)
    }
    const layer = new Layer(layer_name, project.matrix)
    project.matrix.layers.push(layer)
    project.matrix.steps.forEach((step) => {
      step.layers.push(new StepLayer(step, layer))
    })
    this.eventTarget.dispatchTypedEvent(
      "matrix_changed",
      new CustomEvent("matrix_changed", {
        detail: {
          project,
        },
      }),
    )
  },

  /**
   * Lists all layer names in the specified step of the specified project.
   * @param project_name Name of the project containing the step.
   * @param step_name Name of the step whose layers are to be listed.
   * @returns An array of layer names. In JSON format.
   */
  read_layers(project_name: string): string[] {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Cannot list layers.", ErrorCode.STEP_NOT_FOUND)
    }
    return project.matrix.layers.map((layer) => layer.name)
  },

  /**
   * Lists all step names in the specified project.
   * @param project_name Name of the project containing the steps.
   * @returns An array of step names. In JSON format.
   */
  read_steps(project_name: string): string[] {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Cannot list steps.", ErrorCode.STEP_NOT_FOUND)
    }
    return project.matrix.steps.map((step) => step.name)
  },

  /**
   * Retrieves a step by name from the specified project.
   * @param project_name Name of the project containing the step.
   * @param step_name Name of the step to retrieve.
   * @returns The step object.
   * @throws CommandError if the project or step is not found.
   */
  _read_step_object(project_name: string, step_name: string): Step {
    const project = this._read_project_object(project_name)
    const step = project.matrix.steps.find((step) => step.name === step_name)
    if (!step) {
      throw new CommandError(`Step with name ${step_name} does not exist`, ErrorCode.STEP_NOT_FOUND)
    }
    return step
  },

  /**
   * Retrieves a layer by name from the specified step in the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer to retrieve.
   * @returns The layer object.
   * @throws CommandError if the project, step, or layer is not found.
   */
  _read_layer_object(project_name: string, step_name: string, layer_name: string): StepLayer {
    const step = this._read_step_object(project_name, step_name)
    const layer = step.layers.find((layer) => layer.row.name === layer_name)
    if (!layer) {
      throw new CommandError(`Layer with name ${layer_name} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    return layer
  },

  /**
   * Removes a layer from all steps in the specified project.
   * @param project_name Name of the project from which the layer will be removed.
   * @param layer_name Name of the layer to remove.
   * @return void
   * @throws CommandError if the project is not found, if there are no steps in
   * the project, or if the layer does not exist.
   */
  delete_layer(project_name: string, layer_name: string): void {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Cannot remove layer.", ErrorCode.STEP_NOT_FOUND)
    }
    if (!project.matrix.layers.find((layer) => layer.name === layer_name)) {
      throw new CommandError(`Layer with name ${layer_name} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    project.matrix.steps.forEach((step) => {
      const index = step.layers.findIndex((layer) => layer.row.name === layer_name)
      if (index === -1) {
        throw new InternalError(`Layer with name ${layer_name} does not exist in step ${step.name}`, ErrorCode.LAYER_NOT_FOUND)
      }
      step.layers.splice(index, 1)
    })
    this.eventTarget.dispatchTypedEvent(
      "matrix_changed",
      new CustomEvent("matrix_changed", {
        detail: {
          project,
        },
      }),
    )
  },

  /**
   * Renames a layer in all steps of the specified project.
   * @param project_name Name of the project containing the layer to rename.
   * @param old_name Current name of the layer to rename.
   * @param new_name New name for the layer.
   */
  update_layer_name(project_name: string, old_name: string, new_name: string): void {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Cannot rename layer.", ErrorCode.STEP_NOT_FOUND)
    }
    const layer = project.matrix.layers.find((layer) => layer.name === old_name)
    if (layer === undefined) {
      throw new CommandError(`Layer with name ${old_name} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    if (project.matrix.layers.find((layer) => layer.name === new_name)) {
      throw new CommandError(`Layer with name ${new_name} already exists`, ErrorCode.INVALID_INPUT)
    }
    layer.name = new_name
  },

  /**
   * Adds a new step to the specified project.
   * @param project_name Name of the project to which the step will be added.
   * @param step_name Name of the new step to add.
   * @return void
   * @throws CommandError if the project is not found or if a step with the same
   * name already exists.
   */
  create_step(project_name: string, step_name: string): void {
    const project = this._read_project_object(project_name)
    if (project.matrix.steps.find((step) => step.name === step_name)) {
      throw new CommandError(`Step with name ${step_name} already exists`, ErrorCode.INVALID_INPUT)
    }
    const step = new Step(step_name, project.matrix)
    project.matrix.steps.push(step)
    project.matrix.layers.forEach((layer) => {
      step.layers.push(new StepLayer(step, layer))
    })
    this.eventTarget.dispatchTypedEvent(
      "matrix_changed",
      new CustomEvent("matrix_changed", {
        detail: {
          project,
        },
      }),
    )
  },

  /**
   * Removes a step from the specified project.
   * @param project_name Name of the project from which the step will be removed.
   * @param step_name Name of the step to remove.
   * @returns void
   */
  delete_step(project_name: string, step_name: string): void {
    const project = this._read_project_object(project_name)
    const step = this._read_step_object(project_name, step_name) // to throw error if not found
    const index = project.matrix.steps.indexOf(step)
    project.matrix.steps.splice(index, 1)
    this.eventTarget.dispatchTypedEvent(
      "matrix_changed",
      new CustomEvent("matrix_changed", {
        detail: {
          project,
        },
      }),
    )
  },

  /**
   * Retrieves a reference to the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be retrieved.
   * @returns A reference to the ArtworkBufferCollection of the specified layer.
   */
  _read_layer_artwork_ref(project_name: string, step_name: string, layer_name: string): ArtworkBufferCollection {
    const layer = this._read_layer_object(project_name, step_name, layer_name)
    return layer.artwork
  },

  /**
   * Retrieves the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork data is to be retrieved.
   * @returns - An array of Shapes representing the artwork data.
   */
  read_layer_artwork(project_name: string, step_name: string, layer_name: string): Shapes.Shape[] {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    return artwork.toJSON()
  },


  /**
   * Adds the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork data is to be set.
   * @param artworkData An array of Shapes representing the artwork data to set.
   * @returns void
   */
  _update_layer_artwork_from_json(project_name: string, step_name: string, layer_name: string, artworkData: Shapes.Shape[]): void {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    artwork.fromJSON(artworkData)
  },

  /**
   * Resets the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork data is to be set.
   * @param artworkData An array of Shapes representing the artwork data to set.
   * @returns void
   */
  _create_layer_artwork_from_json(project_name: string, step_name: string, layer_name: string, artworkData: Shapes.Shape[]): void {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    artwork.clear()
    artwork.fromJSON(artworkData)
  },


  /**
   * Adds a new feature to the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be modified.
   * @param shape The shape to add to the artwork collection.
   * @returns The index of the newly added shape in the artwork collection.
   */
  _add_layer_shape(project_name: string, step_name: string, layer_name: string, shape: Shapes.Shape): number {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    const return_value = artwork.create(shape)
    return return_value
  },

  /**
   * Retrieves a feature from the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be accessed.
   * @param index The index of the shape to retrieve from the artwork collection.
   * @returns The shape at the specified index in the artwork collection.
   */
  _read_layer_shape_object(project_name: string, step_name: string, layer_name: string, index: number): Shapes.Shape {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    return artwork.read(index)
  },

  /**
   * Updates a feature in the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be modified.
   * @param index The index of the shape to update in the artwork collection.
   * @param shape The new shape to replace the existing shape at the specified index.
   * @returns void
   */
  _update_layer_shape(project_name: string, step_name: string, layer_name: string, index: number, shape: Shapes.Shape): void {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    artwork.update(index, shape)
  },

  /**
   * Deletes a feature from the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be modified.
   * @param index The index of the shape to delete from the artwork collection.
   * @returns void
   */
  delete_layer_shape(project_name: string, step_name: string, layer_name: string, index: number): void {
    const artwork = this._read_layer_artwork_ref(project_name, step_name, layer_name)
    artwork.delete(index)
  },

  _import_file,
}

/**
 * Imports a file using the appropriate plugin based on the specified format.
 * The plugin is expected to call back into this DataInterface to add layers and features as needed.
 * @param buffer The file data as an ArrayBuffer.
 * @param format The format of the file (e.g., "rs274x", "gdsii", "dxf", "nc").
 * @param params Additional parameters to pass to the plugin.
 * @returns void
 */
async function _import_file<Format extends importFormatName>(buffer: ArrayBuffer, format: Format, params: object): Promise<void> {
  // @ts-expect-error TS2345
  if (format == "") {
    throw new CommandError("Format must be specified", ErrorCode.INVALID_INPUT)
  }
  if (!Object.keys(importFormats).includes(format)) {
    throw new CommandError("No parser found for format: " + format, ErrorCode.INVALID_INPUT)
  }

  const pluginWorker = importFormats[format].plugin
  if (pluginWorker) {
    const instance = new pluginWorker()
    const parser = Comlink.wrap<ImportPluginSignature>(instance)
    try {
      await parser(Comlink.transfer(buffer, [buffer]), params, Comlink.proxy(DataInterface))
    } catch (error) {
      console.error(error)
      throw new CommandError("Error parsing file: " + (error as Error).message, ErrorCode.INVALID_INPUT)
    } finally {
      parser[Comlink.releaseProxy]()
      instance.terminate()
    }
  } else {
    throw new CommandError("No parser found for format: " + format, ErrorCode.INVALID_INPUT)
  }
}

