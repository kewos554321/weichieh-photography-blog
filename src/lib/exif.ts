import exifr from "exifr";

export interface ExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  date?: string;
  latitude?: number;
  longitude?: number;
}

export async function extractExif(file: File): Promise<ExifData> {
  try {
    const exif = await exifr.parse(file, {
      // Tags we want to extract
      pick: [
        "Make",
        "Model",
        "LensModel",
        "LensMake",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
        "DateTimeOriginal",
        "GPSLatitude",
        "GPSLongitude",
      ],
      // Enable GPS parsing
      gps: true,
    });

    if (!exif) {
      return {};
    }

    const result: ExifData = {};

    // Camera (Make + Model)
    if (exif.Make || exif.Model) {
      const make = exif.Make?.trim() || "";
      const model = exif.Model?.trim() || "";
      // Avoid duplicating make in model (e.g., "SONY ILCE-7M3" -> "Sony ILCE-7M3")
      if (model.toLowerCase().startsWith(make.toLowerCase())) {
        result.camera = model;
      } else {
        result.camera = `${make} ${model}`.trim();
      }
    }

    // Lens
    if (exif.LensModel) {
      result.lens = exif.LensModel;
    } else if (exif.LensMake) {
      result.lens = exif.LensMake;
    }

    // Aperture (f/2.8)
    if (exif.FNumber) {
      result.aperture = `f/${exif.FNumber}`;
    }

    // Shutter Speed (1/250s or 2s)
    if (exif.ExposureTime) {
      const exposure = exif.ExposureTime;
      if (exposure >= 1) {
        result.shutterSpeed = `${exposure}s`;
      } else {
        result.shutterSpeed = `1/${Math.round(1 / exposure)}s`;
      }
    }

    // ISO
    if (exif.ISO) {
      result.iso = `ISO ${exif.ISO}`;
    }

    // Focal Length (35mm)
    if (exif.FocalLength) {
      result.focalLength = `${exif.FocalLength}mm`;
    }

    // Date (YYYY-MM-DD)
    if (exif.DateTimeOriginal) {
      const date = new Date(exif.DateTimeOriginal);
      if (!isNaN(date.getTime())) {
        result.date = date.toISOString().split("T")[0];
      }
    }

    // GPS coordinates
    if (exif.latitude && exif.longitude) {
      result.latitude = exif.latitude;
      result.longitude = exif.longitude;
    }

    return result;
  } catch (error) {
    console.error("Failed to extract EXIF:", error);
    return {};
  }
}

// Format EXIF data for display
export function formatExifSummary(exif: ExifData): string {
  const parts: string[] = [];

  if (exif.aperture) parts.push(exif.aperture);
  if (exif.shutterSpeed) parts.push(exif.shutterSpeed);
  if (exif.iso) parts.push(exif.iso);
  if (exif.focalLength) parts.push(exif.focalLength);

  return parts.join(" · ");
}
