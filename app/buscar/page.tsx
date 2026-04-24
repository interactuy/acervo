import type { Metadata } from "next";
import { searchAcervo } from "@/lib/acervo/data";
import { SearchPage } from "@/modules/search/search-page";

type SearchRouteProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Buscar",
};

export default async function Page({ searchParams }: SearchRouteProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() ?? "";
  const results = searchAcervo(query);

  return <SearchPage query={query} results={results} />;
}
