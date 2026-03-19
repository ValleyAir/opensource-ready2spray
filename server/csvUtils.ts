import Papa from 'papaparse';

export interface JobImportRow {
  title: string;
  description?: string;
  jobType: string;
  priority?: string;
  customerName?: string;
  personnelName?: string;
  equipmentName?: string;
  scheduledDate?: string;
  locationAddress?: string;
  acres?: string;
  chemicalProduct?: string;
  epaRegistrationNumber?: string;
  targetPest?: string;
  applicationRate?: string;
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  createdJobs: Array<{ id: number; title: string }>;
}

export function parseCSV(csvContent: string): Papa.ParseResult<JobImportRow> {
  return Papa.parse<JobImportRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normalize header names
      const normalized = header.trim().toLowerCase().replace(/\s+/g, '_');
      const mapping: Record<string, string> = {
        'job_title': 'title',
        'job_name': 'title',
        'job_type': 'jobType',
        'type': 'jobType',
        'customer': 'customerName',
        'customer_name': 'customerName',
        'personnel': 'personnelName',
        'assigned_to': 'personnelName',
        'equipment': 'equipmentName',
        'scheduled_date': 'scheduledDate',
        'date': 'scheduledDate',
        'location': 'locationAddress',
        'address': 'locationAddress',
        'epa_number': 'epaRegistrationNumber',
        'epa_reg_number': 'epaRegistrationNumber',
        'epa_#': 'epaRegistrationNumber',
        'chemical': 'chemicalProduct',
        'product': 'chemicalProduct',
        'target': 'targetPest',
        'pest': 'targetPest',
        'rate': 'applicationRate',
        'application_rate': 'applicationRate',
      };
      return mapping[normalized] || normalized;
    },
  });
}

export function validateJobRow(row: JobImportRow, rowIndex: number): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!row.title || row.title.trim() === '') {
    errors.push('Title is required');
  }

  // Validate job type
  const validJobTypes = ['crop_dusting', 'pest_control', 'fertilization', 'herbicide'];
  if (row.jobType && !validJobTypes.includes(row.jobType.toLowerCase().replace(/\s+/g, '_'))) {
    errors.push(`Invalid job type: ${row.jobType}. Must be one of: ${validJobTypes.join(', ')}`);
  }

  // Validate priority
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (row.priority && !validPriorities.includes(row.priority.toLowerCase())) {
    errors.push(`Invalid priority: ${row.priority}. Must be one of: ${validPriorities.join(', ')}`);
  }

  // Validate date format if provided
  if (row.scheduledDate) {
    const date = new Date(row.scheduledDate);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid date format: ${row.scheduledDate}. Use YYYY-MM-DD or MM/DD/YYYY`);
    }
  }

  // Validate numeric fields
  if (row.acres && isNaN(parseFloat(row.acres))) {
    errors.push(`Invalid acres value: ${row.acres}. Must be a number`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function normalizeJobType(jobType: string): 'crop_dusting' | 'pest_control' | 'fertilization' | 'herbicide' {
  const normalized = jobType.toLowerCase().trim().replace(/\s+/g, '_');
  const mapping: Record<string, 'crop_dusting' | 'pest_control' | 'fertilization' | 'herbicide'> = {
    'crop_dusting': 'crop_dusting',
    'crop': 'crop_dusting',
    'dusting': 'crop_dusting',
    'aerial': 'crop_dusting',
    'pest_control': 'pest_control',
    'pest': 'pest_control',
    'control': 'pest_control',
    'fertilization': 'fertilization',
    'fertilizer': 'fertilization',
    'fert': 'fertilization',
    'herbicide': 'herbicide',
    'weed': 'herbicide',
    'weed_control': 'herbicide',
  };
  return mapping[normalized] || 'crop_dusting';
}

export function normalizePriority(priority?: string): 'low' | 'medium' | 'high' | 'urgent' {
  if (!priority) return 'medium';
  const normalized = priority.toLowerCase().trim();
  const mapping: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    'low': 'low',
    'l': 'low',
    '1': 'low',
    'medium': 'medium',
    'med': 'medium',
    'm': 'medium',
    '2': 'medium',
    'high': 'high',
    'h': 'high',
    '3': 'high',
    'urgent': 'urgent',
    'u': 'urgent',
    '4': 'urgent',
    'critical': 'urgent',
  };
  return mapping[normalized] || 'medium';
}
