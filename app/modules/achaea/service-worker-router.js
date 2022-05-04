/// @ts-check
/* eslint-env worker */
import { Router } from "itty-router";

import { fetchThrough } from "../../cache/fetch";

/** @type {Router<Request, { get: import("itty-router").Route }>} */
const achaeaRouter = Router();

achaeaRouter.get("/maps/:mapId.xml", (request) => fetchThrough(request));

export { achaeaRouter };
