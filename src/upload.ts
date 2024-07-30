import {
  UploadNode,
  UploadNodeForm,
  UploadNodeOptions,
  UploadNodeResponse,
} from "./node";
import {
  UploadBrowser,
  UploadBrowserForm,
  UploadBrowserOptions,
  UploadBrowserResponse,
} from "./browser";

export type UploadOptions = UploadNodeOptions | UploadBrowserOptions;
export type UploadResponse = UploadNodeResponse | UploadBrowserResponse;
export type UploadForm = UploadNodeForm | UploadBrowserForm;
export type Upload = typeof UploadNode | typeof UploadBrowser;

function getUpload(): Upload {
  // Check if we're running in a browser.
  if (
    typeof window !== "undefined" &&
    typeof XMLHttpRequest !== "undefined"
  ) {
    return UploadBrowser;
  } else {
    return UploadNode;
  }
}

export const Upload = getUpload();
