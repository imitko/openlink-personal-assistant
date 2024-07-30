/**
 * Lists storage items and displays them in the modal under the search button.
 */
async function listStorage() {
    const storageFolder = localStorage.getItem('openlinksw.com:opal:personal-storage');
    if (!storageFolder) {
        return; // Exit if no storage folder is set
    }

    const propfind = '<?xml version="1.0" encoding="utf-8" ?>' +
        '<D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getcontenttype/></D:prop></D:propfind>';
    const options = { method: 'PROPFIND', headers: {'content-type': 'application/xml', 'depth': 1}, body: propfind };
    
    $('.loader').css('display', 'block'); // Show loader

    try {
        const response = await authClient.fetch(storageFolder, options); // Fetch storage folder contents
        if (!response.ok) throw new Error(response.statusText);

        const xmlText = await response.text(); // Get response text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const propfindResponse = xmlDoc.getElementsByTagNameNS('DAV:', 'response');

        // Clear previous storage items and dynamic elements
        $('.personal-storage-threads').empty();

        // Add new dynamic elements
        $('.personal-storage-threads').append(`
            <div class="storage-header">
                <p>Threads from <a href="${storageFolder}" id="storage-location" target="_blank" referrerpolicy="origin">${storageFolder}</a>:</p>
            </div>
            <div id="storage-items-list" class="file-storage-threads-list"></div>
        `);

        // Add new storage items to the list
        Array.from(propfindResponse).forEach(elem => {
            const href = elem.getElementsByTagNameNS('DAV:', 'href')[0]?.textContent;
            const title = elem.getElementsByTagNameNS('DAV:', 'displayname')[0]?.textContent;
            const mime = elem.getElementsByTagNameNS('DAV:', 'getcontenttype')[0]?.textContent;
            const url = new URL (href, storageFolder);
            if (mime === 'application/json') {
                addStorageItemToModal(url, title); // Add item to modal list if JSON
            }
        });
    } catch (err) {
        showFailureNotice(err.message); // Show error notice
    } finally {
        $('.loader').css('display', 'none'); // Hide loader
    }
}

/**
 * Adds a storage item to the modal's list.
 * @param {string} href - The href of the storage item.
 * @param {string} title - The title of the storage item.
 */
function addStorageItemToModal(href, title) {
    const $item = $('<div>', {
        class: 'file-storage-thread-item',
        'data-url': href,
        text: title || href // Set the text to title or href
    });

    $('#storage-items-list').append($item); // Append the item to the list
}

/**
 * Loads chat session from storage and updates the UI.
 * 
 * @param {string} link - The URL link to fetch the chat session from storage.
 */
async function loadFromStorage(link) {
    authClient.fetch (link, { method:'GET', headers: { 'Accept': 'application/json' } })
    .then ((res) => {
        if (!res.ok) {
             throw new Error(res.statusText);
        }
        return res.json();
    })
    .then ((res) => {
        let messages = res.messages;
        let info = res.info;
        if (!messages && res.data) {
            messages = new Array();
            for (item of res.data) {
                let role = item.role;
                let assistant_id = item.assistant_id;
                for (cont of item.content) {
                    let content = undefined;
                    switch (cont.type) {
                        case 'text':
                            content = cont.text.value;
                            break;
                        case 'image_file':
                            role = 'image';
                            content = cont.image_file.file_id;
                            break;
                        case 'image_url':
                            role = 'image';
                            content = cont.image_url.url;
                            break;
                        default:
                            content = '';
                    }
                    messages.push ( { role: role, text: content, prompt_id: item.id, assistant_id: assistant_id } );
                }
            }
        }
        importedSession = { info: info ? info : null, messages: messages };
        showConversation(messages);
        $('.messages').scrollTop($('.messages').prop('scrollHeight'));
    })
    .catch ((e) => { alert (e.message); });

    $('#user-input-textbox').hide();
    $('.continue-button-group').show();
    $('.continue-button').off('click');
    $('.continue-button').click(function (e) {
        importSession();
    });
    $('.loader').hide();
}

/**
 * Imports a chat session and updates the UI.
 */
async function importSession() {
    if (!importedSession || !loggedIn) return;
    let url = new URL('/chat/api/importThread', httpBase);
    let params = new URLSearchParams();
    params.append('apiKey', apiKey ? apiKey : '');
    url.search = params.toString();
    $('.loader').show();
    try {
        const res = await authClient.fetch (url.toString(), {method:'POST',headers: {'Accept':'application/json' },body:JSON.stringify(importedSession)})
        if (!res.ok) throw new Error(res.statusText);
        const obj = await res.json(); // Parse response JSON
        await createNewThread(obj);
        $('#user-input-textbox').show();
        $('.continue-button-group').hide();
    } catch (e) {
        showFailureNotice(e.message); // Show error notice
    }
    $('.loader').hide();
    importedSession = undefined;
}

/**
 * Exports the chat session to a JSON file in the storage folder.
 * 
 * @param {string} thread_id - The ID of the chat session to export.
 */
async function exportSession(thread_id) {
    storageFolder = localStorage.getItem('openlinksw.com:opal:personal-storage');
    if (!thread_id) return showFailureNotice('No session is selected to export.'); // Notify if no session is selected

    $("#share-thread-modal").hide(); // Hide the share modal

    let url = new URL('/chat/api/messages', httpBase);
    let params = new URLSearchParams(url.search);
    params.append('thread_id', thread_id);
    params.append('apiKey', apiKey ? apiKey : '');
    params.append('details', 1);
    url.search = params.toString();

    $('.loader').css('display', 'block'); // Show loader

    try {
        const response = await authClient.fetch(url.toString()); // Fetch chat data
        if (!response.ok) throw new Error(response.statusText);
        
        const body = await response.json(); // Parse response JSON
        const title = body?.info?.title ? body.info.title : thread_id;
        const file_name = title.replace(/[\s\/\\.]/g, '_') + '.json';
        const uploadUrl = new URL(encodeURIComponent(file_name), storageFolder);
        const options = { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body, null, 2) };

        const uploadResponse = await authClient.fetch(uploadUrl.toString(), options); // Upload JSON file
        if (!uploadResponse.ok) throw new Error(uploadResponse.statusText);

        const location = uploadResponse.headers.get('location');
        const link = new URL(location, storageFolder);
        
        showSuccessNotice(`Successfully exported chat to: <a href="${link.toString()}" target="_blank">${link.toString()}</a>`);
    } catch (err) {
        showFailureNotice(err.message); // Show error notice
    } finally {
        $('.loader').css('display', 'none'); // Hide loader
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonContent = JSON.parse(e.target.result);
                processJsonData(jsonContent);
            } catch (error) {
                showFailureNotice(`Error parsing JSON file: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }
}

function processJsonData(jsonData) {
    let messages = [];
    let info = jsonData.info;

    messages = new Array();
    for (const item of jsonData.data) {
        let role = item.role;
        for (const cont of item.content) {
            let content = undefined;
            switch (cont.type) {
                case 'text':
                    content = cont.text.value;
                    break;
                case 'image_file':
                    role = 'image';
                    content = cont.image_file.file_id;
                    break;
                case 'image_url':
                    role = 'image';
                    content = cont.image_url.url;
                    break;
                default:
                    content = '';
            }
            messages.push({ role: role, text: content, prompt_id: item.id });
        }
    }
    const importedSession = { info: info ? info : null, messages: messages };
    showConversation(messages);
    importSession(importedSession);
    $('.messages').scrollTop($('.messages').prop('scrollHeight'));
    $('.loader').hide();
}

function downloadContent(content, fileName, contentType) {
    var a = document.createElement('a');
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
}