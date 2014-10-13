// BirdSongPlayer
function BirdSongPlayer(audioContext) {
	this.soundSource = null;
	this.gain = audioContext.createGain(); 

	this.gain.value = 0.99;

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
	this.soundSource.playbackRate.value = 0.1 + Math.random();		
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
			inStatusElement.text('playing ' + Math.round(decodedBuffer.duration) + 's');
		});
	};

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	inStatusElement.text('downloading');
	mp3Request.send();
}

BirdSongPlayer.prototype.chooseRandomRecording = function(soundsData, inStatusElement, inLabelElement) {
	if (soundsData == null || soundsData.recordings.length == 0) {
		$('#status' + playerIndex).text('retrying');
		console.log('FAILED loading recording for, retrying');
		this.chooseSightingAndPlayRandomSound();
	} else {
		var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);
		var currentSound = soundsData.recordings[randomRecordingID];

		console.log(currentSound);
		inLabelElement.text(currentSound.en);

		// rewrite URL's from xeno-canto JSON, route through my own server due to missing CORS
		var soundURL = currentSound.file.replace('http://www.xeno-canto.org','/soundfile');
		console.log(soundURL);

		this.setBufferFromURL(soundURL, inStatusElement)
	}
}

BirdSongPlayer.prototype.chooseSightingAndPlayRandomSound = function(inStatusElement, inLabelElement) {
	var myself = this;
	var sighting = gBirds.chooseRandomSighting();
	console.log('chooseSightingAndPlayRandomSound random sighting ' + sighting);
	console.log(gBirds.sightings[sighting]);

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSighting(sighting, function(soundsData) {
		if (soundsData == null) {
			console.log('NO SOUNDS');
			inStatusElement.text('retrying');
			myself.chooseSightingAndPlayRandomSound(inStatusElement);
		} else {
			inLabelElement.text(gBirds.sightings[sighting].comName);
			myself.chooseRandomRecording(soundsData, inStatusElement, inLabelElement);
		}
	});	
}


