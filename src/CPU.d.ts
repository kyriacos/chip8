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
    constructor(dWidth: number, dHeight: number);
    loadRom(file: ArrayBuffer): void;
    reset(): void;
    getKeyPressed(): number;
    setKey(key: number): void;
    unsetKey(key: number): void;
    updateTimers(): void;
    setPixel(x: number, y: number): number;
    runCycle(): void;
}
