import type { Context } from "https://edge.netlify.com";

const CREDENTIALS = {
  username: Netlify.env.get("BASIC_AUTH_USER") || "admin",
  password: Netlify.env.get("BASIC_AUTH_PASSWORD") || "",
};

export default async function handler(
  request: Request,
  context: Context
) {
  // パスワードが未設定なら認証をスキップ
  if (!CREDENTIALS.password) {
    return context.next();
  }

  const authorization = request.headers.get("authorization");

  if (authorization) {
    const [scheme, encoded] = authorization.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
        return context.next();
      }
    }
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Site"',
    },
  });
}
