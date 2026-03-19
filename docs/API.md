# Ready2Spray API Documentation

This documentation covers the internal tRPC API and the external Webhook REST API for the Ready2Spray platform.

## 1. Authentication

The API uses JWT-based authentication stored in `httpOnly` cookies.

### Login Flow (OAuth)
1.  **Initiation**: The user is redirected to the OAuth provider (Manus).
2.  **Callback**: The provider redirects back to `/api/oauth/callback` with `code` and `state` parameters.
3.  **Token Exchange**: The server exchanges the code for an access token and retrieves user info.
4.  **Session Creation**: A session token is generated and stored in a strict `httpOnly` cookie named `session`.
5.  **Redirect**: The user is redirected to `/dashboard` (or a meta-refresh for mobile compatibility).

### Auth Endpoints (tRPC)
-   **`auth.me`** (Query)
    -   **Description**: Returns the currently authenticated user's context.
    -   **Response**: `User` object or `null` if not authenticated.
-   **`auth.logout`** (Mutation)
    -   **Description**: Clears the session cookie.
    -   **Response**: `{ success: true }`.

## 2. Jobs API

**Router**: `jobs` (legacy) & `jobsV2` (new)

### Endpoints (tRPC)
-   **`jobs.list`** (Query)
    -   **Description**: Get all jobs for the authenticated user's organization.
-   **`jobs.create`** (Mutation)
    -   **Input**:
        ```typescript
        {
          title: string;
          description?: string;
          jobType: "crop_dusting" | "pest_control" | "fertilization" | "herbicide";
          statusId?: number;
          priority?: "low" | "medium" | "high" | "urgent"; // default: "medium"
          locationAddress?: string;
          locationLat?: string;
          locationLng?: string;
          customerId?: number;
          siteId?: number;
          assignedPersonnelId?: number;
          equipmentId?: number;
          scheduledStart?: string;
          scheduledEnd?: string;
          notes?: string;
        }
        ```
-   **`jobs.update`** (Mutation)
    -   **Input**: `{ id: number, ...optional fields }`
-   **`jobs.delete`** (Mutation)
    -   **Input**: `{ id: number }`

> **Note**: `jobs.getById` is not available in the `jobs` router. Use `jobsV2.getById` (Input: `{ id: number }`) for fetching single job details including products.

## 3. Customers API

**Router**: `customers`

### Endpoints (tRPC)
-   **`customers.list`** (Query)
    -   **Description**: Get all customers for the organization.
-   **`customers.create`** (Mutation)
    -   **Input**:
        ```typescript
        {
          name: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          state?: string;
          zipCode?: string;
          notes?: string;
        }
        ```
-   **`customers.update`** (Mutation)
    -   **Input**: `{ id: number, ...optional fields }`
-   **`customers.delete`** (Mutation)
    -   **Input**: `{ id: number }`

> **Note**: `customers.getById` is not explicitly exposed in the tRPC router, but `update` operations return the updated customer. For external access, use the Webhook API.

## 4. Personnel API

**Router**: `personnel`

### Endpoints (tRPC)
-   **`personnel.list`** (Query)
    -   **Description**: Get all personnel.
-   **`personnel.create`** (Mutation)
    -   **Input**:
        ```typescript
        {
          name: string;
          role: "pilot" | "ground_crew" | "manager" | "technician";
          email?: string;
          phone?: string;
          status?: "active" | "inactive" | "on_leave"; // default: "active"
          pilotLicense?: string;
          applicatorLicense?: string;
          notes?: string;
        }
        ```
-   **`personnel.update`** (Mutation)
    -   **Input**: `{ id: number, ...optional fields }`
-   **`personnel.delete`** (Mutation)
    -   **Input**: `{ id: number }`

## 5. Equipment API

**Router**: `equipment`

### Endpoints (tRPC)
-   **`equipment.list`** (Query)
-   **`equipment.getById`** (Query)
    -   **Input**: `{ id: number }`
-   **`equipment.create`** (Mutation)
    -   **Input**:
        ```typescript
        {
          name: string;
          equipmentType: "plane" | "helicopter" | "ground_rig" | "truck" | "backpack" | "hand_sprayer" | "ulv" | "other";
          tailNumber?: string;
          licensePlate?: string;
          status?: "active" | "maintenance" | "inactive";
          // ...other fields per schema
        }
        ```
-   **`equipment.update`** (Mutation)
-   **`equipment.delete`** (Mutation)

## 6. Sites API

**Router**: `sites`

### Endpoints (tRPC)
-   **`sites.list`** (Query)
-   **`sites.getById`** (Query)
    -   **Input**: `{ id: number }`
-   **`sites.create`** (Mutation)
    -   **Input**:
        ```typescript
        {
          name: string;
          siteType: "field" | "orchard" | "vineyard" | "pivot" | "property" | "commercial_building";
          address?: string;
          customerId?: number;
          acres?: number; // numeric string or number depending on implementation
          polygon?: any; // GeoJSON
          // ...other fields
        }
        ```
-   **`sites.update`** (Mutation)
-   **`sites.delete`** (Mutation)

## 7. Products API

**Router**: `products`

### Endpoints (tRPC)
-   **`products.list`** (Query)
-   **`products.getById`** (Query)
    -   **Input**: `{ id: number }`
-   **`products.create`** (Mutation)
    -   **Input**: `{ productName, epaNumber, registrant, activeIngredients, ... }`
-   **`products.search`** (Query)
    -   **Input**: `{ searchTerm: string }`
-   **`products.extractFromScreenshot`** (Mutation)
    -   **Input**: `{ imageData: string }` (Base64 encoded image)
    -   **Description**: Uses AI (Vision) to extract product details from a label screenshot.

## 8. Webhook / External API

REST-style endpoints for external integrations.

**Authentication**:
-   **Header**: `Authorization: Bearer <API_KEY>`
-   API Keys are managed via the dashboard.

**Base URL**: `/api/webhook`

### Jobs Webhook
-   **Path**: `/api/webhook/jobs/:action`
-   **Actions**:
    -   `list` (GET/POST): List all jobs.
    -   `get` (GET/POST): Get job by `id` (query param or body).
    -   `create` (POST): Create a job.
    -   `update` (POST): Update a job (requires `id`).

### Customers Webhook
-   **Path**: `/api/webhook/customers/:action`
-   **Actions**: `list`, `get`, `create`, `update`.

### Personnel Webhook
-   **Path**: `/api/webhook/personnel/:action`
-   **Actions**: `list`, `get`, `create`, `update`.

### Equipment Webhook
-   **Path**: `/api/webhook/equipment/:action`
-   **Actions**: `list`, `get`, `create`, `update`.

### Sites Webhook
-   **Path**: `/api/webhook/sites/:action`
-   **Actions**: `list`, `get`, `create`, `update`.

### Example Usage (cURL)
```bash
curl -X POST https://api.ready2spray.com/api/webhook/jobs/create \
  -H "Authorization: Bearer rts_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Aerial Spray Job",
    "jobType": "crop_dusting",
    "priority": "high",
    "locationAddress": "123 Farm Lane"
  }'
```