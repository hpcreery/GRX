import * as Shapes from "../engine/step/layer/shape/shape"
import * as Symbols from "../engine/step/layer/shape/symbol/symbol"
import { FeatureTypeIdentifiers, toMap, FeatureTypeIdentifier, AttributesType, Binary } from "../engine/types"
import earcut from "earcut"
import { Layer, Project, PROJECTS, Step } from './project'
import { ArtworkBufferCollection } from './artwork-collection'

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
    this.name = 'CommandError'
    this.errorCode = errorCode
  }
}

class InternalError extends Error {
  errorCode: ErrorCode
  constructor(message: string, errorCode: ErrorCode) {
    super(message)
    this.name = 'InternalError'
    this.errorCode = errorCode
  }
}

/**
 * Interface object provides all the methods to manage projects.
 * Rules for methods:
 *   - All methods are static and can be called without instantiating the class.
 *   - All methods throw CommandError on failure. Other errors are considered internal errors.
 *   - All methods validate input and state before performing operations.
 *   - All methods ensure the integrity of the project structure.
 *   - All methods are documented with JSDoc comments.
 *   - All methods are designed to be used in a command-line interface context.
 *   - All methods are named using snake_case.
 *   - Methods prefixed with _ are considered private and should not be used outside this class.
 *       - This is because these methods either return return or consume references to abstract data structures. (non-primitives)
 *   - All methods return void or primitive types (string, number, boolean) except private methods.
 *   - All method parameters are primitive types (string, number, boolean) except private methods.
 */
