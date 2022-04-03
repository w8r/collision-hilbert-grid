import { Quadtree, quadtree, QuadtreeLeaf } from "d3-quadtree";
import { hilbert } from "../src/hilbert";
import { List } from "../src/list";
import { Box, overlaps } from "../src";

const w = document.documentElement.clientWidth;
const h = document.documentElement.clientHeight;
const dppx = devicePixelRatio;

console.log({ w, h, dppx });

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const W = (canvas.width = w * dppx);
const H = (canvas.height = h * dppx);
canvas.style.width = w + "px";
canvas.style.height = h + "px";

document.body.appendChild(canvas);

function render(boxes: Box[]) {
  boxes.forEach((box) => {
    if (box.rejected) return;
    const [x0, y0, x1, y1] = box;
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
  });
  ctx.stroke();
}

const N = 10000;
const [sx0, sy0, sx1, sy1] = [0, 0, W, H];
const minw = 60;
const boxes: Box[] = new Array(N).fill(0).map(() => {
  const x = (sx1 - sx0) * Math.random();
  const y = (sy1 - sy0) * Math.random();

  return [x, y, x + minw + ((Math.random() - 0.5) * minw) / 2, y + 20];
});

function resolve(boxes: Box[]) {
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
  boxes.forEach((b) => {
    const [x0, y0, x1, y1] = b;
    // const x = (x0 + x1) / 2;
    // const y = (y0 + y1) / 2;
    // const r = Math.max((x1 - x0) / 2, (y1 - y0) / 2);
    //const res = q.find(x, y, r);
    res.length = 0;
    search(q, x0, y0, x1, y1, res);
    if (res.length === 0) {
      q.add(b);
    } else b.rejected = true;
  });
  // console.log(
  //   "d3-quadtree:",
  //   q.size(),
  //   "boxes inserted in",
  //   Date.now() - start,
  //   "ms",
  //   qchecks,
  //   "direct checks"
  // );
}

function resolve2(boxes: Box[]) {
  let start = Date.now();
  let gchecks = 0;
  /** @type {Map<number, List>} */
  const grid = new Map<number, List<Box>>();
  boxes.forEach((b) => {
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
      else b.rejected = true; //console.log(res);
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
}

function frame() {
  resolve(boxes);
  render2(boxes);
  requestAnimationFrame(frame);
}
frame();
