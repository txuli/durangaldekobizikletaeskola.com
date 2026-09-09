// A single path segment used to build an upstream gallery URL: letters, digits,
// spaces, dots, underscores and hyphens - crucially no "/" and no "..".
const SAFE_SEGMENT = /^[\w .-]+$/;

export function isSafePathSegment(value: unknown): value is string {
    return typeof value === "string" && value.length > 0 && value !== ".." && SAFE_SEGMENT.test(value);
}
