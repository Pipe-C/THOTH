// -----------------------------------------------------------------
// src/services/nativeBridge.ts — Kotlin Android Native Bridge Interface
// -----------------------------------------------------------------
// Typed facade for communicating with native Kotlin modules:
// - PdfExporterModule: physical generation and export to PDF / Word
// - RoomDatabaseModule: offline local SQLite cache with Room
// -----------------------------------------------------------------

import { NativeModules, Platform } from 'react-native';

const { PdfExporterModule, RoomDatabaseModule } = NativeModules;

export interface ExportDocumentOptions {
  title: string;
  content: string;
}

export interface PublishedDocument {
  fileName: string;
  filePath: string;
  uri: string;
  mimeType: string;
  /** true cuando el archivo quedó visible en Descargas/TOTH. */
  published: boolean;
  /** Ruta legible para mostrar al usuario. */
  location: string;
}

export const PDF_MIME_TYPE = 'application/pdf';
export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface LocalRoomDocument {
  id?: string;
  title: string;
  content: string;
  documentType?: string;
  profile?: string;
  createdAt?: number;
}

/**
 * Exports academic deliverable to physical PDF using native PdfDocument engine.
 * Falls back gracefully when running outside native Android environment.
 */
export async function exportDocumentToPdf(
  options: ExportDocumentOptions,
): Promise<string> {
  if (Platform.OS === 'android' && PdfExporterModule?.exportToPdf) {
    return PdfExporterModule.exportToPdf(options);
  }

  // Graceful fallback for non-native / test environments
  const safeTitle = (options.title || 'Documento_TOTH').replace(/\s+/g, '_');
  const mockPath = `/data/user/0/com.toth.app/cache/${safeTitle}_${Date.now()}.pdf`;
  return mockPath;
}

/**
 * Exports academic deliverable to Word (.docx) via native bridge.
 */
export async function exportDocumentToWord(
  options: ExportDocumentOptions,
): Promise<string> {
  if (Platform.OS === 'android' && PdfExporterModule?.exportToWord) {
    return PdfExporterModule.exportToWord(options);
  }

  const safeTitle = (options.title || 'Documento_TOTH').replace(/\s+/g, '_');
  const mockPath = `/data/user/0/com.toth.app/cache/${safeTitle}_${Date.now()}.docx`;
  return mockPath;
}

/**
 * Copies the exported file to the public Downloads/TOTH folder and returns a
 * shareable content:// URI. On Android versions without MediaStore.Downloads
 * it returns a FileProvider URI for the app-private file.
 */
export async function publishExportedDocument(
  filePath: string,
  mimeType: string,
): Promise<PublishedDocument> {
  if (Platform.OS === 'android' && PdfExporterModule?.publishToDownloads) {
    return PdfExporterModule.publishToDownloads(filePath, mimeType);
  }

  return {
    fileName: filePath.split(/[\\/]/).pop() ?? 'Documento_TOTH',
    filePath,
    uri: filePath,
    mimeType,
    published: false,
    location: filePath,
  };
}

/** Opens the Android sharesheet for an exported document. */
export async function shareExportedDocument(
  uri: string,
  mimeType: string,
): Promise<void> {
  if (Platform.OS === 'android' && PdfExporterModule?.shareFile) {
    await PdfExporterModule.shareFile(uri, mimeType);
  }
}

/**
 * Persists a generated document in local Room DB via Kotlin bridge.
 */
export async function saveLocalRoomDocument(
  doc: LocalRoomDocument,
): Promise<string> {
  if (Platform.OS === 'android' && RoomDatabaseModule?.saveDocument) {
    return RoomDatabaseModule.saveDocument(doc);
  }
  return doc.id || String(Date.now());
}

/**
 * Retrieves local Room cache history via Kotlin bridge.
 */
export async function getLocalRoomHistory(
  limit = 20,
): Promise<LocalRoomDocument[]> {
  if (Platform.OS === 'android' && RoomDatabaseModule?.getHistory) {
    return RoomDatabaseModule.getHistory(limit);
  }
  return [];
}
