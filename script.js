class ImageViewer {
    constructor() {
        this.tabs = new Map(); // Map to store tab data
        this.currentTabId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.createNewTab();
        this.setupDragAndDrop();

        // Initialize gap control with default value
        setTimeout(() => {
            this.setGap(0); // Default to compact mode
        }, 100);

        // Initialize tooltips
        this.setupTooltips();
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
        this.fullscreenFilename1 = document.getElementById('fullscreenFilename1');
        this.fullscreenFilename2 = document.getElementById('fullscreenFilename2');
        this.backButton = document.getElementById('backButton');
        this.prevButton = document.getElementById('prevButton');
        this.nextButton = document.getElementById('nextButton');
        this.navigationGroup = document.getElementById('navigationGroup');
        this.gifOnlyToggle = document.getElementById('gifOnlyToggle');
        this.showLabelsToggle = document.getElementById('showLabelsToggle');
        this.gapControlPanel = document.getElementById('gapControlPanel');
        this.gapSlider = document.getElementById('gapSlider');
        this.viewModeGroup = document.querySelector('.view-mode-group');
        this.viewModeToggle = document.getElementById('viewModeToggle');
        this.navigationToggle = document.getElementById('navigationToggle');

        // Get both sets of buttons (in controls and in fullscreen view)
        this.singleModeButtons = document.querySelectorAll('#singleModeButton');
        this.twoSideModeButtons = document.querySelectorAll('#twoSideModeButton');
        this.directionButtons = document.querySelectorAll('#directionButton');
        this.dupFirstButtons = document.querySelectorAll('#dupFirstButton');
        this.gapButtons = document.querySelectorAll('.gap-button');

        // Current gap setting
        this.currentGap = 0; // Default to 0 (compact)
    }

    createNewTab() {
        const tabId = Date.now().toString();
        const tabData = {
            images: [],
            currentIndex: 0,
            showGifsOnly: false,
            isTwoSideMode: false,
            isRightToLeft: true,
            dupFirst: false,
            showPageNumbers: false,
            showLabels: false
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
        this.showLabelsToggle.checked = tabData.showLabels;
        this.directionButtons.forEach(button => {
            button.textContent = tabData.isRightToLeft ? 'R' : 'L';
        });

        // Update view mode
        this.singleModeButtons.forEach(button => {
            button.classList.toggle('active', !tabData.isTwoSideMode);
        });
        this.twoSideModeButtons.forEach(button => {
            button.classList.toggle('active', tabData.isTwoSideMode);
        });

        // Update dupFirst button
        this.dupFirstButtons.forEach(button => {
            button.classList.toggle('active', tabData.dupFirst);
        });

        // Update fullscreen view elements to match the tab's view mode state
        this.fullscreenImage.classList.toggle('single', !tabData.isTwoSideMode);
        this.fullscreenImage2.style.display = tabData.isTwoSideMode ? 'block' : 'none';
        this.updateImageLayout();

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
        this.showLabelsToggle.addEventListener('change', () => this.toggleShowLabels());

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

        this.dupFirstButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDupFirst();
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

        // Prevent clicks on the gap control panel from triggering exit
        this.gapControlPanel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Prevent clicks on fullscreen filename labels from triggering exit
        this.fullscreenFilename1.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFullscreenFilenameDisplay();
        });

        this.fullscreenFilename2.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFullscreenFilenameDisplay();
        });

        // Gap control functionality
        this.setupGapControl();

        // Group toggle functionality
        this.setupGroupToggles();

        // Listen for directory opening events
        if (window.electron) {
            window.electron.ipcRenderer.on('directory-files-loaded', (event, data) => {
                this.handleDirectoryFiles(data.dirPath, data.files);
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

        if (!tabData) {
            return;
        }

        this.imageGrid.innerHTML = '';
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        filteredImages.forEach((image, index) => {
            const div = document.createElement('div');
            div.className = 'image-item';

            const img = document.createElement('img');

            // Handle both File objects and file paths
            if (image.path) {
                // File from directory (has path property)
                img.src = `file://${image.path}`;
            } else {
                // File object from file input
                img.src = URL.createObjectURL(image);
            }

            img.alt = image.name;

            const typeBadge = document.createElement('div');
            typeBadge.className = 'type-badge';
            typeBadge.textContent = image.type.split('/')[1].toUpperCase();

            div.appendChild(img);
            div.appendChild(typeBadge);

            // Only show filename/page number labels if enabled
            if (tabData.showLabels) {
                // Create filename/page number label
                const filenameLabel = document.createElement('div');
                filenameLabel.className = 'filename-label';

                // Display either page number or filename based on tab setting
                if (tabData.showPageNumbers) {
                    filenameLabel.textContent = `Page ${index + 1}`;
                    filenameLabel.title = `Click to show filename. Current: ${image.name}`;
                } else {
                    // Remove file extension for cleaner display
                    const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
                    filenameLabel.textContent = nameWithoutExt;
                    filenameLabel.title = `Click to show page number. Page ${index + 1}`;
                }

                // Add click handler to toggle between filename and page number
                filenameLabel.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering image click
                    tabData.showPageNumbers = !tabData.showPageNumbers;
                    this.displayImageGrid(); // Refresh the grid to update all labels
                });

                div.appendChild(filenameLabel);
            }

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
            button.textContent = tabData.isRightToLeft ? 'R' : 'L';
        });

        // Swap the images if in two-side mode
        if (tabData.isTwoSideMode) {
            const tempSrc = this.fullscreenImage.src;
            this.fullscreenImage.src = this.fullscreenImage2.src;
            this.fullscreenImage2.src = tempSrc;
        }

        this.updateImageLayout();
    }

    toggleDupFirst() {
        const tabData = this.getCurrentTabData();
        tabData.dupFirst = !tabData.dupFirst;

        // Update all dupFirst buttons
        this.dupFirstButtons.forEach(button => {
            button.classList.toggle('active', tabData.dupFirst);
        });

        // Refresh display if in fullscreen
        if (this.fullscreenView.classList.contains('active')) {
            this.showImage(tabData.currentIndex);
        }
    }

    toggleGifFilter() {
        const tabData = this.getCurrentTabData();
        tabData.showGifsOnly = this.gifOnlyToggle.checked;
        this.displayImageGrid();
    }

    toggleShowLabels() {
        const tabData = this.getCurrentTabData();
        tabData.showLabels = this.showLabelsToggle.checked;
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

            // Helper function to get image source
            const getImageSrc = (img) => {
                return img.path ? `file://${img.path}` : URL.createObjectURL(img);
            };

            if (tabData.isTwoSideMode) {
                if (tabData.dupFirst && index === 0) {
                    // Duplicate first image for both sides
                    this.fullscreenImage.src = getImageSrc(image);
                    this.fullscreenImage2.src = getImageSrc(image);
                } else {
                    // Normal two-page spread
                    if (tabData.isRightToLeft) {
                        this.fullscreenImage.src = getImageSrc(image);
                        if (index + 1 < filteredImages.length) {
                            this.fullscreenImage2.src = getImageSrc(filteredImages[index + 1]);
                        } else {
                            this.fullscreenImage2.src = '';
                        }
                    } else {
                        this.fullscreenImage2.src = getImageSrc(image);
                        if (index + 1 < filteredImages.length) {
                            this.fullscreenImage.src = getImageSrc(filteredImages[index + 1]);
                        } else {
                            this.fullscreenImage.src = '';
                        }
                    }
                }
            } else {
                this.fullscreenImage.src = getImageSrc(image);
                this.fullscreenImage2.src = '';
            }

            this.fullscreenView.classList.add('active');
            this.updateImageLayout();
            this.updateFullscreenFilenames(index, filteredImages, tabData);
        }
    }

    showPreviousImage() {
        const tabData = this.getCurrentTabData();
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        if (tabData.isTwoSideMode) {
            if (tabData.dupFirst) {
                if (tabData.currentIndex === 1) {
                    // From image[1] + image[2], go back to duplicate first image
                    this.showImage(0);
                } else if (tabData.currentIndex > 1) {
                    // Normal 2-page step back
                    const newIndex = tabData.currentIndex - 2;
                    this.showImage(Math.max(1, newIndex));
                }
            } else {
                const step = 2;
                const newIndex = Math.max(0, tabData.currentIndex - step);
                if (newIndex !== tabData.currentIndex) {
                    this.showImage(newIndex);
                }
            }
        } else {
            const newIndex = Math.max(0, tabData.currentIndex - 1);
            if (newIndex !== tabData.currentIndex) {
                this.showImage(newIndex);
            }
        }
    }

    showNextImage() {
        const tabData = this.getCurrentTabData();
        const filteredImages = tabData.showGifsOnly
            ? tabData.images.filter(img => img.type === 'image/gif')
            : tabData.images;

        if (tabData.isTwoSideMode) {
            if (tabData.dupFirst) {
                if (tabData.currentIndex === 0) {
                    // From duplicate first image, go to show image[1] + image[2]
                    this.showImage(1);
                } else {
                    // Normal 2-page step from other pages
                    const newIndex = tabData.currentIndex + 2;
                    if (newIndex < filteredImages.length) {
                        this.showImage(newIndex);
                    }
                }
            } else {
                const step = 2;
                const maxIndex = filteredImages.length - 2;
                const newIndex = Math.min(maxIndex, tabData.currentIndex + step);
                if (newIndex !== tabData.currentIndex && newIndex >= 0) {
                    this.showImage(newIndex);
                }
            }
        } else {
            const newIndex = tabData.currentIndex + 1;
            if (newIndex < filteredImages.length) {
                this.showImage(newIndex);
            }
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

                // Update filename label positions
                this.fullscreenFilename1.className = 'fullscreen-filename-label right';
                this.fullscreenFilename2.className = 'fullscreen-filename-label left';
            } else {
                this.fullscreenImage.classList.add('left');
                this.fullscreenImage2.classList.add('right');

                // Update filename label positions
                this.fullscreenFilename1.className = 'fullscreen-filename-label left';
                this.fullscreenFilename2.className = 'fullscreen-filename-label right';
            }
        } else {
            this.fullscreenImage.classList.remove('left', 'right');
            this.fullscreenImage2.classList.remove('left', 'right');
            this.fullscreenImage.classList.add('single');

            // Update filename label position for single mode
            this.fullscreenFilename1.className = 'fullscreen-filename-label single';
            this.fullscreenFilename2.className = 'fullscreen-filename-label';
        }
    }

    exitFullscreen() {
        this.fullscreenView.classList.remove('active');
        this.fullscreenImage.src = '';
        this.fullscreenImage2.src = '';
        this.fullscreenFilename1.textContent = '';
        this.fullscreenFilename2.textContent = '';
        this.fullscreenFilename1.classList.remove('visible');
        this.fullscreenFilename2.classList.remove('visible');
    }

    handleDirectoryFiles(dirPath, files) {
        // Create a new tab for the directory
        const tabId = this.createNewTab();

        const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
        if (tab) {
            const dirName = dirPath.split('/').pop();
            tab.querySelector('span:first-child').textContent = dirName;
        }

        // Get the tab data
        const tabData = this.tabs.get(tabId);

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

        // Display the images
        this.displayImageGrid();
    }

    setupDragAndDrop() {
        // Prevent default drag behaviors on both body and window to ensure full coverage
        const targets = [document.body, window];

        targets.forEach(target => {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                target.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });
        });

        // Add visual feedback when dragging over the app
        ['dragenter', 'dragover'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                document.body.classList.add('drag-over');
            }, false);

            // Also listen on window for better coverage
            window.addEventListener(eventName, () => {
                document.body.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                document.body.classList.remove('drag-over');
            }, false);

            // Also listen on window for better coverage
            window.addEventListener(eventName, () => {
                document.body.classList.remove('drag-over');
            }, false);
        });

        // Handle the drop event on both body and window
        const handleDrop = (e) => {
            const items = e.dataTransfer.items;

            if (items) {
                // Process each dropped item
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    if (item.kind === 'file') {
                        const entry = item.webkitGetAsEntry();

                        if (entry && entry.isDirectory) {
                            // Try to get the real path from the file handle
                            const file = item.getAsFile();
                            if (file && file.path) {
                                // Since we're inside the class, we can directly send the request
                                // Don't create a tab here - let handleDirectoryFiles create it with the proper data
                                if (window.electron) {
                                    window.electron.ipcRenderer.send('open-directory', file.path);
                                }
                            } else {
                                // Fallback to the virtual path (probably won't work)
                                if (window.electron) {
                                    window.electron.ipcRenderer.send('open-directory', entry.fullPath);
                                }
                            }
                            break; // Only process the first directory
                        }
                    }
                }
            }
        };

        // Add drop handlers to both body and window
        document.body.addEventListener('drop', handleDrop, false);
        window.addEventListener('drop', handleDrop, false);
    }

    // Gap control functionality
    setupGapControl() {
        // Mouse hover events for showing/hiding the gap control panel and filename labels
        let hoverTimeout;
        let filenameTimeout;

        this.fullscreenView.addEventListener('mousemove', (e) => {
            if (this.fullscreenView.classList.contains('active')) {
                const viewportHeight = window.innerHeight;

                // Show gap panel when mouse is near top (within 50px)
                if (e.clientY <= 50) {
                    clearTimeout(hoverTimeout);
                    this.gapControlPanel.classList.add('visible');
                } else if (e.clientY > 100) {
                    // Hide gap panel when mouse moves away from top area
                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        this.gapControlPanel.classList.remove('visible');
                    }, 500);
                }

                // Show filename labels when mouse is near bottom (within 80px)
                if (e.clientY >= viewportHeight - 80) {
                    clearTimeout(filenameTimeout);
                    this.fullscreenFilename1.classList.add('visible');
                    this.fullscreenFilename2.classList.add('visible');
                } else if (e.clientY < viewportHeight - 120) {
                    // Hide filename labels when mouse moves away from bottom area
                    clearTimeout(filenameTimeout);
                    filenameTimeout = setTimeout(() => {
                        this.fullscreenFilename1.classList.remove('visible');
                        this.fullscreenFilename2.classList.remove('visible');
                    }, 500);
                }
            }
        });

        // Prevent hiding gap panel when hovering over the panel itself
        this.gapControlPanel.addEventListener('mouseenter', () => {
            clearTimeout(hoverTimeout);
        });

        this.gapControlPanel.addEventListener('mouseleave', () => {
            hoverTimeout = setTimeout(() => {
                this.gapControlPanel.classList.remove('visible');
            }, 300);
        });

        // Prevent hiding filename labels when hovering over them
        this.fullscreenFilename1.addEventListener('mouseenter', () => {
            clearTimeout(filenameTimeout);
        });

        this.fullscreenFilename1.addEventListener('mouseleave', () => {
            filenameTimeout = setTimeout(() => {
                this.fullscreenFilename1.classList.remove('visible');
                this.fullscreenFilename2.classList.remove('visible');
            }, 300);
        });

        this.fullscreenFilename2.addEventListener('mouseenter', () => {
            clearTimeout(filenameTimeout);
        });

        this.fullscreenFilename2.addEventListener('mouseleave', () => {
            filenameTimeout = setTimeout(() => {
                this.fullscreenFilename1.classList.remove('visible');
                this.fullscreenFilename2.classList.remove('visible');
            }, 300);
        });

        // Gap button click events
        this.gapButtons.forEach(button => {
            button.addEventListener('click', () => {
                const gap = parseInt(button.dataset.gap);
                this.setGap(gap);
            });
        });

        // Gap slider input event
        this.gapSlider.addEventListener('input', () => {
            const gap = parseInt(this.gapSlider.value);
            this.setGap(gap);
        });
    }

    // Set gap size
    setGap(gap) {
        this.currentGap = gap;

        // Update button states (only highlight if exactly 0 or 20)
        this.gapButtons.forEach(button => {
            button.classList.toggle('active', parseInt(button.dataset.gap) === gap);
        });

        // Update slider value
        this.gapSlider.value = gap;

        // Apply gap to images container
        const imagesContainer = document.querySelector('.images-container');
        if (imagesContainer) {
            imagesContainer.style.gap = `${gap}px`;
        }
    }

    // Group toggle functionality
    setupGroupToggles() {
        // View mode group toggle
        this.viewModeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleGroup(this.viewModeGroup, this.viewModeToggle);
        });

        // Navigation group toggle
        this.navigationToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleGroup(this.navigationGroup, this.navigationToggle);
        });

        // Prevent toggle buttons from triggering fullscreen exit
        this.viewModeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        this.navigationToggle.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Toggle group visibility
    toggleGroup(group, toggleButton) {
        const isCollapsed = group.classList.contains('collapsed');

        if (isCollapsed) {
            // Expand the group
            group.classList.remove('collapsed');
            toggleButton.textContent = '◀';
        } else {
            // Collapse the group
            group.classList.add('collapsed');
            toggleButton.textContent = '▶';
        }
    }

    // Initialize tooltips
    setupTooltips() {
        // Create a single tooltip element that we'll reuse
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        document.body.appendChild(this.tooltip);

        // Tooltip timeout for delay
        this.tooltipTimeout = null;

        // Define tooltip messages for each button type
        const tooltipMessages = {
            singleMode: 'Single page view',
            twoSideMode: 'Two page view',
            direction: 'Reading direction (R: Right-to-left, L: Left-to-right)',
            dupFirst: 'Duplicate first page in two-page mode',
            gifsToggle: 'Only show GIF images in the gallery',
            labelsToggle: 'Show page number and filename. Click label to switch between them'
        };

        // Add tooltip to all single mode buttons
        this.singleModeButtons.forEach(button => {
            this.addTooltip(button, tooltipMessages.singleMode);
        });

        // Add tooltip to all two-side mode buttons
        this.twoSideModeButtons.forEach(button => {
            this.addTooltip(button, tooltipMessages.twoSideMode);
        });

        // Add tooltip to all direction buttons
        this.directionButtons.forEach(button => {
            this.addTooltip(button, tooltipMessages.direction);
        });

        // Add tooltip to all dupFirst buttons
        this.dupFirstButtons.forEach(button => {
            this.addTooltip(button, tooltipMessages.dupFirst);
        });

        // Add tooltips to switch toggles
        const gifsToggleContainer = document.querySelector('[data-tooltip="gifs-tooltip"]');
        const labelsToggleContainer = document.querySelector('[data-tooltip="labels-tooltip"]');

        if (gifsToggleContainer) {
            this.addTooltip(gifsToggleContainer, tooltipMessages.gifsToggle);
        }

        if (labelsToggleContainer) {
            this.addTooltip(labelsToggleContainer, tooltipMessages.labelsToggle);
        }
    }

    addTooltip(element, message) {
        element.addEventListener('mouseenter', (e) => {
            // Clear any existing timeout
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            // Set a delay before showing the tooltip (1.5 seconds)
            this.tooltipTimeout = setTimeout(() => {
                this.showTooltip(e.target, message);
            }, 1500);
        });

        element.addEventListener('mouseleave', () => {
            // Clear the timeout if mouse leaves before tooltip shows
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
            this.hideTooltip();
        });

        // Hide tooltip if button is clicked
        element.addEventListener('click', () => {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
            this.hideTooltip();
        });
    }

    showTooltip(element, message) {
        this.tooltip.textContent = message;
        this.tooltip.classList.add('visible');

        // Position the tooltip above the element
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        // Calculate position
        const left = rect.left + (rect.width / 2);
        const top = rect.top - tooltipRect.height - 10; // 10px gap above the button

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;

        // Ensure tooltip stays within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left + tooltipRect.width / 2 > viewportWidth) {
            this.tooltip.style.left = `${viewportWidth - tooltipRect.width - 10}px`;
            this.tooltip.style.transform = 'none';
        } else if (left - tooltipRect.width / 2 < 0) {
            this.tooltip.style.left = '10px';
            this.tooltip.style.transform = 'none';
        }

        if (top < 0) {
            // If tooltip would go above viewport, show it below the button instead
            this.tooltip.style.top = `${rect.bottom + 10}px`;
            // Flip the arrow to point up
            this.tooltip.style.setProperty('--arrow-direction', 'up');
        }
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
        this.tooltip.style.removeProperty('--arrow-direction');
    }

    toggleFullscreenFilenameDisplay() {
        const tabData = this.getCurrentTabData();
        tabData.showPageNumbers = !tabData.showPageNumbers;
        this.displayImageGrid(); // Refresh the grid

        // If in fullscreen, also update the fullscreen filenames
        if (this.fullscreenView.classList.contains('active')) {
            const filteredImages = tabData.showGifsOnly
                ? tabData.images.filter(img => img.type === 'image/gif')
                : tabData.images;
            this.updateFullscreenFilenames(tabData.currentIndex, filteredImages, tabData);
        }
    }

    updateFullscreenFilenames(index, filteredImages, tabData) {
        // Helper function to get display text
        const getDisplayText = (img, actualIndex) => {
            if (tabData.showPageNumbers) {
                return `Page ${actualIndex + 1}`;
            } else {
                // Remove file extension for cleaner display
                return img.name.replace(/\.[^/.]+$/, '');
            }
        };

        if (tabData.isTwoSideMode) {
            this.fullscreenFilename2.style.display = 'block';

            if (tabData.dupFirst && index === 0) {
                // Duplicate first image for both sides
                const displayText = getDisplayText(filteredImages[0], 0);
                this.fullscreenFilename1.textContent = displayText;
                this.fullscreenFilename2.textContent = displayText;
            } else {
                // Normal two-page spread
                if (tabData.isRightToLeft) {
                    // fullscreenImage shows current index, fullscreenImage2 shows next index
                    // Swap: fullscreenFilename1 shows next, fullscreenFilename2 shows current
                    if (index + 1 < filteredImages.length) {
                        this.fullscreenFilename1.textContent = getDisplayText(filteredImages[index + 1], index + 1);
                    } else {
                        this.fullscreenFilename1.textContent = '';
                    }

                    this.fullscreenFilename2.textContent = getDisplayText(filteredImages[index], index);
                } else {
                    // fullscreenImage shows next index, fullscreenImage2 shows current index
                    // Swap: fullscreenFilename1 shows current, fullscreenFilename2 shows next
                    this.fullscreenFilename1.textContent = getDisplayText(filteredImages[index], index);

                    if (index + 1 < filteredImages.length) {
                        this.fullscreenFilename2.textContent = getDisplayText(filteredImages[index + 1], index + 1);
                    } else {
                        this.fullscreenFilename2.textContent = '';
                    }
                }
            }
        } else {
            // Single page mode
            this.fullscreenFilename2.style.display = 'none';
            this.fullscreenFilename1.textContent = getDisplayText(filteredImages[index], index);
        }
    }
}

