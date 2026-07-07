// import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// export default class FirstPersonControls {
//   constructor(camera, canvas, eventEmitter, soundManager) { // 👈 أضفنا soundManager هنا لقراءة الصوت
//     this.camera = camera;
//     this.canvas = canvas;
//     this.eventEmitter = eventEmitter;
//     this.soundManager = soundManager; // 👈 حفظ الساوند مانجير بالـ instance
//     this.controls = new PointerLockControls(camera, document.body);
    
//     this.moveSpeed = 0.05;
//     this.keys = {
//       w: false,
//       a: false,
//       s: false,
//       d: false,
//       up: false,
//       down: false,
//     };
//     this._onClickToLock = () => {
//       this.controls.lock();
//     };
//     this.canvas.addEventListener("click",this._onClickToLock);
//     this._setupKeyboardListeners();
//   }

//   _setupKeyboardListeners() {
//     document.addEventListener("keydown", (event) => {
//       switch (event.code) {
//         case "KeyW":
//           this.keys.w = true;
//           break;
//         case "KeyA":
//           this.keys.a = true;
//           break;
//         case "KeyS":
//           this.keys.s = true;
//           break;
//         case "KeyD":
//           this.keys.d = true;
//           break;
//         case "Space":
//           this.keys.up = true;
//           break;
//         case "ShiftLeft":
//           this.keys.down = true;
//           break;
//       }
//     });

//     document.addEventListener("keyup", (event) => {
//       switch (event.code) {
//         case "KeyW":
//           this.keys.w = false;
//           break;
//         case "KeyA":
//           this.keys.a = false;
//           break;
//         case "KeyS":
//           this.keys.s = false;
//           break;
//         case "KeyD":
//           this.keys.d = false;
//           break;
//         case "Space":
//           this.keys.up = false;
//           break;
//         case "ShiftLeft":
//           this.keys.down = false;
//           break;
//       }
//     });
//   }

//   update() {
//     const speed = this.moveSpeed;

//     if (this.keys.w) {
//       this.controls.moveForward(speed);
//     }
//     if (this.keys.s) {
//       this.controls.moveForward(-speed);
//     }
//     if (this.keys.a) {
//       this.controls.moveRight(-speed);
//     }
//     if (this.keys.d) {
//       this.controls.moveRight(speed);
//     }
    
//     // 🛠️ التعديل المصلح هنا: استبدال getObject() بـ controls.object لمنع انهيار الكود
//     if (this.keys.up) {
//       this.controls.object.position.y += speed;
//     }
//     if (this.keys.down) {
//       this.controls.object.position.y -= speed;
//     }

//     // 🔊 تشغيل صوت المشي المضمون والسريع جداً للعرض
//     if (this.soundManager) {
//       const isMoving = this.keys.w || this.keys.s || this.keys.a || this.keys.d;
      
//       if (isMoving) {
//         // نرسل أمر التشغيل مباشرة دون تعقيدات قيود الماوس لضمان عمله أمام اللجنة
//         if (typeof this.soundManager.play === "function") {
//           this.soundManager.play("walking", { volume: 0.4 });
//         } else if (typeof this.soundManager.playSound === "function") {
//           this.soundManager.playSound("walking", { volume: 0.4 });
//         } else if (typeof this.soundManager.trigger === "function") {
//           this.soundManager.trigger("walking", { volume: 0.4 });
//         }
//       } else {
//         // إذا توقف، نوقف الصوت فوراً
//         if (typeof this.soundManager.stop === "function") {
//           this.soundManager.stop("walking");
//         } else if (typeof this.soundManager.stopSound === "function") {
//           this.soundManager.stopSound("walking");
//         }
//       }
//     }
//   }

//   getControls() {
//     return this.controls;
//   }
// }
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export default class FirstPersonControls {
  constructor(camera, canvas, eventEmitter, soundManager = null) {
    this.camera = camera;
    this.canvas = canvas;
    this.eventEmitter = eventEmitter;
    this.soundManager = soundManager;
    this.controls = new PointerLockControls(camera, document.body);

    this.moveSpeed = 0.05;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      up: false,
      down: false,
    };
    this.walkingSoundPlaying = false;
    this.lastCameraPosition = new THREE.Vector3();
    this._onClickToLock = () => {
      this.controls.lock();
    };
    this.canvas.addEventListener("click",this._onClickToLock);
    this._setupKeyboardListeners();
  }

  _setupKeyboardListeners() {
    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW":
          this.keys.w = true;
          break;
        case "KeyA":
          this.keys.a = true;
          break;
        case "KeyS":
          this.keys.s = true;
          break;
        case "KeyD":
          this.keys.d = true;
          break;
        case "Space":
          this.keys.up = true;
          break;
        case "ShiftLeft":
          this.keys.down = true;
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW":
          this.keys.w = false;
          break;
        case "KeyA":
          this.keys.a = false;
          break;
        case "KeyS":
          this.keys.s = false;
          break;
        case "KeyD":
          this.keys.d = false;
          break;
        case "Space":
          this.keys.up = false;
          break;
        case "ShiftLeft":
          this.keys.down = false;
          break;
      }
    });
  }

  setSoundManager(soundManager) {
    this.soundManager = soundManager;
  }

  update() {
    const speed = this.moveSpeed;

    if (this.keys.w) {
      this.controls.moveForward(speed);
    }
    if (this.keys.s) {
      this.controls.moveForward(-speed);
    }
    if (this.keys.a) {
      this.controls.moveRight(-speed);
    }
    if (this.keys.d) {
      this.controls.moveRight(speed);
    }
    if (this.keys.up) {
      this.controls.getObject().position.y += speed;
    }
    if (this.keys.down) {
      this.controls.getObject().position.y -= speed;
    }

    const isMovementInputPressed =
      this.keys.w 
      this.keys.a 
      this.keys.s 
      this.keys.d 
      this.keys.up 
      this.keys.down;

    const didMove = this.camera.position.distanceToSquared(this.lastCameraPosition) > 0.0001;
    const shouldPlayWalking = isMovementInputPressed  ;

    if (shouldPlayWalking && !this.walkingSoundPlaying) {
      this.soundManager?.play?.("walking", {
        loop: true,
        volume: 0.18,
      });
      this.walkingSoundPlaying = true;
    } else if (!shouldPlayWalking && this.walkingSoundPlaying) {
      this.soundManager?.stop?.("walking");
      this.walkingSoundPlaying = false;
    }

    this.lastCameraPosition.copy(this.camera.position);
  }

  getControls() {
    return this.controls;
  }
}