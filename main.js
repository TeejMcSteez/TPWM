const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const FS = require('fs');
const enc = require('crypto');
const pass = require('generate-password');
require('dotenv').config();

let mainWindow;

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
        const exists = FS.existsSync(filePath);
        if (!exists) {
            FS.appendFileSync(filePath, '');
        }

        const empty = FS.readFileSync(filePath, 'utf-8').trim() !== ''; 
        if (exists && empty) {
            const fileContent = FS.readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileContent);
        } 

        data.push({
            Username: userInfo[1],
            Password:userInfo[1],
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
    mainWindow.close();
    
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });
    
    mainWindow.loadFile('listUsers.html');

    const userFileContent = FS.readFileSync(filePath);
    const data = JSON.parse(userFileContent);


    console.log(data);

    mainWindow.webContents.send('send-list', data);
});

ipcMain.on('home', (event) => {
    mainWindow.close();

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });

    mainWindow.loadFile('home.html');
});

ipcMain.on('generatePassword', (event) => {
    // generating secure password here
    const password = pass.generate({length: 12, numbers: true, uppercase: true, symbols: true, strict: true});

    mainWindow.webContents.send('sendPassword', password);
});

function onceVerified() {
    mainWindow.close();

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true, // Enforce isolation
            preload: __dirname + '/preload.js', // Load preload script
        },
    });

    mainWindow.loadFile('home.html');
}
const key = Buffer.from(process.env.keyPass, 'utf-8');
const iv = Buffer.from(process.env.ivPass, 'utf-8');

function encryptData(data) {
    const cipher = enc.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final("hex");
    return encrypted;
}
function decryptData(data) {
    
}