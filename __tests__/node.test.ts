/* eslint-disable */
import FD from "form-data";
import { Upload, UploadNode } from "../src";

describe("UploadNode", () => {
  it("should be an UploadNode", () => {
    expect(Upload).toBe(UploadNode);
  });

  it("uploads files", async () => {
    const formData = new FD();
    formData.append("file", Buffer.from("test"), {
      filename: "test",
    });
    const upload = new Upload({
      url: "https://httpbin.org/post",
      // @ts-ignore
      form: formData,
    });

    let progress = 0;
    const onProgress = jest.fn((p: number) => (progress = p));

    upload.on("progress", onProgress);
    const response = await upload.upload();

    expect(onProgress).toBeCalled();
    expect(progress).toBe(1);
    expect(upload.state).toBe("successful");
    expect(typeof response.data).toBe("string");

    const json = JSON.parse(response.data as string);
    expect(json["files"]["file"]).toBe("test");
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
