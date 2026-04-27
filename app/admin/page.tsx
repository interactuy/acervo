import type { Metadata } from "next";
import { AdminPage } from "@/modules/admin/admin-page";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    section?: string;
    id?: string;
    notice?: string;
    error?: string;
  }>;
};

const validSections = ["museos", "artistas", "obras", "exposiciones"] as const;

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const section = validSections.includes(
    params.section as (typeof validSections)[number],
  )
    ? (params.section as (typeof validSections)[number])
    : "museos";

  return (
    <AdminPage
      section={section}
      id={params.id}
      notice={params.notice}
      error={params.error}
    />
  );
}
