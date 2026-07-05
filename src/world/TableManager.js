import * as THREE from "three";
import GUI from "lil-gui";
import Physics from "./../physics/Physics.js";
import BallVisual from "./BallVisual.js";
import RollingFriction from "./../physics/RollingFriction.js";
import TableVisual from "./TableVisual.js";
import { GUI_LABELS } from "./ui/GuiLabels.js";
import GameMode from "../core/GameMode.js";
export default class TableManager {
  /**
   * @param {import('./../core/AppRun.js').default} app
   */
  constructor(app) {
    this.gameMode = GameMode.PHYSICS_TEST;
    this.players = [
      {
        name: "Player 1",
        pocketed: [],
        group: null,
      },
      {
        name: "Player 2",
        pocketed: [],
        group: null,
      },
    ];
    this.shotInProgress = false;
    this.currentPlayer = 0;
    this.assetsLoader = app.assetsLoader;
    this.scene = app.scene;       //!!!!!!!!!!!!!I am creating the group called table group!!!!!!!!!!!!!!!         


    this.tableGroup= new THREE.Group();
    this.tableGroup.name="TableGroup";
    this.scene.add(this.tableGroup)
    
    this.camera = app.camera;
    
        this.camera.setTarget(this.tableGroup)
        this.camera.setAngledView()                                    //trying out the camera position function
    
    this.canvas = app.canvas;
    this.physics = new Physics();
    this.pocketedBallsThisTurn = [];
    this.allPocketedBalls = [];
    this.tableWidth =2.25;
    this.tableLength = 4.45;
    this.cushionThickness = 0.2;
    this.cushionHeight = 0.2;
    this.bounds = {
      minX: -this.tableWidth / 2,
      maxX: this.tableWidth / 2,
      minZ: -this.tableLength / 2,
      maxZ: this.tableLength / 2,
    };
    this.physics.bounds = this.bounds;
    this.pockets = [
      new THREE.Vector2(-this.tableWidth / 2, -this.tableLength / 2),
      new THREE.Vector2(this.tableWidth / 2, -this.tableLength / 2),
      new THREE.Vector2(-this.tableWidth / 2, this.tableLength / 2),
      new THREE.Vector2(this.tableWidth / 2, this.tableLength / 2),

      new THREE.Vector2(-this.tableWidth / 2, 0),   //I changed this so just remember !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! to switch the pockets being in the wrong place
      new THREE.Vector2(this.tableWidth / 2, 0),
    ];

    this.pocketRadius = 0.12;
    this.gui = new GUI({ title: "Billiards" });
    this.guiLabels = GUI_LABELS;
    this.guiFolders = {};
    this.guiControllers = {};
    this.guiState = {
      language: "English",
      gameMode: this.gameMode,
      player1Score: 0,
      player2Score: 0,
      currentPlayer: "Player 1",
      player1Group: "-",
      player2Group: "-",
      strikeAngle: 0,
      shotStrength: 5,
      cueOffsetX: 0,
      cueOffsetY: 0,
      ballRoughness: this.physics.ball.friction,
      ballRestitution: this.physics.ball.restitution,
      floorFriction: 0.18,
      ballRadius: this.physics.ball.radius,
      ballDensity: this.physics.ball.density,
      currentVelocity: 0,
      currentMass: this.physics.ball.mass,
      restitution: this.physics.restitution,
      wallFriction: this.physics.wallFriction,
      strikeBall: () => {
        const impulse = this.getStrikeImpulse();
        const ball = this.physics.ball;
        // We do NOT reset velocity; real shots add to the ball's current motion.
        ball.applyImpulse(impulse);

        const rOffset = new THREE.Vector3(
          this.guiState.cueOffsetX,
          this.guiState.cueOffsetY,
          0,
        );
        const torqueImpulse = new THREE.Vector3().crossVectors(
          rOffset,
          impulse,
        );
        if (ball.momentOfInertia > 0) {
          ball.angularVelocity.addScaledVector(
            torqueImpulse,
            3 / ball.momentOfInertia,
          );
        }
      },
    };
    this.rollingFriction = new RollingFriction({
      floorFriction: this.guiState.floorFriction,
    });

    this.init();
    this.updateCurrentPlayerUI();
    console.log("Current Mode:", this.gameMode);
  }

