import * as THREE from './build/three.module.js';

import {OrbitControls} from './js/jsm/controls/OrbitControls.js';
import {FBXLoader} from './js/jsm/loaders/FBXLoader.js';
import PhysicsUtils from './TP3_PhysicsUtils.js';

const textureLoader = new THREE.TextureLoader();
const shaderLoader = new THREE.FileLoader();
const audioLoader = new THREE.AudioLoader();
let renderer, camera, scene, raycaster, listener;
const clock = new THREE.Clock();
const PHYSICS_MULTIPLIER = 16;
const SPHERE_HEIGHT = 1.9;
const SPHERE_RADIUS = 2;
const HOLE_RADIUS = 4.5;
const MAX_FORCE_LENGTH = 30;
const MAX_SPEED = 1000;

let line, tableMesh;

//Create objects for physics engine
const wallPositions0 = [];
const wallPositions1 = [];

const circlePositions = [];
const circleVelocities = [];
const spheres3D = [];
const sounds3D = [];


let spotLight;

let lightColor = new THREE.Color(1.0,1.0,1.0);
let ambientLightColor = new THREE.Color(0.3,0.3,0.3);
let lightDirection = new THREE.Vector3(0,-1,0);

function init() {

	//Init Camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
	camera.position.set(20, 50, 120);
	
	//Init Raycaster
	raycaster = new THREE.Raycaster();
	
	//Init Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	scene.fog = new THREE.Fog(0x000000, 1000, 5000);

	//Add Ambient Light
	const hemiLight = new THREE.HemisphereLight(ambientLightColor, ambientLightColor, 1.0);
	hemiLight.position.set(0, 200, 0);
	scene.add(hemiLight);

	//Add Directional Light
	spotLight = new THREE.DirectionalLight(lightColor, 1.0);
	spotLight.position.set(400, 500, 100);
	spotLight.target.position.set(0, 0, 0);
	scene.add(spotLight);
	scene.add(spotLight.target);
	const newLightDirection = new THREE.Vector3(0,0,0).sub(spotLight.position).normalize();
	lightDirection.copy(newLightDirection);

	//Add Ground
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(100000, 100000), new THREE.MeshPhongMaterial({color: 0x100D1A + 0x101010, shininess: 10, depthWrite: true}));
	ground.rotation.x = - Math.PI / 2;
	ground.position.y = -1;
	scene.add(ground);

	const grid = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
	scene.add(grid);
	
	//Add Table Surface
	const tableMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF, opacity: 0, transparent: true});
	const tableGeometry = new THREE.PlaneGeometry(10000, 10000);
	tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
	tableMesh.translateY(SPHERE_HEIGHT);
	tableMesh.rotateX(- Math.PI / 2);
	scene.add(tableMesh);
	
	//Add Impulse Line
	const lineMaterial = new THREE.LineBasicMaterial({color: 0xFFFFFF});
	const lineGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0)]);
	line = new THREE.Line(lineGeometry, lineMaterial);
	line.frustumCulled = false;
	scene.add(line);
	
	//Init Renderer
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	
	const container = document.createElement('div');
	document.body.appendChild(container);
	container.appendChild(renderer.domElement);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0, 0);
	controls.update();

	window.addEventListener('resize', onWindowResize);
	document.addEventListener('mousedown', onDocumentMouseDown, false);
	document.addEventListener('mousemove', onDocumentMouseMove, false);
	document.addEventListener("keydown", onDocumentKeyDown, false);
	
	// create an AudioListener and add it to the camera
	listener = new THREE.AudioListener();
	camera.add(listener);
	
	//Add Walls for physics engine
	wallPositions0.push(new THREE.Vector2(-1.5, 0));
	wallPositions1.push(new THREE.Vector2(38.5, 0));
	const plane0 = new THREE.Mesh(new THREE.PlaneGeometry(40, 10), new THREE.MeshPhongMaterial({color: 0x555500, shininess: 50, side: THREE.DoubleSide}));
	plane0.position.set(18.5, 5, 0);
	scene.add(plane0);
	
	//Add Pool Balls
	addSphere(-40, 50, 0, 0, 0xEEEEEE, false, -1);
	addSphere(-20, 50, 0, 0, 0xE53118, false, 3);
	addSphere(0, 50, 0,0, 0xE53118, false, 9);
	addSphere(20, 50, 0, 0, 0xE53118, false, 14);
	addSphere(40, 50, 0, 0, 0x202020, false, 8);
	
	
	addSphere(-40 + 1, 0, 0, 0, 0x00914E, false, 6);
	addSphere(-40 - 1, 0, 0, 0, 0xE53118, true, 11);
	addSphere(-40, 1.73205080757 * 2, 0, 0, 0xFEED01, false, 1);
	
	addSphere(-20, 0, 0, 0, 0x182983, false, 2);
}

