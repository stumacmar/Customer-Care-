#!/usr/bin/env python3
"""
Does each video say what its script says? Transcribes the narration with an
offline recogniser (vosk, small en-gb model) and compares it with the script.
The recogniser is imperfect, so the check is a similarity ratio, not equality:
anything under the threshold is printed for a human to listen to.

    python3 tools/media/stt-check.py            # every video
    python3 tools/media/stt-check.py snag demo  # some
"""
import difflib, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
MODEL = os.path.join(HERE, '.cache', 'stt', 'vosk-model-small-en-gb-0.15')
THRESHOLD = 0.72

from vosk import Model, KaldiRecognizer, SetLogLevel  # noqa: E402

SetLogLevel(-1)


def script_text(slug):
    js = subprocess.run(
        ['node', '--input-type=module', '-e',
         "import('%s/scripts.mjs').then(m => { const s = '%s' === 'demo' ? m.TOUR : m.SCENARIOS['%s']; console.log(JSON.stringify(s.lines.map(l => l.say))) })" % (HERE, slug, slug)],
        capture_output=True, text=True, check=True).stdout
    return ' '.join(json.loads(js))


def norm(s):
    s = s.lower().replace('’', "'")
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    return ' '.join(s.split())


def transcribe(path, model):
    proc = subprocess.Popen(['ffmpeg', '-loglevel', 'quiet', '-i', path, '-ar', '16000', '-ac', '1', '-f', 's16le', '-'], stdout=subprocess.PIPE)
    rec = KaldiRecognizer(model, 16000)
    words = []
    while True:
        data = proc.stdout.read(4000)
        if not data:
            break
        if rec.AcceptWaveform(data):
            words.append(json.loads(rec.Result()).get('text', ''))
    words.append(json.loads(rec.FinalResult()).get('text', ''))
    return ' '.join(w for w in words if w)


def main():
    slugs = sys.argv[1:]
    if not slugs:
        slugs = ['demo'] + sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, 'public', 'videos')) if f.endswith('.mp4'))
    model = Model(MODEL)
    worst = 1.0
    for slug in slugs:
        path = os.path.join(ROOT, 'public', 'demo.mp4' if slug == 'demo' else f'videos/{slug}.mp4')
        heard = norm(transcribe(path, model))
        want = norm(script_text(slug))
        ratio = difflib.SequenceMatcher(None, want.split(), heard.split()).ratio()
        worst = min(worst, ratio)
        flag = 'ok ' if ratio >= THRESHOLD else 'CHECK'
        print(f'{flag} {slug:26s} similarity {ratio:.2f}  script {len(want.split())} words, heard {len(heard.split())}')
        if ratio < THRESHOLD:
            for line in difflib.unified_diff(want.split(), heard.split(), 'script', 'heard', lineterm='', n=2):
                print('   ', line)
    print(f'lowest similarity {worst:.2f} (threshold {THRESHOLD})')
    sys.exit(0 if worst >= THRESHOLD else 1)


if __name__ == '__main__':
    main()
