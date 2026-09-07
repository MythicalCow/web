/**
 * Bake a meditating (lotus, hands on knees) pose into the CC0 MPFB human
 * body mesh and export a compact GLB containing only the posed geometry.
 * Produces public/sculptures/meditator.glb.
 *
 * Source model (not committed; 36 MB):
 *   https://raw.githubusercontent.com/met4citizen/TalkingHead/main/avatars/mpfb.glb
 *   (CC0, created with MPFB / MakeHuman)
 *
 * Usage:
 *   node scripts/bake-meditator.mjs <mpfb.glb> public/sculptures/meditator.glb
 *   node scripts/bake-meditator.mjs <mpfb.glb> /dev/null --report   # joint positions
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(path.resolve(process.cwd(), "package.json"));
const THREE = require("three");

const [, , inputPath, outputPath] = process.argv;

// ── Parse GLB ────────────────────────────────────────────────────────
const buf = fs.readFileSync(inputPath);
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString());
const binOffset = 20 + jsonLen + 8;
const bin = buf.slice(binOffset);

const COMPONENT = {
  5120: { array: Int8Array, size: 1 },
  5121: { array: Uint8Array, size: 1 },
  5122: { array: Int16Array, size: 2 },
  5123: { array: Uint16Array, size: 2 },
  5125: { array: Uint32Array, size: 4 },
  5126: { array: Float32Array, size: 4 },
};
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(index) {
  const acc = json.accessors[index];
  const view = json.bufferViews[acc.bufferView];
  const comp = COMPONENT[acc.componentType];
  const elems = TYPE_SIZE[acc.type];
  const start = (view.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = view.byteStride || comp.size * elems;
  const out = new comp.array(acc.count * elems);
  for (let i = 0; i < acc.count; i++) {
    const off = start + i * stride;
    for (let e = 0; e < elems; e++) {
      out[i * elems + e] = new comp.array(
        bin.buffer,
        bin.byteOffset + off + e * comp.size,
        1
      )[0];
    }
  }
  return out;
}

// ── Build node hierarchy ─────────────────────────────────────────────
const objects = json.nodes.map((n) => {
  const obj = new THREE.Object3D();
  obj.name = n.name;
  if (n.translation) obj.position.fromArray(n.translation);
  if (n.rotation) obj.quaternion.fromArray(n.rotation);
  if (n.scale) obj.scale.fromArray(n.scale);
  return obj;
});
const root = new THREE.Object3D();
json.nodes.forEach((n, i) => {
  (n.children || []).forEach((c) => objects[i].add(objects[c]));
});
for (const idx of json.scenes[json.scene || 0].nodes) root.add(objects[idx]);
root.updateMatrixWorld(true);

const byName = new Map(objects.map((o) => [o.name, o]));

function jointWorld(name) {
  const v = new THREE.Vector3();
  byName.get(name).getWorldPosition(v);
  return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
}

if (process.argv.includes("--report")) {
  for (const n of [
    "Hips", "Spine", "Spine2", "Neck", "Head",
    "LeftShoulder", "LeftArm", "LeftForeArm", "LeftHand", "LeftHandMiddle3",
    "LeftUpLeg", "LeftLeg", "LeftFoot", "LeftToeBase",
    "RightUpLeg", "RightLeg", "RightFoot",
  ]) {
    console.log(n.padEnd(16), jointWorld(n));
  }
  process.exit(0);
}

// ── Pose ─────────────────────────────────────────────────────────────
const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

function rotateWorld(name, axisName, degrees) {
  const axis = AXES[axisName];
  const bone = byName.get(name);
  if (!bone) throw new Error(`no bone ${name}`);
  const parentQuat = new THREE.Quaternion();
  bone.parent.getWorldQuaternion(parentQuat);
  const delta = new THREE.Quaternion().setFromAxisAngle(
    axis,
    THREE.MathUtils.degToRad(degrees)
  );
  bone.quaternion.premultiply(
    parentQuat.clone().invert().multiply(delta).multiply(parentQuat)
  );
  root.updateMatrixWorld(true);
}

function scaleBone(name, factor) {
  const bone = byName.get(name);
  if (bone) bone.scale.multiplyScalar(factor);
  root.updateMatrixWorld(true);
}

function worldPos(name) {
  const v = new THREE.Vector3();
  byName.get(name).getWorldPosition(v);
  return v;
}

// Apply an arbitrary world-space quaternion rotation to a bone.
function applyWorldQuat(name, q) {
  const bone = byName.get(name);
  const parentQuat = new THREE.Quaternion();
  bone.parent.getWorldQuaternion(parentQuat);
  bone.quaternion.premultiply(
    parentQuat.clone().invert().multiply(q).multiply(parentQuat)
  );
  root.updateMatrixWorld(true);
}

// Rotate `boneName` so the direction from it to `endName` points at target.
function aimBone(boneName, endName, target) {
  const from = worldPos(endName).sub(worldPos(boneName)).normalize();
  const to = new THREE.Vector3(...target).sub(worldPos(boneName)).normalize();
  applyWorldQuat(boneName, new THREE.Quaternion().setFromUnitVectors(from, to));
}

// Twist a bone about the world-space axis running from `fromName` to itself.
function twistBone(name, fromName, degrees) {
  const axis = worldPos(name).sub(worldPos(fromName)).normalize();
  applyWorldQuat(
    name,
    new THREE.Quaternion().setFromAxisAngle(axis, THREE.MathUtils.degToRad(degrees))
  );
}

/**
 * Lotus (padmasana) pose, hands on knees, for the MPFB Mixamo-style rig.
 * Rest pose: A-pose, y-up, facing +Z, +X = figure's left.
 * Rotations are world-axis; aim targets are world-space positions.
 */