function addSphere(px, py, vx, vy, color, isStriped, number) {
	const c = new THREE.Color(color);
	
	circlePositions.push(new THREE.Vector2(px, py));
	circleVelocities.push(new THREE.Vector2(vx, vy));
	
	let sphereTexture;
	if (isStriped) {
		sphereTexture = textureLoader.load('models/billard_mask_striped.png');
	} else {
		sphereTexture = textureLoader.load('models/billard_mask.png');
	}
	let sphereNumTexture;
	if (number > 0) {
		sphereNumTexture = textureLoader.load('models/' + number + '.png');
	} else {
		sphereTexture = textureLoader.load('models/billard_empty.png');
		sphereNumTexture = textureLoader.load('models/billard_empty.png');
	}
	
	const sphereMaterial = new THREE.ShaderMaterial({
	  uniforms: {
			textureMask: { type: "t", value: sphereTexture},
			textureNumberMask: { type: "t", value: sphereNumTexture},
			maskLightColor: {type:'v3', value: new THREE.Vector3(0.969, 0.969, 0.831)},
			lightColor: {type:'v3', value:new THREE.Vector3(lightColor.r,lightColor.g,lightColor.b)},
			ambientLightColor: {type:'v3', value:new THREE.Vector3(ambientLightColor.r, ambientLightColor.g, ambientLightColor.b)},
			lightDirection: {type:'v3', value: lightDirection},
			materialAmbientColor: {type:'v3', value:new THREE.Vector3(c.r, c.g, c.b)},
			materialDiffuseColor: {type:'v3', value:new THREE.Vector3(c.r, c.g, c.b)},
			materialSpecularColor: {type:'v3', value:new THREE.Vector3(0.8, 0.8, 0.8)},
			shininess : {type:'f', value: 10.0},
	  },
	});

	if (number <= 5) {
		shaderLoader.load('glsl/gouraud.fs.glsl', function(data) {
			sphereMaterial.fragmentShader = data;
			sphereMaterial.needsUpdate = true;
		});

		shaderLoader.load('glsl/gouraud.vs.glsl', function(data) {
			sphereMaterial.vertexShader = data;
			sphereMaterial.needsUpdate = true;
		});
	} else if (number <= 10) {
		shaderLoader.load('glsl/phong.fs.glsl', function(data) {
			sphereMaterial.fragmentShader = data;
			sphereMaterial.needsUpdate = true;
		});

		shaderLoader.load('glsl/phong.vs.glsl', function(data) {
			sphereMaterial.vertexShader = data;
			sphereMaterial.needsUpdate = true;
		});
	} else {
		shaderLoader.load('glsl/blinnphong.fs.glsl', function(data) {
			sphereMaterial.fragmentShader = data;
			sphereMaterial.needsUpdate = true;
		});

		shaderLoader.load('glsl/blinnphong.vs.glsl', function(data) {
			sphereMaterial.vertexShader = data;
			sphereMaterial.needsUpdate = true;
		});
	}


	const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 8), sphereMaterial);
	
	sphere.position.set(px, SPHERE_HEIGHT, py);
	sphere.rotateX(-Math.PI/2);
	scene.add(sphere);
	
	spheres3D.push(sphere);
	
	
	// create the PositionalAudio object (passing in the listener)
	const sound = new THREE.PositionalAudio(listener);
	
	// load a sound and set it as the PositionalAudio object's buffer
	audioLoader.load('sounds/collide0.ogg', function(buffer) {
		sound.setBuffer(buffer);
		sound.setRefDistance(20);
	});

	// finally add the sound to the mesh
	sphere.add(sound);
	
	sounds3D.push(sound);
	
}

