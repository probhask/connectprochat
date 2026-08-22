/** Parses "field:asc" | "field:desc" into a Mongoose sort object. Defaults to newest first. */
export function parseSort(sort?: string): Record<string, 1 | -1> {
  if (!sort) return { createdAt: -1 };
  const [field, direction = "asc"] = sort.split(":");
  if (!field) return { createdAt: -1 };
  return { [field]: direction === "desc" ? -1 : 1 };
}

/** Builds a case-insensitive $or/$regex search clause across the given fields. */
export function buildSearchClause(
  search?: string,
  searchFields?: string[]
): Record<string, unknown> {
  if (!search || !searchFields || searchFields.length === 0) return {};
  const regex = new RegExp(search.trim(), "i");
  return { $or: searchFields.map((field) => ({ [field]: regex })) };
}
