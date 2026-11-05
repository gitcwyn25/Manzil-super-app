import type { Metadata } from "next";
import { ProfilePage } from "../components/personal-pages";
export const metadata: Metadata = { title: "Your profile", robots: { index: false, follow: false }, alternates: { canonical: "/profile" } };
export default function Profile() { return <ProfilePage/>; }
