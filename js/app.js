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
				$('.progress-bar').css('width', '33%');
				getRecentNearbySightings(position.coords.latitude, position.coords.longitude);
			},
			function error() {
				console.log('error');
				getRecentNearbySightings(37, -122);
			},
			{
			});
	} else {
		getRecentNearbySightings(37, -122);
	}
}

function chooseRandomRecording(inID) {
	$('audio')[0].pause();
	$('#readyState').text('picking');
	$('#audioDescription').text('next sound');
	console.log("SAPPPED");

	if (sounds[inID] && sounds[inID].recordings) {
		var soundsData = sounds[inID];
		var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);
		var currentSound = soundsData.recordings[randomRecordingID];

		console.log(soundsData.recordings[randomRecordingID]);
		var kmDistance = haversine(myPosition.coords.latitude, myPosition.coords.longitude, currentSound.lat, currentSound.lng);
		$('#audio').empty();
		$('#audio').append('<audio id="player" src="' + currentSound.file + '" type="audio/mpeg" autoplay loop ></audio>');

		$('audio')[0].addEventListener('playing', function() {
			console.log("PLAYING");
			console.log($('audio')[0].duration);
		});

		$('audio')[0].addEventListener('progress', function(e) {
			console.log("PROGRESS");
			console.log($('audio')[0].readyState);
			if ($('audio')[0].readyState == 4) {
				$('#readyState').text(Math.round($('audio')[0].duration) + ' sec');
				$('#audioDescription').text(currentSound.type + ' recorded ' + Math.round(kmDistance) + ' kilometers away in ' + currentSound.loc);
			} else if ($('audio')[0].readyState == 3) {
				$('#readyState').text('loading');
			}
		});


		} else {
		console.log('no sounds for #' + inID);
		$('#audio').append('no recordings found');
	}
}

function getSounds(inID) {
	$('#another').addClass('disabled');
	$('#readyState').text('loading');
	$('#audioDescription').text('recordings for this bird');
	$('audio')[0].pause();

	if (sounds[inID]) {
		chooseRandomRecording(inID);		
		$('#another').removeClass('disabled');
	} else {
		var latinName = sightings[inID].sciName;
		var urlString = '/sounds/' + latinName.replace(' ', '+');
		console.log('seeking sound data ' + urlString);

		$.ajax({
			url: urlString,
			dataType: 'json',
			success: function(data) {
				if (data.recordings) {
					sounds[inID] = data;
					$('#soundsHeading').text(data.recordings.length + ' Recordings');
					chooseRandomRecording(inID);
					$('#another').removeClass('disabled');
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

		for (var index in data) {
			sightings.push(data[index]);
		}

		$('.progress-bar').css('width', '66%');
		$('#quizHeading').text(sightings.length + ' birds to identify');
		chooseNextBird();
	});
}

function chooseNextBird() {
	// clear and hide the old answer, hint, sighting #, and audio player
	$('#commonname').val('');
	$('#choose').addClass('disabled');
	$('#hint').empty();
	$('#sightingindex').empty();

	// choose a new sighting
	chosen = Math.floor(Math.random() * sightings.length);
	$('#sightingindex').append('#' + chosen + ' ');
	$('#answer').removeClass('disabled');
	console.log(sightings[chosen]);

	// show a new hint, put the answer into the DOM but don't show it
	$('#sightingLocation').text(sightings[chosen].locName);
	$('#sightingDate').text(sightings[chosen].obsDt);

	// get sounds for this species if needed, and pick one at random
	getSounds(chosen);	
	$('.progress-bar').css('width', '100%');	
	$('.progress').hide();	
}

$(document).ready(function(){ 
	$('#choose').click(function() {
		chooseNextBird();
	});

	$('#answer').click(function() {
		$('#commonname').val(sightings[chosen].comName);
		$('#choose').removeClass('disabled');
		$('#answer').addClass('disabled');
	});

	$('#play').click(function() {
		$('audio')[0].play();
	});

	$('#pause').click(function() {
		$('audio')[0].pause();
	});

	$('#another').click(function() {
		getSounds(chosen);
	});

	getLocation();
});



