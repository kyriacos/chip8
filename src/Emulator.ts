import Renderer from './Renderer';
import Beep from './Beep';
import CPU from './CPU';
import CanvasRenderer from './CanvasRenderer';
import KeyMap from './KeyMap';

const D_HEIGHT = 32;
const D_WIDTH = 64;

class Emulator {
  cpu: CPU;
  renderer: Renderer;
  beep: Beep;
  running: boolean;
  stepCount: number;

  constructor(canvasElem: HTMLCanvasElement) {
    this.cpu = new CPU(D_WIDTH, D_HEIGHT);
    this.renderer = new CanvasRenderer(canvasElem, D_WIDTH, D_HEIGHT);
    this.beep = new Beep();
    this.running = false;
    this.stepCount = -1;
  }

  load(buffer: ArrayBuffer) {
    this.reset();

    this.cpu.loadRom(new Uint8Array(buffer));
    this.start();
  }

  reset(): void {
    this.cpu.reset();
    this.renderer.reset();
  }

  isRunning(): boolean {
    return this.running;
  }

  start() {
    this.running = true;
    const run = () => {
      const emulate = (count = 10) => {
        for (let i = 0; i < count; i++) {
          this.cpu.runCycle();
        }

        if (this.cpu.redraw) {
          (<CanvasRenderer>this.renderer).render(this.cpu.video);
          this.cpu.redraw = false;
        }

        // this.cpu.updateTimers();
        if (this.cpu.soundTimer > 0) {
          this.beep.start();
          this.cpu.soundTimer--;
        } else {
          this.beep.stop();
        }
        if (this.cpu.delayTimer > 0) {
          this.cpu.delayTimer--;
        }
      };
      if (this.isRunning()) {
        emulate();
      } else if (this.stepCount > 0) {
        emulate(this.stepCount);
        this.stepCount--;
      }
      window.requestAnimationFrame(run);
    };
    window.requestAnimationFrame(run);
  }

  toggleRun() {
    this.running = !this.running;
  }

  step(): void {
    this.running = false;
    this.stepCount++;
  }

  fullscreen(): void {
    this.renderer.fullscreen();
  }
}

// if (this.timer) {
//   clearInterval(this.timer);
// }
// this.timer = setInterval(() => {
//   for (let i = 0; i < 10; i++) {
//     this.runCycle();
//   }
//   if (this.redraw) {
//     renderer.draw(this.screen);
//     this.redraw = false;
//   }
//   this.delayTimer = Math.max(0, this.delayTimer - 1);
//   this.soundTimer = Math.max(0, this.soundTimer - 1);
// }, 16);

function init() {
  const canvasElem = document.getElementsByTagName('canvas')[0];
  const emulator = new Emulator(canvasElem);
  const cpu = emulator.cpu;

  const loadGameFromFile = (e: Event) => {
    const input = <HTMLInputElement>document.getElementById('file-input');
    if (input.files.length == 0) {
      return;
    }
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => emulator.load(<ArrayBuffer>reader.result);
    reader.readAsArrayBuffer(file);
  };

  const keys = KeyMap.getKeyMap();
  for (let key in keys) {
    document.getElementById('keys').innerHTML += `<span id="${keys[key]}">${key}</span>`;
  }
  const spans = document.querySelectorAll<HTMLElement>('#keys span');
  spans.forEach(span => {
    span.onclick = function(evt) {
      cpu.setKey(parseInt((<HTMLElement>evt.target).id, 16));
    };
  });

  document.addEventListener('keydown', evt => {
    const keyCode = keys[evt.key];
    if (keyCode) {
      cpu.setKey(keyCode);
    }
  });
  document.addEventListener('keyup', evt => {
    const keyCode = keys[evt.key];
    if (keyCode) {
      cpu.unsetKey(keyCode);
    }
  });
  (<HTMLElement>document.querySelector('#btnLoad')).onclick = loadGameFromFile;

  document.getElementById('fullscreen').onclick = function() {
    emulator.fullscreen();
  };

  document.getElementById('pause').onclick = function(evt) {
    emulator.toggleRun();
    (<HTMLElement>evt.target).innerText = emulator.isRunning() ? 'Pause' : 'Play';
  };

  document.getElementById('step').onclick = function(evt) {
    emulator.step();
    document.getElementById('pause').innerText = 'Play';
  };
}

document.addEventListener('DOMContentLoaded', function() {
  init();
});
