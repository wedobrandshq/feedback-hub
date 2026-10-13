import { expect, it } from "vitest";
import { HOME_LIST_STEP, homeListWindow } from "@/domain/admin";

it("shows five home rows and reveals the next five", () => {
  expect(HOME_LIST_STEP).toBe(5);
  expect(homeListWindow(12, 5)).toEqual({ visible: 5, hidden: 7, more: 5, canCollapse: false });
  expect(homeListWindow(12, 10)).toEqual({ visible: 10, hidden: 2, more: 2, canCollapse: true });
  expect(homeListWindow(12, 15)).toEqual({ visible: 12, hidden: 0, more: 0, canCollapse: true });
  expect(homeListWindow(4, 5)).toEqual({ visible: 4, hidden: 0, more: 0, canCollapse: false });
});
