/**
 * Spray Drift Risk Calculator
 * Based on EPA Drift Reduction Technology (DRT) Guidelines and ASABE S572.1
 */

export interface DriftInput {
  windSpeed: number; // mph
  windDirection?: number; // degrees
  temperature: number; // F
  humidity: number; // %
  boomHeight: number; // feet
  dropletSize: 'Fine' | 'Medium' | 'Coarse' | 'Very Coarse' | 'Extra Coarse';
  aircraftSpeed: number; // mph
  distanceToSensitiveArea?: number; // feet
}

export interface DriftResult {
  riskScore: number; // 0-100 (0 = Safe, 100 = Critical)
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  estimatedDriftDistance: number; // feet (approximate downwind distance)
  requiredBufferZone: number; // feet
  recommendations: string[];
}

const DROPLET_FACTORS = {
  'Fine': 1.0,      // Baseline (High Drift Risk)
  'Medium': 0.6,    // 40% reduction
  'Coarse': 0.3,    // 70% reduction
  'Very Coarse': 0.1, // 90% reduction
  'Extra Coarse': 0.05 // 95% reduction
};

export function calculateDriftRisk(input: DriftInput): DriftResult {
  let score = 0;
  const recommendations: string[] = [];

  // 1. Wind Speed (Exponential factor above 10mph)
  // 0-3 mph: Inversion Risk (High Score)
  // 3-10 mph: Ideal (Low Score)
  // >10 mph: Drift Risk (High Score)
  if (input.windSpeed < 3) {
    score += 40;
    recommendations.push("Wind speed is too low (< 3 mph). Risk of temperature inversion drift.");
  } else if (input.windSpeed > 10) {
    // Exponential increase: (wind - 10)^1.5 * 5
    const excess = input.windSpeed - 10;
    score += Math.min(50, Math.pow(excess, 1.5) * 5);
    recommendations.push(`High wind speed (${input.windSpeed} mph) significantly increases drift risk.`);
  } else {
    // 3-10 mph is ideal, slight increase as it approaches 10
    score += (input.windSpeed - 3) * 2; 
  }

  // 2. Temperature & Humidity (Delta T)
  // High temp + Low humidity = Evaporation = Smaller Droplets = More Drift
  // Simple proxy: Temp - (Humidity / 4)
  // Example: 90F, 20% Hum => 90 - 5 = 85 (High)
  // Example: 70F, 50% Hum => 70 - 12.5 = 57.5 (Low)
  const evaporationIndex = input.temperature - (input.humidity / 4);
  if (evaporationIndex > 70) {
    score += 20;
    recommendations.push("High evaporation potential (Hot & Dry). Use larger droplets or anti-evaporation adjuvants.");
  } else if (evaporationIndex > 50) {
    score += 10;
  }

  // 3. Boom Height
  // Approx 10% risk increase per foot above 10ft (for aerial) or 2ft (ground)
  // Assuming aerial application baseline of ~10-12ft
  if (input.boomHeight > 15) {
    score += (input.boomHeight - 15) * 2;
    recommendations.push(`Boom height (${input.boomHeight} ft) is high. Lowering release height reduces drift.`);
  }

  // 4. Droplet Size (Major Mitigation Factor)
  const dropletFactor = DROPLET_FACTORS[input.dropletSize] || 1.0;
  // Apply droplet mitigation to the accumulated wind/height score
  // If Fine, score remains high. If Coarse, score is dampened.
  // However, we must ensure risk is not zeroed out completely if wind is critical.
  
  // Base score from physical factors
  const baseRisk = score; 
  
  // Droplet size penalizes 'Fine' heavily directly
  if (input.dropletSize === 'Fine') {
    score += 30;
    recommendations.push("Fine droplets detected. Strongly recommend switching to Coarse or Medium nozzles.");
  } else if (input.dropletSize === 'Medium') {
    score += 10;
  } else {
    // Coarse droplets reduce the impact of wind/evaporation on the score
    score = score * (0.5 + (dropletFactor * 0.5)); 
    recommendations.push(`Using ${input.dropletSize} droplets helps mitigate drift risk.`);
  }

  // 5. Aircraft Speed (Vortex effect)
  // Higher speed = more turbulence = drift
  if (input.aircraftSpeed > 140) { // mph
    score += 10;
    recommendations.push("High aircraft speed may increase vortex turbulence and drift.");
  }

  // Cap score
  score = Math.min(100, Math.max(0, score));

  // Determine Level
  let riskLevel: DriftResult['riskLevel'];
  if (score >= 80) riskLevel = 'Critical';
  else if (score >= 50) riskLevel = 'High';
  else if (score >= 30) riskLevel = 'Moderate';
  else riskLevel = 'Low';

  // Estimate Drift Distance (Simple Physics approximation for demonstration)
  // D = H * (Wind / TerminalVelocity)
  // Fine (~100um) Tv ~ 0.5 ft/s
  // Coarse (~400um) Tv ~ 5 ft/s
  let terminalVelocity = 1; 
  if (input.dropletSize === 'Fine') terminalVelocity = 0.5;
  else if (input.dropletSize === 'Medium') terminalVelocity = 2;
  else if (input.dropletSize === 'Coarse') terminalVelocity = 5;
  else terminalVelocity = 8;

  // Wind speed in ft/s (1 mph = 1.467 ft/s)
  const windFtS = input.windSpeed * 1.467;
  // Time to fall = Height / Tv
  const timeToFall = input.boomHeight / terminalVelocity;
  // Horizontal Dist = Wind * Time
  const estimatedDist = windFtS * timeToFall;

  // Buffer Zone (EPA Tier 1 Aerial default is often 100-200ft for sensitive areas)
  // We'll scale it based on risk score
  const requiredBuffer = Math.ceil(Math.max(100, estimatedDist * 1.5)); 

  return {
    riskScore: Math.round(score),
    riskLevel,
    estimatedDriftDistance: Math.round(estimatedDist),
    requiredBufferZone: requiredBuffer,
    recommendations
  };
}
