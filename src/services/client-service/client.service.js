import open from 'open';

export default class ClientService {
  #POOCOIN_URL = 'https://poocoin.app';
  #PCS_URL = 'https://exchange.pancakeswap.finance';

  constructor() {}

  openPoocoinChart(contract) {
    open(`${this.#POOCOIN_URL}/tokens/${contract}`);
  }

  openPancakeSwap(contract) {
    open(`${this.#PCS_URL}/#/swap?outputCurrency=${contract}`);
  }
}
