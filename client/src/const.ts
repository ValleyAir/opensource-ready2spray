export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/ready2spray-logo.png";

// Login URL - simple local auth
export const getLoginUrl = () => "/login";
