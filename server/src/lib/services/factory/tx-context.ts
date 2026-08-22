import { ClientSession, Document, FilterQuery, UpdateQuery } from "mongoose";

import Conversation from "../../../models/conversation";
import FriendRequest from "../../../models/friendRequest";
import Message from "../../../models/message";
import Otp from "../../../models/otp";
import Upload from "../../../models/upload";
import User from "../../../models/user";
import * as factory from "./service";
import { AnyModel, QueryOptions } from "./types";

/**
 * Binds one Mongoose model to a session, exposing the factory-service CRUD
 * functions by name without requiring the caller to pass `{ session }` on
 * every call — mirrors lankwai-backend's Prisma `tx.faqs`/`tx.club` shape.
 */
function bindModel<T extends Document>(model: AnyModel<T>, session: ClientSession) {
  return {
    findOne: (where: FilterQuery<T>, options?: Omit<QueryOptions, "session">) =>
      factory.findOne(model, where, { ...options, session }),
    findMany: (where: FilterQuery<T>, options?: Omit<QueryOptions, "session">) =>
      factory.findMany(model, where, { ...options, session }),
    create: (data: Partial<T>) => factory.create(model, data, session),
    updateOne: (
      where: FilterQuery<T>,
      data: UpdateQuery<T>,
      options?: Omit<QueryOptions, "session">
    ) => factory.updateOne(model, where, data, { ...options, session }),
    deleteOne: (where: FilterQuery<T>) => factory.deleteOne(model, where, session),
    count: (where: FilterQuery<T>) => factory.count(model, where, session),
  };
}

/**
 * Builds the named transaction client passed into every `runTransaction`
 * callback. Add a new binding here whenever a new Mongoose model is added.
 */
export function createTxContext(session: ClientSession) {
  return {
    user: bindModel(User, session),
    conversation: bindModel(Conversation, session),
    message: bindModel(Message, session),
    friendRequest: bindModel(FriendRequest, session),
    upload: bindModel(Upload, session),
    otp: bindModel(Otp, session),
  };
}

export type TxContext = ReturnType<typeof createTxContext>;
