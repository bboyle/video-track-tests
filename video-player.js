const TRACK_LOADED = 2;

const video = document.querySelector('video');
const playButton = document.querySelector('[data-action="playpause"]');
const muteButton = document.querySelector('[data-action="mute"]');
const subtitlesButton = document.querySelector('[data-action="subtitles"]');
const timecodeButton = document.querySelector('[data-action="timecode"]');
const timecodeDiv = document.querySelector('#timecode-raf');

let timecodes;


function playPause() {
	if (video.paused) {
		video.play();
	} else {
		video.pause();
	}
}


function toggleMute() {
	video.muted = ! video.muted;
}


function toggleTextTrack(trackId) {
	const trackElement = document.querySelector(`track#${trackId}`);
	if (trackElement) {
		const track = trackElement.track;
		track.mode = track.mode === 'showing' ? 'disabled' : 'showing';
	}
	return trackElement;
}


function toggleSubtitles() {
	const track = toggleTextTrack('subtitles');
	subtitlesButton.classList.toggle('active', track.mode === 'showing');
}


function getTimecode() {
	const index = timecodes.findIndex(tuple => tuple[0] >= video.currentTime);
	if (index !== -1) {
		return timecodes[index][1];
	}
	return '';
}


function renderTimecode() {
	if (timecodes) {
		timecodeDiv.textContent = getTimecode();
		window.requestAnimationFrame(renderTimecode);
	}
}


function initRenderTimecode(track) {
	timecodes = Array.from(track.cues).map(cue => [cue.endTime, cue.text])
	timecodeDiv.hidden = false;
	window.requestAnimationFrame(renderTimecode);
	timecodeButton.classList.add('active');
}


function toggleTimecode() {
	// turn on captions
	const trackElement = toggleTextTrack('timecode-track');
	if (trackElement && trackElement.track && trackElement.track.mode === 'showing') {
		// get frame numbers
		if (trackElement.readyState === TRACK_LOADED) {
			initRenderTimecode(trackElement.track);
		} else {
			trackElement.addEventListener('load', event => initRenderTimecode(event.target.track));
		}
	} else {
		timecodeDiv.hidden = true;
		timecodes = null;
		timecodeButton.classList.remove('active');
	}
}


document.addEventListener('click', event => {
	if (event.target.dataset) {
		switch (event.target.dataset.action) {
		case 'playpause':
			playPause();
			break;

		case 'mute':
			toggleMute();
			break;

		case 'subtitles':
			toggleSubtitles();
			break;

		case 'timecode':
			toggleTimecode();
			break;
		}
	}
});


// sync play/pause button label to video state
video.addEventListener('play', () => playButton.classList.add('active'));
video.addEventListener('pause', () => playButton.classList.remove('active'));
video.addEventListener('volumechange', () => muteButton.classList.toggle('active', video.muted));
