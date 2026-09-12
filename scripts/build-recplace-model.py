"""Rebuild the web GLB from the supplied, unchanged part list. Requires Pillow.

Coordinates and envelope follow the supplied drawing reconstruction, not a survey.
No reference photograph is mapped onto the model. Textures are small procedural
surface finishes; all source part IDs survive in the companion interaction map.
"""
import copy
import hashlib
import io
import json
import math
from pathlib import Path
import random
import struct

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'Assets' / '3d'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'scripts' / '3d-source' / 'recplace-model.json'
model = json.loads(SOURCE.read_text())
parts = []


def add(part, source_id):
    p = copy.deepcopy(part)
    p['sourceId'] = source_id
    parts.append(p)


# Keep the envelope and all dimensioned controls. Give the existing entry frame
# relief and distinguish the canopy finish from the textured entrance surround.
for i, original in enumerate(model['items']):
    part = copy.deepcopy(original)
    if part['name'] in ('Facade panel', 'Window frame', 'Window mullion'):
        axis = 2 if part['s'][2] <= .08 else 0
        base = (10.363 if abs(part['p'][0]) > 15.24 else 5.486) if axis == 2 and part['p'][2] > 0 else (-10.363 if axis == 2 else math.copysign(27.432, part['p'][0]))
        part['p'][axis] = base + math.copysign(.20 if part['name'] == 'Facade panel' else .26, base)
    if part['m'] == 'glacier':
        if part['name'] == 'Facade panel':
            part['m'] = 'stone'
            part['s'][2] = .32
            part['p'][2] += .10
        else:
            part['m'] = 'canopy'
    if part['name'] == 'Illustrative ground plinth':
        part['p'][1] = -.15
        part['s'][1] = .22
    add(part, f'part-{i:04d}')
    if 'entrance canopy' in part['name'].lower():
        for label, y, h in [('cap', 4.37, .07), ('soffit', 3.105, .045)]:
            trim = copy.deepcopy(part)
            trim['name'] = f'Canopy {label}'
            trim['m'] = 'frame'
            trim['p'][1] = y
            trim['s'][1] = h
            trim['s'][0] += .035
            trim['s'][2] += .035
            add(trim, f'detail-canopy-{i:04d}-{label}')


def plane(p):
    axis = 2 if p['s'][2] <= .08 else 0
    return axis, round(p['p'][axis])


def rect(p, axis):
    u = 0 if axis == 2 else 2
    return [p['p'][u] - p['s'][u] / 2, p['p'][1] - p['s'][1] / 2,
            p['p'][u] + p['s'][u] / 2, p['p'][1] + p['s'][1] / 2]


# The supplied surface subtraction left some window frames crossing later solid
# panels. Trim ONLY those frames to the final visible glazing, fixing the stray
# mullions without moving any opening or changing any floor/roof dimension.
glazing = [p for p in parts if p['name'] == 'Facade panel' and p['m'] == 'glass']
clean = []
for p in parts:
    if p['name'] not in ('Window frame', 'Window mullion'):
        clean.append(p)
        continue
    axis, key = plane(p)
    a = rect(p, axis)
    for glass in glazing:
        if plane(glass) != (axis, key):
            continue
        b = rect(glass, axis)
        r = [max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])]
        if r[2] - r[0] <= .0001 or r[3] - r[1] <= .0001:
            continue
        segment = copy.deepcopy(p)
        u = 0 if axis == 2 else 2
        segment['p'][u], segment['p'][1] = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
        segment['s'][u], segment['s'][1] = r[2] - r[0], r[3] - r[1]
        clean.append(segment)
parts = clean

FLOORS = [('floor-01', 0, 4.258), ('floor-02', 4.258, 8.160), ('floor-03', 8.160, 12.954)]
batches = {}
for p in parts:
    if p['g'] in ('roof', 'context'):
        pieces = [(p['g'], p)]
    else:
        pieces = []
        bottom, top = p['p'][1] - p['s'][1] / 2, p['p'][1] + p['s'][1] / 2
        for floor, low, high in FLOORS:
            lo, hi = max(bottom, low), min(top, high)
            if hi <= lo:
                continue
            piece = copy.deepcopy(p)
            piece['p'][1], piece['s'][1] = (lo + hi) / 2, hi - lo
            pieces.append((floor, piece))
    for group, piece in pieces:
        batches.setdefault((group, piece['m']), []).append(piece)

