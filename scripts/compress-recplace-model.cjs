// Lossless Meshopt encoding: vertex values, triangle order, names, and mapping
// ranges stay intact. Verify every buffer by decoding it before writing the GLB.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { MeshoptEncoder, MeshoptDecoder } = require('meshoptimizer');

(async () => {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  const file = path.join(__dirname, '../Assets/3d/recplace-exterior.glb');
  const original = fs.readFileSync(file);
  const jsonLength = original.readUInt32LE(12);
  const gltf = JSON.parse(original.subarray(20, 20 + jsonLength));
  assert(!gltf.extensionsUsed?.includes('EXT_meshopt_compression'), 'Rebuild the uncompressed model first.');
  const source = original.subarray(28 + jsonLength);
  const chunks = [];
  let length = 0;
  let fallbackLength = 0;
  function append(bytes) {
    const pad = (4 - length % 4) % 4;
    chunks.push(Buffer.alloc(pad)); length += pad;
    const start = length;
    chunks.push(Buffer.from(bytes)); length += bytes.length;
    return start;
  }
  for (let i = 0; i < gltf.bufferViews.length; i++) {
    const view = gltf.bufferViews[i];
    const bytes = source.subarray(view.byteOffset, view.byteOffset + view.byteLength);
    const accessor = gltf.accessors.find((a) => a.bufferView === i);
    if (!accessor) { view.byteOffset = append(bytes); continue; }
    const stride = view.byteLength / accessor.count;
    // INDICES preserves exact index ordering, including each triangle's first
    // vertex, so the companion source-part index ranges remain exact.
    const mode = view.target === 34963 ? 'INDICES' : 'ATTRIBUTES';
    const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, accessor.count, stride, mode);
    const decoded = new Uint8Array(bytes.length);
    MeshoptDecoder.decodeGltfBuffer(decoded, accessor.count, stride, encoded, mode, 'NONE');
    assert.deepEqual(Buffer.from(decoded), bytes, `Lossless verification failed for buffer view ${i}`);
    view.buffer = 1;
    view.byteOffset = fallbackLength;
    fallbackLength += bytes.length;
    view.extensions = { EXT_meshopt_compression: {
      buffer: 0, byteOffset: append(encoded), byteLength: encoded.length,
      byteStride: stride, count: accessor.count, mode, filter: 'NONE',
    } };
  }
  gltf.extensionsUsed = ['EXT_meshopt_compression'];
  gltf.extensionsRequired = ['EXT_meshopt_compression'];
  gltf.buffers = [{ byteLength: length }, { byteLength: fallbackLength, extensions: { EXT_meshopt_compression: { fallback: true } } }];
  const json = Buffer.from(JSON.stringify(gltf));
  const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const binary = Buffer.concat([...chunks, Buffer.alloc((4 - length % 4) % 4)]);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(28 + paddedJson.length + binary.length, 8);
  header.writeUInt32LE(paddedJson.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  const output = Buffer.concat([header, paddedJson, binHeader, binary]);
  fs.writeFileSync(file, output);
  console.log(`Lossless Meshopt GLB: ${original.length.toLocaleString()} → ${output.length.toLocaleString()} bytes. All decoded buffers match.`);
})().catch((error) => { console.error(error); process.exit(1); });
