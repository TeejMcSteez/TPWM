const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const FS = require('fs');
const enc = require('crypto');
const pass = require('generate-password');
const encryptor = require('crypto-js')
require('dotenv').config();

let mainWindow;
const key = process.env.keyPass;
const rootPath = process.env.rootPath;

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
        const root = FS.readFileSync(__dirname + rootPath);
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
        const encryptedUsername = encryptor.AES.encrypt(userInfo[0], key).toString();
        const encryptedPassword = encryptor.AES.encrypt(userInfo[1], key).toString();
        const encryptedWebsite = encryptor.AES.encrypt(userInfo[2], key).toString();
        data.push({ // User info indexes are
            Username: encryptedUsername,
            Password: encryptedPassword,
            Website: encryptedWebsite,
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

    data.forEach(user => {
        const decryptedUsername = encryptor.AES.decrypt(user.Username, key).toString(encryptor.enc.Utf8);
        const decryptedPassword = encryptor.AES.decrypt(user.Password, key).toString(encryptor.enc.Utf8);
        const decryptedWebsite = encryptor.AES.decrypt(user.Website, key).toString(encryptor.enc.Utf8);

        user.Username = decryptedUsername
        user.Password = decryptedPassword;
        user.Website = decryptedWebsite;
    });

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