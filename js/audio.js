async function audioEnable() {
    if (mediaRecorder) return;

    const types = ["audio/mp3", "audio/m4a", "audio/webm", "audio/mp4", "audio/ogg", "audio/flac", "audio/mpeg", "audio/mpga", "audio/wav"];
    const mime = types.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/wav';
    const constraints = { audio: true };
    let chunks = [];

    const getText = async (blob) => {
        const formData = new FormData();
        formData.append('format', mime);
        
        checkApiKey();
        if (apiKey) formData.append('apiKey', apiKey);
        formData.append('data', blob);
        $('.loader').show();
        try {
            const resp = await authClient.fetch(new URL('/chat/api/voice2text', httpBase).toString(), { method: 'POST', body: formData });
            const jt = await resp.json();
            if (resp.ok && jt.text.length) {
                const prompt_id = Math.random().toString(36).replace('0.','usr-');
                sendMessage(prompt_id, jt.text);
                // promptComplete(prompt_id, jt.text); TODO: check if this is required
            } else {
                showFailureNotice('Recording cannot be transcribed.');
            }
        } catch (e) {
            showFailureNotice('Can not access voice transcription service ' + e);
        }
        $('.loader').hide();
    }

    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        const audioContext = new AudioContext();
        const audioStreamSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -50;
        analyser.fftSize = 256;
        audioStreamSource.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        const domainData = new Uint8Array(bufferLength);
        const detectSound = () => {
            analyser.getByteFrequencyData(domainData);
            if (domainData.some(d => d > 0) && recodingTimeout) {
                clearTimeout(recodingTimeout);
                recodingTimeout = setTimeout(() => mediaRecorder.stop(), 5000);
            }
            requestAnimationFrame(detectSound);
        }
        requestAnimationFrame(detectSound);

        mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 128000, mimeType: mime });
        mediaRecorder.onstart = () => { $('#record-button').hide(); $('#stop-recording-button').show(); }
        mediaRecorder.onstop = () => {
            clearTimeout(recodingTimeout);
            recodingTimeout = null;
            $('#record-button').show();
            $('#stop-recording-button').hide(); 
            const blob = new Blob(chunks, { type: mime });
            chunks = [];
            if (apiKey || !apiKeyRequired) {
                getText(blob);
            } else {
                showFailureNotice('Must login and enter API Key in order to get voice transcription');
            }
        }
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        $('#record-button').show();
    }).catch(err => showFailureNotice('Error occurred: ' + err));
}

function audioDisable() {
    if (mediaRecorder) {
        if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        mediaRecorder = undefined;
        $('#record-button, #stop-recording-button').hide();
    }
}

async function stopRecording() {
    $('.loader').show();
    if (mediaRecorder === undefined) {
        $('.loader').hide();
        return; 
    }
    mediaRecorder.stop();
    $('.loader').hide();
}

async function startRecording() {
    if (mediaRecorder === undefined) {
        showFailureNotice("Audio must be enabled in Assistant settings before recording.")
        return;
    } 
    mediaRecorder.start(1000);
    recodingTimeout = setTimeout(() => stopRecording(), 5000);
}
