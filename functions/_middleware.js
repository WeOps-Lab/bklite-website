const UMAMI_URL = "https://bklite.canway.net/umami/api/send";
const WEBSITE_ID = "00046c9f-e7dd-4b6f-8dd2-ab38174792c6";

const TRACK_PATHS = ["/install.dev", "/install.run", "/uninstall.sh"];

export async function onRequest(context) {
  const response = await context.next();
  const url = new URL(context.request.url);

  const newResponse = new Response(response.body, response);
  newResponse.headers.set("X-Middleware", "true");

  if (TRACK_PATHS.includes(url.pathname)) {
    newResponse.headers.set("X-Tracked", "true");

    // 临时调试：同步等待 fetch 结果，写入响应头
    try {
      const umamiRes = await fetch(UMAMI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": context.request.headers.get("User-Agent") || "Unknown",
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
      });

      newResponse.headers.set("X-Umami-Status", umamiRes.status.toString());
      const body = await umamiRes.text();
      newResponse.headers.set("X-Umami-Response", body.substring(0, 200));
    } catch (err) {
      newResponse.headers.set("X-Umami-Error", err.message);
    }
  }

  return newResponse;
}