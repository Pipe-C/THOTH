// -----------------------------------------------------------------
// src/services/guestChatStore.ts — Local history for the demo mode
// -----------------------------------------------------------------
// The "Omitir inicio de sesión" path has no Firebase identity, so its
// conversations cannot be written to Firestore. They are persisted in
// AsyncStorage instead, keeping the demo functional without mixing
// guest data into an authenticated user's history.
// -----------------------------------------------------------------

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  ChatMessage,
  ConversationPatch,
  ConversationSummary,
} from '../types';

const STORAGE_KEY = '@toth/guest/conversations/v1';
const MAX_CONVERSATIONS = 50;

interface GuestConversation extends ConversationSummary {
  messages: ChatMessage[];
}

let writeQueue: Promise<void> = Promise.resolve();

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

async function readAll(): Promise<GuestConversation[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as GuestConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(conversations: GuestConversation[]): Promise<void> {
  const trimmed = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function listGuestConversations(): Promise<ConversationSummary[]> {
  const conversations = await readAll();
  return conversations
    .map(({ messages: _messages, ...summary }) => summary)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getGuestMessages(conversationId: string): Promise<ChatMessage[]> {
  const conversations = await readAll();
  const conversation = conversations.find((item) => item.id === conversationId);
  return conversation
    ? [...conversation.messages].sort((a, b) => a.createdAt - b.createdAt)
    : [];
}

export async function saveGuestConversation(
  conversation: ConversationSummary,
): Promise<void> {
  await serializeWrite(async () => {
    const conversations = await readAll();
    const index = conversations.findIndex((item) => item.id === conversation.id);

    if (index >= 0) {
      conversations[index] = { ...conversations[index], ...conversation };
    } else {
      conversations.push({ ...conversation, messages: [] });
    }

    await writeAll(conversations);
  });
}

export async function patchGuestConversation(
  conversationId: string,
  patch: ConversationPatch,
): Promise<void> {
  await serializeWrite(async () => {
    const conversations = await readAll();
    const index = conversations.findIndex((item) => item.id === conversationId);
    if (index < 0) return;

    conversations[index] = { ...conversations[index], ...patch };
    await writeAll(conversations);
  });
}

export async function saveGuestMessage(
  conversationId: string,
  message: ChatMessage,
): Promise<void> {
  await serializeWrite(async () => {
    const conversations = await readAll();
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation) return;

    const existing = conversation.messages.findIndex((item) => item.id === message.id);
    if (existing >= 0) {
      conversation.messages[existing] = message;
    } else {
      conversation.messages.push(message);
    }

    conversation.messages.sort((a, b) => a.createdAt - b.createdAt);
    await writeAll(conversations);
  });
}
