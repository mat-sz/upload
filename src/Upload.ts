export interface UploadOptions {
  form: Record<string, string | Blob> | FormData;
  url: string;
  headers?: Record<string, string>;
}

export type UploadState = 'new' | 'started' | 'failed' | 'successful';

export type UploadStateChangeEventListener = (
  this: Upload,
  state: UploadState
) => void;
export type UploadProgressEventListener = (
  this: Upload,
  progress: number
) => void;
export type UploadErrorEventListener = (this: Upload) => void;

type UploadEventListenerUnion =
  | UploadStateChangeEventListener
  | UploadErrorEventListener
  | UploadProgressEventListener;

interface UploadEvents {
  state: Set<UploadStateChangeEventListener>;
  error: Set<UploadErrorEventListener>;
  progress: Set<UploadProgressEventListener>;
}

export class Upload {
  private events: UploadEvents = {
    state: new Set(),
    error: new Set(),
    progress: new Set(),
  };

  private form: Record<string, string | Blob> | FormData;
  private url: string;
  private headers?: Record<string, string>;

  public state: UploadState = 'new';
  public progress = 0;
  public uploadedBytes = 0;
  public totalBytes = 0;

  constructor(options: UploadOptions) {
    if (!options) {
      throw new Error('Options are required.');
    }

    if (!options.url || typeof options.url !== 'string') {
      throw new Error('Destination URL is missing or invalid.');
    }

    this.form = options.form;
    this.url = options.url;
    this.headers = options.headers;
  }

  /**
   * POSTs the form.
   */
  upload(): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      // Check if we're running in a browser.
      if (
        typeof window !== 'undefined' &&
        typeof XMLHttpRequest !== 'undefined'
      ) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', this.url, true);

        if (typeof this.headers === 'object') {
          for (const headerName of Object.keys(this.headers)) {
            xhr.setRequestHeader(headerName, this.headers[headerName]);
          }
        }

        xhr.setRequestHeader('Content-Type', 'multipart/form-data');

        xhr.addEventListener('loadstart', () => {
          this.state = 'started';
          this.emit('state', this.state);
        });

        if (xhr.upload) {
          xhr.upload.addEventListener('progress', e => {
            this.progress = e.loaded / e.total;
            this.uploadedBytes = e.loaded;
            this.totalBytes = e.total;
            this.emit('progress', this.progress);
          });
        }

        xhr.addEventListener('load', () => {
          this.state = 'successful';
          this.emit('state', this.state);

          if (xhr.responseType === 'json') {
            resolve(new Response(JSON.stringify(xhr.response)));
          } else {
            resolve(new Response(xhr.response));
          }
        });

        xhr.addEventListener('error', () => {
          this.state = 'failed';
          this.emit('state', this.state);
          this.emit('error');
          reject();
        });

        xhr.send(this.formData);
      } else {
        throw new Error('node.js environments are not supported yet.');
      }
    });
  }

  /**
   * Adds a listener for a progress event.
   * @param eventType Event type. (progress)
   * @param listener Listener function.
   */
  on(eventType: 'progress', listener: UploadProgressEventListener): void;

  /**
   * Adds a listener for an error event.
   * @param eventType Event type. (error)
   * @param listener Listener function.
   */
  on(eventType: 'error', listener: UploadErrorEventListener): void;

  /**
   * Adds a listener for a state change event.
   * @param eventType Event type. (state)
   * @param listener Listener function.
   */
  on(eventType: 'state', listener: UploadStateChangeEventListener): void;

  /**
   * Adds a listener for a given event.
   * @param eventType Event type.
   * @param listener Listener function.
   */
  on(eventType: keyof UploadEvents, listener: UploadEventListenerUnion): void {
    this.events[eventType].add(listener as any);
  }

  /**
   * Removes a listener for a progress event.
   * @param eventType Event type. (progress)
   * @param listener Listener function.
   */
  off(eventType: 'progress', listener: UploadProgressEventListener): void;

  /**
   * Removes a listener for an error event.
   * @param eventType Event type. (error)
   * @param listener Listener function.
   */
  off(eventType: 'error', listener: UploadErrorEventListener): void;

  /**
   * Removes a listener for a state change event.
   * @param eventType Event type. (state)
   * @param listener Listener function.
   */
  off(eventType: 'state', listener: UploadStateChangeEventListener): void;

  /**
   * Removes a listener for a given event.
   * @param eventType Event type.
   * @param listener Listener function.
   */
  off(eventType: keyof UploadEvents, listener: UploadEventListenerUnion): void {
    this.events[eventType].delete(listener as any);
  }

  private emit(eventType: keyof UploadEvents, ...args: any[]) {
    for (const listener of this.events[eventType]) {
      (listener as any).apply(this, args);
    }
  }

  private get formData(): FormData {
    let formData: FormData;
    if (this.form instanceof FormData || 'buffer' in this.form) {
      formData = this.form as FormData;
    } else {
      formData = new FormData();
      for (const key of Object.keys(this.form)) {
        formData.append(key, this.form[key]);
      }
    }

    return formData;
  }
}
