import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "./email";
import { supabase } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email successfully", async () => {
    const mockData = { message: "Email sent" };
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: mockData,
      error: null,
    });

    const params = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test content</p>",
    };

    const result = await sendEmail(params);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("send-email", {
      body: params,
    });
    expect(result).toEqual({ data: mockData, error: null });
  });

  it("handles Supabase invoke error", async () => {
    const mockError = new Error("Failed to send");
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: mockError,
    });

    const params = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test content</p>",
    };

    const result = await sendEmail(params);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("send-email", {
      body: params,
    });
    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });

  it("handles general catch block error (Error object)", async () => {
    const mockError = new Error("Network Error");
    (supabase.functions.invoke as any).mockRejectedValueOnce(mockError);

    const params = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test content</p>",
    };

    const result = await sendEmail(params);

    expect(result.data).toBeNull();
    expect(result.error).toBe(mockError);
  });

  it("handles general catch block error (non-Error object)", async () => {
    const mockErrorString = "Something went wrong";
    (supabase.functions.invoke as any).mockRejectedValueOnce(mockErrorString);

    const params = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test content</p>",
    };

    const result = await sendEmail(params);

    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe(mockErrorString);
  });

  it("verifies parameters passed to supabase.functions.invoke", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    const params = {
      to: ["test1@example.com", "test2@example.com"],
      subject: "Multiple Recipients",
      html: "<h1>Hello</h1>",
    };

    await sendEmail(params);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("send-email", {
      body: {
        to: ["test1@example.com", "test2@example.com"],
        subject: "Multiple Recipients",
        html: "<h1>Hello</h1>",
      },
    });
  });
});
