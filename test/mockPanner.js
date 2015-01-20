// mock AudioContext from Web Audio API

var MockPanner = function() {
	console.log('construct MockPanner');
}

MockPanner.prototype.setOrientation = function() {
	console.log('MockPanner.setOrientation');
}

MockPanner.prototype.setVelocity = function() {
	console.log('MockPanner.setVelocity');
}

MockPanner.prototype.setPosition = function() {
	console.log('MockPanner.setPosition');
}

module.exports = MockPanner;
