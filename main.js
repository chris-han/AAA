console.log("main.js loaded and running!");
let scene, camera, renderer, effect, controls, light, listener, sound, audioLoader, ambientLight, loader, table, turntable;
let draggingPlane;
let gui, guiParams;
let currentMode = 0; // 0: none, 1: Cake Base, 2: Cream, 3: Knife
let cakeBase;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;
let placedCakeBase = null; // Single instance of cake base (except when cut)
const placedCakes = [];
let cream;
const creamBlobs = [];
let isExtruding = false;
let knife;
let placedKnife = null; // Single instance of knife
let isCutting = false;
let turntableRotationSpeed = 0;
const keyPressStartTime = {};
let lastMode1PressTime = 0; // New variable to track last '1' key press time
let gameInitialized = false;
let currentSlotId = null;

window.addEventListener('DOMContentLoaded', init);

// Collision detection function
function checkCollision(position, scale) {
    const collisionRadius = Math.max(scale.x, scale.z) * 0.6; // Use larger dimension for collision
    
    // Check collision with placed cake base
    if (placedCakeBase && placedCakeBase.position.distanceTo(position) < collisionRadius + Math.max(placedCakeBase.scale.x, placedCakeBase.scale.z) * 0.6) {
        return true;
    }
    
    // Check collision with placed cakes
    for (const cake of placedCakes) {
        if (cake.position.distanceTo(position) < collisionRadius + Math.max(cake.scale.x, cake.scale.z) * 0.6) {
            return true;
        }
    }
    
    // Check collision with knife
    if (placedKnife && placedKnife.position.distanceTo(position) < collisionRadius + 0.3) {
        return true;
    }
    
    return false;
}

function updateObjectList() {
    const objectListElement = document.getElementById('object-list');
    objectListElement.innerHTML = ''; // Clear existing list

    if (placedCakeBase) {
        const listItem = document.createElement('li');
        listItem.textContent = 'Cake Base';
        objectListElement.appendChild(listItem);
    }

    placedCakes.forEach((cake, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Cake Piece ${index + 1}`;
        objectListElement.appendChild(listItem);
    });

    creamBlobs.forEach((blob, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Cream Blob ${index + 1}`;
        objectListElement.appendChild(listItem);
    });

    if (placedKnife) {
        const listItem = document.createElement('li');
        listItem.textContent = 'Knife';
        objectListElement.appendChild(listItem);
    }
}
    const objectListElement = document.getElementById('object-list');
    console.log('objectListElement:', objectListElement);

