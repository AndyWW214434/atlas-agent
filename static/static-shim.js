// Static demo shim: lets the read-only demo run from plain files (no server).
// JSON API reads come from exported .json files, raw files are served at their normal /api/... paths,
// the live event stream is replaced by one recorded snapshot, and every write is refused.
(function () {
  window.ATLAS_STATIC = true;
  const realFetch = window.fetch.bind(window);
  const DEMO_MSG = "This is a read-only demo: watch the example tasks in the sidebar. Running new tasks and changing settings are turned off.";
  const RAW = /^\/api\/(tasks\/[\w-]+\/(files|shots)\/.+|library\/[\w-]+)$/;

  function jsonPath(path) {
    return path.replace(/\/$/, "") + ".json";
  }

  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input.url;
    const method = ((init && init.method) || "GET").toUpperCase();
    const u = new URL(url, location.origin);
    if (u.origin !== location.origin || !u.pathname.startsWith("/api/")) return realFetch(input, init);
    if (method !== "GET" && method !== "HEAD") {
      return Promise.resolve(new Response(JSON.stringify({ detail: DEMO_MSG }), { status: 403, headers: { "Content-Type": "application/json" } }));
    }
    if (RAW.test(u.pathname)) return realFetch(u.pathname, init);
    return realFetch(jsonPath(u.pathname), init).then((r) => (r.ok ? r : new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } })));
  };

  // /api/tasks/<id>/stream -> one snapshot message from /api/tasks/<id>/snapshot.json
  window.EventSource = class StaticEventSource {
    constructor(url) {
      this.readyState = 0;
      this.onmessage = null;
      this.onerror = null;
      const m = new URL(url, location.origin).pathname.match(/^\/api\/tasks\/([\w-]+)\/stream$/);
      if (!m) return;
      realFetch(`/api/tasks/${m[1]}/snapshot.json`).then((r) => r.text()).then((text) => {
        this.readyState = 1;
        if (this.onmessage) this.onmessage({ data: text });
      });
    }
    close() { this.readyState = 2; }
  };
})();
