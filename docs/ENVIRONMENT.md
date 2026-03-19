# Environment Variables Documentation

This document outlines the environment variables used by the Ready2Spray project. These variables are used for database connectivity, authentication, payment processing, email services, and AI integrations.

## Required Variables

### Database
-   **`DATABASE_URL`**
    -   **Description**: PostgreSQL connection string used by Drizzle ORM and the server.
    -   **Required**: Yes
    -   **Example**: `postgresql://postgres:password@localhost:5432/ready2spray`
    -   **Where to get it**: Your PostgreSQL provider (e.g., Supabase, Neon, or local installation).

### Authentication
-   **`JWT_SECRET`**
    -   **Description**: Secret key used for signing and verifying JSON Web Tokens (JWT) for user sessions.
    -   **Required**: Yes
    -   **Example**: `a_very_long_random_string_at_least_32_chars`
    -   **Where to get it**: Generate a secure random string (e.g., using `openssl rand -base64 32`).

-   **`OAUTH_SERVER_URL`**
    -   **Description**: The base URL of the OAuth provider (Manus).
    -   **Required**: Yes
    -   **Example**: `https://auth.manus.run`
    -   **Where to get it**: Provided by the Manus platform.

-   **`VITE_APP_ID`** (or **`APP_ID`**)
    -   **Description**: The Application ID assigned by the OAuth provider.
    -   **Required**: Yes
    -   **Example**: `rts-prod-123`
    -   **Where to get it**: Manus Developer Dashboard.

### Stripe (Payments)
-   **`STRIPE_SECRET_KEY`**
    -   **Description**: Stripe API secret key used for server-side operations.
    -   **Required**: Yes
    -   **Example**: `sk_test_51P...` (Test) or `sk_live_51P...` (Production)
    -   **Where to get it**: [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys).

-   **`STRIPE_WEBHOOK_SECRET`**
    -   **Description**: Webhook signing secret used to verify that incoming Stripe events are authentic.
    -   **Required**: Yes (for production/webhook support)
    -   **Example**: `whsec_...`
    -   **Where to get it**: [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).

-   **`STRIPE_PUBLISHABLE_KEY`**
    -   **Description**: Stripe public key used by the frontend for checkout.
    -   **Required**: Yes
    -   **Example**: `pk_test_...`
    -   **Where to get it**: [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys).

### Email (Mailgun)
-   **`MAILGUN_API_KEY`**
    -   **Description**: API key for the Mailgun service to send transactional emails.
    -   **Required**: Yes (for production)
    -   **Example**: `928...-abc-123`
    -   **Where to get it**: [Mailgun Dashboard > Settings > API Keys](https://app.mailgun.com/app/account/settings/api_keys).

-   **`MAILGUN_DOMAIN`**
    -   **Description**: The verified domain name used for sending emails via Mailgun.
    -   **Required**: Yes (for production)
    -   **Example**: `mg.ready2spray.com`
    -   **Where to get it**: [Mailgun Dashboard > Sending > Domains](https://app.mailgun.com/app/sending/domains).

-   **`MAILGUN_FROM_EMAIL`**
    -   **Description**: The default email address that appears in the "From" field.
    -   **Required**: Optional (Defaults to `noreply@MAILGUN_DOMAIN`)
    -   **Example**: `Ready2Spray <noreply@ready2spray.com>`
    -   **Where to get it**: Your preference.

### AI (Claude)
-   **`AnthropicAPI`** (or **`ANTHROPIC_API_KEY`**)
    -   **Description**: API key for Anthropic's Claude AI models.
    -   **Required**: Yes (to enable AI assistant features)
    -   **Example**: `sk-ant-api03-...`
    -   **Where to get it**: [Anthropic Console](https://console.anthropic.com/).

## Optional Variables

### Monitoring
-   **`SENTRY_DSN`**
    -   **Description**: Sentry Data Source Name for error tracking and performance monitoring.
    -   **Required**: Optional
    -   **Example**: `https://abc@sentry.io/123`
    -   **Where to get it**: [Sentry Project Settings](https://sentry.io/).

-   **`LOG_LEVEL`**
    -   **Description**: Minimum level for log output (`debug`, `info`, `warn`, `error`).
    -   **Required**: Optional (Defaults to `info` in production, `debug` in development)
    -   **Example**: `debug`

### Server
-   **`PORT`**
    -   **Description**: The port the Express server will listen on.
    -   **Required**: Optional (Defaults to `3000`)
    -   **Example**: `8080`

-   **`NODE_ENV`**
    -   **Description**: Specifies the environment mode (`development` or `production`).
    -   **Required**: Optional (Defaults to `development`)
    -   **Example**: `production`

### Feature Flags & Others
-   **`INVITATION_CODE`**
    -   **Description**: A secret code required to sign up for new organizations if restricted.
    -   **Required**: Optional
    -   **Example**: `RTS-BETA-2025`

-   **`OWNER_OPEN_ID`**
    -   **Description**: The OpenID of the platform owner to grant super-admin privileges.
    -   **Required**: Optional

-   **`BUILT_IN_FORGE_API_KEY`** / **`BUILT_IN_FORGE_API_URL`**
    -   **Description**: Internal configuration for Autodesk Forge integrations.
    -   **Required**: Optional

### Stripe Product Configuration
These variables allow you to override the default Stripe Price and Product IDs for different tiers:
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PROFESSIONAL`
- `STRIPE_PRICE_ENTERPRISE`
- `STRIPE_PRICE_AI_CREDITS_500`
- `STRIPE_PRICE_AI_CREDITS_2500`
- `STRIPE_PRICE_AI_CREDITS_10000`
