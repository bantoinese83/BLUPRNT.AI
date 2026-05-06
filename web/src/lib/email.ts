import { invokeFunction } from "./supabase";
import { EDGE_FUNCTIONS } from "@shared/lib/backend-routing.js";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await invokeFunction(EDGE_FUNCTIONS.SEND_EMAIL, {
      body: { to, subject, html },
    });

    if (error) {
      console.error("Failed to invoke send-email function:", error);
      throw error;
    }

    return { data, error: null };
  } catch (err) {
    console.error("Error sending email via Supabase Edge Function:", err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
