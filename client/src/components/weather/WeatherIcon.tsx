import { Cloud, CloudDrizzle, CloudFog, CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react";

interface WeatherIconProps {
  condition: string;
  className?: string;
}

export function WeatherIcon({ condition, className = "h-8 w-8" }: WeatherIconProps) {
  const iconProps = { className };

  if (condition.includes("Clear") || condition.includes("Sunny")) {
    return <Sun {...iconProps} />;
  }
  if (condition.includes("Partly Cloudy") || condition.includes("Mainly Clear")) {
    return <CloudSun {...iconProps} />;
  }
  if (condition.includes("Cloudy") || condition.includes("Overcast")) {
    return <Cloud {...iconProps} />;
  }
  if (condition.includes("Fog")) {
    return <CloudFog {...iconProps} />;
  }
  if (condition.includes("Drizzle")) {
    return <CloudDrizzle {...iconProps} />;
  }
  if (condition.includes("Rain") || condition.includes("Shower")) {
    return <CloudRain {...iconProps} />;
  }
  if (condition.includes("Snow")) {
    return <CloudSnow {...iconProps} />;
  }
  if (condition.includes("Wind")) {
    return <Wind {...iconProps} />;
  }

  // Default to cloud icon
  return <Cloud {...iconProps} />;
}
