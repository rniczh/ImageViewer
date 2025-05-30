# Image Viewer

> 🤖 **Powered by AI** - This project was created and documented with AI assistance.

A simple image viewer built with Electron, designed for browsing image collections and comic books.

## Features

### 🖼️ **Multi-Tab Image Browsing**
- Open multiple image directories in separate tabs
- Easy tab management with close buttons
- Automatic tab naming based on directory names

### 📚 **Viewing Modes**
- **Single Page View**: View one image at a time
- **Two-Page View**: Side-by-side viewing perfect for comics and books
- **Reading Direction**: Switch between right-to-left and left-to-right layouts
- **Duplicate First Page**: Option to duplicate the first page in two-page mode

### 🎯 **Filtering & Labels**
- **GIF Filter**: Toggle to show only GIF images
- **Labels**: Display page numbers or filenames
- Click labels to switch between page numbers and filenames

### 🎮 **Intuitive Navigation**
- **Keyboard Controls**: Arrow keys for navigation, Escape to exit fullscreen
- **Mouse Navigation**: Click images to enter fullscreen, hover for controls

### 🎨 **Customizable Layout**
- **Gap Control**: Adjust spacing between images (0-20px)
- **Collapsible UI**: Hide/show control panels for distraction-free viewing

### 📁 **File Management**
- **Drag & Drop**: Drop folders directly onto the app to open them
- **Books Library**: Organize and quick-access your book collections
- **Multiple Format Support**: Supports common image formats (JPG, PNG, GIF, etc.)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd imageViewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm start
   ```

### Building for Distribution
```bash
npm run build
```

## Usage

### Opening Images
1. **File Picker**: Click "Start" and select a directory containing images
2. **Drag & Drop**: Drag a folder from your file manager onto the app window
3. **Choose Files**: Press the "choose files" button to load the files from directory
4. **Books Library**: Use the "Books" button to access your organized collection

### Navigation Controls
- **Mouse**: Click images to enter fullscreen mode
- **Keyboard**: Use arrow keys (←/→) to navigate, Escape to exit

### Viewing Modes
- **1**: Single page view
- **2**: Two-page view (side-by-side)
- **R/L**: Toggle reading direction (Right-to-left/Left-to-right)
- **⧇**: Duplicate first page in two-page mode

### Customization
- **Gap Control**: Hover near the top of fullscreen view to adjust image spacing
- **Labels**: Toggle to show/hide page numbers and filenames
- **GIFs**: Filter to show only animated GIF images
- **Options**: Configure books library path and other settings

## Configuration

### Books Library Setup
1. Click "Options" in the main toolbar
2. Set your "Books Path" to the directory containing your book collections
3. Press "Books" and the app will automatically scan subdirectories as individual books


### Settings Storage
- User preferences are stored locally using localStorage
- Settings persist between application sessions

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous image/page |
| `→` | Next image/page |
| `Escape` | Exit fullscreen |
| `Backspace` | Exit fullscreen |

## File Structure

```
imageViewer/
├── index.html          # Main application UI
├── script.js           # Core application logic
├── main.js             # Electron main process
├── preload.js          # Electron preload script
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Features in Detail

### Switch Toggles
Modern toggle switches with hover tooltips:
- **GIFs Toggle**: "Only show GIF images in the gallery"
- **Labels Toggle**: "Show page number and filename. Click label to switch between them"

## Development

### Running in Development Mode
```bash
npm start
```

### Project Structure
- `main.js`: Electron main process, handles file system operations
- `preload.js`: Secure bridge between main and renderer processes
- `index.html`: Application UI and styling
- `script.js`: Core application logic and image handling

## TODO

- [ ] Add an icon for this app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, feature requests, or questions, please [create an issue](link-to-issues) in the repository.

