// app.js

// ‘Anything … may happen. A “mistake” is beside the point, for once anything happens it authentically is.’
//   from:
// ‘Composition: To Describe the Process of Composition Used in Music of Changes and Imaginary Landscape No. 4’
// Silence, 1961

var gBirds = new PlaceTimeBirdSongs();

// GLOBAL initialize audio context and listener
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gListener = gAudioContext.listener;
var gLastActionTime = gAudioContext.currentTime;

gListener.dopplerFactor = 1;
gListener.speedOfSound = 343.3;
gListener.setOrientation(0,0,-1,0,1,0);

function insertSavedSessionMenuItem(key) {
	$.getJSON('/saved/' + key, function(sessionData) {
		var description = '-- no name --';

		if (sessionData.description) {
			description = sessionData.description;
		}
		$('.savedSessions').append($('<li><a id="' + key + '" target=blank href="#' + key + '">' + description + ' </a></li>'));
	});
}

$(document).ready(function(){ 
	// opt-in to tooltips
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
	
	// GLOBAL sound sources for bird song playback
	gBirdSongPlayers = [];

	for (var i = 0; i < 4; i++) {
		gBirdSongPlayers[i] = new BirdSongPlayer(gAudioContext, '#player' + i);
	}

	// does the initial url have a saved session?
	if (window.location.href.split('#')[1]) {
		console.log('document ready! ' + window.location.href.split('#')[1]);

		// restore from session
		$.getJSON('/saved/' + window.location.href.split('#')[1], function(data) {
			console.log('retrieved saved session data');
			console.log(data);

			$('#sightings').text('"' + data.description + '"');

			for (var i = 0; i < 4; i++) {
				gBirdSongPlayers[i].initializeFromSavedSession(data.savedPlayer[i], '#player' + i);
			}
		}.bind(this))
		.fail(function(e) {
			console.log("failure to get saved session");
			console.log(e);
			$('#sightings').text('error while retrieving saved session');
		});

	} else {
		console.log('document ready without saved session!');

		// go get the list of saved sessions
		$.ajax({
			url: '/saved',
			dataType: 'json',
			success: function(data) {
				if (data) {
					for (var index in data) {
						insertSavedSessionMenuItem(data[index]);
					}
				} else {
					// TODO: retry?
					console.log('cannot retrieve saved sessions');
				}
			}.bind(this),
			error: function(xhr, status, error) {
				// TODO: retry?
				console.log('cannot retrieve saved sessions');
			}
		});		

		// show the session creator and start trying to geolocate
		$('#createSession').collapse('show');
		$('#setupStatus').text('Finding your location');

		// try to geolocate
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				function success(inPosition) {
					$('#placeChooser').append($('<option selected />').attr('data-lat', inPosition.coords.latitude).attr('data-long', inPosition.coords.longitude).text('your location (' + Math.round(inPosition.coords.latitude * 100) / 100.0 + '°, ' + Math.round(inPosition.coords.longitude * 100) / 100.0 + '°)'));
					$('#setupStatus').text('Found your location');
				}.bind(this),
				function error(error) {
					console.log('error during geolocation');
					console.log(error);
					$('#setupStatus').text('Could not find your location');
				}.bind(this),
				{
				});
		} else {
			console.log('browser does not support geolocation');
			$('#setupStatus').text('Cannot find your location');
		}

		$('#goSoundscape').click(function () {
			// TODO: actually pay attention to menu values here

			var newLocation = {};
			var newDescription = '';
	 		$("select#placeChooser option:selected").each(function() {
				newLocation.coords = {
					latitude: parseFloat($(this).attr('data-lat')),
					longitude: parseFloat($(this).attr('data-long'))
				};
				newDescription = $(this).text();
			});		

			var newDistance = 0;
	 		$("select#distanceChooser option:selected").each(function() {
				newDistance = parseFloat($(this).attr('data-distance'));
			});		

			var newTime = 0;
	 		$("select#timeChooser option:selected").each(function() {
				newTime = parseFloat($(this).attr('data-time'));
			});		

	 		gBirds.description = newDescription;
			gBirds.position = newLocation;		
			gBirds.distance = newDistance;
			gBirds.days = newTime;	

			$('#setupStatus').text('Retrieving bird sightings');
			$('#goSoundscape').button('loading');

			gBirds.getSightings(function(success, errorMessage) {
				if (success) {
					$('#setupStatus').text('Choosing birds based on');
					$('#goSoundscape').button('reset');

					for (var i = 0; i < gBirdSongPlayers.length; i++) {
						gBirdSongPlayers[i].chooseSightingAndPlayRandomSound();
					}
				} else {
					$('#setupStatus').text(errorMessage);
					$('#goSoundscape').button('reset');
				}
			});
		});
	}

	$('#share').click(function(e) {
		console.log('SHARE');

		// TODO: put up alert asking user to type description?
		$('#saveSession').modal();

		$('#doShare').click(function () {
			console.log('CLICKED DOSHARE');

			var savedState = {};

			savedState.description = $('#shareDescription').val();

			savedState.savedPlayer = [
					gBirdSongPlayers[0].saveData(),
					gBirdSongPlayers[1].saveData(),
					gBirdSongPlayers[2].saveData(),
					gBirdSongPlayers[3].saveData()
				]

			$.post(
				"/share", 
				savedState,
				function(data, status) {
					console.log('success sharing');
					console.log(data);
					// TODO: put up floating alert with URL to copy
					$('#shareURL').attr('href', '#' + data[0]);
					$('#shareURL').text(savedState.description);
				},
				'json');		
		});
	});

	for (i = 0; i < 4; i++) {
		gBirdSongPlayers[i].initializeVUMeter();
		gBirdSongPlayers[i].initializeControls();
	}

	window.setInterval(function() {
		// TODO: call "update last action" method from each button above or other event handler
		// TODO: that function should set a global that holds the last active time
		// TODO: here, compare that stashed time to current time
		// TODO: if it exceeds threshold, do something and update last action
		// console.log('last action ' + gBirdSongPlayers[0].lastActionTime + ', currently ' + gAudioContext.currentTime);
		// console.log('last action ' + gBirdSongPlayers[1].lastActionTime + ', currently ' + gAudioContext.currentTime);
		// console.log('last action ' + gBirdSongPlayers[2].lastActionTime + ', currently ' + gAudioContext.currentTime);
		// console.log('last action ' + gBirdSongPlayers[3].lastActionTime + ', currently ' + gAudioContext.currentTime);
	}, 1000);
});
