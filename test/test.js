var assert = require('assert');
var BirdSongPlayer = require('../js/birdSongPlayer');
var MockAudioContext = require('../test/mockAudioContext');

describe('Array', function(){
	describe('#indexOf()', function(){
		it('should return -1 when the value is not present', function(){
			assert.equal(-1, [1,2,3].indexOf(5));
			assert.equal(-1, [1,2,3].indexOf(0));
		})
		it('should return >=0 when the value is present', function(){
			assert.equal(0, [1,2,3].indexOf(1));
			assert.equal(2, [1,2,3].indexOf(3));
		})
	})
})

describe('BirdSongPlayer', function() {
	describe('constructor()', function() {
		it('constructor should work', function() {
			var audioContext = new MockAudioContext();
			assert.equal(new BirdSongPlayer(audioContext), null);
		})
	})
})
