/// @ts-check
/* eslint-env browser */

/**
 *
 * @param {string} name
 * @param {number} [version]
 * @returns {IDBOpenDBRequest}
 */
export function open(name, version) {
  const openRequest = window.indexedDB.open(name, version);
  openRequest.addEventListener("blocked", () => {
    throw new Error("Blockt");
  });
  // onversionchange
  openRequest.addEventListener("error", () => {
    console.warn("idb request error");
  });
  return openRequest;
}

/**
 *
 * @param {IDBOpenDBRequest} openRequest
 * @returns {Promise<IDBDatabase>}
 */
export function openPromise(openRequest) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      openRequest.removeEventListener("error", errorListener);
      openRequest.removeEventListener("success", successListener);
    };
    /**
     *
     * @param {Event} event
     */
    const successListener = (event) => {
      cleanup();
      resolve(openRequest.result);
    };
    /**
     *
     * @param {Event} event
     */
    const errorListener = (event) => {
      cleanup();
      reject(openRequest.error);
    };
    openRequest.addEventListener("error", errorListener);
    openRequest.addEventListener("success", successListener);
  });
}

/**
 * @callback MigrationUp
 * @param {IDBOpenDBRequest} openRequest
 * @returns {void}
 */

/**
 * @callback MigrationDown
 * @param {IDBOpenDBRequest} openRequest
 * @returns {void}
 */

/**
 * @callback MigrationTest
 * @param {IDBOpenDBRequest} openRequest
 * @returns {boolean}
 */

/**
 * @typedef {Object} Migration
 * @property {MigrationUp} up
 * @property {MigrationTest} test
 * @property {MigrationDown} down
 */

/**
 * @typedef {Record<number, Migration>} Migrations
 */

/**
 *
 * @param {IDBOpenDBRequest} openRequest
 * @param {Migrations} migrations
 * @returns {Promise<null>}
 */
export function migrate(openRequest, migrations) {
  return new Promise((resolve, reject) => {
    /**
     *
     * @param {IDBVersionChangeEvent} event
     */
    const upgradeNeededListener = (event) => {
      console.log(
        `upgradeNeededListener from v${event.oldVersion} to v${event.newVersion}`
      );
      try {
        if (!(migrations[event.oldVersion]?.test(openRequest) ?? true)) {
          throw new Error("current version failed D:");
        }
        for (
          let iterator = event.oldVersion + 1;
          iterator <=
          (event.newVersion === null ? event.oldVersion : event.newVersion);
          iterator++
        ) {
          console.log(
            `migration from v${event.oldVersion} to v${iterator}, final ${event.newVersion}`
          );
          migrations[iterator]?.up(openRequest);
          if (!(migrations[iterator]?.test(openRequest) ?? true)) {
            migrations[iterator]?.down(openRequest);
            break;
          }
        }
        resolve(null);
      } catch (migrationError) {
        reject(migrationError);
      } finally {
        openRequest.removeEventListener("upgradeneeded", upgradeNeededListener);
      }
    };
    openRequest.addEventListener("upgradeneeded", upgradeNeededListener);
  });
}
