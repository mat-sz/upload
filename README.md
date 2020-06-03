# upload

Isomorphic TypeScript file upload library for browser and node environments (only browser is supported as for now).

## Example usage

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

## Events

You can attach event listeners to an instance of `Upload` with `.on`:

```ts
upload.on('state', state => {
  console.log(state);
});
```

### state

Emitted when upload state is changed. Possible states: 'new', 'started', 'failed', 'successful'.

### error

Emitted when an error occurs.

### progress

Emitted when upload progress changes.

## API

```
public state: UploadState = 'new';
public progress = 0;
public uploadedBytes = 0;
public totalBytes = 0;

constructor(options: UploadOptions);
upload(): Promise<any>;

on(eventType: 'progress', listener: (progress: number) => void): void;
on(eventType: 'error', listener: () => void): void;
on(eventType: 'state', listener: (state: string) => void): void;

off(eventType: 'progress', listener: (progress: number) => void): void;
off(eventType: 'error', listener: () => void): void;
off(eventType: 'state', listener: (state: string) => void): void;
```
