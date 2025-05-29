const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // Enable access to file paths
        }
    });

    mainWindow.loadFile('index.html');

    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
}

// Handle the 'open-file' event
app.on('open-file', (event, filePath) => {
    event.preventDefault();

    // If the window is not created yet, store the path
    if (!mainWindow) {
        app.whenReady().then(() => {
            createWindow();
            mainWindow.webContents.on('did-finish-load', () => {
                mainWindow.webContents.send('open-directory', filePath);
            });
        });
    } else {
        mainWindow.webContents.send('open-directory', filePath);
    }
});

app.whenReady().then(() => {
    // Register the app as a handler for directories
    app.setAsDefaultProtocolClient('file');

    // Create the window if it wasn't created by the open-file event
    if (!mainWindow) {
        createWindow();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});