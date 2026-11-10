# Guia de configuracion en Postman -- TOTH API v1

> Propósito: describir como importar, configurar y probar los 3 endpoints del
> backend de TOTH desde Postman de forma ordenada y reproducible.

---

## Indice

1. Configuracion inicial
2. Estandar de respuesta de la API
3. Variables de entorno en Postman
4. Coleccion TOTH - Endpoints
5. Casos de prueba negativos
6. Importar la coleccion

---

## 1. Configuracion inicial

### 1.1 Instalar / abrir Postman

Descarga Postman Desktop desde https://www.postman.com/downloads/
o usa la version web en https://web.postman.co.

### 1.2 Crear un Workspace

1. En la barra lateral, haz clic en Workspaces > Create Workspace.
2. Nombra el workspace TOTH y selecciona visibilidad Personal.

### 1.3 Arrancar el servidor local

    cd apps/backend
    npx vercel dev

Vercel Dev arranca en http://localhost:3000 por defecto.

---

## 2. Estandar de respuesta de la API

Todos los endpoints devuelven JSON con la misma forma canonica.

### Respuesta exitosa (ok: true)

    {
      ok: true,
      version: v1,
      data: { ... },
      meta: {
        requestId: toth-1717000000000-ab1cd2,
        timestamp: 2026-10-08T15:30:00.000Z
      }
    }

### Respuesta de error (ok: false)

    {
      ok: false,
      version: v1,
      error: {
        code: MISSING_FIELDS,
        message: Campos requeridos faltantes: email, password,
        detail: solo visible en NODE_ENV distinto de production
      },
      meta: {
        requestId: toth-1717000000000-xy9z10,
        timestamp: 2026-10-08T15:30:01.000Z
      }
    }

### Codigos de error internos

| Codigo              | HTTP | Cuando ocurre                              |
|:--------------------|:----:|:-------------------------------------------|
| MISSING_FIELDS      | 400  | Faltan campos requeridos en el body         |
| VALIDATION_ERROR    | 400  | Valor de campo invalido (enum, formato)     |

| METHOD_NOT_ALLOWED  | 405  | Verbo HTTP incorrecto para la ruta          |
| RATE_LIMIT_EXCEEDED | 429  | Demasiadas solicitudes en poco tiempo       |
| LLM_ERROR           | 502  | Error de comunicacion con Groq              |
| DB_ERROR            | 502  | Error de comunicacion con Supabase          |
| INTERNAL_ERROR      | 500  | Error inesperado del servidor               |

---

## 3. Variables de entorno en Postman

Crea un Environment en Postman para no repetir la URL base en cada request.

### Pasos para crear el Environment

1. En la barra lateral: Environments > + (Create Environment).
2. Nombra el environment TOTH Local.
3. Agrega estas variables:

| Variable    | Initial Value           | Current Value           |
|:------------|:------------------------|:------------------------|
| base_url    | http://localhost:3000   | http://localhost:3000   |
| api_version | v1                      | v1                      |

4. Haz clic en Save.
5. En la esquina superior derecha de Postman, selecciona TOTH Local como
   environment activo.

