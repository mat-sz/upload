import { IncomingMessage } from "node:http";

import FormDataNode, { SubmitOptions } from "form-data";
import { UploadBase, UploadBaseOptions, UploadBaseResponse } from "./base";

export type UploadNodeForm =
  | Record<string, string | Blob>
  | FormData
  | FormDataNode;

export interface UploadNodeOptions extends UploadBaseOptions {
  form: UploadNodeForm;
}

export interface UploadNodeResponse extends UploadBaseResponse {
  formData: FormDataNode;
}

export class UploadNode extends UploadBase {
  constructor(options: UploadNodeOptions) {
    super(options);
  }

  upload(): Promise<UploadNodeResponse> {
    return new Promise<UploadNodeResponse>((resolve, reject) => {
      const callback = (error: Error | null, res: IncomingMessage) => {
        if (error) {
          this.setState("failed");
          this.emit("error");

          reject();
        } else {
          this.setUploadedBytes(this.totalBytes);
          this.setState("successful");

          let body = "";
          res.on("readable", () => {
            const chunk = res.read();
            if (chunk) {
              body += chunk;
            }
          });
          res.on("end", () => {
            resolve({
              data: body,
              headers: res.headers,
              status: res.statusCode ?? 200,
              formData,
            });
          });
        }
      };

      const url = new URL(this.url);
      const options: SubmitOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: this.method,
        headers: this.headers,
      };

      let formData: FormDataNode;

      if (this.form instanceof FormDataNode) {
        formData = this.form;
      } else {
        const form = this.form as Record<string, string | Blob>;
        formData = new FormDataNode();
        for (const key of Object.keys(this.form)) {
          formData.append(key, form[key]);
        }
      }

      formData.getLength((error: Error | null, length: number) => {
        this.setTotalBytes(length);
      });

      formData.on("data", (chunk) => {
        if (this.state === "new") {
          this.setState("started");
        }

        if (chunk.hasOwnProperty("length")) {
          this.increaseUploadedBytes(chunk.length as number);
        }
      });

      formData.submit(options, callback);
    });
  }

  abort(): void {
    // do nothing
  }
}
