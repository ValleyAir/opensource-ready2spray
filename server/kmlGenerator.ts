/**
 * KML Generator - Converts GeoJSON polygons to KML 2.2 XML
 */

interface KmlMetadata {
  name: string;
  description?: string;
}

interface JobForKml {
  id: number;
  title: string;
  jobType: string | null;
  status?: string | null;
  scheduledStart?: Date | null;
  chemicalProduct?: string | null;
  polygon?: any;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function geoJsonCoordsToKml(coordinates: number[][]): string {
  return coordinates
    .map((coord) => `${coord[0]},${coord[1]},0`)
    .join(" ");
}

/**
 * Generate KML from a GeoJSON polygon
 */
export function generateKMLFromGeoJSON(
  polygon: any,
  name: string,
  metadata?: KmlMetadata
): string {
  if (!polygon || !polygon.coordinates) {
    throw new Error("Invalid polygon: missing coordinates");
  }

  const type = polygon.type || "Polygon";
  let placemarks = "";

  if (type === "Polygon") {
    const coords = geoJsonCoordsToKml(polygon.coordinates[0]);
    placemarks = `
    <Placemark>
      <name>${escapeXml(name)}</name>
      ${metadata?.description ? `<description>${escapeXml(metadata.description)}</description>` : ""}
      <Style>
        <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
        <PolyStyle><color>400000ff</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing><coordinates>${coords}</coordinates></LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
  } else if (type === "MultiPolygon") {
    placemarks = polygon.coordinates
      .map((poly: number[][][], i: number) => {
        const coords = geoJsonCoordsToKml(poly[0]);
        return `
    <Placemark>
      <name>${escapeXml(name)} - Part ${i + 1}</name>
      <Style>
        <LineStyle><color>ff0000ff</color><width>2</width></LineStyle>
        <PolyStyle><color>400000ff</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing><coordinates>${coords}</coordinates></LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
      })
      .join("\n");
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(name)}</name>
    ${metadata?.description ? `<description>${escapeXml(metadata.description)}</description>` : ""}
    ${placemarks}
  </Document>
</kml>`;
}

// Color palette for job history overlays
const JOB_COLORS: Record<string, string> = {
  crop_dusting: "ff00ff00",    // green
  pest_control: "ff0000ff",    // blue
  fertilization: "ff00ffff",   // yellow
  herbicide: "ffff0000",       // red
};

/**
 * Generate KML with multiple job polygons color-coded by type
 */
export function generateJobHistoryKML(jobs: JobForKml[]): string {
  const placemarks = jobs
    .filter((job) => job.polygon)
    .map((job) => {
      const polygon = typeof job.polygon === "string" ? JSON.parse(job.polygon) : job.polygon;
      if (!polygon?.coordinates) return "";

      const color = JOB_COLORS[job.jobType || ""] || "ff808080";
      const coords = geoJsonCoordsToKml(polygon.coordinates[0]);
      const dateStr = job.scheduledStart
        ? new Date(job.scheduledStart).toISOString().split("T")[0]
        : "Unknown date";

      return `
    <Placemark>
      <name>${escapeXml(job.title)}</name>
      <description>${escapeXml(`${job.jobType || "Unknown"} - ${dateStr}${job.chemicalProduct ? " - " + job.chemicalProduct : ""}`)}</description>
      <Style>
        <LineStyle><color>${color}</color><width>2</width></LineStyle>
        <PolyStyle><color>40${color.slice(2)}</color></PolyStyle>
      </Style>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing><coordinates>${coords}</coordinates></LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Job History</name>
    <description>Historical job overlays color-coded by type</description>
    ${placemarks}
  </Document>
</kml>`;
}
