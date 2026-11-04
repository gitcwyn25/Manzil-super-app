import type { Metadata } from "next";
import { BusinessSubmission } from "../components/owner-pages";
export const metadata: Metadata = { title: "Add a business", robots: { index: false, follow: false }, alternates: { canonical: "/add-business" } };
export default function AddBusiness() { return <BusinessSubmission/>; }
