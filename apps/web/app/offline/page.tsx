import type { Metadata } from "next";
import { DocumentShell } from "../components/document-shell";

export const metadata: Metadata = {
  title: "Oflayn",
  robots: { index: false, follow: false }
};

/**
 * Offline fallback, precached by the service worker at install time.
 *
 * Trilingual with no locale prefix and no data fetching: this page is reached
 * precisely when the network is gone, so it cannot look up the user's locale
 * or render anything dynamic. Showing all three languages is more useful than
 * guessing one.
 *
 * Renders `DocumentShell` itself because it lives outside `app/[locale]`,
 * which is where `<html>`/`<body>` moved so that `lang` could be correct per
 * locale. `lang="uz"` here is the honest default for a page that deliberately
 * shows all three languages at once.
 */
export default function OfflinePage() {
  return (
    <DocumentShell lang="uz">
      <main
        style={{
          display: "flex",
          minHeight: "70vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          backgroundColor: "#f8f9ff"
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Internet aloqasi yo&apos;q</h1>
        <p style={{ maxWidth: "42ch", color: "#414755" }}>
          Siz oflaynsiz. Avval ochilgan sahifalar hali ham mavjud — aloqa tiklangach sahifani
          yangilang.
        </p>
        <p lang="ru" style={{ maxWidth: "42ch", color: "#414755" }}>
          Нет подключения к интернету. Ранее открытые страницы по-прежнему доступны — обновите
          страницу, когда связь восстановится.
        </p>
        <p lang="en" style={{ maxWidth: "42ch", color: "#414755" }}>
          You are offline. Pages you already opened are still available — reload once your
          connection is back.
        </p>
      </main>
    </DocumentShell>
  );
}
