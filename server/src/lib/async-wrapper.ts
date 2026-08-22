import { NextFunction, Request, RequestHandler, Response } from "express";
import type { AnySchema, InferType } from "yup";

import { errorHandler } from "./error-handler";

interface Validators<
  P extends AnySchema | undefined,
  Q extends AnySchema | undefined,
  B extends AnySchema | undefined
> {
  params?: P;
  query?: Q;
  body?: B;
}

type Infer<S extends AnySchema | undefined> = S extends AnySchema
  ? InferType<S>
  : Record<string, never>;

type ParsedInput<
  P extends AnySchema | undefined,
  Q extends AnySchema | undefined,
  B extends AnySchema | undefined
> = {
  params: Infer<P>;
  query: Infer<Q>;
  body: Infer<B>;
};

/**
 * Wraps a controller with Yup validation + centralized error handling.
 * The controller receives a fully-typed `parsedInput` inferred directly from
 * the Yup schemas passed in — no `req.body as SomeType` casts anywhere.
 *
 * @example
 * export const sendFriendRequest = asyncWrapper(async (req, res, { body }) => {
 *   const senderId = req.userId!; // set by verifyJWT
 *   ...
 * }, { body: SSendFriendRequest });
 */
export function asyncWrapper<
  P extends AnySchema | undefined = undefined,
  Q extends AnySchema | undefined = undefined,
  B extends AnySchema | undefined = undefined
>(
  controller: (
    req: Request,
    res: Response,
    parsedInput: ParsedInput<P, Q, B>
  ) => Promise<unknown>,
  validators?: Validators<P, Q, B>
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = validators?.params
        ? await validators.params.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
          })
        : (req.params as Infer<P>);

      const query = validators?.query
        ? await validators.query.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
          })
        : (req.query as Infer<Q>);

      const body = validators?.body
        ? await validators.body.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
          })
        : (req.body as Infer<B>);

      await controller(req, res, {
        params: params as Infer<P>,
        query: query as Infer<Q>,
        body: body as Infer<B>,
      });
    } catch (err) {
      errorHandler(err, req, res, next);
    }
  };
}
