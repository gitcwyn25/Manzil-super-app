const { PrismaClient } = require("@prisma/client");

(async () => {
  const p = new PrismaClient();
  const docs = await p.legalDocument.findMany({
    select: { kind: true, locale: true, version: true, publishedAt: true, title: true }
  });
  console.log("LegalDocument rows: " + docs.length);
  docs.forEach((d) =>
    console.log(
      "  kind=" + d.kind + " locale=" + d.locale + " v" + d.version +
      " published=" + (d.publishedAt ? d.publishedAt.toISOString() : "NULL  <-- not published")
    )
  );
  await p.$disconnect();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
