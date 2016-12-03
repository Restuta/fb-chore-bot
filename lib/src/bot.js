'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _claudiaBotBuilder = require('claudia-bot-builder');

var _claudiaBotBuilder2 = _interopRequireDefault(_claudiaBotBuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _claudiaBotBuilder2.default)(function (message) {
  console.info('got msg: ' + message.text);

  return 'Got you! You wrote ' + message.text + ' and extra 🦄';
});
module.exports = exports['default'];