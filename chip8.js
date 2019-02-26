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
// const fs = require('fs');
// const stdin = process.stdin;
// const rom = fs.readFileSync('./maze.ch8');
// prettier-ignore
var fontSet = new Uint8Array([
    0xF0, 0x90, 0x90, 0x90, 0xF0,
    0x20, 0x60, 0x20, 0x20, 0x70,
    0xF0, 0x10, 0xF0, 0x80, 0xF0,
    0xF0, 0x10, 0xF0, 0x10, 0xF0,
    0x90, 0x90, 0xF0, 0x10, 0x10,
    0xF0, 0x80, 0xF0, 0x10, 0xF0,
    0xF0, 0x80, 0xF0, 0x90, 0xF0,
    0xF0, 0x10, 0x20, 0x40, 0x40,
    0xF0, 0x90, 0xF0, 0x90, 0xF0,
    0xF0, 0x90, 0xF0, 0x10, 0xF0,
    0xF0, 0x90, 0xF0, 0x90, 0x90,
    0xE0, 0x90, 0xE0, 0x90, 0xE0,
    0xF0, 0x80, 0x80, 0x80, 0xF0,
    0xE0, 0x90, 0x90, 0x90, 0xE0,
    0xF0, 0x80, 0xF0, 0x80, 0xF0,
    0xF0, 0x80, 0xF0, 0x80, 0x80 // F
]);
var D_HEIGHT = 32;
var D_WIDTH = 64;
function chip8() {
    this.memory = new Uint8Array(4096);
    this.stack = new Uint16Array(16);
    this.V = new Uint8Array(16); // V0 - VF
    this.PC = 0x200; // program counter 16 bits
    this.I = 0x0000; // index register 16 bits
    this.SP = 0x0000; // stack pointer 16 bits
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.screen = new Uint8Array(D_WIDTH * D_HEIGHT); // 64 x 32 pixels
    this.keys = new Uint8Array(16); // the keys 0x0 - 0xF
    this.loadFonts = function () {
        for (var i = 0; i < fontSet.length; i++) {
            this.memory[i] = fontSet[i];
        }
    };
    this.loadRom = function (file) {
        /*
          Maze (alt) [David Winter, 199x].ch8
          00000000:	6000	6100	efbf	bd22	efbf	bd01	3201	efbf
          00000010:	bd1e	efbf	bd14	7004	3040	1204	6000	7104
          00000020:	3120	1204	121c	efbf	bd40	2010	2040	efbf
          00000030:	bd10
        */
        // readFileSync returns a buffer which is basically a Unit8Array
        // https://github.com/nodejs/node/issues/11132
        var program = new Uint8Array(file);
        for (var i = 0; i < program.length; i++) {
            this.memory[i + 0x200] = program[i];
        }
    };
    this.reset = function () {
        // reset the memory
        for (var i = 0; i < this.memory.length; i++) {
            this.memory[i] = 0x00;
        }
        // load the fonts
        this.loadFonts();
        // reset the registers
        for (var i = 0; i < 16; i++) {
            this.V[i] = 0x00;
        }
        for (var i = 0; i < 16; i++) {
            this.stack[i] = 0x0000;
        }
        // reset the display
        for (var i = 0; i < this.screen.length; i++) {
            this.screen[i] = 0;
        }
        this.SP = 0; // reset the stack pointer
        this.I = 0; // reset index register
        this.PC = 0x200; // reset the program counter
        this.delayTimer = 0; // reset delay timer
        this.soundTimer = 0; // reset sound timer
    };
    this.runCycle = function () {
        var opcode = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];
        var x = (opcode & 0x0F00) >> 8;
        var y = (opcode & 0x00F0) >> 4;
        // increment the program counter by 2 since every instruction is 2 bytes long
        this.PC += 2;
        // grab the first nibble for the opcode (4bits)
        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0: // CLS
                        for (var i = 0; i < this.screen.length; i++) {
                            this.screen[i] = 0;
                        }
                        this.redraw = true;
                        break;
                    case 0x00EE: // RET
                        this.SP--;
                        this.PC = this.stack[this.SP];
                        break;
                }
                break;
            case 0x1000: // 1nnn - JP addr
                this.PC = opcode & 0x0FFF;
                break;
            case 0x2000: // 2nnn - CALL addr
                this.stack[this.SP] = this.PC;
                this.SP++;
                this.PC = opcode & 0x0FFF; // nnn
                break;
            case 0x3000: // 3xkk - SE Vx, byte
                if (this.V[x] === (opcode & 0x00FF)) {
                    this.PC += 2;
                }
                break;
            case 0x4000: // 4xkk - SNE Vx, byte
                if (this.V[x] !== (opcode & 0x00FF)) {
                    this.PC += 2;
                }
                break;
            case 0x5000: // 5xy0 - SE Vx, Vy
                if (this.V[x] === this.V[y]) {
                    this.PC += 2;
                }
                break;
            case 0x6000: // 6xkk - LD Vx, byte
                this.V[x] = opcode & 0xFF; // 0xFF same as 0x00FF = 255
                break;
            case 0x7000: // 7xkk - ADD Vx, byte
                this.V[x] = (opcode & 0xFF) + this.V[x];
                break;
            case 0x8000:
                switch (opcode & 0x000F // get lower nibble
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
                        this.V[0xF] = this.V[x] + this.V[y] > 255 ? 0x1 : 0x0; // 1 or 0
                        this.V[x] += this.V[y];
                        break;
                    case 0x0005: // 8xy5 - SUB Vx, Vy
                        this.V[0xF] = this.V[x] > this.V[y] ? 0x1 : 0x0;
                        this.V[x] -= this.V[y];
                        break;
                    case 0x0006: // 8xy6 - SHR Vx {, Vy}
                        // this.V[0xF] = this.V[x] & 0xF; // set to LSB
                        this.V[0xF] = this.V[y] & 0x1; // set to LSB if its 1
                        // this.V[x] = this.V[y] >> 1;
                        this.V[x] = this.V[x] >> 1;
                        break;
                    case 0x0007: // 8xy7 - SUBN Vx, Vy
                        this.V[0xF] = this.V[y] > this.V[x] ? 0x1 : 0x0;
                        this.V[x] = this.V[y] - this.V[x];
                        break;
                    case 0x000E: // 8xyE - SHL Vx {, Vy}
                        // this.V[0xF] = (this.V[x] >> 7) & 0xF; // set to MSB
                        this.V[0xF] = (this.V[y] >> 7) & 0x1; // set to MSB (1 or 0)
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
            case 0xA000: // Annn - LD I, addr
                this.I = opcode & 0x0FFF;
                break;
            case 0xB000: // Bnnn - JP V0, addr
                this.PC = (opcode & 0x0FFF) + this.V[x];
                break;
            case 0xC000: // Cxkk - RND Vx, byte
                this.V[x] = Math.floor(Math.random() * 0xFF) & (opcode & 0xFF);
                break;
            case 0xD000:
                // Dxyn - DRW Vx, Vy, nybble
                this.V[0xF] = 0;
                var height = opcode & 0x000F;
                for (var yLine = 0; yLine < height; yLine++) {
                    var sprite = this.memory[this.I + yLine];
                    for (var xLine = 0; xLine < 8; xLine++) {
                        var _a = [this.V[x] + xLine, this.V[y] + yLine], xC = _a[0], yC = _a[1];
                        // if the current (or any pixel) is erased i.e. 1 to 0 then set VF to 01
                        // const previousPixelValue = this.screen[location];
                        // this.screen[location] ^= sprite & (0x80 >> xLine);
                        var pixel = sprite & (0x80 >> xLine);
                        // const pixel = (sprite >> xLine) & 0x1;
                        // console.log(`sprite: ${sprite.toString(2)} - pixel: ${pixel.toString(2)}`);
                        if (pixel > 0) {
                            var newPixel = this.setPixel(xC, yC);
                            if (newPixel !== 1)
                                this.V[0xF] = 1;
                        }
                    }
                }
                this.redraw = true;
                break;
            case 0xE000:
                switch (opcode & 0x00FF // last byte
                ) {
                    case 0x009E: // Ex9E - SKP Vx
                        if (this.keys[this.V[x]]) {
                            this.PC += 2;
                        }
                        break;
                    case 0x00A1: // ExA1 - SKNP Vx
                        if (!this.keys[this.V[x]]) {
                            this.PC += 2;
                        }
                        break;
                }
                break;
            case 0xF000:
                switch (opcode & 0x00FF) {
                    case 0x0007: // Fx07 - LD Vx, DT
                        this.V[x] = this.delayTimer;
                        break;
                    case 0x000A: // Fx0A - LD Vx, K
                        // run infinite loop until we receive a key?
                        var wait = true;
                        while (wait) {
                            var key = this.keyPressed();
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
                    case 0x001E: // Fx1E - ADD I, Vx
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
                        for (var i = 0; i <= x; i++) {
                            this.memory[this.I + i] = this.V[i];
                        }
                        // this.I = this.I + x + 1;
                        break;
                    case 0x0065: // Fx65 - LD Vx, [I]
                        for (var i = 0; i <= x; i++) {
                            this.V[i] = this.memory[this.I + i];
                        }
                        // this.I = this.I + x + 1;
                        break;
                }
                break;
            default:
                console.log("Opcode 0x" + opcode.toString(16) + " not implemented");
        }
    };
    this.keyPressed = function () {
        for (var i = 0; i < this.keys.length; i++) {
            if (this.keys[i])
                return this.keys[i];
        }
        return -1;
    };
    this.setKey = function (key) {
        console.log(key);
        this.keys[key] = true;
    };
    this.unsetKey = function (key) {
        this.keys[key] = false;
    };
    this.init = function (renderer) {
        var _this = this;
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.reset();
        this.timer = setInterval(function () {
            for (var i = 0; i < 10; i++) {
                _this.runCycle();
            }
            if (_this.redraw) {
                renderer.draw(_this.screen);
                _this.redraw = false;
            }
            _this.delayTimer = Math.max(0, _this.delayTimer - 1);
            _this.soundTimer = Math.max(0, _this.soundTimer - 1);
        }, 5);
        // const run = () => {
        //   for (let i = 0; i < 10; i++) {
        //     this.runCycle();
        //   }
        //   if (this.redraw) {
        //     renderer.draw(this.screen);
        //     this.redraw = false;
        //   }
        //   this.delayTimer = Math.max(0, this.delayTimer - 1);
        //   this.soundTimer = Math.max(0, this.soundTimer - 1);
        //   window.requestAnimationFrame(run);
        // };
        // window.requestAnimationFrame(run);
    };
    this.setPixel = function (x, y) {
        var location = x + y * D_WIDTH;
        this.screen[location] ^= 1;
        return this.screen[location];
    };
}
var ASCIIRenderer = /** @class */ (function () {
    function ASCIIRenderer() {
        this.pre = document.getElementsByTagName('pre')[0];
    }
    ASCIIRenderer.prototype.clear = function () {
        this.pre.innerText = '';
    };
    ASCIIRenderer.prototype.draw = function (screen) {
        var output = '';
        for (var i = 0; i < screen.length; i++) {
            if (i % D_WIDTH === 0) {
                output += '\n';
            }
            output += screen[i] > 0 ? 'X' : ' ';
        }
        this.pre.innerText = output;
    };
    return ASCIIRenderer;
}());
var CELL_SIZE = 8;
var Renderer = /** @class */ (function () {
    function Renderer() {
        this.canvas = document.getElementsByTagName('canvas')[0];
        this.canvas.width = CELL_SIZE * D_WIDTH;
        this.canvas.height = CELL_SIZE * D_HEIGHT;
        this.context = this.canvas.getContext('2d');
    }
    Renderer.prototype.setPixel = function (x, y, pixel) {
        this.context.fillStyle = ['#000', '#299617'][pixel]; // 0 or 1
        this.context.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    };
    Renderer.prototype.clear = function () {
        this.context.clearRect(0, 0, D_WIDTH * CELL_SIZE, D_HEIGHT * CELL_SIZE);
    };
    Renderer.prototype.draw = function (screen) {
        for (var i = 0; i < screen.length; i++) {
            var x = (i % D_WIDTH) * CELL_SIZE;
            var y = Math.floor(i / D_WIDTH) * CELL_SIZE;
            this.setPixel(x, y, screen[i]);
        }
    };
    Renderer.prototype.fullscreen = function () {
        if (!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullscreenElement)) {
            this.canvas.requestFullscreen()["catch"](function (err) {
                alert("Error attempting to enable full-screen mode: " + err.message + " (" + err.name + ")");
            });
        }
        else {
            document.exitFullscreen();
        }
    };
    return Renderer;
}());
var KeyMap = /** @class */ (function () {
    function KeyMap() {
    }
    KeyMap.getKeyMap = function () {
        return {
            1: 0x0,
            2: 0x1,
            3: 0x2,
            4: 0x3,
            q: 0x4,
            w: 0x5,
            e: 0x6,
            r: 0x7,
            a: 0x8,
            s: 0x9,
            d: 0xA,
            f: 0xB,
            z: 0xC,
            x: 0xD,
            c: 0xE,
            v: 0xF
        };
    };
    return KeyMap;
}());
