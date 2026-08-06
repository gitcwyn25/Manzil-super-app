"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";
import { Icon } from "./vm/icons";

/**
 * Helpful vote toggle.
 *
 * The count is optimistic but the server is authoritative: its response
 * carries the recounted total, so a rejected vote (own review, already voted
 * from another tab) snaps back to the truth rather than leaving an inflated
 * number on screen.
 */
export function HelpfulButton({
  reviewId,
  initialCount,
  initialVoted,
  label
}: {
  reviewId: string;
  initialCount: number;
  initialVoted: boolean;
  label: string;
}) {
  const { getToken, isSignedIn } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isSignedIn || pending) return;

    setPending(true);

    // Optimistic flip so the button feels immediate on a slow connection.
    const previousCount = count;
    const previousVoted = voted;
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        setCount(previousCount);
        setVoted(previousVoted);
        return;
      }

      const { data } = await response.json();
      setCount(data.helpfulCount);
      setVoted(data.voted);
    } catch {
      setCount(previousCount);
      setVoted(previousVoted);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      aria-pressed={voted}
      className={`helpful-button${voted ? " is-voted" : ""}`}
      disabled={!isSignedIn || pending}
      onClick={toggle}
      title={isSignedIn ? undefined : "Ovoz berish uchun tizimga kiring"}
      type="button"
    >
      <Icon name="thumbs_up" size={14} /> {count} {label}
    </button>
  );
}
