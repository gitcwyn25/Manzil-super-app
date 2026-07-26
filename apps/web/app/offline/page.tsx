import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oflayn | Manzil",
  robots: { index: false, follow: false }
};

/**
 * Offline fallback, precached by the service worker at install time.
 *
 * Trilingual with no locale prefix and no data fetching: this page is reached
 * precisely when the network is gone, so it cannot look up the user's locale
 * or render anything dynamic. Showing all three languages is more useful than
 * guessing one.
 */
export default function OfflinePage() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "70vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "2rem",
        textAlign: "center"
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Internet aloqasi yo&apos;q</h1>
      <p style={{ maxWidth: "42ch", color: "#52514e" }}>
        Siz oflaynsiz. Avval ochilgan sahifalar hali ham mavjud — aloqa tiklangach sahifani
        yangilang.
      </p>
      <p style={{ maxWidth: "42ch", color: "#52514e" }}>
        Нет подключения к интернету. Ранее открытые страницы по-прежнему доступны — обновите
        страницу, когда связь восстановится.
      </p>
      <p style={{ maxWidth: "42ch", color: "#52514e" }}>
        You are offline. Pages you already opened are still available — reload once your
        connection is back.
      </p>
    </main>
  );
}
