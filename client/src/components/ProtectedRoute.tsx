import { ReactNode } from "react";
import { useLocation } from "wouter";
import { usePermissions, Permission } from "@/hooks/usePermissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { Button } from "./ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission: Permission;
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const { hasPermission } = usePermissions();
  const [, setLocation] = useLocation();
  const hasAccess = hasPermission(requiredPermission);

  // If user doesn't have permission, show access denied message
  if (!hasAccess) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="max-w-2xl">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mt-2">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </AlertDescription>
          <Button
            onClick={() => setLocation(fallbackPath)}
            variant="outline"
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
