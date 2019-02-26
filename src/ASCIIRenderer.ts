import Renderer from './Renderer';

class ASCIIRenderer implements Renderer {
  pre: HTMLPreElement;
  dWidth: number;
  dHeight: number;

  constructor(preElem: HTMLPreElement, dWidth: number, dHeight: number) {
    this.pre = preElem;
    this.dWidth = dWidth;
    this.dHeight = dHeight;
  }

  reset() {
    this.pre.innerText = '';
  }

  render(video: Uint8Array) {
    let output = '';
    for (let i = 0; i < video.length; i++) {
      if (i % this.dWidth === 0) {
        output += '\n';
      }
      output += video[i] > 0 ? 'X' : ' ';
    }
    this.pre.innerText = output;
  }
}
