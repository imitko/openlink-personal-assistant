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
    sendMessage (undefined, 'Error connecting to the server.', undefined, undefined);
    $('.loader').hide();
    webSocket.close();
};

onClose = function(event) {
    sendMessage (undefined, 'Connection to the server closed.', undefined, undefined);
    $('.loader').hide();
    $('#user-input-textbox').hide();
    $('.reconenct-button-group').show();
};


