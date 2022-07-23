const emailFormat = value => (
  value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z0-9-]{2,63}$/i.test(value)
    ? false
    : true
);

module.exports = { emailFormat };