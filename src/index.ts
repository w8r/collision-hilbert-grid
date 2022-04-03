import { Quadtree, quadtree, QuadtreeLeaf } from "d3-quadtree";
import { hilbert } from "./hilbert";
import { List } from "./list";
import { overlaps } from "./utils";
import { Box } from "./types";

// function intersects(a, b) {
//   return b[0] < a[2] && b[1] < a[3] && b[2] > a[0] && b[3] > a[1];
// }

const N = 1000;
const [sx0, sy0, sx1, sy1] = [0, 0, 2560, 1600];
const minw = 60;
const bounds: Box[] = new Array(N).fill(0).map(() => {
  const x = (sx1 - sx0) * Math.random();
  const y = (sy1 - sy0) * Math.random();

  return [x, y, x + minw + ((Math.random() - 0.5) * minw) / 2, y + 20];
});

const q = quadtree<Box>()
  .x((d) => (d[0] + d[2]) / 2)
  .y((d) => (d[1] + d[3]) / 2);

let qchecks = 0;
// Find the nodes within the specified rectangle.
function search(
  quadtree: Quadtree<Box>,
  x0: number,
  y0: number,
  x3: number,
  y3: number,
  b: Box[]
) {
  quadtree.visit((node, x1, y1, x2, y2) => {
    if (!node.length) {
      let leaf = node as QuadtreeLeaf<Box>;
      do {
        const d = leaf.data;
        //d.scanned = true;
        qchecks++;
        if (overlaps(d[0], d[1], d[2], d[3], x0, y0, x1, y1)) b.push(d);
        //d.selected = d[0] >= x0 && d[0] < x3 && d[1] >= y0 && d[1] < y3;
      } while ((leaf = leaf.next as QuadtreeLeaf<Box>));
    }
    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
  });
}

let start = Date.now();
let gchecks = 0;
const res: Box[] = [];
bounds.forEach((b) => {
  const [x0, y0, x1, y1] = b;
  // const x = (x0 + x1) / 2;
  // const y = (y0 + y1) / 2;
  // const r = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
  //const res = q.find(x, y, r);
  res.length = 0;
  search(q, x0, y0, x1, y1, res);
  if (res.length === 0) {
    q.add(b);
  }
});
console.log(
  "d3-quadtree:",
  q.size(),
  "boxes inserted in",
  Date.now() - start,
  "ms",
  qchecks,
  "direct checks"
);

start = Date.now();
/** @type {Map<number, List>} */
const grid = new Map<number, List<Box>>();
bounds.forEach((b) => {
  const R = 1 << 5;
  const [x0, y0, x1, y1] = b;
  const x = Math.round((x0 + x1) / 2 / R);
  const y = Math.round((y0 + y1) / 2 / R);
  //const r = Math.max((x1 - x0) / 2, (y1 - y0) / 2 / R);

  const code = hilbert(x, y);
  const res = grid.get(code);
  if (!res) {
    const list = new List<Box>();
    list.append(b);
    grid.set(code, list);
  } else {
    let ov = 0;
    res.forEach(({ data }) => {
      gchecks++;
      if (overlaps(data[0], data[1], data[2], data[3], x0, y0, x1, y1)) ov++;
    });
    //console.log(ov);
    if (ov === 0) res.append(b);
    //console.log(res);
  }
  // const res = q.find(x, y, r);
  // if (!res) {
  //   q.add(b);
  // } else {
  // }
});
console.log(
  "Hilbert grid:",
  grid.size,
  "inserted in",
  Date.now() - start,
  "ms",
  gchecks,
  "direct checks"
);

export * from "./types";
export * from "./utils";
