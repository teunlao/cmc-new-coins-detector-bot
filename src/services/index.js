import HttpService from './http-service/http-service';
import DomService from './dom-service/dom.service';
import DbService from './db-service/db.service';

export const httpService = new HttpService();
export const domService = new DomService();
export const dbService = new DbService();
