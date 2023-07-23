import {
  AggregateUniformsBatchFactory,
  AttributeRedirect,
  BatchRenderer,
  BatchShaderFactory,
  BatchRendererPluginFactory,
  UniformRedirect
} from 'pixi-batch-renderer'
import { TYPES } from '@pixi/constants'
import { Renderer, Shader } from '@pixi/core'
import conicVertexSrc from './conic-renderer.vert?raw'
import conicVertexFallbackSrc from './conic-renderer-fallback.vert?raw'
import conicFragmentSrc from './conic-renderer.frag?raw'
import conicFragmentFallbackSrc from './conic-renderer-fallback.frag?raw'

// var conicVertexSrc =
//   '#version 300 es\n\n#define SHADER_NAME Conic-Renderer-Shader\n\nprecision mediump float;\n\nin vec2 aWorldPosition;\nin vec2 aTexturePosition;\nin float aMasterID;\nin float aUniformID;\n\nuniform mat3 projectionMatrix;\n\nout vec2 vWorldCoord;\nout vec2 vTextureCoord;\nout float vMasterID;\nout float vUniformID;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aWorldPosition, 1)).xy, 0, 1);\n\n    vWorldCoord = gl_Position.xy;\n    vTextureCoord = aTexturePosition;\n    vMasterID = aMasterID;\n    vUniformID = aUniformID;\n}'

// var conicVertexFallbackSrc =
//   '#version 100\n#define SHADER_NAME Conic-Renderer-Fallback-Shader\n\nprecision mediump float;\n\nattribute vec2 aWorldPosition;\nattribute vec2 aTexturePosition;\nattribute float aMasterID;\nattribute float aUniformID;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vWorldCoord;\nvarying vec2 vTextureCoord;\nvarying float vMasterID;\nvarying float vUniformID;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aWorldPosition, 1)).xy, 0, 1);\n\n    vWorldCoord = gl_Position.xy;\n    vTextureCoord = aTexturePosition;\n    vMasterID = aMasterID;\n    vUniformID = aUniformID;\n}'

// var conicFragmentSrc =
//   '#version 300 es\n#define SHADER_NAME Conic-Renderer-Shader\n\nprecision mediump float;\n\nuniform sampler2D uSamplers[%texturesPerBatch%];\n\nin vec2 vWorldCoord;\nin vec2 vTextureCoord;\nin float vMasterID;\nin float vUniformID;\n\nout vec4 fragmentColor;\n\nuniform vec3 k[%uniformsPerBatch%];\nuniform vec3 l[%uniformsPerBatch%];\nuniform vec3 m[%uniformsPerBatch%];\nuniform bool inside;\n\nvoid main(void)\n{\n    vec3 kv, lv, mv;\n\n    for (int i = 0; i < %uniformsPerBatch%; i++)\n    {\n        if (float(i) > vUniformID - 0.5) \n        {\n            kv = k[i];\n            lv = l[i];\n            mv = m[i];\n            break;\n        }\n    }\n\n    float k_ = dot(vec3(vTextureCoord, 1), kv);\n    float l_ = dot(vec3(vTextureCoord, 1), lv);\n    float m_ = dot(vec3(vTextureCoord, 1), mv);\n\n    float cv = k_ * k_ - l_ * m_;\n\n    float cvdx = dFdx(cv);\n    float cvdy = dFdy(cv);\n    vec2 gradientTangent = vec2(cvdx, cvdy);\n\n    float signedDistance = cv / length(gradientTangent);\n    bool antialias = signedDistance > -1. && signedDistance < 1.;\n\n    vec4 color;\n\n    if ((inside && cv < 0.) || (!inside && cv >= 0.) || antialias)\n    {\n        for (int i = 0; i < %texturesPerBatch%; i++)\n        {\n            if (float(i) > vMasterID - 0.5)\n            {\n                color = texture(uSamplers[i], vTextureCoord);\n                break;\n            }\n        }\n    }\n    else\n    {\n        color = vec4(0, 0, 0, 0);\n    }\n\n    if (antialias)\n    {\n        float weight = inside ? (1. - signedDistance) / 2. : (1. + signedDistance) / 2.;\n        \n        color = weight * color + (1. - weight) * vec4(0, 0, 0, 0);\n    }\n\n    fragmentColor = color;\n}'

