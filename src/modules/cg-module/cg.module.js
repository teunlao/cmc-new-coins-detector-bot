import { clientService, dbService, domService, telegramService, wsService } from '../../services';

export default class CgModule {
  constructor() {
    this.isServerSide = !!process.env.IS_SERVER_SIDE;
    this.isTelegramAvailable = !!process.env.TELEGRAM_API_TOKEN;
    this.DB_PATH = 'db/cg.json';
    this.DEFAULT_URL = 'https://www.coingecko.com/';
    this.state = {
      previous: [],
      current: []
    };
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
    }
  }

  async parseTokenDataFromDocument(tokenUrl) {
    try {
      const url = `${this.DEFAULT_URL}${tokenUrl}`;
      const document = await domService.getDocument(url);
      const contract = document.querySelector('[data-controller=coin-contract-address] i').getAttribute('data-address');

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
      console.warn('[module:CG]: ERROR - parseTokenDataFromDocument');
      throw err;
    }
  }

  async updateState() {
    this.state.previous = [...this.state.current];
    this.state.current = await this.parseNewTokenUrlsFromDocument();
  }

  getStateChanges() {
    return this.state.current.filter((href) => !this.state.previous.includes(href));
  }

  detectChanges() {
    let i = 59;

    setInterval(async () => {
      i++;
      if (i === 60) {
        console.log('[module:CG]: waiting for new listings...', new Date());
        i = 0;
      }
      await this.updateState();
      const newTokenUrls = this.getStateChanges();

      if (newTokenUrls.length) {
        dbService.setData(this.DB_PATH, this.state.current);
        for (const tokenUrl of newTokenUrls) {
          const info = await this.parseTokenDataFromDocument(tokenUrl);
          console.log('[module:CG] new contract', info.contract);
          if (this.isTelegramAvailable) {
            telegramService.sendAlert({ module: 'CoinGecko', contract: info.contract });
          }
          if (this.isServerSide) {
            wsService.emitAlert({ module: 'CoinGecko', contract: info.contract });
          } else {
            clientService.openPancakeSwap(info.contract);
            clientService.openPoocoinChart(info.contract);
          }
        }
      }
    }, process.env.TICK_INTERVAL || 1000);
  }

  start() {
    console.log('[module:CG]: started');
    this.state.current = dbService.getData(this.DB_PATH);
    this.detectChanges();
  }

  async debug() {}
}
