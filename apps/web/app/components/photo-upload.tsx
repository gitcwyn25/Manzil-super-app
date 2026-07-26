"use client";

import { useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";

/** Mirrors the API's MIME allowlist; the server re-validates and signs these into the upload URL. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export type UploadedPhoto = { photoId: string; publicUrl: string | null };

type PresignResponse = {
  data: {
    photoId: string;
    uploadUrl: string;
    requiredHeaders: Record<string, string>;
    publicUrl: string | null;
  };
};

/**
 * Two-step upload against the existing presign endpoint: ask the API to
 * authorise one specific file, then PUT the bytes straight to R2.
 *
 * The bytes never pass through the API, which is the point of presigning —
 * but it also means the browser must replay `requiredHeaders` verbatim, since
 * Content-Type and Content-Length are signed into the URL. Anything else fails
 * R2's signature check.
 */
export function PhotoUpload({
  ownerType,
  ownerId,
  label,
  onUploaded,
  disabled
}: {
  ownerType: "business" | "review";
  ownerId: string;
  label: string;
  onUploaded?: (photo: UploadedPhoto) => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<UploadedPhoto[]>([]);

  async function handleFile(file: File, token: string | null) {
    // Checked before asking for a URL so the user gets an instant, specific
    // reason rather than a round trip ending in a 400.
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Faqat JPEG, PNG, WebP yoki AVIF rasmlar qabul qilinadi.");
      return;
    }

    if (file.size > MAX_BYTES) {
      setError(`Rasm hajmi ${Math.floor(MAX_BYTES / (1024 * 1024))}MB dan oshmasligi kerak.`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const presignResponse = await fetch(`${API_BASE_URL}/media/presign`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ownerType,
          ownerId,
          contentType: file.type,
          contentLength: file.size
        })
      });

      if (!presignResponse.ok) {
        const body = await presignResponse.json().catch(() => null);
        const message = body?.message;
        setError(
          Array.isArray(message)
            ? message.join(". ")
            : typeof message === "string"
              ? message
              : "Rasmni yuklab bo'lmadi."
        );
        return;
      }

      const { data } = (await presignResponse.json()) as PresignResponse;

      // Headers must match exactly what was signed, or R2 rejects the PUT.
      const putResponse = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: data.requiredHeaders,
        body: file
      });

      if (!putResponse.ok) {
        setError("Rasmni saqlab bo'lmadi. Qayta urinib ko'ring.");
        return;
      }

      const photo = { photoId: data.photoId, publicUrl: data.publicUrl };
      setUploaded((current) => [...current, photo]);
      onUploaded?.(photo);
    } catch {
      setError("Tarmoq xatosi. Internet aloqasini tekshiring.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="photo-upload">
      <label className="photo-upload__label">
        <span>{label}</span>
        <input
          accept={ALLOWED_TYPES.join(",")}
          disabled={disabled || uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            // Clerk's token is read lazily so this component works on pages
            // that render before a session resolves.
            const token = await getClerkToken();
            await handleFile(file, token);

            // Reset so selecting the same file twice still fires onChange.
            event.target.value = "";
          }}
          type="file"
        />
      </label>

      {uploading ? <p className="photo-upload__status">Yuklanmoqda…</p> : null}
      {error ? <p className="photo-upload__error">{error}</p> : null}

      {uploaded.length > 0 ? (
        <p className="photo-upload__status">
          {uploaded.length} ta rasm yuklandi. Moderatsiyadan so&apos;ng ko&apos;rinadi.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Reads the Clerk session token from the global Clerk object.
 *
 * Done this way rather than with `useAuth()` so this component can be dropped
 * into a server-rendered form without forcing its parent to become a client
 * component purely to pass a token down.
 */
async function getClerkToken(): Promise<string | null> {
  const clerk = (globalThis as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
    .Clerk;

  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}
