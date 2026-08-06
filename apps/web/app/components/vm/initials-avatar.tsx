const ACCENTS = ["primary", "secondary", "tertiary"] as const;

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "•";
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/** Deterministic: the same name always lands on the same accent tint. */
function accentOf(name: string): (typeof ACCENTS)[number] {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % ACCENTS.length;
  }
  return ACCENTS[hash];
}

/**
 * Circle avatar built from a person's initials — reviews, bookings,
 * customer lists. The API exposes no avatar photos (Review has no avatar
 * field), so initials are the honest visual. Decorative: the name itself is
 * rendered as text beside it by every consumer.
 */
export function InitialsAvatar({
  name,
  size = "md",
  className
}: {
  name: string;
  /** sm=32px, md=40px, lg=48px. */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const classes = [
    "vm-avatar",
    `vm-avatar--${size}`,
    `vm-avatar--${accentOf(name)}`,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span aria-hidden="true" className={classes}>
      {initialsOf(name)}
    </span>
  );
}
