import { VRButton } from './jsm/webxr/VRButton.js';

let camera, scene, renderer, points;

init()
animate()

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    
    
    const vertices = [];
    
    for ( let i = 0; i < 10000; i ++ ) {
    
        const x = THREE.MathUtils.randFloatSpread( 2000 );
        const y = THREE.MathUtils.randFloatSpread( 2000 );
        const z = THREE.MathUtils.randFloatSpread( 2000 );
    
        vertices.push( x, y, z );
    
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    
    const material = new THREE.PointsMaterial( { color: 0xffffff } );
    points = new THREE.Points( geometry, material );
    
    scene.add( points );
    
    camera.position.z = 200;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    document.body.appendChild( renderer.domElement );
    document.body.appendChild(VRButton.createButton(renderer));

    window.addEventListener( 'resize', onWindowResize );
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    const time = Date.now() * 0.0001;

    points.rotation.x = time * 0.25;
    points.rotation.y = time * 0.5;
    renderer.render( scene, camera );
};

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}