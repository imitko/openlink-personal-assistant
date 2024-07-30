/**
 * Initializes the user interface.
 */
function initUI() {
    $('.model-configuration-fields').hide();

    document.getElementById('delete-assistant').addEventListener('click', function() {
        deleteAssistant(document.querySelector('.assistant-id.field-id').textContent);
    });

    // Event listener for the Save button
    // TODO: clean this section
    document.getElementById('save-assistant-button').addEventListener('click', saveAssistantConfiguration);
    document.getElementById('new-assistant').addEventListener('click', clearAssistant);
    document.getElementById('clone-assistant-button').addEventListener('click', cloneAssistant);

    initThreadsDropdown();
    initAssistantsDropdown();
    initModelsDropdown();
    initFileSearchDropdown();
    initUserInputField();
    initApiKeyModal();
    initLoginModal();
    initShareThreadModal();
    initPersonalStorageModal();
    initFunctionsModal();

    initTemperature();
    initTopP();
    initMaxTokens();
    initMaxThreads();
    initSessionReplaySpeed();
    initShareSessionReplaySpeed();

    initAssistantSuggestions();
    initAssistantOpenClose();

    // initFileUpload();
    initCodeBlock();

    // initFileDragAndDrop();

    $('.new-thread').on('click', function() {
        createNewThread();
    });

    // Authentication
    $('.login-button').on('click', authLogin);
    $('.logout-button').on('click', authLogout);

    $('#run-submit').on('click', handleUserInput);

    // Copy message to clipboard
    $(document).on('click', '.message-copy', function() {
        copyMessageToClipboard($(this).closest('.chat-message').find('.message-body')[0]);
    });

    // Event handler for copying message permalink to clipboard
    $(document).on('click', '.message-permalink', function() {
        const messageId = $(this).closest('.chat-message').data('message-id');
        copyLinkToClipboard(currentThread, messageId);
    });

    // Delete message
    $(document).on('click', '.message-delete', function() {
        if (!checkApiKey()) return;

        if (!loggedIn) {
            $("#login-modal").show();
            $('.loader').css('display', 'none');
        } else {
            const messageId = $(this).closest('.chat-message').data('message-id');
            if (confirm('Are you sure you want to delete this message?')) {
                deleteMessage(messageId);
            }
        }
    });
}

/**
 * Expandable textbox functionality for user input field.
 */
function initUserInputField() {
    var $textarea = $('#user-input');
    $textarea.on('input', function() {
        this.style.height = 'auto'; // Reset the height
        this.style.height = Math.min(this.scrollHeight, 400) + 'px'; // Set height
    }).trigger('input'); // Initialize height

    // Add event listener for keypress to handle Enter and Shift+Enter
    $textarea.on('keypress', function(e) {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Insert a line break
                const cursorPosition = this.selectionStart;
                const value = $textarea.val();
                $textarea.val(value.substring(0, cursorPosition) + '\n' + value.substring(cursorPosition));
                this.selectionStart = cursorPosition + 1;
                this.selectionEnd = cursorPosition + 1;
                e.preventDefault(); // Prevent the default action
            } else {
                // Trigger the run button click
                $('#run-submit').click();
                e.preventDefault(); // Prevent the default action
                this.style.height = 'auto';
            }
        }
    });
}

/**
 * Threads dropdown functionality.
 */
function initThreadsDropdown() {
    const dropdown = $(".threads-dropdown");
    dropdown.find(".threads-dropdown-btn").on("click", () => dropdown.find(".threads-dropdown-menu").toggle());

    $(document).on("click", event => {
        if (!$(event.target).closest('.threads-dropdown, .threads-dropdown-item-actions').length) {
            dropdown.find(".threads-dropdown-menu").hide();
            $('.threads-dropdown-item-actions').hide(); // Hide all more options menus when clicking outside
            $('.threads-dropdown-item').removeClass('hover');
        }
    });

    dropdown.find(".threads-dropdown-menu").on("click", ".threads-dropdown-item", function(event) {
        // Logic associated with clicking a threads-dropdown-item
        if (!checkApiKey()) return;

        $('.threads-dropdown-text').text($(this).text());
        currentThread = $(this).text();
        loadConversation($(this).data('chat-id'));
        dropdown.find(".threads-dropdown-menu").hide();
        $('.threads-dropdown-item-actions').hide();
        $('.threads-dropdown-item').removeClass('hover');
    });
}

