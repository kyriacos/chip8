import { toPaddedHexString, toHexString } from './utils';

/*
		http://devernay.free.fr/hacks/chip8/C8TECH10.HTM

		The Chip-8 language is capable of accessing up to 4KB (4,096 bytes) of RAM, 
		from location 0x000 (0) to 0xFFF (4095). 
		The first 512 bytes, from 0x000 to 0x1FF, are where the original interpreter was located, 
		and should not be used by programs.

		Most Chip-8 programs start at location 0x200 (512), but some begin at 0x600 (1536). 
		Programs beginning at 0x600 are intended for the ETI 660 computer.

			Memory Map:
		+---------------+= 0xFFF (4095) End of Chip-8 RAM
		|               |
		|               |
		|               |
		|               |
		|               |
		| 0x200 to 0xFFF|
		|     Chip-8    |
		| Program / Data|
		|     Space     |
		|               |
		|               |
		|               |
		+- - - - - - - -+= 0x600 (1536) Start of ETI 660 Chip-8 programs
		|               |
		|               |
		|               |
		+---------------+= 0x200 (512) Start of most Chip-8 programs
		| 0x000 to 0x1FF|
		| Reserved for  |
		|  interpreter  |
		+---------------+= 0x000 (0) Start of Chip-8 RAM
	*/

// prettier-ignore
const FONTSET = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
])

export default class CPU {
  memory: Uint8Array;
  stack: Uint16Array;
  V: Uint8Array;
  PC: number;
  I: number;
  SP: number;
  delayTimer: number;
  soundTimer: number;
  video: Uint8Array;
  keys: Array<Boolean>;
  dWidth: number;
  dHeight: number;
  redraw: Boolean;

  constructor(dWidth: number, dHeight: number) {
    this.memory = new Uint8Array(4096);
    this.stack = new Uint16Array(16);
    this.V = new Uint8Array(16); // V0 - VF
    this.PC = 0x200; // program counter 16 bits
    this.I = 0x0000; // index register 16 bits
    this.SP = 0x0000; // stack pointer 16 bits
    this.delayTimer = 0;
    this.soundTimer = 0;

    this.video = new Uint8Array(dWidth * dHeight); // 64 x 32 pixels
    this.keys = new Array(16); // the keys 0x0 - 0xF
    this.redraw = false;

    this.dWidth = dWidth;
    this.dHeight = dHeight;
  }

  loadRom(rom: Uint8Array): void {
    for (let i = 0; i < rom.length; i++) {
      this.memory[i + 0x200] = rom[i];
    }
  }

  reset(): void {
    // reset the memory
    for (let i = 0; i < this.memory.length; i++) {
      this.memory[i] = 0x00;
    }

    // load the fonts
    for (let i = 0; i < FONTSET.length; i++) {
      this.memory[i] = FONTSET[i];
    }

    // reset the registers
    for (let i = 0; i < 16; i++) {
      this.V[i] = 0x00;
    }

    for (let i = 0; i < 16; i++) {
      this.stack[i] = 0x0000;
    }

    // reset the display
    for (let i = 0; i < this.video.length; i++) {
      this.video[i] = 0;
    }

    this.PC = 0x200; // program counter 16 bits
    this.I = 0x0000; // index register 16 bits
    this.SP = 0x0000; // stack pointer 16 bits
    this.delayTimer = 0; // reset delay timer
    this.soundTimer = 0; // reset sound timer
    this.redraw = false;
  }

