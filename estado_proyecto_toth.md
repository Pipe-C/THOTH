# Estado del proyecto TOTH

> Actualizado: 2026-11-06. Este documento resume el estado verificable del repo;
> las directivas completas viven en `AGENTS.md` y `COMPORTAMIENTO_DEL_ASISTENTE.md`.

## 1. Resumen

| Fase | Estado |
| :--- | :--- |
| 0–4 (scaffold, UI, backend, integración + Kotlin) | ✅ Completas |
| 5 (validación final) | 🟡 Anti-cliché y fallback web validados con Groq/Tavily reales; RAG institucional y producción bloqueados por la caída DNS de Supabase |

El monorepo (`apps/mobile`, `apps/backend`) usa npm workspaces. Rama de trabajo:
`develop`. Backend desplegado en `https://thoth-backend.vercel.app`.

## 2. Cambios de esta sesión

### Backend

- Umbral RAG por defecto `0.75 → 0.85` (`lib/supabase.ts`, `.env.example`), para evitar
  que consultas no institucionales entren como `institutional`.
- Toggle anti-cliché real: `antiClicheEnabled` viaja de `generateController` a
  `generationService`; con `false` se omite el `NEGATIVE_PROMPT` y no hay regeneración.
  Nuevo campo en `lib/types.ts`.
- Tests nuevos para el toggle: **75 tests pasan**; `tsc --noEmit` OK.
- Script `npm run validate:rag` (`scripts/validate-rag.mjs`): valida los tres casos
  (institucional, web, mixto) y detecta clichés.
- Auth Supabase retirada: `/api/v1/auth/*`, controlador/servicio/repositorio de
  usuarios y tests eliminados. La autenticación vive solo en Firebase Auth; Supabase
  queda como pgvector. La migración `0004_drop_users_table.sql` retira `public.users`.

### Mobile

- `babel.config.js` robusto: carga `.env` e inyecta `FIREBASE_API_KEY`,
  `FIREBASE_PROJECT_ID` y `API_BASE_URL`, soportando `MemberExpression` y
  `OptionalMemberExpression`. Antes el bundle quedaba con el placeholder
  `REPLACE_WITH_FIREBASE_WEB_API_KEY`.
- `src/config/firebase.ts`: acceso plano a `process.env`, flag `isConfigured` y mensaje
  de error explícito.
- `src/services/apiClient.ts`: usa `API_BASE_URL`, timeout de 45 s con `AbortController`,
  sobre de respuesta `ok` y errores tipados; `vectorSearch` tipado como `{ results, meta }`.
- `src/services/authClient.ts`: guard `FIREBASE_NOT_CONFIGURED`, traducción de errores
  `API_KEY_INVALID` / `CONFIGURATION_NOT_FOUND`, persistencia de refresh token y
  renovación automática del `idToken`.
- Registro/login 100 % Firebase: `displayName` se actualiza en Auth, el perfil elegido
  se conserva al reiniciar, hay cierre de sesión y la app restaura la sesión al abrir.
- `ChatScreen`: envía `antiClicheEnabled`, filtra fuentes `'none'`, guarda el turno
  completo en `users/{uid}/conversations/{id}/messages` y mantiene la caché Room.
  Carga el historial al abrir una conversación y muestra estados de carga/error.
- `DirectoryScreen`: lista las conversaciones reales (Firestore o AsyncStorage en modo
  invitado) y las recarga con `useFocusEffect` al volver desde el chat.
- `chatRepository`: fachada que elige Firestore para sesiones autenticadas y
  AsyncStorage para el modo invitado (`guestChatStore`).
- Reglas versionadas: `firestore.rules`, `firebase.json`, `.firebaserc`. Cada usuario
  solo puede leer/escribir `users/{uid}/**`.
- `.env.example`: añade `API_BASE_URL`.

### Android / Kotlin

- `android/app/build.gradle`: plugin `kotlin-kapt` y Room 2.6.1; rutas del monorepo
  (`reactNativeDir`, `codegenDir`, `cliFile`, `hermesCommand`) apuntando al
  `node_modules` hoisteado en la raíz. Se eliminó el `root` override que rompía
  `assembleRelease`.
- Room real: `TothDocument.kt`, `TothDocumentDao.kt`, `TothDatabase.kt`;
  `RoomDatabaseModule.kt` implementa `saveDocument`, `getHistory` y `deleteDocument`.
- `PdfExporterModule.kt`: PDF con paginación (`StaticLayout`), título y pie; DOCX OOXML
  mínimo (ZIP) válido. Salida en `getExternalFilesDir(DIRECTORY_DOCUMENTS)/TOTH`.
