import {
  Upload,
  UploadOptions,
  UploadProgressEventListener,
  UploadResponse,
} from './Upload';
import FormDataNode from 'form-data';

interface UploadFunctionOptions extends Omit<UploadOptions, 'form' | 'url' | 'withCredentials'> {
  onProgress?: UploadProgressEventListener;
}

export async function upload(
  url: string,
  form: Record<string, string | Blob> | FormData | FormDataNode,
  options?: UploadFunctionOptions,
  withCredentials: boolean = false
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