  getKeyPressed(): number {
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i]) i;
    }
    return -1;
  }

  setKey(key: number): void {
    this.keys[key] = true;
  }

  unsetKey(key: number): void {
    this.keys[key] = false;
  }

  updateTimers(): void {
    this.delayTimer = Math.max(0, this.delayTimer - 1);
    this.soundTimer = Math.max(0, this.soundTimer - 1);
  }

  setPixel(x: number, y: number) {
    const location = x + y * this.dWidth;
    this.video[location] ^= 1;
    return this.video[location];
  }

  getVideo() {
    return this.video;
  }

  getRegisters() {
    const vRegisters = this.V.reduce(
      (m, a, i) => ({ ...m, [`V${toHexString(i)}`]: toHexString(a) }),
      {}
    );

    const f = (v: number) => toHexString(v); //`0x${toHexString(v)}`;

    return {
      I: f(this.I),
      PC: f(this.PC),
      SP: f(this.SP),
      DT: f(this.delayTimer),
      ST: f(this.soundTimer),
      ...vRegisters
    };
  }

  getPC() {
    return this.PC;
  }

  getMemory() {
    return this.memory;
  }

  runCycle(): void {
    const opcode = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
    const x = (opcode & 0x0f00) >> 8;
    const y = (opcode & 0x00f0) >> 4;

    // increment the program counter by 2 since every instruction is 2 bytes long
    this.PC += 2;

    // console.table({
    //   X: x.toString(16),
    //   Y: y.toString(16),
    //   VX: this.V[x].toString(16),
    //   VY: this.V[y].toString(16),
    //   PC: this.PC.toString(16),
    //   SP: this.SP.toString(16),
    //   OPCODE: opcode.toString(16)
    //   // STACK: this.stack.forEach(x => ),
    // });

    // grab the first nibble for the opcode (4bits)
    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          case 0x00e0: // CLS
            for (let i = 0; i < this.video.length; i++) {
              this.video[i] = 0;
            }
            this.redraw = true;
            break;
          case 0x00ee: // RET
            this.SP--;
            this.PC = this.stack[this.SP];
            break;
        }
        break;
      case 0x1000: // 1nnn - JP addr
        this.PC = opcode & 0x0fff;
        break;
      case 0x2000: // 2nnn - CALL addr
        this.stack[this.SP] = this.PC;
        this.SP++;
        this.PC = opcode & 0x0fff; // nnn
        break;
      case 0x3000: // 3xkk - SE Vx, byte
        if (this.V[x] === (opcode & 0x00ff)) {
          this.PC += 2;
        }
        break;
      case 0x4000: // 4xkk - SNE Vx, byte
        if (this.V[x] !== (opcode & 0x00ff)) {
          this.PC += 2;
        }
        break;
      case 0x5000: // 5xy0 - SE Vx, Vy
        if (this.V[x] === this.V[y]) {
          this.PC += 2;
        }
        break;
      case 0x6000: // 6xkk - LD Vx, byte
        this.V[x] = opcode & 0xff; // 0xFF same as 0x00FF = 255
        break;
      case 0x7000: // 7xkk - ADD Vx, byte
        this.V[x] = (opcode & 0xff) + this.V[x];
        break;
      case 0x8000:
        switch (
          opcode & 0x000f // get lower nibble
        ) {
          case 0x0000: // 8xy0 - LD Vx, Vy
            this.V[x] = this.V[y];
            break;
          case 0x0001: // 8xy1 - OR Vx, Vy
            this.V[x] = this.V[x] | this.V[y];
            break;
          case 0x0002: // 8xy2 - AND Vx, Vy
            this.V[x] = this.V[x] & this.V[y];
            break;
          case 0x0003: // 8xy3 - XOR Vx, Vy
            this.V[x] = this.V[x] ^ this.V[y];
            break;
          case 0x0004: // 8xy4 - ADD Vx, Vy
            this.V[0xf] = this.V[x] + this.V[y] > 255 ? 0x1 : 0x0; // 1 or 0
            this.V[x] += this.V[y];
            break;
          case 0x0005: // 8xy5 - SUB Vx, Vy
            this.V[0xf] = this.V[x] > this.V[y] ? 0x1 : 0x0;
            this.V[x] -= this.V[y];
            break;
          case 0x0006: // 8xy6 - SHR Vx {, Vy}
            // this.V[0xF] = this.V[x] & 0xF; // set to LSB
            this.V[0xf] = this.V[y] & 0x1; // set to LSB if its 1
            // this.V[x] = this.V[y] >> 1;
            this.V[x] = this.V[x] >> 1;
            break;
          case 0x0007: // 8xy7 - SUBN Vx, Vy
            this.V[0xf] = this.V[y] > this.V[x] ? 0x1 : 0x0;
            this.V[x] = this.V[y] - this.V[x];
            break;
          case 0x000e: // 8xyE - SHL Vx {, Vy}
            // this.V[0xF] = (this.V[x] >> 7) & 0xF; // set to MSB
            this.V[0xf] = (this.V[y] >> 7) & 0x1; // set to MSB (1 or 0)
            // this.V[x] = this.V[y] << 1;
            this.V[x] = this.V[x] << 1;
            break;
        }
        break;
      case 0x9000: // 9xy0 - SNE Vx, Vy
        if (this.V[x] !== this.V[y]) {
          this.PC += 2;
        }
        break;
      case 0xa000: // Annn - LD I, addr
        this.I = opcode & 0x0fff;
        break;
      case 0xb000: // Bnnn - JP V0, addr
        this.PC = (opcode & 0x0fff) + this.V[x];
        break;
      case 0xc000: // Cxkk - RND Vx, byte
        this.V[x] = Math.floor(Math.random() * 0xff) & (opcode & 0xff);
        break;
      case 0xd000:
        // Dxyn - DRW Vx, Vy, nybble

        this.V[0xf] = 0;
        const height = opcode & 0x000f;
        for (let yLine = 0; yLine < height; yLine++) {
          const sprite = this.memory[this.I + yLine];

          for (let xLine = 0; xLine < 8; xLine++) {
            const [xC, yC] = [this.V[x] + xLine, this.V[y] + yLine];

            // if the current (or any pixel) is erased i.e. 1 to 0 then set VF to 01
            // const previousPixelValue = this.video[location];
            // this.video[location] ^= sprite & (0x80 >> xLine);
            const pixel = sprite & (0x80 >> xLine);
            // const pixel = (sprite >> xLine) & 0x1;
            // console.log(`sprite: ${sprite.toString(2)} - pixel: ${pixel.toString(2)}`);
            if (pixel > 0) {
              const newPixel = this.setPixel(xC, yC);
              if (newPixel !== 1) this.V[0xf] = 1;
            }
          }
        }
        this.redraw = true;
        break;

      case 0xe000:
        switch (
          opcode & 0x00ff // last byte
        ) {
          case 0x009e: // Ex9E - SKP Vx
            if (this.keys[this.V[x]]) {
              this.PC += 2;
            }
            break;
          case 0x00a1: // ExA1 - SKNP Vx
            if (!this.keys[this.V[x]]) {
              this.PC += 2;
            }
            break;
        }
        break;
      case 0xf000:
        switch (opcode & 0x00ff) {
          case 0x0007: // Fx07 - LD Vx, DT
            this.V[x] = this.delayTimer;
            break;
          case 0x000a: // Fx0A - LD Vx, K
            // run infinite loop until we receive a key?
            let wait = true;
            while (wait) {
              const key = this.getKeyPressed();
              if (key) {
                this.V[x] = key;
                wait = false;
              }
            }
            break;
          case 0x0015: // Fx15 - LD DT, Vx
            this.delayTimer = this.V[x];
            break;
          case 0x0018: // Fx18 - LD ST, Vx
            this.soundTimer = this.V[x];
            break;
          case 0x001e: // Fx1E - ADD I, Vx
            this.I = this.I + this.V[x];
            break;
          case 0x0029: // Fx29 - LD F, Vx
            this.I = this.V[x] * 5;
            break;
          case 0x0033: // Fx33 - LD B, Vx
            // memory[I]   = (V[x] % 1000) / 100; // hundred's digit
            // memory[I+1] = (V[x] % 100) / 10;   // ten's digit
            // memory[I+2] = (V[x] % 10);         // one's digit

            this.memory[this.I] = Math.floor(this.V[x] / 100) % 10; //  hundreds
            this.memory[this.I + 1] = Math.floor(this.V[x] / 10) % 10; // tens
            this.memory[this.I + 2] = Math.floor(this.V[x]) % 10; // ones
            break;
          case 0x0055: // Fx55 - LD [I], Vx
            for (let i = 0; i <= x; i++) {
              this.memory[this.I + i] = this.V[i];
            }
            // this.I = this.I + x + 1;
            break;
          case 0x0065: // Fx65 - LD Vx, [I]
            for (let i = 0; i <= x; i++) {
              this.V[i] = this.memory[this.I + i];
            }
            // this.I = this.I + x + 1;
            break;
        }
        break;
      default:
        console.log(`Opcode 0x${opcode.toString(16)} not implemented`);
    }
  }
}
