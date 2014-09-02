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
			$('#' + inID).append('<audio src="' + data.recordings[0].file + '" type="audio/mpeg" controls loop></audio>')
		},
		error: function(xhr, status, error) {
			console.log('xeno canto fail');
			console.log(xhr.status);
			console.log(xhr.statusText);
		}
	});
}

function getRecentNearbySightings(inLatitude, inLongitude) {
	var queryParams = { lat: inLatitude, lng: inLongitude, fmt: 'json' };
	var urlString = 'http://ebird.org/ws1.1/data/obs/geo/recent?' + $.param(queryParams);
	console.log(urlString);

	$.getJSON(urlString, function(data) {
		console.log('got data');
		console.log(data);
		for (var index in data) {
			$('#scienceNames').append('<div id="' + index + '">' + data[index].comName + '</div>');
			scienceNames.push(data[index].sciName);
		}

		for (index in data) {
			getSounds(index, scienceNames[index]);
		}
	});
}

$(document).ready(function(){ 
	console.log('hello, world');
	getLocation();
});



