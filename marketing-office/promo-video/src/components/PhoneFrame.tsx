import React from "react";
import { color, radius } from "../theme";

// Neutral phone shell to house mobile content (consumer discovery scene).
export const PhoneFrame: React.FC<{
  width: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, children, style }) => {
  const height = Math.round(width * (19.5 / 9));
  const bezel = Math.round(width * 0.03);
  return (
    <div
      style={{
        width,
        height,
        background: "#0c0d0d",
        borderRadius: width * 0.14,
        padding: bezel,
        boxShadow: "0px 40px 100px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.06)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          background: color.surface,
          borderRadius: width * 0.11,
          overflow: "hidden",
        }}
      >
        {/* notch */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.36,
            height: bezel * 2.1,
            background: "#0c0d0d",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            zIndex: 5,
          }}
        />
        {children}
      </div>
    </div>
  );
};