function applyPose({ rotateWorld, scaleBone, jointWorld, aimBone, twistBone }) {
  // Neutralize the female chest shape.
  scaleBone("LeftBreast", 0.2);
  scaleBone("RightBreast", 0.2);

  // Torso tall and settled, chin slightly dropped.
  rotateWorld("Spine", "x", -3);
  rotateWorld("Neck", "x", 5);
  rotateWorld("Head", "x", 7);

  // ── Legs: tight lotus fold ─────────────────────────────────────────
  // Initial swing sets the twist of each limb; aim refines direction.
  rotateWorld("LeftUpLeg", "x", -78);
  rotateWorld("LeftUpLeg", "y", 40);
  rotateWorld("LeftUpLeg", "z", -14);
  aimBone("LeftUpLeg", "LeftLeg", [0.34, 0.83, 0.30]);
  rotateWorld("LeftLeg", "y", -130);
  aimBone("LeftLeg", "LeftFoot", [-0.15, 0.88, 0.26]);
  rotateWorld("LeftFoot", "y", -30);
  rotateWorld("LeftFoot", "x", 68);

  rotateWorld("RightUpLeg", "x", -78);
  rotateWorld("RightUpLeg", "y", -40);
  rotateWorld("RightUpLeg", "z", 14);
  aimBone("RightUpLeg", "RightLeg", [-0.34, 0.83, 0.29]);
  rotateWorld("RightLeg", "y", 130);
  aimBone("RightLeg", "RightFoot", [0.16, 0.78, 0.25]);
  rotateWorld("RightFoot", "y", 30);
  rotateWorld("RightFoot", "x", 68);

  // ── Arms: relaxed, open palms facing up on the knees ──────────────
  // Elbows drop to the sides first so the forearms can reach the knees.
  aimBone("LeftArm", "LeftForeArm", [0.27, 1.08, 0.14]);
  aimBone("LeftForeArm", "LeftHand", [0.37, 0.905, 0.31]);
  twistBone("LeftHand", "LeftForeArm", 90);

  aimBone("RightArm", "RightForeArm", [-0.27, 1.08, 0.14]);
  aimBone("RightForeArm", "RightHand", [-0.37, 0.905, 0.31]);
  twistBone("RightHand", "RightForeArm", -90);

  // Debug: where key joints ended up.
  for (const name of [
    "LeftLeg", "RightLeg", "LeftFoot", "RightFoot", "LeftHand", "RightHand",
    "LeftHandMiddle3", "LeftHandThumb3", "LeftHandPinky3", "LeftForeArm", "LeftToeBase", "RightToeBase",
  ]) {
    console.log("posed", name.padEnd(12), jointWorld(name));
  }
}

applyPose({ rotateWorld, scaleBone, jointWorld, aimBone, twistBone });

// ── Bake skinned vertices of the body + clothing meshes ──────────────
// The MakeHuman export deletes body geometry hidden under clothing, so
// the clothed torso comes from the suit mesh.
const BAKE_MESHES = ["Human", "Human.female_casualsuit01"];
const parts = BAKE_MESHES.map((nodeName) => {
  const node = json.nodes.find((n) => n.name === nodeName);
  const prim = json.meshes[node.mesh].primitives[0];
  return {
    positions: readAccessor(prim.attributes.POSITION),
    normals: readAccessor(prim.attributes.NORMAL),
    joints: readAccessor(prim.attributes.JOINTS_0),
    weights: readAccessor(prim.attributes.WEIGHTS_0),
    indices: readAccessor(prim.indices),
  };
});

