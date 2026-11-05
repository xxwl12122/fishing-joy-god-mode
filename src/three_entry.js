import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

window.THREE = {
    ...THREE,
    PointerLockControls
};

export default window.THREE;
