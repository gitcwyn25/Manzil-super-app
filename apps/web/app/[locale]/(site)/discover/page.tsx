import { permanentRedirect } from "next/navigation";
import { DISCOVER_URL } from "../../../lib/discover";

/** Old localized bookmarks lead to the complete, standalone Discover app. */
export default function DiscoverPage() {
  permanentRedirect(DISCOVER_URL);
}
