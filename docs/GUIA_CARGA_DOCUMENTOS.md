# Guía de carga del fondo documental institucional

Cómo alimentar el RAG institucional de TOTH con documentos reales
(pénsum, reglamentos, syllabus, guías, acuerdos, resoluciones...).

> **Resumen en una línea:** coloca los archivos en `apps/backend/documents/`
> y ejecuta `npm run ingest`. El script extrae el texto, lo fragmenta, genera
> los embeddings con la Edge Function `embed` y los inserta en Supabase.

---

## 1. Arquitectura del pipeline

```
documento (PDF/DOCX/MD/TXT)
        │
        ▼
[1. Extracción de texto]   unpdf (PDF) · mammoth (DOCX) · fs (MD/TXT)
        │
        ▼
[2. Fragmentación]         chunks de ~1000 caracteres con solape de 150
        │
        ▼
[3. Embedding]             Edge Function `embed` (gte-small, 384 dims)
        │
        ▼
[4. Inserción]             tabla public.document_chunks (Supabase pgvector)
        │  metadata: { source, document_type, chunk_index, total_chunks, file, created_at }
        ▼
[5. Recuperación]          RPC match_document_chunks (índice HNSW) →
                           /api/v1/vector-search y /api/v1/generate
```

Todo esto vive en `apps/backend/scripts/ingest.mjs`.

---

## 2. Requisitos previos

Antes de la primera carga, asegúrate de tener:

1. **Migraciones aplicadas** en el SQL Editor de Supabase, en este orden:
   - `supabase/migrations/0001_init_vector_store.sql` (extensión `vector`, tabla
     `document_chunks`, RPC `match_document_chunks`).
   - `supabase/migrations/0002_fix_vector_index.sql` (índice **HNSW** en lugar de
     `ivfflat`, para recuperación fiable).
2. **Edge Function `embed` desplegada**:
   ```bash
   supabase functions deploy embed --project-ref <TU_PROJECT_REF>
   ```
3. **`.env` en `apps/backend`** con:
   ```env
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<secret_key>
   ```

Puedes comprobar que todo responde ejecutando una búsqueda de prueba contra
`POST /api/v1/vector-search`.

---

## 3. Dónde colocar los documentos

Coloca los archivos en:

```
apps/backend/documents/
```

- **Formatos soportados:** `.pdf`, `.docx`, `.md`, `.txt`.
- Se recorren **recursivamente**: puedes organizarlos en subcarpetas:
  ```
  documents/
  ├── pensum/
  │   └── ingenieria-software-2026.pdf
  ├── reglamentos/
  │   └── reglamento-estudiantil.docx
  └── syllabus/
      └── syllabus-poo.md
  ```
- Los archivos **no se suben al repositorio** (ver `documents/.gitignore`):
  son documentos institucionales, no código.

> **Texto extraíble:** el pipeline funciona con PDFs/DOCX que contengan texto.
> Un PDF **escaneado** (imagen) no produce texto y debe pasar primero por OCR.

---

## 4. Ejecutar la carga

Siempre desde `apps/backend`:

```powershell
# Procesa toda la carpeta ./documents
npm run ingest

# Otra carpeta
npm run ingest -- ./ruta/a/mis-documentos

# Vaciar document_chunks por completo antes de cargar
npm run ingest -- --reset

# Forzar un tipo documental para todos los archivos
npm run ingest -- --type=reglamento
```

Ejemplo de salida:

```
[ingest] 2 documento(s) encontrados en .../documents

[ingest] → pensum/ingenieria-software-2026.pdf  (tipo: pensum, 34 chunks)
    34/34 chunks insertados
[ingest] → syllabus/syllabus-poo.md  (tipo: syllabus, 3 chunks)
    3/3 chunks insertados

[ingest] ─── Resumen ───
  Documentos procesados: 2/2
  Fragmentos insertados: 37
```

### Re-ingesta idempotente

Antes de insertar, el script **borra los fragmentos previos de la misma
`source`**. Es decir, puedes editar un documento y volver a ejecutar
`npm run ingest`: no genera duplicados, reemplaza la versión anterior de ese
documento.