function init() {
    // Initialize Three.js components only once
    if (!gameInitialized) {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        camera.position.set(0, 2, 5);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        effect = new THREE.OutlineEffect( renderer );

        controls = new THREE.OrbitControls( camera, renderer.domElement );

        light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1).normalize();
        scene.add(light);

        listener = new THREE.AudioListener();
        camera.add( listener );

        sound = new THREE.Audio( listener );

        // audioLoader = new THREE.AudioLoader();
        // audioLoader.load( 'assets/cake_walk.mp3', function( buffer ) {
        //     sound.setBuffer( buffer );
        //     sound.setLoop( false );
        //     sound.setVolume( 0.5 );
        // });

        document.addEventListener('click', () => {
            if (!sound.isPlaying) {
                sound.play();
            }
        });

        ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        loader = new THREE.GLTFLoader();

        loader.load(
            'assets/wooden_table.glb',
            function ( gltf ) {
                table = gltf.scene;
                table.scale.set(2, 2, 2);
                scene.add( table );
            },
            undefined,
            function ( error ) {
                console.error( error );
            }
        );

        loader.load(
            'assets/turn_table.glb',
            function ( gltf ) {
                turntable = gltf.scene;
                turntable.scale.set(1.5, 1.5, 1.5);
                turntable.position.y = 0.85;
                scene.add( turntable );
                draggingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -turntable.position.y);
            },
            undefined,
            function ( error ) {
                console.error( error );
            }
        );

        gui = new lil.GUI();
        guiParams = {
            mode: 0,
            cakeSize: 1,
            cakeColor: 0xffffff,
            creamThickness: 0.1,
            creamColor: 0xffffff,
            creamRemovalSize: 0.2
        };

        const modeController = gui.add(guiParams, 'mode', { 'None': 0, 'Cake Base Object': 1, 'Cream Object': 2, 'Knife Object': 3 }).name('Current Object').onChange((value) => {
            currentMode = value;
            updateCursorVisibility();
            if (selectedObject) {
                effect.selection.set([]); // Clear outline effect when mode changes
                selectedObject = null;
                controls.enabled = true;
            }
        });

        const cakeFolder = gui.addFolder('Cake Base Settings');
        cakeFolder.add(guiParams, 'cakeSize', 0.5, 2).name('Size');
        cakeFolder.addColor(guiParams, 'cakeColor').name('Color');
        cakeFolder.close();

        const creamFolder = gui.addFolder('Cream Settings');
        creamFolder.add(guiParams, 'creamThickness', 0.05, 0.5).name('Thickness');
        creamFolder.addColor(guiParams, 'creamColor').name('Color');
        creamFolder.add(guiParams, 'creamRemovalSize', 0.1, 1).name('Removal Size');
        creamFolder.close();

        const userGuideFolder = gui.addFolder('User Guide');
        userGuideFolder.add({
            guide: 'Press 1 for Cake Base Object\nPress 2 for Cream Object\nPress 3 for Knife Object\n\nObject Picking Up:\n  Left-click to select/pick up objects\n  SPACEBAR to drop/deselect objects\n\nCake Base Object:\n  Only one instance allowed (except when cut)\n  Left-click to select and drag\n\nCream Object:\n  Left-click and hold to extrude cream\n  Right-click to remove cream\n  Multiple instances allowed\n\nKnife Object:\n  A/D to rotate knife\n  Left-click to cut/smooth both cakes and cream\n  Only one instance allowed\n\nTurntable:\n  W/S to rotate turntable\n\nPhysics:\n  Objects follow collision detection\n  Objects cannot overlap'
        }, 'guide').name('Instructions').disable();
        userGuideFolder.open();

        document.addEventListener('keydown', (event) => {
            if ((event.key === 'w' || event.key === 's') && !keyPressStartTime[event.key]) {
                keyPressStartTime[event.key] = Date.now();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 's') {
                const pressDuration = Date.now() - keyPressStartTime[event.key];
                turntableRotationSpeed += (pressDuration / 1000) * (event.key === 'w' ? 1 : -1);
                delete keyPressStartTime[event.key];
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === '1') {
                currentMode = 1;
                guiParams.mode = 1;
                modeController.updateDisplay(); // Update GUI display
                lastMode1PressTime = Date.now(); // Record the timestamp
            } else if (event.key === '2') {
                currentMode = 2;
                guiParams.mode = 2;
                modeController.updateDisplay(); // Update GUI display
            } else if (event.key === '3') {
                currentMode = 3;
                guiParams.mode = 3;
                modeController.updateDisplay(); // Update GUI display
            } else if (event.key === '4' && currentMode === 3) {
                // Rotate knife blade 90 degrees for smoothing cream
                if (knife) {
                    knife.rotation.x += Math.PI / 2;
                }
            } else if (event.key === ' ' && selectedObject) {
                // Spacebar to drop selected object
                selectedObject = null;
                controls.enabled = true;
                effect.selection.set([]);
            }

            if ((event.key === 'w' || event.key === 's') && !keyPressStartTime[event.key]) {
                keyPressStartTime[event.key] = Date.now();
            }
            updateCursorVisibility();
        });

        // Enter key handling removed - switching objects by number keys only

        document.addEventListener('mousedown', (event) => {
            console.log('mouse click event:', event);
            if (event.button === 0) { // Left mouse button - SELECT/PICKUP
                raycaster.setFromCamera(mouse, camera);
                
                if (currentMode === 1) { // Cake Base Object
                    // Check if clicking on existing cake base
                    if (placedCakeBase) {
                        const intersects = raycaster.intersectObject(placedCakeBase, true);
                        if (intersects.length > 0) {
                            selectedObject = placedCakeBase;
                            controls.enabled = false;
                            effect.selection.set([selectedObject]);
                            return;
                        }
                    }
                    
                    // Check if clicking on placed cakes
                    const cakeIntersects = raycaster.intersectObjects(placedCakes, true);
                    if (cakeIntersects.length > 0) {
                        let clickedObject = cakeIntersects[0].object;
                        while (clickedObject.parent !== turntable && clickedObject.parent !== scene) {
                            clickedObject = clickedObject.parent;
                        }
                        selectedObject = clickedObject;
                        controls.enabled = false;
                        effect.selection.set([selectedObject]);
                        return;
                    }
                    
                    // Create new cake base if none exists (single instance rule)
                    if (!placedCakeBase) {
                        loader.load('assets/cake.glb', (gltf) => {
                            const newCake = gltf.scene;
                            newCake.scale.set(guiParams.cakeSize, guiParams.cakeSize, guiParams.cakeSize);
                            newCake.traverse((child) => {
                                if (child.isMesh) {
                                    child.material = new THREE.MeshBasicMaterial({color: guiParams.cakeColor});
                                }
                            });
                            
                            // Position with collision detection
                            const turntableIntersects = raycaster.intersectObject(turntable, true);
                            if (turntableIntersects.length > 0) {
                                const targetPos = turntableIntersects[0].point.clone();
                                targetPos.y = turntable.position.y + (newCake.scale.y * 0.5);
                                
                                // Check for collisions with existing objects
                                if (!checkCollision(targetPos, newCake.scale)) {
                                    newCake.position.copy(targetPos);
                                    turntable.add(newCake);
                                    placedCakeBase = newCake;
                                    selectedObject = newCake;
                                    controls.enabled = false;
                                    effect.selection.set([selectedObject]);
                                    updateObjectList();
                                }
                            }
                        });
                    }
                } else if (currentMode === 2) { // Cream Object
                    isExtruding = true;
                } else if (currentMode === 3) { // Knife Object
                    // Select knife if it exists
                    if (placedKnife) {
                        const intersects = raycaster.intersectObject(placedKnife, true);
                        if (intersects.length > 0) {
                            selectedObject = placedKnife;
                            controls.enabled = false;
                            effect.selection.set([selectedObject]);
                        }
                    } else {
                        // Create and place knife if it doesn't exist
                        loader.load('assets/knife.glb', (gltf) => {
                            const newKnife = gltf.scene;
                            newKnife.scale.set(1, 1, 1);
                            
                            // Position with collision detection
                            const turntableIntersects = raycaster.intersectObject(turntable, true);
                            if (turntableIntersects.length > 0) {
                                const targetPos = turntableIntersects[0].point.clone();
                                targetPos.y = turntable.position.y + 0.2; // Place above turntable
                                
                                // Check for collisions with existing objects
                                if (!checkCollision(targetPos, newKnife.scale)) {
                                    newKnife.position.copy(targetPos);
                                    scene.add(newKnife);
                                    placedKnife = newKnife;
                                    selectedObject = newKnife;
                                    controls.enabled = false;
                                    effect.selection.set([selectedObject]);
                                    updateObjectList();
                                }
                            }
                        });
                    }
                    isCutting = true;
                } else { // Default mode - allow selection of any objects
                    const allObjects = [...placedCakes];
                    if (placedCakeBase) allObjects.push(placedCakeBase);
                    if (placedKnife) allObjects.push(placedKnife);
                    
                    const intersects = raycaster.intersectObjects(allObjects, true);
                    if (intersects.length > 0) {
                        let clickedObject = intersects[0].object;
                        while (clickedObject.parent !== turntable && clickedObject.parent !== scene) {
                            clickedObject = clickedObject.parent;
                        }
                        selectedObject = clickedObject;
                        controls.enabled = false;
                        effect.selection.set([selectedObject]);
                    }
                }
            } else if (event.button === 2) { // Right mouse button
                // This now ONLY handles cream removal on right-mousedown.
                if (currentMode === 2) { // Cream Mode - remove cream
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(creamBlobs, true);
                    if (intersects.length > 0) {
                        const hitPoint = intersects[0].point;
                        const removalRadius = guiParams.creamRemovalSize;
                        for (let i = creamBlobs.length - 1; i >= 0; i--) {
                            const blob = creamBlobs[i];
                            if (blob.position.distanceTo(hitPoint) < removalRadius) {
                                turntable.remove(blob);
                                creamBlobs.splice(creamBlobs.indexOf(blob), 1);
                            }
                        }
                    }
                }
            }
        });
        
        let trashBinObject; // Declare trashBinObject once.

        // Load the trash bin model
        loader.load(
            'assets/trash_bin.glb',
            function (gltf) {
                trashBinObject = gltf.scene;
                trashBinObject.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
                trashBinObject.position.set(-2, 1.5, -2); // Position at top-left of the table
                scene.add(trashBinObject);
            },
            undefined,
            function (error) {
                console.error('Error loading trash bin:', error);
            }
        );

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Left mouse button
                if (currentMode === 2) { // Cream Mode
                    isExtruding = false;
                } else if (currentMode === 3) { // Knife Mode
                    isCutting = false;
                }
            }
        });

        document.addEventListener('contextmenu', event => event.preventDefault());

        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            if (selectedObject) {
                raycaster.setFromCamera(mouse, camera);
                const targetPoint = new THREE.Vector3();
                if (raycaster.ray.intersectPlane(draggingPlane, targetPoint)) {
                    // Check for collisions before moving
                    if (!checkCollision(targetPoint, selectedObject.scale)) {
                        selectedObject.position.copy(targetPoint);
                        selectedObject.position.y = turntable.position.y + (selectedObject.scale.y * 0.5);
                    }
                }
            }
        });

        document.addEventListener('keydown', (event) => {
            if (currentMode === 3) {
                if (event.key === 'a') {
                    knife.rotation.y += 0.1;
                } else if (event.key === 'd') {
                    knife.rotation.y -= 0.1;
                }
            }
        });

        const saveButton = document.getElementById('save-button');
        const loadButton = document.getElementById('load-button');

        saveButton.addEventListener('click', () => saveGame(currentSlotId));
        loadButton.addEventListener('click', () => loadGame(currentSlotId));

        function animate() {
            requestAnimationFrame( animate );

            raycaster.setFromCamera(mouse, camera);

            if (currentMode === 1) {
                if (!cakeBase) {
                    loader.load('assets/cake.glb', (gltf) => {
                        cakeBase = gltf.scene;
                        // Make the preview object invisible to raycaster.
                        cakeBase.traverse((child) => {
                            if (child.isMesh) {
                                child.raycast = () => {};
                            }
                        });
                        cakeBase.visible = false;
                        scene.add(cakeBase);
                    });
                }
                if (cakeBase) {
                    cakeBase.scale.set(guiParams.cakeSize, guiParams.cakeSize, guiParams.cakeSize);
                    cakeBase.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshBasicMaterial({color: guiParams.cakeColor});
                        }
                    });
                    const intersects = raycaster.intersectObject(turntable, true);
                    if (intersects.length > 0) {
                        cakeBase.position.copy(intersects[0].point);
                        cakeBase.position.y += (guiParams.cakeSize * 0.5); // Adjust Y to place cake on top of turntable
                        cakeBase.visible = true;
                    } else {
                        cakeBase.visible = false;
                    }
                }
            } else if (cakeBase) {
                cakeBase.visible = false;
            }

            if (currentMode === 2) {
                if (!cream) {
                    loader.load('assets/cream.glb', (gltf) => {
                        cream = gltf.scene;
                        // Make the preview object invisible to raycaster.
                        cream.traverse((child) => {
                            if (child.isMesh) {
                                child.raycast = () => {};
                            }
                        });
                        cream.visible = false;
                        scene.add(cream);
                    });
                }
                if (cream) {
                    cream.scale.set(guiParams.creamThickness * 10, guiParams.creamThickness * 10, guiParams.creamThickness * 10);
                    cream.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshBasicMaterial({color: guiParams.creamColor});
                        }
                    });
                    const intersects = raycaster.intersectObjects([turntable, ...placedCakes], true);
                    if (intersects.length > 0) {
                        cream.position.copy(intersects[0].point);
                        cream.visible = true;

                        if (isExtruding) {
                            const newCreamBlob = cream.clone();
                            newCreamBlob.visible = true;
                            turntable.add(newCreamBlob); // Add to turntable
                            creamBlobs.push(newCreamBlob);
                            updateObjectList();
                        }
                    }
                     else {
                        cream.visible = false;
                    }
                }
            }
             else if (cream) {
                cream.visible = false;
            }

            if (currentMode === 3) {
                if (!knife) {
                    loader.load('assets/knife.glb', (gltf) => {
                        knife = gltf.scene;
                        // Make the preview object invisible to raycaster.
                        knife.traverse((child) => {
                            if (child.isMesh) {
                                child.raycast = () => {};
                            }
                        });
                        knife.visible = false;
                        scene.add(knife);
                    });
                }
                if (knife) {
                    knife.visible = true;
                    const objectsToIntersect = [];
                    
                    // Always try to intersect with turntable first for positioning
                    const turntableIntersects = raycaster.intersectObject(turntable, true);
                    if (turntableIntersects.length > 0) {
                        knife.position.copy(turntableIntersects[0].point);
                        knife.position.y += 0.1; // Slightly above the turntable
                    }
                    
                    // Knife affects both cake bases and cream
                    if (placedCakeBase) objectsToIntersect.push(placedCakeBase);
                    objectsToIntersect.push(...placedCakes, ...creamBlobs);

                    const intersects = raycaster.intersectObjects(objectsToIntersect, true);
                    if (intersects.length > 0) {
                        knife.position.copy(intersects[0].point);

                        if (isCutting) {
                            const intersectedObject = intersects[0].object;
                            let parentObject = intersectedObject;
                            while (parentObject.parent !== turntable && parentObject.parent !== scene) {
                                parentObject = parentObject.parent;
                            }
                            
                            if (parentObject === placedCakeBase) {
                                // Cut cake base - create pieces and remove original
                                turntable.remove(placedCakeBase);
                                placedCakeBase = null;
                                // Could add logic here to create cake pieces
                                updateObjectList();
                            } else if (placedCakes.includes(parentObject)) {
                                turntable.remove(parentObject);
                                placedCakes.splice(placedCakes.indexOf(parentObject), 1);
                                updateObjectList();
                            } else if (creamBlobs.includes(intersectedObject)) {
                                turntable.remove(intersectedObject);
                                creamBlobs.splice(creamBlobs.indexOf(intersectedObject), 1);
                                updateObjectList();
                            }
                        }
                    }
                }
            } else if (knife) {
                knife.visible = false;
            }

            if (turntable) {
                turntable.rotation.y += turntableRotationSpeed * 0.01;
                turntableRotationSpeed *= 0.99; //damping
            }
            controls.update();
            effect.render( scene, camera );
        }
        animate();
        gameInitialized = true;
        updateObjectList(); // Initial population of the object list
    }
}

