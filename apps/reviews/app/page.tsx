import { Directory } from "./components/directory";
import { directoryData, type DirectoryData } from "./lib/api";
export const dynamic = "force-dynamic";
export default async function Home() {
  let initial: DirectoryData = { businesses: [], categories: [] }, initialError: string | undefined;
  try { initial = await directoryData(); } catch (e) { initialError = (e as Error).message; }
  return <Directory initial={initial} initialError={initialError}/>;
}
