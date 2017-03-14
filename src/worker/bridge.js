import Channel from 'common/channel';
import { TIMEOUT, WORKER_MESSAGES as _ } from 'common/constants';
import TreeNode from './dom/tree-node';

class Bridge {
  constructor() {
    this.queue = [];
    this.channel = new Channel(self);
    this.channel.onMessage(this.handleMessage.bind(this));
    this.pollQueue();
  }

  pollQueue() {
    self.setTimeout(() => {
      this.flushQueue();
      this.pollQueue();
    }, TIMEOUT);
  }

  handleMessage(type, payload) {
    switch (type) {
      case _.renderTime:
        this.rate = payload.count / payload.time;
        break;

      case _.event:
        this.eventHandler(payload);
        break;

      default:
        console.trace('Unknown message %s', type);
    }
  }

  // XXX: Consider explicitly passing in `eventHandler` instead of using this
  // setter method. A bridge should only have one corresponding event-handler.
  onEventHandler(handler) {
    this.eventHandler = handler;
  }

  send(operation, guid, params) {
    if (!Array.isArray(params)) {
      params = [params];
    }

    const guidPos = [];
    const args = params.map((a, i) => a instanceof TreeNode ? (guidPos.push(i), a._guid) : a);

    this.queue.push({
      operation,
      guid,
      args,
      guidPos: guidPos.length > 0 ? guidPos : undefined
    });
  }

  flushQueue() {
    if (this.queue.length === 0) {
      return;
    }
    this.channel.send(_.renderQueue, this.queue);
    this.queue = [];
  }
}

export default new Bridge();
