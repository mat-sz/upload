/**
 * @jest-environment jsdom
 */

import FD from 'form-data';
import { Upload } from '../src';

it('aborts the process', async () => {
  const formData = new FD();
  formData.append('file', Buffer.from('test'), {
    filename: 'test',
  });
  const upload = new Upload({
    url: 'https://httpbin.org/post',
    // @ts-ignore
    form: formData,
  });

  let progress = 0;
  const abortHandler = jest.fn(() => {});
  const progressHandler = jest.fn(p => (progress = p));

  upload.on('state', () => {
    if (upload.state === 'aborted') abortHandler();
  });
  upload.on('progress', progressHandler);
  upload.upload();

  upload.abort();
  expect(abortHandler).toBeCalled();
  expect(progress).not.toBe(1);
  expect(upload.state).toBe('aborted');
});
