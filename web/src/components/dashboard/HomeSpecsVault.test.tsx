import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HomeSpecsVault } from "./HomeSpecsVault";
import { supabase } from "@/lib/supabase";

// Mock supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        createSignedUrls: vi.fn(() =>
          Promise.resolve({ data: [], error: null }),
        ),
        upload: vi.fn(() =>
          Promise.resolve({ data: { path: "test.jpg" }, error: null }),
        ),
      })),
    },
  },
}));

describe("HomeSpecsVault", () => {
  const projectId = "p123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state correctly", async () => {
    render(<HomeSpecsVault projectId={projectId} />);

    expect(
      await screen.findByText(/Physical Assets & Specs/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/No specs yet/i)).toBeInTheDocument();
  });

  it("opens add modal when clicking Add New Spec", async () => {
    render(<HomeSpecsVault projectId={projectId} />);

    const addBtn = await screen.findByText(/Add New Spec/i);
    fireEvent.click(addBtn);

    expect(screen.getByText(/Add Home Spec/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e.g. Living Room Accent Wall/i),
    ).toBeInTheDocument();
  });

  it("submits a new spec correctly", async () => {
    const insertMock = vi.fn(() => Promise.resolve({ error: null }));
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: insertMock,
    });

    render(<HomeSpecsVault projectId={projectId} />);

    const addBtn = await screen.findByText(/Add New Spec/i);
    fireEvent.click(addBtn);

    fireEvent.change(
      screen.getByPlaceholderText(/e.g. Living Room Accent Wall/i),
      {
        target: { value: "Test Paint" },
      },
    );
    fireEvent.change(screen.getByPlaceholderText(/e.g. Benjamin Moore/i), {
      target: { value: "BM" },
    });

    const submitBtn = screen.getByText(/Save Spec to Vault/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Paint",
          brand: "BM",
          project_id: projectId,
        }),
      );
    });
  });
});
