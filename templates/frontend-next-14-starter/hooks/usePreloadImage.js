import React from "react";

const usePreloadImage = (url) => {
  const [isLoaded, setLoadState] = React.useState(false);

  React.useLayoutEffect(() => {
    const image = new Image();

    image.src = url;
    image.onload = () => setLoadState(true);
    image.onerror = () => setLoadState(false);
  }, []);

  return isLoaded;
};

export default usePreloadImage;
