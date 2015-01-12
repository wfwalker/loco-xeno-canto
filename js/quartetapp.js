// app.js

// ‘Anything … may happen. A “mistake” is beside the point, for once anything happens it authentically is.’
//   from:
// ‘Composition: To Describe the Process of Composition Used in Music of Changes and Imaginary Landscape No. 4’
// Silence, 1961

// TODO: add ember for quiz?

// TODO: http://www.tulane.edu/~rscheidt/rcc_calendar.html ?
// TODO: http://freemusicarchive.org/api ?

var gBirds = new PlaceTimeBirdSongs();

// GLOBAL initialize audio context and listener
window.AudioContext = window.AudioContext||window.webkitAudioContext;
var gAudioContext = new AudioContext();
var gListener = gAudioContext.listener;
var gLastActionTime = gAudioContext.currentTime;

gListener.dopplerFactor = 1;
gListener.speedOfSound = 343.3;
gListener.setOrientation(0,0,-1,0,1,0);

// GLOBAL sound sources for bird song playback
gBirdSongPlayers = [];
gBirdSongPlayers[0] = new BirdSongPlayer(gAudioContext, '#player0', 'volumeMeter0');
gBirdSongPlayers[1] = new BirdSongPlayer(gAudioContext, '#player1', 'volumeMeter1');
gBirdSongPlayers[2] = new BirdSongPlayer(gAudioContext, '#player2', 'volumeMeter2');
gBirdSongPlayers[3] = new BirdSongPlayer(gAudioContext, '#player3', 'volumeMeter3');

$(document).ready(function(){ 
	// does the initial url have a saved session?
	if (window.location.href.split('#')[1]) {
		console.log('document ready! ' + window.location.href.split('#')[1]);

		// restore from session
		$.getJSON('/saved/' + window.location.href.split('#')[1], function(data) {
			console.log('retrieved saved session data');
			console.log(data);
			gBirdSongPlayers[0].initializeFromSavedSession(data.savedPlayer[0], '#player0');
			gBirdSongPlayers[1].initializeFromSavedSession(data.savedPlayer[1], '#player1');
			gBirdSongPlayers[2].initializeFromSavedSession(data.savedPlayer[2], '#player2');
			gBirdSongPlayers[3].initializeFromSavedSession(data.savedPlayer[3], '#player3');
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
					console.log('got saved sessions');
					console.log(data);

					// for (var index in data) {
					// 	$('#savedSessions').append($('<div>' + data[index] + '</div>'));
					// }
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
				function error() {
					console.log('error during geolocation');
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

			var newDistance = {};
	 		$("select#distanceChooser option:selected").each(function() {
				newDistance = parseFloat($(this).attr('data-distance'));
			});		

			var newTime = {};
	 		$("select#timeChooser option:selected").each(function() {
				newTime = parseFloat($(this).attr('data-time'));
			});		

	 		gBirds.description = newDescription;
			gBirds.position = newLocation;		
			gBirds.distance = newDistance;
			gBirds.days = newTime;	

			$('#setupStatus').text('Retrieving bird sightings');
			$('#goSoundscape').button('loading');

			gBirds.getSightings(function() {
				$('#setupStatus').text('Choosing birds based on');
				$('#goSoundscape').button('reset');

				for (var i = 0; i < gBirdSongPlayers.length; i++) {
					gBirdSongPlayers[i].chooseSightingAndPlayRandomSound();
				}
			});
		});
	}

	$('#rate0').click(function(e) {
		gBirdSongPlayers[0].randomizePlaybackRate();
		// TODO: store lastActionTime within each player!
	});
	$('#rate1').click(function(e) {
		gBirdSongPlayers[1].randomizePlaybackRate();
	});
	$('#rate2').click(function(e) {
		gBirdSongPlayers[2].randomizePlaybackRate();
	});
	$('#rate3').click(function(e) {
		gBirdSongPlayers[3].randomizePlaybackRate();
	});

	$('#pan0').click(function(e) {
		gBirdSongPlayers[0].randomizePanner();
	});
	$('#pan1').click(function(e) {
		gBirdSongPlayers[1].randomizePanner();
	});
	$('#pan2').click(function(e) {
		gBirdSongPlayers[2].randomizePanner();
	});
	$('#pan3').click(function(e) {
		gBirdSongPlayers[3].randomizePanner();
	});

	$('#reverse0').click(function(e) {
		gBirdSongPlayers[0].reversePlayback();
	});
	$('#reverse1').click(function(e) {
		gBirdSongPlayers[1].reversePlayback();
	});
	$('#reverse2').click(function(e) {
		gBirdSongPlayers[2].reversePlayback();
	});
	$('#reverse3').click(function(e) {
		gBirdSongPlayers[3].reversePlayback();
	});


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

	$('#recording0').click(function(e) {
		gBirdSongPlayers[0].chooseRandomRecording();
	});
	$('#recording1').click(function(e) {
		gBirdSongPlayers[1].chooseRandomRecording();
	});
	$('#recording2').click(function(e) {
		gBirdSongPlayers[2].chooseRandomRecording();
	});
	$('#recording3').click(function(e) {
		gBirdSongPlayers[3].chooseRandomRecording();
	});

	$('#nextSighting0').click(function(e) {
		gBirdSongPlayers[0].chooseSightingAndPlayRandomSound();
	});
	$('#nextSighting1').click(function(e) {
		gBirdSongPlayers[1].chooseSightingAndPlayRandomSound();
	});
	$('#nextSighting2').click(function(e) {
		gBirdSongPlayers[2].chooseSightingAndPlayRandomSound();
	});
	$('#nextSighting3').click(function(e) {
		gBirdSongPlayers[3].chooseSightingAndPlayRandomSound();
	});

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