function populateSaveSlots() {
    const saveSlotsContainer = document.getElementById('save-slots-container');
    saveSlotsContainer.innerHTML = ''; // Clear existing buttons

    for (let i = 1; i <= 3; i++) { // Assuming 3 save slots
        const slotButton = document.createElement('button');
        const savedData = localStorage.getItem(`saveSlot_${i}`);
        if (savedData) {
            slotButton.textContent = `Save Slot ${i} (Last Saved)`;
        } else {
            slotButton.textContent = `Save Slot ${i} (New Game)`;
        }
        slotButton.addEventListener('click', () => {
            loadGame(i); // Load the selected save slot
            switchToGameScene();
        });
        saveSlotsContainer.appendChild(slotButton);
    }
}

function switchToGameScene() {
    document.getElementById('save-slots-menu').style.display = 'none';
    document.querySelector('canvas').style.display = 'block';
    gui.show(); // Show GUI when in game scene
}

function switchToMenuScene() {
    document.getElementById('save-slots-menu').style.display = 'block';
    document.querySelector('canvas').style.display = 'none';
    gui.hide(); // Hide GUI when in menu scene
    populateSaveSlots(); // Refresh save slots
}

function saveGame(slotId) {
    const saveData = {
        cakeBase: null,
        cakes: [],
        creamBlobs: [],
        knife: null
    };

    // Save single cake base instance
    if (placedCakeBase) {
        saveData.cakeBase = {
            position: placedCakeBase.position,
            rotation: placedCakeBase.rotation,
            scale: placedCakeBase.scale
        };
    }

    // Save cake pieces (from cutting)
    placedCakes.forEach(cake => {
        saveData.cakes.push({
            position: cake.position,
            rotation: cake.rotation,
            scale: cake.scale
        });
    });

    // Save cream blobs (multiple instances allowed)
    creamBlobs.forEach(creamBlob => {
        saveData.creamBlobs.push({
            position: creamBlob.position,
            rotation: creamBlob.rotation,
            scale: creamBlob.scale
        });
    });

    // Save knife instance
    if (placedKnife) {
        saveData.knife = {
            position: placedKnife.position,
            rotation: placedKnife.rotation,
            scale: placedKnife.scale
        };
    }

    localStorage.setItem(`saveSlot_${slotId}`, JSON.stringify(saveData));
    populateSaveSlots(); // Update menu after saving
}

