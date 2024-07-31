// TODO: when a file is uploaded by a user we should add the name of the file at the bottom in a text list so that it is stored in the future

let selectedFiles = [];

/**
 * Initializes file upload and drag-and-drop functionalities.
 */
function initFiles() {
    initFileUpload();
    initFileDragAndDrop();
}

/**
 * Determines the MIME type of a file based on its extension.
 * @param {string} filename - The name of the file.
 * @returns {Object} - The MIME type and icon corresponding to the file extension.
 */
function getSupportedFileType(filename) {
    const ext2mime = {
        'c': 'text/x-c',
        'cc': 'text/x-c++',
        'h': 'text/x-c',
        'hpp': 'text/x-c++',
        'cs': 'text/x-csharp',
        'cpp': 'text/x-c++',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'html': 'text/html',
        'xhtml': 'text/html',
        'java': 'text/x-java',
        'json': 'application/json',
        'jsonl': 'application/json',
        'jsonld': 'application/json',
        'md': 'text/markdown',
        'pdf': 'application/pdf',
        'php': 'text/x-php',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'py': 'text/x-python',
        'rb': 'text/x-ruby',
        'tex': 'text/x-tex',
        'txt': 'text/plain',
        'sql': 'text/plain',
        'sparql': 'text/plain',
        'ttl': 'text/plain',
        'n3': 'text/plain',
        'nt': 'text/plain',
        'nq': 'text/plain',
        'nquad': 'text/plain',
        'log': 'text/plain',
        'css': 'text/css',
        'js': 'text/javascript',
        'sh': 'application/x-sh',
        'ts': 'application/typescript'
    };
    const ext2icon = {
        'cs': 'filetype-cs.svg',
        'doc': 'filetype-doc.svg',
        'docx': 'filetype-docx.svg',
        'html': 'filetype-html.svg',
        'java': 'filetype-java.svg',
        'json': 'filetype-json.svg',
        'md': 'filetype-md.svg',
        'pdf': 'filetype-pdf.svg',
        'php': 'filetype-php.svg',
        'pptx': 'filetype-pptx.svg',
        'py': 'filetype-py.svg',
        'rb': 'filetype-rb.svg',
        'txt': 'filetype-txt.svg',
        'css': 'filetype-css.svg',
        'js': 'filetype-js.svg',
        'sh': 'filetype-sh.svg',
    };

    const extension = filename.split('.').pop();
    return { 
        mime: ext2mime[extension] || 'application/octet-stream',
        icon: ext2icon[extension] || 'file-text.svg'
    };
}

/**
 * Uploads a file to the server.
 * @param {string} thread_id - The ID of the thread to associate the file with.
 * @param {string} name - The name of the file.
 * @param {string} type - The MIME type of the file.
 * @param {Blob} blob - The file data.
 * @returns {Promise<string|null>} - The ID of the uploaded file or null if the upload fails.
 */
async function storeFile(thread_id, name, type, blob) {
    // Retrieve the API key from local storage
    const apiKey = localStorage.getItem('openlinksw.com:opal:gpt-api-key');
    // Construct the URL for the file upload API
    const url = new URL('/chat/api/files', httpBase);
    const params = new URLSearchParams(url.search);
    const formData = new FormData();
    // Append necessary parameters to the URL and form data
    params.append('thread_id', thread_id);
    formData.append('apiKey', apiKey || '');
    formData.append('name', name);
    formData.append('format', type);
    formData.append('purpose', 'assistants');
    formData.append('data', blob);

    url.search = params.toString();
    // Show loader animation
    $('.loader').show();
    try {
        // Make the API request to upload the file
        const response = await authClient.fetch(url.toString(), { method: 'POST', body: formData });
        if (!response.ok) throw new Error(response.statusText);
        // Retrieve the file ID from the response
        const file_id = await response.text();
        showSuccessNotice(`${name} uploaded successfully`);
        return file_id;
    } catch (error) {
        // Handle any errors that occur during the upload
        showFailureNotice('Cannot upload file ' + error);
        return null;
    } finally {
        // Hide loader animation
        $('.loader').hide();
    }
}

/**
 * Deletes a file from the server.
 * @param {string} thread_id - The ID of the thread associated with the file.
 * @param {string} file_id - The ID of the file to delete.
 * @param {string} name - The name of the file.
 * @returns {Promise<void>}
 */
async function deleteFile(thread_id, file_id, name) {
    // Retrieve the API key from local storage
    apiKey = localStorage.getItem('openlinksw.com:opal:gpt-api-key');
    // Construct the URL for the file deletion API
    let url = new URL('/chat/api/files', httpBase);
    let params = new URLSearchParams(url.search);
    // Append necessary parameters to the URL
    params.append('thread_id', thread_id);
    params.append('file_id', file_id);
    params.append('apiKey', apiKey ? apiKey : '');
    url.search = params.toString();
    // Show loader animation
    $('.loader').show();
    await authClient.fetch(url.toString(), { method:'DELETE' }).then((r) => {
        if (r.status != 204) {
            throw new Error (r.statusText);
        }
        showSuccessNotice(`${name} successfully deleted`);
    }).catch((e) => {
        // Handle any errors that occur during the deletion
        showFailureNotice(`Failed to delete ${name}: ` + e);
    });
    // Hide loader animation
    $('.loader').hide();
}

