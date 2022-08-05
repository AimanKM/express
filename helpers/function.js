const { omitBy } = require("lodash");

// const objectRemoveEmpty = (obj = {}) => {
//   Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
//   return obj;
// };
const objectRemoveEmpty = (obj = {}) => omitBy(obj, (value) => value === undefined || value === null);

module.exports = { objectRemoveEmpty };
