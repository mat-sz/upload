import { UploadBase, UploadBaseOptions, UploadBaseResponse } from "./base";

export type UploadBrowserForm =
  | Blob
  | BufferSource
  | URLSearchParams
  | string;

export interface UploadBrowserOptions extends UploadBaseOptions {
  form: UploadBrowserForm;
}

export interface UploadBrowserResponse extends UploadBaseResponse {
  xhr: XMLHttpRequest;
}

export class UploadBrowser extends UploadBase {
  private xhr?: XMLHttpRequest;

  constructor(options: UploadBrowserOptions) {
    super(options);
  }

  upload(): Promise<UploadBrowserResponse> {
    return new Promise<UploadBrowserResponse>((resolve, reject) => {
      this.xhr = new XMLHttpRequest();

      if (this.withCredentials) {
        this.xhr.withCredentials = true;
      }

      this.xhr.open(this.method, this.url, true);

      if (typeof this.headers === "object") {
        for (const headerName of Object.keys(this.headers)) {
          this.xhr.setRequestHeader(headerName, this.headers[headerName]);
        }
      }

      this.xhr.addEventListener("loadstart", () => {
        this.setState("started");
      });

      if (this.xhr.upload) {
        this.xhr.upload.addEventListener("progress", (e) => {
          if (this.totalBytes !== e.total) {
            this.setTotalBytes(e.total);
          }
          this.setUploadedBytes(e.loaded);
        });
      }

      this.xhr.addEventListener("load", () => {
        if (this.xhr) {
          this.setUploadedBytes(this.totalBytes);
          this.setState("successful");

          const lines = this.xhr
            .getAllResponseHeaders()
            .replace(/\r/g, "")
            .split("\n");
          const headers: Record<string, string> = {};
          for (const line of lines) {
            const split = line.split(":");
            if (split.length != 2) {
              continue;
            }
            headers[split[0].trim()] = split[1].trim();
          }

          resolve({
            data: this.xhr.responseType === "json"
              ? JSON.stringify(this.xhr.response)
              : this.xhr.response,
            xhr: this.xhr,
            headers,
            status: this.xhr.status,
          });
        }
      });

      this.xhr.addEventListener("error", () => {
        this.setState("failed");
        this.emit("error");
        reject();
      });

      this.xhr.addEventListener("abort", () => {
        this.setState("aborted");
      });

      if (this.form instanceof FormData) {
        this.xhr.send(this.form);
      } else {
        const form = this.form as Record<string, string | Blob>;
        const formData = new FormData();
        for (const key of Object.keys(this.form)) {
          formData.set(key, form[key]);
        }
        this.xhr.send(formData);
      }
    });
  }

  abort(): void {
    this.xhr?.abort();
  }
}
