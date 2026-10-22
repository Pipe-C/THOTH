// -----------------------------------------------------------------
// src/services/firestoreClient.ts — Firestore REST client
// -----------------------------------------------------------------
// Collection layout:
//   users/{uid}/conversations/{conversationId}
//     title, preview, documentType, profile, sourcesUsed, createdAt, updatedAt
//   users/{uid}/conversations/{conversationId}/messages/{messageId}
//     sender, content, createdAt, sourcesUsed, antiClicheApplied, documentType
//
// Firestore REST is used so the mobile app does not need a native
// Firebase module. Calls are authenticated with the Firebase ID token.
// -----------------------------------------------------------------

import { FIREBASE_CONFIG } from '../config/firebase';
import type {
  ChatMessage,
  ConversationPatch,
  ConversationSummary,
  DocumentType,
  SourceType,
  UserProfileRole,
} from '../types';

const FIREBASE_API_KEY = FIREBASE_CONFIG.apiKey;
const FIREBASE_PROJECT_ID = FIREBASE_CONFIG.projectId;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES = 200;

// ─── Internal Firestore document helpers ─────────────────────

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  booleanValue?: boolean;
  nullValue?: null;
}

interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
}

interface RunQueryResult {
  document?: FirestoreDocument;
}

function extractString(v?: FirestoreValue): string {
  return v?.stringValue ?? '';
}

function extractNumber(v?: FirestoreValue): number {
  if (v?.integerValue !== undefined) return Number(v.integerValue);
  if (v?.doubleValue !== undefined) return v.doubleValue;
  return 0;
}

function extractBoolean(v?: FirestoreValue): boolean {
  return v?.booleanValue ?? false;
}

function extractStringArray(v?: FirestoreValue): string[] {
  return v?.arrayValue?.values?.map((item) => item.stringValue ?? '') ?? [];
}

function idFromName(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1] ?? '';
}

function toSourceTypes(values: string[]): SourceType[] {
  return values.filter(
    (value): value is SourceType =>
      value === 'institutional' || value === 'web' || value === 'none',
  );
}

