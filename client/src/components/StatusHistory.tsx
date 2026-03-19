import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface StatusHistoryProps {
  jobId: number;
}

export function StatusHistory({ jobId }: StatusHistoryProps) {
  const { data: history, isLoading } = trpc.jobs.history.useQuery({ jobId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
          <CardDescription>Timeline of status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status History</CardTitle>
          <CardDescription>Timeline of status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No status changes yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status History</CardTitle>
        <CardDescription>Timeline of status changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.fromStatusName && (
                    <>
                      <span className="text-sm font-medium text-muted-foreground">
                        {entry.fromStatusName}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <span className="text-sm font-medium">
                    {entry.toStatusName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{entry.changedByUserName || "Unknown user"}</span>
                  <span>•</span>
                  <span>
                    {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {entry.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
