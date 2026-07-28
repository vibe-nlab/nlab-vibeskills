import React from "react";

import cache from "constants/cache";

import Loader from "utils/Loader/Loader";
import nextFrame from "utils/nextFrame";

const useLoader = (extras, callback) => {
  const { extraModels, extraImages } = extras;

  const vars = React.useMemo(
    () => ({
      callback: () => {},
    }),
    []
  );

  const handleCallback = React.useCallback((data) => {
    vars.callback(data);
  }, []);

  React.useLayoutEffect(() => {
    vars.callback = callback;
  }, [callback]);

  React.useLayoutEffect(() => {
    let loader = null;

    nextFrame(() => {
      loader = new Loader();

      extraImages.forEach((url) => {
        loader.add("image", url);
      });

      extraModels.forEach((url) => {
        loader.add("model", url, cache.models);
      });

      loader.on(handleCallback);
      loader.start().then(() => {});
    });

    return () => {
      loader?.off(handleCallback);
      loader?.clear();
    };
  }, []);

  return null;
};

export default useLoader;
