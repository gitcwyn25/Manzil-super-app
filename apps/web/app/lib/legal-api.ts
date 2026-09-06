import { API_BASE_URL } from "./api-base-url";
import { fetchWithTimeout } from "./fetch-with-timeout";
import { getServerAuthHeaders } from "./auth";

/** Server-side helpers for legal documents and contracts. */

export type RegistrationTerms = {
  terms: { id: string; version: string; title: string; body: string } | null;
  privacy: { id: string; version: string; title: string; body: string } | null;
  contractTemplateVersion: string | null;
};

export type BusinessContract = {
  id: string;
  contractNo: string;
  templateVersion: string;
  title: string;
  body: string;
  generatedAt: string;
};

export type AcceptedDocument = {
  id: string;
  kind: string;
  version: string;
  title: string;
  locale: string;
  acceptedAt: string;
};

/**
 * Public — no auth. The registration form renders the terms before the user has
 * committed to anything, and requiring a session to read them would mean
 * agreeing before reading.
 *
 * Returns an all-null shape on failure so registration still renders; the form
 * shows its "no terms published" notice rather than erroring.
 */
export async function getRegistrationTerms(locale = "uz"): Promise<RegistrationTerms> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/legal/registration-terms?locale=${locale}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return { terms: null, privacy: null, contractTemplateVersion: null };
    }

    const payload = await response.json();
    return payload.data as RegistrationTerms;
  } catch {
    return { terms: null, privacy: null, contractTemplateVersion: null };
  }
}

async function legalGet<T>(path: string): Promise<T | null> {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    headers: await getServerAuthHeaders(path),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data as T;
}

export function getBusinessContract(slug: string) {
  return legalGet<{ contract: BusinessContract }>(`/legal/businesses/${slug}/contract`);
}

export function getBusinessAcceptances(slug: string) {
  return legalGet<{ acceptances: AcceptedDocument[] }>(`/legal/businesses/${slug}/acceptances`);
}
