<div align="center">

# TOTH

**Asistente de IA generativa académica para la I.U. Pascual Bravo**

*Inspirado en Thot, dios egipcio de la escritura y la sabiduría.*

</div>

---

## Descripción

TOTH es una aplicación móvil que ayuda a estudiantes y docentes de la I.U. Pascual Bravo
a producir contenido académico (ensayos, informes de laboratorio, guías de clase,
artículos) con criterio propio, en lugar de texto genérico fácilmente reconocible como
generado por IA.

A diferencia de un chatbot genérico conectado a un modelo de lenguaje, TOTH combina tres
capas de diseño sobre el LLM:

- **RAG híbrido institucional + web.** Prioriza siempre el fondo documental de la
  universidad (pénsum, syllabus, reglamentos) y solo complementa con búsqueda web cuando
  hay vacíos de información o el tema exige vigencia actual.
- **Filtro anti-cliché.** Un *negative system prompt* que elimina muletillas típicas de
  IA ("en conclusión", "juega un papel crucial", "profundizar en el tema"...), con un
  paso de regeneración automática si el texto generado aún las contiene.
- **Doble perfil de uso.** Estudiante (tono pedagógico, explicativo) vs. Docente (tono
  analítico, evaluativo) — cada uno con densidad y formato distintos.

---

## Estado del proyecto

| Fase | Descripción | Estado |
| :--- | :--- | :--- |
| 0 | Scaffold del monorepo | ✅ Completa |
| 1 | Identidad visual y componentes base | ✅ Completa |
| 2 | Pantallas de flujo principal (mock data) | ✅ Completa |
| 3 | Backend: Vercel + Groq + Supabase RAG | ✅ Completa |
| 4 | Integración real frontend-backend + puente Kotlin | ✅ Completa |
| 5 | Integración y validación final | 🟡 RAG 3/3 en producción y E2E en emulador OK; falta la prueba de regeneración anti-cliché |

> El detalle completo de cada fase, criterios de aceptación y decisiones de arquitectura
> vive en el documento interno de directivas del agente (no versionado en este repo).

---

## Identidad visual

TOTH usa una paleta pensada para transmitir *serenidad académica*, deliberadamente
alejada de las estéticas neón asociadas a otras apps de IA.

| Color | Rol | Hex |
| :--- | :--- | :--- |
| 🟢 Verde Musgo Profundo | Primario | `#2D4A3E` |
| 🟠 Terracota Suave | Acento | `#C87D55` |
| ⚪ Crema Cálido | Fondo global | `#FDFBF7` |
| ⬜ Blanco Puro | Superficies | `#FFFFFF` |
| ⬛ Pizarra Oscuro | Texto principal | `#1E293B` |
| 🩶 Gris Ceniza | Texto secundario | `#64748B` |
| 🟩 Verde Menta Suave | Validación / badges RAG | `#E8EFEA` |

