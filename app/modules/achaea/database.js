/// @ts-check
/* eslint-env browser */
import * as d3 from "d3";
import { xsltProcess } from "xslt-processor";
import { fetchAround } from "../../cache/fetch";
import { open, openPromise, migrate } from "../../idb";

export const DB_NAME = "achaeaDb";

/**
 * @typedef {Object} IDBIndexSchema
 * @property {string | string[]} keyPath - Index keypath
 * @property {string} name - Index name
 * @property {IDBIndexParameters} [parameters] - Index parameters
 *
 * @typedef {Object} IDBStoreSchema
 * @property {string} name - Object store name
 * @property {IDBObjectStoreParameters} parameters - Object store parameters
 * @property {IDBIndexSchema[]} indices - Object store indices
 */

export const DB_STORES = {
  /** @type {IDBStoreSchema} */
  areas: {
    indices: [
      {
        keyPath: "name",
        name: "areaName",
        parameters: { multiEntry: false, unique: false },
      },
    ],
    parameters: { autoIncrement: false, keyPath: "id" },
    name: "areas",
  },
  /** @type {IDBStoreSchema} */
  environments: {
    indices: [
      {
        keyPath: "name",
        name: "environmentName",
        parameters: { multiEntry: false, unique: true },
      },
    ],
    parameters: { autoIncrement: false, keyPath: "id" },
    name: "environments",
  },
  /** @type {IDBStoreSchema} */
  exits: {
    indices: [
      {
        keyPath: "room",
        name: "exitRoom",
        parameters: { multiEntry: false, unique: false },
      },
      {
        keyPath: "targetRoom",
        name: "exitTargetRoom",
        parameters: { multiEntry: false, unique: false },
      },
      {
        keyPath: "targetArea",
        name: "exitTargetArea",
        parameters: { multiEntry: false, unique: false },
      },
    ],
    parameters: { autoIncrement: false, keyPath: "id" },
    name: "exits",
  },
  /** @type {IDBStoreSchema} */
  rooms: {
    indices: [
      {
        keyPath: "title",
        name: "roomTitle",
        parameters: { multiEntry: false, unique: false },
      },
    ],
    parameters: { autoIncrement: false, keyPath: "id" },
    name: "rooms",
  },
};

/** @type {import('../../idb/index.js').Migrations} */
const migrations = {
  // 0: {},
  1: {
    up(openRequest) {
      console.log("migrate UP 1");
      checkForAndCreateObjectStore(openRequest, DB_STORES.areas);
      checkForAndCreateObjectStore(openRequest, DB_STORES.environments);
      checkForAndCreateObjectStore(openRequest, DB_STORES.exits);
      checkForAndCreateObjectStore(openRequest, DB_STORES.rooms);
    },
    test(openRequest) {
      return [
        openRequest.result.objectStoreNames.contains(DB_STORES.areas.name),
        openRequest.result.objectStoreNames.contains(
          DB_STORES.environments.name
        ),
        openRequest.result.objectStoreNames.contains(DB_STORES.exits.name),
        openRequest.result.objectStoreNames.contains(DB_STORES.rooms.name),
      ].every((testCase) => testCase === true);
    },
    down(openRequest) {
      console.log("migrate DOWN 1");
      checkForAndDeleteObjectStore(openRequest, DB_STORES.areas);
      checkForAndDeleteObjectStore(openRequest, DB_STORES.environments);
      checkForAndDeleteObjectStore(openRequest, DB_STORES.exits);
      checkForAndDeleteObjectStore(openRequest, DB_STORES.rooms);
    },
  },
};

