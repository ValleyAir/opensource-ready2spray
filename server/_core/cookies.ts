import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function isMobileBrowser(req: Request): boolean {
  const userAgent = req.headers["user-agent"] || "";
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isSecure = isSecureRequest(req);
  const isMobile = isMobileBrowser(req);
  const isLocalhost = LOCAL_HOSTS.has(hostname);

  // For localhost/development, use "lax" to ensure cookies work over HTTP
  // For mobile browsers, use "lax" due to strict cookie policies
  // For production (HTTPS), use "none" for cross-origin support
  let sameSite: "lax" | "none" | "strict" = "lax";
  if (!isLocalhost && !isMobile && isSecure) {
    sameSite = "none";
  }

  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1";

  const domain =
    shouldSetDomain && !hostname.startsWith(".")
      ? `.${hostname}`
      : shouldSetDomain
        ? hostname
        : undefined;

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite,
    secure: isSecure,
  };
}
