import { assertEquals, assertThrows } from "std/assert";
import {
  assertGeminiCircuitClosed,
  GeminiCircuitOpenError,
  isGeminiServerError,
  recordGeminiFailure,
  recordGeminiSuccess,
  resetGeminiCircuitForTests,
} from "./gemini-circuit-breaker.ts";

Deno.test("gemini circuit breaker trips after consecutive 5xx", () => {
  resetGeminiCircuitForTests();
  Deno.env.set("GEMINI_CIRCUIT_FAILURE_THRESHOLD", "3");
  Deno.env.set("GEMINI_CIRCUIT_OPEN_MS", "60000");

  recordGeminiFailure(503);
  recordGeminiFailure(502);
  recordGeminiFailure(500);
  assertThrows(() => assertGeminiCircuitClosed(), GeminiCircuitOpenError);

  resetGeminiCircuitForTests();
});

Deno.test("gemini circuit breaker ignores non-5xx failures", () => {
  resetGeminiCircuitForTests();
  recordGeminiFailure(429);
  recordGeminiFailure(400);
  assertGeminiCircuitClosed();
  recordGeminiSuccess();
  resetGeminiCircuitForTests();
});

Deno.test("isGeminiServerError", () => {
  assertEquals(isGeminiServerError(500), true);
  assertEquals(isGeminiServerError(404), false);
});
