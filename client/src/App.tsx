import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";

// Lazy loaded components
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Jobs = React.lazy(() => import("./pages/Jobs"));
const Customers = React.lazy(() => import("./pages/Customers"));
const Personnel = React.lazy(() => import("./pages/Personnel"));
const Chat = React.lazy(() => import("./pages/Chat"));
const Maps = React.lazy(() => import("./pages/Maps"));
const ProductLookup = React.lazy(() => import("./pages/ProductLookup"));
const Settings = React.lazy(() => import("./pages/Settings"));
const SharedJob = React.lazy(() => import("./pages/SharedJob"));
const FlightBoard = React.lazy(() => import("@/pages/FlightBoard"));
const JobDetail = React.lazy(() => import("@/pages/JobDetail"));
const Calendar = React.lazy(() => import("@/pages/Calendar"));
const Equipment = React.lazy(() => import("@/pages/Equipment"));
const EquipmentDashboard = React.lazy(() => import("@/pages/EquipmentDashboard"));
const Sites = React.lazy(() => import("./pages/Sites"));
const CustomerDetail = React.lazy(() => import("./pages/CustomerDetail"));
const Products = React.lazy(() => import("./pages/Products"));
const ServicePlans = React.lazy(() => import("./pages/ServicePlans"));
const CustomerPortal = React.lazy(() => import("./pages/CustomerPortal"));
const UserManagement = React.lazy(() => import("./pages/UserManagement"));
const AuditLog = React.lazy(() => import("./pages/AuditLog"));
const BulkJobImport = React.lazy(() => import("./pages/BulkJobImport"));
const Weather = React.lazy(() => import("./pages/Weather"));
const AISettings = React.lazy(() => import("./pages/AISettings"));
const DriftCalculator = React.lazy(() => import("./pages/DriftCalculator"));
const PreFlightChecklist = React.lazy(() => import("./pages/PreFlightChecklist"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));

// Check if we're on the app subdomain
const isAppSubdomain = () => {
  const hostname = window.location.hostname;
  return hostname.startsWith('app.') || hostname.includes('app-');
};

function Router() {
  // If on app subdomain and at root, redirect to dashboard
  const shouldRedirectToDashboard = isAppSubdomain() && window.location.pathname === '/';
  
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Switch>
        {/* Redirect app subdomain root to dashboard */}
        {shouldRedirectToDashboard && <Redirect to="/dashboard" />}
        
        {/* Public marketing page - only on main domain */}
        <Route path="/">
          {() => isAppSubdomain() ? <Redirect to="/dashboard" /> : <LandingPage />}
        </Route>
        
        {/* Public shared job view - no auth required */}
        <Route path="/share/:token">
          {() => <SharedJob />}
        </Route>

        {/* Auth routes */}
        <Route path="/login">
          {() => <Login />}
        </Route>
        <Route path="/register">
          {() => <Register />}
        </Route>

      {/* Protected app routes - all wrapped in DashboardLayout */}
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/jobs/:id">
        {() => (
          <DashboardLayout>
            <JobDetail />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/jobs/:jobId/preflight">
        {() => (
          <DashboardLayout>
            <PreFlightChecklist />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/tools/preflight">
        {() => (
          <DashboardLayout>
            <PreFlightChecklist />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/weather">
        {() => (
          <DashboardLayout>
            <Weather />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/tools/drift-calculator">
        {() => (
          <DashboardLayout>
            <DriftCalculator />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/flight-board">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_flight_board">
              <FlightBoard />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/calendar">
        {() => (
          <DashboardLayout>
            <Calendar />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/equipment">
        {() => (
          <DashboardLayout>
            <Equipment />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/equipment-dashboard">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_equipment_analytics">
              <EquipmentDashboard />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
  
      <Route path="/products">
        {() => (
          <DashboardLayout>
            <Products />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/service-plans">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_service_plans">
              <ServicePlans />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/jobs">
        {() => (
          <DashboardLayout>
            <Jobs />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/customers/:id">
        {() => (
          <DashboardLayout>
            <CustomerDetail />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/customers">
        {() => (
          <DashboardLayout>
            <Customers />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/personnel">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_personnel">
              <Personnel />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/chat">
        {() => (
          <DashboardLayout>
            <Chat />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/maps">
        {() => (
          <DashboardLayout>
            <Maps />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/product-lookup">
        {() => (
          <DashboardLayout>
            <ProductLookup />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/settings">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_settings">
              <Settings />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>

      <Route path="/settings/ai">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_settings">
              <AISettings />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/customer-portal">
        {() => (
          <DashboardLayout>
            <CustomerPortal />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/user-management">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_user_management">
              <UserManagement />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/audit-log">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="view_settings">
              <AuditLog />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/bulk-import">
        {() => (
          <DashboardLayout>
            <ProtectedRoute requiredPermission="create_jobs">
              <BulkJobImport />
            </ProtectedRoute>
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
