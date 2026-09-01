// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import PixelCard from "@/components/originkit/ui/hero-06/pixel-card";

/**
 * PixelCard field for the annulus between outer + inner concentric rings.
 * Props match the Framer PixelCard control panel.
 */
export const PixelBackground = () => {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <PixelCard
        colors={["#fff", "#FFFFFFCC", "#FFFFFF99"]}
        appearFrom="middle"
        trigger="enter"
        position="middle"
        replay={false}
        gap={14}
        pixelSize={7.6}
        speed={80}
        backgroundColor="#F8F5EE"
        padding={0}
        borderWidth={0}
        borderColor="transparent"
        radius={0}
        showLabel={false}
        transition={{ type: "tween", duration: 0.8, ease: "easeOut" }}
        style={{
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
      />
    </div>
  );
};
