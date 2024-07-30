import type FormDataNode from "form-data";

export interface UploadBaseOptions {
  form: any;
  url: string;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  method?: string;
}

export interface UploadBaseResponse {
  data: string | ArrayBuffer | Blob;
  status: number;
  headers: Record<string, string | string[] | undefined>;
}

export type UploadState =
  | "new"
  | "started"
  | "failed"
  | "successful"
  | "aborted";

export type UploadStateChangeEventListener = (
  this: UploadBase,
  state: UploadState,
) => void;
export type UploadProgressEventListener = (
  this: UploadBase,
  progress: number,
) => void;
export type UploadErrorEventListener = (this: UploadBase) => void;

type UploadEventListenerUnion =
  | UploadStateChangeEventListener
  | UploadErrorEventListener
  | UploadProgressEventListener;

interface UploadEvents {
  state: Set<UploadStateChangeEventListener>;
  error: Set<UploadErrorEventListener>;
  progress: Set<UploadProgressEventListener>;
}

export abstract class UploadBase<
  UploadOptions extends UploadBaseOptions = UploadBaseOptions,
  UploadResponse extends UploadBaseResponse = UploadBaseResponse,
> {
  private events: UploadEvents = {
    state: new Set(),
    error: new Set(),
    progress: new Set(),
  };

  protected form: Record<string, string | Blob> | FormData | FormDataNode;
  protected url: string;
  protected headers?: Record<string, string>;
  protected method: string;
  protected withCredentials?: boolean = false;

  private _uploadedBytes = 0;
  private _totalBytes = 0;
  private _state: UploadState = "new";

  constructor(options: UploadOptions) {
    if (!options) {
      throw new Error("Options are required.");
    }

    if (!options.url || typeof options.url !== "string") {
      throw new Error("Destination URL is missing or invalid.");
    }

    this.form = options.form;
    this.url = options.url;
    this.headers = options.headers;
    this.method = options.method || "POST";
    this.withCredentials = options.withCredentials;
  }

  abstract upload(): Promise<UploadResponse>;

  abstract abort(): void;

  get uploadedBytes(): number {
    return this._uploadedBytes;
  }

  protected setUploadedBytes(value: number) {
    this._uploadedBytes = value;
    this.emit("progress", this.progress);
  }

  protected increaseUploadedBytes(value: number) {
    this._uploadedBytes += value;
    this.emit("progress", this.progress);
  }

  get totalBytes(): number {
    return this._totalBytes;
  }

  protected setTotalBytes(value: number) {
    this._totalBytes = value;
    this.emit("progress", this.progress);
  }

  /**
   * Current upload progress. A float between 0 and 1.
   */
  get progress(): number {
    return this._totalBytes === 0 ? 0 : this._uploadedBytes / this._totalBytes;
  }

  get state(): UploadState {
    return this._state;
  }

  protected setState(value: UploadState) {
    const oldState = this._state;
    this._state = value;
    if (oldState !== this._state) {
      this.emit("state", this._state);
    }
  }

  /**
   * Adds a listener for a progress event.
   * @param eventType Event type. (progress)
   * @param listener Listener function.
   */
  on(eventType: "progress", listener: UploadProgressEventListener): void;

  /**
   * Adds a listener for an error event.
   * @param eventType Event type. (error)
   * @param listener Listener function.
   */
  on(eventType: "error", listener: UploadErrorEventListener): void;

  /**
   * Adds a listener for a state change event.
   * @param eventType Event type. (state)
   * @param listener Listener function.
   */
  on(eventType: "state", listener: UploadStateChangeEventListener): void;

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
  off(eventType: "progress", listener: UploadProgressEventListener): void;

  /**
   * Removes a listener for an error event.
   * @param eventType Event type. (error)
   * @param listener Listener function.
   */
  off(eventType: "error", listener: UploadErrorEventListener): void;

  /**
   * Removes a listener for a state change event.
   * @param eventType Event type. (state)
   * @param listener Listener function.
   */
  off(eventType: "state", listener: UploadStateChangeEventListener): void;

  /**
   * Removes a listener for a given event.
   * @param eventType Event type.
   * @param listener Listener function.
   */
  off(eventType: keyof UploadEvents, listener: UploadEventListenerUnion): void {
    this.events[eventType].delete(listener as any);
  }

  protected emit(eventType: keyof UploadEvents, ...args: any[]) {
    for (const listener of this.events[eventType]) {
      (listener as any).apply(this, args);
    }
  }
}
