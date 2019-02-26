export default class Beep {
  playing: Boolean;
  oscillator: OscillatorNode;

  constructor() {
    this.playing = false;
  }

  start() {
    if (!this.playing) {
      const context = new AudioContext();
      this.oscillator = context.createOscillator();
      this.oscillator.frequency.value = 1000;
      this.oscillator.connect(context.destination);
      this.oscillator.start();
      this.playing = true;
    }
  }
  stop() {
    if (this.playing) {
      this.oscillator.stop();
      this.playing = false;
    }
  }
}
