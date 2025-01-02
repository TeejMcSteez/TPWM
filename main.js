const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const FS = require('fs');
const enc = require('crypto');
const { start } = require('node:repl');

let mainWindow;
let userWindow;
let listWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

// Handle input from the renderer
ipcMain.on('input-data', (event, input) => {
    // Add data encryption within transmission
    try {
        const root = FS.readFileSync(__dirname + '/root.json');
        const rootJson = JSON.parse(root);

        if (input[0] === rootJson.uN && input[1] === rootJson.pwd) {
            console.log('Verified!');
            onceVerified();
        } else {
            console.log("False");
        }

    } catch (err) {
        console.error(err);
    }
});
const filePath = __dirname + "/users.json";

ipcMain.handle('add-new-info', (event, userInfo) => {
    try {
        let data = [];
        const exists = FS.existsSync;
        const empty = FS.readFileSync(filePath, 'utf-8').trim() !== ''; 
        if (exists && empty) {
            const fileContent = FS.readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } 

        data.push({
            Username: userInfo[0],
            Password: userInfo[1],
            Website: userInfo[2],
        });
        FS.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return {status: 'success'};

    } catch (err) {
        console.error(err);
        return { status: 'error', message: err.message};
    }
});

ipcMain.on('list-users', (event) => {
    userWindow.close();
    userWindow = null;

    listWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });

    listWindow.loadFile('listUsers.html');

    const userFileContent = FS.readFileSync(filePath);
    const data = JSON.parse(userFileContent);

    console.log(data);

    listWindow.webContents.send('send-list', data);
});

function onceVerified() {
    mainWindow.close();
    mainWindow = null;

    userWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });

    userWindow.loadFile('home.html');

    userWindow.on('closed', () => {
        userWindow = null;
    });

}

