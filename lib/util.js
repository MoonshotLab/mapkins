function getHoursFromMs(ms) {
  return ms / 1000 / 60 / 60;
}

module.exports = {
  getHoursFromMs: getHoursFromMs
};
