var request = require('request');

// Computes the average value from the FFT array
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

// BirdSongPlayer constructor
var BirdSongPlayer = function (inAudioContext, inPlayerSelector) {
	this.playerSelector = inPlayerSelector;
	this.audioContext = inAudioContext;
	this.soundSource = null;
	this.playForward = true;

	this.randomizePlaybackRate();

	this.sighting = null;
	this.sightingIndex = null;
	this.soundsForSighting = null;

	this.recordingIndex = null;
	this.recording = null;

	this.lastActionTime = this.audioContext.currentTime;

	this.gain = this.audioContext.createGain(); 

	// see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
	// this.panner = this.audioContext.createPanner();
	// this.panner.panningModel = 'HRTF';
	// this.panner.distanceModel = 'inverse';
	// this.panner.refDistance = 1;
	// this.panner.maxDistance = 10000; /* NOTE: probably not in use */
	// this.panner.rolloffFactor = 1;
	// this.panner.coneInnerAngle = 360; /* Note using directional sound attenuation */
	// this.panner.coneOuterAngle = 0;
	// this.panner.coneOuterGain = 0;
	// this.panner.setOrientation(1,0,0);
	// this.panner.setVelocity(0, 0, 0);
	// this.randomizePanner();
	// this.gain.connect(this.panner);
	// // setup a analyser
	// this.analyser = this.audioContext.createAnalyser();
	// this.panner.connect(this.analyser);
	// this.panner.connect(this.audioContext.destination);
	// this.analyser.smoothingTimeConstant = 0.3;
	// this.analyser.fftSize = 64;

	this.gain.connect(this.audioContext.destination);
}

BirdSongPlayer.prototype.initializeVUMeter = function() {
	// set up VU meter
	var myAnalyser = this.analyser;
	var volumeMeterCanvas = $(this.playerSelector).find('canvas')[0];
	var graphicsContext = volumeMeterCanvas.getContext('2d');
	var previousVolume = 0;
	var player = this;

	requestAnimationFrame(function vuMeter() {
		// get the average, bincount is fftsize / 2
		var array =  new Uint8Array(myAnalyser.frequencyBinCount);
		myAnalyser.getByteFrequencyData(array);
		var average = getAverageVolume(array);
		average = Math.max(Math.min(average, 128), 0);

		if (player.playForward) {
			// draw the rightmost column in black right before shifting
			graphicsContext.fillStyle = 'rgb(0,0,0)'
			graphicsContext.fillRect(258, 128 - previousVolume, 2, previousVolume);

			// shift the drawing over one pixel to the left
			graphicsContext.drawImage(volumeMeterCanvas, -1, 0);

			// clear the rightmost column state
			graphicsContext.fillStyle = 'rgb(245,245,245)'
			graphicsContext.fillRect(259, 0, 1, 130);

			// set the fill style for the rightmost column (matches bootstrap button)
			graphicsContext.fillStyle = '#5BC0DE'
			graphicsContext.fillRect(258, 128 - average, 2, average);
		} else {
			// draw the LEFTMOST column in black right before shifting
			graphicsContext.fillStyle = 'rgb(0,0,0)'
			graphicsContext.fillRect(0, 128 - previousVolume, 2, previousVolume);

			// shift the drawing over one pixel to the right
			graphicsContext.drawImage(volumeMeterCanvas, 1, 0);

			// clear the LEFTMOST column state
			graphicsContext.fillStyle = 'rgb(245,245,245)'
			graphicsContext.fillRect(0, 0, 1, 130);

			// set the fill style for the leftmost column (matches bootstrap button)
			graphicsContext.fillStyle = '#5BC0DE'
			graphicsContext.fillRect(0, 128 - average, 2, average);
		}

		requestAnimationFrame(vuMeter);
		previousVolume = average;
	});
}

// reset the last action time
BirdSongPlayer.prototype.resetLastActionTime = function() {
	this.lastActionTime = this.audioContext.currentTime;
}

