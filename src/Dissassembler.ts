import { toHexString, toPaddedHexString } from './utils';

export default class Dissassembler {
  static decode(rom: Uint8Array, pc: number, startPC: number = 0x200): String {
    const opcode = (rom[pc] << 8) | rom[pc + 1];

    const x = toHexString((opcode & 0x0f00) >> 8);
    const y = toHexString((opcode & 0x00f0) >> 4);
    const nnn = `0x${toHexString(opcode & 0xfff)}`;
    const n = `0x${toHexString(opcode & 0xf)}`;

    const kk = `0x${toHexString(opcode & 0xff)}`;

    let bitdiagram = () => {
      const upperBits = (rom[pc] || '').toString(2).padStart(8, '0');
      const lowerBits = (rom[pc + 1] || '').toString(2).padStart(8, '0');

      const patternFn = (upperBit: string, lowerBit: string) => {
        const fullblock = '\u2588';
        const upperblock = '\u2580';
        const lowerblock = '\u2584';
        const space = ' ';
        const pattern = upperBit + lowerBit;
        switch (pattern) {
          case '11':
            return fullblock;
          case '10':
            return upperblock;
          case '01':
            return lowerblock;
          default:
            return space;
        }
      };
      let output = '';
      for (let i = 0; i < 8; i++) {
        output += patternFn(upperBits[i], lowerBits[i]);
      }
      return output;
    };

    // let ascii = bitdiagram();

    let output = `${toPaddedHexString(pc + startPC)}:\t ${toHexString(opcode)}\t`;
    // ${opcode
    //   .toString(16)
    //   .padStart(4, '0')
    //   .toUpperCase()}\t`;

    // grab the first nibble for the opcode (4bits)
    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode) {
          case 0x00e0: // CLS
            output += 'CLS';
            break;
          case 0x00ee: // RET
            output += 'RET';
            break;
          default:
            output += `SYS ${nnn}`;
        }
        break;
      case 0x1000: // 1nnn - JP addr
        output += `JP ${nnn}`;
        break;
      case 0x2000: // 2nnn - CALL addr
        output += `CALL ${nnn}`;
        break;
      case 0x3000: // 3xkk - SE Vx, byte
        output += `SE V${x}, ${kk}`;
        break;
      case 0x4000: // 4xkk - SNE Vx, byte
        output += `SNE V${x}, ${kk}`;
        break;
      case 0x5000: // 5xy0 - SE Vx, Vy
        output += `SNE V${x}, V${y}`;
        break;
      case 0x6000: // 6xkk - LD Vx, byte
        output += `LD V${x}, ${kk}`;
        break;
      case 0x7000: // 7xkk - ADD Vx, byte
        output += `ADD V${x}, ${kk}`;
        break;
      case 0x8000:
        switch (
          opcode & 0x000f // get lower nibble
        ) {
          case 0x0000: // 8xy0 - LD Vx, Vy
            output += `LD V${x}, V${y}`;
            break;
          case 0x0001: // 8xy1 - OR Vx, Vy
            output += `OR V${x}, V${y}`;
            break;
          case 0x0002: // 8xy2 - AND Vx, Vy
            output += `AND V${x}, V${y}`;
            break;
          case 0x0003: // 8xy3 - XOR Vx, Vy
            output += `XOR V${x}, V${y}`;
            break;
          case 0x0004: // 8xy4 - ADD Vx, Vy
            output += `ADD V${x}, V${y}`;
            break;
          case 0x0005: // 8xy5 - SUB Vx, Vy
            output += `SUB V${x}, V${y}`;
            break;
          case 0x0006: // 8xy6 - SHR Vx {, Vy}
            output += `SHR V${x}, V${y}`;
            break;
          case 0x0007: // 8xy7 - SUBN Vx, Vy
            output += `SUBN V${x}, V${y}`;
            break;
          case 0x000e: // 8xyE - SHL Vx {, Vy}
            output += `SHL V${x}, V${y}`;
            break;
        }
        break;
      case 0x9000: // 9xy0 - SNE Vx, Vy
        output += `SNE V${x}, V${y}`;
        break;
      case 0xa000: // Annn - LD I, addr
        output += `LD I, ${nnn}`;
        break;
      case 0xb000: // Bnnn - JP V0, addr
        output += `JP V0, ${nnn}`;
        break;
      case 0xc000: // Cxkk - RND Vx, byte
        output += `RND V${x}, ${kk}`;
        break;
      case 0xd000:
        // Dxyn - DRW Vx, Vy, nibble
        output += `DRW V${x}, V${y}, ${n}`;
        break;
      case 0xe000:
        switch (
          opcode & 0x00ff // last byte
        ) {
          case 0x009e: // Ex9E - SKP Vx
            output += `SKP V${x}`;
            break;
          case 0x00a1: // ExA1 - SKNP Vx
            output += `SKNP V${x}`;
            break;
        }
        break;
      case 0xf000:
        switch (opcode & 0x00ff) {
          case 0x0007: // Fx07 - LD Vx, DT
            output += `LD V${x}, DT`;
            break;
          case 0x000a: // Fx0A - LD Vx, K
            output += `LD V${x}, K`;
            break;
          case 0x0015: // Fx15 - LD DT, Vx
            output += `LD DT, V${x}`;
            break;
          case 0x0018: // Fx18 - LD ST, Vx
            output += `LD ST, V${x}`;
            break;
          case 0x001e: // Fx1E - ADD I, Vx
            output += `ADD I, V${x}`;
            break;
          case 0x0029: // Fx29 - LD F, Vx
            output += `LD F, V${x}`;
            break;
          case 0x0033: // Fx33 - LD B, Vx
            output += `LD B, V${x}`;
            break;
          case 0x0055: // Fx55 - LD [I], Vx
            output += `LD [I], V${x}`;
            break;
          case 0x0065: // Fx65 - LD Vx, [I]
            output += `LD V${x}, [I]`;
            break;
        }
        break;
      default:
        output = `0x${opcode.toString(16)} NOT IMPLEMENTED`;
    }

    output = output.padEnd(30);
    // output += `\t${ascii}`;

    return output;
  }
}
