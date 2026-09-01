"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@manzil/shared";
import Link from "next/link";

export function GurmanHeroComposer({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.classList.add("anim");
    const t = setTimeout(() => {
      document.documentElement.classList.remove("anim");
    }, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="stage">
      {/* Dawn Lake & Mountains Live Video Background */}
      <video
        autoPlay
        className="stage-video"
        loop
        muted
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4"
      />

      {/* Scaled UI Frame (1560×1008 Reference Block) */}
      <div className="frame">
        <input aria-hidden="true" id="menu" type="checkbox" />

        {/* Top Header Navigation */}
        <header className="nav">
          {/* Brand Left */}
          <Link className="brand" href={`/${locale}`} aria-label="Gurman AI home">
            <svg className="mark" viewBox="0 0 34 34" width="34" height="34">
              <circle cx="17" cy="17" r="17" fill="#9C86CE" />
              <circle cx="17" cy="17" r="8.6" fill="#FFFFFF" />
              <circle cx="17" cy="17" r="3.7" fill="#151519" />
            </svg>
            <span className="brand-name">Gurman AI</span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="links" aria-label="Main menu">
            <Link href={`/${locale}/discover`}>Katalog</Link>
            <Link href={`/${locale}/concierge`}>Tavsiyalar</Link>
            <Link href={`/${locale}/business`}>Biznes</Link>
            <Link href={`/${locale}/business/pricing`}>Tariflar</Link>
          </nav>

          {/* Right CTA Button */}
          <Link className="cta" href={`/${locale}/discover`}>
            <span>Boshlash</span>
          </Link>

          {/* Mobile Burger Trigger */}
          <label className="burger" htmlFor="menu" aria-label="Toggle menu">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
              <rect y="1" width="17" height="2" rx="1" fill="#FFFFFF" />
              <rect y="9" width="17" height="2" rx="1" fill="#FFFFFF" />
            </svg>
          </label>
        </header>

        {/* Mobile Dropdown Sheet */}
        <div className="sheet">
          <div className="sheet-panel">
            <Link href={`/${locale}/discover`}>Katalog</Link>
            <Link href={`/${locale}/concierge`}>Tavsiyalar</Link>
            <Link href={`/${locale}/business`}>Biznes</Link>
            <Link href={`/${locale}/business/pricing`}>Tariflar</Link>
            <Link className="sheet-cta" href={`/${locale}/discover`}>Boshlash</Link>
          </div>
        </div>

        {/* Main Center Hero */}
        <main className="hero">
          <h1 className="h1">
            Describe what you&apos;re looking for. We&apos;ll find it.
          </h1>

          {/* Composer Card with Exact Measured Desktop Right Cluster */}
          <form className="card" onSubmit={(e) => e.preventDefault()}>
            {/* Placeholder Top Band */}
            <p className="ph">
              Toshkentda unutilmas to&apos;y, shinam kechki ovqat yoki do&apos;stlar bilan uchrashuv rejalashtiring...
            </p>

            {/* Toolbar Strip (.tools) */}
            <div className="tools">
              {/* Left 3 Chips (Pills) */}
              <div className="chips">
                <button className="chip" type="button" style={{ ["--pl" as string]: 12, ["--ig" as string]: 3.7 }}>
                  {/* Filled Screen / Window Blob Icon */}
                  <svg className="chip-icon" style={{ ["--iw" as string]: 15.06 }} viewBox="0 0 16 16">
                    <path d="M2 3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3zm2 1v2h8V4H4zm8 4H4v5h8V8z" />
                  </svg>
                  <span>Restoranlar</span>
                </button>

                <button className="chip" type="button" style={{ ["--pl" as string]: 16, ["--ig" as string]: 3.9 }}>
                  {/* Filled Coffee / Place Blob Icon */}
                  <svg className="chip-icon" style={{ ["--iw" as string]: 11.8 }} viewBox="0 0 12 12">
                    <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm1 7.5H5v-1h2v1zm0-2.5H5V3h2v3z" />
                  </svg>
                  <span>Qahvaxonalar</span>
                </button>

                <button className="chip" type="button" style={{ ["--pl" as string]: 15.8, ["--ig" as string]: 2.9 }}>
                  {/* Filled Theme / Clock Blob Icon */}
                  <svg className="chip-icon" style={{ ["--iw" as string]: 12.13 }} viewBox="0 0 13 13">
                    <path d="M6.5 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm.5 3v2.8l2 1.2-.5 1-2.5-1.5V4h1z" />
                  </svg>
                  <span>Bugungi Mavzu</span>
                </button>
              </div>

              {/* Right Cluster (.right) */}
              <div className="right">
                {/* Model Label + Chevron */}
                <div className="model">
                  <span>Gurman 2.0</span>
                  <svg className="chev" viewBox="0 0 7 4" fill="none">
                    <path d="M1 1l2.5 2L6 1" stroke="#98999C" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Raw Paperclip SVG Icon */}
                <button className="attach" type="button" aria-label="Fayl biriktirish">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M14.5 6.5l-6.8 6.8a2.5 2.5 0 01-3.5-3.5l7-7a4 4 0 015.6 5.6l-7 7a5.5 5.5 0 01-7.8-7.8l6.8-6.8" />
                  </svg>
                </button>

                {/* Send Orange Circle Button (Hangs 7u below toolbar) */}
                <button className="send" type="button" aria-label="Tavsiya olish">
                  <svg viewBox="0 0 12 12">
                    <path d="M6 1l4.5 4.5h-3v5.5h-3V5.5h-3L6 1z" fill="#ffffff" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </main>

        {/* Proof Footer with Brand Logos */}
        <footer className="proof">
          <p className="proof-caption">Built for Tashkent by Manzil</p>
          <div className="logos">
            {/* Google Wordmark SVG */}
            <svg className="logo-google" viewBox="0 0 97 32" fill="currentColor">
              <path d="M12.5 24.6c-6.8 0-12.3-5.5-12.3-12.3S5.7 0 12.5 0c3.7 0 6.5 1.5 8.5 3.4l-2.4 2.4c-1.5-1.4-3.5-2.5-6.1-2.5-4.9 0-8.9 4-8.9 8.9s4 8.9 8.9 8.9c3.2 0 5-1.3 6.1-2.4.9-.9 1.6-2.2 1.8-4H12.5v-3.3h11.2c.1.6.2 1.3.2 2.1 0 2.5-.7 5.6-2.9 7.8-2.1 2.3-4.9 3.7-8.5 3.7zM33.2 24.6c-4.8 0-8.7-3.7-8.7-8.7s3.9-8.7 8.7-8.7 8.7 3.7 8.7 8.7-3.9 8.7-8.7 8.7zm0-3.3c2.9 0 5.3-2.3 5.3-5.4s-2.4-5.4-5.3-5.4-5.3 2.3-5.3 5.4 2.4 5.4 5.3 5.4zM51.8 24.6c-4.8 0-8.7-3.7-8.7-8.7s3.9-8.7 8.7-8.7 8.7 3.7 8.7 8.7-3.9 8.7-8.7 8.7zm0-3.3c2.9 0 5.3-2.3 5.3-5.4s-2.4-5.4-5.3-5.4-5.3 2.3-5.3 5.4 2.4 5.4 5.3 5.4zM69.8 24.6c-4.6 0-8.5-3.8-8.5-8.7 0-5 3.9-8.7 8.5-8.7 2.7 0 4.7 1.2 5.7 2.4l.1.1V7.7h3.3v16.4c0 6.2-3.7 8.8-8.1 8.8-4.2 0-6.7-2.8-7.7-5.1l2.9-1.2c.6 1.5 2.1 3.2 4.8 3.2 2.8 0 4.5-1.7 4.5-4.9v-1.2l-.1.1c-1 1.2-3 2.4-5.6 2.4zm.5-3.3c2.9 0 5.2-2.4 5.2-5.4 0-3.1-2.3-5.4-5.2-5.4-2.8 0-5.2 2.3-5.2 5.4 0 3 2.4 5.4 5.2 5.4zM81.5 24.1V0h3.4v24.1h-3.4zM93.3 24.6c-4.1 0-7.6-2.1-9.4-5.6l2.8-1.2c1.2 2.3 3.5 3.6 6.3 3.6 2.7 0 4.4-1.3 4.4-3.1 0-2.3-2.8-3.1-5.7-3.9-3.4-.9-7.2-2-7.2-6.5 0-3.8 3.1-6.7 7.7-6.7 3.8 0 6.6 1.8 7.9 4.7l-2.8 1.2c-.8-1.8-2.6-2.8-5.1-2.8-2.5 0-4.2 1.3-4.2 2.8 0 2 2.5 2.8 5.4 3.5 3.8.9 7.6 2.1 7.6 6.9.1 4-3.1 7.1-7.7 7.1z" />
            </svg>

            {/* Cisco Wordmark SVG */}
            <svg className="logo-cisco" viewBox="0 0 68 32" fill="currentColor">
              <path d="M4.5 13.5c-.8 0-1.5-.7-1.5-1.5V6c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5zm11 3c-.8 0-1.5-.7-1.5-1.5V3c0-.8.7-1.5 1.5-1.5S17 2.2 17 3v12c0 .8-.7 1.5-1.5 1.5zm11 3c-.8 0-1.5-.7-1.5-1.5V0c0-.8.7-1.5 1.5-1.5S28-.8 28 0v18c0 .8-.7 1.5-1.5 1.5zm11-3c-.8 0-1.5-.7-1.5-1.5V3c0-.8.7-1.5 1.5-1.5S39 2.2 39 3v12c0 .8-.7 1.5-1.5 1.5zm11-3c-.8 0-1.5-.7-1.5-1.5V6c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5zm11-3c-.8 0-1.5-.7-1.5-1.5V9c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5v3c0 .8-.7 1.5-1.5 1.5z" />
            </svg>

            {/* Adobe Wordmark SVG */}
            <svg className="logo-adobe" viewBox="0 0 89 22" fill="currentColor">
              <path d="M12.5 0L0 22h8.3l3.2-6.5h7.2l-3.3-6.5h-1.9l2.8-5.5L12.5 0zm19.8 0L24.8 22H33l1.8-4.5h8.9l1.8 4.5h8.2L46 0H32.3zm5.6 5.8l2.9 7.4h-5.8l2.9-7.4zm23.6-5.8v22h7.8c7.5 0 12.3-4.5 12.3-11S76.8 0 69.3 0h-7.8zm7.3 4.5c4.7 0 7.3 2.8 7.3 6.5s-2.6 6.5-7.3 6.5h-2.3V4.5h2.3z" />
            </svg>
          </div>
        </footer>
      </div>
    </div>
  );
}
