import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AccessDenied({ missing }: { missing?: string }) {
  return <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center"><Card className="w-full overflow-hidden"><CardContent className="p-7 sm:p-9"><div className="mb-5 flex size-11 items-center justify-center rounded-[10px] bg-danger-soft text-danger"><LockKeyhole className="size-5" /></div><p className="mb-2 font-data text-[10px] uppercase tracking-[0.16em] text-danger">Permission boundary</p><h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">Access restricted.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{missing ? `This surface requires the '${missing}' permission.` : "This console is available to authorized Manzil administrators only."} The server remains the source of truth for access.</p><Alert variant="warning" className="mt-6"><AlertTitle>What you can do next</AlertTitle><AlertDescription>Return to a permitted queue or sign in with the correct employee account.</AlertDescription></Alert><div className="mt-6 flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/"><ArrowLeft className="size-4" />Back to Today</Link></Button><Button asChild variant="ghost"><Link href="/sign-in">Switch account</Link></Button></div></CardContent></Card></div>;
}

export function ConsoleUnavailable({ status, error }: { status: number; error: string }) {
  return <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center"><Card className="w-full overflow-hidden"><CardContent className="p-7 sm:p-9"><p className="mb-2 font-data text-[10px] uppercase tracking-[0.16em] text-warn">Console unavailable · {status}</p><h1 className="font-display text-2xl font-semibold tracking-[-0.03em]">The operations API is unavailable.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p><Alert variant="warning" className="mt-6"><AlertTitle>No fallback records shown</AlertTitle><AlertDescription>Reload after the API recovers. Permission failures and contract gates are shown separately.</AlertDescription></Alert></CardContent></Card></div>;
}