// var conicFragmentFallbackSrc =
//   '#version 100\n#ifdef GL_OES_standard_derivatives\n    #extension GL_OES_standard_derivatives : enable\n#endif\n#define SHADER_NAME Conic-Renderer-Fallback-Shader\n\nprecision mediump float;\n\nuniform sampler2D uSamplers[%texturesPerBatch%];\n\nvarying vec2 vWorldCoord;\nvarying vec2 vTextureCoord;\nvarying float vMasterID;\nvarying float vUniformID;\n\nuniform vec3 k[%uniformsPerBatch%];\nuniform vec3 l[%uniformsPerBatch%];\nuniform vec3 m[%uniformsPerBatch%];\nuniform bool inside;\n\nfloat sampleCurve(vec2 point, vec3 kv, vec3 lv, vec3 mv)\n{\n    float k = dot(vec3(vTextureCoord, 1), kv);\n    float l = dot(vec3(vTextureCoord, 1), lv);\n    float m = dot(vec3(vTextureCoord, 1), mv);\n\n    return k*k - l*m;\n}\n\nvoid main(void)\n{\n    vec3 kv, lv, mv;\n\n    for (int i = 0; i < %uniformsPerBatch%; i++)\n    {\n        if (float(i) > vUniformID - 0.5) \n        {\n            kv = k[i];\n            lv = l[i];\n            mv = m[i];\n            break;\n        }\n    }\n\n    float k_ = dot(vec3(vTextureCoord, 1), kv);\n    float l_ = dot(vec3(vTextureCoord, 1), lv);\n    float m_ = dot(vec3(vTextureCoord, 1), mv);\n\n    float cv = k_ * k_ - l_ * m_;\n\n#ifdef GL_OES_standard_derivatives\n    float cvdx = dFdx(cv);\n    float cvdy = dFdy(cv);\n    vec2 gradientTangent = vec2(cvdx, cvdy);\n\n    float signedDistance = cv / length(gradientTangent);\n    bool antialias = signedDistance > -1. && signedDistance < 1.;\n#endif\n\n    vec4 color;\n\n    if ((inside && cv < 0.) || (!inside && cv >= 0.) \n#ifdef GL_OES_standard_derivatives\n            || antialias\n#endif\n    )\n    {\n        for (int i = 0; i < %texturesPerBatch%; i++)\n        {\n            if (float(i) > vMasterID - 0.5)\n            {\n                color = texture2D(uSamplers[i], vTextureCoord);\n                break;\n            }\n        }\n    }\n    else\n    {\n        color = vec4(0, 0, 0, 0);\n    }\n\n#ifdef GL_OES_standard_derivatives\n    if (antialias)\n    {\n        float weight = inside ? (1. - signedDistance) / 2. : (1. + signedDistance) / 2.;\n        \n        color = weight * color + (1. - weight) * vec4(0, 0, 0, 0);\n    }\n#endif\n\n    gl_FragColor = color;\n}'

const ATTRIBUTE_WORLD_POSITION = new AttributeRedirect({
  source: 'vertexData',
  attrib: 'aWorldPosition',
  type: 'float32',
  size: 2,
  glType: TYPES.FLOAT,
  glSize: 2
})

const ATTRIBUTE_TEXTURE_POSITION = new AttributeRedirect({
  source: 'uvData',
  attrib: 'aTexturePosition',
  type: 'float32',
  size: 2,
  glType: TYPES.FLOAT,
  glSize: 2
})

const UNIFORM_K = new UniformRedirect({
  source: 'k',
  uniform: 'k'
})

const UNIFORM_L = new UniformRedirect({
  source: 'l',
  uniform: 'l'
})

const UNIFORM_M = new UniformRedirect({
  source: 'm',
  uniform: 'm'
})

const UNIFORM_COLOR = new UniformRedirect({
  source: 'uColor',
  uniform: 'uColor'
})

const UNIFORM_TINT = new UniformRedirect({
  source: 'uTint',
  uniform: 'uTint'
})

const webGL1Shader = new BatchShaderFactory(conicVertexFallbackSrc, conicFragmentFallbackSrc, {
  inside: true
}).derive()
const webGL2Shader = new BatchShaderFactory(conicVertexSrc, conicFragmentSrc, {
  inside: true
}).derive()

const shaderFunction = (crendr: BatchRenderer): Shader => {
  const renderer = crendr.renderer
  const contextSystem = renderer.context

  // @ts-ignore
  if (contextSystem.webGLVersion === 1 && !contextSystem.extensions.standardDerivatives) {
    // @ts-ignore
    contextSystem.extensions.standardDerivatives = renderer.gl.getExtension(
      'OES_standard_derivatives'
    )
  }

  if (contextSystem.webGLVersion === 1) {
    return webGL1Shader(crendr)
  }

  return webGL2Shader(crendr)
}

const conicRenderer = BatchRendererPluginFactory.from({
  attribSet: [ATTRIBUTE_WORLD_POSITION, ATTRIBUTE_TEXTURE_POSITION],
  uniformSet: [UNIFORM_K, UNIFORM_L, UNIFORM_M, UNIFORM_COLOR, UNIFORM_TINT],
  indexProperty: 'indexData',
  textureProperty: '_texture',
  texIDAttrib: 'aMasterID',
  uniformIDAttrib: 'aUniformID',
  inBatchIDAttrib: 'aBatchID', // Remove this: pixi-batch-renderer has a bug where it doesn't work without it (uniform aggregation)
  shaderFunction,
  BatchFactoryClass: AggregateUniformsBatchFactory
})

// Renderer.registerPlugin('conic', conicRenderer)
Renderer.__plugins.conic = conicRenderer
// Renderer.__plugins.registerPlugin('conic', conicRenderer)

export const ConicRenderer = conicRenderer
