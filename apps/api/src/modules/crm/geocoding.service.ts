import { Injectable, Logger } from "@nestjs/common";

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

/**
 * Address → coordinates via the OpenStreetMap Nominatim API (no key needed).
 * Nominatim usage policy requires a descriptive User-Agent and light traffic;
 * we call it once per business registration/address change and never block
 * the request on failure.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocode(address: string, district?: string, city = "Tashkent"): Promise<GeocodeResult | null> {
    const query = [address, district, city, "Uzbekistan"].filter(Boolean).join(", ");

    try {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("q", query);
      url.searchParams.set("limit", "1");
      url.searchParams.set("countrycodes", "uz");

      const response = await fetch(url, {
        headers: {
          "User-Agent": "ManzilPlatform/1.0 (business onboarding geocoder)"
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!response.ok) {
        return null;
      }

      const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      const first = results[0];

      if (!first) {
        return null;
      }

      return {
        lat: Number(first.lat),
        lng: Number(first.lon),
        displayName: first.display_name
      };
    } catch (error) {
      this.logger.warn(`Geocoding failed for "${query}": ${(error as Error).message}`);
      return null;
    }
  }
}
