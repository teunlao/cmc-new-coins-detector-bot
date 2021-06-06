import { clientService, dbService, domService, telegramService, wsService } from '../../services';

export default class CmcModule {
  constructor() {
    this.name = 'CoinMarketCap';
    this.isServerSide = !!process.env.IS_SERVER_SIDE;
    this.isTelegramAvailable = !!process.env.TELEGRAM_API_TOKEN;
    this.DB_PATH = 'db/cmc.json';
    this.DEFAULT_URL = 'https://coinmarketcap.com';
  }

  async parseNewTokenUrlsFromDocument() {
    try {
      const document = await domService.getDocument(`${this.DEFAULT_URL}/new`);
      const newCoinElements = [...document.querySelectorAll('.cmc-table tbody tr')];
      return newCoinElements
        .filter((tr) => tr.querySelectorAll('td')[8].textContent === 'Binance Coin')
        .map((tr) => tr.querySelector('a')?.href);
    } catch (err) {
      console.warn('[module:CMC]: ERROR - parseTokensUrlsFromDocument', err);
      return null;
    }
  }

  async parseTokenDataFromDocument(tokenUrl) {
    try {
      const url = `${this.DEFAULT_URL}${tokenUrl}`;
      const document = await domService.getDocument(url);
      const bscScanUrl = document.querySelector('.container > :nth-child(2) >:nth-child(5) >:nth-child(3) a')?.href;
      const contract = bscScanUrl.split('/token/')[1];
      return { contract, bscScanUrl, cmcUrl: url };
    } catch (err) {
      console.warn('[module:CMC]: ERROR - parseTokenDataFromDocument', err);
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
      console.log('[module:CMC]: waiting...', new Date(Date.now()).toISOString());
      const { allTokens, newTokens } = await this.getDataChanges();
      if (newTokens.length) {
        dbService.setData(this.DB_PATH, allTokens);
      }
      for (const tokenUrl of newTokens) {
        const info = await this.parseTokenDataFromDocument(tokenUrl);
        if (info) {
          console.log('[module:CMC] new contract', info.contract);
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
    }, process.env.TICK_INTERVAL || 1000);
  }

  start() {
    console.log('[module:CMC]: started');
    this.detectChanges();
  }
}
