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

interface Body {
  bounds: Box;
  rejected?: boolean;
}

document.body.appendChild(canvas);

function render(boxes: Body[]) {
  console.log(boxes.filter((b) => b.rejected).length);
  boxes.forEach((box) => {
    if (box.rejected) return;
    const [x0, y0, x1, y1] = box.bounds;
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
  });
  ctx.stroke();
}

const N = 10000;
const [sx0, sy0, sx1, sy1] = [0, 0, W, H];
const minw = 60;
const boxes: Body[] = new Array(N).fill(0).map(() => {
  const x = (sx1 - sx0) * Math.random();
  const y = (sy1 - sy0) * Math.random();

  return {
    bounds: [x, y, x + minw + ((Math.random() - 0.5) * minw) / 2, y + 20],
  };
});

function resolve(boxes: Body[]) {
  const q = quadtree<Body>()
    .x(({ bounds: d }) => (d[0] + d[2]) / 2)
    .y(({ bounds: d }) => (d[1] + d[3]) / 2);

  let qchecks = 0;
  // Find the nodes within the specified rectangle.
  function search(
    quadtree: Quadtree<Body>,
    x0: number,
    y0: number,
    x3: number,
    y3: number,
    b: Body[]
  ) {
    quadtree.visit((node, x1, y1, x2, y2) => {
      if (!node.length) {
        let leaf = node as QuadtreeLeaf<Body>;
        do {
          const d = leaf.data.bounds;
          //d.scanned = true;
          qchecks++;
          if (overlaps(d[0], d[1], d[2], d[3], x0, y0, x1, y1))
            b.push(leaf.data);
          //d.selected = d[0] >= x0 && d[0] < x3 && d[1] >= y0 && d[1] < y3;
        } while ((leaf = leaf.next as QuadtreeLeaf<Body>));
      }
      return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
    });
  }

  let start = Date.now();
  let gchecks = 0;
  const res: Body[] = [];
  boxes.forEach((b) => {
    const [x0, y0, x1, y1] = b.bounds;
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

function resolve2(boxes: Body[]) {
  let start = Date.now();
  let gchecks = 0;
  /** @type {Map<number, List>} */
  const grid = new Map<number, List<Body>>();
  boxes.forEach((b) => {
    const R = 1 << 6;
    const [x0, y0, x1, y1] = b.bounds;
    const x = Math.round((x0 + x1) / 2 / R);
    const y = Math.round((y0 + y1) / 2 / R);
    //const r = Math.max((x1 - x0) / 2, (y1 - y0) / 2 / R);

    const code = hilbert(x, y);
    const res = grid.get(code);
    if (!res) {
      const list = new List<Body>();
      list.append(b);
      grid.set(code, list);
    } else {
      let ov = 0;
      res.forEach(({ data: { bounds } }) => {
        gchecks++;
        if (
          overlaps(bounds[0], bounds[1], bounds[2], bounds[3], x0, y0, x1, y1)
        )
          ov++;
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
    "direct checks",
    grid
  );
}

function frame() {
  resolve2(boxes);
  render(boxes);
  //requestAnimationFrame(frame);
}
frame();
