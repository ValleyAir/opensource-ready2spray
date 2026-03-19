/**
 * Email/Password Auth Routes
 * Replaces OAuth callback with register + login endpoints
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { registerUser, loginUser } from "../auth";

export function registerAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        res.status(400).json({ error: "Email, password, and name are required" });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: "Password must be at least 6 characters" });
        return;
      }

      const user = await registerUser(email, password, name);

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
      console.error("[Auth] Registration failed:", error);
      const message = error.message === "Email already registered"
        ? "Email already registered"
        : "Registration failed";
      res.status(400).json({ error: message });
    }
  });

  // Login existing user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = await loginUser(email, password);

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, redirect: "/dashboard" });
    } catch (error: any) {
      console.error("[Auth] Login failed:", error);
      res.status(401).json({ error: "Invalid email or password" });
    }
  });
}

// Keep backward-compatible export name for index.ts
export const registerOAuthRoutes = registerAuthRoutes;
