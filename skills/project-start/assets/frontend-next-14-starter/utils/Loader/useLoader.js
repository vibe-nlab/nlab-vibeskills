import React from "react";

const useLoader = (loaders) => {
  const [state, setState] = React.useState({
    data: null,
    isDataLoaded: false,
  });

  React.useEffect(() => {
    Promise.all(loaders).then((data) => {
      setState({
        data,
        isDataLoaded: true,
      });
    });
  }, []);

  return [state.data, state.isDataLoaded];
};

export default useLoader;
