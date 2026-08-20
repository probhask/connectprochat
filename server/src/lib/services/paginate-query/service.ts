import { Document, FilterQuery } from "mongoose";

import * as factory from "../factory/service";
import { AnyModel, QueryOptions } from "../factory/types";
import { buildSearchClause, parseSort } from "./helpers";
import { PaginateQueryOptions, PaginationResult } from "./types";

/**
 * Fully-typed Mongoose port of GG_BE's APIFeatures/paginateQuery — used by
 * every list endpoint instead of each controller hand-rolling skip/limit/sort.
 * `<T extends Document>` is inferred from the passed `Model<T>`, same as the
 * rest of the factory service.
 */
export async function paginateQuery<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  options: PaginateQueryOptions = {},
  queryOptions: Omit<QueryOptions, "sort" | "limit" | "skip" | "session"> = {},
  session?: QueryOptions["session"]
): Promise<PaginationResult<T>> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;
  const sort = parseSort(options.sort);
  const searchClause = buildSearchClause(options.search, options.searchFields);

  const finalWhere = { ...where, ...searchClause } as FilterQuery<T>;

  const [{ data }, total] = await Promise.all([
    factory.findMany(model, finalWhere, { ...queryOptions, sort, limit, skip, session }),
    factory.count(model, finalWhere, session),
  ]);

  return {
    results: data,
    pagination: { limit, page, total, totalPages: Math.ceil(total / limit) },
  };
}
