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
| 3 | Backend: Vercel + Gemini + Supabase RAG | 🔜 En progreso |
| 4 | Integración real frontend-backend + puente Kotlin | ⏳ Pendiente |
| 5 | Integración y validación final | ⏳ Pendiente |

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
| LLM | Google Gen AI SDK — Gemini 3.8 Flash (`gemini-3.8-flash`) |
| Vector DB (RAG institucional) | Supabase (pgvector) |
| Búsqueda web (grounding) | Google Search Grounding / Tavily |

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
│   │       ├── services/       # Datos mock (clientes Firebase/API reales en Fase 4)
│   │       └── types/          # Interfaces compartidas (User, ChatMessage...)
│   └── backend/                # Orquestador serverless en Vercel (Fase 3 en curso)
│       ├── api/                # generate, vector-search, auth (a implementar)
│       └── lib/                # Gemini, Supabase, filtro anti-cliché (a implementar)
└── docs/
    └── prompt-templates/       # Plantillas de prompt por tipo de entregable académico
```

---

## Puesta en marcha

### Requisitos previos

- Node.js 18+
- npm o yarn
- Android Studio (para compilar el módulo nativo Kotlin y correr el emulador/dispositivo)
- Cuenta de Firebase, proyecto de Supabase y API key de Gemini (Google AI Studio)

### Instalación

El repo es un monorepo con [npm workspaces](https://docs.npmjs.com/cli/v9/using-npm/workspaces):
`apps/mobile` y `apps/backend` se instalan desde la raíz con un solo comando.

```bash
git clone https://github.com/Pipe-C/THOTH.git
cd THOTH

# Instala las dependencias de todos los workspaces
npm install
```

### Variables de entorno (backend)

Crea un archivo `.env` dentro de `apps/backend` (nunca lo subas al repo) con:

```env
GEMINI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TAVILY_API_KEY=
```

### Correr el proyecto

```bash
# App móvil (desde apps/mobile)
npx react-native run-android

# Backend en local (desde apps/backend)
vercel dev
```

---

## Flujo de datos (RAG híbrido)

```
Cliente móvil → Vercel (/api/generate)
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
Vector Search               Web Search Grounding
(Supabase pgvector,          (fallback si la similitud
fondo Pascual Bravo)          institucional es baja)
      └─────────────┬─────────────┘
                     ▼
        Contexto combinado → Gemini 3.8 Flash
                     ▼
          Filtro anti-cliché (post-procesado)
                     ▼
           Respuesta sanitizada al móvil
```

El contexto institucional siempre tiene prioridad; la web solo complementa cuando hay
vacíos de información o el tema requiere datos vigentes.

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
