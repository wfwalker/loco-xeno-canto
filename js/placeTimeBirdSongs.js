// PlaceTimeBirdSongs
function PlaceTimeBirdSongs() {
	this.position = null;
	this.sightings = [];
	this.sounds = [];
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
		console.log('got data');

		for (var index in data) {
			myself.sightings.push(data[index]);
		}

		callback();
	});
}

PlaceTimeBirdSongs.prototype.getSoundsForSighting = function(inID, callback) {
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
