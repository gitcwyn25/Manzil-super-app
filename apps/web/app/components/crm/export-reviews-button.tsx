"use client";

type ReviewRow = {
  author: string;
  rating: number;
  text: string;
  date: string;
  reply: string;
};

function csvEscape(value: string | number) {
  const raw = String(value);
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

/** Client-side CSV export — no server round-trip needed. */
export function ExportReviewsButton({
  reviews,
  fileName,
  label
}: {
  reviews: ReviewRow[];
  fileName: string;
  label: string;
}) {
  function download() {
    const header = ["author", "rating", "text", "date", "reply"];
    const lines = [
      header.join(","),
      ...reviews.map((row) =>
        [row.author, row.rating, row.text, row.date, row.reply].map(csvEscape).join(",")
      )
    ];
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button className="bz-btn-ghost" disabled={reviews.length === 0} onClick={download} type="button">
      {label}
    </button>
  );
}
