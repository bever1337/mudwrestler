/// @ts-check
/* eslint-env browser */
import { scaleLinear } from "d3";
import { createElement, Fragment } from "react";

import { NGon } from "./NGon";
import { Svg } from "./Svg";

// Create the scale
const scale = scaleLinear()
  .domain([-100, 100]) // This is what is written on the Axis: from 0 to 100
  .range([-2000, 2000]); // This is where the axis is placed: from 100px to 800px

/**
 * @typedef {Object} SvgProps
 * @property {string} props.currentArea
 * @property {(next: string) => void} props.setCurrentArea
 *
 * @param {SvgProps & Map} props
 */
export function Mapper(props) {
  const links = (props?.exit_keys ?? [])
    .filter((exitKey) => {
      return (
        props.rooms?.[props.exits?.[exitKey]?.targetRoom ?? ""]?.area ===
        props.currentArea
      );
    })
    .reduce(
      /**
       * @param {{ source: string, target: string }[]} acc
       * @param {*} exitKey
       * @returns {{ source: string, target: string }[]}
       */
      (acc, exitKey) =>
        acc.concat([
          {
            source: props.exits?.[exitKey]?.room ?? "",
            target: props.exits?.[exitKey]?.targetRoom ?? "",
          },
        ]),
      []
    );

  return createElement(
    Svg,
    undefined,

    links.map(({ source, target }, index) =>
      createElement("line", {
        stroke: "#aaa",
        strokeWidth: "1",
        key: `${source}_${target}`,
        x1: scale(parseInt(props.rooms?.[source]?.x ?? "0", 10)),
        y1: -1 * scale(parseInt(props.rooms?.[source]?.y ?? "0", 10)),
        x2: scale(parseInt(props.rooms?.[target]?.x ?? "0", 10)),
        y2: -1 * scale(parseInt(props.rooms?.[target]?.y ?? "0", 10)),
      })
    ),
    props?.room_keys
      ?.filter((roomKey) => props.rooms?.[roomKey]?.area === props.currentArea)
      .map((roomKey) =>
        createElement(NGon, {
          key: props.rooms?.[roomKey]?.id,
          cx: scale(parseInt(props.rooms?.[roomKey]?.x ?? "0", 10)),
          cy: -1 * scale(parseInt(props.rooms?.[roomKey]?.y ?? "0", 10)), // in layout world, y increases going 'down' the axis
          diameter: scale(0.5),
          strokeWidth: 1,
          // title: `(${props.rooms?.[roomKey]?.x}, ${props.rooms?.[roomKey]?.y}), ${props.rooms?.[roomKey]?.title}`,
          vertices: 8,
        })
      )
  );
}

/**
 * @typedef {Object} Map
 * @property {Record<string, { id: string, name: string, x: string, y: string }>} Map.areas
 * @property {(keyof Map['areas'])[]} Map.area_keys
 * @property {Record<string, { color: string, htmlcolor: string, id: string, name: string }>} Map.environments
 * @property {(keyof Map['environments'])[]} Map.environment_keys
 * @property {Record<string, { direction: string, id: string, room: string, targetRoom: string, targetArea: string }>} Map.exits
 * @property {(keyof Map['exits'])[]} Map.exit_keys
 * @property {Record<string, { area: string, environment: string, id: string, title: string, x: string, y: string, z: string }>} Map.rooms
 * @property {(keyof Map['rooms'])[]} Map.room_keys
 */