function physicsStep(delta) {
	
	//Resolve velocities
	for (let i=0; i<circlePositions.length; i++) {
		const p = circlePositions[i];
		const v = circleVelocities[i];
		
		if (i == isRightSelected) {
			continue;
		}
			
		for (let j=0; j<wallPositions0.length; j++) {
			const lp0 = wallPositions0[j];
			const lp1 = wallPositions1[j];
			
			if (PhysicsUtils.checkCollisionCircleSegmentInner(p, SPHERE_RADIUS, lp0, lp1)) {
				PhysicsUtils.resolveVelocityCollisionCircleSegmentInner(p, v, lp0, lp1, SPHERE_RADIUS);
			} else if (PhysicsUtils.checkCollisionCircleSegmentOuter(p, SPHERE_RADIUS, lp0, lp1)) {
				PhysicsUtils.resolveVelocityCollisionCircleSegmentOuter(p, v, lp0, lp1, SPHERE_RADIUS);
			}
		}
		for (let j=i+1; j<circlePositions.length; j++) {
			const p1 = circlePositions[j];
			const v1 = circleVelocities[j];
			
			if (i != isRightSelected && j != isRightSelected && PhysicsUtils.checkCollisionCircleCircle(p, p1, SPHERE_RADIUS)) {
				
				const energy = v1.distanceTo(v);
				PhysicsUtils.resolveVelocityCollisionCircleCircle(p, v, p1, v1, SPHERE_RADIUS, 0.9);
				
				if (!sounds3D[i].isPlaying) {
					let volume = energy * 0.01;
					sounds3D[i].setVolume(volume);
					sounds3D[i].play();
				}
				
			}
		}
	}
	
	//Iteratively resolve positions
	let resolved = false;
	let resolveTries = 0;
	while (!resolved) {
		resolved = true;
		for (let i=0; i<circlePositions.length; i++) {
			const p = circlePositions[i];
			const v = circleVelocities[i];
			
			if (i == isRightSelected) {
				continue;
			}
			
			for (let j=0; j<wallPositions0.length; j++) {
				const lp0 = wallPositions0[j];
				const lp1 = wallPositions1[j];
				
				if (PhysicsUtils.checkCollisionCircleSegmentInner(p, SPHERE_RADIUS, lp0, lp1)) {
					resolved = false;
					PhysicsUtils.resolvePositionCollisionCircleSegmentInner(p, lp0, lp1, SPHERE_RADIUS);
				} else if (PhysicsUtils.checkCollisionCircleSegmentOuter(p, SPHERE_RADIUS, lp0, lp1)) {
					resolved = false;
					PhysicsUtils.resolvePositionCollisionCircleSegmentOuter(p, lp0, lp1, SPHERE_RADIUS);
				}
			}
			
			for (let j=i+1; j<circlePositions.length; j++) {
				const p1 = circlePositions[j];
				const v1 = circleVelocities[j];
				
				if (i != isRightSelected && j != isRightSelected && PhysicsUtils.checkCollisionCircleCircle(p, p1, SPHERE_RADIUS)) {
					resolved = false;
					PhysicsUtils.resolvePositionCollisionCircleCircle(p, p1, SPHERE_RADIUS);
				}
			}
			
		}
		if (resolveTries > 1000) {
			resolved = true;
		}
		resolveTries += 1;
	}
	
	//Iterate next step
	for (let i=0; i<circlePositions.length; i++) {
		const p = circlePositions[i];
		const v = circleVelocities[i];
		const oldP = p.clone();
		
		PhysicsUtils.applyMovement(p, v, delta);
		PhysicsUtils.applyFriction(p, v, delta, 0.5, 2.0);
		
		spheres3D[i].position.set(p.x, SPHERE_HEIGHT, p.y);
		const dp = p.clone().sub(oldP);
		if (dp.lengthSq() > 0) {
			PhysicsUtils.applyRotation(new THREE.Vector3(dp.x, 0, dp.y), SPHERE_RADIUS, spheres3D[i]);
		}
	}
}