// Initialize the image viewer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.imageViewerInstance = new ImageViewer();
});

// Options handling
const optionsBtn = document.getElementById('optionsBtn');
const optionsModal = document.getElementById('optionsModal');
const optionsForm = document.getElementById('optionsForm');
const cancelOptionsBtn = document.getElementById('cancelOptionsBtn');

// Load saved options
function loadOptions() {
    const booksPath = localStorage.getItem('books.path') || '';

    document.getElementById('booksPath').value = booksPath;
}

// Save options
function saveOptions(event) {
    event.preventDefault();

    const formData = new FormData(optionsForm);
    for (const [key, value] of formData.entries()) {
        localStorage.setItem(key, value);
    }

    optionsModal.classList.remove('active');
}

// Handle directory selection
function handleDirectorySelect(inputId) {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
        fileInput.click();
    }
}

// Handle directory selection result
function handleDirectorySelected(event, targetInputId) {
    const files = event.target.files;
    if (files && files.length > 0) {
        // Get the full path using Electron's API
        if (window.electron) {
            // For directory paths, get the parent directory path
            const dirPath = files[0].path.split('/').slice(0, -1).join('/');
            document.getElementById(targetInputId).value = dirPath;
        }
    }
}

// Show options modal
optionsBtn.addEventListener('click', () => {
    loadOptions();
    optionsModal.classList.add('active');
});

