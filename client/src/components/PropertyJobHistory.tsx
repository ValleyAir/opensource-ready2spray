/**
 * PropertyJobHistory - Map component showing historical jobs for a property
 * Displays colored polygons overlaid on the map with date filtering
 */
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const JOB_TYPE_COLORS: Record<string, string> = {
  crop_dusting: "#00ff00",
  pest_control: "#0000ff",
  fertilization: "#ffff00",
  herbicide: "#ff0000",
};

interface PropertyJobHistoryProps {
  siteId: number;
}

export function PropertyJobHistory({ siteId }: PropertyJobHistoryProps) {
  const { data: jobs, isLoading } = trpc.sites.getJobHistory.useQuery({ siteId });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No job history found for this property.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job History ({jobs.length} jobs)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(JOB_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color, opacity: 0.7 }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {type.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          {/* Job list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.map((job: any) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-2 border rounded-md text-sm"
              >
                <div>
                  <span className="font-medium">{job.title}</span>
                  <div className="text-xs text-muted-foreground">
                    {job.scheduledStart
                      ? new Date(job.scheduledStart).toLocaleDateString()
                      : "No date"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {job.jobType?.replace("_", " ") || "Unknown"}
                  </Badge>
                  {job.chemicalProduct && (
                    <span className="text-xs text-muted-foreground">
                      {job.chemicalProduct}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