Tipografía única: **[Lexend](https://fonts.google.com/specimen/Lexend)**, elegida por
reducir la fatiga de lectura en sesiones largas de estudio.

---

## Stack técnico

| Capa | Tecnología |
| :--- | :--- |
| Frontend móvil | React Native + TypeScript |
| Estilos | Tailwind CSS / NativeWind |
| Módulos nativos | Kotlin (Room DB local, exportación PDF/Word) |
| Autenticación y BD en la nube | Firebase Auth + Cloud Firestore |
| Orquestador backend | Vercel Serverless Functions (Node.js/TypeScript) |
| LLM | Groq SDK — OpenAI GPT-OSS 120B (`openai/gpt-oss-120b`) |
| Vector DB (RAG institucional) | Supabase (pgvector) |
| Búsqueda web (grounding) | Tavily |

---

## Estructura del repositorio

```text
THOTH/
├── apps/
│   ├── mobile/                 # App React Native
│   │   ├── android/            # Puente nativo Kotlin (Room DB, exportación PDF/Word)
│   │   └── src/
│   │       ├── components/     # UI base (Card, Button, Input, Toggle, Badge...)
│   │       ├── screens/        # Register, Login, RoleSelect, Directory, Chat
│   │       ├── styles/         # *.styles.ts por pantalla/componente
│   │       ├── navigation/     # Configuración de React Navigation
│   │       ├── theme/          # Tokens de identidad visual (tokens.ts)
│   │       ├── services/       # Clientes reales (apiClient, authClient, firestoreClient, nativeBridge)
│   │       └── types/          # Interfaces compartidas (User, ChatMessage...)
│   └── backend/                # Orquestador serverless en Vercel
│       ├── api/v1/             # Rutas (entradas serverless: health, auth, vector-search, generate)
│       ├── lib/
│       │   ├── controllers/    # Traducen HTTP ↔ servicios
│       │   ├── services/       # Lógica de negocio (RAG, generación, auth, health)
│       │   ├── repositories/   # Acceso a datos (Supabase, Groq, usuarios)
│       │   ├── routes/         # Fábrica de rutas y registro de endpoints
│       │   ├── groq.ts         # Cliente Groq + prompts del asistente
│       │   ├── supabase.ts     # Cliente pgvector + búsqueda vectorial
│       │   ├── antiClicheFilter.ts
│       │   ├── response.ts     # Respuestas/errores estandarizados
│       │   ├── config.ts       # Constantes compartidas
│       │   └── types.ts
│       ├── supabase/           # Migraciones pgvector + Edge Function `embed`
│       ├── documents/          # Documentos fuente a ingerir (no versionados en git)
│       └── scripts/            # Utilidades: seed de prueba e ingesta de documentos reales
└── docs/
    ├── GUIA_CARGA_DOCUMENTOS.md # Carga del fondo documental institucional al RAG
    └── prompt-templates/       # Plantillas de prompt por tipo de entregable académico
```

---

## Puesta en marcha

### Requisitos previos

- **Node.js 18+**
- **JDK 17 LTS** (Obligatorio para React Native 0.76; versiones como Java 24/25 son incompatibles con Gradle 8.10)
- **Android Studio** (con Android SDK, SDK Build-Tools 35.0.0, NDK 26.1 y Emulador configurado)
- **Variables de entorno:**
  - `JAVA_HOME`: Ruta a tu JDK 17 (ej. `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot` o similar)
  - `ANDROID_HOME`: Ruta a tu Android SDK (ej. `%LOCALAPPDATA%\Android\Sdk`)
  - En `PATH`: incluir `%JAVA_HOME%\bin`, `%ANDROID_HOME%\platform-tools` y `%ANDROID_HOME%\emulator`

### Instalación

El repositorio es un monorepo administrado con [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces). `apps/mobile` y `apps/backend` se instalan desde la raíz con un solo comando:

```bash
git clone https://github.com/Pipe-C/THOTH.git
cd THOTH

# Instala todas las dependencias del monorepo (npm workspaces las hoistea a la raíz)
npm install
```

### Emulador (AVD — Pixel 7)

Para `npm run android` necesitas un dispositivo virtual ya creado:

1. Android Studio → *More Actions → Device Manager → Create device*.
2. Elige el modelo **Pixel 7** y la System Image **Android 14 (API 34)** (descárgala la
   primera vez si la pide).
3. Pulsa ▶ para arrancar el emulador antes de correr la app.

### Variables de entorno (backend)

Crea un archivo `.env` dentro de `apps/backend` (nunca lo subas al repo) con:

```env
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TAVILY_API_KEY=
```

> En Vercel estas variables se configuran como *Environment Variables* del proyecto
> (`thoth-backend`). El archivo de referencia es `apps/backend/.env.example`.

### Base de datos vectorial (Supabase)

El fondo documental institucional vive en Supabase (pgvector). Para prepararlo:

1. **Aplicar el esquema.** Ejecuta las migraciones en el SQL Editor del proyecto
   de Supabase, en orden:
   - `apps/backend/supabase/migrations/0001_init_vector_store.sql` — crea la
     extensión `vector`, la tabla `document_chunks` (embeddings de 384
     dimensiones, modelo `gte-small`) y la función RPC `match_document_chunks`.
   - `apps/backend/supabase/migrations/0002_fix_vector_index.sql` — reemplaza el
     índice `ivfflat` por **HNSW**, necesario para una recuperación fiable con
     pocos documentos.
2. **Desplegar la Edge Function de embeddings.**
   ```bash
   supabase functions deploy embed --project-ref <TU_PROJECT_REF>
   ```
3. **Cargar documentos.** Coloca tus documentos (PDF/DOCX/MD/TXT) en
   `apps/backend/documents/` y, desde `apps/backend`, con `SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY` en el `.env`:
   ```bash
   npm run ingest          # carga el fondo documental real
   npm run seed            # (opcional) carga 3 documentos de prueba
   ```

Con esto, `POST /api/v1/vector-search` y `POST /api/v1/generate` ya devuelven
contexto institucional real. Los endpoints desplegados están en
`https://thoth-backend.vercel.app/api/v1/...`.

> El detalle del pipeline de ingesta (formatos, metadatos, fragmentación,
> resolución de problemas) está en `docs/GUIA_CARGA_DOCUMENTOS.md`.

### Correr la aplicación móvil

Para correr la app en emulador o dispositivo físico, utiliza dos terminales:

```bash
# Terminal 1 — Inicia el empaquetador Metro (déjalo corriendo)
npm run mobile

# Terminal 2 — Compila e instala la APK en el emulador de Android
npm run android
```

*(También puedes abrir la carpeta `apps/mobile/android` en Android Studio y presionar **Run ▶** con la Terminal 1 corriendo).*

> Si `npm run android` no conecta con Metro, verifica que la Terminal 1 (`npm run mobile`)
> siga corriendo. Para reiniciar Metro con caché limpia: `npm run mobile -- --reset-cache`
> (si el puerto 8081 quedó ocupado, cierra el Metro anterior primero).

### Variables de entorno (mobile)

`apps/mobile/babel.config.js` inyecta la configuración pública en el bundle durante el
build. Copia `apps/mobile/.env.example` a `apps/mobile/.env` y completa:

```env
FIREBASE_API_KEY=        # Project Settings > General > Web API Key
FIREBASE_PROJECT_ID=     # Project Settings > General > Project ID
API_BASE_URL=https://thoth-backend.vercel.app
```

> `API_BASE_URL` es opcional; si se omite, la app usa producción. Para un backend local
> desde el emulador Android, usa `http://10.0.2.2:3000`.
>
> Los valores se incrustan en el bundle: tras cambiar `.env` reinicia Metro con
> `--reset-cache` y vuelve a compilar. `.env` está en `.gitignore`; nunca lo subas.

### Historial de conversaciones

Los chats autenticados se guardan en Firestore, bajo el UID de Firebase:

```text
users/{uid}/conversations/{conversationId}
  title, preview, documentType, profile, sourcesUsed, createdAt, updatedAt
  messages/{messageId}
    sender, content, createdAt, sourcesUsed, antiClicheApplied, documentType
```

El directorio lista `conversations` ordenadas por `updatedAt`; al abrir una se cargan
sus `messages`. El modo “Omitir inicio de sesión” guarda el historial localmente en
AsyncStorage, separado de cualquier cuenta.

Las reglas versionadas están en `firestore.rules` (cada usuario solo accede a
`users/{uid}/**`). Publícalas una vez con Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

### Validación (Fase 5)

```bash
# Backend: pruebas y typecheck
cd apps/backend
npm test                 # 100 tests
npm run lint             # tsc --noEmit

# Typecheck de la app móvil
cd apps/mobile
npx tsc --noEmit

# Build Android (debug)
cd apps/mobile/android
.\gradlew.bat assembleDebug

# Casos RAG contra el backend (institucional, web, mixto)
cd apps/backend
npm run validate:rag
# Contra local: BASE_URL=http://localhost:3000 npm run validate:rag
```

> Las cuentas demo de la pantalla de Login (`estudiante.demo@...`) deben existir en
> Firebase Auth; si no, el formulario muestra "Las credenciales son incorrectas".
>
> Los entregables exportados desde el chat se publican en `Descargas/TOTH` (Android 10+)
> y se pueden compartir desde el aviso de la app. En Android 9 o anterior se comparten
> desde el almacenamiento privado de la aplicación.

---

## Flujo de datos (RAG híbrido)

```
Cliente móvil → Vercel (/api/v1/generate)
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
Vector Search               Web Search Grounding
(Supabase pgvector,          (fallback si la similitud
fondo Pascual Bravo)          institucional es baja)
      └─────────────┬─────────────┘
                     ▼
        Contexto combinado → Groq (openai/gpt-oss-120b)
                     ▼
           Filtro anti-cliché (post-procesado)
                     ▼
            Respuesta sanitizada al móvil
```

El contexto institucional siempre tiene prioridad; la web solo complementa cuando hay
vacíos de información o el tema requiere datos vigentes.

---

## API del backend (v1)

El backend sigue una arquitectura por capas: **ruta → controlador → servicio →
repositorio**, con `lib/response.ts` como formato de respuesta único.

| Método | Ruta | Controlador | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | `healthController` | Estado de Supabase y Groq |
| `POST` | `/api/v1/auth/register` | `authController` | Registro institucional (`@pascualbravo.edu.co`) |
| `POST` | `/api/v1/auth/login` | `authController` | Inicio de sesión institucional |
| `POST` | `/api/v1/vector-search` | `vectorSearchController` | Búsqueda semántica institucional |
| `POST` | `/api/v1/generate` | `generateController` | Orquestador RAG híbrido + generación |

El mapa de rutas es `lib/routes/apiRoutes.ts`; Vercel enruta por archivo según
`apps/backend/vercel.json`.

---

## Convenciones del proyecto

- **Commits:** [Conventional Commits v1.0.0](https://www.conventionalcommits.org/es/v1.0.0/)
  (`feat`, `fix`, `refactor`, `docs`, `chore`, etc.), agrupados por etapa de dependencia.
- **Estilos:** ningún componente o pantalla define `StyleSheet.create` inline — los
  estilos viven en `src/styles/Nombre.styles.ts`. Colores y tipografía siempre desde
  `theme/tokens.ts`, nunca hex hardcodeado.

---

## Licencia

Proyecto académico. Licencia por definir.
