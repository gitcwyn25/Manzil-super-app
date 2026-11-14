import type { Metadata } from "next";
import { OwnersPage } from "../components/owner-pages";
export const metadata: Metadata = { title: "For local business owners", alternates: { canonical: "/owners" } };
export default function Owners() { return <OwnersPage/>; }