let isSelected = -1;
let isRightSelected = -1;
function onDocumentMouseDown(e) {
	e.preventDefault();
	
	//Define mouse ray
	let mousex = (event.clientX / window.innerWidth) * 2 - 1;
	let mousey = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(new THREE.Vector2(mousex, mousey), camera);
	
	//Get mouse ray in world coordinates
	let pm = new THREE.Vector3(mousex, mousey, 0.5);
	pm.unproject(camera);
	pm.sub(camera.position).normalize();
	pm.multiplyScalar(1000).add(camera.position);
	
	//Check for intersections
	let intersected = [];
	for (let i=0; i<circlePositions.length; i++) {
		let p = spheres3D[i].position;
		
		if (PhysicsUtils.checkCollisionCircleSegmentInner(p, SPHERE_RADIUS, camera.position, pm)) {
			intersected.push(i);
		}
	}
	
	//Find closest intersection
	let lineposarr = line.geometry.attributes.position.array;
	let minsphere = -1;
	if (intersected.length > 0) {
		let mindist = 10000000;
		for (let i=0; i<intersected.length; i++) {
			const idx = intersected[i];
			const newdist = camera.position.distanceToSquared(spheres3D[idx].position);
			if (newdist <= mindist) {
				mindist = newdist;
				minsphere = idx;
			}
		}
	}
	
	if (isSelected == -1 && isRightSelected == -1 && minsphere >= 0) {
		if (event.buttons == 1) {
			isSelected = minsphere;
			isRightSelected = -1;
			
			lineposarr[3] = spheres3D[isSelected].position.x;
			lineposarr[4] = spheres3D[isSelected].position.y;
			lineposarr[5] = spheres3D[isSelected].position.z;
			line.geometry.attributes.position.needsUpdate = true;
			
		} else if (event.buttons == 2) {
			isRightSelected = minsphere;
			isSelected = -1;
			
			circleVelocities[minsphere].setScalar(0);
		}
	} else if (isSelected >= 0) {
		if (event.buttons == 1 && minsphere != isSelected) { //Do Action
			let intersects = raycaster.intersectObjects([tableMesh], false);
			
			if (intersects.length > 0) {
				let origin = spheres3D[isSelected].position;
				let newpoint = intersects[0].point.clone().sub(origin);
				if (newpoint.length() > MAX_FORCE_LENGTH) {
					newpoint.setLength(MAX_FORCE_LENGTH);
				}
				
				let relativeSpeed = (newpoint.length() / MAX_FORCE_LENGTH);
				relativeSpeed *= relativeSpeed;
				let newVelocity = new THREE.Vector2(newpoint.x, newpoint.z).setLength(relativeSpeed * MAX_SPEED);
				circleVelocities[isSelected].add(newVelocity);
			}
		}
		
		isSelected = -1;
		lineposarr[0] = 100000;
		lineposarr[1] = 100000;
		lineposarr[2] = 100000;
		lineposarr[3] = 100000;
		lineposarr[4] = 100000;
		lineposarr[5] = 100000;
		line.geometry.attributes.position.needsUpdate = true;
	} else if (isRightSelected >= 0) {
		isRightSelected = -1;
	}
	
}