BirdSongPlayer.prototype.showPanPosition = function() {
	$(this.playerSelector).find('.panPosition').text((this.panPosition.x > 0 ? 'L' : 'R') + Math.abs(Math.round(10 * this.panPosition.x) / 10.0));	
}

// sets the X,Y,Z position of the Panner to random values between -1 and +1
BirdSongPlayer.prototype.randomizePanner = function() {
	this.resetLastActionTime();
	// NOTE: x = -1 is LEFT
	this.panPosition = { x: 2 * Math.random() - 1, y: 2 * Math.random() - 1, z: 2 * Math.random() - 1}
	this.panner.setPosition( this.panPosition.x, this.panPosition.y, this.panPosition.z);
}

BirdSongPlayer.prototype.showPlaybackRate = function() {
	$(this.playerSelector).find('.playbackRate').text((Math.round(10 * this.playbackRate) / 10.0) + "x");
}

// Sets the playback rate for the current sound to a random value between 0.1 and 1.1
BirdSongPlayer.prototype.randomizePlaybackRate = function() {
	console.log('randomizePlaybackRate');
	this.resetLastActionTime();
	this.playbackRate = 0.1 + Math.random();

	if (this.soundSource) {
		this.soundSource.playbackRate.cancelScheduledValues(this.audioContext.currentTime);
		this.soundSource.playbackRate.linearRampToValueAtTime(this.playbackRate, this.audioContext.currentTime + 3);
	} else {
		console.log('cannot implement yet, no sound source');
	}
}

// Creates a new soundSource using the given buffer
// preserves the old playback rate, if applicable
BirdSongPlayer.prototype.setSourceFromBuffer = function(inBuffer) {
	if (this.soundSource) {
		this.soundSource.stop(0);
		this.soundSource = null;
	}

	this.soundSource = this.audioContext.createBufferSource();
	this.soundSource.connect(this.gain);
	this.soundSource.buffer = inBuffer;

	// restore old playback rate value
	console.log('restore playbackRate to ' + this.playbackRate);
	this.soundSource.playbackRate.setValueAtTime(this.playbackRate, this.audioContext.currentTime);

	// set gain to zero and then ramp up. 
	// this.gain.gain.cancelScheduledValues(this.audioContext.currentTime);
	this.gain.gain.setValueAtTime(0.0, this.audioContext.currentTime);
	this.gain.gain.linearRampToValueAtTime(0.99, this.audioContext.currentTime + 10);

	// start playing immediately in a loop	 
	this.soundSource.loop = true;
	this.soundSource.start(0);	
	// $('#setupStatus').text('Playing soundscape based on');
}

// Reverses the audio buffer so that the sound plays backwards
BirdSongPlayer.prototype.reversePlayback = function() {
	console.log('reversePlayback');
	this.resetLastActionTime();
	this.playForward = ! this.playForward;

	var oldData = this.soundSource.buffer.getChannelData(0);
	var normalData = Array.prototype.slice.call( oldData );
	Array.prototype.reverse.call(normalData);	

	var newBuffer = this.audioContext.createBuffer(1, this.soundSource.buffer.length, this.soundSource.buffer.sampleRate);
	var newData = newBuffer.getChannelData(0);

	for (i = 0; i < newBuffer.length; i++) {
		newData[i] = normalData[i];
	}	

	this.setSourceFromBuffer(newBuffer);
	console.log('DONE reversePlayback');
}