---

## 5. Metadatos y tipo documental

Cada fragmento se guarda con estos metadatos (`metadata` jsonb):

| Campo | Descripción |
| :--- | :--- |
| `source` | Nombre del archivo sin extensión. Es la clave de idempotencia. |
| `document_type` | Tipo inferido del nombre (o forzado con `--type=`). |
| `chunk_index` | Posición del fragmento dentro del documento (desde 0). |
| `total_chunks` | Número total de fragmentos del documento. |
| `file` | Ruta relativa del archivo dentro de `documents/`. |
| `created_at` | Marca de tiempo de la carga. |

`document_type` se **infiere del nombre del archivo**:

| Palabra en el nombre | `document_type` |
| :--- | :--- |
| `pensum` | `pensum` |
| `microcurriculo` | `microcurriculo` |
| `syllabus` | `syllabus` |
| `reglamento` | `reglamento` |
| `acuerdo` | `acuerdo` |
| `resolucion` | `resolucion` |
| `guia` | `guia` |
| *(ninguna)* | `documento` |

Por eso conviene **nombrar los archivos de forma descriptiva** (p. ej.
`reglamento-estudiantil-2026.pdf`, no `scan01.pdf`). Si lo prefieres, usa
`--type=` para forzarlo.

---

## 6. Ajustar la fragmentación (opcional)

Los parámetros viven al inicio de `scripts/ingest.mjs`:

| Constante | Valor por defecto | Efecto |
| :--- | :--- | :--- |
| `MAX_CHARS` | `1000` | Tamaño máximo de cada fragmento. |
| `OVERLAP_CHARS` | `150` | Solape entre fragmentos contiguos (evita cortar ideas). |
| `CONCURRENCY` | `5` | Embeddings/inserciones en paralelo. |

El corte respeta el final de oración cuando es posible, para no partir ideas a
la mitad.

---

## 7. Verificar la carga

**Conteo en el SQL Editor de Supabase:**

```sql
select count(*) from public.document_chunks;
```

**Búsqueda semántica en vivo:**

```bash
curl -X POST https://thoth-backend.vercel.app/api/v1/vector-search \
  -H "Content-Type: application/json" \
  -d '{"query":"asistencia mínima a clases","topK":3}'
```

**Generación con contexto institucional:** `POST /api/v1/generate` debe
responder con `sources_used: ["institutional"]` para consultas cubiertas por el
fondo documental.

---

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
| :--- | :--- | :--- |
| `Formato no soportado` | Extensión fuera de la lista | Usa `.pdf`, `.docx`, `.md` o `.txt`. |
| `embedding vacío` / error al invocar `embed` | Edge Function no desplegada o `SUPABASE_SERVICE_ROLE_KEY` incorrecta | `supabase functions deploy embed`; revisa el `.env`. |
| `dimensión N ≠ 384` | El modelo de embeddings no es `gte-small` | Debe coincidir con `vector(384)` de la migración 0001. |
| Un documento no aporta texto | PDF escaneado (imagen) | Pásalo por OCR antes de ingerirlo. |
| Consultas relevantes devuelven 0 resultados | Índice vectorial deficiente | Asegura que la migración **0002 (HNSW)** está aplicada. |
| Similitudes correctas pero bajo el umbral | Umbral de similitud alto | Ajusta `SIMILARITY_THRESHOLD` (por defecto `0.75`) en el entorno. |

---

## 9. Notas de diseño

- **Consistencia del modelo:** el embedding de la consulta (en tiempo de
  búsqueda) y el de los documentos (en la carga) los genera la **misma** Edge
  Function `embed`, garantizando que las distancias coseno son comparables.
- **Prioridad institucional:** este fondo se consulta siempre primero; la
  búsqueda web (Tavily) solo complementa vacíos o temas que requieren vigencia.
- **Escala:** con pocos cientos de fragmentos la carga es rápida; para lotes
  grandes, sube `CONCURRENCY` con cuidado (límites de la Edge Function).
