// BirdSongPlayer
function BirdSongPlayer(audioContext) {
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
}

BirdSongPlayer.prototype.randomizePanner = function() {
	this.panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
}

BirdSongPlayer.prototype.randomizePlaybackRate = function() {
	this.soundSource.playbackRate.value = 0.2 + Math.random();		
}

BirdSongPlayer.prototype.setBufferFromURL = function(inSoundDataURL, inStatusElement) {
	var myself = this;

	console.log('setBufferFromURL ' + inSoundDataURL);

	var mp3Request = new XMLHttpRequest();

	mp3Request.onload = function(e) {
		inStatusElement.text('decoding');
		console.log(mp3Request.response);

	    audioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {
	    	// got data! update status
	    	console.log('inside decodeAudioData');
	    	console.log(decodedBuffer);

			// start playing immediately in a loop	    	
			myself.soundSource.buffer = decodedBuffer;
			myself.soundSource.loop = true;
			inStatusElement.text('playing ' + Math.round(decodedBuffer.duration) + 's');
			myself.soundSource.start(0);
		});
	};

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	inStatusElement.text('downloading');
	mp3Request.send();
}

