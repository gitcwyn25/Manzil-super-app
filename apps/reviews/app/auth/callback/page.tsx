import type { Metadata } from "next";
import { AuthForm } from "../../components/auth-form";
export const metadata: Metadata = { title: "Confirm your account", robots: { index: false, follow: false }, alternates: { canonical: "/auth/callback" } };
export default function CallbackPage() { return <AuthForm callback/>; }
