const mapkinsPerRow = 10;
const numRows = 4;
const totalMapkins = mapkinsPerRow * numRows;

module.exports = {
  mapkinsPerRow: mapkinsPerRow,
  numRows: numRows,
  totalMapkins: totalMapkins,
  mapkinsLowCount: 15,
  requestTimeout: 30 * 1000,
  particle: {
    url: `https://api.particle.io/v1/devices/${process.env
      .PARTICLE_DEVICE_ID}/dispense`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  dbFile: '/tmp/db.json',
  twilioStore: '/tmp/conversation'
};
