/// @ts-check
/* eslint-env browser */
import { scaleLinear } from "d3";
import { createElement, Fragment, useCallback, useRef, useState } from "react";

import { NGon } from "./NGon";
import { throttleRaf } from "../../../utils/throttle";

// Create the scale
const scale = scaleLinear()
  .domain([-100, 100]) // This is what is written on the Axis: from 0 to 100
  .range([-2000, 2000]); // This is where the axis is placed: from 100px to 800px

const defaultViewBox = () => ({
  xMin: -25,
  yMin: -25,
  width: 50,
  height: 50,
});

/**
 * @typedef {Object} SvgProps
 * @property {string} props.currentArea
 * @property {(next: string) => void} props.setCurrentArea
 *
 * @param {SvgProps & Map} props
 * @returns
 */
export function Svg(props) {
  /** @type {React.MutableRefObject<HTMLElement | undefined>} */
  const svgRef = useRef();
  const [viewBox, setViewbox] = useState(defaultViewBox());
  const clientCoordinates = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

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

  const dragSvg = useCallback(
    /** @param {import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent} event */
    function dragSvg(event) {
      if (dragging.current && svgRef.current) {
        const { height: svgHeight, width: svgWidth } =
          svgRef.current.getBoundingClientRect();
        const { x: clientX1, y: clientY1 } = clientCoordinates.current;
        clientCoordinates.current = getPointFromEvent(event);
        const { x: clientX2, y: clientY2 } = clientCoordinates.current;
        setViewbox(
          ({ xMin, yMin, width: viewBoxWidth, height: viewBoxHeight }) => {
            const dragScaleX = scaleLinear()
              .domain([0, svgWidth])
              .range([0, viewBoxWidth]);
            const dragScaleY = scaleLinear()
              .domain([0, svgHeight])
              .range([0, viewBoxHeight]);
            return {
              xMin: xMin - dragScaleX(clientX2 - clientX1),
              yMin: yMin - dragScaleY(clientY2 - clientY1),
              width: viewBoxWidth,
              height: viewBoxHeight,
            };
          }
        );
      }
    },
    []
  );
  const zoomSvg = useCallback(
    /** @param {import('react').WheelEvent} event */
    function zoomSvg(event) {
      if (svgRef.current) {
        const { x: clientX, y: clientY } = getPointFromEvent(event);
        const { height: svgHeight, width: svgWidth } =
          svgRef.current.getBoundingClientRect();

        setViewbox((previousViewbox) => {
          const {
            xMin: vMinX,
            yMin: vMinY,
            width: vWidth,
            height: vHeight,
          } = previousViewbox;
          var deltaVWidth = vWidth * Math.sign(event.deltaY) * 0.05;
          var deltaVHeight = vHeight * Math.sign(event.deltaY) * 0.05;
          var deltaXMin = (deltaVWidth * clientX) / svgWidth;
          var deltaYMin = (deltaVHeight * clientY) / svgHeight;

          return {
            xMin: vMinX - deltaXMin,
            yMin: vMinY - deltaYMin,
            width: vWidth + deltaVWidth,
            height: vHeight + deltaVHeight,
          };
        });
      }
    },
    []
  );

  const onDragStart = useCallback(
    /**
     * capture (x1, y1)
     * @param {import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent} event
     */
    function onDragStart(event) {
      clientCoordinates.current = getPointFromEvent(event);
      dragging.current = true;
    },
    []
  );
  const onDragStop = useCallback(
    /**
     * capture (x2, y2), disable dragging
     * @param {import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent} event
     */
    function onDragStop(event) {
      if (dragging.current === true) {
        dragSvg(event);
      }
      dragging.current = false;
    },
    []
  );
  /**
   * debounced update (x2, y2)
   * @param {(event: import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent) => void} event
   * @returns {void}
   */
  const onDragUpdate = useCallback(
    /** @param {import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent} event */
    (event) => {
      if (dragging.current && svgRef.current) {
        throttleRaf(() => dragSvg(event));
      }
    },
    []
  );
  const onWheel = useCallback(
    /**
     * Applies viewbox scaling for zoom effect
     * @param {import('react').WheelEvent} event
     */
    function onWheel(event) {
      throttleRaf(() => zoomSvg(event));
    },
    []
  );

  return createElement(
    Fragment,
    undefined,
    createElement(
      "button",
      {
        /** @param {import('react').MouseEvent} event */
        onClick(event) {
          event.preventDefault();
          console.clear();
          setViewbox(() => defaultViewBox());
        },
      },
      "reset"
    ),
    createElement(
      "div",
      { style: { height: "32em", width: "20em" } },
      createElement(
        "svg",
        {
          // pointer events
          onPointerDown: onDragStart,
          onPointerUp: onDragStop,
          onPointerLeave: onDragStop,
          onPointerMove: onDragUpdate,
          // mouse events
          onMouseDown: onDragStart,
          onMouseUp: onDragStop,
          onMouseLeave: onDragStop,
          onMouseMove: onDragUpdate,
          // wheel events
          onWheel,
          // touch events
          onTouchStart: onDragStart,
          onTouchEnd: onDragStop,
          onTouchMove: onDragUpdate,
          ref: svgRef,
          viewBox: `${viewBox.xMin} ${viewBox.yMin} ${viewBox.width} ${viewBox.height}`,
        },
        props?.room_keys
          ?.filter(
            (roomKey) => props.rooms?.[roomKey]?.area === props.currentArea
          )
          .map((roomKey) =>
            createElement(NGon, {
              key: props.rooms?.[roomKey]?.id,
              cx: scale(parseInt(props.rooms?.[roomKey]?.x ?? "0", 10)),
              cy: -1 * scale(parseInt(props.rooms?.[roomKey]?.y ?? "0", 10)), // in layout world, y increases going 'down' the axis
              diameter: 8,
              strokeWidth: 1,
              // title: `(${props.rooms?.[roomKey]?.x}, ${props.rooms?.[roomKey]?.y}), ${props.rooms?.[roomKey]?.title}`,
              vertices: 8,
            })
          ),
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
        )
      )
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

/**
 *
 * @param {any} event
 * @returns {event is import('react').TouchEvent}
 */
const isTouchEvent = (event) =>
  "targetTouches" in event && (event.targetTouches?.length ?? 0) > 0;

/**
 *
 * @param {import('react').MouseEvent | import('react').PointerEvent | import('react').TouchEvent} event
 * @returns {{ x: number, y: number }}
 */
const getPointFromEvent = function getPointFromEvent(event) {
  if (isTouchEvent(event)) {
    return {
      x: event.targetTouches[0]?.clientX ?? 0,
      y: event.targetTouches[1]?.clientY ?? 0,
    };
  }
  return { x: event.clientX, y: event.clientY };
};
