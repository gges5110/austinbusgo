// react-testing-library renders your components to document.body,
// this adds jest-dom's custom assertions
import "@testing-library/jest-dom/extend-expect";
import matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { expect, afterEach } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// extends Vitest's expect method with axe accessibility matchers
expect.extend(axeMatchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