// Hide options modal
cancelOptionsBtn.addEventListener('click', () => {
    optionsModal.classList.remove('active');
});

// Handle form submission
optionsForm.addEventListener('submit', saveOptions);

// Handle directory selection buttons
document.querySelectorAll('.select-dir-btn').forEach(button => {
    button.addEventListener('click', () => {
        const inputId = button.dataset.for;
        handleDirectorySelect(inputId);
    });
});

// Handle directory selection results
document.getElementById('booksPathInput').addEventListener('change', (e) => {
    handleDirectorySelected(e, 'booksPath');
});

// Close modal when clicking outside
optionsModal.addEventListener('click', (event) => {
    if (event.target === optionsModal) {
        optionsModal.classList.remove('active');
    }
});

// Books functionality
const booksBtn = document.getElementById('booksBtn');
const booksModal = document.getElementById('booksModal');
const booksGrid = document.getElementById('booksGrid');
const closeBooksBtn = document.getElementById('closeBooksBtn');

// Show books modal
booksBtn.addEventListener('click', () => {
    loadBooksLibrary();
    booksModal.classList.add('active');
});

// Hide books modal
closeBooksBtn.addEventListener('click', () => {
    booksModal.classList.remove('active');
});

// Close books modal when clicking outside
booksModal.addEventListener('click', (event) => {
    if (event.target === booksModal) {
        booksModal.classList.remove('active');
    }
});

