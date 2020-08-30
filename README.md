<h1 align="center">
<img src="https://raw.githubusercontent.com/mat-sz/upload/master/logo.png" alt="upload" width="700">
</h1>

<p align="center">
Isomorphic TypeScript file upload library for browser and node.js environments.
</p>

<p align="center">
<img alt="workflow" src="https://img.shields.io/github/workflow/status/mat-sz/upload/Node.js%20CI%20(yarn)">
<a href="https://npmjs.com/package/upload">
<img alt="npm" src="https://img.shields.io/npm/v/upload">
<img alt="npm" src="https://img.shields.io/npm/dw/upload">
<img alt="NPM" src="https://img.shields.io/npm/l/upload">
</a>
</p>

<p align="center">
<strong>Quickstart:</strong>
</p>

```
npm install upload

# ...or

yarn add upload
```

## Example usage

### upload function

```ts
import { upload } from 'upload';

async function test() {
  const response = await upload(
    'https://example.com/upload',
    {
      file: someInput.file,
    },
    {
      onProgress: progress => (element.innerText = progress * 100 + '%'),
    }
  );

  console.log(response);
}
```

### Upload class

```ts
async function test() {
  const upload = new Upload({
    url: 'https://example.com/upload',
    form: {
      file: someInput.file,
    },
    headers: {
      Authorization: 'Bearer TOKEN',
    },
  });

  upload.on('progress', progress => {
    element.innerText = progress * 100 + '%';
  });

  const response = await upload.upload();
  console.log(response);

  alert('Done!');
}
```

### Abort request

```ts
const upload = new Upload({
  url: 'https://httpbin.org/post',
  form: someInput.file,
});

upload.on('state', () => {
  if (upload.state === 'aborted') doSomething();
});

upload.upload();
upload.abort();
```

## Events

You can attach event listeners to an instance of `Upload` with `.on`:

```ts
upload.on('state', state => {
  console.log(state);
});
```

### state

Emitted when upload state is changed. Possible states: `new`, `started`, `aborted`, `failed`, `successful`.

### error

Emitted when an error occurs.

### progress (progress: number)

Emitted when upload progress changes. Progress is a float between 0 and 1.

## API

```ts
interface UploadResponse {
  data?: string | ArrayBuffer | Blob;
  headers?: Record<string, string | string[] | undefined>;
}

interface UploadOptions {
  form: Record<string, string | Blob> | FormData | FormDataNode;
  url: string;
  headers?: Record<string, string>;
}

type UploadState = 'new' | 'started' | 'aborted' | 'failed' | 'successful';

public state: UploadState;
public progress = 0;
public uploadedBytes = 0;
public totalBytes = 0;

new Upload(options: UploadOptions);
upload(): Promise<UploadResponse>;
abort(): void;

on(eventType: 'progress', listener: (progress: number) => void): void;
on(eventType: 'error', listener: () => void): void;
on(eventType: 'state', listener: (state: string) => void): void;

off(eventType: 'progress', listener: (progress: number) => void): void;
off(eventType: 'error', listener: () => void): void;
off(eventType: 'state', listener: (state: string) => void): void;
```
