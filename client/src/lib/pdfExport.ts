import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_TITLE, APP_LOGO } from "@/const";

interface JobData {
  id: number;
  title?: string | null;
  customerName?: string | null;
  personnelName?: string | null;
  locationAddress?: string | null;
  commodity?: string | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  statusName?: string | null;
  epaRegistrationNumber?: string | null;
  targetPest?: string | null;
  applicationRate?: string | null;
  applicationMethod?: string | null;
  chemicalProduct?: string | null;
  reEntryInterval?: string | null;
  preharvestInterval?: string | null;
  maxApplicationsPerSeason?: string | null;
  maxRatePerSeason?: string | null;
  methodsAllowed?: string | null;
  rate?: string | null;
  diluentAerial?: string | null;
  diluentGround?: string | null;
  diluentChemigation?: string | null;
  genericConditions?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  completedAt?: string | Date | null;
}

export function exportJobToPDF(job: JobData) {
  const doc = new jsPDF();
  
  // Add company branding
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text(APP_TITLE, 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Application Record", 14, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Job #${job.id}`, 14, 37);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
  
  // Job Information Section
  let yPos = 55;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Job Information", 14, yPos);
  yPos += 5;
  
  const jobInfo: [string, string][] = [
    ["Status", job.statusName || "N/A"],
    ["Customer", job.customerName || "N/A"],
    ["Personnel", job.personnelName || "N/A"],
    ["Location", job.locationAddress || "N/A"],
    ["Commodity", job.commodity || "N/A"],
  ];
  
  if (job.scheduledStart) {
    jobInfo.push(["Scheduled Start", new Date(job.scheduledStart).toLocaleString()]);
  }
  if (job.scheduledEnd) {
    jobInfo.push(["Scheduled End", new Date(job.scheduledEnd).toLocaleString()]);
  }
  if (job.completedAt) {
    jobInfo.push(["Completed", new Date(job.completedAt).toLocaleString()]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: jobInfo,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 130 },
    },
  });
  
  // EPA Compliance Section
  if (job.epaRegistrationNumber) {
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("EPA Compliance Information", 14, yPos);
    yPos += 5;
    
    const epaInfo: [string, string][] = [
      ["EPA Registration Number", job.epaRegistrationNumber],
    ];
    
    if (job.chemicalProduct) epaInfo.push(["Chemical Product", job.chemicalProduct]);
    if (job.targetPest) epaInfo.push(["Target Pest", job.targetPest]);
    if (job.applicationRate) epaInfo.push(["Application Rate", job.applicationRate]);
    if (job.applicationMethod) epaInfo.push(["Application Method", job.applicationMethod]);
    if (job.reEntryInterval) epaInfo.push(["Re-Entry Interval (REI)", job.reEntryInterval]);
    if (job.preharvestInterval) epaInfo.push(["Pre-harvest Interval (PHI)", job.preharvestInterval]);
    if (job.maxApplicationsPerSeason) epaInfo.push(["Max Applications/Season", job.maxApplicationsPerSeason]);
    if (job.maxRatePerSeason) epaInfo.push(["Max Rate/Season", job.maxRatePerSeason]);
    if (job.methodsAllowed) epaInfo.push(["Methods Allowed", job.methodsAllowed]);
    if (job.rate) epaInfo.push(["Rate", job.rate]);
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: epaInfo,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 120 },
      },
    });
  }
  
  // Diluent Information
  if (job.diluentAerial || job.diluentGround || job.diluentChemigation) {
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Diluent Information", 14, yPos);
    yPos += 5;
    
    const diluentInfo: [string, string][] = [];
    if (job.diluentAerial) diluentInfo.push(["Aerial", job.diluentAerial]);
    if (job.diluentGround) diluentInfo.push(["Ground", job.diluentGround]);
    if (job.diluentChemigation) diluentInfo.push(["Chemigation", job.diluentChemigation]);
    
    autoTable(doc, {
      startY: yPos,
      head: [],
      body: diluentInfo,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 130 },
      },
    });
  }
  
  // Additional Notes
  if (job.genericConditions || job.notes) {
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.text("Additional Information", 14, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    if (job.genericConditions) {
      doc.text("Generic Conditions:", 14, yPos);
      yPos += 5;
      const splitConditions = doc.splitTextToSize(job.genericConditions, 180);
      doc.text(splitConditions, 14, yPos);
      yPos += splitConditions.length * 5 + 5;
    }
    
    if (job.notes) {
      doc.text("Notes:", 14, yPos);
      yPos += 5;
      const splitNotes = doc.splitTextToSize(job.notes, 180);
      doc.text(splitNotes, 14, yPos);
    }
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `${APP_TITLE} - Application Record - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
  
  // Save the PDF
  doc.save(`Application-Record-Job-${job.id}.pdf`);
}

export function exportJobsToCSV(jobs: JobData[]) {
  const headers = [
    "Job ID",
    "Title",
    "Status",
    "Customer",
    "Personnel",
    "Location",
    "Commodity",
    "Scheduled Start",
    "Scheduled End",
    "Completed",
    "EPA Registration #",
    "Target Pest",
    "Application Rate",
    "Application Method",
    "Chemical Product",
    "Re-Entry Interval",
    "Pre-harvest Interval",
    "Max Applications/Season",
    "Max Rate/Season",
    "Methods Allowed",
    "Rate",
    "Diluent Aerial",
    "Diluent Ground",
    "Diluent Chemigation",
    "Generic Conditions",
    "Notes",
  ];
  
  const rows = jobs.map((job) => [
    job.id,
    job.title || "",
    job.statusName || "",
    job.customerName || "",
    job.personnelName || "",
    job.locationAddress || "",
    job.commodity || "",
    job.scheduledStart ? new Date(job.scheduledStart).toLocaleString() : "",
    job.scheduledEnd ? new Date(job.scheduledEnd).toLocaleString() : "",
    job.completedAt ? new Date(job.completedAt).toLocaleString() : "",
    job.epaRegistrationNumber || "",
    job.targetPest || "",
    job.applicationRate || "",
    job.applicationMethod || "",
    job.chemicalProduct || "",
    job.reEntryInterval || "",
    job.preharvestInterval || "",
    job.maxApplicationsPerSeason || "",
    job.maxRatePerSeason || "",
    job.methodsAllowed || "",
    job.rate || "",
    job.diluentAerial || "",
    job.diluentGround || "",
    job.diluentChemigation || "",
    job.genericConditions || "",
    job.notes || "",
  ]);
  
  // Escape CSV fields
  const escapeCsvField = (field: any) => {
    const str = String(field);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvContent = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");
  
  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `Application-Records-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
