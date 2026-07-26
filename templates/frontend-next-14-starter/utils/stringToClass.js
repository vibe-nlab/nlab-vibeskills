function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find + "\\b", "g"), replace);
}

const sc = (s, str) => {
  let result = String(str);

  Object.entries(s).forEach(([key, value]) => {
    result = replaceAll(result, key, value);
  });

  return result;
};

export default sc;
