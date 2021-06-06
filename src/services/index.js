import HttpService from './http-service/http-service';
import DomService from './dom-service/dom.service';
import DbService from './db-service/db.service';
import ClientService from './client-service/client.service';
import TelegramService from './telegram-service/telegram.service';

export const httpService = new HttpService();
export const domService = new DomService();
export const dbService = new DbService();
export const clientService = new ClientService();
export const telegramService = new TelegramService();