BirdSongPlayer.prototype.setBufferFromURL = function(inSoundDataURL) {
	console.log('setBufferFromURL', 'http://birdwalker.com:9090' + inSoundDataURL);

	request({ url: 'http://birdwalker.com:9090' + inSoundDataURL, encoding: null }, function (error, response, body) {
		console.log('got mp3', typeof body);
	    this.audioContext.decodeAudioData(body, function(decodedBuffer) {
	    	this.setSourceFromBuffer(decodedBuffer);
		}.bind(this));
	}.bind(this));

	// var mp3Request = new XMLHttpRequest();

	// mp3Request.onerror = function(e) {
	// 	$(this.playerSelector).find('.status').text('error downloading');		
	// }.bind(this);

	// mp3Request.onprogress = function(e) {
	// 	$(this.playerSelector).find('.status').text(Math.round(100 * e.loaded / e.total) + '%');
	// }.bind(this);

	// mp3Request.onload = function(e) {
	// 	$(this.playerSelector).find('.status').text('...');

	//     this.audioContext.decodeAudioData(mp3Request.response, function(decodedBuffer) {
	//     	this.setSourceFromBuffer(decodedBuffer);
	// 		// $(this.playerSelector).find('.status').text(Math.round(decodedBuffer.duration) + 's');
	// 		// $(this.playerSelector).find('.recordingLocation').text(this.recording.loc);
	// 		// $(this.playerSelector).find('.recordist').text(this.recording.rec);
	// 		// this.showPlaybackRate();
	// 		// $(this.playerSelector).find('.nextRecording').button('reset');
	// 		// TODO: don't enable nextRecording or nextSighting button if this is a saved session!
	// 		// $(this.playerSelector).find('button').prop('disabled', false);

	// 		// var licenseIcon = 'http://i.creativecommons.org/l/by-nc-nd/3.0/us/88x31.png';

	// 		// if (this.recording.lic.indexOf('by-nc-nd') > 0) {
	// 		// 	licenseIcon = 'http://i.creativecommons.org/l/by-nc-nd/3.0/us/88x31.png';
	// 		// } else if (this.recording.lic.indexOf('by-nc-sa') > 0) {
	// 		// 	licenseIcon = 'http://i.creativecommons.org/l/by-nc-sa/3.0/us/88x31.png';
	// 		// } else {
	// 		// 	console.log('LICENSE NOT RECOGNIZED ' + this.recording.lic);
	// 		// }

	// 		// $(this.playerSelector).find('.license').attr('src', licenseIcon);

	// 	}.bind(this));
	// }.bind(this);

	// mp3Request.open("GET", inSoundDataURL, true);
	// mp3Request.responseType = 'arraybuffer';
	// mp3Request.send();
	// $(this.playerSelector).find('.panel-body').collapse('show');
}

BirdSongPlayer.prototype.chooseRandomRecording = function() {
	console.log('chooseRandomRecording', this.soundsForSighting.recordings.length);
	// $(this.playerSelector).find('button').prop('disabled', true);
	this.resetLastActionTime();

	// $('#setupStatus').text('Retrieving bird recordings based on');
	// $(this.playerSelector).find('.nextRecording').button('loading');

	if (this.soundsForSighting == null || this.soundsForSighting.recordings.length == 0) {
		// $(this.playerSelector).find('.status').text('retrying');
		console.log('FAILED loading recording, retrying', this.soundsForSighting);
		this.chooseSightingAndPlayRandomSound(this.playerSelector);
	} else {
		this.recordingIndex = Math.floor(Math.random() * this.soundsForSighting.recordings.length);
		this.recording = this.soundsForSighting.recordings[this.recordingIndex];

		// rewrite URL's from xeno-canto JSON, route through my own server due to missing CORS
		var soundURL = this.recording.file.replace('http://www.xeno-canto.org','/soundfile');

		// $(this.playerSelector).find('.status').text('...');
		this.setBufferFromURL(soundURL);
	}
}

