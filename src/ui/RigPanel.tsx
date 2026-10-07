import type { IKMode } from "../rigging/ik/types";
import type { ModelRigUIState } from "../rigging/RigEditor";

type RigPanelProps = {
  models: { id: string; name: string }[];
  selectedModelId: string | null;
  selectedChainId: string | null;
  rig: ModelRigUIState | null;
  onSelectModel: (modelId: string) => void;
  onSelectChain: (chainId: string) => void;
  onModelMode: (mode: IKMode) => void;
  onChainMode: (chainId: string, mode: IKMode) => void;
  onStretch: (chainId: string, value: number) => void;
};

export function RigPanel({ models, selectedModelId, selectedChainId, rig, onSelectModel, onSelectChain, onModelMode, onChainMode, onStretch }: RigPanelProps) {
  if (!rig) return <div className="settings-panel"><div className="empty-panel">Select a model to edit its rig.</div></div>;
  return <div className="rig-panel">
    <div className="rig-section">
      <div className="rig-label">Model</div>
      <select value={selectedModelId ?? ""} onChange={(event) => onSelectModel(event.target.value)}>
        {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
      </select>
    </div>
    <div className="rig-section">
      <div className="rig-label">Default IK</div>
      <div className="ik-mode-buttons">
        {(["human", "stylized"] as IKMode[]).map((mode) => <button key={mode} className={rig.mode === mode ? "ik-mode active" : "ik-mode"} onClick={() => onModelMode(mode)}>{mode === "human" ? "Human IK" : "Stylized IK"}</button>)}
      </div>
      <div className="rig-help">{rig.mode === "human" ? "Preserves authored bone lengths. Stretch stays locked to 1.0." : "Allows temporary stretch, then returns toward authored proportions."}</div>
    </div>
    <div className="rig-section">
      <div className="rig-label">IK Chains</div>
      {!rig.chains.length ? <div className="empty-panel">No recognizable bone chains found. The rig still has visible bones.</div> : rig.chains.map((chain) => <button key={chain.id} className={selectedChainId === chain.id ? "rig-chain active" : "rig-chain"} onClick={() => onSelectChain(chain.id)}><span>{chain.name}</span><small>{chain.mode === "human" ? "Human" : "Stylized"}</small></button>)}
    </div>
    {selectedChainId && rig.chains.some((chain) => chain.id === selectedChainId) && (() => {
      const chain = rig.chains.find((item) => item.id === selectedChainId)!;
      return <div className="rig-section">
        <div className="rig-label">Selected Chain</div>
        <div className="ik-mode-buttons">
          {(["human", "stylized"] as IKMode[]).map((mode) => <button key={mode} className={chain.mode === mode ? "ik-mode active" : "ik-mode"} onClick={() => onChainMode(chain.id, mode)}>{mode === "human" ? "Human" : "Stylized"}</button>)}
        </div>
        <label className="stretch-row"><span>Max stretch</span><input type="range" min="1" max="1.25" step="0.01" disabled={chain.mode === "human"} value={chain.maxStretchRatio} onChange={(event) => onStretch(chain.id, Number(event.target.value))} /><strong>{chain.mode === "human" ? "1.00×" : chain.maxStretchRatio.toFixed(2) + "×"}</strong></label>
      </div>;
    })()}
    <div className="rig-note">Each model owns its own IK mode and chains. Character A can use Human IK while Character B uses Stylized IK.</div>
  </div>;
}
