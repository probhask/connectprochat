import * as yup from "yup";

import { objectIdSchema } from "../../lib/validation/objectId";

export const SUploadMessageFile = yup.object({
  conversationId: objectIdSchema(),
  text: yup.string().trim().max(5000).optional(),
});

export const SDownloadFileParams = yup.object({
  filename: yup.string().required(),
});