function onDocumentMouseMove(e) {
	//Define mouse ray
	let mousex = (event.clientX / window.innerWidth) * 2 - 1;
	let mousey = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(new THREE.Vector2(mousex, mousey), camera);
	
	let lineposarr = line.geometry.attributes.position.array;
	
	if (isSelected >= 0) {
		
		let intersects = raycaster.intersectObjects([tableMesh], false);
		if (intersects.length > 0) {
			let origin = spheres3D[isSelected].position;
			let newpoint = intersects[0].point.clone().sub(origin);
			
			if (newpoint.length() > MAX_FORCE_LENGTH) {
				newpoint.setLength(MAX_FORCE_LENGTH);
			}
			newpoint.add(origin);
			
			lineposarr[3] = newpoint.x;
			lineposarr[4] = newpoint.y;
			lineposarr[5] = newpoint.z;
			//console.log(intersects[0]);
		}
		
		line.geometry.attributes.position.needsUpdate = true;
	} else if (isRightSelected >= 0) {
		
		let intersects = raycaster.intersectObjects([tableMesh], false);
		if (intersects.length > 0) {
			let newPosition = new THREE.Vector2(intersects[0].point.x, intersects[0].point.z)
			circlePositions[isRightSelected].copy(newPosition);
		}
	}
}
	
let enabled = false;
function onDocumentKeyDown(e) {
    var keyCode = e.which;
    if (keyCode == 82 || keyCode == 69) {
		for (let i=0; i<circleVelocities.length; i++) {
			circleVelocities[i].set(0, 0);
			spheres3D[i].setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), 0);
			spheres3D[i].rotateX(-Math.PI/2);
		}
		
		circlePositions[0].set(-40, 50);
		circlePositions[1].set(-20, 50);
		circlePositions[2].set(0, 50);
		circlePositions[3].set(20, 50);
		circlePositions[4].set(40, 50);
		circlePositions[5].set(-40 + 1, 0);
		circlePositions[6].set(-40 - 1, 0);
		circlePositions[7].set(-40, 1.73205080757 * 2);
		circlePositions[8].set(-20, 0);
		enabled = false;
	} else if (keyCode == 32) {
		if (!enabled) {
			circleVelocities[0].set(0, -100);
			circleVelocities[1].set(0, -100);
			circleVelocities[2].set(20, -100);
			circleVelocities[3].set(0, -100);
			circleVelocities[4].set(0, -100);
			circleVelocities[8].set(0, 30);
			enabled = true;
		}
	} else if (keyCode == 87) { //W
		spotLight.position.z -= 10;
	} else if (keyCode == 83) { //S
		spotLight.position.z += 10;
	} else if (keyCode == 65) { //A
		spotLight.position.x -= 10;
	} else if (keyCode == 68) { //D
		spotLight.position.x += 10;
	} else if (keyCode == 81) { //Q, reset light
		spotLight.position.x = 0;
		spotLight.position.z = 0;
	}
	if (spotLight.position.x > 500) {
		spotLight.position.x = 500;
	} else if (spotLight.position.x < -500) {
		spotLight.position.x = -500;
	} else if (spotLight.position.z > 500) {
		spotLight.position.z = 500;
	} else if (spotLight.position.z < -500) {
		spotLight.position.z = -500;
	}
	const newLightDirection = new THREE.Vector3(0,0,0).sub(spotLight.position).normalize();
	lightDirection.copy(newLightDirection);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);
	const delta = clock.getDelta();
	for (let i=0; i<PHYSICS_MULTIPLIER; i++) {
		physicsStep(delta / PHYSICS_MULTIPLIER);
	}
	
	if (isSelected >= 0) {
		let lineposarr = line.geometry.attributes.position.array;	
		lineposarr[0] = spheres3D[isSelected].position.x;
		lineposarr[1] = spheres3D[isSelected].position.y;
		lineposarr[2] = spheres3D[isSelected].position.z;
		line.geometry.attributes.position.needsUpdate = true;
	}
	
	renderer.render(scene, camera);
}

init();
animate();