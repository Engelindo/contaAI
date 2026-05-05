import { env } from "../config/env.js";

type SendWhatsAppTextInput = {
  to: string;
  body: string;
};

type SendWhatsAppTextResult = {
  messageId?: string;
};

export const sendWhatsAppText = async ({
  to,
  body,
}: SendWhatsAppTextInput): Promise<SendWhatsAppTextResult> => {
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to send WhatsApp message (${response.status} ${response.statusText}): ${errorBody}`,
    );
  }

  const responseJson = (await response.json()) as {
    messages?: Array<{ id?: string }>;
  };
  const messageId = responseJson.messages?.[0]?.id;
  return messageId ? { messageId } : {};
};
