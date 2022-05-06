import { createElement } from "react";

/**
 *
 * @param {Object} options
 * @param {number} options.cx
 * @param {number} options.cy
 * @param {number} options.diameter
 * @param {number} options.vertices
 * @param {number} options.n
 * @returns {[number, number]} (x: number, y: number)
 */
export function calculateNextPoint({ cx, cy, diameter, n, vertices }) {
  const radius = diameter / 2;
  const angleFromCenter = (2 * n * Math.PI) / vertices;
  return [
    cx + radius * Math.cos(angleFromCenter),
    cy + radius * Math.sin(angleFromCenter),
  ];
}

/**
 *
 * @param {Object} props
 * @param {number} props.cx
 * @param {number} props.cy
 * @param {number} props.diameter
 * @param {number} props.strokeWidth
 * @param {number} props.vertices
 * @returns {import("react").ReactElement}
 */
export function NGon(props) {
  const { cx, cy, diameter, strokeWidth, vertices } = props;
  const zeroAdjustment = Math.floor(strokeWidth / 2);
  const adjustedDiameter = diameter - zeroAdjustment;
  const [x1, y1] = calculateNextPoint({
    cx,
    cy,
    diameter: adjustedDiameter,
    n: 1,
    vertices,
  });
  let d = `M ${x1} ${y1}`;
  for (let i = 2; i <= vertices; i++) {
    const [x, y] = calculateNextPoint({
      cx,
      cy,
      diameter: adjustedDiameter,
      n: i,
      vertices,
    });
    d += `L ${x} ${y}`;
  }
  d += " Z";
  return createElement("path", { ...props, d });
}
