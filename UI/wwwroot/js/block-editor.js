let blocks = [];
let isSaving = false;
let lastFocusedListItem = null;
let historyStack = [];
let futureStack = [];
let historyTimer = null;
let historyReady = false;
let isRestoring = false;

function showConfirm(message, confirmText = 'Uygula', cancelText = 'İptal') {
    return new Promise(resolve => {
        const isDark = document.documentElement.classList.contains('dark');
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding-top:100px;opacity:0;transition:opacity 0.25s ease';
        const card = document.createElement('div');
        card.style.cssText = `background:${isDark?'#0f172a':'white'};border-radius:1.5rem;padding:2rem;max-width:420px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);transform:translateY(-30px);transition:transform 0.3s ease;border:1px solid ${isDark?'#334155':'#e2e8f0'}`;
        card.innerHTML = `
            <p style="font-size:1.05rem;font-weight:700;color:${isDark?'#e2e8f0':'#162d42'};margin:0 0 1.5rem;line-height:1.6">${message}</p>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end">
                <button id="confirm-cancel" style="padding:0.75rem 1.5rem;border-radius:0.75rem;border:1px solid ${isDark?'#334155':'#e2e8f0'};background:${isDark?'#1e293b':'white'};color:${isDark?'#94a3b8':'#64748b'};font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s">${cancelText}</button>
                <button id="confirm-ok" style="padding:0.75rem 1.5rem;border-radius:0.75rem;border:none;background:#469d91;color:white;font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s">${confirmText}</button>
            </div>`;
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; card.style.transform = 'translateY(0)'; });
        const close = (v) => { overlay.style.opacity = '0'; card.style.transform = 'translateY(-30px)'; setTimeout(() => { overlay.remove(); resolve(v); }, 250); };
        overlay.querySelector('#confirm-cancel').onclick = () => close(false);
        overlay.querySelector('#confirm-ok').onclick = () => close(true);
        overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    });
}

function cloneState() {
    const titleInput = document.getElementById('noteTitle');
    return {
        title: titleInput ? titleInput.value : '',
        blocks: JSON.parse(JSON.stringify(blocks))
    };
}

function applyState(state) {
    if (!state) return;
    isRestoring = true;
    blocks = JSON.parse(JSON.stringify(state.blocks || []));
    const titleInput = document.getElementById('noteTitle');
    if (titleInput) titleInput.value = state.title || '';
    renderBlocks();
    isRestoring = false;
}

function pushHistorySnapshot() {
    if (!historyReady || isRestoring) return;
    const snapshot = cloneState();
    const last = historyStack[historyStack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
    historyStack.push(snapshot);
    futureStack = [];
    updateHistoryButtons();
}

function scheduleHistorySnapshot() {
    if (!historyReady || isRestoring) return;
    if (historyTimer) clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
        pushHistorySnapshot();
    }, 400);
}

function updateHistoryButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const canUndo = historyStack.length > 1;
    const canRedo = futureStack.length > 0;
    if (undoBtn) {
        undoBtn.disabled = !canUndo;
        undoBtn.classList.toggle('opacity-50', !canUndo);
        undoBtn.classList.toggle('cursor-not-allowed', !canUndo);
    }
    if (redoBtn) {
        redoBtn.disabled = !canRedo;
        redoBtn.classList.toggle('opacity-50', !canRedo);
        redoBtn.classList.toggle('cursor-not-allowed', !canRedo);
    }
}

function initializeHistory() {
    historyStack = [];
    futureStack = [];
    historyReady = true;
    const titleInput = document.getElementById('noteTitle');
    if (titleInput && !titleInput.dataset.historyBound) {
        titleInput.addEventListener('input', scheduleHistorySnapshot);
        titleInput.dataset.historyBound = 'true';
    }
    pushHistorySnapshot();
}

function undoAction() {
    if (historyStack.length <= 1) return;
    const current = historyStack.pop();
    futureStack.push(current);
    const previous = historyStack[historyStack.length - 1];
    applyState(previous);
    updateHistoryButtons();
}

function redoAction() {
    if (futureStack.length === 0) return;
    const next = futureStack.pop();
    historyStack.push(next);
    applyState(next);
    updateHistoryButtons();
}

function addBlock(type, content = null) {
    const tempId = Math.random().toString(36).substr(2, 9);
    blocks.push({
        id: 0,
        tempId,
        type,
        content: content || getDefaultContent(type),
        order: blocks.length + 1
    });
    renderBlocks();
    pushHistorySnapshot();
}

