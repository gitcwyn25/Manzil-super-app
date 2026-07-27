import {
  extensionForType,
  isAllowedImageType,
  matchesMagicNumber,
  MAX_IMAGE_BYTES
} from "./upload-policy";

describe("upload policy", () => {
  describe("isAllowedImageType", () => {
    it("accepts the four allowed image types", () => {
      for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
        expect(isAllowedImageType(type)).toBe(true);
      }
    });

    it("rejects executables and documents regardless of how they are labelled", () => {
      for (const type of ["application/x-msdownload", "text/html", "application/pdf", "image/svg+xml"]) {
        expect(isAllowedImageType(type)).toBe(false);
      }
    });

    it("rejects undefined and empty input", () => {
      expect(isAllowedImageType(undefined)).toBe(false);
      expect(isAllowedImageType("")).toBe(false);
    });

    it("rejects SVG specifically — it can carry script", () => {
      expect(isAllowedImageType("image/svg+xml")).toBe(false);
    });
  });

  describe("extensionForType", () => {
    it("derives the extension from the accepted type, never from a filename", () => {
      expect(extensionForType("image/jpeg")).toBe("jpg");
      expect(extensionForType("image/png")).toBe("png");
      expect(extensionForType("image/webp")).toBe("webp");
      expect(extensionForType("image/avif")).toBe("avif");
    });
  });

  describe("matchesMagicNumber", () => {
    it("accepts a real JPEG header", () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(matchesMagicNumber(jpeg, "image/jpeg")).toBe(true);
    });

    it("accepts a real PNG header", () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
      expect(matchesMagicNumber(png, "image/png")).toBe(true);
    });

    it("rejects an executable renamed to look like an image", () => {
      // "MZ" — a Windows PE header. This is the case a filename-extension
      // check cannot catch, which is why the byte check exists.
      const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
      expect(matchesMagicNumber(exe, "image/jpeg")).toBe(false);
      expect(matchesMagicNumber(exe, "image/png")).toBe(false);
    });

    it("rejects a JPEG claiming to be a PNG", () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(matchesMagicNumber(jpeg, "image/png")).toBe(false);
    });

    it("reads AVIF's ftyp box at offset 4, not offset 0", () => {
      const avif = Buffer.from([
        0x00, 0x00, 0x00, 0x20, // box size
        0x66, 0x74, 0x79, 0x70 // "ftyp"
      ]);
      expect(matchesMagicNumber(avif, "image/avif")).toBe(true);
    });

    it("does not read past a truncated buffer", () => {
      expect(matchesMagicNumber(Buffer.from([0x89]), "image/png")).toBe(false);
      expect(matchesMagicNumber(Buffer.alloc(0), "image/jpeg")).toBe(false);
    });
  });

  it("caps uploads at 8MB", () => {
    expect(MAX_IMAGE_BYTES).toBe(8 * 1024 * 1024);
  });
});