  async init() {                                               //I changed This so that the table visual gets added to the table group.!!!!!!!!!!!!!
    this.tableVisual = new TableVisual(this.tableGroup, {
      tableWidth: this.tableWidth,
      tableLength: this.tableLength,
      cushionThickness: this.cushionThickness,
      cushionHeight: this.cushionHeight,
      ballRadius: this.physics.ball.radius,
    });

        const models = this.assetsLoader.getModels();  //I add this part to add the table at the position(0,-ballradius,0) !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    this.tableModel = models.poolTable;               // and it is added to the table group!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    if (this.tableModel) {
      this.tableGroup.add(this.tableModel);

      this.tableModel.position.set(0, -1.5, 0);

      this.tableModel.rotation.y= Math.PI/2;

      this.tableModel.scale.set(1, 1, 1);
    }

    this.ballVisuals = this.physics.balls.map((ball, index) => {
      // Index 0 is the cue ball; remaining balls map to numbered textures.
      const ballNumber = index === 0 ? 0 : ball.number;
      return new BallVisual(this.tableGroup, ball, ballNumber);        //This was changed two to make the visual walls get added to the table group.!!!!!!!!!!!!!!!
    });
    this.ballVisual = this.ballVisuals[0];
    for (const ball of this.physics.balls) {
      ball.friction = this.guiState.ballRoughness;
      ball.forces.push(this.rollingFriction);
    }
    // this.camera.instance.position.set(0, 2, 5);
    const ballWorldPosition= new THREE.Vector3()      //!!!!!!!!!!!!!!!!!!!!!             
    this.ballVisual.mesh.getWorldPosition(ballWorldPosition)  //!!!!!!!!!!!!!
    this.camera.instance.lookAt(ballWorldPosition);      //after we added teh ball visual to the table group this was wrong so I fixed it

    const strikeDirection = this.getStrikeDirection();
    this.strikeArrow = new THREE.ArrowHelper(
      strikeDirection,
      this.physics.ball.position.clone(),
      this.getStrikeArrowLength(),
      0xffd54f,
    );
    this.tableGroup.add(this.strikeArrow);         //strikeArrow too is added to the table group!!!!!!!!!!

    this.setGUI();

