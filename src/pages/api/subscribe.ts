import type { APIRoute } from "astro";
import { anonClient } from "../../lib/supabase";
import { sendSignupAck } from "../../lib/email";
import { hitOrReject } from "../../lib/rate-limit";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  const rl = hitOrReject(ip);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Too many requests — try again in a minute." }), {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSec), "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400 });
  }

  // HONEYPOT — fake success so bots don't learn
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // TIMING — real humans take a few seconds to fill a one-field form
  const age = Date.now() - Number(body.renderedAt ?? 0);
  if (age < 1200 || age > 24 * 60 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Form expired — please reload and try again." }), { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Enter a valid email address." }), { status: 400 });
  }

  const sb = anonClient();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Server not configured — try again shortly." }), { status: 500 });
  }

  const { error } = await sb.from("subscribers").insert({ email, source: "coming_soon_hero", source_ip: ip });

  // unique-violation just means they already signed up — treat as success
  if (error && error.code !== "23505") {
    return new Response(JSON.stringify({ error: "Couldn't save your email — please try again." }), { status: 500 });
  }

  await sendSignupAck({ to: email }).catch(() => {});

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
