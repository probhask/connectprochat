export interface PaginationResult<T> {
  results: T[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginateQueryOptions {
  page?: number;
  limit?: number;
  /** "field:asc" | "field:desc" */
  sort?: string;
  search?: string;
  searchFields?: string[];
}
