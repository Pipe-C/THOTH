# GUIA_COMMITS.md — TOTH

> Detalle extendido de la **Política de Commits** declarada como regla permanente en
> `AGENTS.md`, sección 9. Esta política no es un prompt que se repite cada vez — aplica
> automáticamente a todo cambio del repositorio, siguiendo
> [Conventional Commits v1.0.0](https://www.conventionalcommits.org/es/v1.0.0/) y
> respetando el orden de dependencia entre capas del proyecto. Este documento existe para
> el detalle (tablas, ejemplos) que sería demasiado extenso para vivir dentro del spec
> principal.

---

## 1. Por qué "por etapas" y no "todo en un commit"

Un solo commit gigante ("scaffold completo de TOTH") es difícil de revisar, difícil de
revertir si algo falla, y no cuenta la historia real de cómo se construyó el proyecto.
La idea es que el historial de git sea legible: cada commit debe poder aplicarse solo,
sin depender de código que todavía no existe.

Por eso el orden importa: no tiene sentido commitear `ChatScreen.tsx` antes que los
tokens de tema que usa, ni la convención de `styles/` antes que los componentes que la
adoptan.

---

## 2. Tipos de Conventional Commits usados en este proyecto

| Tipo | Cuándo usarlo en TOTH |
| :--- | :--- |
| `feat` | Nueva funcionalidad visible: un componente, una pantalla, un endpoint. |
| `fix` | Corrección de un comportamiento roto. |
| `refactor` | Reorganización de código sin cambiar comportamiento (ej. mover estilos inline a `styles/`). **No usar `style` para esto** — ver nota abajo. |
| `style` | Solo formato/espaciado/linting, sin tocar lógica ni estructura de archivos. |
| `docs` | Cambios en `README.md`, `docs/`, comentarios de documentación. |
| `chore` | Configuración, dependencias, scaffolding inicial, `.gitignore`, `tsconfig`. |
| `build` | Cambios en el sistema de build (`vercel.json`, `package.json` de scripts). |
| `test` | Pruebas (cuando existan). |

> **Nota importante:** mover el bloque `StyleSheet.create` de un `.tsx` a su propio
> `Nombre.styles.ts` es una reestructuración de código, no un cambio de formato — usa
> `refactor`, no `style`. El tipo `style` en Conventional Commits es específicamente para
> formato de código (espacios, punto y coma, etc.), no para estilos visuales de la app.
> Confundir esto es el error más común al aplicar la spec en proyectos de UI.

---

## 3. Scopes sugeridos (el `(scope)` entre paréntesis)

Usa el scope para indicar qué parte del monorepo toca el commit:

- `(mobile)` — cambios generales de `apps/mobile`
- `(backend)` — cambios generales de `apps/backend`
- `(theme)` — `tokens.ts`, `tailwind.config.js`
- `(ui)` — componentes base (`Card`, `Button`, `Input`, `Toggle`, `Badge`, `Typography`, `PaperResultViewer`)
- `(styles)` — la convención `Nombre.styles.ts` y su carpeta
- `(screens)` — pantallas (`RegisterScreen`, `LoginScreen`, etc.)
- `(navigation)` — `AppNavigator` y tipos de navegación
- `(mock)` — datos de prueba (`mockData.ts`)
- `(types)` — interfaces de dominio y tipos de rutas (`types/index.ts`, `navigation/types.ts`)
- `(rag)` — lógica de RAG híbrido / vector search
- `(gemini)` — integración con Gemini / anti-cliché
- `(docs)` — documentación general del repo

---

## 4. Orden de dependencia: guía por defecto, no ley fija

La lista siguiente es un punto de partida razonable, **pero la regla vinculante real es
otra**: ningún commit puede importar código que se introduzca en un commit posterior.
Antes de aplicar esta lista tal cual, audita los imports reales del código — si
`AppNavigator` importa las pantallas, navegación va *después* de screens, no antes; si
las pantallas importan `mockData`, mock va *antes* de screens, etc. Cuando el grafo real
contradiga el orden ilustrativo, gana el grafo real, y el agente debe explicar el desvío.

1. **`chore`** — scaffold del monorepo, `package.json`, `tsconfig.json`, `.gitignore`, configuración base.
2. **`feat(theme)`** — tokens de identidad visual (`tokens.ts`, `tailwind.config.js`).
3. **`refactor(styles)` o `feat(styles)`** — convención `styles/`. Usa `refactor` si estás
   documentando que el código pasó por una etapa inline antes (historia real del
   desarrollo, aunque no haya quedado registrada en commits previos); usa `feat` si es la
   primera vez que ese código entra al historial de git.
4. **`feat(ui)`** — componentes base que consumen tokens y estilos.
5. **`feat(types)`** — interfaces de dominio y tipos, cuando otras capas dependan de ellos.
6. **`feat(mock)`** — datos de prueba (antes de las pantallas que los importan).
7. **`feat(screens)`** — las pantallas.
8. **`feat(navigation)`** — el navegador (después de las pantallas que importa).
9. **`docs`** — `README.md`, `docs/GUIA_COMMITS.md`, plantillas.

---

## 5. Cómo se activa esto en la práctica

No hace falta pegar ningún prompt: cualquier agente que lea `AGENTS.md` (sección 9)
antes de tocar el repo ya conoce la regla. Si en algún momento un agente propone un
commit que no la respeta (por ejemplo, agrupa capas distintas, o usa `style` para un
cambio de reestructuración), basta con señalarle la sección 9 del spec — no con
reexplicar todo el criterio desde cero.

Si quieres forzar el chequeo al final de una sesión larga, un recordatorio corto basta:

```
Antes de continuar, verifica que los commits pendientes cumplan la Política de Commits
de AGENTS.md sección 9 (tipo/scope correcto, orden de dependencia, sin agrupar capas).
Muéstrame git status y git diff --stat antes de commitear.
```

---

## 6. Ejemplo de historial esperado (ilustrativo — el orden real depende del grafo de imports)

```
chore: scaffold inicial del monorepo (apps/mobile, apps/backend)
feat(theme): define tokens de identidad visual y tailwind config
refactor(styles): establece convención src/styles/*.styles.ts
feat(ui): agrega componentes base Card, Button, Input, Toggle, Badge
feat(types): define interfaces de dominio y tipos de rutas
feat(mock): centraliza datos de prueba en mockData.ts
feat(screens): agrega las 5 pantallas del flujo principal con mock data
feat(navigation): configura AppNavigator y punto de entrada
docs: agrega README.md, guía de commits y plantillas
```

> Este ejemplo ya refleja una corrección real hecha por OpenCode sobre la primera versión
> de este documento: `mock` va antes de `screens` (las pantallas lo importan) y
> `navigation` va después de `screens` (el navegador las importa) — al revés de como se
> había escrito originalmente. Es el caso de ejemplo de por qué el grafo real de imports
> siempre gana sobre esta lista ilustrativa.
