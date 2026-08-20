import { ClientSession, Document, Model, PopulateOptions } from "mongoose";

/**
 * A Mongoose `Model<T>` with its extra generic slots (query helpers, virtuals,
 * hydrated-doc overrides) widened so a *generic* wrapper function can accept
 * any concrete model (`Model<IUser>`, `Model<IMessage>`, ...) — a bare
 * `Model<T>` parameter can't unify with those slots. This is the one
 * intentional, documented `any` usage in the factory layer; every caller
 * uses this alias instead of writing the widened signature (and the `any`)
 * out at every call site.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModel<T extends Document> = Model<T, any, any, any, any>;

export interface QueryOptions {
  session?: ClientSession;
  populate?: PopulateOptions | (PopulateOptions | string)[];
  select?: string;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  /** updateOne only: insert a new document if no match is found (atomic create-or-update). */
  upsert?: boolean;
}

export interface FindManyResult<T> {
  data: T[];
  totalCount?: number;
}
