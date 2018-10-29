const TRACK_LOADED = 2;
// HACK hardcoded duration for this example (otherwise need to monitor video loadedmetadata)
const VIDEO_DURATION = 8.374999;

const video = document.querySelector('video');
const playButton = document.querySelector('[data-action="playpause"]');
const rateButton = document.querySelector('[data-action="playbackrate"]');
const muteButton = document.querySelector('[data-action="mute"]');
const subtitlesButton = document.querySelector('[data-action="subtitles"]');
const timecodeButton = document.querySelector('[data-action="timecode"]');
const timecodeRaf = document.querySelector('#timecode-raf');
const timecodeCue = document.querySelector('#timecode-cuechange');
const timecodeTrack = document.querySelector('track#timecode-track');
const scrubber = document.querySelector('.scrubber');

let timecodes;


function playPause() {
	if (video.paused) {
		video.play();
	} else {
		video.pause();
	}
}


function togglePlaybackRate() {
	video.playbackRate = video.playbackRate === 1 ? 5 : 1;
}


function toggleMute() {
	video.muted = ! video.muted;
}


function toggleTextTrack(trackId, loadState = 'showing') {
	const trackElement = document.querySelector(`track#${trackId}`);
	if (trackElement) {
		const track = trackElement.track;
		track.mode = track.mode === 'disabled' ? loadState : 'disabled';
	}
	return trackElement;
}


function toggleSubtitles() {
	const trackElement = toggleTextTrack('subtitles');
	subtitlesButton.classList.toggle('active', trackElement.track.mode === 'showing');
}


function gotoChapter(chapterId) {
	video.pause();

	const chaptersTrack = document.querySelector('track#chapters');
	if (chaptersTrack.readyState === TRACK_LOADED) {
		const cue = Array.from(chaptersTrack.track.cues).find(cue => cue.id === chapterId);
		if (cue) {
			// NOTE this fails if video.seekable ranges are empty or 0–0 (which seems to happen after 5x playback rate?)
			video.currentTime = cue.startTime;
		}

	} else {
		// load
		chaptersTrack.addEventListener('load', () => gotoChapter(chapterId));
		chaptersTrack.track.mode = 'hidden';
	}
}


function getTimecode() {
	const index = timecodes.findIndex(tuple => tuple[0] >= video.currentTime);
	if (index !== -1) {
		return timecodes[index][1];
	}
	return '';
}


function renderTimecodeOnCueChange() {
	if (timecodes) {
		timecodeCue.textContent = getTimecode();
	}
}


function renderScrubber() {
	scrubber.style.setProperty('--scrubber-value', `${scrubber.value}%`);
}


function renderUI() {
	scrubber.value = Math.floor(video.currentTime / VIDEO_DURATION * 100);
	renderScrubber();

	if (timecodes) {
		timecodeRaf.textContent = getTimecode();
	}

	if (!video.paused) {
		window.requestAnimationFrame(renderUI);
	}
}


function initRenderTimecode(track) {
	timecodes = Array.from(track.cues).map(cue => [cue.endTime, cue.text])
	timecodeRaf.hidden = false;
	timecodeCue.hidden = false;
	renderUI();
	window.requestAnimationFrame(renderUI);
	timecodeButton.classList.add('active');
}


function toggleTimecode() {
	// turn on captions
	const trackElement = toggleTextTrack('timecode-track', 'hidden');
	if (trackElement && trackElement.track && trackElement.track.mode !== 'disabled') {
		// get frame numbers
		if (trackElement.readyState === TRACK_LOADED) {
			initRenderTimecode(trackElement.track);
		} else {
			trackElement.addEventListener('load', event => initRenderTimecode(event.target.track));
		}
	} else {
		timecodeRaf.hidden = true;
		timecodeCue.hidden = true;
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

		case 'playbackrate':
			togglePlaybackRate();
			break;

		case 'mute':
			toggleMute();
			break;

		case 'subtitles':
			toggleSubtitles();
			break;

		case 'shot1':
			gotoChapter('shot1');
			break;

		case 'shot2':
			gotoChapter('shot2');
			break;

		case 'timecode':
			toggleTimecode();
			break;
		}
	}
});


// sync play/pause button label to video state
video.addEventListener('play', () => {
	renderUI();
	playButton.classList.add('active');
});
video.addEventListener('pause', () => playButton.classList.remove('active'));
video.addEventListener('seeked', renderUI);

video.addEventListener('volumechange', () => muteButton.classList.toggle('active', video.muted));
video.addEventListener('ratechange', () => rateButton.classList.toggle('active', video.playbackRate > 1));

timecodeTrack.addEventListener('cuechange', renderTimecodeOnCueChange);
