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
	var myself = this;
	
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(inPosition) {
				myself.position = inPosition;
				callback(myself.position);
			},
			function error() {
				console.log('error');
				myself.position = inDefaultLocation;
				callback(myself.position);
			},
			{
			});
	} else {
		console.log('browser does not support geolocation');
		myself.position = inDefaultLocation;
		callback(myself.position);
	}
}

PlaceTimeBirdSongs.prototype.chooseRandomSighting = function() {
	return Math.floor(Math.random() * this.sightings.length);
}

PlaceTimeBirdSongs.prototype.getSightings = function(callback) {
	var queryParams = { lat: this.position.coords.latitude, lng: this.position.coords.longitude, fmt: 'json' };
	var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	var myself = this;
	console.log(urlString);

	$.getJSON(urlString, function(data) {
		$('#sightings').text(data.length + ' sightings');

		for (var index in data) {
			myself.sightings.push(data[index]);
		}

		callback();
	});
}

PlaceTimeBirdSongs.prototype.getSoundsForSightingIndex = function(inID, callback) {
	if (this.sounds[inID]) {
		callback(this.sounds[inID]);		
	} else {
		var latinName = this.sightings[inID].sciName;
		var urlString = '/sounds/' + latinName.replace(' ', '+');
		console.log('seeking sound data ' + urlString);
		var myself = this;

		$.ajax({
			url: urlString,
			dataType: 'json',
			success: function(data) {
				if (data.recordings) {
					myself.sounds[inID] = data;
					callback(myself.sounds[inID]); 
				} else {
					console.log('xeno canto fail');
					callback(null);
				}
			},
			error: function(xhr, status, error) {
				console.log('xeno canto fail');
				callback(null);
			}
		});		
	}
}
