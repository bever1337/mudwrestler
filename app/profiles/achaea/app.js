/// @ts-check
/* eslint-env browser */
import { createElement, Fragment, useEffect, useState } from "react";

import { resolveData } from "./database";
import { Svg } from "./components/svg";

export function App() {
  const [map, setMap] = useState(undefined);
  useEffect(() => {
    resolveData().then(
      /** @param {[any, Map]} param0  */
      ([idb, jsonArea]) => {
        setMap(jsonArea);
      }
    );
  }, []);
  const [currentArea, setCurrentArea] = useState("");
  console.log("ok", map);
  return createElement(
    "section",
    undefined,
    createElement(Nav, {
      ...(map ?? {}),
      currentArea,
      setCurrentArea,
    }),
    createElement(Svg, {
      ...(map ?? {}),
      currentArea,
      setCurrentArea,
    })
  );
}

/**
 *
 * @param {Object} props
 * @param {any} props.areas
 * @param {string[]} props.area_keys
 * @param {string} props.currentArea
 * @param {(next: string) => void} props.setCurrentArea
 * @returns {import("react").ReactElement}
 */
function Nav({ areas, area_keys, currentArea, setCurrentArea }) {
  return createElement(
    "nav",
    undefined,
    createElement(
      "form",
      {
        /**
         * @param {import("react").FormEvent<HTMLInputElement>} event
         */
        onSubmit(event) {
          event.preventDefault();
        },
      },
      createElement(
        "select",
        {
          /**
           * @param {import("react").ChangeEvent<HTMLInputElement>} event
           */
          onChange(event) {
            setCurrentArea(event.target?.value ?? "");
          },
          value: currentArea,
        },
        area_keys?.map((areaKey) =>
          createElement(
            "option",
            { key: areaKey, value: areaKey },
            areas[areaKey].name
          )
        )
      )
    )
  );
}

/**
 * @typedef {Object} Map
 * @property {Record<string, { id: string, name: string, x: string, y: string }>} map.areas
 * @property {keyof Map['areas'][]} map.area_keys
 * @property {Record<string, { color: string, htmlcolor: string, id: string, name: string }>} map.environments
 * @property {keyof Map['environments'][]} map.environment_keys
 * @property {Record<string, { direction: string, id: string, room: string, targetRoom: string, targetArea: string }>} map.exits
 * @property {keyof Map['exits'][]} map.exit_keys
 * @property {Record<string, { area: string, environment: string, id: string, title: string, x: string, y: string, z: string }>} map.rooms
 * @property {keyof Map['rooms'][]} map.room_keys
 */
