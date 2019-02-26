import Renderer from './Renderer';

// extend Document to include types missing types
interface Document {
  fullscreenElement: any;
  mozFullscreenElement: any;
  webkitFullscreenElement: any;
}

const CELL_SIZE = 8;

export default class CanvasRenderer implements Renderer {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  dWidth: number; // display Width
  dHeight: number; // display Height

  constructor(canvasElem: HTMLCanvasElement, dWidth: number, dHeight: number) {
    this.dWidth = dWidth;
    this.dHeight = dHeight;
    this.canvas = canvasElem;
    this.canvas.width = CELL_SIZE * dWidth;
    this.canvas.height = CELL_SIZE * dHeight;

    this.context = this.canvas.getContext('2d');
  }

  setPixel(x: number, y: number, pixel: number): void {
    this.context.fillStyle = ['#000', '#299617'][pixel]; // 0 or 1
    this.context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  reset(): void {
    this.context.clearRect(0, 0, this.dWidth * CELL_SIZE, this.dHeight * CELL_SIZE);
  }

  render(video: Uint8Array): void {
    for (let i = 0; i < video.length; i++) {
      const x = (i % this.dWidth) * CELL_SIZE;
      const y = Math.floor(i / this.dWidth) * CELL_SIZE;

      this.setPixel(x, y, video[i]);
    }
  }

  getFps(): number {
    return 1;
  }

  fullscreen(): void {
    if (
      //@ts-ignore
      !document['fullscreenElement']
      // document.webkitFullscreenElement ||
      // document.mozFullscreenElement
    ) {
      this.canvas.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }
}
