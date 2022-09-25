// return random n-digits code
export default (n = 5) => {
  const min = 10 ** (n - 1);
  const max = 10 ** n - 1;
  const maxRandom = Math.floor(max) - Math.ceil(min) + 1;
  return Math.floor(Math.random() * maxRandom) + Math.ceil(min);
};
