// app.js

var sightings = [];
var sounds = [];

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(position) {
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

function getSounds(inID, latinName) {
	var urlString = '/sounds/' + latinName.replace(' ', '+');
	console.log('seeking sound data ' + urlString);

	$.ajax({
		url: urlString,
		dataType: 'json',
		success: function(data) {
			sounds[inID] = data.recordings[0].file;
			if (data.recordings) {
				$('#quiz').append('<audio src="' + data.recordings[0].file + '" type="audio/mpeg" autoplay controls loop></audio>')
			} else {
				$('#quiz').append('no recordings found');
			}
		},
		error: function(xhr, status, error) {
			console.log('xeno canto fail');
			$('#quiz').append('no recordings found');
		}
	});
}

function getRecentNearbySightings(inLatitude, inLongitude) {
	$('#location').append('<img src="http://maps.googleapis.com/maps/api/staticmap?markers=color:blue|size:small|' + inLatitude + ',' + inLongitude + '&size=100x100&zoom=5&sensor=false" />');

	var queryParams = { lat: inLatitude, lng: inLongitude, fmt: 'json' };
	var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	console.log(urlString);

	$.getJSON(urlString, function(data) {
		console.log('got data');
		$('#location').append('<div>' + data.length + ' sightings</div>')
		for (var index in data) {
			sightings.push(data[index]);
		}
	});
}

$(document).ready(function(){ 
	console.log('hello, world');

	$('#choose').click(function() {
		var chosen = Math.floor(Math.random() * sightings.length);
		$('#quiz').empty();
		$('#quiz').append('<h1>#' + chosen + '</h1>');
		$('#quiz').append('<div id="commonname" style="display: none">' + sightings[chosen].comName + '</div>');
		getSounds(chosen, sightings[chosen].sciName);
	});

	$('#answer').click(function() {
		$('#commonname').show();
	});

	getLocation();
});