function loadGame(slotId) {
    currentSlotId = slotId;
    const savedData = localStorage.getItem(`saveSlot_${slotId}`);
    if (savedData) {
        const saveData = JSON.parse(savedData);

        // Clear existing objects
        if (placedCakeBase) {
            turntable.remove(placedCakeBase);
            placedCakeBase = null;
        }
        placedCakes.forEach(cake => turntable.remove(cake));
        placedCakes.length = 0;
        creamBlobs.forEach(creamBlob => turntable.remove(creamBlob));
        creamBlobs.length = 0;
        if (placedKnife) {
            scene.remove(placedKnife);
            placedKnife = null;
        }

        // Load cake base (single instance)
        if (saveData.cakeBase) {
            loader.load('assets/cake.glb', (gltf) => {
                const newCakeBase = gltf.scene;
                newCakeBase.position.copy(saveData.cakeBase.position);
                newCakeBase.rotation.copy(saveData.cakeBase.rotation);
                newCakeBase.scale.copy(saveData.cakeBase.scale);
                turntable.add(newCakeBase);
                placedCakeBase = newCakeBase;
                updateObjectList();
            });
        }

        // Load cake pieces (from cutting)
        if (saveData.cakes) {
            saveData.cakes.forEach(cakeData => {
                loader.load('assets/cake.glb', (gltf) => {
                    const newCake = gltf.scene;
                    newCake.position.copy(cakeData.position);
                    newCake.rotation.copy(cakeData.rotation);
                    newCake.scale.copy(cakeData.scale);
                    turntable.add(newCake);
                    placedCakes.push(newCake);
                });
            });
            updateObjectList();
        }

        // Load cream blobs
        if (saveData.creamBlobs) {
            saveData.creamBlobs.forEach(creamBlobData => {
                const geometry = new THREE.SphereGeometry(0.1, 16, 16);
                const material = new THREE.MeshBasicMaterial({color: 0xffffff});
                const newCreamBlob = new THREE.Mesh(geometry, material);
                newCreamBlob.position.copy(creamBlobData.position);
                newCreamBlob.rotation.copy(creamBlobData.rotation);
                newCreamBlob.scale.copy(creamBlobData.scale);
                turntable.add(newCreamBlob);
                creamBlobs.push(newCreamBlob);
            });
            updateObjectList();
        }

        // Load knife (single instance)
        if (saveData.knife) {
            const geometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
            const material = new THREE.MeshBasicMaterial({color: 0x808080});
            const newKnife = new THREE.Mesh(geometry, material);
            newKnife.position.copy(saveData.knife.position);
            newKnife.rotation.copy(saveData.knife.rotation);
            newKnife.scale.copy(saveData.knife.scale);
            scene.add(newKnife);
            placedKnife = newKnife;
            updateObjectList();
        }
    } else {
        // Start a new game if no saved data
        if (placedCakeBase) {
            turntable.remove(placedCakeBase);
            placedCakeBase = null;
        }
        placedCakes.forEach(cake => turntable.remove(cake));
        placedCakes.length = 0;
        creamBlobs.forEach(creamBlob => turntable.remove(creamBlob));
        creamBlobs.length = 0;
        if (placedKnife) {
            scene.remove(placedKnife);
            placedKnife = null;
        }
        updateObjectList();
    }
}

function updateCursorVisibility() {
    if (cakeBase) cakeBase.visible = (currentMode === 1);
    if (cream) cream.visible = (currentMode === 2);
    if (knife) knife.visible = (currentMode === 3);
}