function main() {
  const openRequest = open(DB_NAME);
  migrate(openRequest, migrations).catch(console.warn); // only resolves if a migration is actually run
  Promise.all([
    openPromise(openRequest),
    Promise.all([
      fetchAround(new Request("/maps/achaea/area.xsl")),
      fetchAround(new Request("/maps/achaea/71.xml")),
    ])
      .then(([xsl, xml]) => Promise.all([xsl.text(), xml.text()]))
      .then(([xslT, xmlT]) => {
        const p = new DOMParser();
        // parsing dom from string is not a considerable lift, go figure
        // const output = xsltProcess(xmlReq.responseXML, xsltReq.responseXML);
        const foo = xsltProcess(
          p.parseFromString(xmlT, "application/xml"),
          p.parseFromString(xslT, "application/xml")
        );
        console.log("foo?>", JSON.parse(foo));
        return JSON.parse(foo);
      }),
  ])
    .then(
      /** @returns {Promise<[IDBDatabase, any]>} */
      ([idb, jsonArea]) =>
        new Promise((resolve, reject) => {
          const trans1 = openRequest.result.transaction(
            ["areas", "environments", "exits", "rooms"],
            "readwrite"
          );

          trans1.onabort = () => {
            console.log("trans aborted");
            reject();
          };
          trans1.oncomplete = () => {
            console.log("trans complete");
            resolve([idb, jsonArea]);
          };
          trans1.onerror = (event) => {
            console.log("trans error", event);
            reject();
          };
          const areasObjectStore = trans1.objectStore("areas");
          const environmentsObjectStore = trans1.objectStore("environments");
          const exitsObjectStore = trans1.objectStore("exits");
          const roomsObjectStore = trans1.objectStore("rooms");

          jsonArea.area_keys.forEach(
            /** @param {string} areaKey */
            (areaKey) => {
              areasObjectStore.put(jsonArea.areas[areaKey]);
            }
          );
          jsonArea.environment_keys.forEach(
            /** @param {string} environmentKey */
            (environmentKey) => {
              const foo = environmentsObjectStore.put(
                jsonArea.environments[environmentKey]
              );
              foo.onerror = console.warn;
              // foo.onsuccess = console.log;
            }
          );
          jsonArea.exit_keys.forEach(
            /** @param {string} exitKey */
            (exitKey) => {
              exitsObjectStore.put(jsonArea.exits[exitKey]);
            }
          );
          jsonArea.room_keys.forEach(
            /** @param {string} roomKey */
            (roomKey) => {
              roomsObjectStore.put(jsonArea.rooms[roomKey]);
            }
          );

          console.log("commit", trans1);
          trans1.commit();
        })
    )
    .then(([idb, jsonArea]) => {
      console.log("hello", jsonArea);
      d3.select("#d3-mount")
        .append("select")
        .selectAll("option")
        .data(jsonArea.area_keys)
        .enter()
        .append("option")
        .attr("value", (areaKey) => areaKey)
        .text((areaKey) => jsonArea.areas[areaKey].name);

      const links = jsonArea.exit_keys
        .reduce(
          /**
           * @param {{ source: string, target: string }[]} acc
           * @param {*} exitKey
           * @returns {{ source: string, target: string }[]}
           */
          (acc, exitKey) =>
            acc.concat([
              {
                source: jsonArea.exits[exitKey].room,
                target: jsonArea.exits[exitKey].targetRoom,
              },
            ]),
          /** @typedef {{ source: string, target: string }[]} */
          []
        )
        .filter(
          /**
           * @param {{ source: string, target: string }} link
           * @returns {boolean}
           */
          ({ target }) => target in jsonArea.rooms
        );

      const svg = d3
        .select("#d3-mount")
        .append("svg")
        .attr("width", 1024)
        .attr("height", 1024);

      // Create the scale
      const x = d3
        .scaleLinear()
        .domain([-100, 100]) // This is what is written on the Axis: from 0 to 100
        .range([-512, 512]); // This is where the axis is placed: from 100px to 800px
      // Create the scale
      const y = d3
        .scaleLinear()
        .domain([-100, 100]) // This is what is written on the Axis: from 0 to 100
        .range([-512, 512]); // This is where the axis is placed: from 100px to 800px
      // Draw the axis
      // svg
      //   .append("g")
      //   .attr("transform", "translate(250,250)") // This controls the vertical position of the Axis
      //   .call(d3.axisBottom(x));
      // svg
      //   .append("g")
      //   .attr("transform", "translate(250,250)") // This controls the vertical position of the Axis
      //   .call(d3.axisLeft(y));
      const d3Nodes = svg
        .selectAll("circle")
        .data(Object.values(jsonArea.rooms))
        .enter()
        .append("circle")
        .attr("title", (room) => `(${room.x},${room.y})`)
        .attr("r", 1)
        .attr("cx", (room) => x(room?.x ?? 0) + x(100))
        .attr("cy", (room) => y(-1 * (room?.y ?? 0)) + y(100));
      const d3Links = svg
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .style("stroke", "#aaa")
        .attr("x1", ({ source }) => x(jsonArea.rooms[source]?.x ?? 0) + x(100))
        .attr(
          "y1",
          ({ source }) => y(-1 * (jsonArea.rooms[source]?.y ?? 0)) + y(100)
        )
        .attr("x2", ({ target }) => x(jsonArea.rooms[target]?.x ?? 0) + x(100))
        .attr(
          "y2",
          ({ target }) => y(-1 * (jsonArea.rooms[target]?.y ?? 0)) + y(100)
        );
      // d3.select("#d3-mount")
      //   .append("svg")
      //   .attr("width", 32)
      //   .attr("height", 32)
      //   .attr("viewBox", "-6 -6 884 884")
      //   .append("polygon")
      //   .attr(
      //     "points",
      //     "257,2.441559 617,2.441559 871.558441,257 871.558441,617 617,871.558441 257,871.558441 2.441559,617 2.441559,257"
      //   )
      //   .attr("stroke-width", 20)
      //   .attr("stroke", "black")
      //   .attr("fill", "yellow");

      // fill="white"
      // stroke="black"
      // stroke-width="4"
    })
    .catch((idbError) => {
      console.warn("IDB ERROR", idbError);
    });
}
main();

/**
 *
 * @param {IDBOpenDBRequest} openRequest
 * @param {IDBStoreSchema} schema
 */
function checkForAndCreateObjectStore(openRequest, schema) {
  if (!openRequest.result.objectStoreNames.contains(schema.name)) {
    const objectStore = openRequest.result.createObjectStore(
      schema.name,
      schema.parameters
    );
    schema.indices.forEach(({ keyPath, name, parameters }) => {
      if (!objectStore.indexNames.contains(name)) {
        objectStore.createIndex(name, keyPath, parameters);
      }
    });
  }
}

/**
 *
 * @param {IDBOpenDBRequest} openRequest
 * @param {IDBStoreSchema} schema
 */
function checkForAndDeleteObjectStore(openRequest, schema) {
  if (openRequest.result.objectStoreNames.contains(schema.name)) {
    openRequest.result.deleteObjectStore(schema.name);
  }
}