- Exportaciones visibles: `publishToDownloads` publica una copia en `Descargas/TOTH`
  vía `MediaStore.Downloads` (API 29+), devuelve un `content://` URI y abre la hoja de
  compartir con `FileProvider`. En API < 29 se comparte el archivo privado con
  `FileProvider` (sin copia pública).
- Portapapeles real con `@react-native-clipboard/clipboard` (el handler anterior solo
  mostraba el aviso, sin copiar).

## 2.1 Cambios de la sesión 2026-11-06

### Backend

- `resolveHybridContext` degrada a contexto web/none si la búsqueda institucional
  falla (`fix(rag)`), en vez de devolver 502. Cubierto por tests unitarios y por una
  prueba de integración real con Groq/Tavily (`tests/integration/ragFallback...`).
- Prueba de integración real del filtro anti-cliché: Groq genera una salida con
  muletillas, el filtro las detecta, se construye el prompt de reescritura y el
  modelo devuelve un texto limpio (`tests/integration/antiCliche...`). Ambas pruebas
  viven tras `RUN_LIVE_TESTS=1` para no consumir cuota en CI.
- Suite: **76 tests pasan, 2 live tests se omiten por defecto**; `tsc --noEmit` OK.

### Mobile

- Rediseño “Serenidad Académica”: tokens ampliados, tipografía Lexend
  (Light/Regular/Medium/SemiBold/Bold), componentes base con touch targets de 44 px,
  accesibilidad, contraste y pantallas pulidas.
- Mensajes de error del chat ya no muestran badges falsos de RAG/anti-cliché.
- Build release Android y E2E en emulador Pixel 7 (Android 17): Login → Directory →
  Chat → RoleSelect, con verificación por `uiautomator dump`.

## 3. Validación ejecutada

- 2026-11-06 — `npm test` (backend): **76/76** pasan; 2 pruebas live omitidas por
  defecto. `RUN_LIVE_TESTS=1` ejecuta la regeneración anti-cliché real y el fallback
  web real: **2/2 OK**. `npm run lint` (tsc --noEmit): OK.
- 2026-11-06 — `npx tsc --noEmit` (mobile): OK. `assembleRelease`: BUILD SUCCESSFUL.
  APK instalada en Pixel 7 (Android 17) y flujo E2E validado por `uiautomator dump`.
- 2026-11-06 — `GET https://thoth-backend.vercel.app/api/v1/health` responde 503
  `degraded` con `supabase: false`, `groq: true` (ver sección 7).
- `npm test` (backend, histórico): **100/100**.
- `npm run lint` (backend, `tsc --noEmit`): OK.
- `npx tsc --noEmit` (mobile): OK.
- `gradlew assembleDebug`: **BUILD SUCCESSFUL**.
- `gradlew assembleRelease`: **BUILD SUCCESSFUL** (APK ~61.5 MB, incluida la key de
  Firebase en el bundle; el placeholder ya no aparece).
- Emulador (Pixel 7, Android 17): APK release instalada y flujo E2E:
  Login → (omitir) → RoleSelect → Directory → Chat.
  - Consulta real al backend: respuesta de Groq con badges “RAG Institucional validado”
    y “Filtro Anti-Cliché ON”.
  - `Exportar PDF`: archivo de ~52 KB, cabecera `%PDF-1.4`, 1 página, `%%EOF` correcto.
  - `Exportar Word`: DOCX de ~1.8 KB, ZIP OOXML válido, `document.xml` con UTF-8
    correcto (é = U+00E9).
- Cuentas demo creadas y verificadas (2026-10-22): login real OK para
  `estudiante.demo@pascualbravo.edu.co` y `docente.investigador@pascualbravo.edu.co`.
  Se validó una conversación autenticada de estudiante con 2 mensajes en Firestore
  (`user` y `assistant`).
- Login real conserva el perfil elegido mediante selector Estudiante/Docente; los
  accesos rápidos configuran credenciales y rol.
- Exportaciones revalidadas (2026-10-22): DOCX y PDF aparecen en
  `/sdcard/Download/TOTH` con nombres acentuados; DOCX con 4 entradas OOXML válidas y
  PDF `%PDF-1.4`; la hoja “Compartir” abre con el archivo adjunto y “Copiar” deja el
  texto en el portapapeles (`text/plain`).
- Historial de chats validado (2026-10-22): en modo invitado se creó una conversación,
  apareció en el directorio, se reabrió con ambos mensajes y sobrevivió a un reinicio de
  la app. El contrato Firestore se validó contra el proyecto real con un usuario temporal
  (PATCH conversación, PATCH mensaje, `runQuery` ordenado y limpieza posterior).
- Reglas Firestore publicadas (2026-10-22) en `toth-app-ceaf6`:
  `firebase deploy --only firestore:rules` → compiladas y liberadas correctamente.
