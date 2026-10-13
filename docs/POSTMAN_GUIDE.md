# Guía Completa de Pruebas en Postman desde Cero — TOTH API v1

> **Propósito:** Esta guía explica paso a paso cómo iniciar el servidor backend con Express y probar los 5 endpoints de la API de TOTH desde Postman de forma limpia, ordenada y ejecutable desde cero.

---

## Índice

1. [Requisitos Previos y Configuración Inicial](#1-requisitos-previos-y-configuración-inicial)
2. [Configuración de Variables de Entorno (`.env`)](#2-configuración-de-variables-de-entorno-env)
3. [Iniciar el Backend](#3-iniciar-el-backend)
4. [Configuración en Postman desde Cero](#4-configuración-en-postman-desde-cero)
5. [Estándar de Respuesta de la API](#5-estándar-de-respuesta-de-la-api)
6. [Prueba Paso a Paso de los Endpoints](#6-prueba-paso-a-paso-de-los-endpoints)
   - 6.1 `GET /api/v1/health`
   - 6.2 `POST /api/v1/auth/register`
   - 6.3 `POST /api/v1/auth/login`
   - 6.4 `POST /api/v1/vector-search`
   - 6.5 `POST /api/v1/generate`
7. [Casos de Prueba Negativos](#7-casos-de-prueba-negativos)
8. [Resumen de Rutas](#8-resumen-de-rutas)

---

## 1. Requisitos Previos y Configuración Inicial

### 1.1 Herramientas Necesarias
- **Node.js** (versión 20 o superior recomendada).
- **Postman Desktop** (descargar desde [postman.com/downloads](https://www.postman.com/downloads/)) o Postman Web ([web.postman.co](https://web.postman.co)).

### 1.2 Instalación de Dependencias
Abre una terminal y navega a la carpeta del backend en el monorepo:

```bash
cd apps/backend
npm install
```

---

## 2. Configuración de Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz de `apps/backend` con las llaves de acceso necesarias:

```env
# Puerto del servidor local Express (Opcional, por defecto 3000)
PORT=3000

# Entorno
NODE_ENV=development

# Supabase (Base de datos vectorial pgvector)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SIMILARITY_THRESHOLD=0.75

# Google Gemini API
GEMINI_API_KEY=tu_gemini_api_key_aqui

# Tavily Web Search (Opcional)
TAVILY_API_KEY=tu_tavily_api_key_aqui
```

---

## 3. Iniciar el Backend

Tienes dos formas de iniciar la API backend para interactuar con Postman:

### Opción A: Desarrollo Local con Express (Recomendada para Postman)

Ejecuta el servidor Express con recarga automática:

```bash
npm run dev:local
```

Verás el siguiente log en la consola confirmando que el servidor está listo:

```text
🚀 THOTH Express Backend running at: http://localhost:3000

📌 Endpoints available for Postman:
   GET  http://localhost:3000/api/v1/health
   POST http://localhost:3000/api/v1/auth/register
   POST http://localhost:3000/api/v1/auth/login
   POST http://localhost:3000/api/v1/vector-search
   POST http://localhost:3000/api/v1/generate
```

### Opción B: Entorno Vercel Serverless

Si prefieres emular la ejecución Serverless de Vercel:

```bash
npm run dev
```

Esto levantará el backend a través de Vercel CLI en `http://localhost:3000`.

---

## 4. Configuración en Postman desde Cero

### 4.1 Crear un Workspace
1. Abre Postman.
2. En la barra lateral, haz clic en **Workspaces** > **Create Workspace**.
3. Nombra el workspace `TOTH` y selecciona visibilidad **Personal**.

### 4.2 Crear el Environment (Entorno)
Para evitar escribir `http://localhost:3000` en cada petición:

1. En la barra lateral izquierda, selecciona **Environments** > **`+` (Create Environment)**.
2. Nombra el environment `TOTH Local`.
3. Añade las siguientes variables:

| Variable | Initial Value | Current Value |
| :--- | :--- | :--- |
| `base_url` | `http://localhost:3000` | `http://localhost:3000` |
| `api_version` | `v1` | `v1` |

4. Haz clic en **Save** (Ctrl+S / Cmd+S).
5. En la esquina superior derecha de Postman, selecciona `TOTH Local` en el menú desplegable de environments.

### 4.3 Crear la Colección de Peticiones
1. En la barra lateral izquierda, selecciona **Collections** > **`+` (Create Collection)**.
2. Nombra la colección `TOTH API v1`.
3. *(Opcional)* Organiza los endpoints en 3 subcarpetas: `Health`, `Auth` y `RAG`.

---

## 5. Estándar de Respuesta de la API

Todos los endpoints devuelven respuestas en formato JSON estandarizado.

### Respuesta Exitosa (`ok: true`)

```json
{
  "ok": true,
  "version": "v1",
  "data": { ... },
  "meta": {
    "requestId": "toth-1717000000000-ab1cd2",
    "timestamp": "2026-10-08T15:30:00.000Z"
  }
}
```

### Respuesta de Error (`ok: false`)

```json
{
  "ok": false,
  "version": "v1",
  "error": {
    "code": "MISSING_FIELDS",
    "message": "Campos requeridos faltantes: email, password",
    "detail": "Detalles técnicos (solo visible en desarrollo)"
  },
  "meta": {
    "requestId": "toth-1717000000000-xy9z10",
    "timestamp": "2026-10-08T15:30:01.000Z"
  }
}
```

---

## 6. Prueba Paso a Paso de los Endpoints

---

### 6.1 GET `/api/v1/health`

Verifica que el servidor backend y las conexiones externas (Supabase y Gemini) estén activas.

- **Método:** `GET`
- **URL:** `{{base_url}}/api/{{api_version}}/health`
- **Headers:** *(Ninguno requerido)*
- **Body:** *(Ninguno)*

#### Respuesta Esperada (200 OK):
```json
{
  "ok": true,
  "version": "v1",
  "data": {
    "status": "healthy",
    "version": "v1",
    "services": {
      "supabase": true,
      "gemini": true
    },
    "latencyMs": 142,
    "environment": "development"
  },
  "meta": {
    "requestId": "toth-1717000000000-ab1cd2",
    "timestamp": "2026-10-08T15:30:00.000Z"
  }
}
```

---

### 6.2 POST `/api/v1/auth/register`

Registra un nuevo usuario validando el dominio institucional `@pascualbravo.edu.co`.

- **Método:** `POST`
- **URL:** `{{base_url}}/api/{{api_version}}/auth/register`
- **Headers:** `Content-Type: application/json`
- **Body (`raw` -> `JSON`):**

```json
{
  "email": "estudiante.prueba@pascualbravo.edu.co",
  "password": "MiPasswordSegura123",
  "displayName": "Estudiante de Prueba",
  "profile": "estudiante"
}
```

#### Campos del Body:
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `email` | `string` | Sí | Debe ser del dominio `@pascualbravo.edu.co` |
| `password` | `string` | Sí | Mínimo 8 caracteres |
| `displayName` | `string` | Sí | Nombre del usuario |
| `profile` | `string` | Sí | Perfil: `"estudiante"` o `"docente"` |

#### Respuesta Esperada (201 Created):
```json
{
  "ok": true,
  "version": "v1",
  "data": {
    "uid": "mock_1717000000000",
    "email": "estudiante.prueba@pascualbravo.edu.co",
    "displayName": "Estudiante de Prueba",
    "profile": "estudiante",
    "createdAt": "2026-10-08T15:30:00.000Z"
  }
}
```

---

### 6.3 POST `/api/v1/auth/login`

Inicia sesión con credenciales institucionales.

- **Método:** `POST`
- **URL:** `{{base_url}}/api/{{api_version}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (`raw` -> `JSON`):**

```json
{
  "email": "estudiante.prueba@pascualbravo.edu.co",
  "password": "MiPasswordSegura123"
}
```

#### Respuesta Esperada (200 OK):
```json
{
  "ok": true,
  "version": "v1",
  "data": {
    "uid": "mock_user_estudiante.prueba",
    "email": "estudiante.prueba@pascualbravo.edu.co",
    "idToken": "MOCK_ID_TOKEN_REPLACE_IN_PHASE_4",
    "expiresIn": 3600,
    "profile": "estudiante"
  }
}
```

---

### 6.4 POST `/api/v1/vector-search`

Realiza una búsqueda semántica de fragmentos en la base de datos institucional de Supabase (pgvector).

- **Método:** `POST`
- **URL:** `{{base_url}}/api/{{api_version}}/vector-search`
- **Headers:** `Content-Type: application/json`
- **Body (`raw` -> `JSON`):**

```json
{
  "query": "¿Cuáles son los requisitos de grado e inscripción de materias?",
  "topK": 3
}
```

#### Campos del Body:
| Campo | Tipo | Requerido | Por Defecto | Descripción |
| :--- | :--- | :---: | :---: | :--- |
| `query` | `string` | Sí | - | Texto para búsqueda semántica |
| `topK` | `number` | No | 5 | Máximo número de fragmentos (1 a 20) |

#### Respuesta Esperada (200 OK):
```json
{
  "ok": true,
  "version": "v1",
  "data": {
    "results": [
      {
        "id": "chunk_abc123",
        "content": "El estudiante debe acreditar 160 créditos académicos...",
        "metadata": {
          "source": "reglamento_estudiantil.pdf",
          "document_type": "reglamento"
        },
        "similarity": 0.89
      }
    ],
    "meta": {
      "query": "¿Cuáles son los requisitos de grado e inscripción de materias?",
      "topK": 3,
      "totalFound": 1,
      "similarityThreshold": 0.75,
      "latencyMs": 180
    }
  }
}
```

---

### 6.5 POST `/api/v1/generate`

Ejecuta el flujo completo del orquestador RAG e invoca el modelo Gemini con el filtro de calidad anti-cliché.

- **Método:** `POST`
- **URL:** `{{base_url}}/api/{{api_version}}/generate`
- **Headers:** `Content-Type: application/json`
- **Body (`raw` -> `JSON`):**

```json
{
  "prompt": "Explica el concepto de polimorfismo y herencia en programación orientada a objetos",
  "profile": "estudiante",
  "documentType": "ensayo",
  "userId": "usr_felipe_123",
  "wordCount": 300,
  "subject": "Programación Orientada a Objetos"
}
```

#### Campos del Body:
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `prompt` | `string` | Sí | Indicación o consulta académica |
| `profile` | `string` | Sí | `"estudiante"` o `"docente"` |
| `documentType` | `string` | Sí | Validos: `ensayo`, `informe_laboratorio`, `guia_clase`, `articulo`, `resumen` |
| `userId` | `string` | Sí | Identificador del usuario |
| `wordCount` | `number` | No | Extensión deseada en palabras |
| `subject` | `string` | No | Asignatura o curso |

#### Respuesta Esperada (200 OK):
```json
{
  "ok": true,
  "version": "v1",
  "data": {
    "text": "El polimorfismo y la herencia son pilares fundamentales de la POO...",
    "sources_used": ["institutional"],
    "metadata": {
      "model": "gemini-2.0-flash",
      "profile": "estudiante",
      "documentType": "ensayo",
      "regenerated": false,
      "processingTimeMs": 1420,
      "userId": "usr_felipe_123"
    }
  }
}
```

---

## 7. Casos de Prueba Negativos

Para asegurar la robustez del servidor, puedes probar estos casos de error en Postman:

1. **Email Externo en Registro/Login:**
   - Enviar `email: "usuario@gmail.com"` en `POST /api/v1/auth/register`.
   - **Resultado esperado:** `400 Bad Request` con `code: "INVALID_DOMAIN"`.

2. **Perfil Inválido:**
   - Enviar `profile: "administrador"` en `POST /api/v1/generate`.
   - **Resultado esperado:** `400 Bad Request` con `code: "VALIDATION_ERROR"`.

3. **Campos Faltantes:**
   - Enviar `{}` (body vacío) en `POST /api/v1/auth/login`.
   - **Resultado esperado:** `400 Bad Request` con `code: "MISSING_FIELDS"`.

4. **Ruta Inexistente:**
   - Hacer `GET` a `/api/v1/ruta-inexistente`.
   - **Resultado esperado:** `404 Not Found` con `code: "NOT_FOUND"`.

---

## 8. Resumen de Rutas

| # | Método | Ruta | Descripción |
| :-: | :-: | :--- | :--- |
| 1 | `GET` | `/api/v1/health` | Estado del sistema y servicios externos |
| 2 | `POST` | `/api/v1/auth/register` | Registro de usuario con correo institucional |
| 3 | `POST` | `/api/v1/auth/login` | Autenticación de usuario |
| 4 | `POST` | `/api/v1/vector-search` | Búsqueda vectorial semántica (pgvector) |
| 5 | `POST` | `/api/v1/generate` | Generación RAG + Gemini con filtro anti-cliché |

- **Base URL local:** `http://localhost:3000`
- **Prefijo de versión:** `/api/v1/`
- **Header obligatorio para POST:** `Content-Type: application/json`
