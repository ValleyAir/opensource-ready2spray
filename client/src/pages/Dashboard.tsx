import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, UserCheck, Package, Loader2, Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: jobsData, isLoading: jobsLoading } = trpc.jobs.list.useQuery();
  const { data: customers, isLoading: customersLoading } = trpc.customers.list.useQuery();
  const { data: personnel, isLoading: personnelLoading } = trpc.personnel.list.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();

  // jobs.list returns paginated { data, total, ... } - extract the array
  const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.data ?? [];

  const stats = [
    {
      title: "Total Jobs",
      value: jobs?.length || 0,
      icon: Briefcase,
      description: "Active spray jobs",
      loading: jobsLoading,
    },
    {
      title: "Customers",
      value: customers?.length || 0,
      icon: Users,
      description: "Registered customers",
      loading: customersLoading,
    },
    {
      title: "Personnel",
      value: personnel?.length || 0,
      icon: UserCheck,
      description: "Team members",
      loading: personnelLoading,
    },
    {
      title: "Products",
      value: products?.length || 0,
      icon: Package,
      description: "EPA-registered products",
      loading: productsLoading,
    },
  ];

  const pendingJobs = jobs?.filter((j) => j.statusId === 1).length || 0;
  const inProgressJobs = jobs?.filter((j) => j.statusId === 2).length || 0;
  const completedJobs = jobs?.filter((j) => j.statusId === 3).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your agricultural operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setLocation('/jobs?action=create')}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Job
          </Button>
          <Button
            onClick={() => setLocation('/customers?action=create')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Customer
          </Button>
          <Button
            onClick={() => setLocation('/personnel?action=create')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Personnel
          </Button>
          <Button
            onClick={() => setLocation('/product-lookup')}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Product
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pending Jobs</CardTitle>
            <CardDescription>Jobs waiting to be started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>Currently active jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{inProgressJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Successfully finished jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Latest spray job activities</CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.jobType?.replace("_", " ") || "No type set"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      Status: {job.statusId || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No jobs yet. Create your first job to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