function moveBlock(tempId, dir) {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex(b => b.tempId === tempId);
    if (i === -1) return;
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const block = sorted[i];
    const other = sorted[j];
    [block.order, other.order] = [other.order, block.order];
    renderBlocks();
    pushHistorySnapshot();
}

function deleteBlock(tempId) {
    blocks = blocks.filter(b => b.tempId !== tempId);
    renderBlocks();
    pushHistorySnapshot();
}

function updateBlockContent(tempId, prop, value) {
    const block = blocks.find(b => b.tempId === tempId);
    if (block) {
        block.content[prop] = value;
        scheduleHistorySnapshot();
    }
}

async function applyTemplate() {
    const confirmed = await showConfirm('Şablon uygulansın mı?<br><span style="font-size:0.85rem;font-weight:400;color:#94a3b8">Mevcut tüm bloklar silinecektir.</span>');
    if (!confirmed) return;
    blocks = [];
    addBlock('Heading',       { text: 'Özet Anlatım', level: 2, color: 'black' });
    addBlock('Paragraph',     { html: 'Bu döküman dersin temel konularını ve uygulamalarını kapsamaktadır.' });
    addBlock('Heading',       { text: 'Video Anlatımı', level: 3, color: 'black' });
    addBlock('Video',         { url: '', caption: 'Konu Videosu' });
    addBlock('Heading',       { text: 'Konu Görselleri', level: 3, color: 'black' });
    addBlock('Image',         { url: 'https://via.placeholder.com/800x400', caption: 'Konu Görseli' });
    addBlock('ImportantNote', { text: 'Önemli: Bu bölümü dikkatlice okuyun.' });
    addBlock('List',          { items: ['Birinci madde', 'İkinci madde', 'Üçüncü madde'] });
    addBlock('Paragraph',     { html: 'Daha fazla kaynak için kütüphane bölümünü ziyaret edin.' });
    renderBlocks();
    pushHistorySnapshot();
}

function renderBlocks() {
    const list = document.getElementById('blockList');
    if (!list) return;
    list.innerHTML = '';

    [...blocks].sort((a, b) => a.order - b.order).forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.className = `block-wrapper block-${block.type.toLowerCase()}`;
        wrapper.dataset.tempId = block.tempId;

        wrapper.innerHTML = `
            <div class="block-header">
                <span class="block-type-badge">${block.type}</span>
                <div class="block-actions flex space-x-1">
                    <button type="button" onclick="moveBlock('${block.tempId}', -1)" class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal" title="Yukarı taşı"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>
                    <button type="button" onclick="moveBlock('${block.tempId}', 1)"  class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal" title="Aşağı taşı"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>
                    <button type="button" onclick="deleteBlock('${block.tempId}')"  class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Sil"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="block-content">
                ${buildBlockEditor(block)}
            </div>
        `;
        list.appendChild(wrapper);
    });

    list.querySelectorAll('textarea[data-tempid]').forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        ta.addEventListener('input', () => {
            const blk = blocks.find(b => b.tempId === ta.dataset.tempid);
            if (blk) blk.content[ta.dataset.prop] = ta.value;
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
            scheduleHistorySnapshot();
        });
    });

    list.querySelectorAll('[contenteditable][data-tempid]').forEach(el => {
        if (el.dataset.idx !== undefined) {
            el.addEventListener('focus', () => { lastFocusedListItem = el; });
            el.addEventListener('input', () => {
                updateListItem(el.dataset.tempid, parseInt(el.dataset.idx), el.innerHTML);
                scheduleHistorySnapshot();
            });
        } else {
            el.addEventListener('input', () => {
                const blk = blocks.find(b => b.tempId === el.dataset.tempid);
                if (blk) blk.content[el.dataset.prop] = el.innerHTML;
                scheduleHistorySnapshot();
            });
        }
    });

    if (window.lucide) window.lucide.createIcons();
    updateHistoryButtons();
}

