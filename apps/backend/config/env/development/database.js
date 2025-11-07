const path = require('path');

module.exports = () => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.join(__dirname, '..', '..', '..', 'data', 'dev.db'),
    },
    useNullAsDefault: true,
  },
});
