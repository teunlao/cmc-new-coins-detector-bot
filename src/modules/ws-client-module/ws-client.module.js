import io from 'socket.io-client';
import ClientService from '../../services/client-service/client.service';
const clientService = new ClientService();

export default class WsClientModule {
  constructor() {
    this.socket = io(process.env.SERVER_URL);

    this.socket.on('connect', () => {
      console.log('connect to websocket');
    });

    this.socket.on('newContract', ({ module, contract }) => {
      console.log('newContract', {
        module,
        contract
      });
      clientService.openPancakeSwap(contract);
      clientService.openPoocoinChart(contract);
    });
  }
}