function buildBlockEditor(block) {
    if (block.type === 'Heading') return buildHeadingEditor(block);
    if (block.type === 'Subheading') return buildSubheadingEditor(block);
    if (block.type === 'Paragraph') return buildParagraphEditor(block);
    if (block.type === 'ImportantNote') {
        return `<textarea data-tempid="${block.tempId}" data-prop="text" placeholder="Buraya yazın..." rows="1" class="importantnote-textarea">${escapeForAttr(block.content.text || '')}</textarea>`;
    }
    if (block.type === 'Quote') {
        return `<textarea data-tempid="${block.tempId}" data-prop="text" placeholder="Buraya yazın..." rows="1">${escapeForAttr(block.content.text || '')}</textarea>`;
    }
    if (block.type === 'Image' || block.type === 'Video') return buildMediaEditor(block);
    if (block.type === 'Code') {
        return `<textarea class="w-full font-mono text-sm" data-tempid="${block.tempId}" data-prop="code" placeholder="Kod buraya..." rows="5">${escapeForAttr(block.content.code || '')}</textarea>`;
    }
    if (block.type === 'List') return buildListEditor(block);
    return `<div class="text-sm text-slate-400">Desteklenmeyen blok tipi.</div>`;
}

function buildHeadingEditor(block) {
    const c = block.content;
    const colorMap = { black: '#162d42', blue: '#2563eb', red: '#dc2626' };
    const colorOpt = (id, prop, val) => {
        const active = (c[prop] || 'black') === val;
        const hex = { black: '#1e293b', blue: 'blue', red: 'red' }[val];
        return `<button type="button" class="hd-color-btn ${active ? 'active' : ''}" onclick="updateHeadingProp('${id}','${prop}','${val}')"><span style="color:${hex}">A</span></button>`;
    };
    return `
        <div class="heading-editor">
            <textarea data-tempid="${block.tempId}" data-prop="text" placeholder="Başlık..." rows="1" class="heading-textarea" style="color:${colorMap[c.color || 'black']}">${escapeForAttr(c.text || '')}</textarea>
            <div class="heading-colors-row">
                <span class="hd-label">Renk:</span>
                ${colorOpt(block.tempId,'color','black')}
                ${colorOpt(block.tempId,'color','blue')}
                ${colorOpt(block.tempId,'color','red')}
            </div>
        </div>
    `;
}

function buildSubheadingEditor(block) {
    const c = block.content;
    const colorMap = { black: '#162d42', blue: '#2563eb', red: '#dc2626' };
    const colorOpt = (id, prop, val) => {
        const active = (c[prop] || 'black') === val;
        const hex = { black: '#1e293b', blue: 'blue', red: 'red' }[val];
        return `<button type="button" class="hd-color-btn ${active ? 'active' : ''}" onclick="updateHeadingProp('${id}','${prop}','${val}')"><span style="color:${hex}">A</span></button>`;
    };
    return `
        <div class="subheading-editor">
            <div class="subheading-input-row">
                <span class="subheading-dash">- </span>
                <textarea data-tempid="${block.tempId}" data-prop="text" placeholder="Alt başlık..." rows="1" class="subheading-textarea" style="color:${colorMap[c.color || 'black']}">${escapeForAttr(c.text || '')}</textarea>
            </div>
            <div class="heading-colors-row">
                <span class="hd-label">Renk:</span>
                ${colorOpt(block.tempId,'color','black')}
                ${colorOpt(block.tempId,'color','blue')}
                ${colorOpt(block.tempId,'color','red')}
            </div>
        </div>
    `;
}

function updateHeadingProp(tempId, prop, value) {
    const block = blocks.find(b => b.tempId === tempId);
    if (!block) return;
    block.content[prop] = value;
    if (prop === 'color') renderBlocks();
    scheduleHistorySnapshot();
}

function buildParagraphEditor(block) {
    const html = block.content.html || block.content.text || '';
    return `
        <div class="paragraph-editor">
            <div class="format-toolbar" id="fmt-toolbar-${block.tempId}">
                <button type="button" class="fmt-btn" onclick="formatCmd('${block.tempId}', 'bold')" title="Kalın"><strong>B</strong></button>
                <button type="button" class="fmt-btn" onclick="formatCmd('${block.tempId}', 'italic')" title="İtalik"><em>I</em></button>
                <button type="button" class="fmt-btn" onclick="formatCmd('${block.tempId}', 'foreColor', 'black')" title="Siyah"><span style="color:#1e293b">A</span></button>
                <button type="button" class="fmt-btn fmt-blue" onclick="formatCmd('${block.tempId}', 'foreColor', 'blue')" title="Mavi"><span style="color:blue">A</span></button>
                <button type="button" class="fmt-btn fmt-red" onclick="formatCmd('${block.tempId}', 'foreColor', 'red')" title="Kırmızı"><span style="color:red">A</span></button>
                <button type="button" class="fmt-btn" onclick="formatCmd('${block.tempId}', 'removeFormat')" title="Temizle" style="font-size:0.9rem">↺</button>
            </div>
            <div class="paragraph-content" contenteditable="true" data-tempid="${block.tempId}" data-prop="html" id="para-${block.tempId}">${html}</div>
        </div>
    `;
}

