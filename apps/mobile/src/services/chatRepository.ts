// -----------------------------------------------------------------
// src/services/chatRepository.ts — Conversation persistence facade
// -----------------------------------------------------------------
// Authenticated users: Firestore (users/{uid}/conversations/...).
// Guest demo mode: AsyncStorage (device-local history).
// -----------------------------------------------------------------

import type { AuthSession } from './authClient';
import {
  listConversations,
  listMessages,
  patchConversation,
  saveConversation,
  saveMessage,
} from './firestoreClient';
import {
  getGuestMessages,
  listGuestConversations,
  patchGuestConversation,
  saveGuestConversation,
  saveGuestMessage,
} from './guestChatStore';
import type {
  ChatMessage,
  ConversationPatch,
  ConversationSummary,
} from '../types';

export async function loadConversations(
  session: AuthSession | null,
): Promise<ConversationSummary[]> {
  return session
    ? listConversations(session.uid, session.idToken)
    : listGuestConversations();
}

export async function loadMessages(
  session: AuthSession | null,
  conversationId: string,
): Promise<ChatMessage[]> {
  return session
    ? listMessages(session.uid, session.idToken, conversationId)
    : getGuestMessages(conversationId);
}

export async function createConversation(
  session: AuthSession | null,
  conversation: ConversationSummary,
): Promise<void> {
  if (session) {
    await saveConversation(session.uid, session.idToken, conversation);
    return;
  }
  await saveGuestConversation(conversation);
}

export async function updateConversation(
  session: AuthSession | null,
  conversationId: string,
  patch: ConversationPatch,
): Promise<void> {
  if (session) {
    await patchConversation(session.uid, session.idToken, conversationId, patch);
    return;
  }
  await patchGuestConversation(conversationId, patch);
}

export async function appendMessage(
  session: AuthSession | null,
  conversationId: string,
  message: ChatMessage,
): Promise<void> {
  if (session) {
    await saveMessage(session.uid, session.idToken, conversationId, message);
    return;
  }
  await saveGuestMessage(conversationId, message);
}
