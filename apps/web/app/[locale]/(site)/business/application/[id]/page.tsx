import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BrandPanel, SplitAuthShell } from "../../../../../components/vm/split-auth-shell";
import { PrimaryCta } from "../../../../../components/vm/primary-cta";
import { getBusinessApplication } from "../../../../../lib/crm-api";
import { getCrmCopy } from "../../../../../lib/crm-copy";
import { routeMetadata } from "../../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("register", locale);
}

const STATUS_COPY = {
  uz: {
    title: "Arizangiz qabul qilindi",
    intro: "Manzil jamoasi ma'lumotlarni ko'rib chiqadi. Tekshiruv yakunlangach, keyingi qadamlar haqida xabar beramiz.",
    status: "Holat",
    submitted: "Yuborildi",
    under_review: "Ko'rib chiqilmoqda",
    changes_requested: "Qo'shimcha ma'lumot kerak",
    approved: "Ma'qullandi",
    rejected: "Rad etildi",
    withdrawn: "Bekor qilingan",
    submittedAt: "Yuborilgan vaqt",
    back: "Biznes sahifasiga qaytish",
    openWorkspace: "Biznes kabinetini ochish",
    editApplication: "Arizani yangilash",
    noWorkspace: "Tekshiruv tugamaguncha biznes ish joyi ochilmaydi.",
    workspaceReady: "Arizangiz ma'qullandi. Biznes kabinetingiz tayyor."
  },
  ru: {
    title: "Заявка отправлена",
    intro: "Команда Manzil проверит данные и сообщит о следующих шагах после проверки.",
    status: "Статус",
    submitted: "Отправлена",
    under_review: "На проверке",
    changes_requested: "Нужна дополнительная информация",
    approved: "Одобрена",
    rejected: "Отклонена",
    withdrawn: "Отозвана",
    submittedAt: "Отправлена",
    back: "Вернуться на бизнес-страницу",
    openWorkspace: "Открыть кабинет бизнеса",
    editApplication: "Обновить заявку",
    noWorkspace: "Рабочее пространство бизнеса откроется после завершения проверки.",
    workspaceReady: "Заявка одобрена. Кабинет бизнеса готов."
  },
  en: {
    title: "Your application was submitted",
    intro: "The Manzil team will review the details. We will let you know about the next steps after review.",
    status: "Status",
    submitted: "Submitted",
    under_review: "Under review",
    changes_requested: "More information needed",
    approved: "Approved",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    submittedAt: "Submitted",
    back: "Back to business page",
    openWorkspace: "Open business workspace",
    editApplication: "Update application",
    noWorkspace: "Your business workspace opens after the review is complete.",
    workspaceReady: "Your application is approved. The business workspace is ready."
  }
} as const;

export default async function BusinessApplicationStatusPage({
  params
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const { userId } = await auth();
  if (!userId) {
    redirect(`/${locale}/sign-in?redirect_url=${encodeURIComponent(`/${locale}/business/application/${id}`)}`);
  }

  const application = await getBusinessApplication(id);
  if (!application) notFound();

  const copy = getCrmCopy(locale);
  const text = STATUS_COPY[locale] ?? STATUS_COPY.en;
  const statusLabel = (text as Record<string, string>)[application.status] ?? application.status;
  const workspaceReady = application.status === "approved" && Boolean(application.business);
  const needsChanges = application.status === "changes_requested";
  const submittedAt = application.submittedAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(application.submittedAt)
      )
    : "-";

  return (
    <SplitAuthShell
      panel={
        <BrandPanel
          tagline={copy.register.brandSubline}
          title={copy.register.brandTagline}
          wordmark={copy.register.brandWordmark}
        />
      }
    >
      <div className="vm-auth-flow">
        <header className="vm-auth-head">
          <p className="vm-auth-kicker__sub">{application.name}</p>
          <h1 className="vm-auth-head__title">{text.title}</h1>
          <p className="vm-auth-head__subtitle">{text.intro}</p>
        </header>

        <div className="vm-auth-summary" aria-live="polite">
          <div className="vm-auth-summary__row">
            <span>{text.status}</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="vm-auth-summary__row">
            <span>{text.submittedAt}</span>
            <strong>{submittedAt}</strong>
          </div>
          <p className="vm-auth-summary__note">{workspaceReady ? text.workspaceReady : text.noWorkspace}</p>
        </div>

        <PrimaryCta
          className="vm-auth-submit"
          href={workspaceReady ? `/${locale}/dashboard` : needsChanges ? `/${locale}/business/register?application=${id}` : `/${locale}/business`}
        >
          {workspaceReady ? text.openWorkspace : needsChanges ? text.editApplication : text.back}
        </PrimaryCta>
      </div>
    </SplitAuthShell>
  );
}
