// Same-origin requests carry X-Atlas, which the server requires on every change (a page on another site can't add
// it, so it can't use your session). A 401 means the session ended: show the sign-in screen.
(() => {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const sameOrigin = url.startsWith("/") || url.startsWith(location.origin);
    if (sameOrigin) init = { ...init, headers: { ...(init.headers || {}), "X-Atlas": "1" } };
    const r = await realFetch(input, init);
    if (r.status === 401 && sameOrigin && !url.includes("/api/auth/")) window.dispatchEvent(new Event("atlas:signin"));
    return r;
  };
})();
