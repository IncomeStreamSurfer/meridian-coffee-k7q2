import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const sb = anonClient();
  let pages: any[] = [];
  if (sb) {
    const { data } = await sb
      .from("pages")
      .select("slug, title, body_html")
      .not("published_at", "is", null);
    pages = data ?? [];
  }
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const body = pages
    .map((p) => `# ${p.title}\n\n${stripHtml(p.body_html ?? "")}\n\n---\n`)
    .join("\n");
  return new Response(body || "# Meridian\n\nSpecialty coffee, coming soon.\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
