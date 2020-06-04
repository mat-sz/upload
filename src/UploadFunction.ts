import { Upload, UploadOptions, UploadProgressEventListener } from './Upload';

interface UploadFunctionOptions extends Omit<UploadOptions, 'form' | 'url'> {
  onProgress?: UploadProgressEventListener;
}

export async function upload(
  url: string,
  form: Record<string, string | Blob> | FormData,
  options?: UploadFunctionOptions
): Promise<any> {
  const upload = new Upload({
    url,
    form,
    ...options,
  });

  if (options?.onProgress) {
    upload.on('progress', options.onProgress);
  }

  return await upload.upload();
}
