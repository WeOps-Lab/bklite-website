const UMAMI_URL = "https://bklite.canway.net/umami/api/send";
const WEBSITE_ID = "00046c9f-e7dd-4b6f-8dd2-ab38174792c6";

const TRACK_PATHS = ["/install.dev", "/install.run", "/uninstall.sh"];

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  const newResponse = new Response(response.body, response);

  // 调试：暴露 Cloudflare 拿到的各种 IP 信息
  const cfIP = context.request.headers.get("CF-Connecting-IP") || "";
  const xff = context.request.headers.get("X-Forwarded-For") || "";
  const realIP = context.request.headers.get("X-Real-IP") || "";

  newResponse.headers.set("X-Debug-CF-IP", cfIP);
  newResponse.headers.set("X-Debug-XFF", xff);
  newResponse.headers.set("X-Debug-Real-IP", realIP);

  if (TRACK_PATHS.includes(url.pathname)) {
    newResponse.headers.set("X-Debug-Sent-XFF", cfIP);

    context.waitUntil(
      fetch(UMAMI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Compatible; BKLite Tracker/1.0)",
          "X-Forwarded-For": cfIP,
        },
        body: JSON.stringify({
          payload: {
            hostname: url.hostname,
            language: "en",
            referrer: context.request.headers.get("Referer") || "",
            screen: "0x0",
            title: url.pathname.replace("/", ""),
            url: url.pathname,
            website: WEBSITE_ID,
          },
          type: "event",
        }),
      })
    );
  }

  return newResponse;
}