import Renderer from './Renderer';
export default class CanvasRenderer implements Renderer {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    dWidth: number;
    dHeight: number;
    constructor(canvasElem: HTMLCanvasElement, dWidth: number, dHeight: number);
    setPixel(x: number, y: number, pixel: number): void;
    reset(): void;
    render(video: Uint8Array): void;
    getFps(): number;
    fullscreen(): void;
}
