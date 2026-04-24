export interface Env {
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return Response.json({
        ok: true,
        service: "dlptest",
        environment: env.ENVIRONMENT ?? "unknown",
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