export const Interface = {

  /**
   * Creates a new project with the given name.
   * @param projectName Name of the new project to create.
   * @return void
   * @throws CommandError if a project with the same name already exists.
   */
  new_project(projectName: string): void {
    if (PROJECTS.has(projectName)) {
      throw new CommandError(`Project with name ${projectName} already exists`, ErrorCode.INVALID_INPUT)
    }
    PROJECTS.set(projectName, new Project(projectName))
  },

  /**
   * Retrieves a project by name.
   * @param projectName Name of the project to retrieve.
   * @returns The project object.
   * @throws CommandError if the project is not found.
   */
  _get_project(projectName: string): Project {
    const project = PROJECTS.get(projectName)
    if (!project) {
      throw new CommandError(`Project with name ${projectName} not found`, ErrorCode.PROJECT_NOT_FOUND)
    }
    return project
  },

  /**
   * Lists all existing project names.
   * @returns An array of project names. In JSON string format.
   */
  get_projects(): string {
    return JSON.stringify(Array.from(PROJECTS.keys()))
  },

  /**
   * Adds a new layer to all steps in the specified project.
   * @param projectName Name of the project to which the layer will be added.
   * @param layerName Name of the new layer to add.
   * @returns void
   * @throws CommandError if the project is not found, if there are no steps in
   * the project, or if a layer with the same name already exists.
   */
  add_layer(projectName: string, layerName: string): void {
    const project = this._get_project(projectName)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Please add a step before adding layers.", ErrorCode.STEP_NOT_FOUND)
    }
    if (project.matrix.steps[0].layers.find((layer) => layer.name === layerName)) {
      throw new CommandError(`Layer with name ${layerName} already exists`, ErrorCode.LAYER_NOT_FOUND)
    }
    project.matrix.steps.forEach((step) => {
      step.layers.push(new Layer(layerName))
    })
  },

  /**
   * Retrieves a step by name from the specified project.
   * @param projectName Name of the project containing the step.
   * @param stepName Name of the step to retrieve.
   * @returns The step object.
   * @throws CommandError if the project or step is not found.
   */
  _get_step(projectName: string, stepName: string): Step {
    const project = this._get_project(projectName)
    const step = project.matrix.steps.find((step) => step.name === stepName)
    if (!step) {
      throw new CommandError(`Step with name ${stepName} does not exist`, ErrorCode.STEP_NOT_FOUND)
    }
    return step
  },

  /**
   * Retrieves a layer by name from the specified step in the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer to retrieve.
   * @returns The layer object.
   * @throws CommandError if the project, step, or layer is not found.
   */
  _get_layer(projectName: string, stepName: string, layerName: string): Layer {
    const step = this._get_step(projectName, stepName)
    const layer = step.layers.find((layer) => layer.name === layerName)
    if (!layer) {
      throw new CommandError(`Layer with name ${layerName} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    return layer
  },

  /**
   * Removes a layer from all steps in the specified project.
   * @param projectName Name of the project from which the layer will be removed.
   * @param layerName Name of the layer to remove.
   * @return void
   * @throws CommandError if the project is not found, if there are no steps in
   * the project, or if the layer does not exist.
   */
  remove_layer(projectName: string, layerName: string): void {
    const project = this._get_project(projectName)
    if (project.matrix.steps.length === 0) {
      throw new CommandError("No steps available. Cannot remove layer.", ErrorCode.STEP_NOT_FOUND)
    }
    if (!project.matrix.steps[0].layers.find((layer) => layer.name === layerName)) {
      throw new CommandError(`Layer with name ${layerName} does not exist`, ErrorCode.LAYER_NOT_FOUND)
    }
    project.matrix.steps.forEach((step) => {
      const index = step.layers.findIndex((layer) => layer.name === layerName)
      if (index === -1) {
        throw new InternalError(`Layer with name ${layerName} does not exist in step ${step.name}`, ErrorCode.LAYER_NOT_FOUND)
      }
      step.layers.splice(index, 1)
    })
  },

  /**
   * Adds a new step to the specified project.
   * @param projectName Name of the project to which the step will be added.
   * @param stepName Name of the new step to add.
   * @return void
   * @throws CommandError if the project is not found or if a step with the same
   * name already exists.
   */
  add_step(projectName: string, stepName: string): void {
    const project = this._get_project(projectName)
    if (project.matrix.steps.find((step) => step.name === stepName)) {
      throw new CommandError(`Step with name ${stepName} already exists`, ErrorCode.INVALID_INPUT)
    }
    project.matrix.steps.push(new Step(stepName))
  },

  /**
   * Removes a step from the specified project.
   * @param projectName Name of the project from which the step will be removed.
   * @param stepName Name of the step to remove.
   * @returns void
   */
  remove_step(projectName: string, stepName: string): void {
    const project = this._get_project(projectName)
    const step = this._get_step(projectName, stepName) // to throw error if not found
    const index = project.matrix.steps.indexOf(step)
    project.matrix.steps.splice(index, 1)
  },

  /**
   * Retrieves a reference to the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be retrieved.
   * @returns A reference to the ArtworkBufferCollection of the specified layer.
   */
  _get_artwork_ref(projectName: string, stepName: string, layerName: string): ArtworkBufferCollection {
    const layer = this._get_layer(projectName, stepName, layerName)
    return layer.artwork
  },

  /**
   * Retrieves the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork data is to be retrieved.
   * @returns - An array of Shapes representing the artwork data.
   */
  _get_artwork_json(projectName: string, stepName: string, layerName: string): Shapes.Shape[] {
    const artwork = this._get_artwork_ref(projectName, stepName, layerName)
    return artwork.toJSON()
  },

  /**
   * Sets the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be set.
   * @param artwork A reference to the ArtworkBufferCollection to set.
   * @returns void
   */
  _set_artwork_ref(projectName: string, stepName: string, layerName: string, artwork: ArtworkBufferCollection): void {
    const layer = this._get_layer(projectName, stepName, layerName)
    layer.artwork = artwork
  },

  /**
   * Sets the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork data is to be set.
   * @param artworkData An array of Shapes representing the artwork data to set.
   * @returns void
   */
  _set_artwork_json(projectName: string, stepName: string, layerName: string, artworkData: Shapes.Shape[]): void {
    const artwork = new ArtworkBufferCollection(artworkData)
    this._set_artwork_ref(projectName, stepName, layerName, artwork)
  },

  /**
   * Retrieves the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork data is to be retrieved.
   * @returns - An array of Shapes representing the artwork data.
   */
  _get_artwork(projectName: string, stepName: string, layerName: string): Shapes.Shape[] {
    return this._get_artwork_json(projectName, stepName, layerName)
  },

  /**
   * Sets the artwork data as JSON for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork data is to be set.
   * @param artworkData An array of Shapes representing the artwork data to set.
   * @returns void
   */
  _set_artwork(projectName: string, stepName: string, layerName: string, artworkData: Shapes.Shape[]): void {
    this._set_artwork_json(projectName, stepName, layerName, artworkData)
  },

  /**
   * Adds a new feature to the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be modified.
   * @param shape The shape to add to the artwork collection.
   * @returns The index of the newly added shape in the artwork collection.
   */
  _add_feature(projectName: string, stepName: string, layerName: string, shape: Shapes.Shape): number {
    const artwork = this._get_artwork_ref(projectName, stepName, layerName)
    return artwork.create(shape)
  },

  /**
   * Retrieves a feature from the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be accessed.
   * @param index The index of the shape to retrieve from the artwork collection.
   * @returns The shape at the specified index in the artwork collection.
   */
  _get_feature(projectName: string, stepName: string, layerName: string, index: number): Shapes.Shape {
    const artwork = this._get_artwork_ref(projectName, stepName, layerName)
    return artwork.read(index)
  },

  /**
   * Updates a feature in the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be modified.
   * @param index The index of the shape to update in the artwork collection.
   * @param shape The new shape to replace the existing shape at the specified index.
   * @returns void
   */
  _update_feature(projectName: string, stepName: string, layerName: string, index: number, shape: Shapes.Shape): void {
    const artwork = this._get_artwork_ref(projectName, stepName, layerName)
    artwork.update(index, shape)
  },

  /**
   * Deletes a feature from the artwork collection for the specified layer in the specified step of the specified project.
   * @param projectName Name of the project containing the step and layer.
   * @param stepName Name of the step containing the layer.
   * @param layerName Name of the layer whose artwork collection is to be modified.
   * @param index The index of the shape to delete from the artwork collection.
   * @returns void
   */
  delete_feature(projectName: string, stepName: string, layerName: string, index: number): void {
    const artwork = this._get_artwork_ref(projectName, stepName, layerName)
    artwork.delete(index)
  }
}
