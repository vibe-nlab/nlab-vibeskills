export default class EventEmitter {
  static instance;

  constructor() {
    this.callbacks = {};
    if (EventEmitter.instance) {
      return EventEmitter.instance;
    }
  }

  exists = (event) => {
    return this.callbacks[event] != null;
  };

  on = (event, callback) => {
    if (!this.exists(event)) {
      this.callbacks[event] = [];
    }

    this.callbacks[event].push(callback);
  };

  off = (event, callback) => {
    if (this.exists(event)) {
      this.callbacks[event] = this.callbacks[event].filter(
        (item) => item !== callback
      );
    }
  };

  send = (event, ...data) => {
    if (this.exists(event)) {
      for (let i = 0, n = this.callbacks[event].length; i < n; i++) {
        this.callbacks[event][i](...data);
      }
    }
  };
}