/**
 * Initializes the file upload modal and its related event handlers.
 */
function initFileUpload() {
    // Show the file upload modal when the upload button is clicked
    $('#file-upload-button').on('click', () => $('#attach-files-modal').show());
    // Hide the file upload modal when the close or done button is clicked
    $('.close, .done-button').on('click', () => { $('#attach-files-modal').hide(); });
    // Handle file input change event
    $('#file-input').on('change', (e) => handleFileInput(e.target.files));
}

/**
 * Initializes the drag and drop functionality for file uploads.
 */
function initFileDragAndDrop() {
    // Handle file drop event
    $('#drop_zone').on('drop', (ev) => { 
        ev.preventDefault(); 
        handleFileInput(ev.originalEvent.dataTransfer.files); 
    }).on('dragover', (ev) => ev.preventDefault());
    // Trigger file input click when the upload link is clicked
    $('#file-upload-link').on('click', () => $('#file-input').click());
}

/**
 * Handles the file input and uploads the file.
 * @param {FileList} files - The list of files to be uploaded.
 */
async function handleFileInput(files) {
    for (let file of files) {
        // Determine the file type
        const fileType = getSupportedFileType(file.name);
        if (fileType === 'application/octet-stream') { 
            showFailureNotice(`Files of type ${fileType} are not supported`);
            return;
        }
        // Check if the file size exceeds the limit
        if (file.size > 512000000) { 
            showFailureNotice(`File is too large ${file.size}, please reduce image size.`);
            return; 
        }

        $('.loader').show();

        // Create a URL for the file and fetch its blob data
        const imgURL = URL.createObjectURL(file);
        const r = await fetch(imgURL);
        const blob = await r.blob();
        // Store the file on the server
        const file_id = await storeFile(currentThread, file.name, file.type && file.type != '' ? file.type : fileType.mime, blob);

        // Create a file object and add it to the selected files list
        const fileObj = {
            id: file_id, 
            data: file
        };

        selectedFiles.push(fileObj);

        // Add the file to the modal list and display the selected files
        addFileToModalList(fileObj);
        displaySelectedFiles();

        // Reset the file input
        $('#file-input').val('');
    }
}

/**
 * Adds a file to the modal list.
 * @param {Object} fileObj - The file object containing file data and ID.
 */
function addFileToModalList(fileObj) {
    file = fileObj.data;
    // Create a table row for the file
    const $fileItem = $(`
        <tr>
            <td>${file.name}</td>
            <td>${formatFileSize(file.size)}</td>
            <td><button class="file-upload-delete">X</button></td>
        </tr>
    `);
    // Add an event handler to the delete button
    $fileItem.find('.file-upload-delete').on('click', () => {
        removeFile(file, fileObj);
    });
    // Append the file item to the uploaded files table
    $('#uploaded-files tbody').append($fileItem);
}

/**
 * Displays the selected files in the container.
 */
function displaySelectedFiles() {
    const $uploadedFilesContainer = $(".uploaded-files-container");
    $uploadedFilesContainer.empty();
    // Iterate through the selected files and create file items
    selectedFiles.forEach(fileObj => {
        const file = fileObj.data;
        const $fileItem = $(`
        <div class="file-upload-item">
            <img class="file-upload-item-img" src="svg/file-upload-img.jpeg" title="${file.name}">
            <button class="file-upload-delete">X</button>
        </div>
        `);

        // Add an event handler to the delete button
        $fileItem.find('.file-upload-delete').on('click', () => {
            removeFile(file, fileObj);
        });

        // Prepend the file item to the uploaded files container
        $uploadedFilesContainer.prepend($fileItem);
    });
}

/**
 * Removes a file from the server and updates the UI.
 * @param {string} thread_id - The ID of the thread associated with the file.
 * @param {Object} fileObj - The file object containing file data and ID.
 */
async function removeFile(thread_id, fileObj) {
    const file = fileObj.data;
    // Delete the file from the server
    await deleteFile(thread_id, fileObj.id, file.name);
    
    // Find the index of the file in the selected files array
    const index = selectedFiles.findIndex(f => f.id === fileObj.id);
    if (index > -1) {
        // Remove the file from the selected files array
        selectedFiles.splice(index, 1);
    }

    // Update both lists
    updateSelectedFiles();
    displaySelectedFiles();
}

/**
 * Updates the selected files list in the modal.
 */
function updateSelectedFiles() {
    $('#uploaded-files tbody').empty();
    // Add each selected file to the modal list
    selectedFiles.forEach(fileObj => {
        addFileToModalList(fileObj);
    });
}

/**
 * Clears the selected files list and the UI.
 */
function clearSelectedFiles() {
    selectedFiles = [];
    // Clear the uploaded files table and container
    $('#uploaded-files tbody').empty();
    $(".uploaded-files-container").empty();
}

/**
 * Formats the file size into a human-readable string.
 * @param {number} size - The size of the file in bytes.
 * @returns {string} - The formatted file size.
 */
function formatFileSize(size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0, formattedSize = size;
    // Convert the size to the appropriate unit
    while (formattedSize >= 1024 && unitIndex < units.length - 1) { 
        formattedSize /= 1024; 
        unitIndex++; 
    }
    return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
}
