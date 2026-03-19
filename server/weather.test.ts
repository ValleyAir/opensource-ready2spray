import { describe, expect, it } from "vitest";
import { getCurrentWeather, getWeatherForecast, evaluateSprayConditions, type WeatherData } from "./weather";

describe("Weather Service", () => {
  // Test with a known location (Denver, CO - agricultural area)
  const testLatitude = 39.7392;
  const testLongitude = -104.9903;

  it("should fetch current weather data", async () => {
    const weather = await getCurrentWeather(testLatitude, testLongitude);
    
    expect(weather).toBeDefined();
    expect(weather.temperature).toBeTypeOf("number");
    expect(weather.humidity).toBeTypeOf("number");
    expect(weather.windSpeed).toBeTypeOf("number");
    expect(weather.windDirection).toBeTypeOf("number");
    expect(weather.precipitation).toBeTypeOf("number");
    expect(weather.conditions).toBeTypeOf("string");
    expect(weather.timestamp).toBeInstanceOf(Date);
    
    // Sanity checks for reasonable values
    expect(weather.temperature).toBeGreaterThan(-50);
    expect(weather.temperature).toBeLessThan(150);
    expect(weather.humidity).toBeGreaterThanOrEqual(0);
    expect(weather.humidity).toBeLessThanOrEqual(100);
    expect(weather.windSpeed).toBeGreaterThanOrEqual(0);
    expect(weather.windDirection).toBeGreaterThanOrEqual(0);
    expect(weather.windDirection).toBeLessThan(360);
  }, 10000); // 10 second timeout for API call

  it("should fetch weather forecast", async () => {
    const forecast = await getWeatherForecast(testLatitude, testLongitude);
    
    expect(forecast).toBeDefined();
    expect(forecast.hourly).toBeInstanceOf(Array);
    expect(forecast.daily).toBeInstanceOf(Array);
    expect(forecast.hourly.length).toBeGreaterThan(0);
    expect(forecast.daily.length).toBeGreaterThan(0);
    
    // Check first hourly entry
    const firstHour = forecast.hourly[0];
    expect(firstHour).toBeDefined();
    expect(firstHour?.temperature).toBeTypeOf("number");
    expect(firstHour?.windSpeed).toBeTypeOf("number");
    
    // Check first daily entry
    const firstDay = forecast.daily[0];
    expect(firstDay).toBeDefined();
    expect(firstDay?.maxTemp).toBeTypeOf("number");
    expect(firstDay?.minTemp).toBeTypeOf("number");
    expect(firstDay?.date).toBeInstanceOf(Date);
  }, 10000);

  it("should evaluate ideal spray conditions", () => {
    const idealWeather: WeatherData = {
      temperature: 65, // Ideal: 50-85°F
      humidity: 55, // Ideal: 40-70%
      windSpeed: 5, // Ideal: 3-10 mph
      windDirection: 180,
      precipitation: 0,
      conditions: "Clear",
      timestamp: new Date(),
    };
    
    const evaluation = evaluateSprayConditions(idealWeather);
    
    expect(evaluation.isIdeal).toBe(true);
    expect(evaluation.score).toBeGreaterThanOrEqual(80);
    expect(evaluation.recommendation).toContain("IDEAL");
    expect(evaluation.reasons.length).toBeGreaterThan(0);
  });

  it("should flag dangerous wind conditions", () => {
    const windyWeather: WeatherData = {
      temperature: 70,
      humidity: 50,
      windSpeed: 15, // Too windy (>10 mph)
      windDirection: 180,
      precipitation: 0,
      conditions: "Clear",
      timestamp: new Date(),
    };
    
    const evaluation = evaluateSprayConditions(windyWeather);
    
    expect(evaluation.isIdeal).toBe(false);
    expect(evaluation.score).toBeLessThan(80);
    expect(evaluation.reasons.some(r => r.includes("Wind"))).toBe(true);
  });

  it("should flag precipitation as unsafe", () => {
    const rainyWeather: WeatherData = {
      temperature: 70,
      humidity: 50,
      windSpeed: 5,
      windDirection: 180,
      precipitation: 0.1, // Active precipitation
      conditions: "Rain",
      timestamp: new Date(),
    };
    
    const evaluation = evaluateSprayConditions(rainyWeather);
    
    expect(evaluation.isIdeal).toBe(false);
    expect(evaluation.score).toBeLessThan(50);
    expect(evaluation.recommendation).toContain("UNSAFE");
    expect(evaluation.reasons.some(r => r.includes("precipitation"))).toBe(true);
  });

  it("should flag temperature extremes", () => {
    const hotWeather: WeatherData = {
      temperature: 95, // Too hot (>85°F)
      humidity: 50,
      windSpeed: 5,
      windDirection: 180,
      precipitation: 0,
      conditions: "Clear",
      timestamp: new Date(),
    };
    
    const evaluation = evaluateSprayConditions(hotWeather);
    
    expect(evaluation.isIdeal).toBe(false);
    expect(evaluation.reasons.some(r => r.includes("Temperature"))).toBe(true);
  });

  it("should flag calm wind conditions (inversion risk)", () => {
    const calmWeather: WeatherData = {
      temperature: 70,
      humidity: 50,
      windSpeed: 1, // Too calm (<3 mph)
      windDirection: 180,
      precipitation: 0,
      conditions: "Clear",
      timestamp: new Date(),
    };
    
    const evaluation = evaluateSprayConditions(calmWeather);
    
    expect(evaluation.isIdeal).toBe(false);
    expect(evaluation.reasons.some(r => r.includes("calm"))).toBe(true);
  });
});
