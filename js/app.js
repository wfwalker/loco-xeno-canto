// app.js

var scienceNames = [];
var sounds = [];

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(position) {
				console.log('success');
				console.log(position);
				$('#location').append('<div>' + position.coords.latitude + ',' + position.coords.longitude + '</div>');
				getRecentNearbySightings(position.coords.latitude, position.coords.longitude);
			},
			function error() {
				console.log('error');
			},
			{
			});
	} else {
		$('#location').append('<div>23,34</div>')
		getRecentNearbySightings(23, 34);
	}
}

function getSounds(inID, latinName) {
	var urlString = '/sounds/' + latinName.replace(' ', '+');
	console.log('seeking sound data ' + urlString);

	$.ajax({
		url: urlString,
		dataType: 'json',
		success: function(data) {
			console.log('got sound data');
			console.log(data);
			sounds = data;

			console.log(data.recordings[0].file);
			$('#' + inID).append('<audio src="' + data.recordings[0].file + '" type="audio/mpeg" controls autoplay loop></audio>')
		},
		error: function(xhr, status, error) {
			console.log('xeno canto fail');
			console.log(xhr.status);
			console.log(xhr.statusText);
		}
	});
}

function getRecentNearbySightings(lat, long) {
	var queryParams = { lat: 37.8, lng: -122.5, fmt: 'json' };
	var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	console.log(urlString);

	$.getJSON(urlString, function(data) {
		console.log('got data');
		console.log(data);
		for (var index in data) {
			$('#scienceNames').append('<div id="' + index + '">' + data[index].sciName + '</div>');
			scienceNames.push(data[index].sciName);
		}

		getSounds(0, scienceNames[0]);
		getSounds(1, scienceNames[1]);
		getSounds(2, scienceNames[2]);
	});
}

$(document).ready(function(){ 
	console.log('hello, world');
	getLocation();
});



