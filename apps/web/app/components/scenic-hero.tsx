/**
 * Full-bleed illustrated landscape for the landing hero — dawn sky,
 * layered mountain ridges, and pine silhouettes. Pure SVG/CSS, no images.
 * Server-renderable.
 */
export function ScenicBackdrop() {
  return (
    <div aria-hidden="true" className="scenic">
      <div className="scenic-sky" />
      <div className="scenic-haze" />

      {/* Far ridges */}
      <svg className="scenic-ridge ridge-far" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path d="M0 220 L90 190 L180 210 L300 150 L420 200 L560 130 L700 190 L840 140 L980 200 L1120 150 L1260 195 L1360 165 L1440 190 L1440 320 L0 320 Z" fill="currentColor" />
      </svg>

      {/* Mid ridges */}
      <svg className="scenic-ridge ridge-mid" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path d="M0 250 L120 200 L240 240 L380 170 L520 235 L660 180 L800 245 L950 185 L1100 240 L1240 195 L1370 235 L1440 215 L1440 320 L0 320 Z" fill="currentColor" />
      </svg>

      {/* Near ridge */}
      <svg className="scenic-ridge ridge-near" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path d="M0 285 L160 235 L330 280 L480 225 L650 278 L820 230 L990 282 L1150 240 L1310 280 L1440 255 L1440 320 L0 320 Z" fill="currentColor" />
      </svg>

      {/* Pine cluster — left */}
      <svg className="scenic-pines pines-left" viewBox="0 0 200 300">
        <g fill="currentColor">
          <path d="M40 300 L40 210 L20 240 L34 232 L12 268 L30 258 L6 300 Z" />
          <path d="M46 300 L46 190 L62 226 L50 220 L74 258 L58 250 L84 300 Z" />
          <path d="M110 300 L110 150 L86 195 L102 187 L74 240 L96 228 L64 290 L100 272 L92 300 Z" />
          <path d="M118 300 L118 165 L142 208 L126 200 L156 250 L132 238 L166 300 Z" />
        </g>
      </svg>

      {/* Pine cluster — right */}
      <svg className="scenic-pines pines-right" viewBox="0 0 200 300">
        <g fill="currentColor">
          <path d="M90 300 L90 140 L64 190 L82 182 L52 240 L76 226 L42 292 L80 272 L72 300 Z" />
          <path d="M100 300 L100 170 L126 215 L108 207 L140 262 L114 248 L152 300 Z" />
          <path d="M160 300 L160 220 L142 250 L154 244 L132 280 L150 270 L128 300 Z" />
        </g>
      </svg>

      <div className="scenic-fade" />
    </div>
  );
}
