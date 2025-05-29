class ImageViewer {
    constructor() {
        this.tabs = new Map(); // Map to store tab data
        this.currentTabId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.setupDragging();
        this.createNewTab();
        this.setupDragAndDrop();
    }

    initializeElements() {
        this.tabsContainer = document.getElementById('tabs');
        this.newTabButton = document.getElementById('newTabButton');
        this.directoryInput = document.getElementById('directoryInput');
        this.startButton = document.getElementById('startButton');
        this.imageGrid = document.getElementById('imageGrid');
        this.fullscreenView = document.getElementById('fullscreenView');
        this.fullscreenImage = document.getElementById('fullscreenImage');
        this.fullscreenImage2 = document.getElementById('fullscreenImage2');
        this.backButton = document.getElementById('backButton');
        this.prevButton = document.getElementById('prevButton');
        this.nextButton = document.getElementById('nextButton');
        this.navigationGroup = document.getElementById('navigationGroup');
        this.gifOnlyToggle = document.getElementById('gifOnlyToggle');

        // Get both sets of buttons (in controls and in fullscreen view)
        this.singleModeButtons = document.querySelectorAll('#singleModeButton');
        this.twoSideModeButtons = document.querySelectorAll('#twoSideModeButton');
        this.directionButtons = document.querySelectorAll('#directionButton');
    }

    createNewTab() {
        const tabId = Date.now().toString();
        const tabData = {
            images: [],
            currentIndex: 0,
            showGifsOnly: false,
            isTwoSideMode: false,
            isRightToLeft: true
        };
        this.tabs.set(tabId, tabData);

        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabId;
        tab.innerHTML = `
            <span>New Tab</span>
            <span class="tab-close">×</span>
        `;

        this.tabsContainer.insertBefore(tab, this.newTabButton);
        this.switchTab(tabId);
        return tabId;
    }

    switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tabId === tabId);
        });

        this.currentTabId = tabId;
        const tabData = this.tabs.get(tabId);

        // Update UI state
        this.gifOnlyToggle.checked = tabData.showGifsOnly;
        this.directionButtons.forEach(button => {
            button.textContent = tabData.isRightToLeft ? 'R→L' : 'L→R';
        });

        // Update view mode
        this.singleModeButtons.forEach(button => {
            button.classList.toggle('active', !tabData.isTwoSideMode);
        });
        this.twoSideModeButtons.forEach(button => {
            button.classList.toggle('active', tabData.isTwoSideMode);
        });

        // Display images
        this.displayImageGrid();
    }

    attachEventListeners() {
        this.newTabButton.addEventListener('click', () => this.createNewTab());

        this.tabsContainer.addEventListener('click', (e) => {
            // Find the closest tab element
            const tab = e.target.closest('.tab');
            if (tab) {
                if (e.target.classList.contains('tab-close')) {
                    this.closeTab(tab.dataset.tabId);
                } else {
                    this.switchTab(tab.dataset.tabId);
                }
            }
        });

        this.directoryInput.addEventListener('change', (e) => this.handleDirectorySelect(e));
        this.startButton.addEventListener('click', () => this.startSlideshow());
        this.backButton.addEventListener('click', () => this.exitFullscreen());
        this.prevButton.addEventListener('click', () => this.showPreviousImage());
        this.nextButton.addEventListener('click', () => this.showNextImage());
        this.gifOnlyToggle.addEventListener('change', () => this.toggleGifFilter());

        // Add event listeners to all mode buttons
        this.singleModeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setViewMode(false);
            });
        });

        this.twoSideModeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setViewMode(true);
            });
        });

        this.directionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleReadingDirection();
            });
        });

        // Add keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        // Add click handler for fullscreen view
        this.fullscreenView.addEventListener('click', (e) => {
            if (e.target === this.fullscreenView || e.target.classList.contains('images-container')) {
                this.exitFullscreen();
            }
        });

        // Prevent clicks on the images from triggering exit
        this.fullscreenImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        this.fullscreenImage2.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Prevent clicks on the navigation group from triggering exit
        this.navigationGroup.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Listen for directory opening events
        if (window.electron) {
            window.electron.ipcRenderer.on('open-directory', (event, dirPath) => {
                this.handleDirectoryPath(dirPath);
            });
        }
    }

    handleKeyboardNavigation(event) {
        if (!this.fullscreenView.classList.contains('active')) return;

        switch (event.key) {
            case 'ArrowLeft':
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                this.showNextImage();
                break;
            case 'Escape':
            case 'Backspace':
                this.exitFullscreen();
                break;
        }
    }

    closeTab(tabId) {
        const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
        if (tab) {
            tab.remove();
            this.tabs.delete(tabId);

            // If we closed the current tab, switch to another one
            if (tabId === this.currentTabId) {
                const remainingTabs = Array.from(this.tabs.keys());
                if (remainingTabs.length > 0) {
                    this.switchTab(remainingTabs[0]);
                } else {
                    this.createNewTab();
                }
            }
        }
    }

    getCurrentTabData() {
        return this.tabs.get(this.currentTabId);
    }

    handleDirectorySelect(event) {
        // If no tabs exist, create one first
        if (this.tabs.size === 0) {
            this.createNewTab();
        }

        const files = Array.from(event.target.files);
        const tabData = this.getCurrentTabData();

        // Clear existing images
        tabData.images = [];

        // Process each file
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                tabData.images.push(file);
            }
        });

        // Sort images by name
        tabData.images.sort((a, b) => a.name.localeCompare(b.name));

        // Update tab title
        const tab = document.querySelector(`.tab[data-tab-id="${this.currentTabId}"]`);
        if (tab) {
            const dirName = files[0]?.webkitRelativePath.split('/')[0] || 'New Tab';
            tab.querySelector('span:first-child').textContent = dirName;
        }

        // Display the images
        this.displayImageGrid();
    }

    displayImageGrid() {
        const tabData = this.getCurrentTabData();
        if (!tabData) return;

        this.imageGrid.innerHTML = '';
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        filteredImages.forEach((image, index) => {
            const div = document.createElement('div');
            div.className = 'image-item';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(image);
            img.alt = image.name;

            const typeBadge = document.createElement('div');
            typeBadge.className = 'type-badge';
            typeBadge.textContent = image.type.split('/')[1].toUpperCase();

            div.appendChild(img);
            div.appendChild(typeBadge);
            div.addEventListener('click', () => this.showImage(index));
            this.imageGrid.appendChild(div);
        });
    }

    setViewMode(isTwoSide) {
        const tabData = this.getCurrentTabData();
        tabData.isTwoSideMode = isTwoSide;
        this.fullscreenImage.classList.toggle('single', !isTwoSide);
        this.fullscreenImage2.style.display = isTwoSide ? 'block' : 'none';

        // Update all single mode buttons
        this.singleModeButtons.forEach(button => {
            button.classList.toggle('active', !isTwoSide);
        });

        // Update all two-side mode buttons
        this.twoSideModeButtons.forEach(button => {
            button.classList.toggle('active', isTwoSide);
        });

        this.updateImageLayout();
    }

    toggleReadingDirection() {
        const tabData = this.getCurrentTabData();
        tabData.isRightToLeft = !tabData.isRightToLeft;

        // Update all direction buttons
        this.directionButtons.forEach(button => {
            button.textContent = tabData.isRightToLeft ? 'R→L' : 'L→R';
        });

        // Swap the images if in two-side mode
        if (tabData.isTwoSideMode) {
            const tempSrc = this.fullscreenImage.src;
            this.fullscreenImage.src = this.fullscreenImage2.src;
            this.fullscreenImage2.src = tempSrc;
        }

        this.updateImageLayout();
    }

    toggleGifFilter() {
        const tabData = this.getCurrentTabData();
        tabData.showGifsOnly = this.gifOnlyToggle.checked;
        this.displayImageGrid();
    }

    showImage(index) {
        const tabData = this.getCurrentTabData();
        if (!tabData) return;

        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        if (index >= 0 && index < filteredImages.length) {
            tabData.currentIndex = index;
            const image = filteredImages[index];

            if (tabData.isTwoSideMode) {
                if (tabData.isRightToLeft) {
                    this.fullscreenImage.src = URL.createObjectURL(image);
                    if (index + 1 < filteredImages.length) {
                        this.fullscreenImage2.src = URL.createObjectURL(filteredImages[index + 1]);
                    } else {
                        this.fullscreenImage2.src = '';
                    }
                } else {
                    this.fullscreenImage2.src = URL.createObjectURL(image);
                    if (index + 1 < filteredImages.length) {
                        this.fullscreenImage.src = URL.createObjectURL(filteredImages[index + 1]);
                    } else {
                        this.fullscreenImage.src = '';
                    }
                }
            } else {
                this.fullscreenImage.src = URL.createObjectURL(image);
                this.fullscreenImage2.src = '';
            }

            this.fullscreenView.classList.add('active');
            this.updateImageLayout();
        }
    }

    showPreviousImage() {
        const tabData = this.getCurrentTabData();
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        const step = tabData.isTwoSideMode ? 2 : 1;
        const newIndex = Math.max(0, tabData.currentIndex - step);

        // Only show the image if we're not at the beginning
        if (newIndex !== tabData.currentIndex) {
            this.showImage(newIndex);
        }
    }

    showNextImage() {
        const tabData = this.getCurrentTabData();
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        const step = tabData.isTwoSideMode ? 2 : 1;
        const maxIndex = filteredImages.length - (tabData.isTwoSideMode ? 2 : 1);
        const newIndex = Math.min(maxIndex, tabData.currentIndex + step);

        // Only show the image if we're not at the end
        if (newIndex !== tabData.currentIndex) {
            this.showImage(newIndex);
        }
    }

    startSlideshow() {
        const tabData = this.getCurrentTabData();
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        if (filteredImages.length > 0) {
            tabData.currentIndex = 0;
            this.showImage(0);
        }
    }

    updateImageLayout() {
        const tabData = this.getCurrentTabData();
        if (tabData.isTwoSideMode) {
            this.fullscreenImage.classList.remove('single');
            this.fullscreenImage2.classList.remove('left', 'right');
            this.fullscreenImage.classList.remove('left', 'right');

            if (tabData.isRightToLeft) {
                this.fullscreenImage.classList.add('right');
                this.fullscreenImage2.classList.add('left');
            } else {
                this.fullscreenImage.classList.add('left');
                this.fullscreenImage2.classList.add('right');
            }
        } else {
            this.fullscreenImage.classList.remove('left', 'right');
            this.fullscreenImage2.classList.remove('left', 'right');
            this.fullscreenImage.classList.add('single');
        }
    }

    exitFullscreen() {
        this.fullscreenView.classList.remove('active');
        this.fullscreenImage.src = '';
        this.fullscreenImage2.src = '';
    }

    handleDirectoryPath(dirPath) {
        // If no tabs exist, create one first
        if (this.tabs.size === 0) {
            this.createNewTab();
        }

        // Create a new tab for the directory
        const tabId = this.createNewTab();
        const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
        if (tab) {
            const dirName = dirPath.split('/').pop();
            tab.querySelector('span:first-child').textContent = dirName;
        }
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Add visual feedback when dragging over the app
        ['dragenter', 'dragover'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                document.body.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                document.body.classList.remove('drag-over');
            }, false);
        });

        // Handle the drop event
        document.body.addEventListener('drop', (e) => {
            const items = e.dataTransfer.items;
            if (items) {
                // Create a new tab for the dropped folder
                const tabId = this.createNewTab();
                const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);

                // Process each dropped item
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();
                        if (entry && entry.isDirectory) {
                            // Update tab title with folder name
                            if (tab) {
                                tab.querySelector('span:first-child').textContent = entry.name;
                            }

                            // If we have access to the Electron API, use it to open the directory
                            if (window.electron) {
                                window.electron.ipcRenderer.send('open-directory', entry.fullPath);
                            }
                            break; // Only process the first directory
                        }
                    }
                }
            }
        }, false);
    }
}

// Initialize the image viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ImageViewer();
});