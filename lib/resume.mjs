import { readFileSync } from "node:fs";

import schema from "@jsonresume/schema/schema.json" with { type: "json" };
import { Ajv } from "ajv";
import addFormats from "ajv-formats";

const ajv = addFormats.default(new Ajv({ allErrors: true, strict: false }));

const validate = ajv.compile(schema);

export function assertJsonResume(label, data) {
  if (validate(data)) {
    return;
  }

  const errors = validate.errors.map((e) => `  ${e.instancePath || "/"} ${e.message}`).join("\n");
  throw new Error(`${label} is not a valid JSON Resume:\n${errors}`);
}

/**
 * JSON Resume allows "YYYY", "YYYY-MM", or "YYYY-MM-DD"; the templates handle
 * "YYYY-MM" and, for things like awards, "YYYY".
 */
export function assertMonthDates(label, value, path = "") {
  // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Validated JSON still contains primitive leaves that recursive date traversal must skip.
  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const at = `${path}/${key}`;

    if (
      /^(date|releaseDate|startDate|endDate)$/.test(key) &&
      !/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(child)
    ) {
      throw new Error(`${label} ${at} must be "YYYY-MM" or "YYYY", got ${JSON.stringify(child)}`);
    }

    assertMonthDates(label, child, at);
  }
}

export function loadResume(path) {
  const resume = JSON.parse(readFileSync(path, "utf8"));
  assertJsonResume(path, resume);
  assertMonthDates(path, resume);

  return resume;
}