    this.tableGroup.position.set(-2.4,1.6,0)
  }
  update(dt) {
    // تحديث الفيزياء يدوياً
    this.physics.update(dt);

    const anyBallMoving = this.isAnyBallMoving();

    if (!this.shotInProgress && anyBallMoving) {
      this.shotInProgress = true;
      this.pocketedBallsThisTurn = [];
      console.log("Shot Started");
    }

    /*if (this.shotInProgress && this.areAllBallsStopped()) {
      this.shotInProgress = false;
      this.assignGroups();
      console.log("Pocketed This Turn:", this.pocketedBallsThisTurn);
    }*/
    if (this.shotInProgress && this.areAllBallsStopped()) {
      this.shotInProgress = false;

      this.assignGroups();

      console.log("Pocketed This Turn:", this.pocketedBallsThisTurn);

      /* if (this.players[0].group !== null) {
        if (!this.didPocketOwnBallThisTurn()) {
          this.switchPlayer();
        }
      }*/
      if (this.players[0].group === null) {
        if (this.pocketedBallsThisTurn.length === 0) {
          this.switchPlayer();
        }
      } else {
        if (!this.didPocketOwnBallThisTurn()) {
          this.switchPlayer();
        }
      }
    }
    this.checkPocketedBalls();
    for (let i = 0; i < this.ballVisuals.length; i++) {
      const ball = this.physics.balls[i];
      const visual = this.ballVisuals[i];

      if (ball.isPocketed) {
        visual.mesh.visible = false;
        continue;
      }

      visual.mesh.visible = true;
      visual.update(dt);
    }
    this.tableVisual?.update(this.physics.ball.radius);
    this.guiState.currentVelocity = Number(
      this.physics.ball.velocity.length().toFixed(3),
    );
    this.guiState.currentMass = Number(this.physics.ball.mass.toFixed(4));
    this.updateStrikeArrow();
    if (this.camera.orbit?.target) {
      this.camera.orbit.target.copy(this.ballVisual.mesh.position);
      this.camera.orbit.update?.();
    }
  }
  setGameMode(mode) {
    this.gameMode = mode;
  }
  didPocketOwnBallThisTurn() {
    const currentPlayer = this.players[this.currentPlayer];

    for (const ballNumber of this.pocketedBallsThisTurn) {
      if (this.isBallInPlayerGroup(ballNumber, currentPlayer)) {
        return true;
      }
    }

    return false;
  }

  getGameMode() {
    return this.gameMode;
  }
  areAllBallsStopped() {
    const stopThreshold = 0.01;

    for (const ball of this.physics.balls) {
      if (ball.isPocketed) {
        continue;
      }

      if (ball.velocity.length() > stopThreshold) {
        return false;
      }
    }

    return true;
  }
  isAnyBallMoving() {
    const movingThreshold = 0.01;

    for (const ball of this.physics.balls) {
      if (ball.isPocketed) {
        continue;
      }

      if (ball.velocity.length() > movingThreshold) {
        return true;
      }
    }

    return false;
  }
  updateCurrentPlayerUI() {
    this.guiState.currentPlayer = this.players[this.currentPlayer].name;
  }
  switchPlayer() {
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;

    this.updateCurrentPlayerUI();
  }
  assignGroups() {
    if (this.players[0].group !== null) {
      return;
    }

    let hasSolids = false;
    let hasStripes = false;

    for (const ballNumber of this.pocketedBallsThisTurn) {
      if (ballNumber >= 1 && ballNumber <= 7) {
        hasSolids = true;
      }

      if (ballNumber >= 9 && ballNumber <= 15) {
        hasStripes = true;
      }
    }

    // Open Table
    if (hasSolids && hasStripes) {
      console.log("Open Table");
      return;
    }

    if (hasSolids) {
      this.players[0].group = "solids";
      this.players[1].group = "stripes";
    } else if (hasStripes) {
      this.players[0].group = "stripes";
      this.players[1].group = "solids";
    }

    this.updateGroupsUI();
    this.updateScoreUI();

    console.log(
      "Groups Assigned:",
      this.players[0].group,
      this.players[1].group,
    );
  }
  isBallInPlayerGroup(ballNumber, player) {
    if (player.group === "solids") {
      return ballNumber >= 1 && ballNumber <= 7;
    }

    if (player.group === "stripes") {
      return ballNumber >= 9 && ballNumber <= 15;
    }

    return false;
  }
  updateScoreUI() {
    let player1Count = 0;
    let player2Count = 0;

    for (const ballNumber of this.allPocketedBalls) {
      if (this.isBallInPlayerGroup(ballNumber, this.players[0])) {
        player1Count++;
      }

      if (this.isBallInPlayerGroup(ballNumber, this.players[1])) {
        player2Count++;
      }
    }

    this.guiState.player1Score = player1Count;
    this.guiState.player2Score = player2Count;
  }
  checkPocketedBalls() {
    for (const ball of this.physics.balls) {
      if (ball.isPocketed) continue;

      for (const pocket of this.pockets) {
        const dx = ball.position.x - pocket.x;
        const dz = ball.position.z - pocket.y;

        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < this.pocketRadius) {
          if (ball === this.physics.balls[0]) {
            ball.velocity.set(0, 0, 0);
            ball.angularVelocity.set(0, 0, 0);
            ball.position.set(0, 0, -1.5);
            continue;
          } else {
            if (this.gameMode === GameMode.NORMAL) {
              this.pocketedBallsThisTurn.push(ball.number);
              this.allPocketedBalls.push(ball.number);

              for (const player of this.players) {
                if (this.isBallInPlayerGroup(ball.number, player)) {
                  player.pocketed.push(ball.number);
                  break;
                }
              }
              /*const currentPlayer = this.players[this.currentPlayer];

              if (this.isBallInPlayerGroup(ball.number, currentPlayer)) {
                currentPlayer.pocketed.push(ball.number);
              }*/
              this.updateScoreUI();
            }

            ball.isPocketed = true;

            console.log("Pocketed Ball:", ball.number);

            ball.velocity.set(0, 0, 0);
            ball.angularVelocity.set(0, 0, 0);
            break;
          }
        }
      }
    }
  }
  getActiveLanguageKey() {
    return this.guiState.language === "العربية" ? "ar" : "en";
  }

  getActiveLabels() {
    return this.guiLabels[this.getActiveLanguageKey()];
  }

  setFolderTitle(folder, title) {
    if (!folder) return;
    if (typeof folder.title === "function") {
      folder.title(title);
      return;
    }
    if (folder._title) {
      folder._title.textContent = title;
      return;
    }
    if (folder.domElement) {
      const titleElement = folder.domElement.querySelector(".title");
      if (titleElement) {
        titleElement.textContent = title;
      }
    }
  }

  applyLanguageLabels() {
    const labels = this.getActiveLabels();

    this.setFolderTitle(this.guiFolders.ballPhysics, labels.ballPhysics);
    this.setFolderTitle(this.guiFolders.ballProperties, labels.ballProperties);
    this.setFolderTitle(
      this.guiFolders.tableProperties,
      labels.tableProperties,
    );
    this.setFolderTitle(this.guiFolders.tablePhysics, labels.tablePhysics);

    this.guiControllers.language?.name(labels.language);
    this.guiControllers.strikeAngle?.name(labels.strikeAngle);
    this.guiControllers.shotStrength?.name(labels.shotStrength);
    this.guiControllers.cueOffsetX?.name(labels.cueOffsetHorizontal);
    this.guiControllers.cueOffsetY?.name(labels.cueOffsetVertical);
    this.guiControllers.strikeBall?.name(labels.strikeBall);
    this.guiControllers.currentVelocity?.name(labels.currentVelocity);
    this.guiControllers.ballRadius?.name(labels.ballRadius);
    this.guiControllers.ballDensity?.name(labels.ballDensity);
    this.guiControllers.ballRoughness?.name(labels.ballRoughness);
    this.guiControllers.ballRestitution?.name(labels.ballRestitution);
    this.guiControllers.currentMass?.name(labels.currentMass);
    this.guiControllers.floorFriction?.name(labels.floorFriction);
    this.guiControllers.restitution?.name(labels.restitution);
    this.guiControllers.wallFriction?.name(labels.wallFriction);
  }

  setGUI() {
    const labels = this.getActiveLabels();

    this.guiControllers.language = this.gui
      .add(this.guiState, "language", ["English", "العربية"])
      .name(labels.language)
      .onChange(() => this.applyLanguageLabels());

    this.guiControllers.currentPlayer = this.gui
      .add(this.guiState, "currentPlayer")
      .name("Current Turn")
      .listen();
    this.guiControllers.player1Group = this.gui
      .add(this.guiState, "player1Group")
      .name("Player 1 Group")
      .listen();

    this.guiControllers.player2Group = this.gui
      .add(this.guiState, "player2Group")
      .name("Player 2 Group")
      .listen();

    this.guiControllers.player1Group.disable();
    this.guiControllers.player2Group.disable();
    this.guiControllers.player1Score = this.gui
      .add(this.guiState, "player1Score")
      .name("Player 1 Balls")
      .listen();

    this.guiControllers.player2Score = this.gui
      .add(this.guiState, "player2Score")
      .name("Player 2 Balls")
      .listen();

    this.guiControllers.player1Score.disable();
    this.guiControllers.player2Score.disable();

    this.guiControllers.currentPlayer.disable();

    this.guiControllers.gameMode = this.gui
      .add(this.guiState, "gameMode", [
        GameMode.PRACTICE,
        GameMode.PHYSICS_TEST,
        GameMode.NORMAL,
      ])
      .name("Game Mode")
      .onChange((value) => {
        this.setGameMode(value);
        this.updateGameModeUI();
      });

    const physicsFolder = this.gui.addFolder(labels.ballPhysics);
    this.guiFolders.ballPhysics = physicsFolder;
    this.guiControllers.strikeAngle = physicsFolder
      .add(this.guiState, "strikeAngle", 0, 360, 1)
      .name(labels.strikeAngle)
      .onChange(() => this.updateStrikeArrow());
    this.guiControllers.shotStrength = physicsFolder
      .add(this.guiState, "shotStrength", 0, 20, 0.1)
      .name(labels.shotStrength)
      .onChange(() => this.updateStrikeArrow());
    this.guiControllers.cueOffsetX = physicsFolder
      .add(
        this.guiState,
        "cueOffsetX",
        -this.physics.ball.radius,
        this.physics.ball.radius,
        0.001,
      )
      .name(labels.cueOffsetHorizontal);
    this.guiControllers.cueOffsetY = physicsFolder
      .add(
        this.guiState,
        "cueOffsetY",
        -this.physics.ball.radius,
        this.physics.ball.radius,
        0.001,
      )
      .name(labels.cueOffsetVertical);
    this.guiControllers.strikeBall = physicsFolder
      .add(this.guiState, "strikeBall")
      .name(labels.strikeBall);
    this.guiControllers.currentVelocity = physicsFolder
      .add(this.guiState, "currentVelocity")
      .name(labels.currentVelocity)
      .listen();
    this.guiControllers.currentVelocity.disable();
    physicsFolder.open();

    const ballFolder = this.gui.addFolder(labels.ballProperties);
    this.guiFolders.ballProperties = ballFolder;
    this.guiControllers.ballRadius = ballFolder
      .add(this.guiState, "ballRadius", 0.02, 0.1, 0.001)
      .name(labels.ballRadius)
      .onChange((value) => {
        for (const ball of this.physics.balls) {
          ball.radius = value;
        }
        for (const ballVisual of this.ballVisuals) {
          ballVisual.updateSize(value);
        }
        this.tableVisual?.update(value);
        this.guiControllers.cueOffsetX?.min(-value);
        this.guiControllers.cueOffsetX?.max(value);
        this.guiControllers.cueOffsetY?.min(-value);
        this.guiControllers.cueOffsetY?.max(value);
      });
    this.guiControllers.ballDensity = ballFolder
      .add(this.guiState, "ballDensity", 1000, 2500, 10)
      .name(labels.ballDensity)
      .onChange((value) => {
        for (const ball of this.physics.balls) {
          ball.density = value;
          ball.calculateMass();
        }
      });
    this.guiControllers.ballRoughness = ballFolder
      .add(this.guiState, "ballRoughness", 0.1, 1, 0.01)
      .name(labels.ballRoughness)
      .onChange((value) => {
        for (const ball of this.physics.balls) {
          ball.friction = value;
        }
      });
    this.guiControllers.ballRestitution = ballFolder
      .add(this.guiState, "ballRestitution", 0, 1, 0.01)
      .name(labels.ballRestitution)
      .onChange((value) => {
        for (const ball of this.physics.balls) {
          ball.restitution = value;
        }
      });
    this.guiControllers.currentMass = ballFolder
      .add(this.guiState, "currentMass")
      .name(labels.currentMass)
      .listen();
    this.guiControllers.currentMass.disable();

    const tableFolder = this.gui.addFolder(labels.tableProperties);
    this.guiFolders.tableProperties = tableFolder;
    this.guiControllers.floorFriction = tableFolder
      .add(this.guiState, "floorFriction", 0.01, 0.5, 0.01)
      .name(labels.floorFriction)
      .onChange((value) => {
        this.rollingFriction.floorFriction = value;
      });

    const tablePhysicsFolder = this.gui.addFolder(labels.tablePhysics);
    this.guiFolders.tablePhysics = tablePhysicsFolder;
    this.guiControllers.restitution = tablePhysicsFolder
      .add(this.guiState, "restitution", 0.1, 1, 0.01)
      .name(labels.restitution)
      .onChange((value) => {
        this.physics.restitution = value;
      });
    this.guiControllers.wallFriction = tablePhysicsFolder
      .add(this.guiState, "wallFriction", 0, 1, 0.01)
      .name(labels.wallFriction)
      .onChange((value) => {
        this.physics.wallFriction = value;
      });

    this.applyLanguageLabels();
    this.updateGameModeUI();
  }
  updateGameModeUI() {
    const isPhysicsMode = this.gameMode === GameMode.PHYSICS_TEST;

    const isNormalMode = this.gameMode === GameMode.NORMAL;

    this.guiFolders.ballProperties.domElement.style.display = isPhysicsMode
      ? ""
      : "none";

    this.guiFolders.tableProperties.domElement.style.display = isPhysicsMode
      ? ""
      : "none";

    this.guiFolders.tablePhysics.domElement.style.display = isPhysicsMode
      ? ""
      : "none";

    this.guiControllers.currentPlayer.domElement.style.display = isNormalMode
      ? ""
      : "none";
    this.guiControllers.player1Group.domElement.style.display = isNormalMode
      ? ""
      : "none";

    this.guiControllers.player2Group.domElement.style.display = isNormalMode
      ? ""
      : "none";

    this.guiControllers.player1Score.domElement.style.display = isNormalMode
      ? ""
      : "none";

    this.guiControllers.player2Score.domElement.style.display = isNormalMode
      ? ""
      : "none";
  }
  updateGroupsUI() {
    this.guiState.player1Group = this.players[0].group ?? "-";

    this.guiState.player2Group = this.players[1].group ?? "-";
  }
  getStrikeDirection() {
    const radians = THREE.MathUtils.degToRad(this.guiState.strikeAngle);
    const direction = new THREE.Vector3(
      Math.sin(radians),
      0,
      Math.cos(radians),
    );
    return direction.normalize();
  }

  getStrikeImpulse() {
    const direction = this.getStrikeDirection();
    // This control behaves more like speed than force because mass cancels out
    // when applyImpulse divides by mass.
    const magnitude = this.guiState.shotStrength * this.physics.ball.mass;
    return direction.multiplyScalar(magnitude);
  }

  getStrikeArrowLength() {
    return Math.max(0.4, this.guiState.shotStrength * 0.1);
  }

  updateStrikeArrow() {
    if (!this.strikeArrow) return;
    const direction = this.getStrikeDirection();
    this.strikeArrow.position.copy(this.physics.ball.position);
    this.strikeArrow.setDirection(direction);
    this.strikeArrow.setLength(this.getStrikeArrowLength());
  }
}
