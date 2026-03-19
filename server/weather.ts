/**
 * Weather service using Open-Meteo API (free, no API key required)
 * https://open-meteo.com/
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class WeatherCache {
  private currentWeatherCache = new Map<string, CacheEntry<WeatherData>>();
  private forecastCache = new Map<string, CacheEntry<WeatherForecast>>();
  
  private readonly CURRENT_WEATHER_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly FORECAST_TTL = 15 * 60 * 1000; // 15 minutes

  private getCacheKey(latitude: number, longitude: number): string {
    // Round to 2 decimal places for cache efficiency
    const lat = Math.round(latitude * 100) / 100;
    const lng = Math.round(longitude * 100) / 100;
    return `${lat},${lng}`;
  }

  getCurrentWeather(latitude: number, longitude: number): WeatherData | null {
    const key = this.getCacheKey(latitude, longitude);
    const entry = this.currentWeatherCache.get(key);
    
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    
    // Clean up expired entry
    if (entry) {
      this.currentWeatherCache.delete(key);
    }
    
    return null;
  }

  setCurrentWeather(latitude: number, longitude: number, data: WeatherData): void {
    const key = this.getCacheKey(latitude, longitude);
    const now = Date.now();
    
    this.currentWeatherCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.CURRENT_WEATHER_TTL,
    });
  }

  getForecast(latitude: number, longitude: number): WeatherForecast | null {
    const key = this.getCacheKey(latitude, longitude);
    const entry = this.forecastCache.get(key);
    
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    
    // Clean up expired entry
    if (entry) {
      this.forecastCache.delete(key);
    }
    
    return null;
  }

  setForecast(latitude: number, longitude: number, data: WeatherForecast): void {
    const key = this.getCacheKey(latitude, longitude);
    const now = Date.now();
    
    this.forecastCache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.FORECAST_TTL,
    });
  }

  // Periodically clean up expired entries
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.currentWeatherCache.entries()) {
      if (now >= entry.expiresAt) {
        this.currentWeatherCache.delete(key);
      }
    }
    
    for (const [key, entry] of this.forecastCache.entries()) {
      if (now >= entry.expiresAt) {
        this.forecastCache.delete(key);
      }
    }
  }
}

// Global cache instance
const weatherCache = new WeatherCache();

// Clean up expired entries every 10 minutes
setInterval(() => {
  weatherCache.cleanup();
}, 10 * 60 * 1000);

export interface WeatherData {
  temperature: number; // °F
  humidity: number; // %
  windSpeed: number; // mph
  windDirection: number; // degrees
  precipitation: number; // inches
  conditions: string;
  timestamp: Date;
}

export interface WeatherForecast {
  hourly: WeatherData[];
  daily: {
    date: Date;
    maxTemp: number;
    minTemp: number;
    precipitation: number;
    windSpeedMax: number;
  }[];
}

export interface SprayWindow {
  isIdeal: boolean;
  score: number; // 0-100
  reasons: string[];
  recommendation: string;
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  // Check cache first
  const cached = weatherCache.getCurrentWeather(latitude, longitude);
  if (cached) {
    return cached;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  const current = data.current;

  const weatherData: WeatherData = {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    precipitation: current.precipitation,
    conditions: getWeatherCondition(current.weather_code),
    timestamp: new Date(current.time),
  };

  // Cache the result
  weatherCache.setCurrentWeather(latitude, longitude, weatherData);

  return weatherData;
}

/**
 * Get weather forecast for next 7 days
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherForecast> {
  // Check cache first
  const cached = weatherCache.getForecast(latitude, longitude);
  if (cached) {
    return cached;
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Parse hourly data (next 24 hours)
  const hourly: WeatherData[] = [];
  for (let i = 0; i < Math.min(24, data.hourly.time.length); i++) {
    hourly.push({
      temperature: data.hourly.temperature_2m[i],
      humidity: data.hourly.relative_humidity_2m[i],
      windSpeed: data.hourly.wind_speed_10m[i],
      windDirection: data.hourly.wind_direction_10m[i],
      precipitation: data.hourly.precipitation[i],
      conditions: getWeatherCondition(data.hourly.weather_code[i]),
      timestamp: new Date(data.hourly.time[i]),
    });
  }

  // Parse daily data
  const daily = data.daily.time.map((date: string, i: number) => ({
    date: new Date(date),
    maxTemp: data.daily.temperature_2m_max[i],
    minTemp: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i],
    windSpeedMax: data.daily.wind_speed_10m_max[i],
  }));

  const forecast: WeatherForecast = { hourly, daily };

  // Cache the result
  weatherCache.setForecast(latitude, longitude, forecast);

  return forecast;
}

/**
 * Evaluate if current conditions are suitable for spraying
 * Based on agricultural best practices:
 * - Wind: 3-10 mph (ideal), <3 too calm (inversion risk), >10 too windy (drift)
 * - Temperature: 50-85°F (ideal)
 * - Humidity: 40-70% (ideal)
 * - No precipitation
 */
