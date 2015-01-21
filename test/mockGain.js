// mock AudioContext from Web Audio API

var MockGain = function() {
	console.log('construct MockGain');
}

MockGain.prototype.connect = function(inArg) {
	// console.log('MockGain.connect', inArg);
}

module.exports = MockGain;