# sRGB art direction is converted to linear factors for glTF PBR materials.
PALETTE = {
    'ice': ('#e3e0d8', .79, 0), 'emu': ('#303433', .87, .02),
    'wood': ('#ae512b', .68, 0), 'stone': ('#a7a59b', .94, 0),
    'canopy': ('#eeece3', .64, .02), 'glass': ('#223442', .16, .36),
    'spandrel': ('#202c33', .29, .20), 'frame': ('#191d1f', .48, .25),
    'roof': ('#626664', .97, 0), 'walk': ('#b9b7ad', .94, 0),
    'rtu': ('#767f7e', .74, .12),
}


def linear(c):
    return c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4


gltf = {'asset': {'version': '2.0', 'generator': 'RECPLACE web presentation 1.0'},
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'name': 'recplace', 'children': [], 'extras': {'units': 'metres', 'schemaVersion': 1}}],
        'meshes': [], 'materials': [], 'buffers': [{}], 'bufferViews': [], 'accessors': [],
        'images': [], 'textures': [], 'samplers': [{'wrapS': 10497, 'wrapT': 10497}],
        'extras': {'source': model['source'], 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                   'limitations': 'Illustrative exterior reconstruction; not BIM, as-built, suite boundaries or lease measurements.',
                   'dimensions': model['dimensions']}}
binary = bytearray()


