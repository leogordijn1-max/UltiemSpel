if (new URLSearchParams(location.search).get("render") === "3d") {
  import("/vendor/three/three.module.js").then((THREE) => {
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
    const gems = new Map();
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
      terrainChunkBuildCount++;
      return cell;
    }

    function updateTerrain(player, element) {
      if (element !== terrainTheme) {
        terrainTheme = setTheme(element);
        for (const cell of terrain.values()) scene.remove(cell);
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
            scene.add(chunk);
          }
        }
      }
      for (const [key, cell] of terrain) {
        if (!wanted.has(key)) {
          scene.remove(cell);
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

      if (isPlayer) {
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

    function makeActorEntry(object, isPlayer = false) {
      const root = isPlayer
        ? createPlayer()
        : createEnemyFamily(object);
      if (!isPlayer) {
        const hpBack = mesh(shared.hpBackGeometry, shared.hpBack, root.userData.body, 0, 48, 0);
        hpBack.rotation.x = -0.48;
        const hpFill = mesh(shared.hpFillGeometry, shared.hpFill, root.userData.body, 0, 48.2, 0.7);
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
        if (!actors.has(actor)) actors.set(actor, makeActorEntry(actor, true));
        updateActor(actors.get(actor), actor, state, true);
      }
      for (const enemy of state.enemies) {
        const dx = enemy.x - (state.player?.x || 0);
        const dz = enemy.y - (state.player?.y || 0);
        if (dx * dx + dz * dz > 1050 * 1050) continue;
        activeActors.add(enemy);
        if (!actors.has(enemy)) actors.set(enemy, makeActorEntry(enemy));
        updateActor(actors.get(enemy), enemy, state, false);
      }
      for (const [object, actor] of actors) {
        if (!activeActors.has(object)) {
          scene.remove(actor);
          actors.delete(object);
        }
      }
    }

    function projectileMaterial(type) {
      if (type === "fireball" || type === "flame" || type === "fish") return shared.projectileMaterials.fire;
      if (type === "waterBolt" || type === "tidalWave") return shared.projectileMaterials.water;
      if (type === "iceShards" || type === "frost") return shared.projectileMaterials.frost;
      return shared.projectileMaterials.arcane;
    }

    function makeProjectile(object, isEnemy = false) {
      const group = new THREE.Group();
      const material = isEnemy ? shared.projectileMaterials.enemy : projectileMaterial(object.type);
      const core = mesh(shared.projectileGeometry, material, group);
      const radius = Math.max(0.75, Math.min(2.8, (object.r || 4) / 3.8));
      core.scale.setScalar(radius);
      const ring = mesh(shared.projectileRingGeometry, material, group, 0, 0, 0);
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(radius);
      makeShadow(group, (object.r || 4) * 0.6, 0.18);
      group.userData.ring = ring;
      scene.add(group);
      return group;
    }

    function syncProjectiles(state) {
      const activeProjectiles = new Set();
      for (const shot of [
        ...state.bullets,
        ...state.elementalShots,
        ...state.enemyShots,
        ...state.bossShots,
      ]) {
        if (state.player) {
          const dx = shot.x - state.player.x;
          const dz = shot.y - state.player.y;
          if (dx * dx + dz * dz > 1150 * 1150) continue;
        }
        activeProjectiles.add(shot);
        if (!projectiles.has(shot)) {
          const enemyShot = state.enemyShots.includes(shot) || state.bossShots.includes(shot);
          projectiles.set(shot, makeProjectile(shot, enemyShot));
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
          projectiles.delete(object);
        }
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
          const color = gem.kind === "health" ? "#ff6380" : "#7adcf5";
          const material = new THREE.MeshStandardMaterial({
            color, emissive: color, emissiveIntensity: 0.6, metalness: 0.25, roughness: 0.25,
          });
          const crystal = mesh(shared.crystalGeometry, material, scene);
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
          gems.delete(object);
        }
      }
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
      syncGems(state);
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
        gemMeshCount: gems.size,
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
