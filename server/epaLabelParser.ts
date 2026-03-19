import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface ParsedEpaLabel {
  product_name: string | null;
  epa_registration_number: string | null;
  aerial_application: {
    allowed: boolean;
    prohibited_reason?: string;
    restrictions?: {
      buffer_zone?: {
        value: number;
        unit: string;
        text: string;
      };
      wind_speed?: {
        value: number;
        unit: string;
        text: string;
      };
      droplet_size?: {
        size: string;
        text: string;
      };
      application_rate?: {
        value: number;
        unit: string;
        text: string;
      };
    };
  };
  raw_sections: string[];
}

export interface ProductExtractedData {
  productName: string;
  epaNumber: string;
  registrant: string;
  activeIngredients: string;
  reEntryInterval: string;
  preharvestInterval: string;
  maxApplicationsPerSeason: string;
  maxRatePerSeason: string;
  methodsAllowed: string;
  rate: string;
  diluentAerial: string;
  diluentGround: string;
  diluentChemigation: string;
  ppeInformation: string;
  labelSignalWord: string;
  genericConditions: string;
}

/**
 * Parse EPA label PDF using Python parser
 * @param pdfBuffer Buffer containing PDF data
 * @returns Parsed label data
 */
export async function parseEpaLabelPdf(pdfBuffer: Buffer): Promise<ParsedEpaLabel> {
  // Create temporary file for PDF
  const tempFileName = `epa_label_${randomBytes(8).toString('hex')}.pdf`;
  const tempFilePath = join(tmpdir(), tempFileName);

  try {
    // Write PDF buffer to temp file
    await writeFile(tempFilePath, pdfBuffer);

    // Get path to Python parser
    const pythonParserPath = join(
      process.cwd(),
      'backend',
      'app',
      'parsers',
      'epa_label_parser.py'
    );

    // Call Python parser
    const result = await new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn('python', [pythonParserPath, tempFilePath]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python parser failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout);
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });

    // Parse JSON output
    const parsedData: ParsedEpaLabel = JSON.parse(result);
    return parsedData;
  } catch (error: any) {
    throw new Error(`Failed to parse EPA label: ${error.message}`);
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFilePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
      console.warn(`Failed to clean up temp file ${tempFilePath}:`, cleanupError);
    }
  }
}

/**
 * Convert parsed EPA label data to product extraction format
 * @param parsedLabel Parsed EPA label data
 * @returns Product extracted data matching the Products schema
 */
export function convertToProductData(parsedLabel: ParsedEpaLabel): ProductExtractedData {
  const { aerial_application, raw_sections } = parsedLabel;

  // Build methods allowed string
  let methodsAllowed = '';
  if (aerial_application.allowed) {
    methodsAllowed = 'Aerial application allowed';
    if (aerial_application.restrictions) {
      const restrictions: string[] = [];

      if (aerial_application.restrictions.buffer_zone) {
        const bz = aerial_application.restrictions.buffer_zone;
        restrictions.push(`Buffer zone: ${bz.value} ${bz.unit}`);
      }

      if (aerial_application.restrictions.wind_speed) {
        const ws = aerial_application.restrictions.wind_speed;
        restrictions.push(`Max wind speed: ${ws.value} ${ws.unit}`);
      }

      if (aerial_application.restrictions.droplet_size) {
        const ds = aerial_application.restrictions.droplet_size;
        restrictions.push(`Droplet size: ${ds.size}`);
      }

      if (restrictions.length > 0) {
        methodsAllowed += ' with restrictions: ' + restrictions.join('; ');
      }
    }
  } else {
    methodsAllowed = aerial_application.prohibited_reason || 'Aerial application prohibited';
  }

  // Build generic conditions from raw sections
  const genericConditions = raw_sections.length > 0
    ? raw_sections.join('\n\n')
    : '';

  // Build application rate info
  let rate = '';
  if (aerial_application.restrictions?.application_rate) {
    const ar = aerial_application.restrictions.application_rate;
    rate = `${ar.value} ${ar.unit}`;
  }

  return {
    productName: parsedLabel.product_name || '',
    epaNumber: parsedLabel.epa_registration_number || '',
    registrant: '',
    activeIngredients: '',
    reEntryInterval: '',
    preharvestInterval: '',
    maxApplicationsPerSeason: '',
    maxRatePerSeason: '',
    methodsAllowed,
    rate,
    diluentAerial: '',
    diluentGround: '',
    diluentChemigation: '',
    ppeInformation: '',
    labelSignalWord: '',
    genericConditions,
  };
}
