import * as yup from "yup";
import { isValidObjectId } from "mongoose";

/** Yup `.test()` for a valid Mongo ObjectId string. Usage: yup.string().test(objectIdTest) */
export const objectIdTest: yup.TestConfig<string | undefined> = {
  name: "objectId",
  message: "${path} must be a valid id",
  test: (value) => (value ? isValidObjectId(value) : true),
};

/** Convenience: yup.string().required() + valid ObjectId in one call. */
export const objectIdSchema = () =>
  yup.string().required().test(objectIdTest);
