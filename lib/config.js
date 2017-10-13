const mapkinsCapacity = [12, 12, 12, 11];
const numRows = mapkinsCapacity.length;
const totalMapkins = mapkinsCapacity.reduce((sum, val) => sum + val);
const mapkinsLowCount = Math.ceil(0.25 * totalMapkins);
const requestTimeout = 30 * 1000;
const particle = {
  url: `https://api.particle.io/v1/devices/${process.env
    .PARTICLE_DEVICE_ID}/dispense`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};
const dbFile = '/tmp/db.json';
const twilioStore = '/tmp/conversation';

module.exports = {
  mapkinsCapacity: mapkinsCapacity,
  numRows: numRows,
  totalMapkins: totalMapkins,
  mapkinsLowCount: mapkinsLowCount,
  requestTimeout: requestTimeout,
  particle: particle,
  dbFile: dbFile,
  twilioStore: twilioStore
};
