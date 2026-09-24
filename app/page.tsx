"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type Opcion = "si" | "no" | "depende" | "no_aplica";

type Respuesta = {
  eleccion: Opcion;
  probabilidades: Record<Opcion, number>;
  confianza: number | null;
  ms: number;
};

type Mensaje =
  | { id: number; tipo: "pregunta"; texto: string }
  | { id: number; tipo: "respuesta"; datos: Respuesta }
  | { id: number; tipo: "error"; texto: string };

const ETIQUETAS: Record<Opcion, string> = {
  si: "Sí",
  no: "No",
  depende: "Depende",
  no_aplica: "No es de sí o no",
};

const ORDEN: Opcion[] = ["si", "no", "depende", "no_aplica"];

const SUGERENCIAS = [
  "¿Conviene emprender sin inversión externa?",
  "¿La IA va a reemplazar a los programadores?",
  "¿Es mejor trabajar remoto que en oficina?",
  "¿Vale la pena aprender a programar hoy?",
];

const pct = (n: number) => `${Math.round(n * 100)}%`;

function TarjetaRespuesta({ datos }: { datos: Respuesta }) {
  const ganadora = datos.eleccion;
  return (
    <article className="respuesta" aria-label={`Jev responde: ${ETIQUETAS[ganadora]}`}>
      <p className="veredicto" style={{ color: `var(--${ganadora})` }}>
        {ETIQUETAS[ganadora]}
        <small>{pct(datos.probabilidades[ganadora])} de probabilidad</small>
      </p>

      <div className="barra" role="img" aria-label="Distribución de probabilidades">
        {ORDEN.map((o) => (
          <span
            key={o}
            style={
              {
                "--ancho": `${datos.probabilidades[o] * 100}%`,
                background: `var(--${o})`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <ul className="leyenda">
        {ORDEN.map((o) => (
          <li key={o}>
            <i style={{ background: `var(--${o})` }} />
            {ETIQUETAS[o]}
            <b>{pct(datos.probabilidades[o])}</b>
          </li>
        ))}
      </ul>

      <div className="meta">
        <span>
          Confianza{" "}
          <strong>{datos.confianza === null ? "sin dato" : datos.confianza.toFixed(2)}</strong>
        </span>
        <span>
          Respondió en <strong>{datos.ms} ms</strong>
        </span>
      </div>
    </article>
  );
}

export default function Pagina() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const idRef = useRef(0);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando]);

  const nuevoId = () => ++idRef.current;

  async function preguntar(pregunta: string) {
    const limpia = pregunta.trim();
    if (!limpia || cargando) return;

    setTexto("");
    setMensajes((m) => [...m, { id: nuevoId(), tipo: "pregunta", texto: limpia }]);
    setCargando(true);

    try {
      const res = await fetch("/api/preguntar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: limpia }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Algo falló. Probá de nuevo.");
      setMensajes((m) => [...m, { id: nuevoId(), tipo: "respuesta", datos: data }]);
    } catch (e) {
      const texto = e instanceof Error ? e.message : "Algo falló. Probá de nuevo.";
      setMensajes((m) => [...m, { id: nuevoId(), tipo: "error", texto }]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="pagina">
      <header className="encabezado">
        <h1>Preguntale a Jev</h1>
        <p>
          Hacé una pregunta de sí o no. Jev no escribe: te dice qué tan probable es cada
          respuesta y cuánta confianza tiene.
        </p>
      </header>

      <section className="conversacion" aria-live="polite">
        {mensajes.length === 0 && (
          <div className="sugerencias">
            {SUGERENCIAS.map((s) => (
              <button key={s} className="sugerencia" onClick={() => preguntar(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {mensajes.map((m) =>
          m.tipo === "pregunta" ? (
            <p key={m.id} className="burbuja-usuario">
              {m.texto}
            </p>
          ) : m.tipo === "respuesta" ? (
            <TarjetaRespuesta key={m.id} datos={m.datos} />
          ) : (
            <p key={m.id} className="error" role="alert">
              {m.texto}
            </p>
          ),
        )}

        {cargando && <p className="pensando">Jev está evaluando…</p>}
        <div ref={finRef} />
      </section>

      <div className="compositor">
        <form
          className="campo"
          onSubmit={(e) => {
            e.preventDefault();
            preguntar(texto);
          }}
        >
          <textarea
            id="pregunta"
            aria-label="Tu pregunta"
            rows={1}
            maxLength={300}
            placeholder="Escribí tu pregunta…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                preguntar(texto);
              }
            }}
          />
          <button type="submit" disabled={cargando || !texto.trim()}>
            Preguntar
          </button>
        </form>
        <p className="aviso">
          Es una estimación del modelo, no un veredicto. Esta página no guarda tus preguntas.
          Jev es un modelo de <a href="https://typesafe.ai" target="_blank" rel="noreferrer">TypeSafe AI</a>.
        </p>
      </div>
    </main>
  );
}
