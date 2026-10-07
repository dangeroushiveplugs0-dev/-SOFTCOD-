import type { WebGLRenderer } from "three";

export interface RendererStatsSnapshot {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export function readRendererStats(renderer: WebGLRenderer): RendererStatsSnapshot {
  return {
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };
}
