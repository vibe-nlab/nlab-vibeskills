const imageLoader = (url) => {
  return new Promise((resolve) => {
    const image = new Image();

    image.src = url;
    image.onload = () => resolve(url);
    image.onerror = () => resolve("");
  });
};

export default imageLoader;
