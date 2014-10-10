// BirdSongPlayer
function BirdSongPlayer(audioContext) {
	console.log('BirdSongPlayer');
	this.soundSource = audioContext.createBufferSource();
	this.gain = audioContext.createGain(); 

	this.gain.value = 0.99;
	this.soundSource.connect(this.gain);

	// see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
	this.panner = audioContext.createPanner();
	this.panner.panningModel = 'HRTF';
	this.panner.distanceModel = 'inverse';
	this.panner.refDistance = 1;
	this.panner.maxDistance = 10000;
	this.panner.rolloffFactor = 1;
	this.panner.coneInnerAngle = 360;
	this.panner.coneOuterAngle = 0;
	this.panner.coneOuterGain = 0;
	this.panner.setOrientation(1,0,0);
	this.panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
	this.panner.setVelocity(0, 0, 0);

	this.gain.connect(this.panner);
	this.panner.connect(audioContext.destination);
	console.log('END BirdSongPlayer');
}

BirdSongPlayer.prototype.randomizePanner = function() {
	this.panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
}

BirdSongPlayer.prototype.randomizePlaybackRate = function() {
	this.soundSource.playbackRate.value = 0.2 + Math.random();		
}