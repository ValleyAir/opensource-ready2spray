import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Download, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

export default function BulkJobImport() {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bulkImportMutation = trpc.jobs.bulkImport.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      if (result.success) {
        toast.success(`Successfully imported ${result.successCount} jobs!`);
      } else {
        toast.error(`Import completed with ${result.errorCount} errors`);
      }
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);

      // Parse and preview first 5 rows
      const parsed = Papa.parse(content, { header: true, preview: 5 });
      setPreviewData(parsed.data);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv"))) {
      handleFileChange(droppedFile);
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  const handleImport = () => {
    if (!csvContent) {
      toast.error("Please select a file first");
      return;
    }

    bulkImportMutation.mutate({ csvContent });
  };

  const downloadTemplate = () => {
    const template = `title,description,jobType,priority,customerName,personnelName,equipmentName,scheduledDate,locationAddress,acres,chemicalProduct,epaRegistrationNumber,targetPest,applicationRate,notes
"Corn Field Spraying","Apply herbicide to 50 acre corn field",crop_dusting,high,"John Smith Farm","Mike Johnson","Cessna 188",2024-03-15,"123 Farm Road, Iowa City, IA",50,"Roundup","EPA-524-308","Weeds","2 gallons per acre","Weather permitting"
"Soybean Pest Control","Pest control for soybean field",pest_control,medium,"Green Valley Farms","Sarah Williams","Air Tractor 502",2024-03-16,"456 County Road, Des Moines, IA",75,"Warrior II","EPA-100-1066","Aphids","1.5 oz per acre","Early morning application"`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job_import_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk Job Import</h1>
        <p className="text-muted-foreground">
          Upload a CSV file to import multiple jobs at once
        </p>
      </div>

      <div className="grid gap-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Follow these steps to import jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Download the CSV template below to see the required format</li>
              <li>Fill in your job data following the template structure</li>
              <li>Upload your completed CSV file</li>
              <li>Review the preview and click "Import Jobs"</li>
            </ol>
            <div className="mt-4">
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </div>

            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Customer names, personnel names, and equipment names must match existing records exactly. 
                Valid job types: crop_dusting, pest_control, fertilization, herbicide. 
                Valid priorities: low, medium, high, urgent.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Drag and drop or click to select</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {file ? file.name : "Drop your CSV file here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileChange(selectedFile);
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview (First 5 Rows)</CardTitle>
              <CardDescription>
                Review your data before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Personnel</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row: any, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{row.title || "-"}</TableCell>
                        <TableCell>{row.jobType || "-"}</TableCell>
                        <TableCell>{row.priority || "-"}</TableCell>
                        <TableCell>{row.customerName || "-"}</TableCell>
                        <TableCell>{row.personnelName || "-"}</TableCell>
                        <TableCell>{row.scheduledDate || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleImport}
                  disabled={bulkImportMutation.isPending}
                >
                  {bulkImportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Jobs
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setCsvContent("");
                    setPreviewData([]);
                    setImportResult(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Import Successful
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Import Completed with Errors
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{importResult.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {importResult.successCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {importResult.errorCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Errors</p>
                </div>
              </div>

              {importResult.createdJobs.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Created Jobs</h3>
                  <div className="flex flex-wrap gap-2">
                    {importResult.createdJobs.map((job: any) => (
                      <Badge key={job.id} variant="secondary">
                        {job.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-500">Errors</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error: any, idx: number) => (
                      <Alert key={idx} variant="destructive">
                        <AlertDescription>
                          <strong>Row {error.row}:</strong> {error.message}
                          {error.field && (
                            <span className="text-xs ml-2">
                              (Field: {error.field})
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
