/// @ts-check
/* eslint-env browser */
import * as d from "d3";
import { xsltProcess } from "xslt-processor";
import { open, send, sendAround, sendThrough } from "./xhr";

d.select("#d3-mount").html("hello, world");

function main() {
  const xsltReq = new XMLHttpRequest();
  const xmlReq = new XMLHttpRequest();
  const perfs = [performance.now()];
  Promise.all([
    send(xsltReq, open(xsltReq, "GET", "/maps/achaea/area.xsl")),
    send(xmlReq, open(xmlReq, "GET", "/maps/achaea/map.xml")),
  ]).then(() => {
    perfs.push(performance.now());
    const p = new DOMParser();
    const output = xsltProcess(xmlReq.responseXML, xsltReq.responseXML);
    perfs.push(performance.now());
    console.log("fetched in", (perfs[1] ?? 0) - (perfs[0] ?? 0));
    console.log("xsl in", (perfs[2] ?? 0) - (perfs[1] ?? 0));
  });

  // .then((resolved) => {
  //   console.log("DONE", resolved);
  //   console.log(
  //     "but also on xhr",
  //     oReq.response,
  //     "and then",
  //     oReq.responseXML
  //   );
  //   return resolved.text();
  //   // var xsltProcessor = new XSLTProcessor();
  //   // if (oReq.responseXML !== null) {
  //   //   xsltProcessor.importStylesheet(oReq.responseXML);
  //   // }
  // })
  // .then((txt) => {
  //   console.log("wow txt", txt);
  // })
  // .catch((err) => {
  //   console.warn("CAUGHT", err);
  // });
  // let xhrDoc = new Promise((resolve, reject) => {
  //   var oReq = new XMLHttpRequest();
  //   oReq.addEventListener("load", function reqListener() {
  //     resolve(this.responseXML);
  //   });
  //   oReq.addEventListener("loadend", function reqListener() {
  //     reject();
  //   });
  //   let request = open(oReq, "GET", "/maps/map.xml");
  //   // abort, error, load, loadend, timeout
  //   request = send(oReq, request);
  // });
}
main();

// import { xml as d_xml } from "d3-fetch";
// import { xsRoot } from "./idb/ingest";
// import { migrate, open, openPromise } from "./idb";
// import { xml2json } from "./xml2Json";
// xhr cache on main thread
// /** @type {import('./idb/index.js').Migrations} */
// const migrations = {
// 0: {
//   up() {
//     //
//   },
//   upTest() {
//     console.log("migrate TEST 0");
//     return true;
//   },
//   down() {
//     //
//   },
//   downTest() {
//     console.log("migrate TEST 0");
//     return true;
//   },
// },
//   1: {
//     up(openRequest) {
//       console.log("migrate UP 1");
//       if (!openRequest.result.objectStoreNames.contains("schema")) {
//         const objectStore = openRequest.result.createObjectStore("schema", {
//           keyPath: "name",
//         });
//       }
//     },
//     upTest(openRequest) {
//       console.log("migrate TEST 1");
//       return openRequest.result.objectStoreNames.contains("schema");
//     },
//     down(openRequest) {
//       console.log("migrate DOWN 1");
//       if (openRequest.result.objectStoreNames.contains("schema")) {
//         openRequest.result.deleteObjectStore("schema");
//       }
//     },
//     downTest(openRequest) {
//       console.log("migrate TEST 0");
//       return !openRequest.result.objectStoreNames.contains("schema");
//     },
//   },
// };

