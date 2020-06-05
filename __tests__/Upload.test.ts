/* eslint-disable */
import FD from 'form-data';
import { Upload } from '../src';

describe('Upload', () => {
  it('uploads files', async () => {
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
    const onProgress = jest.fn((p: number) => (progress = p));

    upload.on('progress', onProgress);
    const response = await upload.upload();

    expect(onProgress).toBeCalled();
    expect(progress).toBe(1);
    expect(upload.state).toBe('successful');
    expect(typeof response.data).toBe('string');

    const json = JSON.parse(response.data as string);
    expect(json['files']['file']).toBe('test');
  });
});
