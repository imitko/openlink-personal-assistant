/* ================================= WebSocket Event Handlers ================================= */
onOpen = function(event) {
    chatAuthenticate().then(() => {
        if (!apiKeyRequired && currentThread) {
            checkResumeThread().then(() => { loadConversation(currentThread); });
        }
    });
};

onMessage = function(event) {
    readMessage(event.data);
};

onError = function(event) {
    sendMessage(undefined, 'Error connecting to the server.', 'right');
    webSocket.close();
};

onClose = function(event) {
    sendMessage(undefined, 'Connection to the server closed.', 'right');
};

