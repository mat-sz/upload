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

    expect(upload.state).toBe('successful');
  });
});
