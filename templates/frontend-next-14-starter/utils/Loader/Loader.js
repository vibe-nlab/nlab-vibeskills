import modelLoader from "./loaders/modelLoader";
import imageLoader from "./loaders/imageLoader";
import videoLoader from "./loaders/videoLoader";
import Observer from "./observer";

const loaders = {
  image: imageLoader,
  video: videoLoader,
  model: modelLoader,
};

class Loader {
  data = {
    count: 0,
    progress: 0,
    loaders: {},
    observer: new Observer(),
  };

  constructor() {}

  add(type, url, cache) {
    if (!url || !type) return;

    if (this.data.loaders[url]) {
      return this.data.loaders[url].promise;
    }

    const promise = new Promise((resolve) => {
      this.data.loaders[url] = {
        url,
        resolve,
        loader: loaders[type],
      };
    });

    this.data.loaders[url].promise = promise;

    if (cache) {
      promise.then((result) => {
        cache[url] = result;
      });
    }

    return promise;
  }

  remove(url) {
    delete this.data.loaders[url];
  }

  on(fn) {
    this.data.observer.subscribe(fn);
  }

  off(fn) {
    this.data.observer.unsubscribe(fn);
  }

  clear() {
    this.data.count = 0;
    this.data.progress = 0;
    this.data.loaders = [];
  }

  start() {
    const list = Object.values(this.data.loaders);
    const total = list.length;

    this.data.count = 0;
    this.data.progress = 0;

    return new Promise((resolve) => {
      if (total === 0) resolve();

      list.forEach((item) => {
        item.loader(item.url).then((result) => {
          this.data.count += 1;
          this.data.progress = this.data.count / total;

          this.data.observer.broadcast({
            result,
            url: item.url,
            progress: this.data.progress,
          });

          delete this.data.loaders[item.url];

          item.resolve(result);

          if (total === this.data.count) resolve();
        });
      });
    });
  }
}

export default Loader;
