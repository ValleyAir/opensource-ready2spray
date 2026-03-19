import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  MapPin, 
  User, 
  Wrench, 
  Calendar, 
  Briefcase,
  Download,
  AlertCircle,
  Package,
  Clock,
  Droplets,
  Sprout
} from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SharedJob() {
  const params = useParams();
  const token = params.token || "";
  
  const { data: shareData, isLoading, error } = trpc.jobShares.getByToken.useQuery({ token });
  
  const job = shareData?.job;
  const share = shareData?.share;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
              <span className="text-xl font-bold">{APP_TITLE}</span>
            </div>
            <CardTitle>Share Link Not Found</CardTitle>
            <CardDescription>
              This share link is invalid, expired, or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please contact the person who shared this link with you for assistance.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
              <span className="text-xl font-bold">{APP_TITLE}</span>
            </div>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>
              The job associated with this share link could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-sm text-gray-300">Shared Job View</p>
            </div>
          </div>
          <Badge variant="outline" className="text-white border-white/30">
            Read-Only
          </Badge>
        </div>

        {/* Job Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <CardDescription className="mt-2">
                  {job.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                View Only
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>



              {job.acres && (
                <div className="flex items-start gap-3">
                  <Sprout className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Acres</p>
                    <p className="text-sm text-muted-foreground">{job.acres}</p>
                  </div>
                </div>
              )}

              {job.applicationRate && (
                <div className="flex items-start gap-3">
                  <Droplets className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Application Rate</p>
                    <p className="text-sm text-muted-foreground">{job.applicationRate}</p>
                  </div>
                </div>
              )}
            </div>



            {/* Weather Conditions */}
            {(job.windSpeedMph || job.temperatureF) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Weather Conditions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {job.windSpeedMph && (
                      <div>
                        <p className="text-sm font-medium">Wind Speed</p>
                        <p className="text-sm text-muted-foreground">{job.windSpeedMph} mph</p>
                      </div>
                    )}
                    {job.temperatureF && (
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p className="text-sm text-muted-foreground">{job.temperatureF}°F</p>
                      </div>
                    )}

                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {job.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {job.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Files Section - Coming Soon */}
        {share?.allowDownloads && (
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                File downloads will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                No files available for this job
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Powered by {APP_TITLE}</p>
          <p className="mt-1">
            This is a read-only view. Contact the job owner for edit access.
          </p>
        </div>
      </div>
    </div>
  );
}
