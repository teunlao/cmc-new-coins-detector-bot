import TgApi from 'node-telegram-bot-api';

export default class TelegramService {
  #POOCOIN_URL = 'https://poocoin.app';
  #PCS_URL = 'https://exchange.pancakeswap.finance';

  constructor() {
    this.chats = [];
    this.token = process.env.TELEGRAM_API_TOKEN;
    if (this.token) {
      this.bot = new TgApi(this.token, { polling: true });
      this.bot.on('message', (msg) => {
        if (msg.text === '/start') {
          this.bot.sendMessage(msg.chat.id, 'Success');
          this.chats.push(msg.chat);
        }
      });
    }
  }

  sendAlert({ module, contract }) {
    this.chats.forEach((chat) => {
      this.bot.sendMessage(
        chat.id,
        `[${module}]: ${contract}\n${this.#POOCOIN_URL}/tokens/${contract}\n${
          this.#PCS_URL
        }/#/swap?outputCurrency=${contract}`
      );
    });
  }
}
