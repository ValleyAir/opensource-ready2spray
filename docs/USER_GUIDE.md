# Ready2Spray AI - User Guide

Welcome to **Ready2Spray AI**, the all-in-one platform for managing agricultural spray operations. This guide helps you navigate the platform, plan spray jobs, and optimize your workflow using AI-powered insights.

## 1. Getting Started

### Creating an Account
Ready2Spray is currently in beta. To sign up:
1.  Navigate to the login/signup page.
2.  Select "Sign Up".
3.  Enter your email, password, and the **Invitation Code** provided by your administrator (e.g., `RTS-BETA-2025`).
4.  Follow the prompts to verify your account.

### Operation Modes
During onboarding or in your organization settings, you can select your primary operation mode:
*   **Ag Aerial**: For aerial application, aerial seeding, and broad-acre operations.
*   **Residential Pest**: For urban/suburban pest control services.
*   **Both**: If your organization handles both agricultural and residential contracts.

### Organization Setup
Once logged in:
1.  Go to **Settings > Organization**.
2.  Enter your **Organization Name** (e.g., "Valley Ag Services").
3.  Add your address and contact details.
4.  (Optional) Invite team members via the **Team** tab.

## 2. Dashboard Overview

The Dashboard is your command center. Here's what you'll see:

### Key Metrics
*   **Total Jobs**: The number of active spray jobs in your queue.
*   **Customers**: Total registered clients.
*   **Personnel**: Number of active pilots, drivers, and ground crew.
*   **Products**: Count of EPA-registered chemicals in your inventory.

### Job Status Overview
Three colored cards give you a quick status check:
*   **Pending (Yellow)**: Jobs scheduled but not started.
*   **In Progress (Blue)**: Jobs currently being executed.
*   **Completed (Green)**: Jobs finished successfully.

### Recent Activity
A list of the 5 most recent jobs, showing the title, job type (e.g., Aerial Application, Fertilization), and current status.

### Quick Actions
Use the buttons at the top right to quickly:
*   **+ New Job**: Create a spray order.
*   **+ Customer**: Add a new client.
*   **+ Personnel**: Add a team member.
*   **+ Product**: Look up a chemical.

## 3. Weather Features

Accurate weather data is critical for safe and compliant spraying. Access this via the **Weather** tab.

### Viewing Conditions
1.  **Enter Location**: Input Latitude and Longitude manually.
2.  **Use Current Location**: Click the "Use Current Location" button (requires browser permission) to auto-fill coordinates.
3.  **Get Weather**: Click to load data.

### Weather Factors
The app analyzes:
*   **Wind Speed**: Affects drift. Ideal is 3-10 mph.
*   **Temperature**: Affects volatility. Ideal is 50-85°F.
*   **Humidity**: Affects evaporation. Ideal is 40-70%.
*   **Precipitation**: Rain can wash away product.

## 4. Spray Planning

Ready2Spray uses an algorithm based on agricultural best practices to assess safety.

### Spray Window Assessment
When you check the weather, you'll see a **Spray Score** (0-100) and a recommendation:

*   **🟢 IDEAL (Score 80-100)**
    *   **Conditions**: Perfect wind (3-7 mph), moderate temps (60-75°F), good humidity.
    *   **Action**: Go for it! Optimal efficiency and safety.

*   **🟡 ACCEPTABLE (Score 60-79)**
    *   **Conditions**: Slightly suboptimal (e.g., wind ~8-10 mph, temps slightly high/low).
    *   **Action**: Proceed with caution. Double-check sensitive crops nearby.

*   **🟠 MARGINAL (Score 40-59)**
    *   **Conditions**: Risk factors present (e.g., low humidity, borderline wind).
    *   **Action**: Avoid if possible. Use drift reduction agents or wait for better conditions.

*   **🔴 UNSAFE (Score < 40)**
    *   **Conditions**: High winds (>10 mph), calm air (<3 mph - inversion risk), rain, or extreme heat.
    *   **Action**: **DO NOT SPRAY.** Violates safety standards.

## 5. Account Management

### Subscription Plans
Manage your plan in **Settings > Billing**.
*   **Starter ($29/mo)**: 1,000 AI credits. Good for small operators.
*   **Professional ($79/mo)**: 5,000 AI credits + API access. Best for growing businesses.
*   **Enterprise ($199/mo)**: 20,000 AI credits + White labeling. For large fleets.

### AI Credits
Credits are used when you ask the AI assistant questions or process complex data.
*   **Usage**: ~10 credits per conversation.
*   **Add-ons**: Purchase one-time credit packs (500, 2,500, or 10,000) if you run low.

### Managing Your Organization
*   **Users**: Invite pilots and crew. Assign roles (Admin, Manager, Technician).
*   **Integrations**: Connect with Stripe or other external tools.

## 6. Troubleshooting

### Common Issues
*   **"Location not supported"**: Ensure your browser has permission to access your location.
*   **"Coordinates out of range"**: Check that Latitude is between -90 and 90, and Longitude is between -180 and 180.
*   **"Invitation Code Invalid"**: Contact support or your admin to get the correct code.

### Support
If you encounter bugs or need assistance:
1.  Check the **Help** section in the app.
2.  Email support at `support@ready2spray.com` (or your dedicated account manager for Enterprise plans).
