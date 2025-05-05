export const getLocaleNumberString = (totalRequests: number) => {
  if (!totalRequests) return '0';
  let stringValue = `${totalRequests.toLocaleString('en-US')}`;
  const million = 1000000;
  if (totalRequests > million) {
    stringValue = `${(totalRequests / million).toFixed(1)} Million`;
  }
  return stringValue;
};