function formatCmd(tempId, cmd, value) {
    const el = document.getElementById(`para-${tempId}`);
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) {
        return;
    }
    document.execCommand(cmd, false, value || null);
    el.dispatchEvent(new Event('input'));
}

function buildListEditor(block) {
    const intro = block.content.intro || '';
    const items = block.content.items || [''];
    let html = '<div class="list-editor">';
    html += `<div class="list-intro-editor"><div class="list-intro-fmt-toolbar">
        <button type="button" class="fmt-btn" onclick="formatListIntroCmd('${block.tempId}', 'bold')" title="Kalın"><strong>B</strong></button>
        <button type="button" class="fmt-btn" onclick="formatListIntroCmd('${block.tempId}', 'italic')" title="İtalik"><em>I</em></button>
        <button type="button" class="fmt-btn" onclick="formatListIntroCmd('${block.tempId}', 'foreColor', 'black')" title="Siyah"><span style="color:#1e293b">A</span></button>
        <button type="button" class="fmt-btn fmt-blue" onclick="formatListIntroCmd('${block.tempId}', 'foreColor', 'blue')" title="Mavi"><span style="color:blue">A</span></button>
        <button type="button" class="fmt-btn fmt-red" onclick="formatListIntroCmd('${block.tempId}', 'foreColor', 'red')" title="Kırmızı"><span style="color:red">A</span></button>
        <button type="button" class="fmt-btn" onclick="formatListIntroCmd('${block.tempId}', 'removeFormat')" title="Temizle" style="font-size:0.9rem">↺</button>
    </div><div contenteditable="true" class="list-intro-content" data-tempid="${block.tempId}" data-prop="intro" id="list-intro-${block.tempId}">${intro}</div></div>`;
    html += `<div class="list-fmt-toolbar">
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'bold')" title="Kalın"><strong>B</strong></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'italic')" title="İtalik"><em>I</em></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'foreColor', 'black')" title="Siyah"><span style="color:#1e293b">A</span></button>
        <button type="button" class="fmt-btn fmt-blue" onclick="formatListCmd('${block.tempId}', 'foreColor', 'blue')" title="Mavi"><span style="color:blue">A</span></button>
        <button type="button" class="fmt-btn fmt-red" onclick="formatListCmd('${block.tempId}', 'foreColor', 'red')" title="Kırmızı"><span style="color:red">A</span></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'removeFormat')" title="Temizle" style="font-size:0.9rem">↺</button>
    </div>`;
    items.forEach((item, idx) => {
        html += `
            <div class="list-item-row">
                <span class="list-number">${idx + 1}.</span>
                <div contenteditable="true" class="list-item-content" data-tempid="${block.tempId}" data-idx="${idx}" id="list-item-${block.tempId}-${idx}">${item}</div>
                ${items.length > 1 ? `<button type="button" class="list-item-remove" onclick="removeListItem('${block.tempId}', ${idx})" title="Kaldır">×</button>` : ''}
                <button type="button" class="list-item-add" onclick="addListItem('${block.tempId}', ${idx + 1})" title="Ekle">+</button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function formatListCmd(tempId, cmd, value) {
    const el = lastFocusedListItem;
    if (!el || !el.classList.contains('list-item-content') || el.dataset.tempid !== tempId) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) {
        const range = document.createRange();
        range.setStart(el, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    document.execCommand(cmd, false, value || null);
    el.dispatchEvent(new Event('input'));
}

function formatListIntroCmd(tempId, cmd, value) {
    const el = document.getElementById(`list-intro-${tempId}`);
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) {
        const range = document.createRange();
        range.setStart(el, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    document.execCommand(cmd, false, value || null);
    el.dispatchEvent(new Event('input'));
}

function getDefaultContent(type) {
    switch (type) {
        case 'Heading':       return { text: '', level: 2, color: 'black' };
        case 'Paragraph':     return { html: '' };
        case 'ImportantNote': return { text: '' };
        case 'Quote':         return { text: '' };
        case 'Image':         return { url: '', caption: '' };
        case 'Video':         return { url: '', caption: '' };
        case 'Code':          return { code: '', language: 'javascript' };
        case 'Subheading':    return { text: '', color: 'black', level: 3 };
        case 'List':          return { intro: '', items: [''] };
        default:              return {};
    }
}

function updateListItem(tempId, idx, value) {
    const block = blocks.find(b => b.tempId === tempId);
    if (!block) return;
    if (!block.content.items) block.content.items = [''];
    block.content.items[idx] = value;
    scheduleHistorySnapshot();
}

function addListItem(tempId, afterIdx) {
    const block = blocks.find(b => b.tempId === tempId);
    if (!block) return;
    if (!block.content.items) block.content.items = [''];
    block.content.items.splice(afterIdx, 0, '');
    renderBlocks();
    pushHistorySnapshot();
    setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-tempid="${tempId}"].list-item-content`);
        if (inputs[afterIdx]) inputs[afterIdx].focus();
    }, 0);
}

