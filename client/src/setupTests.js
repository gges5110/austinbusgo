// react-testing-library renders your components to document.body,
// this adds jest-dom's custom assertions (and their Vitest types)
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { expect, afterEach } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

// extends Vitest's expect method with axe accessibility matchers
expect.extend(axeMatchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
