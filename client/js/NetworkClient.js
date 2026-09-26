export class NetworkClient {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.connected = false;
  }

  connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${location.host}`);

    this.ws.onopen = () => {
      this.connected = true;
      console.log('Conectado ao servidor de Munorok');
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handler = this.handlers[msg.type];
      if (handler) handler(msg.data);
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.log('Desconectado do servidor');
    };
  }

  on(type, handler) {
    this.handlers[type] = handler;
  }

  send(type, data) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}
