"use client";

import { useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";
import { PhotoUpload, type UploadedPhoto } from "./photo-upload";

export type ManagedPhoto = {
  id: string;
  publicUrl: string | null;
  moderationStatus: "pending" | "approved" | "rejected";
  isCover: boolean;
};

export type PhotoManagerCopy = {
  uploadLabel: string;
  makeCover: string;
  isCoverLabel: string;
  pendingLabel: string;
  empty: string;
};

/**
 * The photo manager used by both the register/photos step and
 * dashboard/settings: mounts the existing `PhotoUpload`, shows what has been
 * uploaded so far, and lets the owner pick which approved photo is the
 * cover. One component so both surfaces stay in sync rather than drifting
 * into two slightly different photo UIs.
 *
 * Cover changes are applied optimistically against local state and confirmed
 * against the API directly (mirroring `PhotoUpload`'s own Clerk-token
 * pattern) rather than through a server action, so a click updates the grid
 * immediately instead of waiting on a full page round trip.
 */
export function BusinessPhotoManager({
  businessSlug,
  initialPhotos,
  copy
}: {
  businessSlug: string;
  initialPhotos: ManagedPhoto[];
  copy: PhotoManagerCopy;
}) {
  const [photos, setPhotos] = useState<ManagedPhoto[]>(initialPhotos);
  const [pendingCoverId, setPendingCoverId] = useState<string | null>(null);

  function handleUploaded(photo: UploadedPhoto) {
    setPhotos((current) => [
      { id: photo.photoId, publicUrl: photo.publicUrl, moderationStatus: photo.moderationStatus, isCover: photo.isCover },
      // Mirrors what the API just did server-side: an auto-covered new photo
      // replaces whichever one held that spot before.
      ...(photo.isCover ? current.map((existing) => ({ ...existing, isCover: false })) : current)
    ]);
  }

  async function makeCover(photoId: string) {
    setPendingCoverId(photoId);

    try {
      const clerk = (
        globalThis as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }
      ).Clerk;
      const token = await clerk?.session?.getToken().catch(() => null);

      const response = await fetch(`${API_BASE_URL}/media/photos/${photoId}/cover`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        return;
      }

      setPhotos((current) => current.map((photo) => ({ ...photo, isCover: photo.id === photoId })));
    } finally {
      setPendingCoverId(null);
    }
  }

  return (
    <div className="photo-manager">
      <PhotoUpload label={copy.uploadLabel} onUploaded={handleUploaded} ownerId={businessSlug} ownerType="business" />

      {photos.length > 0 ? (
        <ul className="photo-manager__grid">
          {photos.map((photo) => (
            <li className="photo-manager__item" key={photo.id}>
              {photo.publicUrl ? (
                <img alt="" className="photo-manager__thumb" loading="lazy" src={photo.publicUrl} />
              ) : (
                <span className="photo-manager__thumb" />
              )}

              {photo.isCover ? (
                <span className="photo-manager__badge">{copy.isCoverLabel}</span>
              ) : photo.moderationStatus === "approved" ? (
                <button
                  className="photo-manager__cover-btn"
                  disabled={pendingCoverId === photo.id}
                  onClick={() => makeCover(photo.id)}
                  type="button"
                >
                  {copy.makeCover}
                </button>
              ) : (
                <span className="photo-manager__badge photo-manager__badge--pending">{copy.pendingLabel}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="crm-hint">{copy.empty}</p>
      )}
    </div>
  );
}