BirdSongPlayer.prototype.initializeFromSavedSession = function(inSavedData) {
	console.log('restoring ' + this.playerSelector);
	console.log(inSavedData);
	this.sightingIndex = 0;
	this.sighting = inSavedData.sighting;

	// $(this.playerSelector).find('.speciesName').text(this.sighting.comName);
	// $(this.playerSelector).find('.locationName').text(this.sighting.locName);

	this.playbackRate = parseFloat(inSavedData.playbackRate);
	console.log('restored playbackRate ' + this.playbackRate);
	this.showPlaybackRate();

	this.soundsForSighting = {};
	this.soundsForSighting.recordings = [inSavedData.recording];
	this.chooseRandomRecording(this.playerSelector);

	// $(this.playerSelector).find('.nextSighting').remove();
	// $(this.playerSelector).find('.nextRecording').remove();

	// $(this.playerSelector).collapse('show');
}

BirdSongPlayer.prototype.saveData = function() {
	return {
		recording: this.recording,
		sighting: this.sighting,
		playbackRate: this.playbackRate
	};
}

BirdSongPlayer.prototype.chooseSightingAndPlayRandomSound = function(gBirds) {
	// $(this.playerSelector).find('.nextSighting').button('loading');
	// $(this.playerSelector).find('button').prop('disabled', true);
	// $(this.playerSelector).collapse('show');

	this.resetLastActionTime();
	this.sightingIndex = gBirds.chooseRandomSighting();
	// TODO, if this is a saved session, gBirds.sightings will be EMPTY
	this.sighting = gBirds.sightings[this.sightingIndex];

	console.log('chooseSightingAndPlayRandomSound random sighting ' + this.sightingIndex);

	// TODO: duplicated from initialized from saved setting
	// $(this.playerSelector).find('.speciesName').text(this.sighting.comName);
	// $(this.playerSelector).find('.locationName').text(this.sighting.locName);
	// $(this.playerSelector).find('.status').text('...');

	// get photos for this species
	// gBirds.getPhotosForSightingIndex(this.sightingIndex, function(photosData) {
	// 	console.log('PHOTOS!');
	// 	console.log(photosData);
	// 	// http://www.birdwalker.com/images/photo/2014-07-02-clanut-DM6C1132.jpg
	// 	if (photosData && photosData[0]) {
	// 		console.log('APPEND');
	// 		$('#photos').append($('<img height="50px" />').attr('src', 'http://birdwalker.com/images/photo/' + photosData[0].image_filename));
	// 	} else {
	// 		console.log('DID NOT APPEND');
	// 	}
	// });

	// get sounds for this species if needed, and pick one at random
	gBirds.getSoundsForSightingIndex(this.sightingIndex, function(soundsData) {
		if (soundsData == null) {
			// TODO can't tell missing sounds from inability to contact server
			console.log('NO SOUNDS');
			// $(this.playerSelector).find('.status').text('retrying');
			this.chooseSightingAndPlayRandomSound(this.playerSelector);
		} else {
			console.log('got recording list');
			this.soundsForSighting = soundsData;
			// $(this.playerSelector).find('.nextSighting').button('reset');
			this.chooseRandomRecording(this.playerSelector);
		}
	}.bind(this));
}

BirdSongPlayer.prototype.initializeControls = function() {
	var player = this;

	$(this.playerSelector).find('.nextSighting').click(function(e) {
		player.chooseSightingAndPlayRandomSound();
	});

	$(this.playerSelector).find('.nextRecording').click(function(e) {
		player.chooseRandomRecording();
	});

	$(this.playerSelector).find('.reverse').click(function(e) {
		player.reversePlayback();
	});

	$(this.playerSelector).find('.pan').click(function(e) {
		player.randomizePanner();
		player.showPanPosition();
	});

	$(this.playerSelector).find('.rate').click(function(e) {
		player.randomizePlaybackRate();
		player.showPlaybackRate();
	});

	$(this.playerSelector).find('button').prop('disabled', true);

	this.showPlaybackRate();
	this.showPanPosition();
}

if (typeof module != 'undefined') {
	module.exports = BirdSongPlayer;
}

if (typeof exports != 'undefined') {
	exports.BirdSongPlayer = BirdSongPlayer;
}
