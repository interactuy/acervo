import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = {
  ...loadEnvFile(path.join(process.cwd(), ".env.local")),
  ...process.env,
};
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const contentId = env.SUPABASE_ACERVO_CONTENT_ID ?? "production";
const seedPath = path.join(process.cwd(), "data", "seed", "mnav-v1.json");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const seed = JSON.parse(await readFile(seedPath, "utf8"));
seed.meta = {
  ...seed.meta,
  generatedAt: new Date().toISOString(),
};

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { error } = await supabase.from("acervo_content").upsert(
  {
    id: contentId,
    data: seed,
    updated_at: seed.meta.generatedAt,
  },
  { onConflict: "id" },
);

if (error) {
  throw new Error(`Supabase seed upsert failed: ${error.message}`);
}

console.log(
  `Seed synced to Supabase row "${contentId}": ${seed.museums.length} museums, ${seed.artists.length} artists, ${seed.artworks.length} artworks.`,
);

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");

  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          return null;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line
          .slice(separatorIndex + 1)
          .trim()
          .replace(/^["']|["']$/g, "");

        return [key, value];
      })
      .filter(Boolean),
  );
}