/**
 * Assistants dropdown functionality.
 */
function initAssistantsDropdown() {
    const dropdown = $(".assistants-dropdown");

    dropdown.find(".assistants-dropdown-btn").on("click", () => {
        dropdown.find(".assistants-dropdown-menu").toggle();
    });

    $(document).on("click", event => {
        if (!$(event.target).closest('.assistants-dropdown').length) {
            dropdown.find(".assistants-dropdown-menu").hide();
            $('.assistants-dropdown-item').removeClass('hover');
        }
    });
}

/**
 * Models dropdown functionality.
 */
function initModelsDropdown() {
    const dropdown = $(".models-dropdown");
    dropdown.find(".models-dropdown-btn").on("click", () => {
        dropdown.find(".models-dropdown-menu").toggle();
    });

    $(document).on("click", event => {
        if (!$(event.target).closest('.models-dropdown').length) {
            dropdown.find(".models-dropdown-menu").hide();
            $('.models-dropdown-item').removeClass('hover');
        }
    });
}

/**
 * File search dropdown functionality.
 */
function initFileSearchDropdown() {
    $('#import-thread-button').on('click', function() {
        $('#import-thread-modal').toggle();
    });

    $(document).on('click', function(event) {
        if (!$(event.target).closest('#import-thread-button').length) {
            $('#import-thread-modal').hide();
        }
    });
}

/**
 * Initializes the API key modal functionality.
 */
function initApiKeyModal() {
    const $apiKeyModal = $("#api-key-modal");
    const $inputField = $("#api-key-input");
    const apiKey = localStorage.getItem('openlinksw.com:opal:gpt-api-key');

    // apiKey ? $inputField.val(apiKey) : $apiKeyModal.show();

    $(".icon-button[title='Api Key']").on("click", () => {
        $apiKeyModal.show();
        $inputField.val(apiKey || "");
    });

    $(".close").on("click", () => $apiKeyModal.hide());

    $("#save-api-key").on("click", () => {
        const key = $inputField.val();
        if (key) {
            localStorage.setItem('openlinksw.com:opal:gpt-api-key', key);
            $apiKeyModal.hide();
        } else showFailureNotice("Please enter a valid API key.");
    });

    $("#remove-api-key").on("click", () => {
        localStorage.removeItem('openlinksw.com:opal:gpt-api-key');
        $apiKeyModal.hide();
    });
}

/**
 * Initializes the login modal functionality.
 */
function initLoginModal() {
    const $loginModal = $("#login-modal");
    $(".close").on("click", () => $loginModal.hide());
}

/**
 * Initializes the share modal functionality.
 */
function initShareThreadModal() {
    const $shareThreadModal = $("#share-thread-modal");

    $(".icon-button[title='Share']").on("click", () => {
        $shareThreadModal.show();
        $('#personal-storage-export-input').val(localStorage.getItem('openlinksw.com:opal:personal-storage'));
        // $inputField.val(apiKey || "");
    });

    $(".close").on("click", () => $shareThreadModal.hide());

    $("#share-link").on("click", () => {
        copyLinkToClipboard(currentThread);
        $shareThreadModal.hide();
    });

    $("#copy-messages").on("click", () => {
        copyAllMessagesToClipboard();
        $shareThreadModal.hide();
    });

    $('#personal-storage-export-input').on('keyup', (e) => { 
        storageFolder = e.currentTarget.value; 
        storageFolder !== null && localStorage.setItem('openlinksw.com:opal:personal-storage', storageFolder);

    });

    $("#export-chat").on("click", () => {
        exportSession(currentThread);
        $shareThreadModal.hide();
    });
}

