import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const SITE = (import.meta.env.PUBLIC_SITE_URL ?? "https://meridian-k7q2.vercel.app").replace(/\/$/, "");
  const sb = anonClient();

  let pages: any[] = [];
  if (sb) {
    const { data } = await sb
      .from("pages")
      .select("slug, title, meta_description")
      .not("published_at", "is", null);
    pages = data ?? [];
  }

  const lines: string[] = [];
  lines.push(`# Meridian`);
  lines.push("");
  lines.push(`> Meridian is an upcoming specialty coffee brand — sourced with precision, roasted with intent. Coffee, calibrated.`);
  lines.push("");
  lines.push("## Key pages");
  lines.push("");
  for (const p of pages) {
    const path = p.slug === "home" ? "" : p.slug;
    lines.push(`- [${p.title}](${SITE}/${path}): ${p.meta_description ?? ""}`);
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