export function evaluateSprayConditions(weather: WeatherData): SprayWindow {
  const reasons: string[] = [];
  let score = 100;

  // Wind speed evaluation
  if (weather.windSpeed < 3) {
    score -= 30;
    reasons.push('Wind too calm - inversion risk');
  } else if (weather.windSpeed > 10) {
    score -= 40;
    reasons.push(`Wind too strong (${weather.windSpeed.toFixed(1)} mph) - drift risk`);
  } else if (weather.windSpeed >= 3 && weather.windSpeed <= 7) {
    reasons.push(`Ideal wind speed (${weather.windSpeed.toFixed(1)} mph)`);
  } else {
    score -= 10;
    reasons.push(`Acceptable wind speed (${weather.windSpeed.toFixed(1)} mph)`);
  }

  // Temperature evaluation
  if (weather.temperature < 50) {
    score -= 25;
    reasons.push(`Temperature too low (${weather.temperature.toFixed(0)}°F)`);
  } else if (weather.temperature > 85) {
    score -= 25;
    reasons.push(`Temperature too high (${weather.temperature.toFixed(0)}°F) - volatilization risk`);
  } else if (weather.temperature >= 60 && weather.temperature <= 75) {
    reasons.push(`Ideal temperature (${weather.temperature.toFixed(0)}°F)`);
  } else {
    score -= 10;
    reasons.push(`Acceptable temperature (${weather.temperature.toFixed(0)}°F)`);
  }

  // Humidity evaluation
  if (weather.humidity < 40) {
    score -= 20;
    reasons.push(`Low humidity (${weather.humidity}%) - evaporation risk`);
  } else if (weather.humidity > 70) {
    score -= 15;
    reasons.push(`High humidity (${weather.humidity}%)`);
  } else {
    reasons.push(`Good humidity (${weather.humidity}%)`);
  }

  // Precipitation check
  if (weather.precipitation > 0) {
    score -= 50;
    reasons.push('Active precipitation - DO NOT SPRAY');
  }

  // Weather conditions check
  if (weather.conditions.includes('Rain') || weather.conditions.includes('Storm')) {
    score -= 50;
    reasons.push(`Adverse conditions: ${weather.conditions}`);
  }

  const isIdeal = score >= 80;
  let recommendation: string;

  if (score >= 80) {
    recommendation = 'IDEAL - Excellent conditions for spraying';
  } else if (score >= 60) {
    recommendation = 'ACCEPTABLE - Proceed with caution';
  } else if (score >= 40) {
    recommendation = 'MARGINAL - Not recommended unless necessary';
  } else {
    recommendation = 'UNSAFE - Do not spray';
  }

  return {
    isIdeal,
    score: Math.max(0, score),
    reasons,
    recommendation,
  };
}

/**
 * Get historical weather data for compliance records
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherData> {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set('start_date', dateStr);
  url.searchParams.set('end_date', dateStr);
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Get midday data (12 PM) as representative
  const noonIndex = 12;
  
  return {
    temperature: data.hourly.temperature_2m[noonIndex],
    humidity: data.hourly.relative_humidity_2m[noonIndex],
    windSpeed: data.hourly.wind_speed_10m[noonIndex],
    windDirection: data.hourly.wind_direction_10m[noonIndex],
    precipitation: data.hourly.precipitation[noonIndex],
    conditions: getWeatherCondition(data.hourly.weather_code[noonIndex]),
    timestamp: new Date(data.hourly.time[noonIndex]),
  };
}

/**
 * Convert WMO weather code to human-readable condition
 * https://open-meteo.com/en/docs
 */
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Heavy Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    85: 'Light Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail',
  };

  return conditions[code] || 'Unknown';
}
