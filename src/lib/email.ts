import { supabase } from "./supabase";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
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
