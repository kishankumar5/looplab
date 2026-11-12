import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VisibilityToggle } from "./VisibilityToggle";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const respond = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

/** The toggle as a page uses it: the page holds the visibility and passes it back in. */
function renderToggle(initiallyPublic: boolean) {
  const changes: boolean[] = [];
  function Page() {
    const [isPublic, setIsPublic] = useState(initiallyPublic);
    const onChange = (next: boolean) => {
      changes.push(next);
      setIsPublic(next);
    };
    return <VisibilityToggle beatId="b1" isPublic={isPublic} onChange={onChange} />;
  }
  render(<Page />);
  return { changes };
}

const patchBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("VisibilityToggle", () => {
  it("shows a private beat as Private, with a Make public button", () => {
    renderToggle(false);
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make public" })).toBeEnabled();
  });

  it("makes the beat public through the API, then shows Public", async () => {
    fetchMock.mockReturnValue(respond({ beat: { id: "b1", isPublic: true } }));
    const { changes } = renderToggle(false);

    await userEvent.click(screen.getByRole("button", { name: "Make public" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/beats/b1", expect.objectContaining({ method: "PATCH" }));
    expect(patchBody()).toEqual({ isPublic: true });
    expect(await screen.findByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make private" })).toBeEnabled();
    expect(changes).toEqual([true]);
  });

  it("makes a public beat private again", async () => {
    fetchMock.mockReturnValue(respond({ beat: { id: "b1", isPublic: false } }));
    renderToggle(true);
    expect(screen.getByText("Public")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Make private" }));

    expect(patchBody()).toEqual({ isPublic: false });
    expect(await screen.findByText("Private")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make public" })).toBeInTheDocument();
  });

  it("can't be pressed again while the change is saving", async () => {
    let finish: (res: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)));
    renderToggle(false);

    await userEvent.click(screen.getByRole("button", { name: "Make public" }));
    expect(screen.getByRole("button", { name: "Make public" })).toBeDisabled();
    expect(screen.getByText("Private")).toBeInTheDocument();

    finish(new Response(JSON.stringify({ beat: { id: "b1", isPublic: true } })));
    expect(await screen.findByRole("button", { name: "Make private" })).toBeEnabled();
  });

  it("keeps the current visibility and shows the error when saving fails", async () => {
    fetchMock.mockReturnValue(respond({ error: { code: "NOT_FOUND", message: "Beat not found" } }, 404));
    const { changes } = renderToggle(false);

    await userEvent.click(screen.getByRole("button", { name: "Make public" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Beat not found");
    expect(screen.getByText("Private")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Make public" })).toBeEnabled());
    expect(changes).toEqual([]);
  });
});