function formatTime(createdAt: number): string {
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function docToConversation(doc: FirestoreDocument): ConversationSummary {
  const f = doc.fields;
  const createdAt = extractNumber(f['createdAt']);

  return {
    id: idFromName(doc.name),
    title: extractString(f['title']),
    preview: extractString(f['preview']),
    documentType: extractString(f['documentType']) as DocumentType,
    profile: extractString(f['profile']) as UserProfileRole,
    sourcesUsed: toSourceTypes(extractStringArray(f['sourcesUsed'])),
    createdAt,
    updatedAt: extractNumber(f['updatedAt']) || createdAt,
  };
}

function docToMessage(doc: FirestoreDocument): ChatMessage {
  const f = doc.fields;
  const createdAt = extractNumber(f['createdAt']);
  const documentType = extractString(f['documentType']);

  return {
    id: idFromName(doc.name),
    sender: extractString(f['sender']) === 'user' ? 'user' : 'assistant',
    content: extractString(f['content']),
    createdAt,
    timestamp: formatTime(createdAt),
    sourcesUsed: toSourceTypes(extractStringArray(f['sourcesUsed'])),
    antiClicheApplied: extractBoolean(f['antiClicheApplied']),
    documentType: documentType ? (documentType as DocumentType) : undefined,
  };
}

// ─── Firestore request helpers ───────────────────────────────

function errorMessage(action: string, response: Response, detail: string): string {
  const suffix = detail ? `: ${detail.slice(0, 180)}` : '';
  return `Firestore ${action} failed (${response.status})${suffix}`;
}

async function firestoreQuery(
  parentPath: string,
  collectionId: string,
  orderByField: string,
  direction: 'ASCENDING' | 'DESCENDING',
  limit: number,
  idToken: string,
): Promise<FirestoreDocument[]> {
  const url = `${FIRESTORE_BASE}/${parentPath}:runQuery?key=${FIREBASE_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        orderBy: [{ field: { fieldPath: orderByField }, direction }],
        limit,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(errorMessage('query', response, detail));
  }

  const data = (await response.json()) as RunQueryResult[];
  return data
    .map((entry) => entry.document)
    .filter((doc): doc is FirestoreDocument => doc !== undefined);
}

async function firestorePatch(
  path: string,
  fields: Record<string, FirestoreValue>,
  idToken: string,
): Promise<void> {
  const fieldPaths = Object.keys(fields)
    .map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`)
    .join('&');
  const url = `${FIRESTORE_BASE}/${path}?key=${FIREBASE_API_KEY}&${fieldPaths}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(errorMessage('write', response, detail));
  }
}

function conversationFields(conversation: ConversationSummary): Record<string, FirestoreValue> {
  return {
    title: { stringValue: conversation.title },
    preview: { stringValue: conversation.preview },
    documentType: { stringValue: conversation.documentType },
    profile: { stringValue: conversation.profile },
    sourcesUsed: {
      arrayValue: {
        values: conversation.sourcesUsed.map((source) => ({ stringValue: source })),
      },
    },
    createdAt: { integerValue: String(conversation.createdAt) },
    updatedAt: { integerValue: String(conversation.updatedAt) },
  };
}

function messageFields(message: ChatMessage): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {
    sender: { stringValue: message.sender },
    content: { stringValue: message.content },
    createdAt: { integerValue: String(message.createdAt) },
    sourcesUsed: {
      arrayValue: {
        values: (message.sourcesUsed ?? []).map((source) => ({ stringValue: source })),
      },
    },
    antiClicheApplied: { booleanValue: message.antiClicheApplied ?? false },
  };

  if (message.documentType) {
    fields.documentType = { stringValue: message.documentType };
  }

  return fields;
}

function conversationPath(uid: string, conversationId: string): string {
  return `users/${encodeURIComponent(uid)}/conversations/${encodeURIComponent(conversationId)}`;
}

// ─── Public API ───────────────────────────────────────────────

/** Lists the user's conversations, most recently updated first. */
export async function listConversations(
  uid: string,
  idToken: string,
): Promise<ConversationSummary[]> {
  const docs = await firestoreQuery(
    `users/${encodeURIComponent(uid)}`,
    'conversations',
    'updatedAt',
    'DESCENDING',
    MAX_CONVERSATIONS,
    idToken,
  );
  return docs.map(docToConversation);
}

/** Loads a conversation's messages in chronological order. */
export async function listMessages(
  uid: string,
  idToken: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  const docs = await firestoreQuery(
    conversationPath(uid, conversationId),
    'messages',
    'createdAt',
    'ASCENDING',
    MAX_MESSAGES,
    idToken,
  );
  return docs.map(docToMessage);
}

/** Creates or replaces a conversation summary document. */
export async function saveConversation(
  uid: string,
  idToken: string,
  conversation: ConversationSummary,
): Promise<void> {
  await firestorePatch(
    conversationPath(uid, conversation.id),
    conversationFields(conversation),
    idToken,
  );
}

/** Updates only the mutable conversation fields. */
export async function patchConversation(
  uid: string,
  idToken: string,
  conversationId: string,
  patch: ConversationPatch,
): Promise<void> {
  const fields: Record<string, FirestoreValue> = {};

  if (patch.title !== undefined) fields.title = { stringValue: patch.title };
  if (patch.preview !== undefined) fields.preview = { stringValue: patch.preview };
  if (patch.documentType !== undefined) {
    fields.documentType = { stringValue: patch.documentType };
  }
  if (patch.sourcesUsed !== undefined) {
    fields.sourcesUsed = {
      arrayValue: {
        values: patch.sourcesUsed.map((source) => ({ stringValue: source })),
      },
    };
  }
  if (patch.updatedAt !== undefined) {
    fields.updatedAt = { integerValue: String(patch.updatedAt) };
  }

  if (Object.keys(fields).length === 0) return;

  await firestorePatch(
    conversationPath(uid, conversationId),
    fields,
    idToken,
  );
}

/** Creates or replaces a message document. */
export async function saveMessage(
  uid: string,
  idToken: string,
  conversationId: string,
  message: ChatMessage,
): Promise<void> {
  await firestorePatch(
    `${conversationPath(uid, conversationId)}/messages/${encodeURIComponent(message.id)}`,
    messageFields(message),
    idToken,
  );
}