/**
 * Initializes the personal storage modal functionality.
 */
function initPersonalStorageModal() {
    // Event handler for showing the modal
    $('#import-thread-modal').on('click', '#personal-storage', function() {
        $('#personal-storage-modal').show();
        // Set the value of the modal's input field to the current personal storage input field value
        $('#personal-storage-import-input').val(localStorage.getItem('openlinksw.com:opal:personal-storage'));
    });

    $('#import-thread-modal').on('click', '#local-storage', function() {
        $('#local-storage-thread-input').click();
    });
    
    $('#local-storage-thread-input').on('change', handleFileSelect);

    // Event handler for closing the modal
    $('.close').on('click', function() {
        $('#personal-storage-modal').hide();
    });

    // Event handler for the search button
    $('#search-storage').on('click', function() {
        listStorage(); // Call the listStorage function
    });

    $('#personal-storage-import-input').on('keyup', (e) => { 
        storageFolder = e.currentTarget.value;
        storageFolder !== null && localStorage.setItem('openlinksw.com:opal:personal-storage', storageFolder); 
    });

    // Event handler for clicking on a storage item
    $(document).on('click', '.file-storage-thread-item', function() {
        loadFromStorage($(this).data('url'));
        $('#personal-storage-modal').hide();
    });
}

function initFunctionsModal() {
    $('.functions-btn').on('click', function() {
        $('#function-modal').show();
    });

    $(".close").on("click", () => $('#function-modal').hide());

    const placeholderText = `{
        "name": "get_weather",
        "description": "Determine weather in my location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state e.g. San Francisco, CA"
                },
                "unit": {
                    "type": "string",
                    "enum": [
                        "C",
                        "F"
                    ]
                }
            },
            "required": [
                "location"
            ]
        }
    }`;    

    $('#function-input').attr('placeholder', placeholderText.trim());
}

function initTemperature() {
    const minTemperature = parseFloat($('#temperature_in').attr('min'));
    const maxTemperature = parseFloat($('#temperature_in').attr('max'));
    // Function to track the temperature value
    const trackTemperature = (value) => {
        temperature = parseFloat(value);
    };

    // Function to set the value of the slider and input field
    const setTemperature = (value) => {
        $('#temperature').val(value);
        $('#temperature_in').val(value);
    };

    // Update input field when slider changes
    $('#temperature_in').on('input', function() {
        const value = $(this).val();
        $('#temperature').val(value);
        trackTemperature(value);
    });

    // Update slider when input field changes
    $('#temperature').on('input', function() {
        const value = $(this).val();
        if (value >= minTemperature && value <= maxTemperature) {
            $('#temperature_in').val(value);
            trackTemperature(value);
        }
    });
}

function initTopP() {
    const minTopP = parseFloat($('#top_p_in').attr('min'));
    const maxTopP = parseFloat($('#top_p_in').attr('max'));
    // Function to track the temperature value
    const trackTopP = (value) => {
        top_p = parseFloat(value);
    };

    // Function to set the value of the slider and input field
    const setTemperature = (value) => {
        $('#top_p').val(value);
        $('#top_p_in').val(value);
    };

    // Update input field when slider changes
    $('#top_p_in').on('input', function() {
        const value = $(this).val();
        $('#top_p').val(value);
        trackTopP(value);
    });

    // Update slider when input field changes
    $('#top_p').on('input', function() {
        const value = $(this).val();
        if (value >= minTopP && value <= maxTopP) {
            $('#top_p_in').val(value);
            trackTopP(value);
        }
    });
}