// Load books library
async function loadBooksLibrary() {
    const booksPath = localStorage.getItem('books.path');

    if (!booksPath) {
        booksGrid.innerHTML = '<div class="loading-message">Please set your books path in Options first.</div>';
        return;
    }

    booksGrid.innerHTML = '<div class="loading-message">Loading books...</div>';

    try {
        if (window.electron) {
            // Request books list from main process
            window.electron.ipcRenderer.send('get-books-list', booksPath);
        } else {
            booksGrid.innerHTML = '<div class="loading-message">File system access not available in browser mode.</div>';
        }
    } catch (error) {
        console.error('Error loading books:', error);
        booksGrid.innerHTML = '<div class="loading-message">Error loading books. Please check your books path.</div>';
    }
}

// Handle books list response
if (window.electron) {
    window.electron.ipcRenderer.on('books-list-response', (event, books) => {
        displayBooksList(books);
    });
}

// Display books list
function displayBooksList(books) {
    if (!books || books.length === 0) {
        booksGrid.innerHTML = '<div class="loading-message">No books found in the specified directory.</div>';
        return;
    }

    booksGrid.innerHTML = '';

    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';

        const preview = document.createElement('img');
        preview.className = 'book-preview';
        preview.src = book.previewImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
        preview.alt = `${book.name} preview`;
        preview.onerror = () => {
            preview.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
        };

        const bookName = document.createElement('div');
        bookName.className = 'book-name';
        bookName.textContent = book.name;

        const openBtn = document.createElement('button');
        openBtn.className = 'book-open-btn';
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => openBook(book.path));

        bookItem.appendChild(preview);
        bookItem.appendChild(bookName);
        bookItem.appendChild(openBtn);

        booksGrid.appendChild(bookItem);
    });
}

// Open book function
function openBook(bookPath) {
    // Close the books modal
    booksModal.classList.remove('active');

    // Function to handle the book opening
    const doOpenBook = () => {
        const imageViewer = window.imageViewerInstance;

        if (imageViewer) {
            // Don't create a tab here - let handleDirectoryFiles create it with the proper data
            // Send open directory request to main process
            if (window.electron) {
                window.electron.ipcRenderer.send('open-directory', bookPath);
            }
        }
    };

    // Check if imageViewer instance is available
    if (window.imageViewerInstance) {
        doOpenBook();
    } else {
        // Wait a bit for the instance to be created
        setTimeout(() => {
            if (window.imageViewerInstance) {
                doOpenBook();
            } else {
                // Try to create it manually if it's still not available
                if (typeof ImageViewer !== 'undefined') {
                    window.imageViewerInstance = new ImageViewer();
                    doOpenBook();
                }
            }
        }, 100);
    }
}