// function main() {
//   const openRequest = open("foo", 42);
//   migrate(openRequest, migrations);
//   openPromise(openRequest)
//     .then((idb) => {
//       console.log("success!");
//       console.log("stores: ", idb.objectStoreNames);
//     })
//     .catch((idbError) => {
//       console.warn("IDB ERROR", idbError);
//     });
//   const t = [performance.now()];
//   Promise.all([
//     // fetch("/schema/achaea.xsd", {
//     //   headers: { ["Content-Type"]: "application/xml" },
//     // }),
//     // fetch("/maps/42.xml", {
//     //   headers: { ["Content-Type"]: "application/xml" },
//     // }),
//     new Promise((resolve, reject) => {
//       reject();
//     }),
//   ])
//     .then(
//       /**
//        *
//        * @param {[Response]} param0
//        * @returns {Promise<[string]>}
//        */
//       ([
//         // xsdResponse,
//         xmlResponse,
//       ]) =>
//         Promise.all([
//           // xsdResponse.text(),
//           xmlResponse.text(),
//         ])
//     )
//     .then(
//       /**
//        *
//        * @param {[string]} param0
//        * @returns {Promise<[XMLDocument]>}
//        */
//       ([
//         // xsdText,
//         xmlText,
//       ]) => {
//         t.push(performance.now());
//         console.log(
//           "received text responses",
//           (t?.[t.length - 1] ?? 0) - (t?.[t.length - 2] ?? 0)
//         );
//         const parser = new DOMParser();
//         return Promise.resolve([
//           // parser.parseFromString(xsdText, "application/xml"),
//           parser.parseFromString(xmlText, "application/xml"),
//         ]);
//       }
//     )
//     .then(
//       /**
//        *
//        * @param {[XMLDocument]} param0
//        */
//       ([
//         // xsdDocument,
//         xmlDocument,
//       ]) => {
//         // const banana = xsRoot(xsdDocument, xmlDocument);
//         t.push(performance.now());
//         console.log(
//           "made xml documents",
//           (t[t.length - 1] ?? 0) - (t[t.length - 2] ?? 0)
//         );
//         const jsonString = xml2json(xmlDocument, "");
//         t.push(performance.now());
//         console.log(
//           "made json string",
//           (t[t.length - 1] ?? 0) - (t[t.length - 2] ?? 0)
//         );
//         const jsoned = JSON.parse(jsonString);
//         console.log(
//           "made json ",
//           (t[t.length - 1] ?? 0) - (t[t.length - 2] ?? 0)
//         );
//         console.log("complete", (t[t.length - 1] ?? 0) - (t[0] ?? 0));
//         normalizeAreaMap(jsoned);
//       }
//     )
//     .catch(console.error);
// }
// xhrVsXml();

// /**
//  * @typedef Environment
//  * @property {number} color
//  * @property {string} htmlcolor
//  * @property {number} id
//  * @property {string} name
//  */

// /** @type {any} */
// const mono = {
//   areas: {},
//   area_ids: [],
//   environments: {},
//   environment_ids: [],
//   rooms: {},
//   room_ids: [],
// };

// /**
//  * @param {any} areaJson
//  */
// function normalizeAreaMap(areaJson) {
//   console.log("process", areaJson);
//   const {
//     map: {
//       environments: { environment },
//       rooms: { room },
//     },
//   } = areaJson;
//   mono.areas[room[0]["@area"]] = {
//     name: areaJson.map["@name"],
//     x: areaJson.map["@x"],
//     y: areaJson.map["@y"],
//   };
//   mono.area_ids.push(room[0]["@area"]);
//   environment.forEach(
//     /**
//      * @param {{ [Property in keyof Environment as `@${Property}`]: Environment[keyof Environment] }} environment
//      * @returns
//      */
//     ({
//       ["@id"]: id,
//       ["@name"]: name,
//       ["@color"]: color,
//       ["@htmlcolor"]: htmlcolor,
//     }) => {
//       mono.environments[id] = { color, htmlcolor, id, name };
//       mono.environment_ids.push(id);
//     }
//   );
//   console.log("mono", mono);
// }

// const workie = new SharedWorker("map-worker.js", { type: "module" });
// workie.port.start();
// /**
//  *
//  * @param {any} e
//  */
// workie.port.onmessage = (e) => {
//   console.log('app received from workie ', e.data);
// }
// /**
//  *
//  * @param {any} e
//  */
// workie.onerror = (e) => {
//   console.log('app received error workie ', e.data);
// };
// workie.port.postMessage("howdy");

// navigator.serviceWorker
//   .register("map-worker.js", { scope: "./" })
//   .then((registration) => {
//     console.log("registered", registration);
//     const worker =
//       registration.installing ?? registration.waiting ?? registration.active;
//     if (worker) {
//       fetch("/maps/map.xml").then(console.log).catch(console.warn);
//       fetch('/maps/map.xml?xpath=//exit[@target="259"]')
//         .then(console.log)
//         .catch(console.warn);
//       worker.addEventListener("statechange", (e) => {
//         console.log("state changed", e.target);
//       });
//     }
//   })
//   .catch(console.error);

// d_xml("https://www.achaea.com/maps/map.xml").then(function (xml_document) {
//   // d.select("#d3-mount").data(xml_document)
// console.log('evaled', xml_document.evaluate(
//   'count(//areas//area)',
//   xml_document,
//   xml_document.createNSResolver(
//     xml_document.documentElement
//   ),
//   XPathResult.ANY_TYPE,
//   null
// ));
// });

// https://www.achaea.com/maps/map.xml
