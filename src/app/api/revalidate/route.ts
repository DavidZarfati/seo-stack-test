import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// Endpoint chiamato dal database (Supabase) quando un articolo cambia.
// Protetto da un segreto condiviso: senza il segreto giusto non fa nulla.

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-revalidate-secret") ?? "";
  // Confronto a tempo costante (su hash di uguale lunghezza) per non rivelare nulla sul segreto.
  const ok = timingSafeEqual(sha256(provided), sha256(secret));
  if (!ok) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // expire: 0 = la versione vecchia non viene più servita, la prossima richiesta rigenera subito.
  revalidateTag("articles", { expire: 0 });

  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
