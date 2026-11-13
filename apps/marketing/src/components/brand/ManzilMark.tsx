import { cn } from "@/lib/utils";

/**
 * Official Manzil symbol: exactly three stacked curved layers + one small rounded square.
 * Traced 1:1 from the supplied brand artwork (no redrawn approximation). Never reduce the layers.
 * Fill follows `currentColor` so it works on ink, paper and high-contrast contexts.
 */
const MARK_PATH =
  "M6835 9539 c-1056 -7 -1129 -9 -1311 -44 -328 -63 -677 -281 -910 -568 -56 -69 -239 -339 -399 -587 -23 -36 -75 -117 -116 -180 -383 -590 -449 -693 -445 -698 2 -1 38 19 81 44 169 102 398 182 660 231 l140 27 1735 6 c1885 7 1760 3 1984 61 323 82 627 280 877 569 124 145 357 487 529 780 56 96 129 217 161 269 33 51 59 95 59 97 0 6 -1785 2 -3045 -7z M9630 7368 c-153 -61 -354 -113 -585 -151 -129 -21 -144 -21 -2100 -27 l-1970 -6 -118 -22 c-353 -67 -637 -219 -897 -481 -191 -191 -289 -337 -784 -1165 -108 -181 -195 -330 -193 -332 1 -2 54 23 117 55 169 84 336 138 575 184 109 21 124 21 2110 27 1100 4 2014 10 2030 14 17 4 75 17 130 28 180 36 378 120 555 236 394 257 673 621 1100 1432 62 118 117 221 123 228 15 19 -9 14 -93 -20z M8290 5094 c-166 -45 -311 -186 -372 -362 l-23 -67 0 -645 0 -645 23 -57 c51 -126 176 -219 322 -239 45 -7 323 -9 734 -7 645 3 662 4 718 25 116 43 205 128 250 240 l23 58 0 700 0 700 -36 75 c-45 93 -110 159 -197 202 l-67 33 -660 2 c-557 2 -669 0 -715 -13z M4135 4905 c-515 -72 -910 -342 -1198 -823 -114 -189 -447 -827 -447 -856 0 -4 669 -5 1488 -3 1327 3 1498 5 1587 20 373 61 649 208 930 491 138 140 189 211 389 548 96 161 220 368 275 459 56 91 101 169 101 173 0 13 -3029 5 -3125 -9z";

export function ManzilMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="244 294 758 656"
      className={cn("block h-auto", className)}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <g transform="translate(0,1254) scale(0.1,-0.1)">
        <path d={MARK_PATH} />
      </g>
    </svg>
  );
}

/**
 * Horizontal lockup: symbol + "Manzil" set in the brand sans.
 * The approved rotated-mark-as-M wordmark needs the official vector before it can replace this.
 */
export function ManzilLockup({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ManzilMark className={cn("w-7 text-lime", markClassName)} />
      <span className="font-display text-[1.3rem] font-extrabold leading-none tracking-[-0.04em]">
        Manzil
      </span>
    </span>
  );
}
