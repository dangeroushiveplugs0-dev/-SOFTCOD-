export type EditorPanel =
  | "outliner"
  | "inspector"
  | "materials"
  | "rig"
  | "physics"
  | "lighting"
  | "timeline";

export type ToolMode =
  | "select"
  | "translate"
  | "rotate"
  | "scale"
  | "sculpt"
  | "rig"
  | "physics"
  | "render";

export type EditorLayout = "compact" | "medium" | "expanded";

export function getEditorLayout(width: number): EditorLayout {
  if (width < 600) return "compact";
  if (width < 1000) return "medium";
  return "expanded";
}
