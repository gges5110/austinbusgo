import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

// vitest-axe ships matcher implementations but only jest-flavored type
// augmentation; wire its matchers into Vitest's Assertion interface here.
declare module "vitest" {
  /* eslint-disable @typescript-eslint/no-empty-object-type */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}
