if (new URLSearchParams(location.search).get("render") === "3d") {
  import("/vendor/three/three.module.js").then((THREE) => {
    const renderQaEnabled = new URLSearchParams(location.search).get("qa") === "1";
    const sourceCanvas = document.getElementById("game");
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.className = "three-game-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    document.body.insertBefore(renderer.domElement, document.getElementById("ui"));
    document.body.dataset.renderMode = "3d";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090d16");
    scene.fog = new THREE.FogExp2("#090d16", 0.00026);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
    const cameraTarget = new THREE.Vector3();
    const lightTarget = new THREE.Object3D();
    scene.add(lightTarget);

    scene.add(new THREE.HemisphereLight("#d0d9eb", "#28212a", 1.65));
    const keyLight = new THREE.DirectionalLight("#ffe0ba", 3.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -260;
    keyLight.shadow.camera.right = 260;
    keyLight.shadow.camera.top = 260;
    keyLight.shadow.camera.bottom = -260;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 900;
    keyLight.shadow.normalBias = 0.035;
    keyLight.shadow.bias = -0.00015;
    keyLight.shadow.radius = 5;
    scene.add(keyLight);

    const stoneCanvas = document.createElement("canvas");
    stoneCanvas.width = 256;
    stoneCanvas.height = 256;
    const stoneContext = stoneCanvas.getContext("2d");
    const stonePixels = stoneContext.createImageData(256, 256);
    const stoneSites = [];
    for (let siteY = 0; siteY < 4; siteY++) {
      for (let siteX = 0; siteX < 4; siteX++) {
        stoneSites.push({
          x: (siteX + 0.5) * 64 + (hash(siteX, siteY, 701) - 0.5) * 38,
          y: (siteY + 0.5) * 64 + (hash(siteX, siteY, 709) - 0.5) * 38,
          color: 151 + Math.floor(hash(siteX, siteY, 719) * 33),
          crack: hash(siteX, siteY, 727) > 0.78,
        });
      }
    }
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const index = (y * 256 + x) * 4;
        let nearest = Infinity;
        let nextNearest = Infinity;
        let selected = stoneSites[0];
        for (const site of stoneSites) {
          const dx = Math.abs(x - site.x);
          const dy = Math.abs(y - site.y);
          const distance = Math.min(dx, 256 - dx) ** 2 + Math.min(dy, 256 - dy) ** 2;
          if (distance < nearest) {
            nextNearest = nearest;
            nearest = distance;
            selected = site;
          } else if (distance < nextNearest) {
            nextNearest = distance;
          }
        }
        const edge = Math.sqrt(nextNearest) - Math.sqrt(nearest) < 1.5;
        const value = edge
          ? 105 + Math.floor(hash(x, y, 733) * 16)
          : selected.color + Math.floor((hash(x, y, 739) - 0.5) * 12);
        stonePixels.data[index] = value;
        stonePixels.data[index + 1] = value;
        stonePixels.data[index + 2] = value;
        stonePixels.data[index + 3] = 255;
      }
    }
    stoneContext.putImageData(stonePixels, 0, 0);
    for (let siteIndex = 0; siteIndex < stoneSites.length; siteIndex++) {
      const site = stoneSites[siteIndex];
      if (!site.crack) continue;
      const originX = (siteIndex % 4) * 64 + 9;
      const originY = Math.floor(siteIndex / 4) * 64 + 9;
      const offsetX = 8 + hash(siteIndex, 0, 743) * 20;
      const offsetY = 8 + hash(siteIndex, 1, 751) * 20;
      stoneContext.strokeStyle = "rgba(35, 29, 27, 0.72)";
      stoneContext.lineWidth = 1.3;
      stoneContext.beginPath();
      stoneContext.moveTo(originX + offsetX, originY + offsetY);
      stoneContext.lineTo(originX + offsetX + 5, originY + offsetY + 8);
      stoneContext.lineTo(originX + offsetX + 2, originY + offsetY + 15);
      stoneContext.lineTo(originX + offsetX + 9, originY + offsetY + 22);
      stoneContext.stroke();
    }
    const stoneTexture = new THREE.CanvasTexture(stoneCanvas);
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;
    stoneTexture.colorSpace = THREE.SRGBColorSpace;
    stoneTexture.anisotropy = 4;

    const shared = {
      groundTexture: stoneTexture,
      pillarGeometry: new THREE.CylinderGeometry(8, 10, 36, 8),
      pillarBaseGeometry: new THREE.CylinderGeometry(14, 14, 4, 8),
      pillarCapGeometry: new THREE.CylinderGeometry(12, 15, 5, 8),
      rubbleGeometry: new THREE.DodecahedronGeometry(20, 0),
      brokenWallGeometry: new THREE.BoxGeometry(28, 18, 15),
      puddleGeometry: new THREE.CircleGeometry(24, 20),
      puddleRingGeometry: new THREE.RingGeometry(17, 24, 20),
      emberGeometry: new THREE.DodecahedronGeometry(3, 0),
      shadowGeometry: new THREE.CircleGeometry(1, 20),
      torsoGeometry: new THREE.CylinderGeometry(6.5, 9.5, 17, 10),
      headGeometry: new THREE.SphereGeometry(6.3, 12, 9),
      hoodGeometry: new THREE.SphereGeometry(7.5, 12, 9),
      limbGeometry: new THREE.CylinderGeometry(2.3, 2.8, 12, 8),
      handGeometry: new THREE.SphereGeometry(3, 8, 6),
      drifterBodyGeometry: new THREE.SphereGeometry(1, 12, 9),
      spikeGeometry: new THREE.ConeGeometry(3.2, 9, 6),
      characterSphereGeometry: new THREE.SphereGeometry(1, 12, 9),
      characterLimbGeometry: new THREE.CylinderGeometry(2.6, 3.2, 13, 8),
      runnerBladeGeometry: new THREE.BoxGeometry(3.4, 25, 5),
      armorPlateGeometry: new THREE.DodecahedronGeometry(7, 0),
      shadeRobeGeometry: new THREE.ConeGeometry(11, 30, 9),
      shadeTendrilGeometry: new THREE.ConeGeometry(2, 20, 6),
      burstCoreGeometry: new THREE.SphereGeometry(7, 12, 10),
      beltGeometry: new THREE.BoxGeometry(10, 3.6, 2.5),
      bootGeometry: new THREE.BoxGeometry(6, 3, 10),
      playerHoodGeometry: new THREE.ConeGeometry(7.2, 10, 9),
      dashTrailGeometry: new THREE.ConeGeometry(12, 32, 12),
      hitFlashGeometry: new THREE.SphereGeometry(1, 10, 8),
      standardGeometry: new THREE.BoxGeometry(1.3, 19, 1.3),
      standardClothGeometry: new THREE.BoxGeometry(8, 8, 1.2),
      bossTorsoGeometry: new THREE.SphereGeometry(1, 16, 12),
      bossHeadGeometry: new THREE.SphereGeometry(1, 14, 10),
      bossLimbGeometry: new THREE.CylinderGeometry(3.2, 4.5, 18, 8),
      bossSnoutGeometry: new THREE.ConeGeometry(6, 18, 8),
      bossEarGeometry: new THREE.ConeGeometry(4, 13, 7),
      bossBellGeometry: new THREE.CylinderGeometry(11, 20, 17, 12, 1, true),
      bossCrestGeometry: new THREE.ConeGeometry(7, 16, 8),
      bossMaskGeometry: new THREE.BoxGeometry(14, 9, 3),
      bossWingGeometry: new THREE.ConeGeometry(11, 31, 5),
      bossHaloGeometry: new THREE.TorusGeometry(17, 1.5, 6, 32),
      bossOrbitGeometry: new THREE.TorusGeometry(25, 0.9, 6, 40),
      telegraphCircleGeometry: new THREE.CircleGeometry(1, 32),
      telegraphRingGeometry: new THREE.RingGeometry(0.9, 1, 32),
      telegraphBoxGeometry: new THREE.BoxGeometry(1, 0.5, 1),
      telegraphArcGeometry: new THREE.TorusGeometry(1, 0.07, 4, 32, Math.PI * 1.4),
      explosionGeometry: new THREE.SphereGeometry(1, 12, 8),
      flameFanGeometry: new THREE.CircleGeometry(1, 24, -0.65, 1.3),
      bulwarkShieldGeometry: (() => {
        const shape = new THREE.Shape();
        shape.moveTo(-11, 14);
        shape.lineTo(11, 14);
        shape.lineTo(10, -8);
        shape.lineTo(0, -19);
        shape.lineTo(-10, -8);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, {
          depth: 3.2,
          bevelEnabled: true,
          bevelSegments: 1,
          steps: 1,
          bevelSize: 1,
          bevelThickness: 1,
        });
      })(),
      characterRingGeometry: new THREE.TorusGeometry(11, 0.7, 5, 24),
      rankPipGeometry: new THREE.OctahedronGeometry(2.1, 0),
      projectileGeometry: new THREE.SphereGeometry(3.8, 10, 8),
      projectileRingGeometry: new THREE.TorusGeometry(6.3, 0.8, 6, 16),
      crystalGeometry: new THREE.OctahedronGeometry(5, 0),
      orbitBladeGeometry: new THREE.BoxGeometry(26, 3.8, 8),
      hpBackGeometry: new THREE.BoxGeometry(26, 2.2, 1),
      hpFillGeometry: new THREE.BoxGeometry(24, 1.2, 1.2),
      groundMaterial: new THREE.MeshStandardMaterial({
        color: "#40312e", map: stoneTexture, roughness: 0.96, metalness: 0.015,
        vertexColors: true,
      }),
      stoneMaterials: ["#292d34", "#34343a", "#252a32", "#39363a"].map(
        (color) => new THREE.MeshStandardMaterial({
          color, roughness: 0.9, metalness: 0.04,
        }),
      ),
      insetMaterials: ["#414044", "#32353a", "#47403d"].map(
        (color) => new THREE.MeshStandardMaterial({
          color, roughness: 0.82, metalness: 0.08,
        }),
      ),
      playerCloth: new THREE.MeshStandardMaterial({
        color: "#634b68", roughness: 0.72, metalness: 0.04,
      }),
      playerTrim: new THREE.MeshStandardMaterial({
        color: "#dbad78", roughness: 0.48, metalness: 0.22,
      }),
      skin: new THREE.MeshStandardMaterial({
        color: "#d8b995", roughness: 0.78,
      }),
      darkLeather: new THREE.MeshStandardMaterial({
        color: "#211c27", roughness: 0.92,
      }),
      drifterHide: new THREE.MeshStandardMaterial({
        color: "#655969", roughness: 0.96,
      }),
      drifterBone: new THREE.MeshStandardMaterial({
        color: "#d6cba8", roughness: 0.7,
      }),
      genericEnemy: ["#8d574e", "#6a8492", "#718354", "#805d94", "#b06d4d", "#69738f"]
        .map((color) => new THREE.MeshStandardMaterial({
          color, roughness: 0.88, metalness: 0.02,
        })),
      enemySecondary: ["#b6a58d", "#d39770", "#9aa67c", "#b2a1c9", "#f0a460", "#a9b5c3"]
        .map((color) => new THREE.MeshStandardMaterial({
          color, roughness: 0.82, metalness: 0.08,
        })),
      enemyArmor: ["#524b54", "#714c43", "#535c4b", "#554e6a", "#733f38", "#475564"]
        .map((color) => new THREE.MeshStandardMaterial({
          color, roughness: 0.68, metalness: 0.2,
        })),
      enemyGlow: [
        "#e2d9ba", "#f2ae72", "#c3d58c", "#b7f4ff", "#ffba62", "#9be9ff",
      ].map((color) => new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.15, roughness: 0.32, metalness: 0.12,
      })),
      rankMaterials: ["#b7b0a5", "#75d3e2", "#cc9bea", "#ffc36c"].map(
        (color) => new THREE.MeshStandardMaterial({
          color, emissive: color, emissiveIntensity: 0.8, roughness: 0.3,
        }),
      ),
      bossMaterials: [
        ["#725345", "#d9aa76", "#342322", "#ff8b55"],
        ["#382d50", "#c5b2df", "#171522", "#c08bff"],
        ["#80704f", "#e7d29a", "#473b2c", "#ffe29b"],
        ["#493247", "#f0a8e4", "#1a1424", "#ff63e3"],
      ].map(([body, trim, dark, glow]) => ({
        body: new THREE.MeshStandardMaterial({
          color: body, roughness: 0.76, metalness: 0.08,
        }),
        trim: new THREE.MeshStandardMaterial({
          color: trim, roughness: 0.48, metalness: 0.32,
        }),
        dark: new THREE.MeshStandardMaterial({
          color: dark, roughness: 0.92, metalness: 0.03,
        }),
        glow: new THREE.MeshStandardMaterial({
          color: glow, emissive: glow, emissiveIntensity: 1.4,
          roughness: 0.28, metalness: 0.12,
        }),
      })),
      telegraphMaterials: {
        boss: new THREE.MeshBasicMaterial({
          color: "#ff79ca", transparent: true, opacity: 0.3,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        hazard: new THREE.MeshBasicMaterial({
          color: "#ff567c", transparent: true, opacity: 0.42,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        charge: new THREE.MeshBasicMaterial({
          color: "#ffad62", transparent: true, opacity: 0.42,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        fire: new THREE.MeshBasicMaterial({
          color: "#ff874b", transparent: true, opacity: 0.26,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        water: new THREE.MeshBasicMaterial({
          color: "#51deeb", transparent: true, opacity: 0.24,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        frost: new THREE.MeshBasicMaterial({
          color: "#9ceaff", transparent: true, opacity: 0.26,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        arcane: new THREE.MeshBasicMaterial({
          color: "#c29aff", transparent: true, opacity: 0.26,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
        safe: new THREE.MeshBasicMaterial({
          color: "#8effd8", transparent: true, opacity: 0.62,
          side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        }),
      },
      explosionMaterials: {
        fire: new THREE.MeshBasicMaterial({
          color: "#ff9348", transparent: true, opacity: 0.34, depthWrite: false,
        }),
        arcane: new THREE.MeshBasicMaterial({
          color: "#d993ff", transparent: true, opacity: 0.32, depthWrite: false,
        }),
        frost: new THREE.MeshBasicMaterial({
          color: "#a7eaff", transparent: true, opacity: 0.3, depthWrite: false,
        }),
      },
      gemMaterials: {
        health: new THREE.MeshStandardMaterial({
          color: "#ff6380", emissive: "#ff334d", emissiveIntensity: 0.6,
          metalness: 0.25, roughness: 0.25,
        }),
        xp: new THREE.MeshStandardMaterial({
          color: "#7adcf5", emissive: "#29b7e7", emissiveIntensity: 0.6,
          metalness: 0.25, roughness: 0.25,
        }),
      },
      projectileMaterials: {
        arcane: new THREE.MeshStandardMaterial({
          color: "#e5d9ff", emissive: "#9161f1", emissiveIntensity: 2.3,
          roughness: 0.25, metalness: 0.1,
        }),
        fire: new THREE.MeshStandardMaterial({
          color: "#fff0cb", emissive: "#ed632d", emissiveIntensity: 2.4,
          roughness: 0.24,
        }),
        water: new THREE.MeshStandardMaterial({
          color: "#d6ffff", emissive: "#35bfc7", emissiveIntensity: 2.2,
          roughness: 0.2, metalness: 0.12,
        }),
        frost: new THREE.MeshStandardMaterial({
          color: "#e2f8ff", emissive: "#6bbde8", emissiveIntensity: 2.3,
          roughness: 0.18, metalness: 0.18,
        }),
        enemy: new THREE.MeshStandardMaterial({
          color: "#fff0ad", emissive: "#ec9a48", emissiveIntensity: 2,
          roughness: 0.25,
        }),
      },
      hpBack: new THREE.MeshBasicMaterial({ color: "#17151c" }),
      hpFill: new THREE.MeshBasicMaterial({ color: "#95d58b" }),
      shadow: new THREE.MeshBasicMaterial({
        color: "#03050a", transparent: true, opacity: 0.28, depthWrite: false,
      }),
      actorShadow: new THREE.MeshBasicMaterial({
        color: "#03050a", transparent: true, opacity: 0.35, depthWrite: false,
      }),
      projectileShadow: new THREE.MeshBasicMaterial({
        color: "#03050a", transparent: true, opacity: 0.18, depthWrite: false,
      }),
      hitFlash: new THREE.MeshBasicMaterial({
        color: "#ffffff", transparent: true, opacity: 0.4, wireframe: true, depthWrite: false,
      }),
      waterMaterial: new THREE.MeshStandardMaterial({
        color: "#44bdb8", emissive: "#168a8d", emissiveIntensity: 0.3,
        transparent: true, opacity: 0.68, roughness: 0.22, metalness: 0.22,
        depthWrite: false,
      }),
      waterEdgeMaterial: new THREE.MeshBasicMaterial({
        color: "#9df2e9", transparent: true, opacity: 0.48, depthWrite: false,
      }),
      frostMaterial: new THREE.MeshStandardMaterial({
        color: "#b5f0ff", emissive: "#55b6df", emissiveIntensity: 0.8,
        roughness: 0.2, metalness: 0.28,
      }),
      emberMaterial: new THREE.MeshStandardMaterial({
        color: "#ff9b55", emissive: "#ed4e22", emissiveIntensity: 1.5,
        roughness: 0.48,
      }),
      dashTrail: new THREE.MeshBasicMaterial({
        color: "#68e5f4", transparent: true, opacity: 0.26,
        side: THREE.DoubleSide, depthWrite: false,
      }),
    };

    const terrain = new Map();
    const terrainCache = new Map();
    const actors = new Map();
    const projectiles = new Map();
    const projectilePool = [];
    const gems = new Map();
    const gemPool = [];
    const orbitBlades = [];
    const combatEffects = new Map();
    const combatEffectPool = [];
    const combatEffectIds = new WeakMap();
    const fanGeometryCache = new Map();
    const renderQaIsolation = {
      projectiles: true,
      combatEffects: true,
      decoration: true,
    };
    let nextCombatEffectId = 1;
    let activeCombatEffectCount = 0;
    let renderTime = 0;
    const effectPools = { rings: [], boxes: [], fans: [] };
    const effectFrame = { rings: 0, boxes: 0, fans: 0 };
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const pitch = THREE.MathUtils.degToRad(46);
    const zoom = 1.16;
    const terrainChunkSize = 360;
    const terrainResolution = 32;
    let terrainTheme = "";
    let terrainCenter = "";
    let terrainChunkBuildCount = 0;
    let cameraAngleDegrees = 0;
    let frameCount = 0;
    let drawDurationMs = 0;
    let meshCount = 0;
    let ruinMeshCount = 0;
    const playerNdc = new THREE.Vector3();
    const actorNdc = new THREE.Vector3();

    function renderQaLocalTransform(object) {
      return {
        position: object.position.toArray().slice(0, 3),
        rotation: object.rotation.toArray().slice(0, 3),
        scale: object.scale.toArray(),
      };
    }

    function markRenderQaObject(object, category, name, time) {
      if (!renderQaEnabled) return;
      const data = object.userData;
      if (!Number.isFinite(data.qaCreatedAt)) data.qaCreatedAt = time;
      const now = performance.now();
      if (!Number.isFinite(data.qaCreatedAtMs)) data.qaCreatedAtMs = now;
      if (Number.isFinite(data.qaActivatedAt)) {
        data.qaReuseCount = (data.qaReuseCount || 0) + 1;
      } else {
        data.qaReuseCount = 0;
      }
      data.qaCategory = category;
      data.qaName = name;
      data.qaActivatedAt = time;
      data.qaActivatedAtMs = now;
      data.qaActivationTransform = renderQaLocalTransform(object);
      data.qaActive = true;
    }

    function releaseRenderQaObject(object, time) {
      if (!renderQaEnabled) return;
      const data = object.userData;
      data.qaLastPoolTransform = renderQaLocalTransform(object);
      data.qaLastActiveDurationMs = Number.isFinite(data.qaActivatedAtMs)
        ? Math.max(0, performance.now() - data.qaActivatedAtMs)
        : 0;
      data.qaLastActiveDuration = Number.isFinite(data.qaActivatedAt)
        ? Math.max(0, time - data.qaActivatedAt)
        : 0;
      data.qaActive = false;
      data.qaReleasedAt = time;
    }

    if (renderQaEnabled) {
      window.getShadowRenderQAIsolation = () => (
        window.isDeveloperRun?.() ? { ...renderQaIsolation } : null
      );
      window.setShadowRenderQAIsolation = (updates) => {
        if (!window.isDeveloperRun?.() || !updates || typeof updates !== "object") return false;
        const keys = ["projectiles", "combatEffects", "decoration"];
        if (Object.keys(updates).some((key) => !keys.includes(key))) return false;
        if (keys.some((key) => Object.hasOwn(updates, key) && typeof updates[key] !== "boolean")) {
          return false;
        }
        Object.assign(renderQaIsolation, updates);
        return true;
      };
    }

    function fanGeometry(halfAngle) {
      const bounded = Math.max(0.08, Math.min(Math.PI, halfAngle || 0.65));
      const key = bounded.toFixed(3);
      if (!fanGeometryCache.has(key)) {
        fanGeometryCache.set(
          key,
          new THREE.CircleGeometry(1, 32, -bounded, bounded * 2),
        );
      }
      return fanGeometryCache.get(key);
    }

    function hash(x, z, salt = 0) {
      let value = Math.imul(x | 0, 0x45d9f3b)
        ^ Math.imul(z | 0, 0x119de1f3) ^ salt;
      value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
      value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
      return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
    }

    function terrainHeight(x, z) {
      function noise(scale, salt) {
        const gx = Math.floor(x / scale);
        const gz = Math.floor(z / scale);
        const fx = x / scale - gx;
        const fz = z / scale - gz;
        const smoothX = fx * fx * (3 - 2 * fx);
        const smoothZ = fz * fz * (3 - 2 * fz);
        const top = THREE.MathUtils.lerp(
          hash(gx, gz, salt),
          hash(gx + 1, gz, salt),
          smoothX,
        );
        const bottom = THREE.MathUtils.lerp(
          hash(gx, gz + 1, salt),
          hash(gx + 1, gz + 1, salt),
          smoothX,
        );
        return THREE.MathUtils.lerp(top, bottom, smoothZ) - 0.5;
      }

      return noise(280, 801) * 2.4 + noise(112, 809) * 0.95
        + Math.sin(x * 0.018 + z * 0.011) * 0.22;
    }

    function terrainNormal(x, z) {
      const step = 1;
      const slopeX = (terrainHeight(x + step, z) - terrainHeight(x - step, z)) / (step * 2);
      const slopeZ = (terrainHeight(x, z + step) - terrainHeight(x, z - step)) / (step * 2);
      return new THREE.Vector3(-slopeX, 1, -slopeZ).normalize();
    }

    function makeTerrainGeometry(gx, gz) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const normals = [];
      const colors = [];
      const uvs = [];
      const indices = [];
      const originX = gx * terrainChunkSize - terrainChunkSize / 2;
      const originZ = gz * terrainChunkSize - terrainChunkSize / 2;
      let minimumHeight = Infinity;
      let maximumHeight = -Infinity;

      for (let row = 0; row <= terrainResolution; row++) {
        const z = originZ + terrainChunkSize * row / terrainResolution;
        for (let column = 0; column <= terrainResolution; column++) {
          const x = originX + terrainChunkSize * column / terrainResolution;
          const height = terrainHeight(x, z);
          const normal = terrainNormal(x, z);
          const variation = 0.91 + hash(Math.floor(x / 36), Math.floor(z / 36), 821) * 0.12;
          positions.push(x - gx * terrainChunkSize, height, z - gz * terrainChunkSize);
          normals.push(normal.x, normal.y, normal.z);
          colors.push(variation, variation, variation);
          uvs.push(x / 256, z / 256);
          minimumHeight = Math.min(minimumHeight, height);
          maximumHeight = Math.max(maximumHeight, height);
        }
      }

      const stride = terrainResolution + 1;
      for (let row = 0; row < terrainResolution; row++) {
        for (let column = 0; column < terrainResolution; column++) {
          const a = row * stride + column;
          const b = a + 1;
          const c = a + stride;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      geometry.userData.heightRange = [minimumHeight, maximumHeight];
      return geometry;
    }

    function mesh(geometry, material, parent, x = 0, y = 0, z = 0) {
      const item = new THREE.Mesh(geometry, material);
      item.position.set(x, y, z);
      item.castShadow = true;
      item.receiveShadow = true;
      parent.add(item);
      return item;
    }

    function addPillar(parent, x, z, height, material, baseHeight) {
      const pillar = new THREE.Group();
      pillar.position.set(x, baseHeight, z);
      parent.add(pillar);
      mesh(shared.pillarBaseGeometry, material, pillar, 0, 2, 0);
      const shaft = new THREE.Mesh(shared.pillarGeometry, material);
      shaft.scale.y = height / 36;
      shaft.position.y = height / 2 + 3;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      pillar.add(shaft);
      mesh(shared.pillarCapGeometry, material, pillar, 0, height + 5, 0);
      return pillar;
    }

    function setTheme(element) {
      const themes = {
        fire: {
          floor: "#46312b",
          stone: ["#49332d", "#594037", "#382823", "#503a31"],
          inset: ["#684333", "#49332b", "#76503b"],
          light: "#ff9860",
          sky: "#160c0c",
        },
        water: {
          floor: "#34474a",
          stone: ["#34484b", "#415659", "#2c3d40", "#425256"],
          inset: ["#496164", "#374a4d", "#506467"],
          light: "#8ce1d7",
          sky: "#091719",
        },
        frost: {
          floor: "#526879",
          stone: ["#435767", "#52697a", "#394b5a", "#587080"],
          inset: ["#607c8e", "#475f70", "#6a8494"],
          light: "#a7e8ff",
          sky: "#0c1722",
        },
      };
      const theme = themes[element] || themes.fire;
      scene.background.set(theme.sky);
      scene.fog.color.set(theme.sky);
      shared.groundMaterial.color.set(theme.floor);
      theme.stone.forEach((color, index) => shared.stoneMaterials[index].color.set(color));
      theme.inset.forEach((color, index) => shared.insetMaterials[index].color.set(color));
      keyLight.color.set(theme.light);
      return element in themes ? element : "fire";
    }

    function addThemeDetails(cell, gx, gz, localX, localZ, salt) {
      const worldX = gx * terrainChunkSize + localX;
      const worldZ = gz * terrainChunkSize + localZ;
      const groundY = terrainHeight(worldX, worldZ);

      if (terrainTheme === "water") {
        const puddle = mesh(
          shared.puddleGeometry, shared.waterMaterial, cell, localX, groundY + 0.12, localZ,
        );
        puddle.rotation.x = -Math.PI / 2;
        puddle.scale.set(0.65 + salt * 0.5, 0.55 + salt * 0.35, 1);
        puddle.castShadow = false;
        puddle.receiveShadow = false;
        const rim = mesh(
          shared.puddleRingGeometry, shared.waterEdgeMaterial, cell, localX, groundY + 0.16, localZ,
        );
        rim.rotation.x = -Math.PI / 2;
        rim.scale.copy(puddle.scale);
        rim.castShadow = false;
        rim.receiveShadow = false;
      } else if (terrainTheme === "frost") {
        const crystal = mesh(
          shared.crystalGeometry, shared.frostMaterial, cell, localX, groundY + 4, localZ,
        );
        crystal.scale.set(0.72, 1.1 + salt * 0.55, 0.72);
        crystal.rotation.y = salt * Math.PI * 2;
        crystal.castShadow = true;
      } else {
        const ember = mesh(
          shared.emberGeometry, shared.emberMaterial, cell, localX, groundY + 2.2, localZ,
        );
        ember.scale.set(1 + salt, 0.7, 0.9 + salt);
        ember.rotation.set(salt, salt * 2, salt * 3);
        ember.castShadow = true;
      }
    }

    function makeTerrainCell(gx, gz) {
      const cell = new THREE.Group();
      const seed = hash(gx, gz, 17);
      const groundGeometry = makeTerrainGeometry(gx, gz);
      const ground = mesh(groundGeometry, shared.groundMaterial, cell);
      ground.castShadow = false;
      ground.receiveShadow = true;
      cell.userData.ownedGeometries = [groundGeometry];
      cell.userData.heightRange = groundGeometry.userData.heightRange;
      cell.position.set(gx * terrainChunkSize, 0, gz * terrainChunkSize);

      const localX = (hash(gx, gz, 42) - 0.5) * (terrainChunkSize - 100);
      const localZ = (hash(gx, gz, 43) - 0.5) * (terrainChunkSize - 100);
      const material = shared.stoneMaterials[Math.floor(hash(gx, gz, 41) * shared.stoneMaterials.length)];
      if (seed > 0.9) {
        const height = 28 + hash(gx, gz, 44) * 24;
        addPillar(
          cell, localX, localZ, height, material,
          terrainHeight(gx * terrainChunkSize + localX, gz * terrainChunkSize + localZ),
        );
        if (hash(gx, gz, 45) > 0.5) {
          const secondX = localX + (hash(gx, gz, 46) - 0.5) * 46;
          const secondZ = localZ + 30;
          addPillar(
            cell, secondX, secondZ, 14 + hash(gx, gz, 47) * 12, material,
            terrainHeight(gx * terrainChunkSize + secondX, gz * terrainChunkSize + secondZ),
          );
        }
      } else if (seed > 0.78) {
        const wall = mesh(
          shared.brokenWallGeometry, material, cell, localX, 8,
          localZ,
        );
        wall.position.y = terrainHeight(
          gx * terrainChunkSize + localX, gz * terrainChunkSize + localZ,
        ) + 8;
        wall.rotation.y = hash(gx, gz, 48) * Math.PI;
        wall.scale.set(0.85 + seed * 0.3, 0.55 + seed * 0.2, 0.8);
      } else if (seed > 0.58) {
        const rubble = mesh(
          shared.rubbleGeometry, material, cell, localX, 0, localZ,
        );
        rubble.position.y = terrainHeight(
          gx * terrainChunkSize + localX, gz * terrainChunkSize + localZ,
        ) + 2;
        rubble.scale.set(1.05, 0.32, 0.8);
      }

      if (seed > 0.42) {
        addThemeDetails(
          cell, gx, gz,
          (hash(gx, gz, 52) - 0.5) * (terrainChunkSize - 80),
          (hash(gx, gz, 53) - 0.5) * (terrainChunkSize - 80),
          hash(gx, gz, 54),
        );
      }
      cell.userData.isWorldCell = true;
      cell.name = `terrain:${terrainTheme}:${gx}:${gz}`;
      terrainChunkBuildCount++;
      return cell;
    }

    function updateTerrain(player, element) {
      for (const cell of terrain.values()) {
        cell.visible = renderQaIsolation.decoration;
      }
      if (element !== terrainTheme) {
        terrainTheme = setTheme(element);
        for (const cell of terrain.values()) {
          scene.remove(cell);
          releaseRenderQaObject(cell, renderTime);
        }
        terrain.clear();
        terrainCenter = "";
      }
      if (!player) return;
      const centerX = Math.floor(player.x / terrainChunkSize);
      const centerZ = Math.floor(player.y / terrainChunkSize);
      const centerKey = `${terrainTheme}:${centerX}:${centerZ}`;
      if (centerKey === terrainCenter) return;
      terrainCenter = centerKey;

      const visibleX = Math.ceil(viewport.width / zoom / terrainChunkSize / 2) + 2;
      const visibleZ = Math.ceil(viewport.height / zoom / Math.cos(pitch) / terrainChunkSize / 2) + 2;
      const wanted = new Set();
      for (let gx = centerX - visibleX; gx <= centerX + visibleX; gx++) {
        for (let gz = centerZ - visibleZ; gz <= centerZ + visibleZ; gz++) {
          const key = `${terrainTheme}:${gx}:${gz}`;
          wanted.add(key);
          if (!terrain.has(key)) {
            let chunk = terrainCache.get(key);
            if (chunk) {
              terrainCache.delete(key);
            } else {
              chunk = makeTerrainCell(gx, gz);
            }
            terrainCache.set(key, chunk);
            terrain.set(key, chunk);
            markRenderQaObject(chunk, "world-decoration", chunk.name, renderTime);
            chunk.visible = renderQaIsolation.decoration;
            scene.add(chunk);
          }
        }
      }
      for (const [key, cell] of terrain) {
        if (!wanted.has(key)) {
          scene.remove(cell);
          releaseRenderQaObject(cell, renderTime);
          terrain.delete(key);
        }
      }

      while (terrainCache.size > 240) {
        const [key, chunk] = terrainCache.entries().next().value;
        if (terrain.has(key)) {
          terrainCache.delete(key);
          terrainCache.set(key, chunk);
          if ([...terrainCache.keys()].every((cachedKey) => terrain.has(cachedKey))) break;
          continue;
        }
        terrainCache.delete(key);
        chunk.userData.ownedGeometries.forEach((geometry) => geometry.dispose());
      }
    }

    function makeShadow(parent, radius, opacity = 0.28) {
      const shadowMaterial = opacity === 0.18
        ? shared.projectileShadow
        : opacity === 0.28 ? shared.shadow : shared.actorShadow;
      const shadow = new THREE.Mesh(shared.shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(radius, radius * 0.68, 1);
      shadow.position.y = -0.08;
      shadow.renderOrder = 2;
      parent.add(shadow);
      return shadow;
    }

    function createPlayer() {
      const root = new THREE.Group();
      const body = new THREE.Group();
      root.add(body);
      root.userData.body = body;
      root.userData.shadowParts = [];
      root.userData.characterType = "player";
      root.userData.family = "player";
      root.userData.silhouetteFeatures = ["hood", "long coat", "paired limbs"];
      root.userData.materials = [shared.playerCloth, shared.playerTrim, shared.skin, shared.darkLeather];
      root.userData.arms = [];
      root.userData.legs = [];
      root.userData.rankPips = [];
      root.userData.shadow = makeShadow(root, 18, 0.34);

      const torso = mesh(shared.torsoGeometry, shared.playerCloth, body, 0, 18, 0);
      torso.scale.set(1, 1.1, 0.9);
      root.userData.shadowParts.push(torso);
      mesh(shared.hoodGeometry, shared.darkLeather, body, 0, 28, -0.3)
        .scale.set(0.94, 1.12, 0.94);
      const face = mesh(shared.headGeometry, shared.skin, body, 0, 27, 2.2);
      face.scale.set(0.74, 0.9, 0.62);
      root.userData.shadowParts.push(face);
      mesh(shared.playerHoodGeometry, shared.playerCloth, body, 0, 35, -1)
        .rotation.x = -0.2;
      mesh(shared.beltGeometry, shared.playerTrim, body, 0, 11, 0);
      mesh(shared.rankPipGeometry, shared.playerTrim, body, -2, 28, 7.1).scale.setScalar(0.5);
      mesh(shared.rankPipGeometry, shared.playerTrim, body, 2, 28, 7.1).scale.setScalar(0.5);

      for (const side of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(side * 9, 23, 0);
        body.add(arm);
        const armMesh = mesh(shared.limbGeometry, shared.playerCloth, arm, 0, -5, 0);
        root.userData.shadowParts.push(armMesh);
        mesh(shared.handGeometry, shared.skin, arm, 0, -11.2, 0.4);
        root.userData.arms.push(arm);

        const leg = new THREE.Group();
        leg.position.set(side * 4.2, 9, 0);
        body.add(leg);
        const legMesh = mesh(shared.limbGeometry, shared.darkLeather, leg, 0, -3.2, 0);
        root.userData.shadowParts.push(legMesh);
        mesh(shared.bootGeometry, shared.darkLeather, leg, 0, -9, 2.2);
        root.userData.legs.push(leg);
      }

      const dashTrail = new THREE.Mesh(shared.dashTrailGeometry, shared.dashTrail);
      dashTrail.rotation.x = Math.PI / 2;
      dashTrail.position.set(0, 6, -22);
      dashTrail.visible = false;
      root.add(dashTrail);
      root.userData.dashTrail = dashTrail;
      root.userData.hitGlow = mesh(shared.hitFlashGeometry, shared.hitFlash, root, 0, 23, 0);
      root.userData.hitGlow.scale.set(13, 25, 12);
      root.userData.hitGlow.visible = false;
      scene.add(root);
      return root;
    }

    function addHumanoidLimbs(root, body, main, accent, options = {}) {
      const armSpan = options.armSpan || 8;
      const legSpan = options.legSpan || 4;
      const armScale = options.armScale || [1, 1, 1];
      const legScale = options.legScale || [1, 1, 1];
      for (const side of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(side * armSpan, options.armY || 21, options.armZ || 0);
        body.add(arm);
        const armMesh = mesh(shared.characterLimbGeometry, main, arm, 0, -5, 0);
        armMesh.scale.set(...armScale);
        root.userData.shadowParts.push(armMesh);
        mesh(shared.handGeometry, accent, arm, 0, -12, 1.4)
          .scale.setScalar(options.handScale || 1);
        root.userData.arms.push(arm);

        const leg = new THREE.Group();
        leg.position.set(side * legSpan, options.legY || 9, 0);
        body.add(leg);
        const legMesh = mesh(shared.limbGeometry, main, leg, 0, -3, 0);
        legMesh.scale.set(...legScale);
        root.userData.shadowParts.push(legMesh);
        mesh(shared.bootGeometry, accent, leg, 0, -9, 2.4)
          .scale.set(options.footScale || 1, 1, options.footScale || 1);
        root.userData.legs.push(leg);
      }
    }

    function addRankPips(body, root, level, height = 40, depth = -5) {
      for (let index = 0; index < 4; index++) {
        const pip = mesh(
          shared.rankPipGeometry,
          shared.rankMaterials[index],
          body,
          (index - 1.5) * 5,
          height,
          depth,
        );
        pip.scale.setScalar(0.72);
        pip.visible = index < level;
        root.userData.rankPips.push(pip);
      }
    }

    function addMutation(root, body, level, name, position, material, scale = 1) {
      const mutation = mesh(
        shared.spikeGeometry,
        material,
        body,
        position[0],
        position[1],
        position[2],
      );
      mutation.rotation.set(position[3] || 0, position[4] || 0, position[5] || 0);
      mutation.scale.setScalar(scale * (0.78 + level * 0.12));
      root.userData.mutationParts.push(mutation);
      root.userData.rankMutation.push(name);
      return mutation;
    }

    function createEnemyFamily(enemy) {
      const root = new THREE.Group();
      const body = new THREE.Group();
      root.add(body);
      root.userData.body = body;
      root.userData.shadowParts = [];
      root.userData.arms = [];
      root.userData.legs = [];
      root.userData.rankPips = [];
      root.userData.mutationParts = [];
      root.userData.rankMutation = [];
      root.userData.attackParts = [];
      root.userData.bannerParts = [];
      root.userData.familyKind = enemy.kind;
      root.userData.family = (["Drifter", "Runner", "Zombie Mike", "", "Ranged Shade", "Burstling", "Bulwark"])[enemy.kind]
        || "Unknown";
      root.userData.characterType = "enemy";
      const level = Math.max(1, Math.min(4, Math.floor(Number(enemy.evolutionLevel) || 1)));
      root.userData.evolutionLevel = level;
      const familyColors = {
        0: [shared.drifterHide, shared.drifterBone, shared.enemyArmor[0], shared.enemyGlow[0]],
        1: [shared.genericEnemy[0], shared.enemySecondary[1], shared.enemyArmor[1], shared.enemyGlow[1]],
        2: [shared.genericEnemy[2], shared.enemySecondary[2], shared.enemyArmor[2], shared.enemyGlow[2]],
        4: [shared.genericEnemy[3], shared.enemySecondary[3], shared.enemyArmor[3], shared.enemyGlow[3]],
        5: [shared.genericEnemy[4], shared.enemySecondary[4], shared.enemyArmor[4], shared.enemyGlow[4]],
        6: [shared.genericEnemy[5], shared.enemySecondary[5], shared.enemyArmor[5], shared.enemyGlow[5]],
      };
      const [main, accent, armor, glow] = familyColors[enemy.kind] || familyColors[0];
      root.userData.materials = [main, accent, armor, glow];
      root.userData.silhouetteFeatures = [];
      root.userData.shadow = makeShadow(root, Math.max(12, enemy.r || 13), 0.35);

      const torso = mesh(shared.characterSphereGeometry, main, body, 0, 18, 0);
      const head = mesh(shared.characterSphereGeometry, accent, body, 0, 31, 2.5);
      root.userData.shadowParts.push(torso, head);
      head.scale.set(5.5, 6.2, 5.3);
      const eyes = [-2.1, 2.1].map((x) =>
        mesh(shared.rankPipGeometry, glow, body, x, 32, 7.2));

      if (enemy.kind === 0) {
        torso.scale.set(9.4, 12.5, 8);
        head.scale.set(6.3, 6.8, 6.2);
        head.position.set(0, 27, 4);
        eyes.forEach((eye) => eye.scale.setScalar(0.72));
        mesh(shared.characterSphereGeometry, accent, body, 0, 20, 7.2)
          .scale.set(4.5, 3.2, 2.7);
        root.userData.silhouetteFeatures = ["hunched ribcage", "forward skull", "branching antlers"];
        addHumanoidLimbs(root, body, main, accent, {
          armSpan: 8, armY: 20, armScale: [1.12, 1.2, 1.1], legSpan: 4.3,
        });
        for (const side of [-1, 1]) {
          if (level >= 2) {
            addMutation(root, body, level, "antler tine", [side * 4.5, 35, -1, 0, 0, side * -0.55], accent, 1.2);
          }
          if (level >= 3) {
            addMutation(root, body, level, "shoulder spur", [side * 9.5, 23, -2, 0, 0, side * -0.5], accent, 0.85);
          }
        }
        const stompRing = mesh(shared.characterRingGeometry, glow, root, 0, 0.9, 0);
        stompRing.rotation.x = Math.PI / 2;
        stompRing.visible = false;
        root.userData.stompRing = stompRing;
        if (level >= 4) {
          mesh(shared.burstCoreGeometry, glow, body, 0, 18, 7.5).scale.set(0.55, 0.55, 0.38);
          root.userData.rankMutation.push("exposed bone core");
        }
      } else if (enemy.kind === 1) {
        torso.scale.set(6.5, 12.4, 6.2);
        torso.position.set(0, 19, 0);
        head.position.set(0, 32, 3);
        head.scale.set(4.8, 5.1, 4.8);
        body.rotation.x = -0.2;
        root.userData.silhouetteFeatures = ["forward lean", "long runner legs", "forearm blades"];
        addHumanoidLimbs(root, body, main, accent, {
          armSpan: 6.6, armY: 23, armScale: [0.8, 1.35, 0.8],
          legSpan: 3.8, legY: 10, legScale: [0.78, 1.45, 0.78], footScale: 1.15,
        });
        for (const side of [-1, 1]) {
          if (level >= 2) {
            const blade = mesh(shared.runnerBladeGeometry, accent, body, side * 8.5, 18, 2);
            blade.rotation.z = side * 0.34;
            root.userData.mutationParts.push(blade);
            root.userData.rankMutation.push("forearm blade");
          }
          if (level >= 3) {
            addMutation(root, body, level, "calf spur", [side * 4.5, 7, -4, 0.4, 0, side * 0.45], accent, 0.9);
          }
        }
        if (level >= 4) {
          const fin = mesh(shared.runnerBladeGeometry, armor, body, 0, 20, -8);
          fin.scale.set(1.4, 1.2, 1);
          fin.rotation.x = -0.8;
          root.userData.mutationParts.push(fin);
          root.userData.rankMutation.push("back fin");
        }
      } else if (enemy.kind === 2) {
        torso.scale.set(13.2, 13.5, 10.2);
        torso.position.y = 18;
        head.position.set(0, 34, 2);
        head.scale.set(4.6, 4.9, 4.6);
        root.userData.silhouetteFeatures = ["broad armored torso", "small head", "heavy fists"];
        addHumanoidLimbs(root, body, main, accent, {
          armSpan: 12, armY: 23, armScale: [1.5, 1.45, 1.4],
          legSpan: 7.5, legScale: [1.45, 1.2, 1.35], handScale: 1.35, footScale: 1.25,
        });
        for (const side of [-1, 1]) {
          const plate = mesh(shared.armorPlateGeometry, armor, body, side * 11, 28, -0.4);
          plate.scale.set(1.25, 0.8, 1);
          root.userData.mutationParts.push(plate);
          if (level >= 2) {
            addMutation(root, body, level, "shoulder ridge", [side * 12, 35, -1, 0, 0, side * -0.65], accent, 1.1);
          }
          if (level >= 3) {
            addMutation(root, body, level, "forearm plate", [side * 13, 18, 4, 0, 0, side * -0.8], armor, 1.2);
          }
        }
        if (level >= 4) {
          mesh(shared.characterRingGeometry, glow, body, 0, 2, 0)
            .scale.set(1.6, 1.6, 1);
          root.userData.rankMutation.push("seismic mantle");
        }
      } else if (enemy.kind === 4) {
        torso.geometry = shared.shadeRobeGeometry;
        torso.material = main;
        torso.position.set(0, 16, 0);
        torso.scale.set(1.05, 1.1, 1.05);
        head.material = armor;
        head.position.set(0, 31, 1);
        head.scale.set(1.08, 1.15, 1.05);
        eyes.forEach((eye) => eye.position.set(0, 31.5, 7.1));
        eyes[0].position.x = -2.3;
        eyes[1].position.x = 2.3;
        root.userData.floatHeight = 5;
        root.userData.silhouetteFeatures = ["floating tapering shroud", "glowing face", "crown and trailing wisps"];
        addHumanoidLimbs(root, body, main, glow, {
          armSpan: 8, armY: 22, armScale: [0.85, 1.3, 0.85], legSpan: 2,
          legY: 3, legScale: [0.7, 0.8, 0.7], footScale: 0.55,
        });
        for (const side of [-1, 1]) {
          const tail = mesh(shared.shadeTendrilGeometry, main, body, side * 6, 3, -6);
          tail.rotation.z = side * 0.3;
          root.userData.mutationParts.push(tail);
          if (level >= 2) {
            addMutation(root, body, level, "crown tine", [side * 4, 39, -1, 0, 0, side * -0.42], accent, 0.9);
          }
        }
        const halo = mesh(shared.characterRingGeometry, glow, body, 0, 43, -1);
        halo.scale.set(0.8, 0.8, 0.8);
        root.userData.halo = halo;
        if (level >= 3) {
          root.userData.rankMutation.push("split crown");
          addMutation(root, body, level, "crown crest", [0, 42, -1, 0, 0, 0], accent, 1.1);
        }
        if (level >= 4) {
          root.userData.rankMutation.push("expanded halo");
          halo.scale.set(1.3, 1.3, 1.3);
        }
      } else if (enemy.kind === 5) {
        torso.scale.set(12.2, 10.2, 11);
        torso.position.set(0, 16, 0);
        head.position.set(0, 25, 4);
        head.scale.set(4.6, 4.7, 4.6);
        const core = mesh(shared.burstCoreGeometry, glow, body, 0, 17, 9);
        core.scale.set(0.9, 0.9, 0.65);
        root.userData.core = core;
        root.userData.silhouetteFeatures = ["low round body", "bright exposed core", "radial spines"];
        addHumanoidLimbs(root, body, main, accent, {
          armSpan: 10, armY: 17, armScale: [1, 0.95, 1], legSpan: 7, legY: 7,
          legScale: [1.15, 0.9, 1.1], handScale: 0.8, footScale: 1.15,
        });
        for (let index = 0; index < 6; index++) {
          const angle = index * Math.PI / 3;
          const spike = mesh(shared.spikeGeometry, accent, body,
            Math.sin(angle) * 10, 18 + Math.cos(angle) * 7, Math.cos(angle) * 9);
          spike.rotation.z = Math.sin(angle) * 0.8;
          spike.rotation.x = Math.cos(angle) * 0.8;
          spike.scale.setScalar(0.8 + level * 0.12);
          root.userData.mutationParts.push(spike);
        }
        const warningRing = mesh(shared.characterRingGeometry, glow, root, 0, 1.4, 0);
        warningRing.rotation.x = Math.PI / 2;
        warningRing.visible = false;
        root.userData.warningRing = warningRing;
        if (level >= 2) {
          root.userData.rankMutation.push("split outer shell");
          mesh(shared.armorPlateGeometry, armor, body, -8, 20, -4).scale.set(0.7, 0.8, 0.7);
          mesh(shared.armorPlateGeometry, armor, body, 8, 20, -4).scale.set(0.7, 0.8, 0.7);
        }
        if (level >= 3) {
          root.userData.rankMutation.push("paired core lobes");
          mesh(shared.burstCoreGeometry, glow, body, -7, 17, 7).scale.setScalar(0.48);
          mesh(shared.burstCoreGeometry, glow, body, 7, 17, 7).scale.setScalar(0.48);
        }
        if (level >= 4) {
          root.userData.rankMutation.push("crown spines");
          addMutation(root, body, level, "crown spine", [0, 29, -1, 0, 0, 0], accent, 1.35);
        }
      } else if (enemy.kind === 6) {
        torso.scale.set(13.8, 14.5, 10.6);
        torso.position.y = 19;
        head.material = armor;
        head.position.set(0, 37, 1);
        head.scale.set(5.1, 5.7, 5);
        root.userData.silhouetteFeatures = ["tower shield", "broad plated frame", "banner standards"];
        addHumanoidLimbs(root, body, main, accent, {
          armSpan: 12, armY: 23, armScale: [1.4, 1.5, 1.4],
          legSpan: 7, legScale: [1.4, 1.2, 1.3], handScale: 1.3, footScale: 1.35,
        });
        const shieldGroup = new THREE.Group();
        shieldGroup.position.set(0, 19, 11);
        body.add(shieldGroup);
        const shield = mesh(shared.bulwarkShieldGeometry, armor, shieldGroup, 0, 0, 0);
        shield.scale.set(1, 1.08, 1);
        root.userData.shadowParts.push(shield);
        const crest = mesh(shared.spikeGeometry, accent, shieldGroup, 0, 6, 4);
        crest.scale.setScalar(0.65);
        root.userData.shield = shieldGroup;
        root.userData.shieldTrim = crest;
        root.userData.mutationParts.push(shield);
        for (const side of [-1, 1]) {
          const standard = new THREE.Group();
          standard.position.set(side * 10, 38, -3);
          body.add(standard);
          mesh(shared.standardGeometry, armor, standard, 0, 6, 0);
          const banner = mesh(shared.standardClothGeometry, accent, standard, side * 3, 4, 0);
          banner.visible = level >= 2;
          root.userData.bannerParts.push(banner);
          root.userData.mutationParts.push(banner);
          if (level >= 3) {
            addMutation(root, body, level, "pauldron spike", [side * 12, 32, -2, 0, 0, side * -0.5], accent, 1.05);
          }
        }
        if (level >= 2) root.userData.rankMutation.push("banner standards");
        if (level >= 4) {
          root.userData.rankMutation.push("fortress shield");
          shield.scale.set(1.35, 1.3, 1.2);
        }
      }
      addRankPips(body, root, level, 45, -6);
      root.userData.hitGlow = mesh(shared.hitFlashGeometry, shared.hitFlash, root, 0, 23, 0);
      root.userData.hitGlow.scale.set(19, 31, 17);
      root.userData.hitGlow.visible = false;
      if (!root.userData.rankMutation.length) root.userData.rankMutation.push("base family form");
      root.userData.baseScale = Math.max(0.72, Math.min(1.9, (enemy.r || 13) / 13));
      scene.add(root);
      return root;
    }

    function createBoss(enemy) {
      const root = new THREE.Group();
      const body = new THREE.Group();
      root.add(body);
      root.userData.body = body;
      root.userData.shadowParts = [];
      root.userData.arms = [];
      root.userData.legs = [];
      root.userData.rankPips = [];
      root.userData.mutationParts = [];
      root.userData.attackParts = [];
      root.userData.characterType = "boss";
      root.userData.familyKind = 3;
      root.userData.bossVariant = enemy.isFinalBoss ? 3 : enemy.variant;
      root.userData.family = enemy.isFinalBoss
        ? "The Last Meme"
        : ["Beau", "Mourning Shade", "Bell Tower"][enemy.variant] || "Guardian";
      const materials = shared.bossMaterials[root.userData.bossVariant] || shared.bossMaterials[0];
      root.userData.materials = [materials.body, materials.trim, materials.dark, materials.glow];
      root.userData.rankMutation = [];
      root.userData.silhouetteFeatures = [];
      root.userData.phasePips = [];
      root.userData.shadow = makeShadow(root, enemy.r * 0.9, 0.35);

      const part = (geometry, material, x, y, z, sx, sy, sz, target = body) => {
        const item = mesh(geometry, material, target, x, y, z);
        item.scale.set(sx, sy, sz);
        root.userData.shadowParts.push(item);
        return item;
      };
      const limb = (x, y, z, sx = 1, sy = 1, sz = 1) => {
        const joint = new THREE.Group();
        joint.position.set(x, y, z);
        body.add(joint);
        const partMesh = mesh(shared.bossLimbGeometry, materials.body, joint, 0, -8, 0);
        partMesh.scale.set(sx, sy, sz);
        root.userData.shadowParts.push(partMesh);
        root.userData.legs.push(joint);
        return joint;
      };

      if (root.userData.bossVariant === 0) {
        root.userData.silhouetteFeatures = ["four-legged hound", "long muzzle", "spiked hunting mantle"];
        part(shared.bossTorsoGeometry, materials.body, 0, 20, -1, 29, 17, 40);
        part(shared.bossTorsoGeometry, materials.dark, 0, 22, -20, 25, 16, 20);
        part(shared.bossHeadGeometry, materials.body, 0, 28, 27, 15, 13, 19);
        part(shared.bossSnoutGeometry, materials.dark, 0, 21, 43, 1, 1.1, 1)
          .rotation.x = Math.PI / 2;
        part(shared.bossTorsoGeometry, materials.trim, 0, 23, 45, 8, 5, 6);
        for (const side of [-1, 1]) {
          part(shared.bossEarGeometry, materials.dark, side * 10, 39, 27, 1, 1.2, 1)
            .rotation.z = side * -0.22;
          part(shared.bossHeadGeometry, materials.glow, side * 6, 31, 41, 1.5, 1.3, 1.2);
          part(shared.bossCrestGeometry, materials.trim, side * 16, 34, 3, 1, 1, 1)
            .rotation.z = side * -0.7;
          limb(side * 18, 17, 22, 1.05, 0.9, 1.05);
          limb(side * 18, 17, -23, 1.15, 1, 1.15);
        }
        part(shared.bossTorsoGeometry, materials.dark, 0, 27, -40, 4, 4, 26)
          .rotation.x = -0.34;
        part(shared.bossCrestGeometry, materials.trim, 0, 38, -57, 1, 1, 1)
          .rotation.x = -Math.PI / 2;
        root.userData.attackParts.push(part(shared.bossHaloGeometry, materials.glow, 0, 2, 0, 1.8, 1.8, 1));
      } else if (root.userData.bossVariant === 1) {
        root.userData.silhouetteFeatures = ["floating spectral cloak", "horned crown", "broad shadow mantle"];
        part(shared.shadeRobeGeometry, materials.dark, 0, 23, 0, 2.6, 2.2, 2.6);
        part(shared.bossHeadGeometry, materials.body, 0, 48, 3, 15, 17, 13);
        part(shared.bossMaskGeometry, materials.dark, 0, 43, 14, 1.15, 1.2, 1);
        for (const side of [-1, 1]) {
          part(shared.bossWingGeometry, materials.body, side * 24, 27, -3, 1.25, 2.1, 1)
            .rotation.z = side * -0.68;
          part(shared.shadeTendrilGeometry, materials.dark, side * 13, 12, -6, 1.8, 2.1, 1.6)
            .rotation.z = side * -0.22;
          part(shared.bossCrestGeometry, materials.trim, side * 10, 62, -1, 1, 1.4, 1)
            .rotation.z = side * -0.65;
          part(shared.bossTorsoGeometry, materials.glow, side * 5, 45, 15, 2.1, 2.8, 1.1);
          limb(side * 18, 30, -1, 0.85, 1.2, 0.8);
        }
        part(shared.bossHaloGeometry, materials.glow, 0, 68, -2, 1.8, 1.8, 1)
          .rotation.x = 0.28;
        root.userData.floatHeight = 11;
        root.userData.halo = body.children.find((item) => item.geometry === shared.bossHaloGeometry);
        root.userData.attackParts.push(root.userData.halo);
      } else if (root.userData.bossVariant === 2) {
        root.userData.silhouetteFeatures = ["tower-shaped clockwork body", "hanging bells", "broad chime arms"];
        part(shared.bossTorsoGeometry, materials.dark, 0, 29, 0, 24, 28, 18);
        part(shared.bossTorsoGeometry, materials.body, 0, 48, 0, 20, 14, 15);
        part(shared.bossBellGeometry, materials.trim, 0, 34, 8, 1.45, 1.25, 1.25);
        part(shared.bossCrestGeometry, materials.trim, 0, 68, 0, 1.45, 1.2, 1.3);
        part(shared.bossHeadGeometry, materials.dark, 0, 53, 12, 8, 9, 6);
        part(shared.bossMaskGeometry, materials.glow, 0, 53, 18, 0.75, 0.48, 0.35);
        for (const side of [-1, 1]) {
          part(shared.bossBellGeometry, materials.body, side * 27, 30, 2, 0.86, 0.9, 0.9);
          part(shared.bossCrestGeometry, materials.trim, side * 27, 42, 2, 0.7, 0.8, 0.7);
          limb(side * 25, 31, 0, 1.1, 1.1, 1.1);
          limb(side * 10, 14, 0, 1.15, 1.05, 1.2);
        }
        const gear = part(shared.bossOrbitGeometry, materials.glow, 0, 28, 0, 1.25, 1.25, 1);
        gear.rotation.x = Math.PI / 2;
        root.userData.halo = gear;
        root.userData.attackParts.push(gear);
      } else {
        root.userData.silhouetteFeatures = ["chaotic jester frame", "split mask", "orbiting reality rings"];
        part(shared.bossTorsoGeometry, materials.body, 0, 27, 0, 22, 27, 17);
        part(shared.bossHeadGeometry, materials.dark, 0, 57, 2, 17, 16, 13);
        part(shared.bossMaskGeometry, materials.trim, 0, 55, 14, 1.45, 1.05, 0.8);
        for (const side of [-1, 1]) {
          part(shared.bossTorsoGeometry, materials.glow, side * 6, 58, 14, 2.4, 2.6, 1);
          part(shared.bossCrestGeometry, materials.trim, side * 11, 72, -2, 1.25, 1.4, 1)
            .rotation.z = side * -0.8;
          part(shared.bossWingGeometry, materials.dark, side * 21, 36, -4, 0.9, 1.55, 0.8)
            .rotation.z = side * -0.45;
          limb(side * 21, 36, 0, 1, 1.1, 0.9);
          limb(side * 10, 13, 0, 1.1, 1.1, 1.1);
        }
        const orbit = part(shared.bossOrbitGeometry, materials.glow, 0, 42, 0, 1.8, 1.8, 1);
        orbit.rotation.x = Math.PI / 2;
        root.userData.halo = orbit;
        root.userData.attackParts.push(orbit);
        const secondOrbit = part(shared.bossOrbitGeometry, materials.trim, 0, 42, 0, 1.45, 1.45, 1);
        secondOrbit.rotation.x = 0.85;
        root.userData.attackParts.push(secondOrbit);
      }

      for (let index = 0; index < 3; index++) {
        const pip = mesh(
          shared.rankPipGeometry,
          shared.rankMaterials[index + 1],
          body,
          (index - 1) * 11,
          root.userData.bossVariant === 2 ? 80 : 78,
          -10,
        );
        pip.scale.setScalar(1.35);
        root.userData.phasePips.push(pip);
      }
      root.userData.hitGlow = mesh(shared.hitFlashGeometry, shared.hitFlash, root, 0, 36, 0);
      root.userData.hitGlow.scale.set(38, 58, 34);
      root.userData.hitGlow.visible = false;
      root.userData.bossPhase = 1;
      root.userData.baseScale = Math.min(2.45, 1.65 + enemy.r * 0.008);
      scene.add(root);
      return root;
    }

    function updateActor(actor, object, state, isPlayer) {
      const x = isPlayer ? state.player.x : object.x;
      const z = isPlayer ? state.player.y : object.y;
      const previous = actor.userData.lastPosition;
      const elapsed = Math.max(0.001, state.time - actor.userData.lastTime);
      const velocityX = isPlayer
        ? state.player.combatVX || 0
        : Number.isFinite(object.combatVX) ? object.combatVX : (x - previous.x) / elapsed;
      const velocityZ = isPlayer
        ? state.player.combatVY || 0
        : Number.isFinite(object.combatVY) ? object.combatVY : (z - previous.z) / elapsed;
      const speed = Math.hypot(velocityX, velocityZ);
      const moving = speed > 8 && (isPlayer ? state.active && !state.paused : true);
      const phase = state.time * (isPlayer ? 10 : 8) + actor.userData.animationOffset;
      const gait = moving ? Math.sin(phase) * 0.56 : Math.sin(state.time * 2.2 + actor.userData.animationOffset) * 0.055;
      const float = actor.userData.floatHeight
        ? Math.sin(state.time * 2.5 + actor.userData.animationOffset) * 1.4
        : 0;
      actor.position.set(x, terrainHeight(x, z) + float, z);
      actor.userData.shadow.position.y = -float - 0.08;
      actor.userData.body.position.y = moving ? Math.abs(Math.sin(phase * 2)) * 1.5 : 0;
      actor.userData.body.rotation.x = actor.userData.baseBodyRotationX
        + (moving ? Math.sin(phase) * 0.035 : 0);
      actor.userData.body.rotation.z = actor.userData.baseBodyRotationZ;

      if (actor.userData.characterType === "boss") {
        const phaseRank = object.isFinalBoss
          ? Math.max(1, object.finalPhase || 1)
          : object.phaseThree ? 3 : object.phaseTwo ? 2 : 1;
        const phaseChanged = phaseRank !== actor.userData.bossPhase;
        actor.userData.bossPhase = phaseRank;
        actor.userData.phasePips.forEach((pip, index) => {
          pip.visible = index < phaseRank;
        });
        const bossMoving = moving || object.chargeActive > 0;
        actor.userData.animationState = object.phaseIntro > 0
          ? "phase-transition"
          : object.chargeWarning > 0
            ? "charge-warning"
            : object.chargeActive > 0
              ? "charge"
              : object.shotWarning > 0
                ? "attack-windup"
              : object.specialWarningUntil > state.time
                ? "signature-warning"
                : object.secondaryVolley
                  ? object.secondaryVolley.mode
                  : object.lateSecondary
                    ? object.lateSecondary.mode
              : object.beauFight?.stage || object.shadeFight?.stage
                || object.bellFight?.stage || object.memeFight?.stage || "idle";
        actor.userData.attackState = actor.userData.animationState;
        actor.userData.phase = phaseRank;
        actor.userData.phaseChanged = phaseChanged;
        actor.userData.moving = bossMoving;
        actor.userData.gaitPhase = Number((phase % (Math.PI * 2)).toFixed(3));
        actor.userData.hitGlow.visible = object.hit > 0;
        actor.rotation.y = object.chargeActive > 0
          ? Math.atan2(object.chargeY || 0, object.chargeX || 1)
          : speed > 8 ? Math.atan2(velocityX, velocityZ) : Math.atan2(
            state.player.x - x, state.player.y - z,
          );
        const introPulse = object.phaseIntro > 0
          ? 1 + Math.sin(state.time * 17) * 0.045
          : 1;
        const bob = bossMoving ? Math.abs(Math.sin(phase * 2)) * 2.2 : 0;
        actor.userData.body.position.y = bob;
        actor.userData.body.rotation.z = object.chargeWarning > 0
          ? -0.12
          : object.chargeActive > 0
            ? 0.11
            : object.shotWarning > 0 && actor.userData.bossVariant !== 0
              ? -0.08
            : actor.userData.baseBodyRotationZ + (bossMoving ? Math.sin(phase) * 0.04 : 0);
        actor.scale.setScalar(actor.userData.baseScale * introPulse);
        if (actor.userData.halo) {
          actor.userData.halo.rotation.y += object.isFinalBoss ? 0.035 : 0.018;
          actor.userData.halo.rotation.z += 0.012 * phaseRank;
        }
        actor.userData.attackParts.forEach((part, index) => {
          part.rotation.y += (index % 2 ? -1 : 1) * (0.012 + phaseRank * 0.004);
        });
        actor.userData.arms.forEach((arm, index) => {
          arm.rotation.x = object.chargeWarning > 0
            ? -0.55
            : bossMoving ? Math.sin(phase + index) * 0.28 : 0;
        });
        actor.userData.legs.forEach((leg, index) => {
          leg.rotation.x = object.shotWarning > 0 && actor.userData.bossVariant !== 0 && index < 2
            ? -0.62
            : bossMoving ? Math.sin(phase + index * 1.4) * 0.45 : 0;
        });
        actor.userData.hpBar.visible = true;
        const hpRatio = object.maxHp > 0 && Number.isFinite(object.maxHp)
          ? object.hp / object.maxHp : 1;
        actor.userData.hpFill.scale.x = Math.max(0.02, Math.min(1, hpRatio));
        actor.userData.lastPosition.set(x, z);
        actor.userData.lastTime = state.time;
        return;
      } else if (isPlayer) {
        const facing = state.player.facingX || 0;
        const facingY = state.player.facingY || 0;
        actor.rotation.y = Math.atan2(facing, facingY);
        actor.userData.dashTrail.visible = state.dashTimer > 0;
        actor.userData.dashTrail.rotation.y =
          Math.atan2(state.dashDirectionX, state.dashDirectionY) - actor.rotation.y;
        actor.scale.set(
          state.dashTimer > 0 ? 1.7 : 1.55,
          state.dashTimer > 0 ? 1.2 : 1.55,
          state.dashTimer > 0 ? 1.55 : 1.55,
        );
        actor.userData.hitGlow.visible = state.damageFlash > 0;
        actor.userData.attackState = state.dashTimer > 0 ? "dash" : "idle";
      } else {
        const towardPlayerX = state.player.x - x;
        const towardPlayerZ = state.player.y - z;
        actor.rotation.y = object.kind === 6 && Number.isFinite(object.shieldFacing)
          ? Math.PI / 2 - object.shieldFacing
          : speed > 8
            ? Math.atan2(velocityX, velocityZ)
            : Math.atan2(towardPlayerX, towardPlayerZ);
        actor.scale.setScalar(actor.userData.baseScale);
        actor.userData.hitGlow.visible = object.hit > 0;
        actor.userData.hpBar.visible = object.hp < object.maxHp;
        const hpRatio = object.maxHp > 0 && Number.isFinite(object.maxHp)
          ? object.hp / object.maxHp : 1;
        actor.userData.hpFill.scale.x = Math.max(0.02, Math.min(1, hpRatio));

        const attackState = object.kind === 1 && object.feintTime > 0
          ? "feint"
          : object.kind === 2 && object.stompWarning > 0
            ? "stomp-warning"
            : object.kind === 4 && object.shotWarning > 0
              ? "shot-warning"
              : object.kind === 5 && object.armed && object.burstWarning > 0
                ? "burst-warning"
                : object.kind === 5 && object.armed
                  ? "armed"
                  : object.kind === 6 && object.shieldActive
                    ? "shield-guard"
                    : "idle";
        actor.userData.attackState = attackState;
        if (actor.userData.stompRing) {
          actor.userData.stompRing.visible = object.stompWarning > 0;
        }
        if (actor.userData.stompRing?.visible) {
          actor.userData.stompRing.scale.setScalar(Math.max(0.5, (object.stompRadius || 149) / 11));
        }
        if (actor.userData.warningRing) {
          actor.userData.warningRing.visible = Boolean(object.armed && object.burstWarning > 0);
        }
        if (actor.userData.warningRing?.visible) {
          actor.userData.warningRing.scale.setScalar(Math.max(0.5, (object.burstRadius || 99) / 11));
        }
        if (object.kind === 1 && object.feintTime > 0) {
          actor.userData.body.rotation.z = Math.sign(object.feintDirection || 1) * 0.22;
        } else if (object.kind === 2 && object.stompWarning > 0) {
          actor.userData.arms[0].rotation.x = -1.05;
          actor.userData.arms[1].rotation.x = -1.05;
        } else if (object.kind === 4 && object.shotWarning > 0) {
          actor.userData.arms[0].rotation.x = -0.5;
          actor.userData.arms[1].rotation.x = -0.5;
        } else if (object.kind === 6 && actor.userData.shield) {
          actor.userData.shield.scale.setScalar(object.shieldActive ? 1.08 : 1);
        }
        if (actor.userData.core) {
          const pulse = object.armed ? 1 + Math.sin(state.time * 16) * 0.16 : 1;
          actor.userData.core.scale.set(0.9 * pulse, 0.9 * pulse, 0.65 * pulse);
        }
      }
      actor.userData.arms.forEach((arm, index) => {
        const warningPose = !isPlayer && (
          (object.kind === 2 && object.stompWarning > 0)
          || (object.kind === 4 && object.shotWarning > 0)
        );
        if (!warningPose) arm.rotation.x = gait * (index ? -1 : 1);
        if (!isPlayer && object.kind === 1 && object.feintTime > 0) {
          arm.rotation.z = (index ? -1 : 1) * 0.35;
        } else {
          arm.rotation.z = 0;
        }
      });
      actor.userData.legs.forEach((leg, index) => {
        leg.rotation.x = gait * (index ? -1 : 1);
      });
      if (!isPlayer && actor.userData.shield) {
        actor.userData.shield.scale.setScalar(object.shieldActive ? 1.08 : 1);
      }
      if (!isPlayer && actor.userData.halo) {
        actor.userData.halo.rotation.z = Math.sin(state.time * 1.2) * 0.12;
      }
      actor.userData.animationState = moving
        ? isPlayer && state.dashTimer > 0 ? "dash" : "move"
        : actor.userData.floatHeight ? "float" : "idle";
      actor.userData.moving = moving;
      actor.userData.gaitPhase = Number((phase % (Math.PI * 2)).toFixed(3));
      actor.userData.lastPosition.set(x, z);
      actor.userData.lastTime = state.time;
    }

    function makeActorEntry(object, state, isPlayer = false) {
      const root = isPlayer
        ? createPlayer()
        : object.kind === 3 ? createBoss(object) : createEnemyFamily(object);
      root.name = root.userData.family || root.userData.characterType || "actor";
      markRenderQaObject(
        root,
        root.userData.characterType || "actor",
        root.name,
        state.time,
      );
      if (!isPlayer) {
        const hpY = root.userData.characterType === "boss" ? 92 : 48;
        const hpBack = mesh(shared.hpBackGeometry, shared.hpBack, root.userData.body, 0, hpY, 0);
        hpBack.rotation.x = -0.48;
        const hpFill = mesh(shared.hpFillGeometry, shared.hpFill, root.userData.body, 0, hpY + 0.2, 0.7);
        hpFill.rotation.x = -0.48;
        root.userData.hpBar = hpBack;
        root.userData.hpFill = hpFill;
      }
      root.traverse((item) => {
        if (!item.isMesh) return;
        item.castShadow = false;
        item.receiveShadow = false;
      });
      root.userData.shadowParts.forEach((item) => {
        item.castShadow = true;
        item.receiveShadow = true;
      });
      root.userData.baseBodyRotationX = root.userData.body.rotation.x;
      root.userData.baseBodyRotationZ = root.userData.body.rotation.z;
      root.userData.lastPosition = new THREE.Vector2(object.x || 0, object.y || 0);
      root.userData.lastTime = 0;
      root.userData.animationOffset = (object.x || 0) * 0.017 + (object.y || 0) * 0.011;
      root.traverse((item) => {
        if (item.isMesh) root.userData.meshCount = (root.userData.meshCount || 0) + 1;
      });
      return root;
    }

    function syncActors(state) {
      const activeActors = new Set();
      if (state.player) {
        const actor = state.player;
        activeActors.add(actor);
        if (!actors.has(actor)) actors.set(actor, makeActorEntry(actor, state, true));
        updateActor(actors.get(actor), actor, state, true);
      }
      for (const enemy of state.enemies) {
        const dx = enemy.x - (state.player?.x || 0);
        const dz = enemy.y - (state.player?.y || 0);
        if (dx * dx + dz * dz > 1050 * 1050) continue;
        activeActors.add(enemy);
        if (!actors.has(enemy)) actors.set(enemy, makeActorEntry(enemy, state));
        updateActor(actors.get(enemy), enemy, state, false);
      }
      for (const [object, actor] of actors) {
        if (!activeActors.has(object)) {
          if (object.dead && !Number.isFinite(actor.userData.deathUntil)) {
            actor.userData.deathUntil = state.time + 0.32;
            actor.userData.deathScale = actor.scale.x;
            actor.userData.hitGlow.visible = true;
            actor.userData.hpBar && (actor.userData.hpBar.visible = false);
          }
          if (Number.isFinite(actor.userData.deathUntil) && state.time < actor.userData.deathUntil) {
            const progress = 1 - (actor.userData.deathUntil - state.time) / 0.32;
            actor.scale.setScalar(actor.userData.deathScale * Math.max(0.1, 1 - progress * 0.9));
            actor.rotation.z = progress * 0.7;
            activeActors.add(object);
            continue;
          }
          scene.remove(actor);
          actors.delete(object);
        }
      }
    }

    function projectileMaterial(type) {
      if (type === "bomb" || type === "fireball" || type === "flame" || type === "fish") return shared.projectileMaterials.fire;
      if (type === "waterBolt" || type === "tidalWave") return shared.projectileMaterials.water;
      if (type === "iceShards" || type === "frost") return shared.projectileMaterials.frost;
      return shared.projectileMaterials.arcane;
    }

    function makeProjectile(object, time, isEnemy = false) {
      const material = isEnemy
        ? shared.projectileMaterials.enemy
        : object.fuse !== undefined ? shared.projectileMaterials.fire : projectileMaterial(object.type);
      let group = projectilePool.pop();
      if (!group) {
        group = new THREE.Group();
        const core = mesh(shared.projectileGeometry, material, group);
        const ring = mesh(shared.projectileRingGeometry, material, group, 0, 0, 0);
        ring.rotation.x = Math.PI / 2;
        group.userData.shadow = makeShadow(group, (object.r || 4) * 0.6, 0.18);
        group.userData.core = core;
        group.userData.ring = ring;
        scene.add(group);
      } else {
        group.userData.core.material = material;
        group.userData.ring.material = material;
        group.visible = true;
        scene.add(group);
      }
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      const core = group.userData.core;
      core.position.set(0, 0, 0);
      core.rotation.set(0, 0, 0);
      const radius = Math.max(0.75, Math.min(2.8, (object.r || 4) / 3.8));
      core.scale.setScalar(radius);
      const ring = group.userData.ring;
      ring.position.set(0, 0, 0);
      ring.rotation.set(Math.PI / 2, 0, 0);
      ring.scale.setScalar(radius);
      const shadow = group.userData.shadow;
      shadow.position.set(0, -0.08, 0);
      shadow.rotation.set(-Math.PI / 2, 0, 0);
      const shadowRadius = (object.r || 4) * 0.6;
      shadow.scale.set(shadowRadius, shadowRadius * 0.68, 1);
      const name = isEnemy ? "enemy-projectile" : object.type || "projectile";
      group.name = name;
      markRenderQaObject(group, "projectile", name, time);
      return group;
    }

    function syncProjectiles(state) {
      const activeProjectiles = new Set();
      for (const shot of renderQaIsolation.projectiles ? [
        ...state.bullets,
        ...state.elementalShots,
        ...state.enemyShots,
        ...state.bossShots,
        ...state.bombs,
      ] : []) {
        if (state.player) {
          const dx = shot.x - state.player.x;
          const dz = shot.y - state.player.y;
          if (dx * dx + dz * dz > 1150 * 1150) continue;
        }
        activeProjectiles.add(shot);
        if (!projectiles.has(shot)) {
          const enemyShot = state.enemyShots.includes(shot) || state.bossShots.includes(shot);
          projectiles.set(shot, makeProjectile(shot, state.time, enemyShot));
        }
        const meshGroup = projectiles.get(shot);
        meshGroup.position.set(
          shot.x,
          terrainHeight(shot.x, shot.y) + 3.2 + Math.sin(state.time * 9 + shot.x) * 0.7,
          shot.y,
        );
        meshGroup.rotation.z += 0.035;
        meshGroup.userData.ring.rotation.y += 0.04;
      }
      for (const [object, meshGroup] of projectiles) {
        if (!activeProjectiles.has(object)) {
          scene.remove(meshGroup);
          meshGroup.visible = false;
          releaseRenderQaObject(meshGroup, state.time);
          projectiles.delete(object);
          projectilePool.push(meshGroup);
        }
      }
    }

    function makeCombatEffect() {
      const group = new THREE.Group();
      const surface = mesh(shared.telegraphCircleGeometry, shared.telegraphMaterials.arcane, group);
      const outline = mesh(shared.telegraphRingGeometry, shared.telegraphMaterials.arcane, group);
      surface.rotation.x = -Math.PI / 2;
      outline.rotation.x = -Math.PI / 2;
      surface.position.y = 0.12;
      outline.position.y = 0.35;
      surface.renderOrder = 3;
      outline.renderOrder = 4;
      group.userData.surface = surface;
      group.userData.outline = outline;
      group.visible = false;
      return group;
    }

    function syncCombatEffect(owner, suffix, config, activeKeys) {
      if (!owner || !config || (!(config.radius > 0) && !(config.length > 0))) return;
      let id = combatEffectIds.get(owner);
      if (!id) {
        id = nextCombatEffectId++;
        combatEffectIds.set(owner, id);
      }
      const key = `${id}:${suffix}`;
      activeKeys.add(key);
      let effect = combatEffects.get(key);
      if (!effect) {
        effect = combatEffectPool.pop() || makeCombatEffect();
        combatEffects.set(key, effect);
        scene.add(effect);
        const name = `${owner.constructor?.name || "effect"}:${suffix}`;
        effect.name = name;
        markRenderQaObject(effect, "combat-effect", name, renderTime);
      }
      effect.visible = true;
      effect.userData.effectType = suffix;
      const { surface, outline } = effect.userData;
      const material = shared.telegraphMaterials[config.material] || shared.telegraphMaterials.arcane;
      surface.material = material;
      outline.material = material;
      const isLine = config.shape === "line";
      const isFan = config.shape === "fan";
      const isArc = config.shape === "arc";
      const geometry = isLine
        ? shared.telegraphBoxGeometry
        : isFan ? fanGeometry(config.halfAngle)
          : isArc ? shared.telegraphArcGeometry : shared.telegraphCircleGeometry;
      const outlineGeometry = isLine
        ? shared.telegraphBoxGeometry
        : isFan || isArc ? shared.telegraphArcGeometry : shared.telegraphRingGeometry;
      if (surface.geometry !== geometry) surface.geometry = geometry;
      if (outline.geometry !== outlineGeometry) outline.geometry = outlineGeometry;
      const x = config.x || 0;
      const z = config.y || 0;
      effect.position.set(x, terrainHeight(x, z) + (config.height || 0.8), z);
      effect.rotation.set(
        0,
        isLine || isFan || isArc ? -config.angle : 0,
        0,
      );
      if (isLine) {
        surface.scale.set(config.length || config.radius, 1.4, config.width || 5);
        outline.scale.set(config.length || config.radius, 2.2, (config.width || 5) * 1.8);
      } else {
        surface.scale.set(config.radius, config.radius, config.radius);
        outline.scale.set(config.radius, config.radius, config.radius);
      }
      if (isFan || isArc) {
        surface.rotation.x = -Math.PI / 2;
        outline.rotation.x = -Math.PI / 2;
        outline.scale.set(config.radius, config.radius, 1);
      } else if (isLine) {
        surface.rotation.set(0, 0, 0);
        outline.rotation.set(0, 0, 0);
      } else {
        surface.rotation.set(-Math.PI / 2, 0, 0);
        outline.rotation.set(-Math.PI / 2, 0, 0);
      }
      surface.visible = config.fill !== false && !isArc;
      outline.visible = config.outline !== false;
    }

    function syncCombatEffects(state) {
      const activeKeys = new Set();
      activeCombatEffectCount = 0;
      renderTime = state.time;
      if (!renderQaIsolation.combatEffects) {
        for (const [key, effect] of combatEffects) {
          scene.remove(effect);
          effect.visible = false;
          releaseRenderQaObject(effect, state.time);
          combatEffects.delete(key);
          combatEffectPool.push(effect);
        }
        return;
      }
      for (const enemy of state.enemies) {
        if (enemy.chargeWarning > 0) {
          syncCombatEffect(enemy, "charge", {
            shape: "line",
            x: enemy.x + (enemy.chargeX || 0) * 260,
            y: enemy.y + (enemy.chargeY || 0) * 260,
            angle: Math.atan2(enemy.chargeY || 0, enemy.chargeX || 1),
            length: 520, width: 7, material: "charge", opacity: 0.68,
          }, activeKeys);
        }
        if (enemy.shotWarning > 0 && !enemy.secondaryVolley && !enemy.lateSecondary) {
          const angle = enemy.shotAngle || enemy.aimAngle
            || Math.atan2((state.player?.y || 0) - enemy.y, (state.player?.x || 0) - enemy.x);
          const isBoss = enemy.kind === 3;
          const finalTarget = isBoss && enemy.isFinalBoss && enemy.shotPattern === 2;
          if (!isBoss) {
            const length = 290;
            syncCombatEffect(enemy, "shot", {
              shape: "line",
              x: enemy.x + Math.cos(angle) * length / 2,
              y: enemy.y + Math.sin(angle) * length / 2,
              angle, length, width: 5, material: "charge",
            }, activeKeys);
          } else {
            const phase = enemy.isFinalBoss
              ? Math.max(1, enemy.finalPhase || 1)
              : enemy.phaseThree ? 3 : enemy.phaseTwo ? 2 : 1;
            const finalArc = enemy.isFinalBoss && enemy.shotPattern === 1;
            const shadeArc = !enemy.isFinalBoss && enemy.variant === 1;
            const finalTargetRadius = 104 + phase * 12;
            const radius = finalTarget
              ? finalTargetRadius
              : enemy.isFinalBoss ? 295 : enemy.variant === 2 ? 285 : 270;
            const coneHalfAngle = enemy.variant === 2
              ? phase === 3 ? 0.77 : phase === 2 ? 0.65 : 0.46
              : phase === 3 ? 0.7 : phase === 2 ? 0.55 : 0.38;
            syncCombatEffect(enemy, "shot", {
              shape: finalTarget ? "circle" : finalArc || shadeArc ? "arc" : "fan",
              x: finalTarget ? enemy.warningX : enemy.x,
              y: finalTarget ? enemy.warningY : enemy.y,
              angle: finalArc || shadeArc ? angle + Math.PI * 0.72 : angle,
              halfAngle: enemy.isFinalBoss ? 0.86 : coneHalfAngle,
              radius: finalTarget ? finalTargetRadius : finalArc ? 185 : shadeArc ? 160 : radius,
              fill: !finalArc && !shadeArc,
              material: "boss",
            }, activeKeys);
            const ray = (suffix, rayAngle, length) => {
              syncCombatEffect(enemy, suffix, {
                shape: "line",
                x: enemy.x + Math.cos(rayAngle) * length / 2,
                y: enemy.y + Math.sin(rayAngle) * length / 2,
                angle: rayAngle, length, width: 5, material: "boss",
              }, activeKeys);
            };
            const offsets = shadeArc
              ? phase > 1 ? [-0.16, 0, 0.16] : [0]
              : finalArc ? [0] : [];
            offsets.forEach((offset, index) => ray(`shot-ray-${index}`, angle + offset, finalArc ? 340 : 370));
          }
        }
        if (enemy.secondaryVolley && enemy.shotWarning > 0) {
          const markers = window.guardianSecondaryDangerPoints?.(enemy) || [];
          markers.forEach((marker, index) => {
            syncCombatEffect(enemy, `secondary-${index}`, {
              x: marker.x, y: marker.y, radius: marker.r,
              fill: false, material: enemy.variant === 0 ? "charge" : "boss",
            }, activeKeys);
          });
        }
        if (enemy.lateSecondary && enemy.shotWarning > 0) {
          const markers = window.guardianLateSecondaryDanger?.(enemy) || [];
          markers.forEach((marker, index) => {
            syncCombatEffect(enemy, `late-secondary-${index}`, {
              x: marker.x, y: marker.y, radius: marker.r,
              fill: false, material: enemy.isFinalBoss ? "boss" : "charge",
            }, activeKeys);
          });
        }
        if (enemy.specialWarningUntil > state.time) {
          const aim = enemy.specialAim || 0;
          const fx = Math.cos(aim);
          const fy = Math.sin(aim);
          const sx = -fy;
          const sy = fx;
          const tx = enemy.specialTargetX;
          const ty = enemy.specialTargetY;
          const phase = enemy.specialTelegraphSize || 1;
          const mark = (suffix, x, y, radius) => syncCombatEffect(enemy, suffix, {
            x, y, radius, fill: false, material: "boss",
          }, activeKeys);
          const ray = (suffix, angle, length = 380) => syncCombatEffect(enemy, suffix, {
            shape: "line",
            x: enemy.x + Math.cos(angle) * length / 2,
            y: enemy.y + Math.sin(angle) * length / 2,
            angle, length,
            width: 5, material: "boss",
          }, activeKeys);
          if (enemy.variant === 0 && !enemy.isFinalBoss) {
            for (const [index, offset] of [-90, 0, 90].entries()) {
              mark(`special-${index}`, tx + sx * offset, ty + sy * offset, phase === 3 ? 97 : 86);
            }
            for (const [index, offset] of [-0.16, 0, 0.16].entries()) {
              ray(`special-ray-${index}`, aim + offset);
            }
          } else if (enemy.variant === 1 && !enemy.isFinalBoss) {
            syncCombatEffect(enemy, "special-ring", {
              shape: "arc", x: enemy.x, y: enemy.y,
              angle: aim + Math.PI * 0.72, radius: 190,
              fill: false, material: "boss",
            }, activeKeys);
            for (const [index, offset] of [-0.16, 0, 0.16].entries()) {
              ray(`special-ray-${index}`, aim + offset);
            }
          } else if (enemy.variant === 2 && !enemy.isFinalBoss) {
            for (const [index, offset] of [-0.6, -0.38, -0.19, 0, 0.19, 0.38, 0.6].entries()) {
              ray(`special-ray-${index}`, aim + offset);
            }
            mark("special-target", tx, ty, phase === 3 ? 105 : 92);
          } else {
            mark("special-target", tx, ty, phase === 3 ? 113 : 101);
            for (const [index, [forward, side]] of [[155, 145], [155, -145], [-155, 145], [-155, -145]].entries()) {
              mark(
                `special-${index}`,
                tx + fx * forward + sx * side,
                ty + fy * forward + sy * side,
                phase === 3 ? 90 : 77,
              );
            }
          }
        } else if (enemy.specialRecoveryUntil > state.time && enemy.kind === 3) {
          syncCombatEffect(enemy, "special-recovery", {
            x: enemy.x, y: enemy.y, radius: enemy.r * 1.34,
            fill: false, material: "safe",
          }, activeKeys);
        }
        if (enemy.phaseIntro > 0 && enemy.kind === 3) {
          syncCombatEffect(enemy, "phase", {
            x: enemy.x, y: enemy.y, radius: enemy.r * 1.5,
            fill: false, material: "boss", opacity: 0.82,
          }, activeKeys);
        }
        if (enemy.kind === 5 && enemy.armed && enemy.burstWarning > 0) {
          syncCombatEffect(enemy, "burst-warning", {
            x: enemy.x, y: enemy.y, radius: enemy.burstRadius || 86,
            material: "fire", opacity: 0.35,
          }, activeKeys);
        }
        if (enemy.kind === 2 && enemy.stompWarning > 0) {
          syncCombatEffect(enemy, "stomp-warning", {
            x: enemy.x, y: enemy.y, radius: enemy.stompRadius || 149,
            material: "boss", opacity: 0.28,
          }, activeKeys);
        }
        if (enemy.eliteChargeWarning > 0) {
          syncCombatEffect(enemy, "elite-charge", {
            shape: "line",
            x: enemy.x + (enemy.eliteChargeX || 1) * 145,
            y: enemy.y + (enemy.eliteChargeY || 0) * 145,
            angle: Math.atan2(enemy.eliteChargeY || 0, enemy.eliteChargeX || 1),
            length: 290, width: 5, material: "charge", opacity: 0.48,
          }, activeKeys);
        }
      }
      for (const hazard of state.bossHazards) {
        syncCombatEffect(hazard, "boss-hazard", {
          x: hazard.x, y: hazard.y, radius: hazard.radius,
          material: hazard.warning > 0 ? "boss" : "hazard",
          opacity: hazard.warning > 0 ? 0.3 : 0.56,
        }, activeKeys);
      }
      for (const area of state.elementalAreas) {
        if (area.delay > 0) continue;
        const progress = area.maxRadius
          ? Math.min(1, area.radius / area.maxRadius)
          : 1;
        syncCombatEffect(area, "elemental-area", {
          shape: area.type === "tidalWave" ? "fan" : "circle",
          x: area.x, y: area.y, angle: area.angle || 0,
          radius: Math.max(12, area.radius || (area.maxRadius || 80) * progress),
          material: area.type === "fire" ? "fire"
            : area.type === "water" || area.type === "tidalWave" || area.type === "whirlpool"
              ? "water" : area.type === "frost" || area.type === "frostEcho"
                ? "frost" : "arcane",
          opacity: 0.24,
        }, activeKeys);
      }
      for (const zone of state.frostZones) {
        syncCombatEffect(zone, "frost-zone", {
          x: zone.x, y: zone.y, radius: zone.radius,
          material: "frost", opacity: 0.3,
        }, activeKeys);
      }
      for (const burst of state.flameBursts) {
        syncCombatEffect(burst, "flame-burst", {
          shape: "fan", x: burst.x, y: burst.y,
          angle: burst.angle || 0, radius: burst.radius,
          material: "fire", opacity: 0.34,
        }, activeKeys);
      }
      for (const segment of state.lightningSegments) {
        const dx = segment.x2 - segment.x1;
        const dz = segment.y2 - segment.y1;
        syncCombatEffect(segment, "lightning", {
          shape: "line", x: (segment.x1 + segment.x2) / 2,
          y: (segment.y1 + segment.y2) / 2,
          angle: Math.atan2(dz, dx), length: Math.hypot(dx, dz),
          width: segment.evolved ? 8 : 6, material: "arcane",
          opacity: Math.min(0.9, segment.life / 0.24),
        }, activeKeys);
      }
      for (const explosion of state.explosions) {
        const progress = 1 - explosion.life / explosion.maxLife;
        syncCombatEffect(explosion, "explosion", {
          x: explosion.x, y: explosion.y,
          radius: Math.max(2, explosion.radius * progress),
          material: explosion.evolved ? "arcane" : "fire",
          opacity: Math.max(0.08, 0.42 * (1 - progress)),
        }, activeKeys);
      }
      for (const aftershock of state.bombAftershocks) {
        if (aftershock.delay > 0) continue;
        syncCombatEffect(aftershock, "aftershock", {
          x: aftershock.x, y: aftershock.y, radius: aftershock.radius,
          material: "arcane", opacity: 0.34,
        }, activeKeys);
      }
      for (const bomb of state.bombs) {
        syncCombatEffect(bomb, "bomb-warning", {
          x: bomb.x, y: bomb.y, radius: bomb.radius,
          material: "fire", opacity: 0.14,
        }, activeKeys);
      }
      for (const key of combatEffects.keys()) {
        if (activeKeys.has(key)) {
          activeCombatEffectCount++;
          continue;
        }
        const effect = combatEffects.get(key);
        scene.remove(effect);
        effect.visible = false;
        releaseRenderQaObject(effect, state.time);
        combatEffects.delete(key);
        combatEffectPool.push(effect);
      }
    }

    function syncGems(state) {
      const activeGems = new Set();
      for (const gem of state.gems) {
        if (state.player) {
          const dx = gem.x - state.player.x;
          const dz = gem.y - state.player.y;
          if (dx * dx + dz * dz > 1000 * 1000) continue;
        }
        activeGems.add(gem);
        if (!gems.has(gem)) {
          const material = gem.kind === "health"
            ? shared.gemMaterials.health : shared.gemMaterials.xp;
          let crystal = gemPool.pop();
          if (crystal) {
            crystal.material = material;
            crystal.visible = true;
            scene.add(crystal);
          } else {
            crystal = mesh(shared.crystalGeometry, material, scene);
          }
          crystal.name = gem.kind === "health" ? "health-gem" : "xp-gem";
          crystal.position.set(0, 0, 0);
          crystal.rotation.set(0, 0, 0);
          crystal.scale.set(1, 1, 1);
          markRenderQaObject(crystal, "gem", crystal.name, state.time);
          crystal.castShadow = true;
          gems.set(gem, crystal);
        }
        const crystal = gems.get(gem);
        crystal.position.set(
          gem.x,
          terrainHeight(gem.x, gem.y) + 5 + Math.sin(state.time * 3 + gem.x) * 1.5,
          gem.y,
        );
        crystal.rotation.y += 0.035;
      }
      for (const [object, crystal] of gems) {
        if (!activeGems.has(object)) {
          scene.remove(crystal);
          crystal.visible = false;
          releaseRenderQaObject(crystal, state.time);
          gems.delete(object);
          gemPool.push(crystal);
        }
      }
    }

    function syncOrbitBlades(state) {
      const positions = state.bladePositions;
      const bladeCount = Math.floor(positions.length / 2);
      while (orbitBlades.length < bladeCount) {
        const blade = mesh(shared.orbitBladeGeometry, shared.playerTrim, scene);
        blade.castShadow = false;
        blade.receiveShadow = false;
        orbitBlades.push(blade);
      }
      for (let index = 0; index < orbitBlades.length; index++) {
        const blade = orbitBlades[index];
        blade.visible = index < bladeCount;
        if (index >= bladeCount) continue;
        const x = positions[index * 2];
        const z = positions[index * 2 + 1];
        blade.position.set(x, terrainHeight(x, z) + 10, z);
        blade.rotation.y = state.time * 2.4 + index * 0.7;
      }
    }

    function collectRenderQaObjects(state) {
      const entries = [];
      const knownSceneRoots = new Set();
      const suspects = [];
      const finiteArray = (values) => values.map((value) => (
        Number.isFinite(value) ? Number(value.toFixed(3)) : String(value)
      ));
      const isVisibleInHierarchy = (object) => {
        for (let item = object; item; item = item.parent) {
          if (!item.visible) return false;
        }
        return true;
      };
      const record = (object, category, active, sourceState = null) => {
        knownSceneRoots.add(object);
        object.updateWorldMatrix(true, false);
        const worldPosition = object.getWorldPosition(new THREE.Vector3());
        const worldScale = object.getWorldScale(new THREE.Vector3());
        const worldRotation = new THREE.Euler().setFromQuaternion(
          object.getWorldQuaternion(new THREE.Quaternion()),
        );
        const bounds = new THREE.Box3().setFromObject(object);
        const boundsSize = bounds.getSize(new THREE.Vector3());
        const data = object.userData;
        const lifetimeSeconds = active
          ? Math.max(0, state.time - (data.qaActivatedAt ?? state.time))
          : data.qaLastActiveDuration ?? 0;
        const entry = {
          name: data.qaName || object.name || object.type,
          type: category,
          objectType: object.type,
          localScale: finiteArray(object.scale.toArray()),
          baseScale: Number.isFinite(object.userData.baseScale)
            ? Number(object.userData.baseScale.toFixed(3)) : null,
          sourceState: sourceState ? {
            kind: sourceState.kind ?? null,
            radius: sourceState.r ?? null,
            x: sourceState.x ?? null,
            y: sourceState.y ?? null,
            dead: !!sourceState.dead,
            elite: !!sourceState.elite,
            evolutionLevel: sourceState.evolutionLevel ?? null,
          } : null,
          parent: object.parent
            ? object.parent === scene ? "Scene" : object.parent.name || object.parent.type
            : null,
          worldPosition: finiteArray(worldPosition.toArray()),
          worldScale: finiteArray(worldScale.toArray()),
          worldRotation: finiteArray([worldRotation.x, worldRotation.y, worldRotation.z]),
          boundingBox: {
            min: finiteArray(bounds.min.toArray()),
            max: finiteArray(bounds.max.toArray()),
            size: finiteArray(boundsSize.toArray()),
          },
          activationTransform: data.qaActivationTransform || null,
          lastPoolTransform: data.qaLastPoolTransform || null,
          visible: isVisibleInHierarchy(object),
          active,
          lifetimeSeconds: Number(lifetimeSeconds.toFixed(3)),
          ageSeconds: Number(Math.max(0, state.time - (data.qaCreatedAt ?? state.time)).toFixed(3)),
          lifetimeMs: Number((active
            ? Math.max(0, performance.now() - (data.qaActivatedAtMs ?? performance.now()))
            : data.qaLastActiveDurationMs ?? 0).toFixed(1)),
          ageMs: Number(Math.max(0, performance.now() - (data.qaCreatedAtMs ?? performance.now())).toFixed(1)),
          reuseCount: data.qaReuseCount || 0,
        };
        const numbers = [
          ...worldPosition.toArray(),
          ...worldScale.toArray(),
          worldRotation.x, worldRotation.y, worldRotation.z,
          ...bounds.min.toArray(), ...bounds.max.toArray(), ...boundsSize.toArray(),
        ];
        const reasons = [];
        if (numbers.some((value) => !Number.isFinite(value))) reasons.push("non-finite-transform-or-bounds");
        if (Math.max(...worldPosition.toArray().map(Math.abs)) > 100000) reasons.push("extreme-world-position");
        if (Math.max(...worldScale.toArray().map(Math.abs)) > 8) reasons.push("extreme-world-scale");
        if (Math.max(...boundsSize.toArray()) > 500) reasons.push("oversized-bounding-box");
        if (active && ["projectile", "combat-effect", "gem"].includes(category)
          && lifetimeSeconds > 30) reasons.push("transient-object-active-over-30s");
        if (active && object.parent !== scene) reasons.push("active-object-not-parented-to-scene");
        if (!active && (object.parent || object.visible)) reasons.push("inactive-pooled-object-still-attached-or-visible");
        if (reasons.length) suspects.push({ ...entry, reasons });
        if (entries.length < 500) entries.push(entry);
      };

      for (const [sourceState, actor] of actors) record(actor, "actor", true, sourceState);
      for (const cell of terrain.values()) record(cell, "world-decoration", true);
      for (const meshGroup of projectiles.values()) record(meshGroup, "projectile", true);
      for (const meshGroup of projectilePool) record(meshGroup, "projectile", false);
      for (const effect of combatEffects.values()) record(effect, "combat-effect", true);
      for (const effect of combatEffectPool) record(effect, "combat-effect", false);
      for (const crystal of gems.values()) record(crystal, "gem", true);
      for (const crystal of gemPool) record(crystal, "gem", false);
      for (const blade of orbitBlades) {
        if (blade.visible) record(blade, "orbit-blade", true);
      }

      for (const object of scene.children) {
        if (knownSceneRoots.has(object) || object.userData.isWorldCell || object.isLight
          || !(object.isMesh || object.isGroup)) continue;
        object.userData.qaCategory = "untracked";
        object.userData.qaName ||= object.name || object.type;
        record(object, "untracked", true);
        suspects.push({
          name: object.userData.qaName,
          type: "untracked",
          reasons: ["untracked-scene-root"],
        });
      }

      return {
        scanned: entries.length,
        truncated: Math.max(0, actors.size + projectiles.size + projectilePool.length
          + combatEffects.size + combatEffectPool.length + gems.size + gemPool.length
          + orbitBlades.filter((blade) => blade.visible).length - entries.length),
        objects: entries,
        suspects: suspects.slice(0, 100),
        suspectCount: suspects.length,
      };
    }

    function resize() {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(viewport.width, viewport.height);
      const halfHeight = viewport.height / (2 * zoom);
      const halfWidth = viewport.width / (2 * zoom);
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();
    sourceCanvas.style.visibility = "hidden";

    window.drawIntegrated3DScene = function drawIntegrated3DScene(state) {
      const started = performance.now();
      renderTime = state.time;
      const element = setTheme(state.element);
      updateTerrain(state.player, element);
      const focusX = state.player?.x || 0;
      const focusZ = state.player?.y || 0;
      const focusY = state.player ? terrainHeight(focusX, focusZ) : 0;
      cameraTarget.set(focusX, focusY, focusZ);
      camera.position.set(
        focusX,
        focusY + Math.sin(pitch) * 380,
        focusZ + Math.cos(pitch) * 380,
      );
      camera.lookAt(cameraTarget);
      cameraAngleDegrees = THREE.MathUtils.radToDeg(
        Math.atan2(camera.position.y - cameraTarget.y, camera.position.z - cameraTarget.z),
      );
      keyLight.position.set(focusX + 110, focusY + 180, focusZ + 120);
      lightTarget.position.set(focusX, focusY, focusZ);
      keyLight.target = lightTarget;
      syncActors(state);
      syncProjectiles(state);
      syncCombatEffects(state);
      syncGems(state);
      syncOrbitBlades(state);
      renderer.render(scene, camera);
      drawDurationMs = performance.now() - started;
      frameCount++;
      if (frameCount % 30 === 1) {
        meshCount = 0;
        ruinMeshCount = 0;
        scene.traverse((item) => {
          if (item.isMesh) meshCount++;
          if (item.userData.isWorldCell) {
            ruinMeshCount += item.children.filter((child) => child.isGroup).length;
          }
        });
      }
      const objectDiagnostics = state.qa ? collectRenderQaObjects(state) : undefined;

      const projectedPlayer = state.player
        ? playerNdc.set(
          state.player.x,
          terrainHeight(state.player.x, state.player.y),
          state.player.y,
        ).project(camera)
        : null;
      const characters = state.qa
        ? Array.from(actors, ([object, actor]) => {
          const screen = actorNdc.set(actor.position.x, actor.position.y + 24, actor.position.z)
            .project(camera);
          return {
            characterType: actor.userData.characterType,
            family: actor.userData.family,
            kind: actor.userData.familyKind ?? null,
            bossVariant: actor.userData.characterType === "boss"
              ? actor.userData.bossVariant : null,
            bossPhase: actor.userData.characterType === "boss"
              ? actor.userData.bossPhase : null,
            bossPhasePips: actor.userData.characterType === "boss"
              ? actor.userData.phasePips.filter((pip) => pip.visible).length : 0,
            level: actor.userData.characterType === "enemy"
              ? Math.max(1, Math.min(4, Math.floor(Number(object.evolutionLevel) || 1)))
              : null,
            worldX: object.x,
            worldY: object.y,
            screenX: (screen.x + 1) * viewport.width / 2,
            screenY: (1 - screen.y) * viewport.height / 2,
            meshCount: actor.userData.meshCount,
            silhouetteFeatures: actor.userData.silhouetteFeatures,
            rankMutation: actor.userData.rankMutation || [],
            rankPips: actor.userData.rankPips?.filter((pip) => pip.visible).length || 0,
            animationState: actor.userData.animationState,
            moving: actor.userData.moving,
            gaitPhase: actor.userData.gaitPhase,
            attackState: actor.userData.attackState,
            hitFlash: actor.userData.hitGlow.visible,
            facingRadians: Number(actor.rotation.y.toFixed(3)),
          };
        })
        : undefined;
      let minimumTerrainHeight = Infinity;
      let maximumTerrainHeight = -Infinity;
      for (const cell of terrain.values()) {
        minimumTerrainHeight = Math.min(minimumTerrainHeight, cell.userData.heightRange[0]);
        maximumTerrainHeight = Math.max(maximumTerrainHeight, cell.userData.heightRange[1]);
      }
      return {
        mode: "3d",
        renderMode: "three-js",
        renderer: "WebGLRenderer",
        projection: "orthographic",
        cameraAngleDegrees: Number(cameraAngleDegrees.toFixed(2)),
        cameraX: focusX,
        cameraZ: focusZ,
        playerScreenX: projectedPlayer ? (projectedPlayer.x + 1) * viewport.width / 2 : null,
        playerScreenY: projectedPlayer ? (1 - projectedPlayer.y) * viewport.height / 2 : null,
        playerWorldX: state.player?.x ?? null,
        playerWorldY: state.player?.y ?? null,
        playerMeshCount: state.player ? 1 : 0,
        drifterMeshCount: state.enemies.filter(
          (enemy) => enemy.kind === 0 && actors.has(enemy),
        ).length,
        enemyMeshCount: actors.size - (state.player ? 1 : 0),
        characters,
        projectileMeshCount: projectiles.size,
        bossProjectileCount: state.bossShots.length,
        bossHazardCount: state.bossHazards.length,
        activeCombatEffectCount,
        combatEffectPoolSize: combatEffectPool.length,
        combatEffectTypes: Array.from(
          combatEffects.values(),
          (effect) => effect.userData.effectType,
        ).sort(),
        renderQaIsolation: state.qa ? { ...renderQaIsolation } : undefined,
        objectDiagnostics,
        gemMeshCount: gems.size,
        orbitBladeCount: Math.floor(state.bladePositions.length / 2),
        terrainTileCount: terrain.size,
        terrainChunkCount: terrain.size,
        terrainChunkCacheSize: terrainCache.size,
        terrainChunkBuildCount,
        terrainChunkSize,
        terrainHeightRange: terrain.size
          ? [Number(minimumTerrainHeight.toFixed(2)), Number(maximumTerrainHeight.toFixed(2))]
          : [0, 0],
        terrainSurfaceColor: `#${shared.groundMaterial.color.getHexString()}`,
        ruinMeshCount,
        meshCount,
        worldTheme: element,
        dashActive: state.dashTimer > 0,
        gamePaused: state.paused,
        frameCount,
        renderDurationMs: Number(drawDurationMs.toFixed(3)),
        cameraPitchDegrees: Number(cameraAngleDegrees.toFixed(2)),
      };
    };
  }).catch((error) => {
    console.error("Could not initialize the optional Three.js renderer:", error);
  });
}