function initMaxTokens() {
    const minMaxTokens = parseFloat($('#max_tokens_in').attr('min'));
    const maxMaxTokens = parseFloat($('#max_tokens_in').attr('max'));
    // Function to track the temperature value
    const trackMaxTokens = (value) => {
        max_tokens = parseInt(value, 10);
    };

    // Function to set the value of the slider and input field
    const setMaxTokens = (value) => {
        $('#max_tokens').val(value);
        $('#max_tokens_in').val(value);
    };

    // Update input field when slider changes
    $('#max_tokens_in').on('input', function() {
        const value = $(this).val();
        $('#max_tokens').val(value);
        trackMaxTokens(value);
    });

    // Update slider when input field changes
    $('#max_tokens').on('input', function() {
        const value = $(this).val();
        if (value >= minMaxTokens && value <= maxMaxTokens) {
            $('#max_tokens_in').val(value);
            trackMaxTokens(value);
        }
    });
}

function initMaxThreads() {
    const minMaxthreads = parseFloat($('#max_threads_in').attr('min'));
    const maxMaxthreads = parseFloat($('#max_threads_in').attr('max'));
    // Function to track the temperature value
    const trackMaxthreads = (value) => {
        max_threads = parseInt(value, 10);
    };

    // Function to set the value of the slider and input field
    const setMaxthreads = (value) => {
        $('#max_threads').val(value);
        $('#max_threads_in').val(value);
    };

    // Update input field when slider changes
    $('#max_threads_in').on('input', function() {
        const value = $(this).val();
        $('#max_threads').val(value);
        trackMaxthreads(value);
    });

    // Update slider when input field changes
    $('#max_threads').on('input', function() {
        const value = $(this).val();
        if (value >= minMaxthreads && value <= maxMaxthreads) {
            $('#max_threads_in').val(value);
            trackMaxthreads(value);
        }
    });
}

function initSessionReplaySpeed() {
    if (sharedItem.length && Number.isFinite(sharedSessionAnimation)) {
        $('#animation_speed_in').val(sharedSessionAnimation);
        animate_session = sharedSessionAnimation;
    }

    animate_session = $('#animation_speed_in').val()

    $('#animation_speed_in').on('input', function() {
        const value = $(this).val();
        animate_session = parseInt(value, 10);
    });
}

function initShareSessionReplaySpeed() {
    const maxAnimationSpeed = parseFloat($('#share_animation_speed_in').attr('max'));
    sharedSessionAnimation = Math.min(sharedSessionAnimation, maxAnimationSpeed);
    $('#share_animation_speed_in').val(sharedSessionAnimation)

    $('#share_animation_speed_in').on('input', function() {
        const value = $(this).val();
        sharedSessionAnimation = parseInt(value, 10);
        console.log(sharedSessionAnimation)
    });
}

function initAssistantSuggestions() {
    var $suggestions = $('.assistants-suggestions-dropdown');
    $('#user-input').on('keyup', function(e) {
        let $mentionInput = $('#user-input');
        let text = this.value.trim();
        if (text.split(/\s+/).length === 1 && text.match(/^@\w*$/)) {
            let query = text.substring(1).toLowerCase();
            let matches = assistants.filter(function(item) {
                return item.name.toLowerCase().startsWith(query);
            });
            e.preventDefault();
            if (matches.length > 0) {
                var suggestionsHtml = matches.map(function(item) {
                    return `<div class="assistants-suggestions-item" data-assist-id="${item.id}">${item.name}</div>`;
                }).join('');
                $suggestions.html(suggestionsHtml).show();
                $suggestions.css({
                                 bottom: $mentionInput.position().top + $mentionInput.outerHeight() + 30,
                                 left: $mentionInput.position().left + 10
                });
            } else {
                $suggestions.hide();
            }
        } else {
            $suggestions.hide();
        }
    });

    $suggestions.on('click', '.assistants-suggestions-item', function() {
        let $mentionInput = $('#user-input');
        let selectedAssistant = $(this).text();
        let text = $mentionInput.val();
        let caretPos = $mentionInput[0].selectionStart;
        let beforeCaret = text.substring(0, caretPos).replace(/@\w*$/, '@[' + selectedAssistant + '] ');
        let afterCaret = text.substring(caretPos);
        setAssistant($(this).attr('data-assist-id'));
        $mentionInput.val(beforeCaret + afterCaret);
        $mentionInput.focus();
        $suggestions.hide();
    });
}

