"use client";

import type { Locale } from "@manzil/shared";
import { type IconName } from "../vm/icons";
import {
  BUSINESS_CATEGORY_GROUPS,
  type GroupDefinition,
  type LeafDefinition,
  type LocalizedCopy
} from "../../lib/business-categories";
import {
  ShiftingDropDown,
  type ShiftingDropDownCategory,
  type ShiftingDropDownGroup
} from "../../../components/ui/shifting-dropdown";

export type { GroupDefinition, LeafDefinition, LocalizedCopy } from "../../lib/business-categories";
export {
  BUSINESS_CATEGORY_GROUPS,
  BUSINESS_CATEGORY_PARENT_BY_SLUG,
  MARKETPLACE_PARENT_CATEGORY_SLUGS
} from "../../lib/business-categories";

export interface CategoryItem {
  id: string;
  slug: string;
  name: Record<Locale, string>;
  icon: IconName;
  color: string;
  bgGradient: string;
}

function toCategoryItem(
  slug: string,
  label: LocalizedCopy,
  color: string,
  id = slug,
  icon: IconName = "circle"
): CategoryItem {
  return { id, slug, name: label, icon, color, bgGradient: "none" };
}

export const MARKETPLACE_CATEGORIES: CategoryItem[] = BUSINESS_CATEGORY_GROUPS.flatMap((group) => [
  toCategoryItem(group.rootSlug, group.label, group.accent, group.id, group.icon),
  ...group.categories.map((category) =>
    toCategoryItem(category.slug, category.label, category.color ?? group.accent, category.id, category.icon ?? "circle")
  )
]);

export const MARKETPLACE_CATEGORY_GROUPS: ShiftingDropDownGroup[] = BUSINESS_CATEGORY_GROUPS.map((group) => ({
  id: group.id,
  rootSlug: group.rootSlug,
  label: group.label,
  description: group.description,
  icon: group.icon,
  accent: group.accent,
  categories: group.categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    icon: category.icon ?? "circle",
    color: category.color ?? group.accent
  } satisfies ShiftingDropDownCategory))
}));

export function CategoryStrip({
  locale,
  selectedCategory,
  onSelectCategory,
  onViewAll
}: {
  locale: Locale;
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onViewAll?: () => void;
}) {
  return (
    <section
      aria-label={locale === "uz" ? "Biznes kategoriyalari" : locale === "ru" ? "Категории бизнеса" : "Business categories"}
      className="category-strip-section"
    >
      <div className="container">
        <ShiftingDropDown
          groups={MARKETPLACE_CATEGORY_GROUPS}
          locale={locale}
          onSelectCategory={onSelectCategory}
          onViewAll={onViewAll}
          selectedCategory={selectedCategory}
        />
      </div>
    </section>
  );
}
