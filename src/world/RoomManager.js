import * as THREE from "three";
import { Sky } from 'three/examples/jsm/objects/Sky.js';

export default class RoomManager {
  constructor(app) {
    this.app = app; // لطلب الصوت بأمان
    this.scene = app.scene;
    this.camera = app.camera; // إرجاع الكاميرا لأصلها كما كانت تماماً لمنع التجميد

    this.roomWidth = 14;
    this.roomLength = 22;
    this.roomHeight = 4.8;

    this.doorZ = 11;
    this.detectionRadius = 4.0;

    this.leftDoor = null;
    this.rightDoor = null;

    // متغيرات لمراقبة حالة الباب لمنع تكرار الصوت في كل إطار
    this.doorWasOpen = false; 

    this.init();
  }

  async init() {
    this.setupCityscape();

    const sky = new Sky();
    sky.scale.setScalar(450000);
    this.scene.add(sky);

    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(80);
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    sky.material.uniforms['turbidity'].value = 10;
    sky.material.uniforms['rayleigh'].value = 2;
    sky.material.uniforms['mieCoefficient'].value = 0.005;
    sky.material.uniforms['mieDirectionalG'].value = 0.8;

    const hemiLight = new THREE.HemisphereLight(0xfff5e6, 0x333333, 1.2);
    this.scene.add(hemiLight);

    const outdoorSunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    outdoorSunLight.position.set(50, 100, 50);
    outdoorSunLight.castShadow = true;
    this.scene.add(outdoorSunLight);

    const textureLoader = new THREE.TextureLoader();

    const sidewalkGeo = new THREE.PlaneGeometry(this.roomWidth + 6, this.roomLength + 6);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, 0.001, 0);
    this.scene.add(sidewalk);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.0,
    });

    textureLoader.load(
      "https://threejs.org/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 4);
        floorMaterial.map = texture;
        floorMaterial.needsUpdate = true;
      }
    );

    const woodFloorMaterial = new THREE.MeshStandardMaterial({
      color: 0x261910,
      roughness: 0.15,
      metalness: 0.02,
    });

    textureLoader.load(
      "https://threejs.org/examples/textures/hardwood2_diffuse.jpg",
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 6);
        woodFloorMaterial.map = texture;
        woodFloorMaterial.needsUpdate = true;
      }
    );

    const baseWallMaterial = new THREE.MeshStandardMaterial({ color: 0x242426, roughness: 0.8 });
    const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x5a4331, roughness: 0.4 });
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    const woodFrameMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });

    const ledWarmMaterial = new THREE.MeshBasicMaterial({ color: 0xffa53f });
    const ledCyanMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const ledWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.9,
      envMapIntensity: 1.5
    });
    
    const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.8 });

    const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomLength);
    const floor = new THREE.Mesh(floorGeo, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const largeIslandGeo = new THREE.PlaneGeometry(5.2, 14.5);
    const largeIslandMesh = new THREE.Mesh(largeIslandGeo, woodFloorMaterial);
    largeIslandMesh.rotation.x = -Math.PI / 2;
    largeIslandMesh.position.set(-2.5, 0.02, 0.5);
    largeIslandMesh.receiveShadow = true;
    this.scene.add(largeIslandMesh);

    const ceilingGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomLength);
    const ceiling = new THREE.Mesh(ceilingGeo, new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.8 }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, this.roomHeight, 0);
    this.scene.add(ceiling);

    const createCeilingSpot = (x, z) => {
      const spotMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), frameMaterial);
      spotMesh.position.set(x, this.roomHeight - 0.02, z);
      this.scene.add(spotMesh);

      const downLight = new THREE.SpotLight(0xfff5ea, 15, 14, Math.PI / 5, 0.5, 1.2);
      downLight.position.set(x, this.roomHeight - 0.05, z);
      const targetObj = new THREE.Object3D();
      targetObj.position.set(x, 0, z);
      this.scene.add(targetObj);
      downLight.target = targetObj;
      this.scene.add(downLight);
    };

    for (let x = -5; x <= 5; x += 2.5) {
      for (let z = -9; z <= 9; z += 3) {
        if (Math.abs(x - (-2.5)) > 0.5 || (z !== -3 && z !== 4)) {
          createCeilingSpot(x, z);
        }
      }
    }

    const createLinearLED = (x, zStart, length, isCyan = false) => {
      const ledGeo = new THREE.BoxGeometry(0.05, 0.02, length);
      const ledMesh = new THREE.Mesh(ledGeo, isCyan ? ledCyanMaterial : ledWhiteMaterial);
      ledMesh.position.set(x, this.roomHeight - 0.01, zStart + length / 2);
      this.scene.add(ledMesh);

      const lineLight = new THREE.PointLight(isCyan ? 0x00f0ff : 0xffffff, 6, length * 1.5);
      lineLight.position.set(x, this.roomHeight - 0.2, zStart + length / 2);
      this.scene.add(lineLight);
    };

    createLinearLED(-5.5, -9, 18);
    createLinearLED(5.5, -9, 18);
    createLinearLED(2, -8, 6, true);
    createLinearLED(2, 2, 6, true);

    const createNeonRing = (x, y, z, radius, colorHex) => {
      const ringGroup = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(radius, 0.03, 8, 24);
      const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: colorHex }));
      ringMesh.rotation.x = Math.PI / 2;
      ringGroup.add(ringMesh);

      const ropeGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.6, 8);
      const rope = new THREE.Mesh(ropeGeo, frameMaterial);
      rope.position.y = 0.3;
      ringGroup.add(rope);

      const light = new THREE.PointLight(colorHex, 8, 6);
      light.position.y = -0.1;
      ringGroup.add(light);

      ringGroup.position.set(x, y, z);
      this.scene.add(ringGroup);
    };

    createNeonRing(3.5, this.roomHeight - 0.6, -4, 0.8, 0x00f0ff);
    createNeonRing(3.5, this.roomHeight - 0.6, 5, 0.8, 0xffa53f);

    const createSquarePendant = (x, z) => {
      const pendantGroup = new THREE.Group();
      const w = 2.4; const l = 1.4;
      pendantGroup.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, l), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })));

      const lightFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(w - 0.05, 0.02, l - 0.05), ledWarmMaterial);
      lightFrameMesh.position.y = -0.04;
      pendantGroup.add(lightFrameMesh);

      const ropeGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.2, 8);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
      const rope1 = new THREE.Mesh(ropeGeo, ropeMat); rope1.position.set(-w/2 + 0.1, 0.6, 0); pendantGroup.add(rope1);
      const rope2 = new THREE.Mesh(ropeGeo, ropeMat); rope2.position.set(w/2 - 0.1, 0.6, 0); pendantGroup.add(rope2);

      const tableLight = new THREE.SpotLight(0xffffff, 28, 8, Math.PI / 3, 0.4, 0.5);
      tableLight.position.set(0, -0.1, 0);
      const tableTarget = new THREE.Object3D();
      tableTarget.position.set(0, -4, 0);
      pendantGroup.add(tableTarget);
      tableLight.target = tableTarget;
      pendantGroup.add(tableLight);

      pendantGroup.position.set(x, this.roomHeight - 1.2, z);
      this.scene.add(pendantGroup);
    };
    createSquarePendant(-2.5, -3);
    createSquarePendant(-2.5, 4);

    const halfWidth = this.roomWidth / 2;
    const halfLength = this.roomLength / 2;

    const leftWallGroup = new THREE.Group();
    const leftBaseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, this.roomHeight, this.roomLength), baseWallMaterial);
    leftBaseMesh.position.set(-halfWidth, this.roomHeight / 2, 0);
    leftWallGroup.add(leftBaseMesh);

    const panelWidth = 3.5; const panelSpacing = 4.5;
    for (let i = -1; i <= 1; i++) {
      const zPos = i * panelSpacing;
      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, this.roomHeight, panelWidth), woodMaterial);
      pMesh.position.set(-halfWidth + 0.08, this.roomHeight / 2, zPos);
      leftWallGroup.add(pMesh);

      const ledVMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, this.roomHeight, 0.04), ledWarmMaterial);
      ledVMesh.position.set(-halfWidth + 0.09, this.roomHeight / 2, zPos - (panelWidth / 2) - 0.02);
      leftWallGroup.add(ledVMesh);
    }
    this.scene.add(leftWallGroup);

    const backWallGroup = new THREE.Group();
    const backBaseMesh = new THREE.Mesh(new THREE.BoxGeometry(this.roomWidth, this.roomHeight, 0.1), baseWallMaterial);
    backBaseMesh.position.set(0, this.roomHeight / 2, -halfLength);
    backBaseMesh.receiveShadow = true;
    backWallGroup.add(backBaseMesh);

    const woodPanel = new THREE.Mesh(new THREE.BoxGeometry(7.0, this.roomHeight, 0.08), woodMaterial);
    woodPanel.position.set(0, this.roomHeight / 2, -halfLength + 0.05);
    backWallGroup.add(woodPanel);

    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 85px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BILLIARD STATION', canvas.width / 2, canvas.height / 2 - 40);
    ctx.shadowColor = '#ffa53f'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffa53f'; ctx.font = 'bold 45px Arial, sans-serif';
    ctx.fillText('• POOL & LOUNGE •', canvas.width / 2, canvas.height / 2 + 70);

    const neonTexture = new THREE.CanvasTexture(canvas);
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 0.05), frameMaterial);
    tvFrame.position.set(0, this.roomHeight / 2 + 0.2, -halfLength + 0.12);
    backWallGroup.add(tvFrame);

    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), new THREE.MeshStandardMaterial({
      map: neonTexture, emissiveMap: neonTexture, emissive: new THREE.Color(0xffffff), emissiveIntensity: 1.2
    }));
    tvScreen.position.set(0, this.roomHeight / 2 + 0.2, -halfLength + 0.15);
    backWallGroup.add(tvScreen);

    const consoleMesh = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0x151516 }));
    consoleMesh.position.set(0, 0.5, -halfLength + 0.28);
    backWallGroup.add(consoleMesh);
    this.scene.add(backWallGroup);

    const rightWallGroup = new THREE.Group();
    const rightWallMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, this.roomHeight, this.roomLength), baseWallMaterial);
    rightWallMesh.position.set(halfWidth, this.roomHeight / 2, 0);
    rightWallGroup.add(rightWallMesh);
    this.scene.add(rightWallGroup);

    const artUrls = [
      "https://ae-pic-a1.aliexpress-media.com/kf/S1996223a8ad64ca1a38538c6b6d186f9S.png",
      "https://png.pngtree.com/thumb_back/fh260/background/20250825/pngtree-colorful-billiard-balls-on-dark-green-background-with-radiating-light-image_17899855.webp",
      "https://png.pngtree.com/thumb_back/fh260/background/20220601/pngtree-billard-game-concept-pool-billiard-sport-photo-image_5836346.jpg",
      "https://ae-pic-a1.aliexpress-media.com/kf/S1996223a8ad64ca1a38538c6b6d186f9S.png",
    ];
    artUrls.forEach((url, index) => {
        textureLoader.load(url, (tex) => {
            const artGroup = new THREE.Group();
            
            const frame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 0.1), woodFrameMat);
            artGroup.add(frame);

            const artMaterial = new THREE.MeshStandardMaterial({ map: tex });
            const artMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), artMaterial);
            artMesh.position.z = 0.06;
            artGroup.add(artMesh);

            artGroup.rotation.y = -Math.PI / 2;
            artGroup.position.set(halfWidth - 0.06, 2.5, -6 + (index * 4));
            this.scene.add(artGroup);

            const spot = new THREE.SpotLight(0xffffff, 8, 8, Math.PI / 4, 0.5);
            spot.position.set(halfWidth - 1, 4.5, -6 + (index * 4));
            spot.target.position.set(halfWidth, 2.5, -6 + (index * 4));
            this.scene.add(spot);
            this.scene.add(spot.target);
        });
    });

    const frontWallGroup = new THREE.Group();
    const doorFrameWidth = 3.0;
    const doorHeight = 3.2;
    const sideWallWidth = (this.roomWidth - doorFrameWidth) / 2;

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, this.roomHeight, 0.1), baseWallMaterial);
    frontLeft.position.set(-halfWidth + (sideWallWidth / 2), this.roomHeight / 2, this.doorZ); frontWallGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, this.roomHeight, 0.1), baseWallMaterial);
    frontRight.position.set(halfWidth - (sideWallWidth / 2), this.roomHeight / 2, this.doorZ); frontWallGroup.add(frontRight);

    const headerHeight = this.roomHeight - doorHeight;
    const frontTop = new THREE.Mesh(new THREE.BoxGeometry(doorFrameWidth, headerHeight, 0.1), baseWallMaterial);
    frontTop.position.set(0, doorHeight + (headerHeight / 2), this.doorZ); frontWallGroup.add(frontTop);
    this.scene.add(frontWallGroup);

    this.doorWidth = 1.45;

    this.leftDoor = new THREE.Group();
    const lGlass = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth, doorHeight, 0.04), glassMaterial);
    lGlass.position.set(-this.doorWidth / 2, doorHeight / 2, 0); this.leftDoor.add(lGlass);
    const lHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), brassMaterial);
    lHandle.position.set(-0.05, doorHeight / 2, 0.05); this.leftDoor.add(lHandle);
    this.leftDoor.position.set(0, 0, this.doorZ);
    this.scene.add(this.leftDoor);

    this.rightDoor = new THREE.Group();
    const rGlass = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth, doorHeight, 0.04), glassMaterial);
    rGlass.position.set(this.doorWidth / 2, doorHeight / 2, 0); this.rightDoor.add(rGlass);
    const rHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), brassMaterial);
    rHandle.position.set(0.05, doorHeight / 2, 0.05); this.rightDoor.add(rHandle);
    this.rightDoor.position.set(0, 0, this.doorZ);
    this.scene.add(this.rightDoor);

    this.leftClosedX = 0;   this.leftOpenX = -(this.doorWidth - 0.1);
    this.rightClosedX = 0;  this.rightOpenX = (this.doorWidth - 0.1);

    if (this.camera && this.camera.instance) {
      this.camera.instance.position.set(0, 1.75, 9.5);
      this.camera.instance.lookAt(0, 1.6, -2);
    }
  }

 setupCityscape() {
    const cityGroup = new THREE.Group();
    cityGroup.name = "cityscape";
    this.scene.add(cityGroup);

    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    cityGroup.add(ground);

    let seed = 12345;
    const seededRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    const createTexture = (type) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#444444'; 
        ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = '#666666'; 
        if (type === 0) for(let i=0; i<2; i++) for(let j=0; j<2; j++) ctx.fillRect(i*64+20, j*64+20, 24, 24);
        else if (type === 1) for(let i=0; i<3; i++) for(let j=0; j<4; j++) ctx.fillRect(i*40+10, j*30+10, 18, 12);
        else for(let j=0; j<5; j++) ctx.fillRect(15, j*25+8, 98, 8);
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    };
    
    const textures = [createTexture(0), createTexture(1), createTexture(2)];
    
    for (let i = 0; i < 100; i++) { 
        const w = 12 + seededRandom() * 20; 
        const d = 12 + seededRandom() * 20;
        const h = 40 + seededRandom() * 80; 
        
        const randomTex = textures[Math.floor(seededRandom() * textures.length)];
        const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, map: randomTex, roughness: 0.9, metalness: 0.1 });
        const texClone = randomTex.clone();
        texClone.repeat.set(w / 10, h / 10); 
        mat.map = texClone;
        
        const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        
        const angle = seededRandom() * Math.PI * 2;
        const radius = 100 + seededRandom() * 150;
        
        building.position.set(Math.cos(angle) * radius, h / 2, Math.sin(angle) * radius);
        cityGroup.add(building);
    }
  }

  update() {
    if (!this.camera) return;
    const camPos = new THREE.Vector3();
    
    if (this.camera.instance) camPos.copy(this.camera.instance.position);
    else if (typeof this.camera.getWorldPosition === "function") this.camera.getWorldPosition(camPos);

    const distanceZ = Math.abs(camPos.z - this.doorZ);
    const isCloseEnough = distanceZ < 2.0; 

    if (this.leftDoor && this.rightDoor) {
        const lerpFactor = 0.15; 
        const targetLeftX = isCloseEnough ? this.leftOpenX : this.leftClosedX;
        const targetRightX = isCloseEnough ? this.rightOpenX : this.rightClosedX;
        this.leftDoor.position.x = THREE.MathUtils.lerp(this.leftDoor.position.x, targetLeftX, lerpFactor);
        this.rightDoor.position.x = THREE.MathUtils.lerp(this.rightDoor.position.x, targetRightX, lerpFactor);

        // نظام تشغيل الصوت الذكي والمرن لتفادي أي خطأ في اسم الدالة
        const triggerSound = (soundName) => {
            const sm = this.app.soundManager;
            if (!sm) return;
            
            // محاولة التشغيل بناءً على المسميات الشائعة في كودك
            if (typeof sm.play === "function") sm.play(soundName);
            else if (typeof sm.playSound === "function") sm.playSound(soundName);
            else if (typeof sm.trigger === "function") sm.trigger(soundName);
            else {
                // إذا لم يجد أي اسم متطابق، سيطبع لك في الكونسول الاسم الصحيح دون تخريب اللعبة
                console.warn(`⚠️ [SoundManager] وجدنا الكلاس ولكن لم نجد دالة التشغيل! الدوال المتاحة فيه هي:`, Object.getOwnPropertyNames(Object.getPrototypeOf(sm)));
            }
        };

        // تشغيل صوت الفتح والإغلاق لمرة واحدة فقط عند تغير الحالة!
        if (isCloseEnough && !this.doorWasOpen) {
            triggerSound("doorOpen");
            this.doorWasOpen = true;
        } else if (!isCloseEnough && this.doorWasOpen) {
            triggerSound("doorClose");
            this.doorWasOpen = false;
        }
    }
  }
}