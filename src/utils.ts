import { Box } from "./types";

export function overlaps(
  a0: number,
  a1: number,
  a2: number,
  a3: number,
  b0: number,
  b1: number,
  b2: number,
  b3: number
) {
  return a3 > b1 && a1 < b3 && a2 > b0 && a0 < b2;
}

export function intersects(a: Box, b: Box) {
  return b[0] < a[2] && b[1] < a[3] && b[2] > a[0] && b[3] > a[1];
}
