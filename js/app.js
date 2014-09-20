// app.js

// TODO: error handling for bogus sciName (throw exception?)
// TODO: push state / fragments in URL, repeatable testing?
// TODO: structured global / singleton
// TODO: factor out use of JSON api's for reuse
// TODO: add ember for quiz?
// TODO: do real web audio API four calls at once
// TODO: real object for sound library

var gQuizScope = new PlaceTimeBirdSongs();
var gCurrentQuizSighting = 0;

// Fix up for prefixing
window.AudioContext = window.AudioContext||window.webkitAudioContext;
context = new AudioContext();

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

// TODO: handle errors
function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function success(inPosition) {
				gQuizScope.position = inPosition;
				$('.progress-bar').css('width', '33%');

				gQuizScope.getSightings(function() {
					$('.progress-bar').css('width', '66%');
					$('#quizHeading').text(gQuizScope.sightings.length + ' birds to identify');
					chooseNextBird();
				});

				// getRecentNearbySightings(inPosition.coords.latitude, inPosition.coords.longitude);
			},
			function error() {
				console.log('error');
				var fakePosition = { coords: { latitude: 37, longitude: -122 }};
				gQuizScope.position = fakePosition;
				$('.progress-bar').css('width', '33%');
				
				gQuizScope.getSightings(function() {
					$('.progress-bar').css('width', '66%');
					$('#quizHeading').text(gQuizScope.sightings.length + ' birds to identify');
					chooseNextBird();
				});
			},
			{
			});
	} else {
		console.log('browser does not support geolocation');
		var fakePosition = { coords: { latitude: 37, longitude: -122 }};
		gQuizScope.position = fakePosition;
		$('.progress-bar').css('width', '33%');
		
		gQuizScope.getSightings(function() {
			$('.progress-bar').css('width', '66%');
			$('#quizHeading').text(gQuizScope.sightings.length + ' birds to identify');
			chooseNextBird();
		});
	}
}

function chooseRandomRecording(soundsData) {
	$('audio')[0].pause();
	$('#readyState').text('picking');
	$('#audioDescription').text('next sound');

	var randomRecordingID = Math.floor(Math.random() * soundsData.recordings.length);
	var currentSound = soundsData.recordings[randomRecordingID];

	console.log(soundsData.recordings[randomRecordingID]);
	var kmDistance = haversine(gQuizScope.position.coords.latitude, gQuizScope.position.coords.longitude, currentSound.lat, currentSound.lng);
	$('audio')[0].setAttribute('src', currentSound.file);

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
}

function chooseNextBird() {
	// clear and hide the old answer, hint, sighting #, and audio player
	$('#commonname').val('');
	$('#choose').addClass('disabled');
	$('#hint').empty();
	$('#sightingindex').empty();

	// choose a new sighting
	gCurrentQuizSighting = gQuizScope.chooseRandomSighting();
	$('#sightingindex').append('#' + gCurrentQuizSighting + ' ');
	$('#answer').removeClass('disabled');
	console.log(gQuizScope.sightings[gCurrentQuizSighting]);

	// show a new hint, put the answer into the DOM but don't show it
	$('#sightingLocation').text(gQuizScope.sightings[gCurrentQuizSighting].locName);
	$('#sightingDate').text(gQuizScope.sightings[gCurrentQuizSighting].obsDt);

	// get sounds for this species if needed, and pick one at random
	gQuizScope.getSoundsForSighting(gCurrentQuizSighting, function(soundsData) {
		$('#another').removeClass('disabled');
		chooseRandomRecording(soundsData);
	});	

	$('.progress-bar').css('width', '100%');	
	$('.progress').hide();	
}

$(document).ready(function(){ 
	$('#choose').click(function() {
		chooseNextBird();
	});

	$('#answer').click(function() {
		$('#commonname').val(gQuizScope.sightings[gCurrentQuizSighting].comName);
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
		chooseRandomRecording(gQuizScope.sounds[gCurrentQuizSighting]);
	});

	getLocation();
});