Para produccion: importa el environment ya incluido en este repo,
`docs/TOTH_Production.postman_environment.json` (base_url =
https://thoth-backend.vercel.app), y alterna entre TOTH Local y TOTH
Production sin tocar los requests individuales. La coleccion incluida
`docs/TOTH_API_v1.postman_collection.json` ya trae ese base_url embebido
como variable, asi que tambien funciona sin importar el environment.

---

## 4. Coleccion TOTH - Endpoints

### Crear la coleccion

1. En la barra lateral: Collections > + > Blank Collection.
2. Nombra la coleccion TOTH API v1.
3. Crea estas carpetas dentro: Health y RAG.

> La autenticacion vive en Firebase Auth dentro de la app movil. El backend
> expone solo Health y los endpoints publicos de RAG; no validan
> `Authorization`.

---

### 4.1  GET /api/v1/health

Carpeta: Health
Proposito: verificar que el servidor y todos los servicios externos estan operativos.

Configuracion en Postman:

| Campo   | Valor                                          |
|:--------|:-----------------------------------------------|
| Metodo  | GET                                            |
| URL     | {{base_url}}/api/{{api_version}}/health        |
| Headers | ninguno requerido                              |
| Body    | ninguno                                        |

Respuesta esperada - 200 OK (servicios sanos):

    {
      "ok": true,
      "version": "v1",
      "data": {
        "status": "healthy",
        "version": "v1",
        "services": {
          "supabase": true,
          "groq": true
        },
        "latencyMs": 342,
        "environment": "development"
      },
      "meta": {
        "requestId": "toth-1717000000000-ab1cd2",
        "timestamp": "2026-10-08T15:30:00.000Z"
      }
    }

Respuesta esperada - 503 Service Unavailable (algun servicio caido):

    {
      "ok": true,
      "version": "v1",
      "data": {
        "status": "degraded",
        "services": {
          "supabase": false,
          "groq": true
        },
        "latencyMs": 5001
      }
    }

Nota: ok es true incluso en 503 porque el endpoint respondio; el estado
degradado esta en data.status. Esto permite distinguir entre API inalcanzable
(no llega nada) y API disponible pero servicios degradados.

---

### 4.2  POST /api/v1/vector-search

Carpeta: RAG
Proposito: buscar fragmentos del fondo documental institucional del Pascual Bravo
por similitud semantica (coseno).

Configuracion en Postman:

| Campo   | Valor                                              |
|:--------|:---------------------------------------------------|
| Metodo  | POST                                               |
| URL     | {{base_url}}/api/{{api_version}}/vector-search     |
| Header  | Content-Type: application/json                     |

Body (tab Body > raw > JSON):

    {
      "query": "Cuales son los requisitos de grado en Ingenieria de Sistemas?",
      "topK": 5
    }

Campos del body:

| Campo | Tipo   | Req | Default | Descripcion                    |
|:------|:-------|:---:|:-------:|:-------------------------------|
| query | string | Si  | -       | Texto de consulta semantica    |
| topK  | number | No  | 5       | Maximo de resultados (1 a 20)  |

Respuesta exitosa - 200 OK:

    {
      "ok": true,
      "version": "v1",
      "data": {
        "results": [
          {
            "id": "chunk_abc123",
            "content": "El estudiante debe acreditar 170 creditos academicos...",
            "metadata": {
              "source": "reglamento_grados_2024.pdf",
              "document_type": "reglamento",
              "created_at": "2024-03-01T00:00:00.000Z"
            },
            "similarity": 0.91
          }
        ],
        "meta": {
          "query": "...",
          "topK": 5,
          "totalFound": 1,
          "similarityThreshold": 0.75,
          "latencyMs": 210
        }
      }
    }

Errores esperados:

| Escenario                  | Code             | HTTP |
|:---------------------------|:-----------------|:----:|
| Falta query                | MISSING_FIELDS   | 400  |
| query vacia ("")           | VALIDATION_ERROR | 400  |
| Error de conexion Supabase | DB_ERROR         | 502  |

---

### 4.3  POST /api/v1/generate

Carpeta: RAG
Proposito: orquestador principal. Ejecuta el flujo RAG hibrido completo:
busqueda vectorial > contexto web > Groq > filtro anti-cliche > respuesta final.

Configuracion en Postman:

| Campo   | Valor                                          |
|:--------|:-----------------------------------------------|
| Metodo  | POST                                           |
| URL     | {{base_url}}/api/{{api_version}}/generate      |
| Header  | Content-Type: application/json                 |

Body - Caso Estudiante / Ensayo:

    {
      "prompt": "Explica el concepto de recursividad y cuando es preferible sobre la iteracion",
      "profile": "estudiante",
      "documentType": "ensayo",
      "userId": "a1b2c3d4-1111-4222-8333-444455556666",
      "wordCount": 400,
      "subject": "Fundamentos de Programacion"
    }

Body - Caso Docente / Guia de Clase:

    {
      "prompt": "Disena una guia de clase sobre analisis de algoritmos con notacion Big-O",
      "profile": "docente",
      "documentType": "guia_clase",
      "userId": "b2c3d4e5-2222-4333-9444-555566667777",
      "subject": "Analisis y Diseno de Algoritmos"
    }

Body - Caso Informe de Laboratorio:

    {
      "prompt": "Informe sobre la practica de medicion de resistencia con multimetro",
      "profile": "estudiante",
      "documentType": "informe_laboratorio",
      "userId": "c3d4e5f6-3333-4444-8555-666677778888",
      "subject": "Circuitos Electricos I"
    }

Campos del body:

| Campo        | Tipo              | Req | Descripcion                          |
|:-------------|:------------------|:---:|:-------------------------------------|
| prompt       | string            | Si  | Instruccion o pregunta del usuario   |
| profile      | estudiante/docente | Si | Perfil activo                        |
| documentType | string            | Si  | Ver valores validos abajo            |
| userId       | string            | Si  | ID Firebase del usuario              |
| wordCount    | number            | No  | Extension aproximada en palabras     |
| subject      | string            | No  | Curso o asignatura                   |

Valores validos de documentType:
  ensayo | informe_laboratorio | guia_clase | articulo | resumen

Respuesta exitosa - 200 OK:

    {
      "ok": true,
      "version": "v1",
      "data": {
        "text": "La recursividad es una tecnica en la que una funcion se llama a si misma...",
        "sources_used": ["institutional", "web"],
        "metadata": {
          "model": "openai/gpt-oss-120b",
          "profile": "estudiante",
          "documentType": "ensayo",
          "regenerated": false,
          "processingTimeMs": 1842,
          "userId": "a1b2c3d4-1111-4222-8333-444455556666"
        }
      }
    }

Valores posibles de sources_used:

| Valor                      | Significado                                        |
|:---------------------------|:---------------------------------------------------|
| ["institutional"]          | Solo contexto del Pascual Bravo (ideal)            |
| ["web"]                    | Solo contexto web (sin cobertura institucional)    |
| ["institutional", "web"]   | Contexto combinado                                 |
| ["none"]                   | Sin contexto; Groq uso conocimiento general        |

regenerated: true indica que el filtro anti-cliche detecto muletillas y el
texto fue regenerado automaticamente (maximo 2 intentos).

Errores esperados:

| Escenario               | Code             | HTTP |
|:------------------------|:-----------------|:----:|
| Falta prompt            | MISSING_FIELDS   | 400  |
| profile invalido        | VALIDATION_ERROR | 400  |
| documentType invalido   | VALIDATION_ERROR | 400  |
| Error de Groq           | LLM_ERROR        | 502  |
| Error de Supabase       | DB_ERROR         | 502  |

---

## 5. Casos de prueba negativos

Crea requests adicionales en cada carpeta para validar el manejo de errores.

### Generate > Metodo incorrecto

Cambia el metodo de POST a GET en el request de /generate.
Esperado: 405 METHOD_NOT_ALLOWED con header Allow: POST.

### Generate > documentType invalido

    {
      "prompt": "Escribe algo",
      "profile": "estudiante",
      "documentType": "tarea",
      "userId": "user_123"
    }

Esperado: 400 VALIDATION_ERROR indicando los valores validos.

---

## 6. Importar la coleccion

El repo ya incluye una coleccion lista para importar:

    docs/TOTH_API_v1.postman_collection.json        # coleccion completa
    docs/TOTH_Production.postman_environment.json   # environment de produccion

### Opcion A (recomendada): Importar los archivos incluidos

1. En Postman: Import > Upload Files.
2. Selecciona `docs/TOTH_API_v1.postman_collection.json`
   (y, opcionalmente, `docs/TOTH_Production.postman_environment.json`).
3. La coleccion ya trae `base_url = https://thoth-backend.vercel.app`
   como variable propia, asi que funciona sin configuracion adicional.
   Si importaste el environment, seleccionalo en la esquina superior derecha.
4. Ejecuta los requests en orden: Health > RAG.

Contenido de la coleccion importada:

| Carpeta | Requests |
|:--------|:---------|
| Health  | GET /health |
| RAG     | POST /vector-search, POST /generate (estudiante), POST /generate (docente), POST /generate (documentType invalido) |

Cada request incluye:
- un script de Tests con aserciones basicas (status y `ok`), verifiable con
  el Collection Runner;
- ejemplos de respuesta guardados (casos 200 y errores 400) que reflejan el
  contrato de `develop`; produccion puede seguir mostrando respuestas mock
  hasta el proximo deploy del backend.

### Opcion B: Crear manualmente

Sigue los pasos de la seccion 4 uno por uno en Postman.

### Opcion C: Exportar tu propia coleccion

1. En tu coleccion, haz clic en los tres puntos (...).
2. Selecciona Export > Collection v2.1 > Export.
3. Guarda el archivo dentro de `docs/`.

---

## Resumen de rutas

| #  | Metodo | Ruta                     | Descripcion                          |
|:--:|:------:|:-------------------------|:-------------------------------------|
| 1  | GET    | /api/v1/health           | Health check del sistema             |
| 2  | POST   | /api/v1/vector-search    | Busqueda semantica en RAG            |
| 3  | POST   | /api/v1/generate         | Generacion RAG hibrido + Groq        |

Base URL local:   http://localhost:3000
Prefijo version:  /api/v1/
Content-Type:     application/json en todos los POST
