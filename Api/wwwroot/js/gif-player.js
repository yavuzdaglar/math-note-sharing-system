import { parseGIF, decompressFrames } from './vendor/gifuct.js';

const players = new Map();

function startPlayback(canvas, frames, state) {
    const ctx = canvas.getContext('2d');

    const draw = (i) => {
        const f = frames[i];
        if (canvas.width !== f.dims.width) canvas.width = f.dims.width;
        if (canvas.height !== f.dims.height) canvas.height = f.dims.height;
        ctx.putImageData(new ImageData(f.patch, f.dims.width, f.dims.height), f.dims.left || 0, f.dims.top || 0);
    };

    const tick = (now) => {
        if (!state.active) return;
        if (now >= state.nextTime) {
            draw(state.frameIndex);
            state.frameIndex = (state.frameIndex + 1) % frames.length;
            const delay = (frames[state.frameIndex] && frames[state.frameIndex].delay > 0) ? frames[state.frameIndex].delay : 50;
            state.nextTime = now + delay / state.speed;
        }
        state.rafId = requestAnimationFrame(tick);
    };

    draw(0);
    state.nextTime = performance.now() + ((frames[0] && frames[0].delay > 0) ? frames[0].delay : 50) / state.speed;
    state.rafId = requestAnimationFrame(tick);
}

function loadGif(canvas, url, state) {
    fetch(url)
        .then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.arrayBuffer();
        })
        .then((buf) => {
            if (!state.active) return;
            const gif = parseGIF(buf);
            const frames = decompressFrames(gif, true);
            if (!frames || !frames.length) throw new Error('GIF karesi bulunamadi');
            if (!state.active) return;
            startPlayback(canvas, frames, state);
        })
        .catch((err) => {
            if (!state.active) return;
            console.error('GIF yuklenemedi:', err);
            if (canvas.parentElement) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'GIF';
                img.style.cssText = 'width:100%;height:auto;border-radius:0.75rem;background:transparent;display:block;';
                canvas.replaceWith(img);
            }
        });
}

window.GifPlayer = {
    play(canvas, url, speed) {
        if (!canvas || !url) return;
        const existing = players.get(canvas);
        if (existing) {
            existing.active = false;
            if (existing.rafId) cancelAnimationFrame(existing.rafId);
        }
        const state = {
            active: true,
            rafId: null,
            speed: Math.max(0.1, Number(speed) || 1),
            frameIndex: 0,
            nextTime: 0
        };
        players.set(canvas, state);
        loadGif(canvas, url, state);
    },
    setSpeed(canvas, speed) {
        if (!canvas) return;
        const ctrl = players.get(canvas);
        if (ctrl) ctrl.speed = Math.max(0.1, Number(speed) || 1);
    },
    stopAll() {
        players.forEach((ctrl) => {
            ctrl.active = false;
            if (ctrl.rafId) cancelAnimationFrame(ctrl.rafId);
        });
        players.clear();
    }
};
