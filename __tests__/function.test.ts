/* eslint-disable */
import FD from "form-data";
import { upload } from "../src";

describe("Upload function", () => {
  it("uploads files", async () => {
    const formData = new FD();
    formData.append("file", Buffer.from("test"), {
      filename: "test",
    });

    let progress = 0;
    const onProgress = jest.fn((p: number) => (progress = p));
    await upload("https://httpbin.org/post", formData, {
      onProgress,
    });

    expect(onProgress).toBeCalled();
    expect(progress).toBe(1);
  });

  describe("supports different methods", () => {
    for (const method of ["PUT", "POST", "PATCH", "DELETE"]) {
      it(`supports ${method}`, async () => {
        const result = await upload(
          `https://httpbin.org/${method.toLowerCase()}`,
          "" as unknown as FormData,
          {
            method,
          },
        );
        expect(result.status).toBe(200);
      }, 10000);
    }
  });
});
