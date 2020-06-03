/* eslint-disable */
import FD from 'form-data';
// @ts-ignore
import { XMLHttpRequest as XHR } from 'xmlhttprequest';
import { Upload } from '../src';

// @ts-ignore
global.XMLHttpRequest = XHR;

// @ts-ignore
global.FormData = FD;

describe('Upload', () => {
  it('uploads files', async () => {
    const formData = new FD();
    formData.append('file', Buffer.from('test'), {
      filename: 'test',
    });
    const upload = new Upload({
      url: 'https://httpbin.org/post',
      // @ts-ignore
      form: formData.getBuffer(),
    });

    await upload.upload();

    expect(upload.state).toBe('successful');
  });
});
