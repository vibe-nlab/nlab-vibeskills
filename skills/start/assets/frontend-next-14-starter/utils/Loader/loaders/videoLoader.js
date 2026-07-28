const videoLoader = (url) => {
  return new Promise((resolve, reject) => {
    const videoFileUrls = [url];

    if (typeof window == "undefined" || window.caches === undefined) {
      resolve();
    }

    window.caches
      .open("video-pre-cache")
      .then((cache) =>
        Promise.all(
          videoFileUrls.map((videoFileUrl) =>
            fetchAndCache(videoFileUrl, cache)
          )
        )
      )
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });

    function fetchAndCache(videoFileUrl, cache) {
      return cache.match(videoFileUrl).then((cacheResponse) => {
        if (cacheResponse) {
          return cacheResponse;
        }
        return fetch(videoFileUrl).then((networkResponse) => {
          cache.put(videoFileUrl, networkResponse.clone());

          return networkResponse;
        });
      });
    }
  });
};

export default videoLoader;
