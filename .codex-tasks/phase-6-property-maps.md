# Phase 6: Property KML Generation + Map Enhancements

## Goal
Implement KML file generation from property polygons, support overlapping polygon drawing, and add historical job overlay visualization on property maps.

---

## Changes Required

### 1. Create/update `server/kmlGenerator.ts`
If this file already exists, enhance it. Otherwise create it.

**Functions needed:**

```typescript
/**
 * Convert a GeoJSON polygon to KML 2.2 XML format
 */
export function generateKMLFromGeoJSON(
  polygon: GeoJSON.Geometry,
  name: string,
  metadata?: Record<string, string>
): string

/**
 * Generate a multi-layer KML with job polygons color-coded by date/type
 */
export function generateJobHistoryKML(
  propertyName: string,
  propertyPolygon: GeoJSON.Geometry,
  jobs: Array<{
    id: number;
    name: string;
    date: string;
    product?: string;
    status?: string;
    polygon?: GeoJSON.Geometry;
  }>
): string
```

**KML format requirements:**
- Valid KML 2.2 with proper XML declaration and namespace
- Property boundary as a Folder with the main polygon
- Each job as a separate Placemark with:
  - Name: job name + date
  - Description: product used, status
  - Style: color based on job date (newer = more opaque, older = more transparent)
  - Polygon geometry from the job's coverage area (or property boundary if no job polygon)

**Example KML output structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Property: {name}</name>
    <Folder>
      <name>Property Boundary</name>
      <Placemark>
        <name>{name}</name>
        <Polygon>
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>lng,lat,0 lng,lat,0 ...</coordinates>
            </LinearRing>
          </outerBoundaryIs>
        </Polygon>
      </Placemark>
    </Folder>
    <Folder>
      <name>Job History</name>
      <!-- Job placemarks here -->
    </Folder>
  </Document>
</kml>
```

### 2. `server/routers.ts` - Add KML download endpoint
Add to the sites router:

```typescript
downloadKML: protectedProcedure
  .input(z.object({
    siteId: z.number(),
    includeJobHistory: z.boolean().optional().default(false),
  }))
  .query(async ({ ctx, input }) => {
    const site = await db.getSiteById(input.siteId);
    if (!site || !site.polygon) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Property or polygon not found" });
    }

    if (input.includeJobHistory) {
      const jobs = await db.getJobsBySiteId(input.siteId);
      return generateJobHistoryKML(site.name, site.polygon, jobs);
    }

    return generateKMLFromGeoJSON(site.polygon, site.name);
  }),
```

### 3. `client/src/components/SiteMapDrawer.tsx` - Multi-polygon support
Update the map drawer to support:
- Drawing multiple overlapping polygons on the same property
- Store as GeoJSON `MultiPolygon` type when multiple polygons exist
- Each polygon gets its own color/opacity
- Total acreage is sum of all polygon areas
- "Add Another Polygon" button
- Ability to delete individual polygons from the set

### 4. Create `client/src/components/PropertyJobHistory.tsx`
New component for viewing job history overlaid on a property map:

```tsx
interface PropertyJobHistoryProps {
  siteId: number;
  propertyPolygon: GeoJSON.Geometry;
  centerLat: number;
  centerLng: number;
}
```

**Features:**
- Google Map centered on property
- Property boundary drawn as a polygon (blue outline)
- Each historical job drawn as a colored overlay:
  - Color varies by job type or product
  - Opacity varies by age (recent = more opaque)
- Legend showing job types/products with their colors
- Date range filter (show jobs from date X to date Y)
- Click on a job polygon to see details (date, product, status)
- "Download KML" button that calls `sites.downloadKML` with `includeJobHistory: true`

### 5. `client/src/pages/Sites.tsx` (Properties page)
Add to the property detail view:
- **"Download KML" button** - calls `sites.downloadKML`, triggers file download
- **"Job History" tab or section** - renders `PropertyJobHistory` component
- **GPS coordinate input** - add lat/lng text fields with a "Use GPS Instead" toggle
  - When toggled, hide address fields and show lat/lng fields
  - On save, if GPS provided, optionally reverse-geocode to fill address using existing `server/_core/map.ts`

### 6. GPS coordinate input for property creation
In the property creation form:
- Add toggle: "Enter Address" vs "Enter GPS Coordinates"
- Address mode: existing address/city/state/zip fields
- GPS mode: latitude and longitude number inputs
- Map click should also set coordinates in GPS mode
- Reverse geocode GPS to address on save (best effort, don't fail if geocoding fails)

---

## Verification
```bash
npm run build
```
- Draw a polygon on a property -> save -> polygon persists
- Draw multiple overlapping polygons -> save -> all persist as MultiPolygon
- Click "Download KML" -> browser downloads a `.kml` file
- Open KML in Google Earth -> polygon displays correctly
- View "Job History" on a property with jobs -> see colored overlays
- Create a property with GPS coordinates only -> map centers on those coordinates
- Date filter on job history works
