import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader, timeAgo } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";
import { PublishLegalForm } from "@/components/publish-legal-form";

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
      <PageHeader
        title="Legal documents"
        subtitle="Terms, privacy policy, and the contract template businesses accept at registration"
      />

      {!res.ok ? <p className="mb-4 text-sm text-bad">{res.error}</p> : null}

      <div className="mb-5 card p-4">
        <p className="text-sm text-muted">
          Documents are <strong className="text-fg">versioned, never edited in place</strong>. An
          acceptance points at one exact version, so changing published text would retroactively
          alter what every business already agreed to. Publishing a new version leaves existing
          acceptances bound to the old one.
        </p>
      </div>

      {me.permissions.includes("legal.publish") ? (
        <div className="mb-5">
          <PublishLegalForm />
        </div>
      ) : null}

      {documents.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No documents published yet. Business registration cannot record a terms acceptance until a
          `terms_of_service` version exists.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <article key={document.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{document.title}</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {document.kind.replace(/_/g, " ")} · v{document.version} · {document.locale}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={document.publishedAt ? "good" : "warn"}>
                    {document.publishedAt ? "published" : "draft"}
                  </Badge>
                  {/* Acceptance count is why a version cannot be edited: each one
                      is a business that agreed to this exact text. */}
                  <Badge tone="muted">{document.acceptanceCount} accepted</Badge>
                  {document.contractCount > 0 ? (
                    <Badge tone="muted">{document.contractCount} contracts</Badge>
                  ) : null}
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted">View text</summary>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-panel-2 p-3 text-xs">
                  {document.body}
                </pre>
              </details>

              <p className="mt-2 text-xs text-muted">
                Published {document.publishedAt ? timeAgo(document.publishedAt) : "—"}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
