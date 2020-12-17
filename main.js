import * as THREE from './libs/node_modules/three/build/three.module.js';
import { OrbitControls } from './libs/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from './libs/node_modules/three/examples/jsm/geometries/ConvexGeometry.js';

var renderer;

var scene;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const camera3 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const helper3 = new THREE.CameraHelper( camera3 );
const helper2 = new THREE.CameraHelper( camera2 );
const camera2Prop = createCameraProp();
const camera3Prop = createCameraProp();

var controls;
var options = {
        fov: 45,
		camera: 'C1'
      };

//Karaliaus figūros sudarymo taškai
const points_x = [23, 24, 21, 20, 16, 13, 12, 13, 14, 11, 10, 9, 8, 7, 8, 16, 10, 10, 7, 8, 11, 14, 14, 10, 5, 5, 11, 11, 4, 5, 6, 4];
const points_y = [1, 3, 5, 9, 12, 15, 19, 22, 24, 25, 29, 33, 39, 46, 51, 52, 55, 57, 58, 61, 65, 70, 76, 77, 79, 82, 82, 89, 89, 92, 94, 96];
//Figūros dydžio konstanta
const figure_size = 0.5;
// lentos dydis
const boardSize = 300;
const tileSize = boardSize / 8;
// Paskaičiuojam pradines karalių pozicijas
const movingKingStartPosition = new THREE.Vector3(tileSize * -1.5, 0, tileSize * 1.5);
const stationaryKingStartPosition = new THREE.Vector3(tileSize * -2.5, 0, tileSize * -1.5);
// C2 kameros žiūrėjimo taškas pakelta į figūros viršų
var C2LookingPoint = stationaryKingStartPosition.clone();
C2LookingPoint.y += 40;
var camera2ToKingStartVector = new THREE.Vector3();
var camera2TargetScale;


var movingKing;

function init() {
	var gui = new dat.GUI();
	//dat.gui parametrai, reguliuojama kuri kamera rodo ir pirmos kameros FOV
	gui.add(options, 'fov', 0, 90);
	gui.add(options, 'camera', ['C1', 'C2', 'C3']);
	render();
}

//Pagrindinė funkcija viską surendinanti
function render() {
	document.getElementById("webgl-output").innerHTML = ''; //ištrinam prieš tai buvusius objektus
	
	//Sukuriam sceną, renderį ir kameros valdymą
	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0x000000));
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls = new OrbitControls( camera, renderer.domElement );
	
	//Camera 1 sureguliavimas
	camera.position.set(0, 200, 350);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	
	//Kamera 2 sureguliavimas, pridedam kameros vaizdavimo objektą ir nustatom tikra kamera kaip vaiką
	scene.add(camera2Prop);
	//Pakeičiam defaultinį camera lookup vektorių į standartinį, kad sutaptų reguliuojant prop
	camera2.lookAt(new THREE.Vector3(0, 0, 1));
	//Pririšam kamerą prie jos atvaizdavimo
	camera2Prop.add(camera2);
	//Nustatom pradinę poziciją
	camera2Prop.position.add(C2LookingPoint);
	camera2Prop.position.x -= 100;
	camera2Prop.position.y += 40;
	camera2Prop.up = new THREE.Vector3(0, 1, 0)
	camera2Prop.lookAt(C2LookingPoint);
	
	//Paskaičiuojam vektorių nuo C2 žiūrėjimo taško iki C2 pozicijos
	camera2ToKingStartVector.subVectors( camera2Prop.position, C2LookingPoint );
	//Dauginimas iš Math.PI/180 fov laipsnius paverčia radianais, dalyba iš dviejų paima kampą nuo centro iki matymo šono.
	//Padaugindami pusę fov tangentą iš pradinio atstumo iki tikslo, užfiksuojam norimą išlaikyti vaizdo kampą
	camera2TargetScale = Math.tan(camera2.fov * (Math.PI/180)/2)*camera2ToKingStartVector.length();
	//Pridedam wireframe kameros
	scene.add( helper2 );
	
	//Pririšam prie vaizdavimo ir nustatom pradinę poziciją bei įjungiam pagalbinį wireframe
	scene.add(camera3Prop);
	camera3.lookAt(new THREE.Vector3(0, 0, 1));
	camera3Prop.add(camera3);
	camera3Prop.position.add(movingKingStartPosition);
	camera3Prop.position.x += tileSize * 2.5;
	camera3Prop.position.y += 100;
	camera3Prop.lookAt(movingKingStartPosition)
	scene.add( helper3 );
	
	//Pridedam Ambient šviesą
	const light = new THREE.AmbientLight( 0x404040, 3 ); // soft white light
	scene.add( light );
	
	//Pridedam Spotlight šviesą
	const spotLight = new THREE.SpotLight( 0xffffff);
	spotLight.position.set( 0, 250, 0 );
	spotLight.castShadow = true;
	scene.add( spotLight );
	
	//Sukuriam lentą
	const texture = new THREE.TextureLoader().load( "textures/checkers.png" );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 2,2 );
	const planeMaterial = new THREE.MeshPhongMaterial();
	planeMaterial.map = texture;
	var planeGeometry = new THREE.PlaneGeometry(boardSize, boardSize);
	var plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotation.x = -0.5 * Math.PI;
	scene.add(plane);
	
	//pridedam stovinčią figūrą į sceną
	var stationaryKing = createKing(0x303030);
	stationaryKing.position.add(stationaryKingStartPosition);
	scene.add( stationaryKing );
	
	//pridedam judančią figūrą į sceną
	movingKing = createKing(0x777777);
	movingKing.position.add(movingKingStartPosition);
	scene.add( movingKing );
	

	// Pridedam surenderintą vaizdą prie html, kad pavaizduot viską
	document.getElementById("webgl-output").appendChild(renderer.domElement);

	// surenderinam sceną
	renderer.render(scene, camera);
}

