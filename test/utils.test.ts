import { overlaps } from "../dist/utils";
describe("Utils", () => {
  it("overlaps", () => {
    expect(overlaps(0, 0, 10, 10, 0, 0, 10, 10)).toBe(true);
    expect(overlaps(-2, -2, 10, 10, 0, 0, 9, 9)).toBe(true);
    expect(overlaps(0, 0, 1, 1, 1, 1, 2, 2)).toBe(false);
    expect(overlaps(0, 0, 1, 1, 0.5, 0, 1, 1)).toBe(true);
    expect(overlaps(0, 0, 1, 1, 2, 0, 3, 1)).toBe(false);
    expect(overlaps(0, 0, 1, 1, 0, 1, 1, 2)).toBe(false);
    expect(overlaps(0, 0, 1, 1, 0.5, 0.5, 0.75, 0.75)).toBe(true);
  });
});