def view(blob, target=None):
    binary.extend(b'\0' * (-len(binary) % 4))
    v = {'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(blob)}
    if target:
        v['target'] = target
    binary.extend(blob)
    gltf['bufferViews'].append(v)
    return len(gltf['bufferViews']) - 1


def texture(kind):
    rng = random.Random(42)
    size = 256 if kind == 'stone' else 128
    im = Image.new('RGB', (size, size))
    pixels = im.load()
    for y in range(size):
        for x in range(size):
            n = rng.randrange(-7, 8)
            v = 236 + n
            if kind == 'stone':
                # Staggered, lightly varied block finish, not a photographic facade.
                row = y // 32
                cell = ((x + (row % 2) * 32) % size) // 64
                v = 211 + ((row * 7 + cell * 13) % 29) + n
                if y % 32 < 2 or (x + (row % 2) * 32) % 64 < 2:
                    v = 150 + n
            elif kind == 'wood' and y % 16 == 0:
                v = 189 + n
            v = max(0, min(255, v))
            pixels[x, y] = (v, v, v)
    buff = io.BytesIO()
    im.save(buff, format='PNG', optimize=True)
    gltf['images'].append({'name': f'{kind}-finish', 'mimeType': 'image/png', 'bufferView': view(buff.getvalue())})
    gltf['textures'].append({'source': len(gltf['images']) - 1, 'sampler': 0})
    return len(gltf['textures']) - 1


mat_ids = {}
for key, (color, rough, metal) in PALETTE.items():
    pbr = {'baseColorFactor': [linear(int(color[i:i+2], 16) / 255) for i in (1, 3, 5)] + [1],
           'roughnessFactor': rough, 'metallicFactor': metal}
    if key in ('stone', 'wood', 'emu', 'ice'):
        pbr['baseColorTexture'] = {'index': texture(key)}
    mat_ids[key] = len(gltf['materials'])
    gltf['materials'].append({'name': key, 'pbrMetallicRoughness': pbr})


def accessor(values, components, integer=False):
    flat = [c for row in values for c in row] if components > 1 else values
    code, component_type = ('I', 5125) if integer else ('f', 5126)
    v = view(struct.pack('<' + code * len(flat), *flat), 34963 if integer else 34962)
    acc = {'bufferView': v, 'componentType': component_type, 'count': len(values),
           'type': {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3'}[components]}
    if components > 1:
        acc.update(min=[min(row[i] for row in values) for i in range(components)],
                   max=[max(row[i] for row in values) for i in range(components)])
    gltf['accessors'].append(acc)
    return len(gltf['accessors']) - 1


VERTS = [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]
FACES = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(3,7,6,2),(0,4,7,3),(1,2,6,5)]
group_ids = {}
mapping = {'schemaVersion': 1, 'units': 'metres', 'source': model['source'], 'floors': [], 'batches': [], 'suites': []}
for group, low, high in FLOORS:
    mapping['floors'].append({'id': group, 'nodeName': group.replace('-', '_'), 'elevation': low, 'top': high,
                             'planUrl': '/plans/#floor-summary', 'inquiryUrl': '/contact/', 'suiteIds': []})
for (group, material), objects in batches.items():
    if group not in group_ids:
        group_ids[group] = len(gltf['nodes'])
        gltf['nodes'].append({'name': group.replace('-', '_'), 'children': [],
                              'extras': {'groupId': group, 'floorId': group if group.startswith('floor') else None}})
        gltf['nodes'][0]['children'].append(group_ids[group])
    positions, normals, uvs, indices, ranges = [], [], [], [], []
    for p in objects:
        start = len(indices)
        vertices = []
        for j, v in enumerate(VERTS):
            vy = (1 if j in (6, 7) else -1) if p.get('wedge') else v[1]
            vertices.append([p['p'][k] + (vy if k == 1 else v[k]) * p['s'][k] / 2 for k in range(3)])
        for face in FACES:
            vs = [vertices[j] for j in face]
            triangles = []
            for tri in [(0, 1, 2), (0, 2, 3)]:
                a, b = [[vs[j][k] - vs[tri[0]][k] for k in range(3)] for j in tri[1:]]
                n = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
                length = math.sqrt(sum(c*c for c in n))
                if length > 1e-10:
                    triangles.append(tri)
                    normal = [c/length for c in n]
            if not triangles:
                continue
            n = normal
            offset = len(positions)
            uv_axes = [k for k in range(3) if k != max(range(3), key=lambda k: abs(n[k]))]
            for v in vs:
                positions.append(v)
                normals.append(n)
                uvs.append([v[k] / (2 if material == 'stone' else 3) for k in uv_axes])
            indices.extend(offset + j for tri in triangles for j in tri)
        if p.get('wedge'):
            # Check a closed surface by geometric edge incidence, including both
            # triangular end walls. A degenerate half-quad must not drop a wall.
            edges = {}
            for j in range(start, len(indices), 3):
                tri = [tuple(positions[k]) for k in indices[j:j+3]]
                for a, b in zip(tri, tri[1:] + tri[:1]):
                    edge = tuple(sorted((a, b)))
                    edges[edge] = edges.get(edge, 0) + 1
            assert all(count == 2 for count in edges.values()), 'Stair roof must be watertight'
        ranges.append({'sourceId': p['sourceId'], 'name': p['name'], 'firstIndex': start, 'indexCount': len(indices)-start})
    primitive = {'attributes': {'POSITION': accessor(positions, 3), 'NORMAL': accessor(normals, 3),
                                'TEXCOORD_0': accessor(uvs, 2)},
                 'indices': accessor(indices, 1, True), 'material': mat_ids[material]}
    name = f'{group}_{material}'.replace('-', '_')
    gltf['meshes'].append({'name': name, 'primitives': [primitive]})
    gltf['nodes'][group_ids[group]]['children'].append(len(gltf['nodes']))
    gltf['nodes'].append({'name': name, 'mesh': len(gltf['meshes'])-1,
                         'extras': {'floorId': group if group.startswith('floor') else None, 'materialRole': material}})
    mapping['batches'].append({'nodeName': name, 'groupId': group, 'materialRole': material, 'parts': ranges})

gltf['buffers'][0]['byteLength'] = len(binary)
binary.extend(b'\0' * (-len(binary) % 4))
js = json.dumps(gltf, separators=(',', ':')).encode()
js += b' ' * (-len(js) % 4)
blob = struct.pack('<III', 0x46546c67, 2, 28+len(js)+len(binary))
blob += struct.pack('<II', len(js), 0x4e4f534a) + js + struct.pack('<II', len(binary), 0x004e4942) + binary
(OUT / 'recplace-exterior.glb').write_bytes(blob)
(OUT / 'recplace-interactions.json').write_text(json.dumps(mapping, separators=(',', ':')) + '\n')
print(f'Built {len(blob):,} byte GLB; {len(gltf["meshes"])} material/floor batches; {len(parts)} presentation parts.')