let totalVerts = 0;
let totalIndices = 0;
for (const part of parts) {
  totalVerts += part.positions.length / 3;
  totalIndices += part.indices.length;
}
const positions = new Float32Array(totalVerts * 3);
const normals = new Float32Array(totalVerts * 3);
const joints = new Uint16Array(totalVerts * 4);
const weights = new Float32Array(totalVerts * 4);
const indices = new Uint32Array(totalIndices);
{
  let vertOffset = 0;
  let idxOffset = 0;
  for (const part of parts) {
    positions.set(part.positions, vertOffset * 3);
    normals.set(part.normals, vertOffset * 3);
    joints.set(part.joints, vertOffset * 4);
    weights.set(part.weights, vertOffset * 4);
    for (let i = 0; i < part.indices.length; i++) {
      indices[idxOffset + i] = part.indices[i] + vertOffset;
    }
    vertOffset += part.positions.length / 3;
    idxOffset += part.indices.length;
  }
}

const skin = json.skins[0];
const ibm = readAccessor(skin.inverseBindMatrices);

const jointMatrices = skin.joints.map((jointIndex, j) => {
  const inverseBind = new THREE.Matrix4().fromArray(ibm, j * 16);
  return new THREE.Matrix4()
    .copy(objects[jointIndex].matrixWorld)
    .multiply(inverseBind);
});
const jointNormalMatrices = jointMatrices.map((m) =>
  new THREE.Matrix3().getNormalMatrix(m)
);

const outPositions = new Float32Array(positions.length);
const outNormals = new Float32Array(normals.length);
const v = new THREE.Vector3();
const n = new THREE.Vector3();
const skinned = new THREE.Vector3();
const skinnedNormal = new THREE.Vector3();
const tmp = new THREE.Vector3();

const vertexCount = positions.length / 3;
for (let i = 0; i < vertexCount; i++) {
  v.fromArray(positions, i * 3);
  n.fromArray(normals, i * 3);
  skinned.set(0, 0, 0);
  skinnedNormal.set(0, 0, 0);
  for (let k = 0; k < 4; k++) {
    const w = weights[i * 4 + k];
    if (!w) continue;
    const j = joints[i * 4 + k];
    tmp.copy(v).applyMatrix4(jointMatrices[j]);
    skinned.addScaledVector(tmp, w);
    tmp.copy(n).applyMatrix3(jointNormalMatrices[j]);
    skinnedNormal.addScaledVector(tmp, w);
  }
  skinnedNormal.normalize();
  skinned.toArray(outPositions, i * 3);
  skinnedNormal.toArray(outNormals, i * 3);
}

// ── Write minimal GLB ────────────────────────────────────────────────
const indexArray =
  vertexCount > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
const posBytes = Buffer.from(outPositions.buffer);
const normBytes = Buffer.from(outNormals.buffer);
const idxBytes = Buffer.from(indexArray.buffer, indexArray.byteOffset, indexArray.byteLength);

function pad4(b, fill = 0) {
  const rem = b.length % 4;
  return rem ? Buffer.concat([b, Buffer.alloc(4 - rem, fill)]) : b;
}

const binOut = Buffer.concat([pad4(posBytes), pad4(normBytes), pad4(idxBytes)]);

const bboxMin = [Infinity, Infinity, Infinity];
const bboxMax = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < vertexCount; i++) {
  for (let a = 0; a < 3; a++) {
    bboxMin[a] = Math.min(bboxMin[a], outPositions[i * 3 + a]);
    bboxMax[a] = Math.max(bboxMax[a], outPositions[i * 3 + a]);
  }
}

const outJson = {
  asset: { version: "2.0", generator: "bake-meditator" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "Meditator" }],
  meshes: [
    {
      name: "Meditator",
      primitives: [
        { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, mode: 4 },
      ],
    },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: vertexCount,
      type: "VEC3",
      min: bboxMin,
      max: bboxMax,
    },
    { bufferView: 1, componentType: 5126, count: vertexCount, type: "VEC3" },
    {
      bufferView: 2,
      componentType: vertexCount > 65535 ? 5125 : 5123,
      count: indexArray.length,
      type: "SCALAR",
    },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: posBytes.length, target: 34962 },
    {
      buffer: 0,
      byteOffset: pad4(posBytes).length,
      byteLength: normBytes.length,
      target: 34962,
    },
    {
      buffer: 0,
      byteOffset: pad4(posBytes).length + pad4(normBytes).length,
      byteLength: idxBytes.length,
      target: 34963,
    },
  ],
  buffers: [{ byteLength: binOut.length }],
};

const jsonBuf = pad4(Buffer.from(JSON.stringify(outJson)), 0x20);
const total = 12 + 8 + jsonBuf.length + 8 + binOut.length;
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(total, 8);
const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(jsonBuf.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binOut.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);

fs.writeFileSync(
  outputPath,
  Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binOut])
);
console.log(
  `wrote ${outputPath}: ${vertexCount} verts, ${indexArray.length / 3} tris, ${(
    (total / 1024) | 0
  )} KB`
);
