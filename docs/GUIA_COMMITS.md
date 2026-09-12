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
- `(rag)` — lógica de RAG híbrido / vector search
- `(gemini)` — integración con Gemini / anti-cliché
- `(docs)` — documentación general del repo

---

## 4. Orden de dependencia recomendado (de primero a último)

1. **`chore`** — scaffold del monorepo, `package.json`, `tsconfig.json`, `.gitignore`, configuración base.
2. **`feat(theme)`** — tokens de identidad visual (`tokens.ts`, `tailwind.config.js`).
3. **`feat(ui)`** — componentes base que consumen esos tokens.
4. **`refactor(styles)`** — convención `styles/` (si se hizo después de crear los componentes con estilos inline).
5. **`feat(navigation)`** — `AppNavigator` y tipos de rutas.
6. **`feat(screens)`** — las 5 pantallas (puede ser un commit por pantalla si prefieres granularidad máxima, o uno solo si se construyeron como unidad).
7. **`feat(mock)`** — datos de prueba usados por las pantallas.
8. **`docs`** — `README.md`, plantillas en `docs/prompt-templates/`.

Nunca committees un paso que depende de código de un paso posterior (ej. no commitees
pantallas antes que los componentes que importan).

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

## 6. Ejemplo de historial esperado

```
chore: scaffold inicial del monorepo (apps/mobile, apps/backend)
feat(theme): define tokens de identidad visual y tailwind config
feat(ui): agrega componentes base Card, Button, Input, Toggle, Badge
refactor(styles): extrae estilos inline a convención src/styles/*.styles.ts
feat(navigation): configura AppNavigator con tema visual global
feat(screens): agrega RegisterScreen, LoginScreen y RoleSelectScreen con mock data
feat(screens): agrega DirectoryScreen y ChatScreen con mock data
feat(mock): centraliza datos de prueba en mockData.ts
docs: agrega README.md del proyecto
```
