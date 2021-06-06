import { clientService, dbService, domService, telegramService, wsService } from '../../services';

export default class CmcModule {
  constructor() {
    this.isServerSide = !!process.env.IS_SERVER_SIDE;
    this.isTelegramAvailable = !!process.env.TELEGRAM_API_TOKEN;
    this.DB_PATH = 'db/cmc.json';
    this.DEFAULT_URL = 'https://coinmarketcap.com';
    this.state = {
      previous: [],
      current: []
    };

    console.log('isServerSide', this.isServerSide);
  }

  async parseNewTokenUrlsFromDocument() {
    try {
      const document = await domService.getDocument(`${this.DEFAULT_URL}/new`);
      const newCoinElements = [...document.querySelectorAll('.cmc-table tbody tr')];
      return newCoinElements
        .filter((tr) => tr.querySelectorAll('td')[8].textContent === 'Binance Coin')
        .map((tr) => tr.querySelector('a').href);
    } catch (err) {
      console.warn('[module:CMC]: ERROR - parseTokensUrlsFromDocument');
      throw err;
    }
  }

  async parseTokenDataFromDocument(tokenUrl) {
    try {
      const url = `${this.DEFAULT_URL}${tokenUrl}`;
      const document = await domService.getDocument(url);
      const bscScanUrl = document.querySelector('.container > :nth-child(2) >:nth-child(5) >:nth-child(3) a').href;
      const contract = bscScanUrl.split('/token/')[1];
      return { contract, bscScanUrl, cmcUrl: url };
    } catch (err) {
      console.warn('[module:CMC]: ERROR - parseTokenDataFromDocument');
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
        console.log('[module:CMC]: waiting for new listings...', new Date());
        i = 0;
      }
      await this.updateState();
      const newTokenUrls = this.getStateChanges();
      if (newTokenUrls.length) {
        dbService.setData(this.DB_PATH, this.state.current);
      }
      for (const tokenUrl of newTokenUrls) {
        const info = await this.parseTokenDataFromDocument(tokenUrl);
        console.log('[module:CMC] new contract', info.contract);
        if (this.isTelegramAvailable) {
          telegramService.sendAlert({ module: 'CoinMarketCap', contract: info.contract });
        }
        if (this.isServerSide) {
          wsService.emitAlert({ module: 'CoinMarketCap', contract: info.contract });
        } else {
          console.log('ELSE');
          clientService.openPancakeSwap(info.contract);
          clientService.openPoocoinChart(info.contract);
        }
      }
    }, process.env.TICK_INTERVAL || 1000);
  }

  start() {
    console.log('[module:CMC]: started');
    this.state.current = dbService.getData(this.DB_PATH);
    this.detectChanges();
  }
}
