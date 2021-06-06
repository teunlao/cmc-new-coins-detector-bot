import { clientService, dbService, domService, telegramService, wsService } from '../../services';

export default class CgModule {
  constructor() {
    this.name = 'CoinGecko';
    this.isServerSide = !!process.env.IS_SERVER_SIDE;
    this.isTelegramAvailable = !!process.env.TELEGRAM_API_TOKEN;
    this.DB_PATH = 'db/cg.json';
    this.DEFAULT_URL = 'https://www.coingecko.com/';
  }

  async parseNewTokenUrlsFromDocument() {
    try {
      const document = await domService.getDocument(`${this.DEFAULT_URL}/coins/recently_added`);
      const newCoinElementLinks = [
        ...document.querySelectorAll(
          'div.coingecko-table table > tbody > tr > :nth-child(3) > :nth-child(1) > :nth-child(2) > :nth-child(1)'
        )
      ];
      return newCoinElementLinks.map(({ href }) => href);
    } catch (err) {
      console.warn('[module:CG]: ERROR - parseTokensUrlsFromDocument', err);
      return null;
    }
  }

  async parseTokenDataFromDocument(tokenUrl) {
    try {
      const url = `${this.DEFAULT_URL}${tokenUrl}`;
      const document = await domService.getDocument(url);
      const contract = document
        .querySelector('[data-controller=coin-contract-address] i')
        ?.getAttribute('data-address');

      // const isBsc =
      //   document
      //     .querySelector(
      //       'body > div.container > div.mt-3 > div.col-12.row.p-0.m-0.mb-2.tw-flex.flex-column-reverse.flex-sm-row > div.col-md-9.col-lg-7.p-0 > div > div:nth-child(3) > div > div > span'
      //     )
      //     .innerText.trim() === 'BCS';

      const isBsc = true;

      if (isBsc) {
        return { contract, cgUrl: url };
      }
      return null;
    } catch (err) {
      console.warn('[module:CG]: ERROR - parseTokenDataFromDocument', err);
      return null;
    }
  }

  async getDataChanges() {
    const allTokens = await this.parseNewTokenUrlsFromDocument();
    const newTokens = allTokens.filter((href) => !dbService.getData(this.DB_PATH).includes(href));
    return { allTokens, newTokens };
  }

  detectChanges() {
    setInterval(async () => {
      console.log('[module:CG]:  waiting...', new Date(Date.now()).toISOString());
      const { allTokens, newTokens } = await this.getDataChanges();
      if (newTokens.length) {
        dbService.setData(this.DB_PATH, allTokens);
        for (const tokenUrl of newTokens) {
          const info = await this.parseTokenDataFromDocument(tokenUrl);
          if (info) {
            console.log('[module:CG] new contract', info.contract);
            if (this.isTelegramAvailable) {
              telegramService.sendAlert({ module: this.name, contract: info.contract });
            }
            if (this.isServerSide) {
              wsService.emitAlert({ module: this.name, contract: info.contract });
            } else {
              clientService.openPancakeSwap(info.contract);
              clientService.openPoocoinChart(info.contract);
            }
          }
        }
      }
    }, process.env.TICK_INTERVAL || 1000);
  }

  start() {
    console.log('[module:CG]: started');
    this.detectChanges();
  }

  async debug() {}
}
