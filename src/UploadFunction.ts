import {
  Upload,
  UploadBody,
  UploadOptions,
  UploadProgressEventListener,
  UploadResponse,
} from './Upload';

interface UploadFunctionOptions extends Omit<UploadOptions, 'form' | 'url' | 'withCredentials'> {
  onProgress?: UploadProgressEventListener;
}

export async function upload(
  url: string,
  form: UploadBody,
  options?: UploadFunctionOptions,
  withCredentials = false
): Promise<UploadResponse> {
  const upload = new Upload({
    url,
    form,
    withCredentials,
    ...options,
  });

  if (options?.onProgress) {
    upload.on('progress', options.onProgress);
  }

  return await upload.upload();
}
