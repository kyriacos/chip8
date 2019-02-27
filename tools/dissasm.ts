const fs = require('fs');
const Dissassembler = require('../src/Dissassembler');

function run() {
  if (!process.argv[2]) {
    throw new Error('must supply a file');
  }

  const rom = new Uint8Array(fs.readFileSync(process.argv[1]));

  let pc = 0;
  while (pc < rom.length) {
    const output = Dissassembler.decode(rom, pc);
    pc += 2;

    console.log(output);
  }
}

run();
