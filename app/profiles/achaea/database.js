/// @ts-check
/* eslint-env browser */
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

/**
 *
 * @returns {Promise<[IDBDatabase, any]>}
 */
export function resolveData() {
  const openRequest = open(DB_NAME);
  migrate(openRequest, migrations).catch(console.warn); // only resolves if a migration is actually run
  return Promise.all([
    openPromise(openRequest),
    fetch(new Request("/maps/achaea/map.json")).then((response) =>
      response.json()
    ),
  ]).then(
    /** @returns {Promise<[IDBDatabase, any]>} */
    ([idb, jsonArea]) =>
      new Promise((resolve, reject) => {
        resolve([idb, jsonArea]);
        // const trans1 = openRequest.result.transaction(
        //   ["areas", "environments", "exits", "rooms"],
        //   "readwrite"
        // );

        // trans1.onabort = () => {
        //   console.log("trans aborted");
        //   reject();
        // };
        // trans1.oncomplete = () => {
        //   console.log("trans complete");
        //   resolve([idb, jsonArea]);
        // };
        // trans1.onerror = (event) => {
        //   console.log("trans error", event);
        //   reject();
        // };
        // const areasObjectStore = trans1.objectStore("areas");
        // const environmentsObjectStore = trans1.objectStore("environments");
        // const exitsObjectStore = trans1.objectStore("exits");
        // const roomsObjectStore = trans1.objectStore("rooms");

        // jsonArea.area_keys.forEach(
        //   /** @param {string} areaKey */
        //   (areaKey) => {
        //     areasObjectStore.put(jsonArea.areas[areaKey]);
        //   }
        // );
        // jsonArea.environment_keys.forEach(
        //   /** @param {string} environmentKey */
        //   (environmentKey) => {
        //     const foo = environmentsObjectStore.put(
        //       jsonArea.environments[environmentKey]
        //     );
        //     foo.onerror = console.warn;
        //     // foo.onsuccess = console.log;
        //   }
        // );
        // jsonArea.exit_keys.forEach(
        //   /** @param {string} exitKey */
        //   (exitKey) => {
        //     exitsObjectStore.put(jsonArea.exits[exitKey]);
        //   }
        // );
        // jsonArea.room_keys.forEach(
        //   /** @param {string} roomKey */
        //   (roomKey) => {
        //     roomsObjectStore.put(jsonArea.rooms[roomKey]);
        //   }
        // );

        // console.log("commit", trans1);
        // trans1.commit();
      })
  );
}

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
