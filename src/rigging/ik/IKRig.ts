import type { IKChainDefinition, IKChainState, IKMode } from "./types";

export type IKRig = {
  id: string;
  modelId: string;
  chains: IKChainDefinition[];
  states: Map<string, IKChainState>;
};

export function createIKRig(modelId: string, mode: IKMode = "human"): IKRig {
  return {
    id: `${modelId}:ik`,
    modelId,
    chains: [],
    states: new Map(),
  };
}

export function setChainMode(chain: IKChainDefinition, mode: IKMode): IKChainDefinition {
  return {
    ...chain,
    mode,
    maxStretchRatio: mode === "human" ? 1 : Math.max(1, chain.maxStretchRatio),
  };
}
