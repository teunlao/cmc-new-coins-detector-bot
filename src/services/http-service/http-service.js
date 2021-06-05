import got from 'got';

export default class HttpService {
  constructor() {}

  async getHtmlBody(url) {
    const { body } = await got(url);
    return body;
  }
}
