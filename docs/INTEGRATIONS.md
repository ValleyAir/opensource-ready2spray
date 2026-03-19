# Integration Setup Guide

Ready2Spray supports optional integrations to enhance your workflow. All integrations are configured through **Settings > Integrations** in the app.

## Google Maps

Google Maps enables satellite map views, site boundary editing, geocoding (address lookup), and route planning.

### Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Library**
4. Enable these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Directions API
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. (Recommended) Restrict the key to the APIs above and your domain

### Configuration

**Option A** - Through the app:
1. Go to **Settings > Integrations > Google Maps**
2. Paste your API key
3. Click Save

**Option B** - Through environment:
Add to your `.env` file:
```
GOOGLE_MAPS_API_KEY=your-key-here
```
Then restart: `docker compose restart app`

### What It Enables
- Satellite and terrain map views
- Address autocomplete when creating sites
- GPS coordinate geocoding
- Route planning between job sites
- Boundary polygon editing on maps

---

## FieldPulse

FieldPulse is a field service management platform. This integration syncs customers and jobs between Ready2Spray and FieldPulse.

### Getting Your API Key

1. Log in to your [FieldPulse](https://www.fieldpulse.com/) account
2. Go to **Settings > API & Integrations**
3. Generate or copy your API key

### Configuration

1. Go to **Settings > Integrations > FieldPulse**
2. Enter your API key
3. Choose what to sync:
   - **Customers** - Two-way sync of customer records
   - **Jobs** - Two-way sync of job/work orders
4. Set sync interval (15, 30, or 60 minutes)
5. Click Save

### Synced Fields

| Ready2Spray | FieldPulse |
|------------|------------|
| Customer name | Customer name |
| Email | Email |
| Phone | Phone |
| Address | Service address |
| Job title | Work order title |
| Job status | Work order status |
| Scheduled date | Scheduled date |

### Troubleshooting

- **Connection failed**: Verify your API key is correct and active
- **Missing data**: Check that sync is enabled for the entity type
- **Duplicates**: The sync uses email (customers) and title+date (jobs) to match records

---

## Zoho CRM

Zoho CRM integration syncs your customer and job data with Zoho's CRM platform.

### Setting Up OAuth

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click **Add Client > Server-based Application**
3. Fill in:
   - **Client Name**: Ready2Spray
   - **Homepage URL**: `http://localhost:3000` (or your domain)
   - **Redirect URI**: `http://localhost:3000/api/integrations/zoho/callback`
4. Copy the **Client ID** and **Client Secret**

### Configuration

1. Go to **Settings > Integrations > Zoho CRM**
2. Enter your Client ID and Client Secret
3. Select your **Data Center**:
   - US (United States) - `zoho.com`
   - EU (Europe) - `zoho.eu`
   - IN (India) - `zoho.in`
   - AU (Australia) - `zoho.com.au`
   - CN (China) - `zoho.com.cn`
   - JP (Japan) - `zoho.jp`
4. Choose what to sync (Customers, Jobs)
5. Set sync interval
6. Click Save

### Required Scopes

The integration uses these Zoho API scopes:
- `ZohoCRM.modules.ALL` - Read/write access to CRM modules
- `ZohoCRM.settings.ALL` - Access to CRM settings

### Synced Fields

| Ready2Spray | Zoho CRM |
|------------|----------|
| Customer name | Contact/Account name |
| Email | Email |
| Phone | Phone |
| Company | Account name |
| Address | Mailing address |
| Job title | Deal name |
| Job status | Stage |

### Troubleshooting

- **Authorization failed**: Re-check Client ID/Secret and data center
- **Token expired**: The app auto-refreshes tokens, but if issues persist, disconnect and reconnect
- **Rate limits**: Zoho has API rate limits; increase sync interval if hitting limits

---

## General Notes

- All integration credentials are stored encrypted in your local database
- Integrations are optional — Ready2Spray works fully without any of them
- Sync runs on the configured interval; you can also trigger manual syncs from the Integrations page
- Check **Settings > Audit Log** to see sync activity
