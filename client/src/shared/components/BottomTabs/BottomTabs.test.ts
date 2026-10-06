import { expect, test } from "vitest";

import { tabForPath } from "./BottomTabs";

test.each([
  ["/nearby", "nearby"],
  ["/nearby/@30.2,-97.7,14z", "nearby"],
  ["/nearby/stop/1002", "nearby"],
  ["/favorites/@30.2,-97.7,14z", "saved"],
  ["/@30.2,-97.7,14z", "explore"],
  ["/stop/1002", "explore"],
  ["/nearbyish", "explore"],
])("%s → %s", (path, tab) => {
  expect(tabForPath(path)).toBe(tab);
});
