/** Parses "field:asc" | "field:desc" into a Mongoose sort object. Defaults to newest first. */
export function parseSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "asc"] = sort.split(":");
  if (!field) return { createdAt: -1 };
  return { [field]: direction === "desc" ? -1 : 1 };
}

/** Escapes regex metacharacters so user input matches only as literal text. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive $or/$regex search clause across the given fields.
 * `search` is caller-supplied (e.g. a query param) — always escaped before
 * being compiled into a RegExp, both to stop regex-metacharacter injection
 * (a raw `.`/`|`/`^` matching more than the literal text typed) and to avoid
 * a ReDoS from a pathological pattern like `(a+)+$`.
 */
export function buildSearchClause(
  search?: string,
  searchFields?: string[]
): Record<string, unknown> {
  if (!search || !searchFields || searchFields.length === 0) return {};
  const regex = new RegExp(escapeRegExp(search.trim()), "i");
  return { $or: searchFields.map((field) => ({ [field]: regex })) };
}
