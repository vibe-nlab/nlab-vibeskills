const delayer = (func, delay = 100) => {
  let timeout = delay;

  return (params) => {
    new Promise((resolve) => {
      timeout += delay;
      const time = setTimeout(() => {
        func(params);
        resolve();
        clearTimeout(time);
      }, timeout);
    }).then();
  };
};

export default delayer;
