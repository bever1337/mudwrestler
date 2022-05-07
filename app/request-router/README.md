```javascript
import { Router } from "request-router";
import { handleExpression } from "request-router/extras";

const router = new Router();
router.handle(
  new Request("http://example.com/baz"),
  new Response(null, { statusText: "params" })
);
router.handlers.push(
  handleExpression(
    "/foo/:barId",
    new Request("http://example.com"),
    (request, { params }) => {
      return new Response(`Found your record! ${params.barId}`, {
        statusText: "/foo",
      });
    }
  )
);
// wildcard handler
router.handle(undefined, new Request("Not found", { status: 404 }));

const handlersInProgress = router.match(new Request("http://example.com/foo"));
// wildcard match
const handlersInProgress = router.match();
```
