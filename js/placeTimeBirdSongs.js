// PlaceTimeBirdSongs
function PlaceTimeBirdSongs() {
	this.position = null;
	this.sightings = [];
	this.sounds = [];
}

// Use navigator.geolocation to find my location; invoke a callback when done.
// use the provided default location when geolocation fails.
// default location should be like { coords: { latitude: 37, longitude: -122 }
PlaceTimeBirdSongs.prototype.setLocation = function(inDefaultLocation, callback) {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(inPosition) {
				this.position = inPosition;
				$('#position').attr('data-lat', inPosition.coords.latitude);
				$('#position').attr('data-long', inPosition.coords.longitude);
				callback(this.position);
			}.bind(this),
			function error() {
				console.log('error during geolocation');
				this.position = inDefaultLocation;
				callback(this.position);
			}.bind(this),
			{
			});
	} else {
		console.log('browser does not support geolocation');
		this.position = inDefaultLocation;
		callback(this.position);
	}
}

PlaceTimeBirdSongs.prototype.chooseRandomSighting = function() {
	return Math.floor(Math.random() * this.sightings.length);
}

PlaceTimeBirdSongs.prototype.getSightings = function(callback) {
	var queryParams = { lat: this.position.coords.latitude, lng: this.position.coords.longitude, fmt: 'json' };
	// var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	var urlString = '/ebird?' + $.param(queryParams);

	// Re-initialize list of sightings, so this method is more or less idempotent
	this.sightings = [];

	console.log(urlString);
	$('#sightings').text('N sightings');


	$.getJSON(urlString, function(data) {
		if (data.length == 0) {
			throw "No sightings found!";
		}

		$('#sightings').text(data.length + ' sightings');

		for (var index in data) {
			this.sightings.push(data[index]);
		}

		callback();
	}.bind(this))
	.fail(function(e) {
		console.log("failure to get sightings");
		console.log(e);
		// TODO: retry?
		$('#sightings').text('error while retrieving sightings');
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
					console.log('xeno canto fail');
					callback(null);
				}
			}.bind(this),
			error: function(xhr, status, error) {
				// TODO: retry?
				console.log('xeno canto fail');
				callback(null);
			}
		});		
	}
}
