// BirdSongPlayer
function BirdSongPlayer(audioContext) {
	this.soundSource = null;

	this.sighting = null;
	this.sightingIndex = null;
	this.soundsForSighting = null;

	this.recordingIndex = null;
	this.recording = null;

	this.gain = audioContext.createGain(); 

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

// mutes or unmutes the sound by toggling the gain between 0 and 1
BirdSongPlayer.prototype.toggleMute = function() {
	if (this.gain.gain.value > 0) {
		console.log('muting');
		this.gain.gain.value = 0;
	} else {
		console.log('unmuting');
		this.gain.gain.value = 1;
	}
}

// sets the X,Y,Z position of the Panner to random values between -1 and +1
BirdSongPlayer.prototype.randomizePanner = function() {
	this.panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
}

// Sets the playback rate for the current sound to a random value between 0.1 and 1.1
BirdSongPlayer.prototype.randomizePlaybackRate = function() {
	if (this.soundSource) {
		this.soundSource.playbackRate.value = 0.1 + Math.random();		
	} else {
		console.log('cannot randomize, no sound source');
	}
}

BirdSongPlayer.prototype.setSourceFromBuffer = function(inBuffer) {
	console.log('setSourceFromBuffer');
	var oldPlaybackRateValue = 1;

	if (this.soundSource) {
		oldPlaybackRateValue = this.soundSource.playbackRate.value;
		this.soundSource.stop(0);
		this.soundSource = null;
	}

	this.soundSource = gAudioContext.createBufferSource();
	this.soundSource.connect(this.gain);
	this.soundSource.buffer = inBuffer;
	// restore old playback rate value
	this.soundSource.playbackRate.value = oldPlaybackRateValue;
	// start playing immediately in a loop	    	
	this.soundSource.loop = true;
	this.soundSource.start();	
}

BirdSongPlayer.prototype.reversePlayback = function() {
	console.log('reversePlayback');

	var oldData = this.soundSource.buffer.getChannelData(0);
	console.log(oldData);
	var normalData = Array.prototype.slice.call( oldData );
	Array.prototype.reverse.call(normalData);	
	console.log(normalData);

	var newBuffer = gAudioContext.createBuffer(1, this.soundSource.buffer.length, this.soundSource.buffer.sampleRate);
	var newData = newBuffer.getChannelData(0);

	for (i = 0; i < newBuffer.length; i++) {
		newData[i] = normalData[i];
	}	

	this.setSourceFromBuffer(newBuffer);

	console.log(this.soundSource.buffer.getChannelData(0));
	console.log('DONE reversePlayback');
}

BirdSongPlayer.prototype.setBufferFromURL = function(inSoundDataURL, inStatusElement) {
	var myself = this;

	console.log('setBufferFromURL ' + inSoundDataURL);

	var mp3Request = new XMLHttpRequest();

	mp3Request.onload = function(e) {
		inStatusElement.text('decoding');
		console.log(mp3Request.response);

	    gAudioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {
	    	myself.setSourceFromBuffer(decodedBuffer);
			inStatusElement.text(Math.round(decodedBuffer.duration) + 's from ' + myself.recording.loc);
		});
	};

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	mp3Request.send();
}

BirdSongPlayer.prototype.chooseRandomRecording = function(inSightingElement, inStatusElement, inLabelElement) {
	if (this.soundsForSighting == null || this.soundsForSighting.recordings.length == 0) {
		inStatusElement.text('retrying');
		console.log('FAILED loading recording for, retrying');
		this.chooseSightingAndPlayRandomSound(inSightingElement, inStatusElement, inLabelElement);
	} else {
		this.recordingIndex = Math.floor(Math.random() * this.soundsForSighting.recordings.length);
		this.recording = this.soundsForSighting.recordings[this.recordingIndex];

		console.log(this.recording);
		inLabelElement.text(this.recording.en);

		// rewrite URL's from xeno-canto JSON, route through my own server due to missing CORS
		var soundURL = this.recording.file.replace('http://www.xeno-canto.org','/soundfile');
		console.log(soundURL);

		inStatusElement.text('downloading #' + this.recordingIndex);
		this.setBufferFromURL(soundURL, inStatusElement)
	}
}

BirdSongPlayer.prototype.chooseSightingAndPlayRandomSound = function(inSightingElement, inStatusElement, inLabelElement) {
	this.sightingIndex = gBirds.chooseRandomSighting();
	this.sighting = gBirds.sightings[this.sightingIndex];

	console.log('chooseSightingAndPlayRandomSound random sighting ' + this.sightingIndex);
	console.log(this.sighting);

	inSightingElement.text(this.sighting.locName);

	var myself = this;

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSightingIndex(this.sightingIndex, function(soundsData) {
		if (soundsData == null) {
			console.log('NO SOUNDS');
			inStatusElement.text('retrying');
			myself.chooseSightingAndPlayRandomSound(inSightingElement, inStatusElement, inLabelElement);
		} else {
			myself.soundsForSighting = soundsData;
			inLabelElement.text(myself.sighting.comName);
			myself.chooseRandomRecording(inSightingElement, inStatusElement, inLabelElement);
		}
	});	
}


