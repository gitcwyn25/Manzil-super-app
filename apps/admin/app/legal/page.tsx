import { consoleGet, getMe } from "@/lib/console";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AccessDenied } from "@/components/access-denied";
import { PublishLegalForm } from "@/components/publish-legal-form";
import { Badge, PageHeader, timeAgo } from "@/lib/ui";

export const dynamic = "force-dynamic";

type LegalDocument = {
  id: string;
  kind: string;
  version: string;
  locale: string;
  title: string;
  body: string;
  publishedAt: string | null;
  acceptanceCount: number;
  contractCount: number;
  createdAt: string;
};

export default async function LegalPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("legal.view")) return <AccessDenied />;

  const res = await consoleGet<{ documents: LegalDocument[] }>("/legal");
  const documents = res.ok ? res.data.documents : [];

  return (
    <>
      <PageHeader title="Legal documents" subtitle="Terms, privacy policy, and the contract template accepted at registration" />

      {!res.ok ? <Alert variant="destructive" className="mb-5"><AlertTitle>Legal register unavailable</AlertTitle><AlertDescription>{res.error}</AlertDescription></Alert> : null}

      <Alert className="mb-5">
        <AlertTitle>Versioned, never edited in place</AlertTitle>
        <AlertDescription>
          Each acceptance points to one exact document version. Publishing a new version preserves the historical record of what every business agreed to.
        </AlertDescription>
      </Alert>

      {me.permissions.includes("legal.publish") ? <div className="mb-5"><PublishLegalForm /></div> : null}

      {documents.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted">{res.ok ? "No documents published yet. Business registration cannot record a terms acceptance until a terms_of_service version exists." : "No legal data was returned."}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-fg">{document.title}</h2>
                    <p className="mt-1 text-xs text-muted">{document.kind.replace(/_/g, " ")} · v{document.version} · {document.locale}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={document.publishedAt ? "good" : "warn"}>{document.publishedAt ? "published" : "draft"}</Badge>
                    <Badge tone="muted">{document.acceptanceCount} accepted</Badge>
                    {document.contractCount > 0 ? <Badge tone="muted">{document.contractCount} contracts</Badge> : null}
                  </div>
                </div>
                <details className="mt-4 rounded-md border border-border bg-background/50 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-muted">View document text</summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-fg">{document.body}</pre>
                </details>
                <p className="mt-3 text-xs text-muted">Published {document.publishedAt ? timeAgo(document.publishedAt) : "—"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