function initAssistantOpenClose() {
    $('#open-assistant-configuration-btn').on('click',function() {
        $('.assistant-configuration').show();
        $('#open-assistant-configuration-btn').hide();
        $('#close-assistant-configuration-btn').show();
    });
    $('#close-assistant-configuration-btn').on('click',function() {
        $('.assistant-configuration').hide();
        $('#close-assistant-configuration-btn').hide();
        $('#open-assistant-configuration-btn').show();
    });
}

// function initFileUpload() {
//     // Trigger file upload dialog when file upload button is clicked
//     $('#file-upload-button').on('click', function() {
//         $('#fs-upload').trigger('click');
//     });

//     // Handle file selection
//     $('#fs-upload').on('change', async function(e) {
//         if (currentThread == undefined) {
//             showFailureNotice("Please select a thread to upload file to");
//             return;
//         }

//         const $uploadedFilesContainer = $(".uploaded-files-container");

//         // Process each selected file
//         const filePromises = Array.from(e.currentTarget.files).map(async file => {
//             const fileType = getSupportedFileType(file.name);
//             if ('application/octet-stream' === fileType.mime) {
//                 showFailureNotice(`Files of type ${file.type} are not supported`);
//                 return;
//             }
//             if (!file.type) file.type = fileType.mime;
//             if (file.size > 512000000) {
//                 showFailureNotice(`File is too large ${file.size}, please reduce image size.`);
//                 return;
//             }

//             let imgURL = URL.createObjectURL(file);

//             // Create HTML for the uploaded file display
//             const $fileItem = $(`
//                 <div class="file-upload-item">
//                     <img class="file-upload-item-img" src="svg/file-upload-img.jpeg" title="${file.name}" data-file-url="${imgURL}">
//                     <button class="file-upload-delete">x</button>
//                 </div>
//             `);

//             $uploadedFilesContainer.prepend($fileItem);

//             // Process the image URL as per the given exact lines
//             const img = $fileItem.find('.file-upload-item-img')[0];
//             const r = await fetch($(img).attr('data-file-url'));
//             const blob = await r.blob();
//             const file_id = await storeFile(currentThread, file.name, file.type && file.type != '' ? file.type : fileType.mime, blob);
//             if (file_id) {
//                 $(img).attr('id', file_id);
//                 $(img).attr('data-file', true);
//             }
//             $(img).removeAttr('data-file-url');

//             $fileItem.find('.file-upload-delete').on('click', function (e) {
//                 deleteFile(currentThread, file_id).then(() => { $fileItem.remove() });
//             });
//         });

//         await Promise.all(filePromises);
//     });
// }

