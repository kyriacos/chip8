export function toHexString(val: number | string) {
  return val.toString(16).toUpperCase();
}

export function toPaddedHexString(val: number | string) {
  return val
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
}
