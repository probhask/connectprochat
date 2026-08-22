import { ClientSession, Document, FilterQuery, UpdateQuery } from "mongoose";

import { AnyModel, FindManyResult, QueryOptions } from "./types";

/**
 * Generic, fully-typed Mongoose repository. `<T extends Document>` is inferred
 * from the `Model<T>` argument, so every call site gets a typed result with no
 * casts — the Mongoose analog of the reference repos' Prisma-inferred factory
 * service. Controllers/services don't call these directly with a raw Model —
 * they go through the named `tx.<model>` wrapper in `lib/transaction.ts`,
 * which binds these to a session automatically (see tx-context.ts).
 */

export async function findOne<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  options: QueryOptions = {}
): Promise<T | null> {
  let query = model.findOne(where, options.select, { session: options.session });
  if (options.populate) query = query.populate(options.populate);
  return query.exec();
}

export async function findMany<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  options: QueryOptions = {}
): Promise<FindManyResult<T>> {
  let query = model.find(where, options.select, { session: options.session });
  if (options.populate) query = query.populate(options.populate);
  if (options.sort) query = query.sort(options.sort);
  if (typeof options.skip === "number") query = query.skip(options.skip);
  if (typeof options.limit === "number") query = query.limit(options.limit);
  const data = await query.exec();
  return { data };
}

export async function create<T extends Document>(
  model: AnyModel<T>,
  data: Partial<T>,
  session?: ClientSession
): Promise<T> {
  const [doc] = await model.create([data], { session });
  return doc;
}

export async function updateOne<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  data: UpdateQuery<T>,
  options: QueryOptions = {}
): Promise<T | null> {
  return model
    .findOneAndUpdate(where, data, {
      new: true,
      upsert: options.upsert,
      session: options.session,
    })
    .exec();
}

export async function deleteOne<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  session?: ClientSession
): Promise<T | null> {
  return model.findOneAndDelete(where, { session }).exec();
}

export async function count<T extends Document>(
  model: AnyModel<T>,
  where: FilterQuery<T>,
  session?: ClientSession
): Promise<number> {
  return model.countDocuments(where).session(session ?? null).exec();
}
