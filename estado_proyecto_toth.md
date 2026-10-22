# Estado del proyecto TOTH

> Actualizado: 2026-10-22. Este documento resume el estado verificable del repo;
> las directivas completas viven en `AGENTS.md` y `COMPORTAMIENTO_DEL_ASISTENTE.md`.

## 1. Resumen

| Fase | Estado |
| :--- | :--- |
| 0–4 (scaffold, UI, backend, integración + Kotlin) | ✅ Completas |
| 5 (validación final) | 🟡 RAG 3/3 en producción y E2E en emulador OK; falta la prueba de regeneración anti-cliché |

El monorepo (`apps/mobile`, `apps/backend`) usa npm workspaces. Rama de trabajo:
`develop`. Backend desplegado en `https://thoth-backend.vercel.app`.

## 2. Cambios de esta sesión

### Backend

- Umbral RAG por defecto `0.75 → 0.85` (`lib/supabase.ts`, `.env.example`), para evitar
  que consultas no institucionales entren como `institutional`.
- Toggle anti-cliché real: `antiClicheEnabled` viaja de `generateController` a
  `generationService`; con `false` se omite el `NEGATIVE_PROMPT` y no hay regeneración.
  Nuevo campo en `lib/types.ts`.
- Tests nuevos para el toggle: **100 tests pasan**; `tsc --noEmit` OK.
- Script `npm run validate:rag` (`scripts/validate-rag.mjs`): valida los tres casos
  (institucional, web, mixto) y detecta clichés.

### Mobile

- `babel.config.js` robusto: carga `.env` e inyecta `FIREBASE_API_KEY`,
  `FIREBASE_PROJECT_ID` y `API_BASE_URL`, soportando `MemberExpression` y
  `OptionalMemberExpression`. Antes el bundle quedaba con el placeholder
  `REPLACE_WITH_FIREBASE_WEB_API_KEY`.
- `src/config/firebase.ts`: acceso plano a `process.env`, flag `isConfigured` y mensaje
  de error explícito.
- `src/services/apiClient.ts`: usa `API_BASE_URL`, timeout de 45 s con `AbortController`,
  sobre de respuesta `ok` y errores tipados; `vectorSearch` tipado como `{ results, meta }`.
- `src/services/authClient.ts`: guard `FIREBASE_NOT_CONFIGURED` y traducción de errores
  `API_KEY_INVALID` / `CONFIGURATION_NOT_FOUND`.
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

## 3. Validación ejecutada

- `npm test` (backend): **100/100**.
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
- Firebase Auth: la pantalla de Login devuelve “Las credenciales son incorrectas” con
  las cuentas demo, lo que confirma que Firebase está configurado y alcanzable (esas
  cuentas no existen en el proyecto).
- Exportaciones revalidadas (2026-10-22): DOCX y PDF aparecen en
  `/sdcard/Download/TOTH` con nombres acentuados; DOCX con 4 entradas OOXML válidas y
  PDF `%PDF-1.4`; la hoja “Compartir” abre con el archivo adjunto y “Copiar” deja el
  texto en el portapapeles (`text/plain`).
- Historial de chats validado (2026-10-22): en modo invitado se creó una conversación,
  apareció en el directorio, se reabrió con ambos mensajes y sobrevivió a un reinicio de
  la app. El contrato Firestore se validó contra el proyecto real con un usuario temporal
  (PATCH conversación, PATCH mensaje, `runQuery` ordenado y limpieza posterior).
- Producción (2026-10-22): se añadió `SIMILARITY_THRESHOLD=0.85` a Vercel y se desplegó
  `thoth-backend` (`dpl_6Uip6uFWDRKdo5SLAEULhfgqZQ25`). `npm run validate:rag`:
  **3/3 casos OK** (institucional, web, mixto). `/api/v1/health` → `healthy`.

## 4. Pendientes

1. Crear las cuentas demo en Firebase Auth o usar el flujo de registro real.
2. Corregir el perfil en el login real: `signIn` usa `estudiante` como fallback y el
   acceso rápido Docente entra como estudiante. Mientras tanto, para la demo Docente
   usar “Omitir inicio de sesión” → elegir Docente, o implementar la lectura del perfil
   desde `users/{uid}` en Firestore.
3. Verificar el caso de regeneración anti-cliché con una respuesta que contenga
   muletillas (hoy se validó el badge y el envío del toggle).
4. Publicar `firestore.rules` en el proyecto `toth-app-ceaf6` y validar el historial
   autenticado en un dispositivo con una cuenta real.
5. Rotar la Supabase Secret key expuesta previamente y actualizarla en Vercel y `.env`.

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

> No se hace `git push` sin confirmación explícita.

## 6. Notas de entorno

- JDK 17.0.20, Node 24.20.0, Gradle 8.10.2, `ANDROID_HOME` en
  `C:\Users\USUARIO\AppData\Local\Android\Sdk`.
- La imagen Android 17 del emulador muestra el aviso de compatibilidad de páginas de
  16 KB (`libreactnative.so`, `libhermes.so`, etc.); la app corre en modo compatibilidad.
  No afecta a un emulador API 34 ni a dispositivos convencionales.
- PowerShell 5.1 muestra mojibake al leer archivos UTF-8; el contenido del repo es
  correcto (verificado en DOCX y README).
