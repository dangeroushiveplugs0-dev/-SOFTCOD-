export type MediaKind = "video" | "audio" | "subtitle";

export type VideoContainer = "mp4" | "webm" | "mkv" | "mov" | "image-sequence";

export interface MediaTrack {
  id: string;
  kind: MediaKind;
  container?: VideoContainer;
  codec?: string;
  mimeType?: string;
  durationSeconds: number;
  timebase: number;
  embedded: boolean;
  resourceId: string;
  sampleRate?: number;
  channels?: number;
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface RenderOutputSettings {
  width: number;
  height: number;
  frameRate: number;
  startFrame: number;
  endFrame: number;
  videoContainer: VideoContainer;
  videoCodec?: string;
  audioCodec?: string;
  includeAudio: boolean;
}

export interface MediaExportResult {
  container: VideoContainer;
  mimeType: string;
  resourceId: string;
  durationSeconds: number;
  hasAudio: boolean;
}
