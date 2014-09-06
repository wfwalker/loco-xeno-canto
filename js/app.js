// app.js

var myPosition;
var sightings = [];
var sounds = [];
var chosen = 0;

// http://www.movable-type.co.uk/scripts/latlong.html

function degreesToRadians(inDegrees) {
	return 2 * 3.14159 * inDegrees / 360.0;
}

function haversine(lat1, lon1, lat2, lon2) {
	var R = 6371; // km
	var φ1 = degreesToRadians(lat1);
	var φ2 = degreesToRadians(lat2);
	var Δφ = degreesToRadians(lat2-lat1);
	var Δλ = degreesToRadians(lon2-lon1);

	var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
	        Math.cos(φ1) * Math.cos(φ2) *
	        Math.sin(Δλ/2) * Math.sin(Δλ/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;

	return d;
}

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(position) {
				myPosition = position;
				$('#location').append('<div>' + position.coords.latitude + ',' + position.coords.longitude + '</div>');
				getRecentNearbySightings(position.coords.latitude, position.coords.longitude);
			},
			function error() {
				console.log('error');
				getRecentNearbySightings(37, -122);
			},
			{
			});
	} else {
		$('#location').append('<div>37, -122</div>')
		getRecentNearbySightings(37, -122);
	}
}

function chooseRandomRecording(inID) {
	$('#audio').empty();

	if (sounds[inID] && sounds[inID].recordings) {
		var soundsData = sounds[inID];
		var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);

		console.log(soundsData.recordings[randomRecordingID]);
		var kmDistance = haversine(myPosition.coords.latitude, myPosition.coords.longitude, soundsData.recordings[randomRecordingID].lat, soundsData.recordings[randomRecordingID].lng);
		$('#audio').append('<audio src="' + soundsData.recordings[randomRecordingID].file + '" type="audio/mpeg" autoplay controls loop></audio>')
		$('#audio').append('<div>recorded ' + Math.round(kmDistance) + ' kilometers away</div>');
	} else {
		console.log('no sounds for #' + inID);
		$('#audio').append('no recordings found');
	}
}

function getSounds(inID) {
	$('#audio').empty();
	$('#audio').append('loading sound data');


	if (sounds[inID]) {
		chooseRandomRecording(inID);		
	} else {
		var latinName = sightings[inID].sciName;
		var urlString = '/sounds/' + latinName.replace(' ', '+');
		console.log('seeking sound data ' + urlString);
		$('#another').removeClass('disabled');

		$.ajax({
			url: urlString,
			dataType: 'json',
			success: function(data) {
				if (data.recordings) {
					sounds[inID] = data;
					chooseRandomRecording(inID);
				} else {
					$('#audio').append('no recordings found');
				}
			},
			error: function(xhr, status, error) {
				console.log('xeno canto fail');
				$('#audio').append('no recordings found');
			}
		});		
	}
}

function getRecentNearbySightings(inLatitude, inLongitude) {
	var queryParams = { lat: inLatitude, lng: inLongitude, fmt: 'json' };
	var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	console.log(urlString);

	$.getJSON(urlString, function(data) {
		console.log('got data');
		$('#location').append('<div>' + data.length + ' sightings</div>');
		$('#choose').removeClass('disabled');
		$('#answer').removeClass('disabled');
		
		for (var index in data) {
			sightings.push(data[index]);
		}
	});
}

$(document).ready(function(){ 
	$('#choose').click(function() {
		// clear and hide the old answer, hint, sighting #, and audio player
		$('#commonname').empty();
		$('#commonname').hide();
		$('#hint').empty();
		$('#sightingindex').empty();
		$('#audio').empty();

		// choose a new sighting
		chosen = Math.floor(Math.random() * sightings.length);
		$('#sightingindex').append('<h1>#' + chosen + '</h1>');

		// show a new hint, put the answer into the DOM but don't show it
		$('#hint').append('seen at ' + sightings[chosen].locName);
		$('#commonname').append(sightings[chosen].comName);

		// get sounds for this species if needed, and pick one at random
		getSounds(chosen);
	});

	$('#answer').click(function() {
		$('#commonname').show();
	});

	$('#another').click(function() {
		getSounds(chosen);
	});

	getLocation();
});



