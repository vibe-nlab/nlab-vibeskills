const modsClasses = (styles, mods) =>
  Object.keys(mods).map(key => {
    const value = mods[key];
    return styles[`${key}-${value}`];
  });

export default modsClasses;
