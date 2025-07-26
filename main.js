let scene, camera, renderer, effect, controls, light, listener, sound, audioLoader, ambientLight, loader, table, turntable;
let gui, guiParams;
let currentMode = 0; // 0: none, 1: Cake Base, 2: Cream, 3: Knife, 4: Appreciation
let cakeBase;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedCake = null;
const placedCakes = [];
let cream;
const creamBlobs = [];
let isExtruding = false;
let knife;
let isCutting = false;
let turntableRotationSpeed = 0;
const keyPressStartTime = {};
let gameInitialized = false;
let currentSlotId = null;
let enterPressStartTime = 0;
let key1Pressed = false; // Track if '1' is pressed for knife mode combo
let key2Pressed = false; // Track if '2' is pressed for knife mode combo

window.addEventListener('DOMContentLoaded', init);

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

        audioLoader = new THREE.AudioLoader();
        audioLoader.load( 'assets/cake_walk.mp3', function( buffer ) {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
        });

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

        gui.add(guiParams, 'mode', { 'None': 0, 'Cake Base': 1, 'Cream': 2, 'Knife': 3, 'Appreciation': 4 }).name('Current Mode').onChange((value) => {
            currentMode = value;
            updateCursorVisibility();
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
            guide: 'Press 1 for Cake Base Mode\nPress 2 for Cream Mode\nPress 3 for Knife Mode\nPress Enter for Appreciation Mode\n\nCake Base Mode:\n  Left-click (spacebar) to drop cake\n  Right-click and drag to reposition\n\nCream Mode:\n  Left-click and hold to extrude cream\n  Right-click to remove cream\n\nKnife Mode:\n  A/D to rotate knife\n  Left-click to cut/smooth\n\nTurntable:\n  W/S to rotate turntable'
        }, 'guide').name('Instructions').disable();
        userGuideFolder.open();

        document.addEventListener('keydown', (event) => {
            if ((event.key === 'w' || event.key === 's') && !keyPressStartTime[event.key]) {
                keyPressStartTime[event.key] = Date.now();
            }
            if (event.key === '1') key1Pressed = true;
            if (event.key === '2') key2Pressed = true;
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 's') {
                const pressDuration = Date.now() - keyPressStartTime[event.key];
                turntableRotationSpeed += (pressDuration / 1000) * (event.key === 'w' ? 1 : -1);
                delete keyPressStartTime[event.key];
            }
            if (event.key === '1') key1Pressed = false;
            if (event.key === '2') key2Pressed = false;
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === '1') {
                currentMode = 1;
                guiParams.mode = 1;
            } else if (event.key === '2') {
                currentMode = 2;
                guiParams.mode = 2;
            } else if (event.key === '3') {
                currentMode = 3;
                guiParams.mode = 3;
            } else if (event.key === 'Enter') {
                if (!enterPressStartTime) {
                    enterPressStartTime = Date.now();
                }
                currentMode = 4;
                guiParams.mode = 4;
            }

            if ((event.key === 'w' || event.key === 's') && !keyPressStartTime[event.key]) {
                keyPressStartTime[event.key] = Date.now();
            }
            updateCursorVisibility();
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const pressDuration = Date.now() - enterPressStartTime;
                if (pressDuration > 1000) { // Long press
                    saveGame(currentSlotId);
                    switchToMenuScene();
                }
                enterPressStartTime = 0;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Right mouse button
                event.preventDefault();
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(placedCakes, true);
                if (intersects.length > 0) {
                    let clickedObject = intersects[0].object;
                    while (clickedObject.parent !== scene) {
                        clickedObject = clickedObject.parent;
                    }
                    selectedCake = clickedObject;
                    controls.enabled = false;
                }
            }
        });

        const trashBin = document.getElementById('trash-bin');

        document.addEventListener('mouseup', (event) => {
            if (event.button === 2) { // Right mouse button
                if (selectedCake) {
                    const trashBinRect = trashBin.getBoundingClientRect();
                    if (
                        event.clientX >= trashBinRect.left &&
                        event.clientX <= trashBinRect.right &&
                        event.clientY >= trashBinRect.top &&
                        event.clientY <= trashBinRect.bottom
                    ) {
                        scene.remove(selectedCake);
                        placedCakes.splice(placedCakes.indexOf(selectedCake), 1);
                    }
                }
                selectedCake = null;
                controls.enabled = true;
            }
        });

        document.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

            if (selectedCake) {
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObject(turntable, true);
                if (intersects.length > 0) {
                    selectedCake.position.copy(intersects[0].point);
                }
            }
        });

        document.addEventListener('keydown', (event) => {
            if (currentMode === 1 && event.code === 'Space') {
                loader.load('assets/cake.glb', (gltf) => {
                    const newCake = gltf.scene;
                    newCake.scale.set(guiParams.cakeSize, guiParams.cakeSize, guiParams.cakeSize);
                    newCake.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshBasicMaterial({color: guiParams.cakeColor});
                        }
                    });
                    newCake.position.copy(cakeBase.position); // Use current preview position
                    turntable.add(newCake); // Add to turntable
                    placedCakes.push(newCake);
                });
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (currentMode === 2 && event.button === 0) { // Left mouse button
                isExtruding = true;
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (currentMode === 2 && event.button === 0) { // Left mouse button
                isExtruding = false;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (currentMode === 2 && event.button === 2) { // Right mouse button
                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(creamBlobs, true);
                if (intersects.length > 0) {
                    const hitPoint = intersects[0].point;
                    const removalRadius = guiParams.creamRemovalSize;
                    for (let i = creamBlobs.length - 1; i >= 0; i--) {
                        const blob = creamBlobs[i];
                        if (blob.position.distanceTo(hitPoint) < removalRadius) {
                            turntable.remove(blob); // Remove from turntable
                            creamBlobs.splice(creamBlobs.indexOf(blob), 1);
                        }
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

        document.addEventListener('mousedown', (event) => {
            if (currentMode === 3 && event.button === 0) { // Left mouse button
                isCutting = true;
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (currentMode === 3 && event.button === 0) { // Left mouse button
                isCutting = false;
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
                    const geometry = new THREE.SphereGeometry(guiParams.creamThickness, 16, 16);
                    const material = new THREE.MeshBasicMaterial({color: guiParams.creamColor});
                    cream = new THREE.Mesh(geometry, material);
                    cream.visible = false;
                    scene.add(cream);
                }
                if (cream) {
                    cream.scale.set(guiParams.creamThickness / 0.1, guiParams.creamThickness / 0.1, guiParams.creamThickness / 0.1);
                    cream.traverse((child) => {
                        if (child.isMesh) {
                            child.material.color.set(guiParams.creamColor);
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
                    const geometry = new THREE.BoxGeometry(0.1, 0.5, 0.05);
                    const material = new THREE.MeshBasicMaterial({color: 0x808080});
                    knife = new THREE.Mesh(geometry, material);
                    knife.visible = false;
                    scene.add(knife);
                }
                if (knife) {
                    knife.visible = true;
                    const objectsToIntersect = [];
                    if (key1Pressed && event.key === '3') { // Knife affects cakes only
                        objectsToIntersect.push(...placedCakes);
                    } else if (key2Pressed && event.key === '3') { // Knife affects cream only
                        objectsToIntersect.push(...creamBlobs);
                    } else if (event.key === '3') { // Knife affects both if only '3' is pressed
                        objectsToIntersect.push(...placedCakes, ...creamBlobs);
                    }

                    const intersects = raycaster.intersectObjects(objectsToIntersect, true);
                    if (intersects.length > 0) {
                        knife.position.copy(intersects[0].point);

                        if (isCutting) {
                            const intersectedObject = intersects[0].object;
                            if (placedCakes.includes(intersectedObject.parent)) {
                                turntable.remove(intersectedObject.parent); // Remove from turntable
                                placedCakes.splice(placedCakes.indexOf(intersectedObject.parent), 1);
                            } else if (creamBlobs.includes(intersectedObject)) {
                                turntable.remove(intersectedObject); // Remove from turntable
                                creamBlobs.splice(creamBlobs.indexOf(intersectedObject), 1);
                            }
                        }
                    }
                     else {
                        knife.visible = false;
                    }
                }
            }
             else if (knife) {
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
        cakes: [],
        creamBlobs: []
    };

    placedCakes.forEach(cake => {
        saveData.cakes.push({
            position: cake.position,
            rotation: cake.rotation,
            scale: cake.scale
        });
    });

    creamBlobs.forEach(creamBlob => {
        saveData.creamBlobs.push({
            position: creamBlob.position,
            rotation: creamBlob.rotation,
            scale: creamBlob.scale
        });
    });

    localStorage.setItem(`saveSlot_${slotId}`, JSON.stringify(saveData));
    populateSaveSlots(); // Update menu after saving
}

function loadGame(slotId) {
    currentSlotId = slotId;
    const savedData = localStorage.getItem(`saveSlot_${slotId}`);
    if (savedData) {
        const saveData = JSON.parse(savedData);

        // Clear existing objects
        placedCakes.forEach(cake => turntable.remove(cake)); // Remove from turntable
        placedCakes.length = 0;
        creamBlobs.forEach(creamBlob => turntable.remove(creamBlob)); // Remove from turntable
        creamBlobs.length = 0;

        // Load new objects
        saveData.cakes.forEach(cakeData => {
            loader.load('assets/cake.glb', (gltf) => {
                const newCake = gltf.scene;
                newCake.position.copy(cakeData.position);
                newCake.rotation.copy(cakeData.rotation);
                newCake.scale.copy(cakeData.scale);
                turntable.add(newCake); // Add to turntable
                placedCakes.push(newCake);
            });
        });

        saveData.creamBlobs.forEach(creamBlobData => {
            const geometry = new THREE.SphereGeometry(0.1, 16, 16);
            const material = new THREE.MeshBasicMaterial({color: 0xffffff});
            const newCreamBlob = new THREE.Mesh(geometry, material);
            newCreamBlob.position.copy(creamBlobData.position);
            newCreamBlob.rotation.copy(creamBlobData.rotation);
            newCreamBlob.scale.copy(creamBlobData.scale);
            turntable.add(newCreamBlob); // Add to turntable
            creamBlobs.push(newCreamBlob);
        });
    } else {
        // Start a new game if no saved data
        placedCakes.forEach(cake => turntable.remove(cake));
        placedCakes.length = 0;
        creamBlobs.forEach(creamBlob => turntable.remove(creamBlob));
        creamBlobs.length = 0;
    }
}

function updateCursorVisibility() {
    if (cakeBase) cakeBase.visible = (currentMode === 1);
    if (cream) cream.visible = (currentMode === 2);
    if (knife) knife.visible = (currentMode === 3);
}