import * as Shapes from "../engine/step/layer/shape/shape"
import { Layer, Project, PROJECTS, Step } from "./project"
import { ArtworkBufferCollection } from "./artwork-collection"
import importPlugins from "./import_plugins"
import type { ImportPlugin } from "./import_plugins"
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
  MATRIX_CHANGED: CustomEvent<MatrixEventDetail>
  PROJECTS_CHANGED: CustomEvent<ProjectEventDetail>
  LAYER_CHANGED: CustomEvent<LayerEventDetail>
}

type CRUDAction = "create" | "read" | "update" | "delete"

export interface ProjectEventDetail {
  project: string
  action: CRUDAction
}

export interface MatrixEventDetail {
  project: string
  step: string | null
  layer: string | null
  action: CRUDAction
}

export interface LayerEventDetail {
  project: string
  step: string
  layer: string
  action: CRUDAction
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
 *       - This is because these methods either return return or consume references to abstract data structures. (non-primitives)
 *   - All methods are designed to be used in a command-line interface context except methods explicitly marked as private (prefixed with _).
 *   - All methods return void or primitive types (string, number, boolean) except private methods.
 *   - All method parameters are primitive types (string, number, boolean) except private methods.
 *   - Methods should not have side effects outside of the project management context.
 *   - Methods, when applicable, should be named using verbs that clearly indicate their action. ie CRUD operations should be named create_*, read_*, update_*, delete_*.
 */
export const DataInterface = {
  eventTarget: new TypedEventTarget<DataEventsMap>(),

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
    this.eventTarget.dispatchTypedEvent("PROJECTS_CHANGED", new CustomEvent("PROJECTS_CHANGED", {
      detail: {
        project: project_name,
        action: "create",
      },
    }))
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
   * @returns An array of project names. In JSON string format.
   */
  read_projects(): string {
    return JSON.stringify(Array.from(PROJECTS.keys()))
  },

  /**
   * Renames an existing project.
   * @param old_name Current name of the project to rename.
   * @param new_name New name for the project.
   * @returns void
   * @throws CommandError if the project is not found or if a project with the new name already exists.
   */
  rename_project(old_name: string, new_name: string): void {
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
    this.eventTarget.dispatchTypedEvent("PROJECTS_CHANGED", new CustomEvent("PROJECTS_CHANGED", {
      detail: {
        project: new_name,
        action: "update",
      },
    }))
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
    if (project.matrix.steps[0].layers.find((layer) => layer.name === layer_name)) {
      throw new CommandError(`Layer with name ${layer_name} already exists`, ErrorCode.LAYER_NOT_FOUND)
    }
    project.matrix.steps.forEach((step) => {
      step.layers.push(new Layer(layer_name))
    })
    this.eventTarget.dispatchTypedEvent("MATRIX_CHANGED", new CustomEvent("MATRIX_CHANGED", {
      detail: {
        project: project_name,
        step: null,
        layer: layer_name,
        action: "create",
      },
    }))
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
  _read_layer_object(project_name: string, step_name: string, layer_name: string): Layer {
    const step = this._read_step_object(project_name, step_name)
    const layer = step.layers.find((layer) => layer.name === layer_name)
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
    if (!project.matrix.steps[0].layers.find((layer) => layer.name === layer_name)) {
      throw new CommandError(`Layer with name ${layer_name} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    project.matrix.steps.forEach((step) => {
      const index = step.layers.findIndex((layer) => layer.name === layer_name)
      if (index === -1) {
        throw new InternalError(`Layer with name ${layer_name} does not exist in step ${step.name}`, ErrorCode.LAYER_NOT_FOUND)
      }
      step.layers.splice(index, 1)
    })
    this.eventTarget.dispatchTypedEvent("MATRIX_CHANGED", new CustomEvent("MATRIX_CHANGED", {
      detail: {
        project: project_name,
        step: null,
        layer: layer_name,
        action: "delete",
      },
    }))
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
    project.matrix.steps.push(new Step(step_name))
    this.eventTarget.dispatchTypedEvent("MATRIX_CHANGED", new CustomEvent("MATRIX_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: null,
        action: "create",
      },
    }))
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
    this.eventTarget.dispatchTypedEvent("MATRIX_CHANGED", new CustomEvent("MATRIX_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: null,
        action: "delete",
      },
    }))
  },

  /**
   * Retrieves a reference to the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be retrieved.
   * @returns A reference to the ArtworkBufferCollection of the specified layer.
   */
  _read_artwork_ref(project_name: string, step_name: string, layer_name: string): ArtworkBufferCollection {
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
  _read_artwork_json(project_name: string, step_name: string, layer_name: string): Shapes.Shape[] {
    const artwork = this._read_artwork_ref(project_name, step_name, layer_name)
    return artwork.toJSON()
  },

  /**
   * Sets the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be set.
   * @param artwork A reference to the ArtworkBufferCollection to set.
   * @returns void
   */
  _update_artwork_ref(project_name: string, step_name: string, layer_name: string, artwork: ArtworkBufferCollection): void {
    const layer = this._read_layer_object(project_name, step_name, layer_name)
    layer.artwork = artwork
    this.eventTarget.dispatchTypedEvent("LAYER_CHANGED", new CustomEvent("LAYER_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: layer_name,
        action: "update",
      },
    }))
  },

  /**
   * Sets the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork data is to be set.
   * @param artworkData An array of Shapes representing the artwork data to set.
   * @returns void
   */
  _update_artwork_json(project_name: string, step_name: string, layer_name: string, artworkData: Shapes.Shape[]): void {
    const artwork = new ArtworkBufferCollection(artworkData)
    this._update_artwork_ref(project_name, step_name, layer_name, artwork)
    this.eventTarget.dispatchTypedEvent("LAYER_CHANGED", new CustomEvent("LAYER_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: layer_name,
        action: "update",
      },
    }))
  },

  /**
   * Retrieves the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork data is to be retrieved.
   * @returns - An array of Shapes representing the artwork data.
   */
  _get_artwork(project_name: string, step_name: string, layer_name: string): Shapes.Shape[] {
    return this._read_artwork_json(project_name, step_name, layer_name)
  },

  // /**
  //  * Sets the artwork data as JSON for the specified layer in the specified step of the specified project.
  //  * @param project_name Name of the project containing the step and layer.
  //  * @param step_name Name of the step containing the layer.
  //  * @param layer_name Name of the layer whose artwork data is to be set.
  //  * @param artworkData An array of Shapes representing the artwork data to set.
  //  * @returns void
  //  */
  // _update_artwork(project_name: string, step_name: string, layer_name: string, artworkData: Shapes.Shape[]): void {
  //   this._update_artwork_json(project_name, step_name, layer_name, artworkData)
  // },

  /**
   * Adds a new feature to the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be modified.
   * @param shape The shape to add to the artwork collection.
   * @returns The index of the newly added shape in the artwork collection.
   */
  _add_feature(project_name: string, step_name: string, layer_name: string, shape: Shapes.Shape): number {
    const artwork = this._read_artwork_ref(project_name, step_name, layer_name)
    const return_value = artwork.create(shape)
    this.eventTarget.dispatchTypedEvent("LAYER_CHANGED", new CustomEvent("LAYER_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: layer_name,
        action: "update",
      },
    }))
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
  _read_feature_object(project_name: string, step_name: string, layer_name: string, index: number): Shapes.Shape {
    const artwork = this._read_artwork_ref(project_name, step_name, layer_name)
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
  _update_feature(project_name: string, step_name: string, layer_name: string, index: number, shape: Shapes.Shape): void {
    const artwork = this._read_artwork_ref(project_name, step_name, layer_name)
    artwork.update(index, shape)
    this.eventTarget.dispatchTypedEvent("LAYER_CHANGED", new CustomEvent("LAYER_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: layer_name,
        action: "update",
      },
    }))
  },

  /**
   * Deletes a feature from the artwork collection for the specified layer in the specified step of the specified project.
   * @param project_name Name of the project containing the step and layer.
   * @param step_name Name of the step containing the layer.
   * @param layer_name Name of the layer whose artwork collection is to be modified.
   * @param index The index of the shape to delete from the artwork collection.
   * @returns void
   */
  delete_feature(project_name: string, step_name: string, layer_name: string, index: number): void {
    const artwork = this._read_artwork_ref(project_name, step_name, layer_name)
    artwork.delete(index)
    this.eventTarget.dispatchTypedEvent("LAYER_CHANGED", new CustomEvent("LAYER_CHANGED", {
      detail: {
        project: project_name,
        step: step_name,
        layer: layer_name,
        action: "update",
      },
    }))
  },

  /**
   * Imports a file using the appropriate plugin based on the specified format.
   * The plugin is expected to call back into this DataInterface to add layers and features as needed.
   * @param buffer The file data as an ArrayBuffer.
   * @param format The format of the file (e.g., "rs274x", "gdsii", "dxf", "nc").
   * @param params Additional parameters to pass to the plugin.
   * @returns void
   */
  async _import_file(buffer: ArrayBuffer, format: string, params: object): Promise<void> {
    if (format == "") {
      throw new CommandError("Format must be specified", ErrorCode.INVALID_INPUT)
    }
    if (!Object.keys(importPlugins).includes(format)) {
      throw new CommandError("No parser found for format: " + format, ErrorCode.INVALID_INPUT)
    }

    const pluginWorker = importPlugins[format].plugin
    if (pluginWorker) {
      const instance = new pluginWorker()
      const parser = Comlink.wrap<ImportPlugin>(instance)
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
  },
}
