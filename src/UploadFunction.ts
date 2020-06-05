import {
  Upload,
  UploadOptions,
  UploadProgressEventListener,
  UploadResponse,
} from './Upload';
import FormDataNode from 'form-data';

interface UploadFunctionOptions extends Omit<UploadOptions, 'form' | 'url'> {
  onProgress?: UploadProgressEventListener;
}

export async function upload(
  url: string,
  form: Record<string, string | Blob> | FormData | FormDataNode,
  options?: UploadFunctionOptions
): Promise<UploadResponse> {
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
