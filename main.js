const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

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

// IPC handlers for books functionality
ipcMain.on('get-books-list', async (event, booksPath) => {
    try {
        const books = await getBooksList(booksPath);
        event.reply('books-list-response', books);
    } catch (error) {
        console.error('Error getting books list:', error);
        event.reply('books-list-response', []);
    }
});

ipcMain.on('open-directory', (event, dirPath) => {
    // Read directory contents and send back image files
    try {
        const imageFiles = getImageFilesFromDirectory(dirPath);
        const responseData = {
            dirPath: dirPath,
            files: imageFiles
        };
        event.sender.send('directory-files-loaded', responseData);
    } catch (error) {
        console.error('Error reading directory:', error);
        event.sender.send('directory-files-loaded', {
            dirPath: dirPath,
            files: []
        });
    }
});

// Function to get books list from directory
async function getBooksList(booksPath) {
    if (!fs.existsSync(booksPath)) {
        throw new Error('Books path does not exist');
    }

    const items = fs.readdirSync(booksPath, { withFileTypes: true });
    const books = [];

    for (const item of items) {
        if (item.isDirectory()) {
            const dirPath = path.join(booksPath, item.name);
            const stats = fs.statSync(dirPath);

            // Get first image as preview
            const previewImage = await getFirstImageInDirectory(dirPath);

            books.push({
                name: item.name,
                path: dirPath,
                createdTime: stats.birthtime,
                previewImage: previewImage
            });
        }
    }

    // Sort by creation time (newest first)
    books.sort((a, b) => b.createdTime - a.createdTime);

    return books;
}

// Function to get first image in directory
async function getFirstImageInDirectory(dirPath) {
    try {
        const files = fs.readdirSync(dirPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
                const imagePath = path.join(dirPath, file);
                // Return file:// URL for the image
                return `file://${imagePath}`;
            }
        }
        return null;
    } catch (error) {
        console.error('Error reading directory for preview:', error);
        return null;
    }
}

// Function to get all image files from a directory
function getImageFilesFromDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }

    const files = fs.readdirSync(dirPath);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const imageFiles = [];

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
            const filePath = path.join(dirPath, file);
            try {
                const stats = fs.statSync(filePath);

                const imageFile = {
                    name: file,
                    path: filePath,
                    size: stats.size,
                    type: `image/${ext.slice(1)}`,
                    lastModified: stats.mtime.getTime()
                };

                imageFiles.push(imageFile);
            } catch (statError) {
                console.error('Error reading file stats for:', filePath, statError);
            }
        }
    });

    // Sort files by name
    imageFiles.sort((a, b) => a.name.localeCompare(b.name));

    return imageFiles;
}