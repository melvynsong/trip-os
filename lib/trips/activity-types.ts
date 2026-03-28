// Shared type for activity server action results
export type ActivityActionResult =
  | { ok: true; redirect?: string }
  | { ok: false; error: string }
