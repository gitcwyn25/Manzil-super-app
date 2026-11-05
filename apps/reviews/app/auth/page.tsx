import type { Metadata } from "next";
import { AuthForm } from "../components/auth-form";
export const metadata: Metadata = { title: "Sign in or create an account", robots: { index: false, follow: false }, alternates: { canonical: "/auth" } };
export default function AuthPage() { return <AuthForm/>; }