function removeListItem(tempId, idx) {
    const block = blocks.find(b => b.tempId === tempId);
    if (!block) return;
    if (block.content.items.length <= 1) return;
    block.content.items.splice(idx, 1);
    renderBlocks();
    pushHistorySnapshot();
}

function buildMediaEditor(block) {
    const isVideo = block.type === 'Video';
    const url     = block.content.url     || '';
    const caption = block.content.caption || '';
    const previewId = `media-preview-${block.tempId}`;
    const urlId     = `media-url-${block.tempId}`;
    const accept    = isVideo ? 'video/*' : 'image/*';
    const placeholder = isVideo ? 'Video URL (YouTube veya direkt link)' : "Resim URL'si";

    const previewHtml = buildMediaPreview(block.type, url, previewId);

    return `
        <div class="space-y-3">
            <div class="flex gap-2">
                <input type="text" id="${urlId}" value="${escapeForAttr(url)}" placeholder="${placeholder}" class="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/40 transition" oninput="onMediaUrlInput('${block.tempId}', '${block.type}', this.value, '${previewId}')" />
                <label class="px-5 py-3 bg-brand-teal hover:bg-brand-teal-light text-white rounded-xl cursor-pointer text-sm font-bold transition-all shadow shadow-teal-500/20 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="upload" class="w-4 h-4"></i> Yükle
                    <input type="file" class="hidden" accept="${accept}" onchange="onMediaFileSelect('${block.tempId}', '${block.type}', this.files[0], '${previewId}', '${urlId}')" />
                </label>
            </div>
            <input type="text" value="${escapeForAttr(caption)}" placeholder="Açıklama (Opsiyonel)" class="w-full px-3 py-2 text-xs text-slate-500 bg-transparent border-b border-slate-100 dark:border-slate-700 outline-none focus:border-brand-teal transition" oninput="updateBlockContent('${block.tempId}', 'caption', this.value)" />
            <div id="${previewId}" class="media-preview-box">${previewHtml}</div>
        </div>
    `;
}

function buildMediaPreview(type, url, previewId) {
    if (!url) {
        const icon = type === 'Video' ? 'video' : 'image';
        const label = type === 'Video' ? 'Video eklenmedi' : 'Görsel eklenmedi';
        return `<div class="media-preview-empty"><i data-lucide="${icon}" class="text-slate-300"></i><p class="text-slate-400">${label}</p></div>`;
    }
    if (type === 'Video') {
        const ytId = getYoutubeId(url);
        if (ytId) return `<iframe class="w-full rounded-lg" style="aspect-ratio:16/9;height:120px" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe>`;
        return `<video src="${escapeHtml(url)}" class="w-full rounded-lg max-h-[120px]" controls></video>`;
    }
    return `<img src="${escapeHtml(url)}" class="w-full rounded-lg max-h-[120px] object-cover" onerror="this.src='https://via.placeholder.com/400x200?text=Gecersiz+URL'" />`;
}

function onMediaUrlInput(tempId, mediaType, value, previewId) {
    updateBlockContent(tempId, 'url', value);
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = buildMediaPreview(mediaType, value, previewId);
        if (window.lucide) window.lucide.createIcons();
    }
    scheduleHistorySnapshot();
}

