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
      const shadowMaterial = opacity === 0.28
        ? shared.shadow
        : new THREE.MeshBasicMaterial({
          color: "#03050a", transparent: true, opacity, depthWrite: false,
        });
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
      root.userData.materials = [shared.playerCloth, shared.playerTrim, shared.skin, shared.darkLeather];
      root.userData.arms = [];
      root.userData.legs = [];
      makeShadow(root, 18, 0.34);

      mesh(shared.torsoGeometry, shared.playerCloth, body, 0, 18, 0);
      mesh(shared.hoodGeometry, shared.darkLeather, body, 0, 28, -0.3)
        .scale.set(0.94, 1.12, 0.94);
      mesh(shared.headGeometry, shared.skin, body, 0, 27, 2.2)
        .scale.set(0.74, 0.9, 0.62);
      mesh(new THREE.ConeGeometry(7.2, 10, 9), shared.playerCloth, body, 0, 35, -1)
        .rotation.x = -0.2;
      mesh(new THREE.BoxGeometry(10, 3.6, 2.5), shared.playerTrim, body, 0, 11, 0);
      mesh(new THREE.SphereGeometry(1.05, 8, 6), shared.playerTrim, body, -2, 28, 7.1);
      mesh(new THREE.SphereGeometry(1.05, 8, 6), shared.playerTrim, body, 2, 28, 7.1);

      for (const side of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(side * 9, 23, 0);
        body.add(arm);
        mesh(shared.limbGeometry, shared.playerCloth, arm, 0, -5, 0);
        mesh(shared.handGeometry, shared.skin, arm, 0, -11.2, 0.4);
        root.userData.arms.push(arm);

        const leg = new THREE.Group();
        leg.position.set(side * 4.2, 9, 0);
        body.add(leg);
        mesh(shared.limbGeometry, shared.darkLeather, leg, 0, -3.2, 0);
        mesh(new THREE.BoxGeometry(6, 3, 10), shared.darkLeather, leg, 0, -9, 2.2);
        root.userData.legs.push(leg);
      }

      const dashTrail = new THREE.Mesh(new THREE.ConeGeometry(12, 32, 12), shared.dashTrail);
      dashTrail.rotation.x = Math.PI / 2;
      dashTrail.position.set(0, 6, -22);
      dashTrail.visible = false;
      root.add(dashTrail);
      root.userData.dashTrail = dashTrail;
      scene.add(root);
      return root;
    }

    function createDrifter() {
      const root = new THREE.Group();
      const body = new THREE.Group();
      root.add(body);
      root.userData.body = body;
      root.userData.arms = [];
      root.userData.legs = [];
      root.userData.materials = [shared.drifterHide, shared.drifterBone];
      makeShadow(root, 18, 0.38);

      const torso = mesh(shared.drifterBodyGeometry, shared.drifterHide, body, 0, 15, 0);
      torso.scale.set(8.7, 11.6, 7.3);
      const head = mesh(shared.drifterBodyGeometry, shared.drifterHide, body, 0, 24, 4);
      head.scale.set(6.2, 6.7, 6);
      mesh(new THREE.SphereGeometry(1.7, 8, 6), shared.drifterBone, body, -2.7, 25.3, 9.1);
      mesh(new THREE.SphereGeometry(1.7, 8, 6), shared.drifterBone, body, 2.7, 25.3, 9.1);
      for (let index = 0; index < 3; index++) {
        const spike = mesh(
          shared.spikeGeometry,
          shared.drifterBone,
          body,
          (index - 1) * 5,
          26 + (index === 1 ? 3 : 0),
          -5,
        );
        spike.rotation.z = (index - 1) * 0.33;
        spike.rotation.x = -0.2;
      }

      for (const side of [-1, 1]) {
        const arm = new THREE.Group();
        arm.position.set(side * 8, 20, 0);
        body.add(arm);
        const longArm = mesh(
          new THREE.CylinderGeometry(2.1, 3.8, 17, 7),
          shared.drifterHide,
          arm,
          side * 2,
          -6.5,
          2,
        );
        longArm.rotation.z = side * -0.18;
        mesh(new THREE.ConeGeometry(3, 8, 5), shared.drifterBone, arm, side * 2, -15, 6)
          .rotation.x = -0.7;
        root.userData.arms.push(arm);

        const leg = new THREE.Group();
        leg.position.set(side * 4, 8, -1);
        body.add(leg);
        mesh(shared.limbGeometry, shared.drifterHide, leg, 0, -3, 0).scale.set(1.25, 1.2, 1.2);
        root.userData.legs.push(leg);
      }
      scene.add(root);
      return root;
    }

    function createGenericEnemy(enemy) {
      const root = new THREE.Group();
      const body = new THREE.Group();
      root.add(body);
      root.userData.body = body;
      root.userData.arms = [];
      root.userData.legs = [];
      root.userData.materials = [shared.genericEnemy[Math.abs(enemy.kind || 0) % shared.genericEnemy.length]];
      root.userData.isGenericEnemy = true;
      makeShadow(root, Math.max(12, enemy.r || 13), 0.34);
      const scale = Math.max(0.72, Math.min(1.9, (enemy.r || 13) / 13));
      const torso = mesh(shared.drifterBodyGeometry, root.userData.materials[0], body, 0, 10 * scale, 0);
      torso.scale.set(7 * scale, 10 * scale, 6 * scale);
      mesh(shared.drifterBodyGeometry, root.userData.materials[0], body, 0, 22 * scale, 2)
        .scale.set(5 * scale, 5 * scale, 4.5 * scale);
      return root;
    }

    function updateActor(actor, object, state, isPlayer) {
      const x = isPlayer ? state.player.x : object.x;
      const z = isPlayer ? state.player.y : object.y;
      const moving = isPlayer
        ? Object.values(state.keys).some(Boolean) && state.active && !state.paused
        : Math.abs(object.speed || 0) > 0;
      const phase = state.time * (isPlayer ? 10 : 7) + (isPlayer ? 0 : z * 0.01);
      const gait = moving ? Math.sin(phase) * 0.48 : Math.sin(state.time * 2 + z * 0.01) * 0.045;
      actor.position.set(x, terrainHeight(x, z), z);
      actor.userData.body.position.y = moving ? Math.abs(Math.sin(phase * 2)) * 1.2 : 0;

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
        if (state.damageFlash > 0) {
          shared.playerCloth.emissive.set("#ffffff");
          shared.playerCloth.emissiveIntensity = 0.8;
        } else {
          shared.playerCloth.emissive.set("#000000");
          shared.playerCloth.emissiveIntensity = 0;
        }
      } else {
        actor.rotation.y = Math.atan2(state.player.x - x, state.player.y - z);
        actor.scale.setScalar(object.kind === 0
          ? 1.4
          : Math.max(0.72, Math.min(1.9, (object.r || 13) / 13)));
        const hit = object.hit > 0;
        const material = actor.userData.materials[0];
        if (hit && material.emissive) {
          material.emissive.set("#ffffff");
          material.emissiveIntensity = 0.7;
        } else if (material.emissive) {
          material.emissive.set("#000000");
          material.emissiveIntensity = 0;
        }
        actor.userData.hpBar.visible = object.hp < object.maxHp;
        const hpRatio = object.maxHp > 0 && Number.isFinite(object.maxHp)
          ? object.hp / object.maxHp : 1;
        actor.userData.hpFill.scale.x = Math.max(0.02, Math.min(1, hpRatio));
      }
      actor.userData.arms.forEach((arm, index) => {
        arm.rotation.x = gait * (index ? -1 : 1);
        if (!isPlayer && actor.userData.isGenericEnemy) arm.rotation.x = 0;
      });
      actor.userData.legs.forEach((leg, index) => {
        leg.rotation.x = gait * (index ? -1 : 1);
      });
    }

    function makeActorEntry(object, isPlayer = false) {
      const root = isPlayer
        ? createPlayer()
        : object.kind === 0
          ? createDrifter()
          : createGenericEnemy(object);
      if (!isPlayer) {
        const hpBack = mesh(shared.hpBackGeometry, shared.hpBack, root.userData.body, 0, 39, 0);
        hpBack.rotation.x = -0.48;
        const hpFill = mesh(shared.hpFillGeometry, shared.hpFill, root.userData.body, 0, 39.2, 0.7);
        hpFill.rotation.x = -0.48;
        root.userData.hpBar = hpBack;
        root.userData.hpFill = hpFill;
      }
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
