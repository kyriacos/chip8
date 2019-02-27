export default class Dissassembler {
  static decode(rom: Uint8Array, pc: number): String {
    const opcode = (rom[pc] << 8) | rom[pc + 1];

    const x = `${((opcode & 0x0F00) >> 8).toString(16).toUpperCase()}`;
    const y = `${((opcode & 0x00F0) >> 4).toString(16).toUpperCase()}`;
    const nnn = `0x${(opcode & 0xFFF).toString(16).toUpperCase()}`;
    const nn = `0x${(opcode & 0xFF).toString(16).toUpperCase()}`;
    const n = `0x${(opcode & 0xF).toString(16).toUpperCase()}`;

    const kk = `0x${(opcode & 0xFF).toString(16).toUpperCase()}`;

    let output = `${(0x0200 + pc)
      .toString(16)
      .padStart(4, '0')
      .toUpperCase()}\t`;
    // grab the first nibble for the opcode (4bits)
    switch (opcode & 0xF000) {
      case 0x0000:
        switch (opcode) {
          case 0x00E0: // CLS
            output += 'CLS';
            break;
          case 0x00EE: // RET
            output += 'RET';
            break;
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
          opcode & 0x000F // get lower nibble
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
          case 0x000E: // 8xyE - SHL Vx {, Vy}
            output += `SHL V${x}, V${y}`;
            break;
        }
        break;
      case 0x9000: // 9xy0 - SNE Vx, Vy
        output += `SNE V${x}, V${y}`;
        break;
      case 0xA000: // Annn - LD I, addr
        output += `LD I, ${nnn}`;
        break;
      case 0xB000: // Bnnn - JP V0, addr
        output += `JP V0, ${nnn}`;
        break;
      case 0xC000: // Cxkk - RND Vx, byte
        output += `RND V${x}, ${kk}`;
        break;
      case 0xD000:
        // Dxyn - DRW Vx, Vy, nibble
        output += `DRW V${x}, V${y}, ${n}`;
        break;
      case 0xE000:
        switch (
          opcode & 0x00FF // last byte
        ) {
          case 0x009E: // Ex9E - SKP Vx
            output += `SKP V${x}`;
            break;
          case 0x00A1: // ExA1 - SKNP Vx
            output += `SKNP V${x}`;
            break;
        }
        break;
      case 0xF000:
        switch (opcode & 0x00FF) {
          case 0x0007: // Fx07 - LD Vx, DT
            output += `LD V${x}, DT`;
            break;
          case 0x000A: // Fx0A - LD Vx, K
            output += `LD V${x}, K`;
            break;
          case 0x0015: // Fx15 - LD DT, Vx
            output += `LD DT, V${x}`;
            break;
          case 0x0018: // Fx18 - LD ST, Vx
            output += `LD ST, V${x}`;
            break;
          case 0x001E: // Fx1E - ADD I, Vx
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
        output = `Opcode 0x${opcode.toString(16)} not implemented`;
    }

    return output;
  }
}
