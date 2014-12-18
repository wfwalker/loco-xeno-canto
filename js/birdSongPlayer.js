function getAverageVolume(array) {
	var values = 0;
	var average;

	var length = array.length;

	// get all the frequency amplitudes
	for (var i = 0; i < length; i++) {
		values += array[i];
	}

	average = values / length;
	return average;
}

// BirdSongPlayer
function BirdSongPlayer(audioContext, inCanvasID) {
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

	var volumeMeterCanvas = document.getElementById(inCanvasID);
	var graphicsContext = volumeMeterCanvas.getContext('2d');

	// setup a analyzer
	var analyser = audioContext.createAnalyser();
	this.panner.connect(analyser);
	this.panner.connect(audioContext.destination);

	analyser.smoothingTimeConstant = 0.3;
	analyser.fftSize = 64;

	requestAnimationFrame(function vuMeter() {
		// get the average, bincount is fftsize / 2
		var array =  new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(array);
		var average = getAverageVolume(array);
		average = Math.max(Math.min(average, 125), 5);

		// clear the current state
		graphicsContext.fillStyle = 'rgb(220,220,220)'
		graphicsContext.fillRect(1, 5, 130, 15);

		// set the fill style
		graphicsContext.fillStyle = 'rgb(0,0,0)'

		// create the meters
		graphicsContext.fillRect(1, 5, average, 15);

		requestAnimationFrame(vuMeter);
	});
}

// sets the X,Y,Z position of the Panner to random values between -1 and +1
BirdSongPlayer.prototype.randomizePanner = function() {
	this.panner.setPosition(2 * Math.random() - 1, 2 * Math.random() - 1, 2 * Math.random() - 1);
}

// Sets the playback rate for the current sound to a random value between 0.1 and 1.1
BirdSongPlayer.prototype.randomizePlaybackRate = function(inPlayerSelector) {
	if (this.soundSource) {
		var newRate = 0.1 + Math.random();
		this.soundSource.playbackRate.cancelScheduledValues(gAudioContext.currentTime);
		this.soundSource.playbackRate.linearRampToValueAtTime(newRate, gAudioContext.currentTime + 3);
		$(inPlayerSelector).find('.playbackRate').text((Math.round(100 * newRate) / 100.0) + "x");
	} else {
		console.log('cannot randomize, no sound source');
	}
}

// Creates a new soundSource using the given buffer
// preserves the old playback rate, if applicable
BirdSongPlayer.prototype.setSourceFromBuffer = function(inBuffer) {
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
	this.soundSource.playbackRate.setValueAtTime(oldPlaybackRateValue, gAudioContext.currentTime);

	// set gain to zero and then ramp up. 
	this.gain.gain.cancelScheduledValues(gAudioContext.currentTime);
	this.gain.gain.setValueAtTime(0.0, gAudioContext.currentTime);
	this.gain.gain.linearRampToValueAtTime(0.99, gAudioContext.currentTime + 10);

	// start playing immediately in a loop	 
	this.soundSource.loop = true;
	this.soundSource.start(0);	
}

// Reverses the audio buffer so that the sound plays backwards
BirdSongPlayer.prototype.reversePlayback = function() {
	console.log('reversePlayback');

	var oldData = this.soundSource.buffer.getChannelData(0);
	var normalData = Array.prototype.slice.call( oldData );
	Array.prototype.reverse.call(normalData);	

	var newBuffer = gAudioContext.createBuffer(1, this.soundSource.buffer.length, this.soundSource.buffer.sampleRate);
	var newData = newBuffer.getChannelData(0);

	for (i = 0; i < newBuffer.length; i++) {
		newData[i] = normalData[i];
	}	

	this.setSourceFromBuffer(newBuffer);

	console.log('DONE reversePlayback');
}

BirdSongPlayer.prototype.setBufferFromURL = function(inSoundDataURL, inPlayerSelector) {
	console.log('setBufferFromURL ' + inSoundDataURL);

	var mp3Request = new XMLHttpRequest();

	mp3Request.onerror = function(e) {
		$(inPlayerSelector).find('.status').text('error downloading');		
	};

	mp3Request.onprogress = function(e) {
		$(inPlayerSelector).find('.status').text('downloading ' + Math.round(100 * e.loaded / e.total) + '%');
	};

	mp3Request.onload = function(e) {
		$(inPlayerSelector).find('.status').text('decoding');

	    gAudioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {
	    	this.setSourceFromBuffer(decodedBuffer);
			$(inPlayerSelector).find('.status').text(Math.round(decodedBuffer.duration) + 's');
			$(inPlayerSelector).find('.recordingLocation').text(this.recording.loc);
			$(inPlayerSelector).find('.recordist').text(this.recording.rec);

			var licenseIcon = '';

			if (this.recording.lic.indexOf('by-nc-nd') > 0) {
				licenseIcon = 'http://i.creativecommons.org/l/by-nc-nd/3.0/us/88x31.png';
			} else if (this.recording.lic.indexOf('by-nc-sa') > 0) {
				licenseIcon = 'http://i.creativecommons.org/l/by-nc-sa/3.0/us/88x31.png';
			}

			$(inPlayerSelector).find('.license').attr('src', licenseIcon);

		}.bind(this));
	}.bind(this);

	mp3Request.open("GET", inSoundDataURL, true);
	mp3Request.responseType = 'arraybuffer';
	mp3Request.send();
}

BirdSongPlayer.prototype.chooseRandomRecording = function(inPlayerSelector) {
	if (this.soundsForSighting == null || this.soundsForSighting.recordings.length == 0) {
		$(inPlayerSelector).find('.status').text('retrying');
		console.log('FAILED loading recording for, retrying');
		this.chooseSightingAndPlayRandomSound(inPlayerSelector);
	} else {
		this.recordingIndex = Math.floor(Math.random() * this.soundsForSighting.recordings.length);
		this.recording = this.soundsForSighting.recordings[this.recordingIndex];

		// rewrite URL's from xeno-canto JSON, route through my own server due to missing CORS
		var soundURL = this.recording.file.replace('http://www.xeno-canto.org','/soundfile');

		$(inPlayerSelector).find('.status').text('downloading #' + this.recordingIndex);
		this.setBufferFromURL(soundURL, inPlayerSelector);
	}
}

BirdSongPlayer.prototype.initializeFromSavedSession = function(inSighting, inRecording, inPlayerSelector) {
	this.sightingIndex = 0;
	this.sighting = inSighting;
	this.soundsForSighting = {};
	this.soundsForSighting.recordings = [inRecording];
	this.chooseRandomRecording(inPlayerSelector);
}

BirdSongPlayer.prototype.chooseSightingAndPlayRandomSound = function(inPlayerSelector) {
	this.sightingIndex = gBirds.chooseRandomSighting();
	this.sighting = gBirds.sightings[this.sightingIndex];

	console.log('chooseSightingAndPlayRandomSound random sighting ' + this.sightingIndex);
	console.log(this.sighting);

	$(inPlayerSelector).find('.speciesName').text(this.sightingIndex + '. ' + this.sighting.comName);
	$(inPlayerSelector).find('.locationName').text(this.sighting.locName);
	$(inPlayerSelector).find('.status').text('choosing');

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSightingIndex(this.sightingIndex, function(soundsData) {
		if (soundsData == null) {
			console.log('NO SOUNDS');
			$(inPlayerSelector).find('.status').text('retrying');
			this.chooseSightingAndPlayRandomSound(inPlayerSelector);
		} else {
			this.soundsForSighting = soundsData;
			this.chooseRandomRecording(inPlayerSelector);
		}
	}.bind(this));	
}


