/**
 * Agrian Label Center Integration
 * Scrapes product data from TELUS Agronomy Label Database for EPA compliance
 */

import * as cheerio from 'cheerio';

interface AgrianSearchParams {
  country: 'United States' | 'Canada';
  query?: string;
  state?: string;
  commodity?: string;
}

interface AgrianProduct {
  name: string;
  registrationNumber?: string;
  distributor?: string;
  registrant?: string;
  url?: string;
}

interface AgrianProductDetail {
  // General Info
  registrant?: string;
  labelVersion?: string;
  productTypes?: string[];
  activeIngredients?: string[];
  formulationType?: string;
  physicalState?: string;
  labelSignalWord?: string;
  federallyRestricted?: boolean;
  caRestricted?: boolean;
  caNotRequired?: boolean;
  postingRequired?: boolean;
  approvedStates?: string[];

  // Crop Specific (varies by state/crop)
  reEntryInterval?: string;
  preharvestInterval?: string;
  maxApplicationsPerSeason?: string;
  maxRatePerSeason?: string;
  methodsAllowed?: string[];
  rate?: string;
  diluentAerial?: string;
  diluentGround?: string;
  diluentChemigation?: string;
  genericCondition?: string;

  // Safety (PPE)
  ppeInformation?: string;
  reEntryPPE?: string;
  transportInformation?: string;
  responseNumber?: string;
  medicalNumber?: string;
  sdsHazardSignalWord?: string;

  // Registration
  epaNumber?: string;
  epaRegistrationNumber?: string;
}

/**
 * Search for products on Agrian Label Center
 */
export async function searchAgrianProducts(params: AgrianSearchParams): Promise<AgrianProduct[]> {
  const { country, query, state, commodity } = params;
  
  // Build search URL
  let url = `https://www.agrian.com/labelcenter/results.cfm?country=${encodeURIComponent(country)}`;
  
  if (query) {
    url += `&search=${encodeURIComponent(query)}`;
  }
  if (state) {
    url += `&state=${encodeURIComponent(state)}`;
  }
  if (commodity) {
    url += `&commodity=${encodeURIComponent(commodity)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Agrian search failed: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const products: AgrianProduct[] = [];

    // Parse product table rows
    $('table tr').each((_: any, row: any) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        const nameCell = cells.eq(0);
        const regCell = cells.eq(1);
        const registrantCell = cells.eq(2);

        const productLink = nameCell.find('a');
        const name = productLink.text().trim() || nameCell.text().trim();
        const href = productLink.attr('href');

        if (name && name !== 'Product') { // Skip header row
          products.push({
            name,
            registrationNumber: regCell.text().trim() || undefined,
            registrant: registrantCell.text().trim() || undefined,
            url: href ? `https://www.agrian.com${href}` : undefined,
          });
        }
      }
    });

    return products;
  } catch (error: any) {
    console.error('[Agrian] Search error:', error);
    throw new Error(`Failed to search Agrian: ${error.message}`);
  }
}

/**
 * Get detailed product information from Agrian
 */
export async function getAgrianProductDetail(productUrl: string, state?: string, commodity?: string): Promise<AgrianProductDetail> {
  try {
    // Add state and commodity to URL if provided
    let url = productUrl;
    if (state || commodity) {
      const urlObj = new URL(url);
      if (state) urlObj.searchParams.set('state', state);
      if (commodity) urlObj.searchParams.set('commodity', commodity);
      url = urlObj.toString();
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product details: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const detail: AgrianProductDetail = {};

    // Helper function to extract table data
    const extractTableData = (label: string): string | undefined => {
      let value: string | undefined;
      $('table tr').each((_: any, row: any) => {
        const $row = $(row);
        const cells = $row.find('td');
        if (cells.length >= 2) {
          const labelText = cells.eq(0).text().trim();
          if (labelText.toLowerCase().includes(label.toLowerCase())) {
            value = cells.eq(1).text().trim();
            return false; // break
          }
        }
      });
      return value;
    };

    // Extract General tab data
    detail.registrant = extractTableData('Registrant');
    detail.labelVersion = extractTableData('Label Version');
    detail.formulationType = extractTableData('Formulation Type');
    detail.physicalState = extractTableData('Physical State');
    detail.labelSignalWord = extractTableData('Label Signal Word');
    detail.federallyRestricted = extractTableData('Federally Restricted') === 'Yes';
    detail.caRestricted = extractTableData('CA Restricted') === 'Yes';

    // Extract active ingredients
    const activeIngredientsText = extractTableData('Active Ingredient');
    if (activeIngredientsText) {
      detail.activeIngredients = activeIngredientsText.split(/[,;]/).map(s => s.trim());
    }

    // Extract approved states
    const approvedStatesText = extractTableData('Approved for Use in the Following States/Provinces');
    if (approvedStatesText) {
      detail.approvedStates = approvedStatesText.split(/[,;]/).map(s => s.trim());
    }

    // Extract Crop Specific tab data (if state/commodity provided)
    detail.reEntryInterval = extractTableData('Re-Entry Interval');
    detail.preharvestInterval = extractTableData('Preharvest Interval');
    detail.maxApplicationsPerSeason = extractTableData('Max Applications per Season');
    detail.maxRatePerSeason = extractTableData('Max Rate per Season');
    detail.methodsAllowed = extractTableData('Methods Allowed')?.split(',').map(s => s.trim());
    detail.rate = extractTableData('Rate');
    detail.diluentAerial = extractTableData('Diluent (Air)');
    detail.diluentGround = extractTableData('Diluent (Ground)');
    detail.diluentChemigation = extractTableData('Diluent (Chemigation)');
    detail.genericCondition = extractTableData('Generic Condition');

    // Extract Safety tab data (PPE)
    detail.ppeInformation = extractTableData('PPE Information');
    detail.reEntryPPE = extractTableData('Re-Entry PPE Information');
    detail.sdsHazardSignalWord = extractTableData('SDS Hazard ID Signal Word');

    // Extract Registration tab data
    detail.epaNumber = extractTableData('EPA Number');
    detail.epaRegistrationNumber = extractTableData('Registration #');

    return detail;
  } catch (error: any) {
    console.error('[Agrian] Product detail error:', error);
    throw new Error(`Failed to get product details: ${error.message}`);
  }
}
