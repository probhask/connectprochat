import { InferType } from "yup";

import { SDownloadFileParams, SUploadMessageFile } from "./schemas";

export type TUploadMessageFile = InferType<typeof SUploadMessageFile>;
export type TDownloadFileParams = InferType<typeof SDownloadFileParams>;
