import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";
import { CategoryEditor } from "@/components/category-editor";

export const dynamic = "force-dynamic";

type Category = {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  parentId: string | null;
  businessCount: number;
};

export default async function CategoriesPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("business.view")) return <AccessDenied />;

  const res = await consoleGet<{ categories: Category[] }>("/categories");
  const categories = res.ok ? res.data.categories : [];
  const canManage = me.permissions.includes("category.manage");

  const empty = categories.filter((category) => category.businessCount === 0);

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="The taxonomy behind the landing page category grid"
      />

      {!res.ok ? <p className="mb-4 text-sm text-bad">{res.error}</p> : null}

      {empty.length > 0 ? (
        <div className="mb-5 card p-4">
          <p className="text-sm text-muted">
            <strong className="text-fg">{empty.length}</strong> of {categories.length} categories
            have no businesses. These render a &quot;be the first to list here&quot; prompt on the
            landing page rather than an empty grid cell — but a category with no realistic path to
            filling is better deleted than shown.
          </p>
        </div>
      ) : null}

      {canManage ? (
        <div className="mb-5">
          <CategoryEditor categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn }))} />
        </div>
      ) : null}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-medium">Slug</th>
                <th className="px-3 py-2 font-medium">English</th>
                <th className="px-3 py-2 font-medium">O&apos;zbekcha</th>
                <th className="px-3 py-2 font-medium">Русский</th>
                <th className="px-3 py-2 text-right font-medium">Businesses</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-muted" colSpan={5}>
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{category.slug}</td>
                    <td className="px-3 py-2">{category.nameEn}</td>
                    <td className="px-3 py-2">{category.nameUz}</td>
                    <td className="px-3 py-2">{category.nameRu}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {category.businessCount === 0 ? (
                        <Badge tone="warn">empty</Badge>
                      ) : (
                        category.businessCount
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