//funkcija sukurti karaliui
function createKing(color) {
	var points = [];
	for (var i = 0; i < points_x.length; i++) {
		points.push(new THREE.Vector2(points_x[i]*figure_size,points_y[i]*figure_size));
	}
	
	const geometry = new THREE.LatheGeometry( points );
	const material = new THREE.MeshPhongMaterial( { color: color } );
	return new THREE.Mesh( geometry, material );
}

//funkcija animacijai, šiuo atveju, judėjimui aplink sceną
var animation_process = 0; //parametras animacijos eigai skaičiuoti
const frameCount = 960 * 2; //Kiek kadrų užtruks animacija
function animate() {
	animateKing(); //animuojam karaliaus judėjimą
	animateC3(); //animuojam C3 kameros judėjimą
	camera3Prop.lookAt(movingKing.position);
	animateC2(); //animuojam C2 kameros judėjimą
	
	// Paskaičiuojam kampus po C2 kameros pajudėjimo ir atnaujinam fov, kad vaizdas išliktų panašus
	var eyedir = new THREE.Vector3();
	eyedir.subVectors( camera2Prop.position, C2LookingPoint );
	//gaudami arctan iš norimo kampo proporcijos padalintos iš dabartinio atstumo gauname norimą kampą.
	//padauginam iš 2, kad gautume kampą nuo šono iki šono, ir iš (180/Math.PI), kad paverst radianus į laipsnius
	camera2.fov = (180/Math.PI)*2*Math.atan(camera2TargetScale/eyedir.length());
	
	//Užfiksuojam animacijos eigą, jei ji pasibaigė, paleidžiam iš naujo
	animation_process++;
	if (animation_process >= frameCount) {
		animation_process = 0;
		//Kadangi dirbame su realiais skaičiais po daug iteracijų atsiranda šiokie tokie netikslumai
		//Todėl animacijos pabaigoje nustatome į pradžios skaičių, kad pataisyt netikslumus
		camera3Prop.up = new THREE.Vector3(0, 1, 0);
	}
	
	//Atnaujinam C1 kamerą pagal gui opcijas
	camera.fov = options.fov;
	camera.updateProjectionMatrix();

	//Atnaujinam C2 kamerą po animacijų
	camera2.updateProjectionMatrix();
	helper2.update();
	
	//Atnaujinam C3 kamerą po animacijų
	camera3.updateProjectionMatrix();
	helper3.update();

	// Paprašin sekančio kadro
	requestAnimationFrame( animate );	

	//Pakeičiam rodomą kamerą pagal GUI opciją
	if (options.camera == 'C1') {
		renderer.render( scene, camera );
	} else if (options.camera == 'C2') {
		renderer.render( scene, camera2 );
	} else if (options.camera == 'C3') {
		renderer.render( scene, camera3 );
	}
	
	
}

//funkcija C2 animacijai
function animateC2() {
	//Paskaičiuojam kameros pokytį viename kadre
	var camera2AnimationVector = camera2ToKingStartVector.clone().normalize().multiplyScalar(100/(0.5 * frameCount));
	//Jei animacija pirmoje pusėje, kamera artėja
	if (animation_process < frameCount * 0.5) {
		camera2Prop.position.sub(camera2AnimationVector);
	}
	
	//Jei animacija antroje pusėje, kamera tolsta, kol grįš į pradinę poziciją.
	if (animation_process > frameCount * 0.5) {
		camera2Prop.position.add(camera2AnimationVector);
	}
}

