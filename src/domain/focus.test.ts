import { describe, expect, it } from "vitest";
import { addFocusItem, loadFocusItems, removeFocusItem, toggleFocusItem } from "./focus";

describe("focus items", () => {
  it("rejects blank and oversized titles", () => {
    expect(addFocusItem([], "   ", "1", "now")).toEqual([]);
    expect(addFocusItem([], "x".repeat(121), "1", "now")).toEqual([]);
  });

  it("adds, toggles, and removes an item", () => {
    const added = addFocusItem([], "  Write tests  ", "1", "now");
    expect(added[0].title).toBe("Write tests");
    expect(toggleFocusItem(added, "1")[0].done).toBe(true);
    expect(removeFocusItem(added, "1")).toEqual([]);
  });

  it("ignores corrupt stored data", () => {
    expect(loadFocusItems({ getItem: () => "not-json" })).toEqual([]);
    expect(loadFocusItems({ getItem: () => '[{"id":"1"}]' })).toEqual([]);
  });
});
