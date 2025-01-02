const { contextBridge, ipcRenderer } = require('electron');

// Expose limited IPC APIs to the renderer
contextBridge.exposeInMainWorld('api', {
    sendInput: (input) => ipcRenderer.send('input-data', input), // Send input to the main process
    addNewInfo: (userInfo) => ipcRenderer.invoke('add-new-info', userInfo),
    listUsers: () => ipcRenderer.send('list-users'),
    sendList: (callback) => {
        // ensure the provided argument is a function
        if (typeof callback !== 'function') {
            throw new Error('callback must be a function');
        }
        // Listener for the send list event in the main process
        ipcRenderer.on('send-list', (event, userList) => { 
            // console.log(`Data recveived in preload ${userList}`); // debug
            callback(userList); // Pass thee received data to the renderer
        });
    },
});
