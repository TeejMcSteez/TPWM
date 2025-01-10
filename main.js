/**
 * @todo Add a way to setup the file system properly and for node to decide whether or not that the system is 
 * a windows or linux enviroment
 * @todo See about file encryption/compression and obufscation within different OS file systems
 * @todo Make look pretty with tailwind
 * @todo Add a feature to import and export user data so one can download the app and import the data
 * to use on the app to a new machine making it *syncable*
 * 
 * @link Documentation guidelines: https://jsdoc.app/
 * @link Docs
 * FS - https://nodejs.org/api/fs.html
 * Path - https://nodejs.org/api/path.html
 * Crypto - https://nodejs.org/api/crypto.html
 * Generate-Password - https://www.npmjs.com/package/generate-password
 * Crypto-js - https://www.npmjs.com/package/crypto-js
 * Dotenv - https://www.npmjs.com/package/dotenv
 */
const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const FS = require('node:fs');
const path = require('node:path');
const enc = require('node:crypto');
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

    mainWindow.loadFile(path.join(__dirname, '/public/index.html'));

});

/**
 * @description Handle input from the renderer
 * @param {Array.input[username, password]}  
 */
ipcMain.on('input-data', (event, input) => {
    /** 
     * @description Used for development to encrypt usernames and passwords
     * I need to make real functions for it but this is what I am 
     * using for development. 
     */
    // const username = "username";
    // const password = "password";

    // const cipherUsername = encryptor.AES.encrypt(username, process.env.rootKey);
    // const cipherPassword = encryptor.AES.encrypt(password, process.env.rootKey);

    // console.log(`Encrypted Username: ${cipherUsername}, Password: ${cipherPassword}`);

    // Add data encryption within transmission
    try {
        const root = FS.readFileSync(rootPath);
        const rootJson = JSON.parse(root);

        // Need to figure out a way to properly encrypt and decrypt information using crpyto-js
        const valid = (encryptor.AES.decrypt(rootJson.uN, process.env.rootKey).toString(encryptor.enc.Utf8) === input[0]) && (encryptor.AES.decrypt(rootJson.pwd, process.env.rootKey).toString(encryptor.enc.Utf8) === input[1]);

        if (valid) {
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
/** 
 * @description - Handles input from home file to add a new user information to the userfile
 * @param event - Event triggered from renderer
 * @param {Array.<UserInfo>[Username, Password, Website]} - Username, Password and Website
 */
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
/**
 * @description List decrypted user information from user file
 * @param {Event} - triggered by renderer
 */
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
    
    mainWindow.loadFile(path.join(__dirname, '/public/listUsers.html'));

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
/**
 * @description When the user is authed successfully redirects to home page
 * @param {Event} - event triggered by renderer
 */
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

    mainWindow.loadFile(path.join(__dirname, '/public/home.html'));
});
/**
 * @description Generates random password for the user to use in the new login info
 * @param {Event} - event triggered by renderer
 */
ipcMain.on('generatePassword', (event) => {
    // generating secure password here
    const password = pass.generate({length: 12, numbers: true, uppercase: true, symbols: true, strict: true});

    mainWindow.webContents.send('sendPassword', password);
});
/**
 * @description Once verified redirects user to the home page
 * @link icpMain.on('input-data', ...
 */
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

    mainWindow.loadFile(path.join(__dirname, '/public/home.html'));
}