async function onMediaFileSelect(tempId, mediaType, file, previewId, urlInputId) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const BASE = 'https://localhost:7078';
        const res = await fetch(`${BASE}/api/media/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed: ' + res.status);
        const data = await res.json();
        const fullUrl = data.url.startsWith('http') ? data.url : BASE + data.url;
        updateBlockContent(tempId, 'url', fullUrl);
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = fullUrl;
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.innerHTML = buildMediaPreview(mediaType, fullUrl, previewId);
            if (window.lucide) window.lucide.createIcons();
        }
        pushHistorySnapshot();
    } catch (e) {
        console.error('Media upload error:', e);
        if (window.showToast) window.showToast('Dosya yüklenirken hata oluştu.', 'error');
    }
}

function openPublishModal()  { document.getElementById('publishModal')?.classList.remove('hidden'); }
function closePublishModal() { document.getElementById('publishModal')?.classList.add('hidden'); }

function confirmPublish() {
    const courseId = document.getElementById('courseSelect')?.value;
    if (!courseId) {
        if (window.showToast) window.showToast('Lütfen bir ders seçin.', 'warning');
        return;
    }
    closePublishModal();
    saveNote(true, courseId);
}

function syncEditorsBeforeSave() {
    document.querySelectorAll('[contenteditable][data-tempid]').forEach(el => {
        const blk = blocks.find(b => b.tempId === el.dataset.tempid);
        if (!blk) return;
        if (el.dataset.idx !== undefined) {
            if (!blk.content.items) blk.content.items = [''];
            blk.content.items[parseInt(el.dataset.idx)] = el.innerHTML;
        } else if (el.dataset.prop) {
            blk.content[el.dataset.prop] = el.innerHTML;
        }
    });
}

async function saveNote(isPublish, selectedCourseId = null) {
    if (isSaving) return;

    const title = document.getElementById('noteTitle')?.value?.trim();
    if (!title) {
        if (window.showToast) window.showToast('Lütfen bir not başlığı girin.', 'warning');
        return;
    }

    if (isPublish && !selectedCourseId) {
        openPublishModal();
        return;
    }

    try {
        isSaving = true;
        setSavingState(true);

        syncEditorsBeforeSave();

        const method = noteId > 0 ? 'PUT' : 'POST';
        const noteUrl = noteId > 0
            ? `https://localhost:7078/api/admin/notes/${noteId}`
            : 'https://localhost:7078/api/admin/notes';

        const noteRes = await fetch(noteUrl, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                courseId: selectedCourseId ? parseInt(selectedCourseId) : null,
                status: isPublish ? 'Published' : 'Draft'
            })
        });

        if (!noteRes.ok) {
            const err = await noteRes.json().catch(() => ({}));
            throw new Error(err.error || 'Not kaydedilirken hata oluştu.');
        }

        const savedNote = await noteRes.json();
        const targetId = savedNote.id;

        const blocksPayload = [...blocks].sort((a, b) => a.order - b.order).map((b, i) => ({
            id: b.id || 0,
            type: b.type,
            order: i + 1,
            content: b.content
        }));

        const blocksRes = await fetch(`https://localhost:7078/api/admin/notes/${targetId}/blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blocksPayload)
        });

        if (!blocksRes.ok) {
            const err = await blocksRes.json().catch(() => ({}));
            throw new Error(err.error || `Bloklar kaydedilemedi (HTTP ${blocksRes.status}).`);
        }

        if (isPublish) {
            const pubRes = await fetch(`https://localhost:7078/api/admin/notes/${targetId}/publish`, { method: 'POST' });
            if (!pubRes.ok) throw new Error('Yayınlama başarısız.');
        }

        window.location.href = '/Admin';

    } catch (e) {
        console.error('saveNote error:', e);
        if (window.showToast) window.showToast(e.message || 'Kaydetme hatası.', 'error');
        setSavingState(false);
        isSaving = false;
    }
}

async function loadNote(id) {
    try {
        const res = await fetch(`https://localhost:7078/api/admin/notes/${id}`);
        if (!res.ok) throw new Error('Not yüklenemedi: ' + res.status);
        const data = await res.json();

        const titleEl = document.getElementById('noteTitle');
        if (titleEl) titleEl.value = data.title || '';

        blocks = (data.blocks || []).map(b => {
            let content = b.content;
            if (typeof content === 'string') {
                try { content = JSON.parse(content); } catch { content = { text: content }; }
            }
            return {
                id:      b.id || 0,
                tempId:  Math.random().toString(36).substr(2, 9),
                type:    getNoteBlockTypeEnumString(b.type),
                content: content || {},
                order:   b.order
            };
        });

        renderBlocks();
    } catch (e) {
        console.error('loadNote error:', e);
    }
}

