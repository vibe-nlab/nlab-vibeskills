const grabber = (data, paths) => {
  let result = [];

  paths.forEach((path) => {
    let current = data;
    let keys = path.split(".");
    let i = 0;

    const searchValue = (obj) => {
      if (obj[keys[i]]) {
        current = obj[keys[i]];
        if (Array.isArray(current)) {
          current.forEach((item) => {
            i++;
            searchValue(item);
            i--;
          });
        } else if (typeof current === "object") {
          i++;
          searchValue(current);
          i--;
        } else {
          result.push(current);
        }
      }
    };

    searchValue(data);
  });

  return result;
};

export default grabber;
