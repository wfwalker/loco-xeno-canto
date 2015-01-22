// PlaceTimeBirdSongs
function PlaceTimeBirdSongs() {
	this.position = null;
	this.description = '';
	this.sightings = [];
	this.photos = [];
	this.sounds = [];
	this.distance = 15;
	this.days = 7;
}

PlaceTimeBirdSongs.prototype.chooseRandomSighting = function() {
	return Math.floor(Math.random() * this.sightings.length);
}

PlaceTimeBirdSongs.prototype.getSightings = function(callback) {
	// initialize query parameters and sightings query URL
	var queryParams = {
		lat: this.position.coords.latitude,
		lng: this.position.coords.longitude,
		fmt: 'json',
		dist: this.distance,
		back: this.days
	};

	var urlString = '/ebird?' + $.param(queryParams);

	// Re-initialize list of sightings, so this method is more or less idempotent
	this.sightings = [];

	console.log(urlString);
	$('#sightings').text('');

	$.getJSON(urlString, function(data) {
		if (data.length == 0) {
			callback(false, 'No sightings found');
		} else {
			$('#sightings').text(data.length + ' sightings from ' + this.description);

			for (var index in data) {
				this.sightings.push(data[index]);
			}

			callback(true, data.length);			
		}
	}.bind(this))
	.fail(function(jqXHR, textStatus, errorThrown) {
		console.log("failure to get sightings");
		console.log(jqXHR.responseText);
		callback(false, 'Cannot reach server');
	});
}

PlaceTimeBirdSongs.prototype.getSoundsForSightingIndex = function(inID, callback) {
	if (this.sounds[inID]) {
		callback(this.sounds[inID]);		
	} else {
		var latinName = this.sightings[inID].sciName;
		var urlString = '/sounds/' + latinName.replace(' ', '+');
		console.log('seeking sound data ' + urlString);

		$.ajax({
			url: urlString,
			dataType: 'json',
			success: function(data) {
				if (data.recordings) {
					this.sounds[inID] = data;
					callback(this.sounds[inID]); 
				} else {
					// TODO: retry?
					// TODO: can't tell inability to reach server from missing sounds
					console.log('xeno canto fail');
					callback(null);
				}
			}.bind(this),
			error: function(xhr, status, error) {
				// TODO: retry?
				console.log('xeno canto fail');
				// TODO: can't tell inability to reach server from missing sounds
				callback(null);
			}
		});		
	}
}

PlaceTimeBirdSongs.prototype.getPhotosForSightingIndex = function(inID, callback) {
	if (this.sounds[inID]) {
		callback(this.sounds[inID]);		
	} else {
		var latinName = this.sightings[inID].sciName;
		var urlString = '/photos/' + latinName.replace(' ', '%20');
		console.log('seeking photos data ' + urlString);

		$.ajax({
			url: urlString,
			dataType: 'json',
			success: function(data) {
				console.log('getPhotosForSightingIndex success handler');
				console.log(data);
				if (data[0].photos) {
					this.photos[inID] = data[0].photos;
					callback(this.photos[inID]); 
				} else {
					// TODO: retry?
					// TODO: can't tell inability to reach server from missing photos
					console.log('birdwalker photos fail');
					callback(null);
				}
			}.bind(this),
			error: function(xhr, status, error) {
				// TODO: retry?
				console.log('birdwalker photos fail');
				// TODO: can't tell inability to reach server from missing photos
				callback(null);
			}
		});		
	}
}

if (typeof module != 'undefined') {
	module.exports = PlaceTimeBirdSongs;
}
