import typescript from 'rollup-plugin-typescript2';

export default {
  input: './src/Emulator.ts',
  output: {
    file: 'build/bundle.js',
    format: 'cjs'
  },

  plugins: [typescript(/*{ plugin options }*/)]
};
