import { IncomingMessage } from 'http';
import { URL } from 'url';
import FormDataNode, { SubmitOptions } from 'form-data';

export interface UploadOptions {
  form: Record<string, string | Blob> | FormData | FormDataNode;
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

  private form: Record<string, string | Blob> | FormData | FormDataNode;
  private url: string;
  private headers?: Record<string, string>;

  private _uploadedBytes = 0;
  private _totalBytes = 0;
  private _state: UploadState = 'new';

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
          this.setState('started');
        });

        if (xhr.upload) {
          xhr.upload.addEventListener('progress', e => {
            if (this._totalBytes !== e.total) {
              this.setTotalBytes(e.total);
            }
            this.setUploadedBytes(e.loaded);
          });
        }

        xhr.addEventListener('load', () => {
          this.setUploadedBytes(this.totalBytes);
          this.setState('successful');

          if (xhr.responseType === 'json') {
            resolve(new Response(JSON.stringify(xhr.response)));
          } else {
            resolve(new Response(xhr.response));
          }
        });

        xhr.addEventListener('error', () => {
          this.setState('failed');
          this.emit('error');
          reject();
        });

        xhr.send(this.formData as FormData);
      } else {
        const callback = (error: Error | null, res: IncomingMessage) => {
          if (error) {
            this.setState('failed');
            this.emit('error');

            reject();
          } else {
            this.setUploadedBytes(this.totalBytes);
            this.setState('successful');

            let body = '';
            res.on('readable', () => {
              body += res.read();
            });
            res.on('end', () => {
              resolve(body as any);
            });
          }
        };

        const url = new URL(this.url);
        const options: SubmitOptions = {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'POST',
          headers: this.headers,
        };

        const formData = this.formData as FormDataNode;

        formData.getLength((error: Error | null, length: number) => {
          this.setTotalBytes(length);
        });
        formData.on('data', chunk => {
          if (this.state === 'new') {
            this.setState('started');
          }

          if (chunk.hasOwnProperty('length')) {
            this.increaseUploadedBytes(chunk.length as number);
          }
        });

        formData.submit(options, callback);
      }
    });
  }

  get uploadedBytes(): number {
    return this._uploadedBytes;
  }

  private setUploadedBytes(value: number) {
    this._uploadedBytes = value;
    this.emit('progress', this.progress);
  }

  private increaseUploadedBytes(value: number) {
    this._uploadedBytes += value;
    this.emit('progress', this.progress);
  }

  get totalBytes(): number {
    return this._totalBytes;
  }

  private setTotalBytes(value: number) {
    this._totalBytes = value;
    this.emit('progress', this.progress);
  }

  get progress(): number {
    return this._totalBytes === 0 ? 0 : this._uploadedBytes / this._totalBytes;
  }

  get state(): UploadState {
    return this._state;
  }

  private setState(value: UploadState) {
    const oldState = this._state;
    this._state = value;
    if (oldState !== this._state) {
      this.emit('state', this._state);
    }
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

  private get formData(): FormData | FormDataNode | undefined {
    if (
      (typeof FormData !== 'undefined' && this.form instanceof FormData) ||
      (typeof FormDataNode !== 'undefined' && this.form instanceof FormDataNode)
    ) {
      return this.form as FormData;
    } else if (typeof FormData !== 'undefined') {
      const formData = new FormData();
      for (const key of Object.keys(this.form)) {
        // eslint-disable-next-line
        // @ts-ignore
        formData.set(key, this.form[key]);
      }
      return formData;
    } else if (typeof FormDataNode !== 'undefined') {
      const formData = new FormDataNode();
      for (const key of Object.keys(this.form)) {
        // eslint-disable-next-line
        // @ts-ignore
        formData.append(key, this.form[key]);
      }
      return formData;
    }
  }
}
