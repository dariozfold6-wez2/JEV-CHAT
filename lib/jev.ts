import { experimental_evaluate as evaluate } from "ai";

export const OPCIONES = ["si", "no", "no_aplica"] as const;
export type Opcion = (typeof OPCIONES)[number];

export type Respuesta = {
  eleccion: Opcion;
  probabilidades: Record<Opcion, number>;
  confianza: number | null;
};

// La pregunta tipada que Jev responde para cualquier cosa que escriba la persona.
// Las opciones van descritas (no solo etiquetadas): así Jev tiene más con qué comparar.
const INSTRUCCIONES =
  "La persona escribió `pregunta`. Si hubiera que responder solo sí o no, ¿cuál es la respuesta más probable según el conocimiento general? Las preguntas de opinión, comparación o consejo (por ejemplo \"¿es mejor X que Y?\" o \"¿conviene X?\") sí se responden con sí o no: elegí la respuesta hacia la que más se inclina la evidencia o la opinión mayoritaria.";

const CRITERIOS: Record<Opcion, string> = {
  si: "La respuesta más probable es sí, aunque haya matices, excepciones u opiniones divididas.",
  no: "La respuesta más probable es no, aunque haya matices, excepciones u opiniones divididas.",
  no_aplica:
    "Solo cuando el texto no admite ninguna respuesta de sí o no: pide un dato concreto (una hora, un nombre, un número), una explicación o una lista, o no es una pregunta. Nunca para preguntas de opinión, comparación o consejo.",
};

function normalizar(
  eleccion: string,
  probs: Record<string, number> | undefined,
  confianza: unknown,
): Respuesta {
  const probabilidades = Object.fromEntries(
    OPCIONES.map((o) => [o, Number(probs?.[o] ?? (o === eleccion ? 1 : 0))]),
  ) as Record<Opcion, number>;
  return {
    eleccion: (OPCIONES as readonly string[]).includes(eleccion)
      ? (eleccion as Opcion)
      : "no_aplica",
    probabilidades,
    confianza: typeof confianza === "number" ? confianza : null,
  };
}

// Opción A: Vercel AI Gateway (autenticación automática en Vercel).
async function viaGateway(pregunta: string): Promise<Respuesta> {
  const result = await evaluate({
    model: "typesafe-ai/jev",
    state: { pregunta },
    questions: {
      respuesta: {
        type: "choice",
        instructions: INSTRUCCIONES,
        criteria: CRITERIOS,
      },
    },
    providerOptions: {
      gateway: { zeroDataRetention: true },
    },
  });

  const answer = result.answers.respuesta;
  const typesafe = result.providerMetadata?.typesafe as
    | { confidence?: Record<string, number> }
    | undefined;

  return normalizar(answer.choice, answer.probabilities, typesafe?.confidence?.respuesta);
}

// Opción B: API directa de TypeSafe (si hay TYPESAFE_API_KEY).
async function viaTypeSafe(pregunta: string, apiKey: string): Promise<Respuesta> {
  const body = JSON.stringify({
    model: "jev-latest",
    state: { pregunta },
    questions: {
      respuesta: { type: "choice", instructions: INSTRUCCIONES, criteria: CRITERIOS },
    },
  });

  // Reintentos con espera progresiva para 429 (límite) y 529 (sobrecarga).
  for (let intento = 0; intento < 3; intento++) {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (res.status === 429 || res.status === 529) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** intento));
      continue;
    }
    if (!res.ok) {
      throw new Error(`TypeSafe respondió ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      answers: {
        respuesta: {
          choice: string;
          probabilities?: Record<string, number>;
          confidence?: number;
        };
      };
    };
    const a = data.answers.respuesta;
    return normalizar(a.choice, a.probabilities, a.confidence);
  }
  throw new Error("TypeSafe está saturado. Probá de nuevo en unos segundos.");
}

export async function preguntarAJev(pregunta: string): Promise<Respuesta> {
  const key = process.env.TYPESAFE_API_KEY;
  return key ? viaTypeSafe(pregunta, key) : viaGateway(pregunta);
}
