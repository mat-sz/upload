/**
 * @jest-environment jsdom
 */

import { Upload, UploadBrowser } from "../src";

describe("UploadNode", () => {
  it("should be an UploadNode", () => {
    expect(Upload).toBe(UploadBrowser);
  });

  it("aborts the process", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["test"]));
    const upload = new Upload({
      url: "https://httpbin.org/post",
      form: formData,
    });

    let progress = 0;
    const abortHandler = jest.fn(() => {
      // empty
    });
    const progressHandler = jest.fn((p) => (progress = p));

    upload.on("state", () => {
      if (upload.state === "aborted") abortHandler();
    });
    upload.on("progress", progressHandler);
    upload.upload();

    upload.abort();
    expect(abortHandler).toBeCalled();
    expect(progress).not.toBe(1);
    expect(upload.state).toBe("aborted");
  });

  describe("supports different methods", () => {
    for (const method of ["PUT", "POST", "PATCH", "DELETE"]) {
      it(`supports ${method}`, async () => {
        const upload = new Upload({
          url: `https://httpbin.org/${method.toLowerCase()}`,
          method,
          // @ts-expect-error a valid option
          form: "",
        });
        const result = await upload.upload();
        expect(result.status).toBe(200);
      }, 10000);
    }
  });
});
