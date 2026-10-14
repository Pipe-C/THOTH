# Fondo documental institucional

Coloca aquí los documentos fuente que alimentan el RAG institucional de TOTH
(pénsum, reglamentos, syllabus, guías, acuerdos, resoluciones...).

## Formatos soportados

- `.pdf`
- `.docx`
- `.md`
- `.txt`

Se procesan **recursivamente** (puedes organizarlos en subcarpetas, p. ej.
`documents/pensum/`, `documents/reglamentos/`).

## Cómo cargarlos

Desde `apps/backend`:

```powershell
npm run ingest            # procesa toda la carpeta ./documents
npm run ingest -- --reset # vacía document_chunks y recarga todo
```

Ver `docs/GUIA_CARGA_DOCUMENTOS.md` para el detalle.

> **Nota:** los archivos que pongas aquí **no se suben al repositorio**
> (ver `.gitignore`). Son documentos institucionales, no código.
