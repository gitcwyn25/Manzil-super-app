import { consoleGet, getMe } from "@/lib/console";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
      <PageHeader title="Categories" subtitle="The taxonomy behind the landing page category grid" />

      {!res.ok ? (
        <Alert variant="destructive" className="mb-5"><AlertTitle>Category catalog unavailable</AlertTitle><AlertDescription>{res.error}</AlertDescription></Alert>
      ) : null}

      {empty.length > 0 ? (
        <Alert className="mb-5">
          <AlertTitle>{empty.length} empty categories need a decision</AlertTitle>
          <AlertDescription>
            These categories currently have no businesses. Keep them only when there is a realistic path to filling them; otherwise remove them rather than exposing an empty grid cell.
          </AlertDescription>
        </Alert>
      ) : null}

      {canManage ? <div className="mb-5"><CategoryEditor categories={categories.map((category) => ({ id: category.id, nameEn: category.nameEn }))} /></div> : null}

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Slug</TableHead><TableHead>English</TableHead><TableHead>O&apos;zbekcha</TableHead><TableHead>Русский</TableHead><TableHead className="text-right">Businesses</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-data text-xs">{category.slug}</TableCell>
                    <TableCell>{category.nameEn}</TableCell>
                    <TableCell>{category.nameUz}</TableCell>
                    <TableCell>{category.nameRu}</TableCell>
                    <TableCell className="text-right tabular-nums">{category.businessCount === 0 ? <Badge tone="warn">empty</Badge> : category.businessCount}</TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-sm text-muted">{res.ok ? "No categories yet." : "No category data was returned."}</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
