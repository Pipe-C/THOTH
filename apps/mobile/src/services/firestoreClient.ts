// -----------------------------------------------------------------
// src/services/firestoreClient.ts — Firestore REST client
// -----------------------------------------------------------------
// Uses Firestore REST API so no native module is required in Phase 4.
// When @react-native-firebase/firestore is added, replace the fetch
// calls with the SDK equivalents.
//
// Collection layout expected in Firestore:
//   users/{uid}/documents/{docId}  →  DocumentHistoryItem fields
// -----------------------------------------------------------------

import type { DocumentHistoryItem, DocumentType, UserProfileRole, SourceType } from '../types';

// ─── Constants ────────────────────────────────────────────────

const FIREBASE_API_KEY = 'REPLACE_WITH_FIREBASE_WEB_API_KEY';
const FIREBASE_PROJECT_ID = 'REPLACE_WITH_FIREBASE_PROJECT_ID';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ─── Internal Firestore document helpers ─────────────────────

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  booleanValue?: boolean;
  nullValue?: null;
}

interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

function extractString(v?: FirestoreValue): string {
  return v?.stringValue ?? '';
}

function extractInteger(v?: FirestoreValue): number {
  return Number(v?.integerValue ?? 0);
}

function extractStringArray(v?: FirestoreValue): string[] {
  return (
    v?.arrayValue?.values?.map((item) => item.stringValue ?? '') ?? []
  );
}

function docToHistoryItem(doc: FirestoreDocument): DocumentHistoryItem {
  const f = doc.fields;
  const nameParts = doc.name.split('/');
  const id = nameParts[nameParts.length - 1] ?? 'unknown';

  return {
    id,
    title: extractString(f['title']),
    preview: extractString(f['preview']),
    documentType: extractString(f['documentType']) as DocumentType,
    profile: extractString(f['profile']) as UserProfileRole,
    sourcesUsed: extractStringArray(f['sourcesUsed']) as SourceType[],
    createdAt: extractInteger(f['createdAt']),
  };
}

// ─── Firestore request helper ─────────────────────────────────

async function firestoreGet<T>(
  path: string,
  idToken: string,
): Promise<T> {
  const url = `${FIRESTORE_BASE}/${path}?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Firestore error ${response.status}`);
  }

  return (await response.json()) as T;
}

async function firestorePost<T>(
  path: string,
  body: Record<string, unknown>,
  idToken: string,
): Promise<T> {
  const url = `${FIRESTORE_BASE}/${path}?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Firestore error ${response.status}`);
  }

  return (await response.json()) as T;
}

// ─── Public API ───────────────────────────────────────────────

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

/**
 * Fetches the document history for a given user from Firestore.
 * Returns an empty array if the user has no documents yet.
 */
export async function getUserDocuments(
  uid: string,
  idToken: string,
): Promise<DocumentHistoryItem[]> {
  try {
    const data = await firestoreGet<FirestoreListResponse>(
      `users/${uid}/documents`,
      idToken,
    );
    return (data.documents ?? []).map(docToHistoryItem);
  } catch {
    // Graceful degradation: return empty list on any Firestore error.
    return [];
  }
}

/**
 * Saves a newly generated document to the user Firestore sub-collection.
 * Called after ChatScreen receives a successful generate() response.
 */
export async function saveUserDocument(
  uid: string,
  idToken: string,
  item: Omit<DocumentHistoryItem, 'id'>,
): Promise<string | null> {
  try {
    const doc = await firestorePost<FirestoreDocument>(
      `users/${uid}/documents`,
      {
        fields: {
          title: { stringValue: item.title },
          preview: { stringValue: item.preview },
          documentType: { stringValue: item.documentType },
          profile: { stringValue: item.profile },
          sourcesUsed: {
            arrayValue: {
              values: item.sourcesUsed.map((s) => ({ stringValue: s })),
            },
          },
          createdAt: { integerValue: String(item.createdAt) },
        },
      },
      idToken,
    );
    const nameParts = doc.name.split('/');
    return nameParts[nameParts.length - 1] ?? null;
  } catch {
    return null;
  }
}
