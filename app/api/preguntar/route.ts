import { preguntarAJev } from "@/lib/jev";
import { permitir } from "@/lib/ratelimit";

export const runtime = "nodejs";

const MAX_CARACTERES = 300;

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";

  if (!(await permitir(ip))) {
    return Response.json(
      { error: "Llegaste al límite de preguntas por ahora. Volvé en un rato." },
      { status: 429 },
    );
  }

  let pregunta = "";
  try {
    const body = (await request.json()) as { pregunta?: unknown };
    pregunta = typeof body.pregunta === "string" ? body.pregunta.trim() : "";
  } catch {
    // cuerpo inválido: se maneja abajo
  }

  if (!pregunta) {
    return Response.json({ error: "Escribí una pregunta." }, { status: 400 });
  }
  if (pregunta.length > MAX_CARACTERES) {
    return Response.json(
      { error: `La pregunta puede tener hasta ${MAX_CARACTERES} caracteres.` },
      { status: 400 },
    );
  }

  const inicio = Date.now();
  try {
    const respuesta = await preguntarAJev(pregunta);
    return Response.json({ ...respuesta, ms: Date.now() - inicio });
  } catch (err) {
    console.error("Error llamando a Jev:", err);
    return Response.json(
      { error: "Jev no respondió. Probá de nuevo en unos segundos." },
      { status: 502 },
    );
  }
}
