import { sendMessage, startDirectConversation } from "../api/chat";

// Mesajı seçilmiş hədəflərə göndərir. target: { conversation } (mövcud söhbət)
// və ya { user } (hələ söhbət yoxdur). Hər hədəf üçün { ok } qaytarır.
export async function forwardText(text, targets) {
  const results = [];

  for (const target of targets) {
    try {
      let conversation = target.conversation;
      if (!conversation) {
        ({ data: conversation } = await startDirectConversation(target.user.id));
      }
      await sendMessage(conversation.id, text);
      results.push({ ok: true });
    } catch {
      results.push({ ok: false });
    }
  }
  return results;
}