function setSavingState(busy) {
    document.querySelectorAll('.editor-actions-bar button').forEach(btn => {
        btn.disabled = busy;
        btn.classList.toggle('opacity-60', busy);
        btn.classList.toggle('cursor-not-allowed', busy);
    });
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function getYoutubeId(url) {
    if (!url) return '';
    const s = url.toString();
    if (s.includes('v='))        return s.split('v=')[1].split('&')[0];
    if (s.includes('youtu.be/')) return s.split('youtu.be/')[1].split('?')[0];
    return '';
}

function extractMediaUrlFromHtml(html) {
    if (!html) return '';
    const hrefMatch = html.match(/href=["']([^"']+)["']/i);
    if (hrefMatch) return hrefMatch[1];
    return html.replace(/<[^>]*>/g, '').trim();
}

function isImageUrl(value) {
    if (!value) return false;
    const clean = value.split('?')[0].split('#')[0];
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(clean);
}

function isVideoUrl(value) {
    if (!value) return false;
    const clean = value.split('?')[0].split('#')[0];
    return /\.(mp4|webm|ogg|mov)$/i.test(clean);
}

function escapeHtml(v) {
    return (v ?? '').toString().replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeForAttr(v) {
    return escapeHtml(v).replace(/\n/g, '&#10;');
}

function getNoteBlockTypeEnumString(value) {
    if (value === null || value === undefined) return 'Paragraph';
    const numMap = { 0: 'Paragraph', 1: 'Heading', 2: 'ImportantNote', 3: 'Video', 4: 'Image', 5: 'DoubleImage', 6: 'Code', 7: 'Quote', 8: 'List', 9: 'Subheading' };
    if (typeof value === 'number') return numMap[value] || 'Paragraph';
    const n = parseInt(value, 10);
    if (!isNaN(n)) return numMap[n] || 'Paragraph';
    const strMap = { paragraph:'Paragraph', heading:'Heading', subheading:'Subheading', importantnote:'ImportantNote', video:'Video', image:'Image', doubleimage:'DoubleImage', code:'Code', quote:'Quote', list:'List' };
    return strMap[value.trim().toLowerCase()] || 'Paragraph';
}

function getNoteBlockTypeEnumValue(s) {
    return { Paragraph:0, Heading:1, ImportantNote:2, Video:3, Image:4, DoubleImage:5, Code:6, Quote:7, List:8, Subheading:9 }[s] ?? 0;
}

function previewNote() {
    const modal = document.getElementById('previewModal');
    const titleEl = document.getElementById('previewTitle');
    const contentEl = document.getElementById('previewContent');
    const titleInput = document.getElementById('noteTitle');

    if (!modal || !titleEl || !contentEl) return;
    syncEditorsBeforeSave();
    titleEl.textContent = titleInput?.value?.trim() || 'Önizleme';
    contentEl.innerHTML = '';
    renderPreviewBlocks(contentEl, blocks);
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    const titleEl = document.getElementById('previewTitle');
    const contentEl = document.getElementById('previewContent');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    if (titleEl) titleEl.textContent = '';
    if (contentEl) contentEl.innerHTML = '';
}

function renderPreviewBlocks(container, items) {
    if (!items || !items.length) {
        container.innerHTML = '<p class="text-slate-400 italic">Henüz blok eklenmedi.</p>';
        return;
    }
    [...items].sort((a, b) => a.order - b.order).forEach(block => {
        const el = document.createElement('div');
        el.className = 'mb-10';
        const t = getNoteBlockTypeEnumString(block.type);

        if (t === 'Heading') {
            const lvl = Math.min(Math.max(parseInt(block.content?.level ?? 2), 1), 4);
            const textColor = { black:'#162d42', blue:'#2563eb', red:'#dc2626' }[block.content?.color] || '#162d42';
            el.innerHTML = `<h${lvl} class="text-4xl font-black mt-12 mb-4 tracking-tight uppercase border-l-4 border-brand-teal pl-5" style="color:${textColor}">${escapeHtml(block.content?.text || '')}</h${lvl}>`;
        } else if (t === 'Subheading') {
            const textColor = { black:'#162d42', blue:'#2563eb', red:'#dc2626' }[block.content?.color] || '#162d42';
            el.innerHTML = `<h3 class="text-2xl font-bold mt-6 mb-3 tracking-tight" style="color:${textColor}"><span class="subheading-dash">- </span>${escapeHtml(block.content?.text || '')}</h3>`;
        } else if (t === 'ImportantNote') {
            el.innerHTML = `<div class="p-7 rounded-3xl text-white shadow-xl" style="background:#2d7a6f"><div class="flex items-center gap-3 mb-2"><i data-lucide="info" class="w-5 h-5"></i><strong class="italic underline underline-offset-4">Önemli Bilgi</strong></div><p class="leading-relaxed">${escapeHtml(block.content?.text)}</p></div>`;
        } else if (t === 'Code') {
            el.innerHTML = `<div class="p-6 rounded-3xl bg-slate-900 border border-white/10"><pre class="text-teal-300 font-mono text-sm overflow-x-auto"><code>${escapeHtml(block.content?.code)}</code></pre></div>`;
        } else if (t === 'Image') {
            const cap = escapeHtml(block.content?.caption);
            el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><img src="${escapeHtml(block.content?.url)}" class="w-full h-auto object-cover" alt="${cap}" />${cap ? `<p class="text-xs text-center mt-2 text-slate-400 font-semibold uppercase tracking-widest">${cap}</p>` : ''}</div>`;
        } else if (t === 'Video') {
            const url = (block.content?.url || '').toString().trim();
            const ytId = getYoutubeId(url);
            const cap = escapeHtml(block.content?.caption);
            if (ytId) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><iframe class="w-full" style="aspect-ratio:16/9" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>${cap ? `<p class="text-xs text-center mt-2 text-slate-400 font-semibold uppercase tracking-widest">${cap}</p>` : ''}`;
            } else if (url) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><video class="w-full" controls><source src="${escapeHtml(url)}" /></video></div>${cap ? `<p class="text-xs text-center mt-2 text-slate-400 font-semibold uppercase tracking-widest">${cap}</p>` : ''}`;
            } else {
                el.innerHTML = '<p class="text-slate-400 italic">Video URL girilmedi.</p>';
            }
        } else if (t === 'List') {
            const intro = block.content?.intro || '';
            const items = block.content?.items || [];
            const introHtml = intro ? `<p class="text-lg text-slate-600 dark:text-slate-300 mb-3 font-medium">${escapeHtml(intro)}</p>` : '';
            const lis = items.filter(i => i.trim()).map(i => `<li class="mb-1">${escapeHtml(i)}</li>`).join('');
            el.innerHTML = `${introHtml}<ol class="list-decimal pl-6 text-lg text-slate-600 dark:text-slate-300 space-y-1 font-medium">${lis}</ol>`;
        } else if (t === 'Paragraph') {
            const html = block.content?.html || block.content?.text || '';
            const mediaUrl = extractMediaUrlFromHtml(html);
            const ytId = getYoutubeId(mediaUrl);
            if (ytId) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><iframe class="w-full" style="aspect-ratio:16/9" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else if (isImageUrl(mediaUrl)) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><img src="${escapeHtml(mediaUrl)}" class="w-full h-auto object-cover" alt="Görsel" /></div>`;
            } else if (isVideoUrl(mediaUrl)) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><video class="w-full" controls><source src="${escapeHtml(mediaUrl)}" /></video></div>`;
            } else {
                el.innerHTML = `<div class="text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium">${html}</div>`;
            }
        } else if (t === 'Quote') {
            const textValue = (block.content?.text || '').toString().trim();
            const mediaUrl = extractMediaUrlFromHtml(textValue);
            const ytId = getYoutubeId(mediaUrl);
            if (ytId) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><iframe class="w-full" style="aspect-ratio:16/9" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>`;
            } else if (isImageUrl(mediaUrl)) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><img src="${escapeHtml(mediaUrl)}" class="w-full h-auto object-cover" alt="Görsel" /></div>`;
            } else if (isVideoUrl(mediaUrl)) {
                el.innerHTML = `<div class="rounded-3xl overflow-hidden shadow-xl"><video class="w-full" controls><source src="${escapeHtml(mediaUrl)}" /></video></div>`;
            } else {
                el.innerHTML = `<blockquote class="border-l-4 border-brand-teal pl-5 text-xl italic text-slate-600 dark:text-slate-300">${escapeHtml(textValue)}</blockquote>`;
            }
        } else {
            el.innerHTML = `<p class="text-xl leading-relaxed text-slate-600 dark:text-slate-300">${escapeHtml(block.content?.text)}</p>`;
        }

        container.appendChild(el);
    });
    if (window.lucide) window.lucide.createIcons();
}

window.initializeHistory = initializeHistory;
window.undoAction = undoAction;
window.redoAction = redoAction;
window.previewNote = previewNote;
window.closePreviewModal = closePreviewModal;


