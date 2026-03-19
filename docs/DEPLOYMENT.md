# Deployment Guide

This guide covers the deployment process for Ready2Spray, including local development setup, Docker deployment, and production checklist.

## 1. Prerequisites

Before starting, ensure you have the following installed:

*   **Node.js**: Version 20.x or higher
*   **pnpm**: Version 10.x or higher (Enable via `corepack enable`)
*   **PostgreSQL**: A running PostgreSQL instance (local or hosted)
*   **Docker & Docker Compose**: For containerized deployment

## 2. Local Development Setup

Follow these steps to set up the project locally:

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd ready2spray
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Configure environment**:
    Create a `.env` file in the root directory based on `docs/ENVIRONMENT.md`.
    ```bash
    # Example .env
    DATABASE_URL="postgresql://user:password@localhost:5432/ready2spray"
    JWT_SECRET="dev-secret-key-change-in-prod"
    # Add other required variables...
    ```

4.  **Setup Database**:
    Push the schema to your local database.
    ```bash
    pnpm db:push
    ```

5.  **Start Development Server**:
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5000` (or the port specified).

## 3. Docker Deployment

The project includes a multi-stage `Dockerfile` and `docker-compose.yml` for easy deployment.

### Using Docker Compose

1.  **Environment Variables**:
    Ensure your `.env` file is populated with production values. Docker Compose automatically reads from this file.

2.  **Build and Run**:
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify**:
    The container should be running on port 3000 (mapped to host port 3000 by default).
    Check logs: `docker-compose logs -f app`

### Manual Docker Build

If you prefer to build the image manually:

```bash
# Build
docker build -t ready2spray .

# Run
docker run -p 3000:3000 --env-file .env ready2spray
```

## 4. Production Deployment Checklist

Before going live, verify the following:

### Environment Variables
Refer to `docs/ENVIRONMENT.md` for the complete list. Ensure **all** required variables are set in your production environment (e.g., AWS Secrets Manager, Heroku Config Vars, .env file).

**Critical variables:**
*   `NODE_ENV=production`
*   `DATABASE_URL` (Use the production connection string)
*   `JWT_SECRET` (Use a strong, unique secret)
*   `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` (Live keys)
*   `MAILGUN_API_KEY` & `MAILGUN_DOMAIN`
*   `ANTHROPIC_API_KEY`

### Database Migrations
Run migrations against the production database *before* deploying new code or as part of your CD pipeline.
```bash
pnpm db:push
```
*Note: In a containerized environment, you might run this from a temporary container or an init script.*

### Stripe Webhook Setup
1.  Go to the [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2.  Add an endpoint: `https://your-domain.com/api/stripe/webhook`.
3.  Select events to listen for (e.g., `checkout.session.completed`, `customer.subscription.*`).
4.  Copy the **Signing Secret** (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`.

### Health Check
Verify the application is healthy after deployment:
```bash
curl -f https://your-domain.com/api/health
```
This endpoint checks server status and database connectivity.

## 5. Common Issues & Troubleshooting

*   **Database Connection Failed**:
    *   Check `DATABASE_URL` format.
    *   Ensure the database allows connections from the application's IP/network.
    *   Verify SSL requirements (may need `?sslmode=require` in connection string).

*   **Native Module Errors (bcrypt)**:
    *   The Dockerfile installs `python3`, `make`, and `g++` to build native modules. If you see errors locally, ensure you have build tools installed.
    *   `pnpm rebuild` can help fix architecture mismatches.

*   **Stripe Webhook Errors**:
    *   Ensure `express.raw({ type: "application/json" })` middleware is correctly applied for the webhook route (this is handled in `server/_core/index.ts`).
    *   Verify the `STRIPE_WEBHOOK_SECRET` matches the one in the Stripe Dashboard.

## 6. Monitoring

*   **Health Endpoint**: `/api/health` returns `200 OK` if the server is up.
*   **Logging**: The application logs to stdout/stderr. In production, configure a log driver (e.g., AWS CloudWatch, Datadog) to capture these logs.
*   **Sentry**: Set `SENTRY_DSN` to enable error tracking.