function initCodeBlock() {
    $(document).on('change', '.chat-message select.code-type', (ev) => {
        if (ev.target && ev.target.matches('select.code-type')) {
            const parent = ev.target.closest('.code-container');
            if (parent) {
                const start = parent.querySelector('div.nano_start');
                const end = parent.querySelector('div.nano_end');
                const selectedOption = ev.target.options[ev.target.selectedIndex];
                const sel = selectedOption.id;
                let name = null;

                switch (sel) {
                    case 'turtle': name = 'RDF-Turtle'; break;
                    case 'jsonld': name = 'JSON-LD'; break;
                    case 'json': name = 'JSON'; break;
                    case 'csv': name = 'CSV'; break;
                    case 'rdfxml': name = 'RDF/XML'; break;
                    case 'markdown': name = 'Markdown'; break;
                    case 'rss': name = 'RSS'; break;
                    case 'atom': name = 'Atom'; break;
                }

                if (name) {
                    start.textContent = '## ' + name + ' Start ##';
                    end.textContent = '## ' + name + ' Stop ##';
                } else {
                    start.textContent = '';
                    end.textContent = '';
                }
            }
        }
    }); 

    $(document).on('click', '.chat-message .clipboard', function() {
        const codeContainer = $(this).closest('.code-container');
        const codeBlock = codeContainer.find('pre code')[0]; // Get the actual DOM element
        copyMessageToClipboard(codeBlock);
    });
    
    $(document).on('click', '.chat-message .download', function() {
        const codeContainer = this.closest('.code-container');
        const codeBlock = codeContainer.querySelector('pre code');
        const selectedOption = codeContainer.querySelector('select.code-type');
        const selectedId = selectedOption && selectedOption.selectedIndex >= 0 ? selectedOption.options[selectedOption.selectedIndex].id : null;
    
        const prompt_id = this.closest('.chat-message').dataset.promptId;
        const content = codeBlock.textContent;
        const mime = selectedId ? 
            (selectedId.match(/json/) ? 'application/json' : selectedId.match(/xml|rss|atom/) ? 'application/xml' : 'text/plain') : 'text/plain';
        const ext = selectedId ? 
            (selectedId.match(/json/) ? 'json' : selectedId.match(/xml|rss|atom/) ? 'xml' : 'txt') : 'txt';
        const file = `${prompt_id}.${ext}`;
    
        downloadContent(content, file, mime);
    });
}

// function initFileDragAndDrop() {
//     const $dropZone = $('#drop_zone');

//     function formatFileSize(size) {
//         const units = ['B', 'KB', 'MB', 'GB', 'TB'];
//         let unitIndex = 0;
//         let formattedSize = size;

//         while (formattedSize >= 1024 && unitIndex < units.length - 1) {
//             formattedSize /= 1024;
//             unitIndex++;
//         }

//         return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
//     }

//     function displayUploadedFile(file) {
//         const $uploadedFilesTable = $('#uploaded-files tbody');
//         const $newRow = $('<tr></tr>');

//         const $fileNameCell = $('<td></td>').text(file.name);
//         const $fileSizeCell = $('<td></td>').text(formatFileSize(file.size));
//         const now = new Date();
//         const $fileUploadedCell = $('<td></td>').text(now.toLocaleString());

//         const $deleteCell = $('<td></td>');
//         const $deleteBtn = $('<span></span>').text('🗑️').addClass('delete-btn').on('click', () => {
//             $newRow.remove();
//         });

//         $deleteCell.append($deleteBtn);
//         $newRow.append($fileNameCell, $fileSizeCell, $fileUploadedCell, $deleteCell);

//         $uploadedFilesTable.append($newRow);
//     }

//     // Handle the drag and drop functionality
//     function dropHandler(ev) {
//         ev.preventDefault();
//         console.log("File(s) dropped");

//         const dataTransfer = ev.originalEvent.dataTransfer;

//         if (dataTransfer.items) {
//             // Use DataTransferItemList interface to access the file(s)
//             [...dataTransfer.items].forEach((item, i) => {
//                 if (item.kind === "file") {
//                     const file = item.getAsFile();
//                     console.log(`… file[${i}].name = ${file.name}`);
//                     displayUploadedFile(file);
//                 }
//             });
//         } else {
//             // Use DataTransfer interface to access the file(s)
//             [...dataTransfer.files].forEach((file, i) => {
//                 console.log(`… file[${i}].name = ${file.name}`);
//                 displayUploadedFile(file);
//             });
//         }
//     }

//     function dragOverHandler(ev) {
//         ev.preventDefault();
//         console.log("File(s) in drop zone");
//     }

//     $dropZone.on('drop', dropHandler);
//     $dropZone.on('dragover', dragOverHandler);

//     // File upload link click handler
//     $('#file-upload-link').on('click', function() {
//         $('#file-input').click();
//     });

//     // Handle file input change
//     $('#file-input').on('change', function(event) {
//         const files = event.target.files;
//         for (let i = 0; i < files.length; i++) {
//             console.log(`File ${i}: ${files[i].name}`);
//             displayUploadedFile(files[i]);
//         }
//     });
// }