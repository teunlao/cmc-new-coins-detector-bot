import { httpService } from '../index.js';
import { JSDOM } from 'jsdom';

export default class DomService {
  constructor() {}

  async getDocument(url) {
    const htmlBody = await httpService.getHtmlBody(url);
    const dom = new JSDOM(htmlBody);
    return dom.window.document;
  }
}
