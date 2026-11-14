import type { Metadata } from "next";
import { SavedPage } from "../components/personal-pages";
export const metadata: Metadata = { title: "Saved places", robots: { index: false, follow: false }, alternates: { canonical: "/saved" } };
export default function Saved() { return <SavedPage/>; }
