// mock AudioContext from Web Audio API
MockPanner = require('../test/mockPanner');
MockGain = require('../test/mockGain');

var MockAudioContext = function() {
	// console.log('construct MockAudioContext');
}

MockAudioContext.prototype.createGain = function() {
	// console.log('MockAudioContext.createGain');
	return new MockGain();
}

MockAudioContext.prototype.createPanner = function() {
	// console.log('MockAudioContext.createPanner');
	return new MockPanner();
}

MockAudioContext.prototype.createAnalyser = function() {
	// console.log('MockAudioContext.createAnalyzer');
	return 'analyzer';
}

module.exports = MockAudioContext;
