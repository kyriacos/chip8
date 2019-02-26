export default interface Renderer {
  dWidth: number;
  dHeight: number;

  reset(): void;
  render(video: Uint8Array): void;
  getFps?(): number;
  fullscreen?(): void;
}
