# Preguntale a Jev

Chat simple, sin registro: escribís una pregunta de sí o no y Jev (TypeSafe AI) responde con la probabilidad de cada opción y su nivel de confianza.

## Cómo funciona

1. La persona escribe una pregunta.
2. `/api/preguntar` la manda a Jev como una pregunta tipo **Choice** con cuatro opciones: Sí, No, Depende y "No es de sí o no".
3. Jev devuelve la opción elegida, la probabilidad de cada una y la confianza.
4. La página lo muestra con una barra de probabilidades.

## Deploy en Vercel

1. Subí esta carpeta a un repo de GitHub.
2. En Vercel: **Add New → Project** e importá el repo.
3. Deploy. Listo: por defecto usa **Vercel AI Gateway** (`typesafe-ai/jev`) y la autenticación es automática. Revisá que AI Gateway esté habilitado en la cuenta.

### Variables de entorno (opcionales)

| Variable | Para qué |
| --- | --- |
| `TYPESAFE_API_KEY` | Si la cargás, usa la API directa de TypeSafe en vez del Gateway. |
| `UPSTASH_REDIS_REST_URL` | Límite por IP (20 preguntas por hora). |
| `UPSTASH_REDIS_REST_TOKEN` | Límite por IP. |

Sin Upstash el chat funciona igual, pero sin límite. Para un post público, conviene configurarlo (upstash.com tiene plan gratis).

**Nunca pongas keys en el código ni en el repo.** Solo en Vercel → Settings → Environment Variables.

## Probar en tu compu

```bash
npm install
vercel link
vercel env pull   # trae el token del Gateway (dura 12 h)
npm run dev
```

## Ajustes rápidos

- Pregunta y opciones: `lib/jev.ts` (`INSTRUCCIONES` y `CRITERIOS`).
- Límite por IP: `lib/ratelimit.ts`.
- Largo máximo de la pregunta: `app/api/preguntar/route.ts` (`MAX_CARACTERES`).
- Colores y tipografía: `app/globals.css`.
