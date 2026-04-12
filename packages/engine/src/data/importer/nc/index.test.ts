import { describe, expect, it, vi } from "vitest"

vi.mock("@src/data/importer/register", () => ({
  registerPlugin: () => {
    // no-op for unit tests
  },
}))

describe("NC importer", () => {
  it("throws a clear error when lexing fails", async () => {
    const { plugin } = await import("./index")
    const encoder = new TextEncoder()

    const api = {
      create_layer: vi.fn(async () => {}),
      update_step_layer_artwork: vi.fn(async () => {}),
    }

    await expect(plugin(encoder.encode("@@@").buffer, { step: "s", layer: "l", project: "p" }, api as never)).rejects.toThrow(/NC lexing failed/)
  })
})
