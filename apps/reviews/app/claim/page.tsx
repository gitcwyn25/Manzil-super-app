import type { Metadata } from "next";
import { BusinessSubmission } from "../components/owner-pages";
export const metadata: Metadata = { title: "Claim a business", robots: { index: false, follow: false }, alternates: { canonical: "/claim" } };
export default function Claim() { return <BusinessSubmission claim/>; }