//C3 animacijos funkcija
// multiplier yra pagalbiniai skaičiai, kad apskaičiuot per kiek kadrų turi įvykt pokytis
const multiplier1 = (0.05 * frameCount);
const multiplier2 = (0.1 * frameCount);
// pokyčių kiekvienoje animacijos stadijoje vektoriai
const C3frameChange1 = (new THREE.Vector3(0, -0.5, 0.5)).divideScalar(multiplier1);
const C3frameChange2 = (new THREE.Vector3(0, 0.5, -0.5)).divideScalar(multiplier1);
const C3frameChange3 = (new THREE.Vector3(0, -0.5, 0.5)).divideScalar(multiplier2);
const C3frameChange4 = (new THREE.Vector3(0, 0.5, -0.5)).divideScalar(multiplier2);
function animateC3() {
	//jei animacijos eiga tarp 0.13 ir 0.2, sukam c3 vienaip ir kituose if'uose kitaip
	if (animation_process > frameCount * 0.13 && animation_process < frameCount * 0.2) {
		camera3Prop.up.add(C3frameChange3);
	}
	
	if (animation_process > 0.23 * frameCount && animation_process < 0.265 * frameCount) {
		camera3Prop.up.add(C3frameChange1);
	}
	
	if (animation_process > 0.265 * frameCount && animation_process < 0.3 * frameCount) {
		camera3Prop.up.add(C3frameChange2);
	}
	
	if (animation_process > 0.33 * frameCount && animation_process < 0.4 * frameCount) {
		camera3Prop.up.add(C3frameChange4);
	}
	
	if (animation_process > 0.63 * frameCount && animation_process < 0.7 * frameCount) {
		camera3Prop.up.add(C3frameChange3);
	}
	
	if (animation_process > 0.73 * frameCount && animation_process < 0.765 * frameCount) {
		camera3Prop.up.add(C3frameChange1);
	}
	
	if (animation_process > 0.765 * frameCount && animation_process < 0.8 * frameCount) {
		camera3Prop.up.add(C3frameChange2);
	}
	
	if (animation_process > 0.83 * frameCount && animation_process < 0.9 * frameCount) {
		camera3Prop.up.add(C3frameChange4);
	}
}

//funkcija karaliaus animacijai
function animateKing() {
	//jei animacijos eiga tarp 0.03 ir 0.1, einam pirmą žingsnį iki sekančio langelio
	if (animation_process > frameCount * 0.03 && animation_process < frameCount * 0.1) {
		movingKing.position.x += tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.13 * frameCount && animation_process < 0.2 * frameCount) {
		movingKing.position.x += tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.23 * frameCount && animation_process < 0.3 * frameCount) {
		movingKing.position.x += tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.33 * frameCount && animation_process < 0.4 * frameCount) {
		movingKing.position.x += tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.43 * frameCount && animation_process < 0.5 * frameCount) {
		movingKing.position.x += tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.53 * frameCount && animation_process < 0.6 * frameCount) {
		movingKing.position.x -= tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.63 * frameCount && animation_process < 0.7 * frameCount) {
		movingKing.position.x -= tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.73 * frameCount && animation_process < 0.8 * frameCount) {
		movingKing.position.x -= tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.83 * frameCount && animation_process < 0.9 * frameCount) {
		movingKing.position.x -= tileSize/(0.07 * frameCount);
	}
	
	if (animation_process > 0.93 * frameCount && animation_process < 1 * frameCount) {
		movingKing.position.x -= tileSize/(0.07 * frameCount);
	}
}

//funkcija kameros vaizdavimo objektą sukurt
function createCameraProp() {
	const shape = new THREE.Shape();
	var points_x = [99, 99, 80, 80, 64, 77, 84, 76, 64, 50, 42, 47, 64, 20, 33, 42, 36, 21, 6, 0, 20, 2, 2, 80, 80, 99, 99]; // -99
	var points_y = [64, 53, 53, 42, 42, 36, 21, 4, 0, 5, 20, 34, 42, 42, 38, 20, 6, 0, 5, 21, 42, 42, 91, 91, 76, 76, 64]; // -64 ir rezultata apkeist zenkla
	for (var i=0; i < points_x.length; i++) {
		//Kadangi norim, kad taškas 0,0 būtų kameros galas, tai koordinates padarom neigiamas
		//dalinam taškus, nes kamera išeina šiek tiek didoka
		shape.lineTo( (points_x[i] - 99)/3 , (-(points_y[i] - 64))/3 );
	}

	const extrudeSettings = {
		steps: 2,
		bevelEnabled: false,
		depth: 4,
		curveSegments: 16
	};

	//sukuriam laiptelį, pagal apsibrėžtą formą
	const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
	//Pasukam geometrija, kad objektas gražiai sutaptų su defaultine kamera.
	geometry.rotateY(-0.5 * Math.PI);
	var stepMaterial = new THREE.MeshLambertMaterial({color: 0xAFAFAF});
	const mesh = new THREE.Mesh( geometry, stepMaterial );
	return mesh;
}

init();
animate();