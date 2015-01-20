// mock AudioContext from Web Audio API
MockPanner = require('../test/mockPanner');

var MockAudioContext = function() {
	console.log('construct MockAudioContext');
}

MockAudioContext.prototype.createGain = function() {
	console.log('MockAudioContext.createGain');
	return 'gain';
}

MockAudioContext.prototype.createPanner = function() {
	console.log('MockAudioContext.createPanner');
	return new MockPanner();
}

module.exports = MockAudioContext;