- Producción (2026-10-22): se añadió `SIMILARITY_THRESHOLD=0.85` a Vercel y se desplegó
  `thoth-backend` (`dpl_6Uip6uFWDRKdo5SLAEULhfgqZQ25`). `npm run validate:rag`:
  **3/3 casos OK** (institucional, web, mixto). `/api/v1/health` → `healthy`.
- SonarCloud (2026-10-22): tras los commits `7b76af7` y `4a48ec2`, el Quality Gate de
  `develop` quedó **OK** (`new_security_rating` 1, `new_maintainability_rating` 1,
  cobertura nueva 84.0 %, 100 tests backend antes de retirar auth Supabase; hoy 76).
- PR #26 (`develop` → `main`) mergeado el 2026-10-23 (`7ab2b89`).

## 4. Pendientes

1. **Restaurar Supabase** (proyecto `xrbezcimbdpnmfzevprb`): el host no resuelve DNS
   (`NXDOMAIN`). Actualizar `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` en `.env` y en
   Vercel, y volver a desplegar el backend.
2. **Desplegar el backend** con el fallback web (`fix(rag)`) y verificar `/health`
   (`healthy`) y `npm run validate:rag` (3/3). Requiere confirmación explícita.
3. Aplicar `0004_drop_users_table.sql` cuando Supabase esté operativo y verificar que no
   queden referencias a `public.users`.
4. Rotar la Supabase Secret key expuesta previamente y actualizarla en Vercel y `.env`.
5. Pushear los commits locales de `develop` y abrir PR `develop` → `main`.
6. Añadir notificaciones push con FCM (requiere `google-services.json` y cuenta de
   servicio de Firebase) y evaluar verificación de correo institucional.
7. Cargar documentos institucionales reales en `apps/backend/documents/` y ejecutar
   `npm run ingest` cuando Supabase esté disponible.

## 5. Commits realizados (por capas)

1. `fix(rag): sube el umbral de similitud a 0.85`
2. `feat(backend): respeta el toggle anti-cliché en la generación`
3. `feat(backend): añade script de validación del RAG híbrido`
4. `fix(mobile): inyecta la configuración de Firebase desde .env`
5. `fix(mobile): alinea apiClient con el contrato v1 del backend`
6. `feat(mobile): persiste el historial y refresca el directorio`
7. `build(android): corrige rutas del monorepo y añade Room`
8. `feat(android): implementa Room y exportación PDF/Word reales`
9. `docs: actualiza estado del proyecto y guía de validación`
10. `fix(firebase): corrige la sintaxis de las reglas de Firestore`
11. `docs: registra la publicación de las reglas de Firestore`
12. `fix(auth): conserva el perfil elegido al iniciar sesión`
13. `fix(backend): simplifica la validación de credenciales`
14. `fix(mobile): resuelve hallazgos de seguridad y complejidad de Sonar`
15. `refactor(backend): retira la autenticación paralela de Supabase`
16. `feat(mobile): completa registro, login y sesión con Firebase`
17. `docs: documenta Firebase Auth como única autenticación`
18. `fix(rag): degrada a web cuando falla la búsqueda institucional`
19. `feat(mobile): incorpora la tipografía Lexend`
20. `feat(theme): amplía tokens de identidad y accesibilidad`
21. `feat(ui): mejora componentes base con accesibilidad y contraste`
22. `feat(mobile): rediseña pantallas del flujo académico`
23. `test(backend): valida anti-cliché y fallback web con servicios reales`

> No se hace `git push` sin confirmación explícita.

## 7. Bloqueo actual (2026-11-06)

- `xrbezcimbdpnmfzevprb.supabase.co` no resuelve (`NXDOMAIN` desde 8.8.8.8).
  El backend productivo responde `503 degraded` (`supabase: false`, `groq: true`).
- El código local ya degrada a web/none y se validó en vivo con Tavily/Groq, pero
  **producción sigue ejecutando la versión anterior** hasta que se autorice el deploy.
- La app móvil instalada muestra el error de base vectorial porque apunta al backend
  productivo. Al restaurar Supabase y redesplegar, el flujo RAG vuelve a funcionar sin
  cambios adicionales en la app.

## 6. Notas de entorno

- JDK 17.0.20, Node 24.20.0, Gradle 8.10.2, `ANDROID_HOME` en
  `C:\Users\USUARIO\AppData\Local\Android\Sdk`.
- La imagen Android 17 del emulador muestra el aviso de compatibilidad de páginas de
  16 KB (`libreactnative.so`, `libhermes.so`, etc.); la app corre en modo compatibilidad.
  No afecta a un emulador API 34 ni a dispositivos convencionales.
- PowerShell 5.1 muestra mojibake al leer archivos UTF-8; el contenido del repo es
  correcto (verificado en DOCX y README).
