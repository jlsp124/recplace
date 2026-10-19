"""Export the curated October construction media; requires FFmpeg and Pillow."""

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
VIDEO = 'DJI_20261005164353_0148_D.MP4'
PHOTOS = {
    'october-13-painted-exterior': ('DJI_20261013094054_0202_D.JPG', None),
    'september-17-exterior-paint': ('DJI_20260917180201_0046_D.JPG', None),
    'september-23-window-installation': ('DJI_20260923182506_0091_D.JPG', None),
    'october-13-roof-detail': ('DJI_20261013094105_0203_D.JPG', (500, 360, 3620, 2115)),
}


def run(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', *map(str, args)], check=True)


def webp(image, destination, width, quality):
    size = (width, round(image.height * width / image.width))
    image.resize(size, Image.Resampling.LANCZOS).save(destination, 'WEBP', quality=quality, method=6)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, default=Path('D:/DCIM/DJI_001'))
    parser.add_argument('--images-only', action='store_true', help='Export stills without re-encoding the unchanged hero video')
    args = parser.parse_args()
    source = args.source_dir
    for name in [*([VIDEO] if not args.images_only else []), *(name for name, _ in PHOTOS.values())]:
        if not (source / name).is_file():
            raise FileNotFoundError(source / name)

    updates = ROOT / 'Assets/updates'
    videos = ROOT / 'Assets/video'
    updates.mkdir(exist_ok=True)
    videos.mkdir(exist_ok=True)

    for stem, (filename, crop) in PHOTOS.items():
        with Image.open(source / filename) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            if crop:
                image = image.crop(crop)
            for width, quality in [(1600, 84), (960, 82)]:
                output = updates / f'{stem}-{width}.webp'
                webp(image, output, width, quality)
                print(f'{output.name}: {output.stat().st_size:,} bytes', flush=True)

    if args.images_only:
        return

    # The settled 4.5-second pass near the end of the flight, at half speed,
    # uses the original 60 fps frames
    # to produce 30 fps. Move the first 0.8 seconds to the end as a dissolve,
    # so the final frame leads directly into the first frame on repeat.
    for width, crf, rate in [(1440, 24, 2400), (960, 26, 1200)]:
        graph = (
            f'[0:v:0]setpts=2*(PTS-STARTPTS),fps=30,scale={width}:-2:flags=lanczos,'
            'setsar=1,split=2[a][b];'
            '[a]trim=start=0.8:end=9,setpts=PTS-STARTPTS[body];'
            '[b]trim=start=0:end=0.8,setpts=PTS-STARTPTS[head];'
            '[body][head]xfade=transition=fade:duration=0.8:offset=7.4,format=yuv420p[v]'
        )
        output = videos / f'recplace-october-5-orbit-{width}.mp4'
        run('-ss', '128.5', '-t', '4.5', '-i', source / VIDEO,
            '-filter_complex', graph, '-map', '[v]', '-an', '-sn', '-dn',
            '-map_metadata', '-1', '-map_chapters', '-1', '-c:v', 'libx264',
            '-preset', 'slow', '-crf', crf, '-maxrate', f'{rate}k', '-bufsize', f'{rate * 2}k',
            '-movflags', '+faststart', '-y', output)
        print(f'{output.name}: {output.stat().st_size:,} bytes', flush=True)

    # Use the loop's first frame to avoid a visual jump when playback begins.
    with tempfile.TemporaryDirectory(prefix='recplace-media-') as temporary:
        frame = Path(temporary) / 'poster.png'
        run('-ss', '128.9', '-i', source / VIDEO, '-map', '0:v:0', '-frames:v', '1', '-y', frame)
        with Image.open(frame) as image:
            for width in [1600, 960]:
                output = videos / f'recplace-october-5-poster-{width}.webp'
                webp(image, output, width, 83)
                print(f'{output.name}: {output.stat().st_size:,} bytes', flush=True)


if __name__ == '__main__':
    main()
