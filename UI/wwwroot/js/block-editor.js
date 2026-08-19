let blocks = [];
let isSaving = false;
let lastFocusedListItem = null;
const API_BASE_URL = window.API_BASE_URL || 'https://localhost:7078';
const API_TOKEN = window.API_TOKEN || '';

function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (API_TOKEN) headers.set('Authorization', `Bearer ${API_TOKEN}`);
    return fetch(url, { ...options, headers });
}

function apiFetchJson(url, options = {}) {
    const headers = new Headers((options || {}).headers || {});
    headers.set('Content-Type', 'application/json');
    if (API_TOKEN) headers.set('Authorization', `Bearer ${API_TOKEN}`);
    return fetch(url, { ...(options || {}), headers });
}

function normalizeMediaUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
    return url;
}

const mediaServerSaveTimers = {};

async function saveMediaToServer(url) {
    const trimmed = (url || '').trim();
    if (!/^https?:\/\//i.test(trimmed)) return null;
    if (/youtube\.com|youtu\.be|youtube-nocookie\.com/i.test(trimmed)) return null;
    try {
        const res = await apiFetchJson(`${API_BASE_URL}/api/media/from-url`, {
            method: 'POST',
            body: JSON.stringify({ url: trimmed })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.url || null;
    } catch (e) {
        console.error('Media server save error:', e);
        return null;
    }
}

function scheduleMediaServerSave(key, url, onDone) {
    clearTimeout(mediaServerSaveTimers[key]);
    mediaServerSaveTimers[key] = setTimeout(async () => {
        const localUrl = await saveMediaToServer(url);
        if (localUrl && typeof onDone === 'function') onDone(localUrl);
    }, 1200);
}

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

function addBlock(type, content = null, gridTempId = null, colIdx = null, insertIndex = null) {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newBlock = {
        id: 0,
        tempId,
        type,
        content: content || getDefaultContent(type),
        order: 0
    };
    if (gridTempId != null && colIdx != null) {
        const gridBlock = findBlockByTempId(gridTempId);
        if (!gridBlock) return;
        const colBlocks = gridBlock.content.columnBlocks[colIdx];
        newBlock.order = colBlocks.length + 1;
        if (insertIndex === null || insertIndex === undefined || insertIndex < 0 || insertIndex > colBlocks.length) {
            colBlocks.push(newBlock);
        } else {
            colBlocks.splice(insertIndex, 0, newBlock);
        }
    } else {
        newBlock.order = blocks.length + 1;
        if (insertIndex === null || insertIndex === undefined || insertIndex < 0 || insertIndex > blocks.length) {
            blocks.push(newBlock);
        } else {
            blocks.splice(insertIndex, 0, newBlock);
        }
    }
    renderBlocks();
}

function moveBlock(tempId, dir) {
    const found = findBlockContainer(tempId);
    if (!found) return;
    const sorted = [...found.container].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex(b => b.tempId === tempId);
    if (i === -1) return;
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    [sorted[i].order, sorted[j].order] = [sorted[j].order, sorted[i].order];
    renderBlocks();
}

function deleteBlock(tempId) {
    const found = findBlockContainer(tempId);
    if (!found) return;
    found.container.splice(found.index, 1);
    renderBlocks();
}

function findBlockContainer(tempId) {
    function search(arr, parentInfo) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].tempId === tempId) {
                return { container: arr, index: i, block: arr[i], parentInfo };
            }
            if (arr[i].type === 'Grid' && arr[i].content.columnBlocks) {
                for (let c = 0; c < arr[i].content.columnBlocks.length; c++) {
                    const result = search(arr[i].content.columnBlocks[c], {
                        gridTempId: arr[i].tempId,
                        columnIndex: c
                    });
                    if (result) return result;
                }
            }
        }
        return null;
    }
    return search(blocks, null);
}

function findBlockByTempId(tempId, blockArray) {
    if (!blockArray) blockArray = blocks;
    for (const block of blockArray) {
        if (block.tempId === tempId) return block;
        if (block.type === 'Grid' && block.content.columnBlocks) {
            for (const colBlocks of block.content.columnBlocks) {
                const found = findBlockByTempId(tempId, colBlocks);
                if (found) return found;
            }
        }
    }
    return null;
}

function updateBlockContent(tempId, prop, value) {
    const block = findBlockByTempId(tempId);
    if (block) block.content[prop] = value;
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
    addBlock('Grid',          { columns: [1,1], columnBlocks: [[{ id:0, tempId:Math.random().toString(36).substr(2,9), type:'Paragraph', content:{html:'Sol sütun içeriği'}, order:1 }],[{ id:0, tempId:Math.random().toString(36).substr(2,9), type:'Paragraph', content:{html:'Sağ sütun içeriği'}, order:1 }]] });
    addBlock('List',          { items: ['Birinci madde', 'İkinci madde', 'Üçüncü madde'] });
    addBlock('Paragraph',     { html: 'Daha fazla kaynak için kütüphane bölümünü ziyaret edin.' });
    renderBlocks();
}

function renderBlocks() {
    const list = document.getElementById('blockList');
    if (!list) return;
    list.innerHTML = '';
    renderBlockList(list, blocks);
    if (window.lucide) window.lucide.createIcons();
}

function renderBlockList(container, blockArray) {
    [...blockArray].sort((a, b) => a.order - b.order).forEach(block => {
        const wrapper = document.createElement('div');
        wrapper.className = `block-wrapper block-${block.type.toLowerCase()}`;
        wrapper.dataset.tempId = block.tempId;
        wrapper.innerHTML = buildBlockHeader(block) + `<div class="block-content">${buildBlockEditor(block)}</div>`;
        container.appendChild(wrapper);
        if (block.type === 'Grid') {
            const contentDiv = wrapper.querySelector('.block-content');
            renderGridColumns(block, contentDiv);
        }
    });
    bindBlockEvents(container, blockArray);
}

function buildBlockHeader(block) {
    return `
        <div class="block-header">
            <div class="block-header-left">
                <span class="block-drag-handle" draggable="true" title="Sürükleyerek taşı">
                    <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                </span>
                <span class="block-type-badge">${block.type}</span>
            </div>
            <div class="block-actions flex space-x-1">
                <button type="button" onclick="moveBlock('${block.tempId}', -1)" class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal" title="Yukarı taşı"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>
                <button type="button" onclick="moveBlock('${block.tempId}', 1)"  class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal" title="Aşağı taşı"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>
                <button type="button" onclick="deleteBlock('${block.tempId}')"  class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Sil"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>
        </div>`;
}

function bindBlockEvents(container, blockArray) {
    container.querySelectorAll('textarea[data-tempid]').forEach(ta => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        ta.addEventListener('input', () => {
            const blk = findBlockByTempId(ta.dataset.tempid);
            if (blk) blk.content[ta.dataset.prop] = ta.value;
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
        });
    });
    container.querySelectorAll('[contenteditable][data-tempid]').forEach(el => {
        if (el.dataset.idx !== undefined) {
            el.addEventListener('focus', () => { lastFocusedListItem = el; });
            el.addEventListener('input', () => {
                updateListItem(el.dataset.tempid, parseInt(el.dataset.idx), el.innerHTML);
            });
        } else {
            el.addEventListener('input', () => {
                const blk = findBlockByTempId(el.dataset.tempid);
                if (blk) blk.content[el.dataset.prop] = el.innerHTML;
            });
        }
    });
}

function buildBlockEditor(block) {
    const t = getNoteBlockTypeEnumString(block.type);
    if (t === 'Heading') return buildHeadingEditor(block);
    if (t === 'Subheading') return buildSubheadingEditor(block);
    if (t === 'Paragraph') return buildParagraphEditor(block);
    if (t === 'ImportantNote') {
        return `
            <div class="importantnote-editor">
                ${buildFormatToolbar(block.tempId, `importantnote-${block.tempId}`)}
                <div class="paragraph-content importantnote-textarea" contenteditable="true" data-tempid="${block.tempId}" data-prop="html" id="importantnote-${block.tempId}">${block.content.html || block.content.text || ''}</div>
            </div>
        `;
    }
    if (t === 'Quote') {
        return `<textarea data-tempid="${block.tempId}" data-prop="text" placeholder="Buraya yazın..." rows="1">${escapeForAttr(block.content.text || '')}</textarea>`;
    }
    if (t === 'Image' || t === 'Video') return buildMediaEditor(block);
    if (t === 'Gif') return buildGifEditor(block);
    if (t === 'DoubleImage') return buildDoubleImageEditor(block);
    if (t === 'Code') {
        return `<textarea class="w-full font-mono text-sm" data-tempid="${block.tempId}" data-prop="code" placeholder="Kod buraya..." rows="5">${escapeForAttr(block.content.code || '')}</textarea>`;
    }
    if (t === 'List') return buildListEditor(block);
    if (t === 'Grid') return buildGridEditor(block);
    if (t === 'Math') return buildMathEditor(block);
    return `<div class="text-sm text-slate-400">Desteklenmeyen blok tipi: ${escapeHtml(t)}</div>`;
}

function buildHeadingEditor(block) {
    const c = block.content;
    const _isDark = document.documentElement.classList.contains('dark');
    const colorMap = { black: _isDark ? '#e2e8f0' : '#162d42', blue: '#2563eb', red: '#dc2626' };
    const colorOpt = (id, prop, val) => {
        const active = (c[prop] || 'black') === val;
        const hex = { black: '#1e293b', blue: 'blue', red: 'red' }[val];
        return `<button type="button" class="hd-color-btn ${active ? 'active' : ''}" onclick="updateHeadingProp('${id}','${prop}','${val}')"><span style="color:${hex}">A</span></button>`;
    };
    return `
        <div class="heading-editor">
            ${buildFormatToolbar(block.tempId, `heading-${block.tempId}`)}
            <div class="heading-textarea" contenteditable="true" data-tempid="${block.tempId}" data-prop="html" id="heading-${block.tempId}" style="color:${colorMap[c.color || 'black']}">${c.html || c.text || ''}</div>
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
    const _isDark = document.documentElement.classList.contains('dark');
    const colorMap = { black: _isDark ? '#e2e8f0' : '#162d42', blue: '#2563eb', red: '#dc2626' };
    const colorOpt = (id, prop, val) => {
        const active = (c[prop] || 'black') === val;
        const hex = { black: '#1e293b', blue: 'blue', red: 'red' }[val];
        return `<button type="button" class="hd-color-btn ${active ? 'active' : ''}" onclick="updateHeadingProp('${id}','${prop}','${val}')"><span style="color:${hex}">A</span></button>`;
    };
    return `
        <div class="subheading-editor">
            ${buildFormatToolbar(block.tempId, `subheading-${block.tempId}`)}
            <div class="subheading-input-row">
                <span class="subheading-dash">- </span>
                <div class="subheading-textarea" contenteditable="true" data-tempid="${block.tempId}" data-prop="html" id="subheading-${block.tempId}" style="color:${colorMap[c.color || 'black']}">${c.html || c.text || ''}</div>
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
    const block = findBlockByTempId(tempId);
    if (!block) return;
    block.content[prop] = value;
    if (prop === 'color') renderBlocks();
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
                <span class="fmt-separator"></span>
                <button type="button" class="fmt-btn fmt-math" onclick="insertLatexInline('${block.tempId}')" title="LaTeX (metin içi)"><span class="fmt-math-icon">Σ</span></button>
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

function insertLatexInElement(el) {
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount || !el.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    const selectedText = range.toString();
    if (selectedText) {
        range.deleteContents();
        const textNode = document.createTextNode('$' + selectedText + '$');
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
    } else {
        const textNode = document.createTextNode('$$');
        range.insertNode(textNode);
        range.setStart(textNode, 1);
        range.collapse(true);
    }
    sel.removeAllRanges();
    sel.addRange(range);
    el.dispatchEvent(new Event('input'));
}

function insertLatexInline(tempId) {
    insertLatexInElement(document.getElementById(`para-${tempId}`));
}
function insertLatexListIntro(tempId) {
    insertLatexInElement(document.getElementById(`list-intro-${tempId}`));
}
function insertLatexListItem(tempId) {
    insertLatexInElement(lastFocusedListItem);
}

function buildFormatToolbar(tempId, elId) {
    return `
        <div class="format-toolbar">
            <button type="button" class="fmt-btn" onclick="formatCmdOn('${elId}', 'bold')" title="Kalın"><strong>B</strong></button>
            <button type="button" class="fmt-btn" onclick="formatCmdOn('${elId}', 'italic')" title="İtalik"><em>I</em></button>
            <button type="button" class="fmt-btn" onclick="formatCmdOn('${elId}', 'foreColor', 'black')" title="Siyah"><span style="color:#1e293b">A</span></button>
            <button type="button" class="fmt-btn fmt-blue" onclick="formatCmdOn('${elId}', 'foreColor', 'blue')" title="Mavi"><span style="color:blue">A</span></button>
            <button type="button" class="fmt-btn fmt-red" onclick="formatCmdOn('${elId}', 'foreColor', 'red')" title="Kırmızı"><span style="color:red">A</span></button>
            <button type="button" class="fmt-btn" onclick="formatCmdOn('${elId}', 'removeFormat')" title="Temizle" style="font-size:0.9rem">↺</button>
            <span class="fmt-separator"></span>
            <button type="button" class="fmt-btn fmt-math" onclick="insertLatexInto('${elId}')" title="LaTeX (metin içi)"><span class="fmt-math-icon">Σ</span></button>
        </div>
    `;
}

function formatCmdOn(elId, cmd, value) {
    const el = document.getElementById(elId);
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

function insertLatexInto(elId) {
    insertLatexInElement(document.getElementById(elId));
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
        <span class="fmt-separator"></span>
        <button type="button" class="fmt-btn fmt-math" onclick="insertLatexListIntro('${block.tempId}')" title="LaTeX (metin içi)"><span class="fmt-math-icon">Σ</span></button>
    </div><div contenteditable="true" class="list-intro-content" data-tempid="${block.tempId}" data-prop="intro" id="list-intro-${block.tempId}">${intro}</div></div>`;
    html += `<div class="list-fmt-toolbar">
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'bold')" title="Kalın"><strong>B</strong></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'italic')" title="İtalik"><em>I</em></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'foreColor', 'black')" title="Siyah"><span style="color:#1e293b">A</span></button>
        <button type="button" class="fmt-btn fmt-blue" onclick="formatListCmd('${block.tempId}', 'foreColor', 'blue')" title="Mavi"><span style="color:blue">A</span></button>
        <button type="button" class="fmt-btn fmt-red" onclick="formatListCmd('${block.tempId}', 'foreColor', 'red')" title="Kırmızı"><span style="color:red">A</span></button>
        <button type="button" class="fmt-btn" onclick="formatListCmd('${block.tempId}', 'removeFormat')" title="Temizle" style="font-size:0.9rem">↺</button>
        <span class="fmt-separator"></span>
        <button type="button" class="fmt-btn fmt-math" onclick="insertLatexListItem('${block.tempId}')" title="LaTeX (metin içi)"><span class="fmt-math-icon">Σ</span></button>
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
        case 'Image':         return { url: '', caption: '', mediaScale: 100 };
        case 'Video':         return { url: '', caption: '', mediaScale: 100 };
        case 'DoubleImage':   return { urls: ['', ''], caption: '' };
        case 'Code':          return { code: '', language: 'javascript' };
        case 'Subheading':    return { text: '', color: 'black', level: 3 };
        case 'List':          return { intro: '', items: [''] };
        case 'Grid':          return { columns: [1, 1], columnBlocks: [[], []] };
        case 'Math':          return { latex: '', display: true };
        case 'Gif':           return { url: '', caption: '', mediaScale: 100, speed: 1 };
        default:              return {};
    }
}

function updateListItem(tempId, idx, value) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    if (!block.content.items) block.content.items = [''];
    block.content.items[idx] = value;
}

function addListItem(tempId, afterIdx) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    if (!block.content.items) block.content.items = [''];
    block.content.items.splice(afterIdx, 0, '');
    renderBlocks();
    setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-tempid="${tempId}"].list-item-content`);
        if (inputs[afterIdx]) inputs[afterIdx].focus();
    }, 0);
}

function removeListItem(tempId, idx) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    if (block.content.items.length <= 1) return;
    block.content.items.splice(idx, 1);
    renderBlocks();
}

function buildMathEditor(block) {
    const c = block.content;
    const latex = c.latex || '';
    const display = c.display !== false;
    return `
        <div class="math-editor">
            <div class="math-input-row">
                <textarea data-tempid="${block.tempId}" data-prop="latex" placeholder="LaTeX kodunu yazın... örn: \\int_{a}^{b} x^2 dx" rows="3" class="math-textarea">${escapeForAttr(latex)}</textarea>
            </div>
            <div class="math-preview" id="math-preview-${block.tempId}">
                <span class="math-preview-placeholder">Önizleme burada görünecek</span>
            </div>
            <label class="math-display-toggle">
                <input type="checkbox" data-tempid="${block.tempId}" data-prop="display" ${display ? 'checked' : ''} onchange="updateBlockContent('${block.tempId}', 'display', this.checked); renderMathPreview('${block.tempId}')">
                <span>Blok matematik (display mode)</span>
            </label>
        </div>
    `;
}

function renderMathPreview(tempId) {
    const preview = document.getElementById(`math-preview-${tempId}`);
    const textarea = document.querySelector(`.math-textarea[data-tempid="${tempId}"]`);
    const checkbox = document.querySelector(`.math-display-toggle input[data-tempid="${tempId}"]`);
    if (!preview) return;
    const latex = textarea ? textarea.value : '';
    const display = checkbox ? checkbox.checked : true;
    if (!latex.trim()) {
        preview.innerHTML = '<span class="math-preview-placeholder">Önizleme burada görünecek</span>';
        return;
    }
    try {
        preview.innerHTML = '';
        const el = document.createElement('div');
        katex.render(latex, el, { displayMode: display, throwOnError: false });
        preview.appendChild(el);
    } catch (e) {
        preview.innerHTML = `<span class="math-preview-error">${escapeHtml(e.message || 'LaTeX hatası')}</span>`;
    }
}

function buildMediaEditor(block) {
    const isVideo = block.type === 'Video';
    const url = block.content.url || '';
    const caption = block.content.caption || '';
    const mediaScale = Number(block.content.mediaScale ?? 100);
    const previewId = `media-preview-${block.tempId}`;
    const urlId = `media-url-${block.tempId}`;
    const accept = isVideo ? 'video/*' : 'image/*';
    const placeholder = isVideo ? 'Video URL (YouTube veya direkt link)' : "Resim URL'si";

    return `
        <div class="space-y-3">
            <div class="flex gap-2">
                <input type="text" id="${urlId}" value="${escapeForAttr(url)}" placeholder="${placeholder}" class="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/40 transition" oninput="onMediaUrlInput('${block.tempId}', '${block.type}', this.value)" />
                <label class="px-5 py-3 bg-brand-teal hover:bg-brand-teal-light text-white rounded-xl cursor-pointer text-sm font-bold transition-all shadow shadow-teal-500/20 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="upload" class="w-4 h-4"></i> Yükle
                    <input type="file" class="hidden" accept="${accept}" onchange="onMediaFileSelect('${block.tempId}', '${block.type}', this.files[0], '${urlId}')" />
                </label>
            </div>
            <input type="text" value="${escapeForAttr(caption)}" placeholder="Açıklama (Opsiyonel)" class="w-full px-3 py-2 text-xs text-slate-500 bg-transparent border-b border-slate-100 dark:border-slate-700 outline-none focus:border-brand-teal transition" oninput="updateBlockContent('${block.tempId}', 'caption', this.value)" />
            <div class="media-size-control">
                <div class="media-size-control-row">
                    <span>Boyut</span>
                    <strong id="media-size-label-${block.tempId}">${mediaScale}%</strong>
                </div>
                <input type="range" min="28" max="100" step="1" value="${mediaScale}" class="media-size-slider" oninput="updateBlockContent('${block.tempId}', 'mediaScale', parseInt(this.value)); renderMediaPreview('${block.tempId}', '${block.type}')" />
            </div>
            <div id="${previewId}" class="media-preview-box">${buildMediaPreview(block.type, url, mediaScale)}</div>
        </div>
    `;
}

function buildMediaPreview(type, url, mediaScale = 100) {
    if (!url) {
        const icon = type === 'Video' ? 'video' : 'image';
        const label = type === 'Video' ? 'Video eklenmedi' : 'Görsel eklenmedi';
        return `<div class="media-preview-empty"><i data-lucide="${icon}" class="text-slate-300"></i><p class="text-slate-400">${label}</p></div>`;
    }

    const resolvedUrl = normalizeMediaUrl(url);
    const widthValue = Math.max(28, Math.min(100, Number(mediaScale) || 100));
    const shellStyle = `style="width:${widthValue}%;margin:0 auto;"`;

    if (type === 'Video') {
        const ytId = getYoutubeId(resolvedUrl);
        if (ytId) {
            return `<div class="media-preview-frame" ${shellStyle}><iframe class="media-video-frame" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen></iframe></div>`;
        }
        return `<div class="media-preview-frame" ${shellStyle}><video src="${escapeHtml(resolvedUrl)}" class="media-asset" controls></video></div>`;
    }

    return `<div class="media-preview-frame" ${shellStyle}><img src="${escapeHtml(resolvedUrl)}" class="media-asset" onerror="this.src='https://via.placeholder.com/400x200?text=Gecersiz+URL'" /></div>`;
}

function renderMediaPreview(tempId, mediaType) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    const preview = document.getElementById(`media-preview-${tempId}`);
    if (!preview) return;
    const mediaScale = Number(block.content.mediaScale ?? 100);
    preview.innerHTML = buildMediaPreview(mediaType, block.content.url || '', mediaScale);
    const label = document.getElementById(`media-size-label-${tempId}`);
    if (label) label.textContent = `${mediaScale}%`;
    if (window.lucide) window.lucide.createIcons();
}

function onMediaUrlInput(tempId, mediaType, value) {
    updateBlockContent(tempId, 'url', value);
    renderMediaPreview(tempId, mediaType);
    scheduleMediaServerSave(tempId, value, (localUrl) => {
        const block = findBlockByTempId(tempId);
        if (!block || block.content.url !== value) return;
        block.content.url = localUrl;
        const urlInput = document.getElementById(`media-url-${tempId}`);
        if (urlInput) urlInput.value = localUrl;
        renderMediaPreview(tempId, mediaType);
        if (window.showToast) window.showToast('Medya sunucuya kaydedildi.', 'success');
    });
}

async function onMediaFileSelect(tempId, mediaType, file, urlInputId) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await apiFetch(`${API_BASE_URL}/api/media/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed: ' + res.status);
        const data = await res.json();
        const storedUrl = data.url || '';
        updateBlockContent(tempId, 'url', storedUrl);
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = storedUrl;
        renderMediaPreview(tempId, mediaType);
    } catch (e) {
        console.error('Media upload error:', e);
        if (window.showToast) window.showToast('Dosya yüklenirken hata oluştu.', 'error');
    }
}

function buildGifEditor(block) {
    const url = block.content.url || '';
    const caption = block.content.caption || '';
    const mediaScale = Number(block.content.mediaScale ?? 100);
    const speed = Number(block.content.speed ?? 1);
    const previewId = `gif-preview-${block.tempId}`;
    const urlId = `gif-url-${block.tempId}`;

    return `
        <div class="space-y-3">
            <div class="flex gap-2">
                <input type="text" id="${urlId}" value="${escapeForAttr(url)}" placeholder="GIF URL'si" class="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/40 transition" oninput="onGifUrlInput('${block.tempId}', this.value)" />
                <label class="px-5 py-3 bg-brand-teal hover:bg-brand-teal-light text-white rounded-xl cursor-pointer text-sm font-bold transition-all shadow shadow-teal-500/20 whitespace-nowrap flex items-center gap-2">
                    <i data-lucide="upload" class="w-4 h-4"></i> Yükle
                    <input type="file" class="hidden" accept="image/gif" onchange="onGifFileSelect('${block.tempId}', this.files[0], '${urlId}')" />
                </label>
            </div>
            <input type="text" value="${escapeForAttr(caption)}" placeholder="Açıklama (Opsiyonel)" class="w-full px-3 py-2 text-xs text-slate-500 bg-transparent border-b border-slate-100 dark:border-slate-700 outline-none focus:border-brand-teal transition" oninput="updateBlockContent('${block.tempId}', 'caption', this.value)" />
            <div class="media-size-control">
                <div class="media-size-control-row">
                    <span>Boyut</span>
                    <strong id="gif-size-label-${block.tempId}">${mediaScale}%</strong>
                </div>
                <input type="range" min="28" max="100" step="1" value="${mediaScale}" class="media-size-slider" oninput="updateGifSize('${block.tempId}', parseInt(this.value))" />
            </div>
            <div class="media-size-control">
                <div class="media-size-control-row">
                    <span>Hız</span>
                    <strong id="gif-speed-label-${block.tempId}">${Number(speed).toFixed(1)}x</strong>
                </div>
                <input type="range" min="0.25" max="4" step="0.25" value="${speed}" class="media-size-slider" oninput="updateGifSpeed('${block.tempId}', parseFloat(this.value))" />
            </div>
            <div id="${previewId}" class="media-preview-box">${buildGifPreview(block.tempId, url, mediaScale)}</div>
        </div>
    `;
}

function buildGifPreview(tempId, url, mediaScale = 100) {
    if (!url) {
        return `<div class="media-preview-empty"><i data-lucide="film" class="text-slate-300"></i><p class="text-slate-400">GIF eklenmedi</p></div>`;
    }
    const widthValue = Math.max(28, Math.min(100, Number(mediaScale) || 100));
    return `
        <div class="media-preview-frame" style="width:${widthValue}%;margin:0 auto;">
            <canvas class="gif-canvas" data-gif-tempid="${tempId}" style="width:100%;height:auto;border-radius:0.75rem;background:transparent;display:block;"></canvas>
        </div>
    `;
}

function renderGifPreview(tempId) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    const canvas = document.querySelector(`.gif-canvas[data-gif-tempid="${tempId}"]`);
    if (!canvas) return;
    const url = (block.content.url || '').trim();
    if (!url) return;
    if (window.GifPlayer) {
        window.GifPlayer.play(canvas, normalizeMediaUrl(url), Number(block.content.speed ?? 1));
    }
}

function updateGifSize(tempId, value) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    block.content.mediaScale = value;
    const label = document.getElementById(`gif-size-label-${tempId}`);
    if (label) label.textContent = `${value}%`;
    const frame = document.querySelector(`.gif-canvas[data-gif-tempid="${tempId}"]`)?.closest('.media-preview-frame');
    if (frame) frame.style.width = `${value}%`;
}

function updateGifSpeed(tempId, value) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    block.content.speed = value;
    const label = document.getElementById(`gif-speed-label-${tempId}`);
    if (label) label.textContent = `${Number(value).toFixed(1)}x`;
    const canvas = document.querySelector(`.gif-canvas[data-gif-tempid="${tempId}"]`);
    if (canvas && window.GifPlayer) window.GifPlayer.setSpeed(canvas, value);
}

function onGifUrlInput(tempId, value) {
    updateBlockContent(tempId, 'url', value);
    const block = findBlockByTempId(tempId);
    if (!block) return;
    const preview = document.getElementById(`gif-preview-${tempId}`);
    if (preview) {
        preview.innerHTML = buildGifPreview(tempId, value, Number(block.content.mediaScale ?? 100));
        if (window.lucide) window.lucide.createIcons();
    }
    renderGifPreview(tempId);
    scheduleMediaServerSave(tempId, value, (localUrl) => {
        const b = findBlockByTempId(tempId);
        if (!b || b.content.url !== value) return;
        const urlInput = document.getElementById(`gif-url-${tempId}`);
        if (urlInput) urlInput.value = localUrl;
        onGifUrlInput(tempId, localUrl);
        if (window.showToast) window.showToast('GIF sunucuya kaydedildi.', 'success');
    });
}

async function onGifFileSelect(tempId, file, urlInputId) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await apiFetch(`${API_BASE_URL}/api/media/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed: ' + res.status);
        const data = await res.json();
        const storedUrl = data.url || '';
        const urlInput = document.getElementById(urlInputId);
        if (urlInput) urlInput.value = storedUrl;
        onGifUrlInput(tempId, storedUrl);
    } catch (e) {
        console.error('GIF upload error:', e);
        if (window.showToast) window.showToast('Dosya yüklenirken hata oluştu.', 'error');
    }
}

function buildDoubleImageEditor(block) {
    const urls = block.content.urls || ['', ''];
    const caption = block.content.caption || '';
    const preview = (url, idx) => {
        if (!url) return `<div class="text-xs text-slate-400">Resim ${idx + 1} eklenmedi</div>`;
        const resolvedUrl = normalizeMediaUrl(url);
        return `<div class="media-preview-frame"><img src="${escapeHtml(resolvedUrl)}" class="media-asset" onerror="this.src='https://via.placeholder.com/400x200?text=Gecersiz+URL'" /></div>`;
    };

    return `
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
                ${[0, 1].map(i => `
                    <div>
                        <label class="text-xs font-bold text-slate-400 mb-1 block">Resim ${i + 1}</label>
                        <input type="text" id="media-url-${block.tempId}-${i}" value="${escapeForAttr(urls[i] || '')}" placeholder="Resim URL'si ${i + 1}" class="w-full p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-teal/40 transition" oninput="updateDoubleImageUrl('${block.tempId}', ${i}, this.value)" />
                        <div class="mt-1">${preview(urls[i], i)}</div>
                    </div>
                `).join('')}
            </div>
            <input type="text" value="${escapeForAttr(caption)}" placeholder="Açıklama (Opsiyonel)" class="w-full px-3 py-2 text-xs text-slate-500 bg-transparent border-b border-slate-100 dark:border-slate-700 outline-none focus:border-brand-teal transition" oninput="updateBlockContent('${block.tempId}', 'caption', this.value)" />
        </div>
    `;
}

function updateDoubleImageUrl(tempId, idx, value) {
    const block = findBlockByTempId(tempId);
    if (!block) return;
    if (!Array.isArray(block.content.urls)) block.content.urls = ['', ''];
    block.content.urls[idx] = value;
    scheduleMediaServerSave(`${tempId}:${idx}`, value, (localUrl) => {
        const b = findBlockByTempId(tempId);
        if (!b || !Array.isArray(b.content.urls)) return;
        if (b.content.urls[idx] !== value) return;
        b.content.urls[idx] = localUrl;
        const urlInput = document.getElementById(`media-url-${tempId}-${idx}`);
        if (urlInput) urlInput.value = localUrl;
        if (window.showToast) window.showToast('Medya sunucuya kaydedildi.', 'success');
    });
}

// --- Grid Editor ---

function buildGridEditor(block) {
    const c = block.content;
    const cols = c.columns || [1, 1];
    const colBlocks = c.columnBlocks || [];
    const layout = c.layout || '';
    const isMatrix = layout === 'matrix2x2';
    const isWideBottom = layout === 'top-two-bottom-wide';
    const template = (isMatrix || isWideBottom) ? '1fr 1fr' : getGridTemplate(cols);

    let html = `<div class="grid-editor" data-grid-tempid="${block.tempId}">
        <div class="grid-container" style="grid-template-columns: ${template}">`;
    colBlocks.forEach((_, idx) => {
        const extraStyle = isWideBottom && idx === 2 ? ' style="grid-column:1 / -1"' : '';
        html += `<div class="grid-column" data-col="${idx}"${extraStyle}>
            <div class="grid-column-blocks" data-grid="${block.tempId}" data-col="${idx}"></div>
            <div class="grid-column-footer">
                <button type="button" class="grid-add-block-btn" onclick="openGridAddMenu('${block.tempId}', ${idx})" title="Blok Ekle">+</button>
            </div>
        </div>`;
    });
    html += `</div></div>`;
    return html;
}

function renderGridColumns(gridBlock, container) {
    const colBlocks = gridBlock.content.columnBlocks || [];
    colBlocks.forEach(col => normalizeBlocksRecursive(col));
    colBlocks.forEach((blocks, colIdx) => {
        const colContainer = container.querySelector(`.grid-column-blocks[data-grid="${gridBlock.tempId}"][data-col="${colIdx}"]`);
        if (colContainer) {
            renderBlockList(colContainer, blocks);
        }
    });
}

function getGridTemplate(cols) {
    const total = cols.reduce((a, b) => a + b, 0);
    return cols.map(v => `${(v / total) * 100}%`).join(' ');
}

function openGridAddMenu(gridTempId, colIdx) {
    const existing = document.getElementById('grid-add-menu-overlay');
    if (existing) existing.remove();

    const types = [
        { type: 'Paragraph', label: 'Paragraf' },
        { type: 'Heading', label: 'Ba\u015Fl\u0131k' },
        { type: 'Subheading', label: 'Alt Ba\u015Fl\u0131k' },
        { type: 'Image', label: 'Resim' },
        { type: 'Video', label: 'Video' },
        { type: 'Gif', label: 'GIF' },
        { type: 'ImportantNote', label: '\u00D6nemli Not' },
        { type: 'Code', label: 'Kod' },
        { type: 'List', label: 'Liste' },
        { type: 'Math', label: 'Matematik' }
    ];

    const isDark = document.documentElement.classList.contains('dark');
    const overlay = document.createElement('div');
    overlay.id = 'grid-add-menu-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.3);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s';
    const menu = document.createElement('div');
    menu.style.cssText = `background:${isDark?'#0f172a':'white'};border-radius:1.25rem;padding:1.25rem;max-width:320px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);border:1px solid ${isDark?'#334155':'#e2e8f0'};max-height:80vh;overflow-y:auto`;
    menu.innerHTML = `<h4 style="margin:0 0 0.75rem;font-size:0.85rem;font-weight:800;color:${isDark?'#94a3b8':'#64748b'};text-transform:uppercase;letter-spacing:0.05em">Blok Ekle</h4>` +
        `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.5rem">` +
        types.map(t => `<button type="button" style="padding:0.6rem 0.4rem;border-radius:0.75rem;border:1px solid ${isDark?'#334155':'#e2e8f0'};background:${isDark?'#1e293b':'#f8fafc'};color:${isDark?'#e2e8f0':'#1e293b'};font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.15s;text-align:center" onmouseover="this.style.borderColor='#469d91';this.style.background='${isDark?'#1a3a35':'#ecfdf5'}'" onmouseout="this.style.borderColor='${isDark?'#334155':'#e2e8f0'}';this.style.background='${isDark?'#1e293b':'#f8fafc'}'" onclick="addBlock('${t.type}', null, '${gridTempId}', ${colIdx});document.getElementById('grid-add-menu-overlay')?.remove()">${t.label}</button>`).join('') +
        `</div>`;
    overlay.appendChild(menu);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 200); } };
}

// --- End Grid Editor ---

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

function syncEditorsBeforeSave(blockArray) {
    if (!blockArray) blockArray = blocks;
    document.querySelectorAll('[contenteditable][data-tempid]').forEach(el => {
        const blk = findBlockByTempId(el.dataset.tempid);
        if (!blk) return;
        revertInlineMath(el);
        if (el.dataset.idx !== undefined) {
            if (!blk.content.items) blk.content.items = [''];
            blk.content.items[parseInt(el.dataset.idx)] = el.innerHTML;
        } else if (el.dataset.prop) {
            blk.content[el.dataset.prop] = el.innerHTML;
        }
    });
    normalizeTextFields(blockArray);
}

function normalizeTextFields(blockArray) {
    if (!blockArray) return;
    blockArray.forEach(b => {
        const t = typeof b.type === 'string' ? b.type.toLowerCase() : '';
        if (['heading', 'subheading', 'importantnote', 'quote', 'paragraph'].includes(t)) {
            const html = b.content?.html || '';
            const hasHtml = html && html.trim();
            const hasText = b.content?.text && b.content.text.trim();
            if (hasHtml && !hasText) {
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                b.content.text = tmp.textContent || tmp.innerText || '';
            }
        }
        if (b.type === 'Grid' && b.content && b.content.columnBlocks && Array.isArray(b.content.columnBlocks)) {
            b.content.columnBlocks.forEach(col => normalizeTextFields(col));
        }
    });
}

// --- Inline Math for Contenteditable (KaTeX render) ---

function serializeEditableContent(el) {
    if (!el) return '';
    const html = el.innerHTML || '';
    return html.replace(/<span class="math-inline(?: math-display)?" data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, (match, latex) => {
        const display = /math-display/.test(match) ? '$$' : '$';
        return `${display}${latex}${display}`;
    });
}

function renderMathInContainer(container) {
    if (!container || typeof katex === 'undefined') return;
    if (!container.textContent || !container.textContent.includes('$')) return;

    const source = container.innerHTML;
    if (!source || !source.includes('$')) return;

    const tempRoot = document.createElement(container.tagName || 'div');
    tempRoot.innerHTML = source;

    const walker = document.createTreeWalker(tempRoot, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach(node => {
        if (!node.textContent.includes('$')) return;

        const text = node.textContent;
        const regex = /\$\$([\s\S]*?)\$\$|\$([^\n$]+?)\$/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            const latex = match[1] ?? match[2];
            const display = Boolean(match[1]);
            const span = document.createElement('span');
            span.className = display ? 'math-inline math-display' : 'math-inline';
            span.dataset.latex = latex;
            span.dataset.display = display ? 'true' : 'false';

            try {
                span.innerHTML = katex.renderToString(latex, { displayMode: display, throwOnError: false });
            } catch (e) {
                span.textContent = match[0];
            }

            parts.push(span);
            lastIndex = match.index + match[0].length;
        }

        if (parts.length > 0) {
            if (lastIndex < text.length) {
                parts.push(document.createTextNode(text.slice(lastIndex)));
            }

            const fragment = document.createDocumentFragment();
            parts.forEach(part => fragment.appendChild(part));
            node.parentNode.replaceChild(fragment, node);
        }
    });

    container.innerHTML = tempRoot.innerHTML;
    container.dataset.rawHtml = source;
}

function renderInlineMath(el) {
    if (!el) return;
    renderMathInContainer(el);
}

function revertInlineMath(el) {
    if (!el) return;
    const blk = findBlockByTempId(el.dataset.tempid);
    if (!blk) return;
    const source = el.dataset.idx !== undefined
        ? (blk.content.items ? blk.content.items[parseInt(el.dataset.idx)] : '')
        : (blk.content[el.dataset.prop] || '');
    el.dataset.rawHtml = source;
    if (source !== undefined && source !== null) {
        el.innerHTML = source;
    }
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
            ? `${API_BASE_URL}/api/admin/notes/${noteId}`
            : `${API_BASE_URL}/api/admin/notes`;

        const noteRes = await apiFetchJson(noteUrl, {
            method,
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

        const blocksRes = await apiFetchJson(`${API_BASE_URL}/api/admin/notes/${targetId}/blocks`, {
            method: 'POST',
            body: JSON.stringify(blocksPayload)
        });

        if (!blocksRes.ok) {
            const err = await blocksRes.json().catch(() => ({}));
            throw new Error(err.error || `Bloklar kaydedilemedi (HTTP ${blocksRes.status}).`);
        }

        if (isPublish) {
            const pubRes = await apiFetch(`${API_BASE_URL}/api/admin/notes/${targetId}/publish`, { method: 'POST' });
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

function normalizeBlocksRecursive(blockArray) {
    if (!blockArray) return;
    blockArray.forEach(b => {
        b.tempId = b.tempId || Math.random().toString(36).substr(2, 9);
        b.type = getNoteBlockTypeEnumString(b.type);
        if (!b.content) b.content = getDefaultContent(b.type);
        if (b.type === 'Grid' && Array.isArray(b.content.columnBlocks)) {
            b.content.columnBlocks.forEach(col => normalizeBlocksRecursive(col));
        }
    });
}

async function loadNote(id) {
    try {
        const res = await apiFetch(`${API_BASE_URL}/api/admin/notes/${id}`);
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
        normalizeBlocksRecursive(blocks);
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

function escapeHtml(v) {
    return (v ?? '').toString().replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeForAttr(v) {
    return escapeHtml(v).replace(/\n/g, '&#10;');
}

function getNoteBlockTypeEnumString(value) {
    if (value === null || value === undefined) return 'Paragraph';
    const numMap = { 0: 'Paragraph', 1: 'Heading', 2: 'ImportantNote', 3: 'Video', 4: 'Image', 5: 'DoubleImage', 6: 'Code', 7: 'Quote', 8: 'List', 9: 'Subheading', 10: 'Grid', 11: 'Math', 12: 'Gif' };
    if (typeof value === 'number') return numMap[value] || 'Paragraph';
    const n = parseInt(value, 10);
    if (!isNaN(n)) return numMap[n] || 'Paragraph';
    const strMap = { paragraph:'Paragraph', heading:'Heading', subheading:'Subheading', importantnote:'ImportantNote', video:'Video', image:'Image', doubleimage:'DoubleImage', code:'Code', quote:'Quote', list:'List', grid:'Grid', math:'Math', gif:'Gif' };
    return strMap[value.trim().toLowerCase()] || 'Paragraph';
}

function getNoteBlockTypeEnumValue(s) {
    return { Paragraph:0, Heading:1, ImportantNote:2, Video:3, Image:4, DoubleImage:5, Code:6, Quote:7, List:8, Subheading:9, Grid:10, Math:11, Gif:12 }[s] ?? 0;
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
            el.innerHTML = `<h${lvl} class="text-4xl font-black mt-12 mb-4 tracking-tight uppercase border-l-4 border-brand-teal pl-5" style="color:${textColor}">${escapeHtml(block.content?.html || block.content?.text || '')}</h${lvl}>`;
        } else if (t === 'Subheading') {
            const textColor = { black:'#162d42', blue:'#2563eb', red:'#dc2626' }[block.content?.color] || '#162d42';
            el.innerHTML = `<h3 class="text-2xl font-bold mt-6 mb-3 tracking-tight" style="color:${textColor}"><span class="subheading-dash">- </span>${escapeHtml(block.content?.html || block.content?.text || '')}</h3>`;
        } else if (t === 'ImportantNote') {
            el.innerHTML = `<div class="p-7 rounded-3xl text-white shadow-xl" style="background:#2d7a6f"><div class="flex items-center gap-3 mb-2"><i data-lucide="info" class="w-5 h-5"></i><strong class="italic underline underline-offset-4">Önemli Bilgi</strong></div><p class="leading-relaxed">${escapeHtml(block.content?.html || block.content?.text || '')}</p></div>`;
        } else if (t === 'Code') {
            el.innerHTML = `<div class="p-6 rounded-3xl bg-slate-900 border border-white/10"><pre class="text-teal-300 font-mono text-sm whitespace-pre-wrap break-words"><code>${escapeHtml(block.content?.code)}</code></pre></div>`;
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
            const clean = (s) => (window.DOMPurify) ? window.DOMPurify.sanitize(String(s)) : escapeHtml(String(s));
            const introHtml = intro ? `<p class="text-lg text-slate-600 dark:text-slate-300 mb-3 font-medium">${clean(intro)}</p>` : '';
            const lis = items.filter(i => i.trim()).map(i => `<li class="mb-1">${clean(i)}</li>`).join('');
            el.innerHTML = `${introHtml}<ol class="list-decimal pl-6 text-lg text-slate-600 dark:text-slate-300 space-y-1 font-medium">${lis}</ol>`;
        } else if (t === 'Paragraph') {
            const html = block.content?.html || block.content?.text || '';
            const safeHtml = (window.DOMPurify) ? window.DOMPurify.sanitize(String(html)) : escapeHtml(html);
            el.innerHTML = `<div class="text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium">${safeHtml}</div>`;
        } else if (t === 'DoubleImage') {
            const urls = block.content?.urls || [];
            const cap = escapeHtml(block.content?.caption);
            const imgs = urls.map(u => {
                const resolvedUrl = normalizeMediaUrl(u || '');
                return `<div class="rounded-2xl overflow-hidden shadow-md"><div class="media-preview-frame"><img src="${escapeHtml(resolvedUrl)}" class="media-asset" onerror="this.src='https://via.placeholder.com/400x200?text=Gecersiz+URL'" /></div></div>`;
            }).join('');
            el.innerHTML = `<div class="grid grid-cols-2 gap-4">${imgs}</div>${cap ? `<p class="text-xs text-center mt-2 text-slate-400 font-semibold uppercase tracking-widest">${cap}</p>` : ''}`;
        } else if (t === 'Grid') {
            renderGridPreview(el, block);
        } else if (t === 'Gif') {
            const url = block.content?.url || '';
            const cap = escapeHtml(block.content?.caption);
            const mediaScale = Math.max(28, Math.min(100, Number(block.content?.mediaScale ?? 100)));
            if (url) {
                el.innerHTML = `<div class="media-preview-frame" style="width:${mediaScale}%;margin:0 auto;"><canvas class="gif-canvas" data-gif-tempid="${block.tempId}" style="width:100%;height:auto;border-radius:0.75rem;background:transparent;display:block;"></canvas></div>${cap ? `<p class="text-xs text-center mt-2 text-slate-400 font-semibold uppercase tracking-widest">${cap}</p>` : ''}`;
            } else {
                el.innerHTML = '<p class="text-slate-400 italic">GIF URL girilmedi.</p>';
            }
        } else if (t === 'Math') {
            const latex = block.content?.latex || '';
            const display = block.content?.display !== false;
            if (latex.trim() && typeof katex !== 'undefined') {
                try {
                    const mathEl = document.createElement('div');
                    mathEl.className = 'math-rendered-block';
                    katex.render(latex, mathEl, { displayMode: display, throwOnError: false });
                    el.appendChild(mathEl);
                } catch {
                    el.innerHTML = `<pre class="text-red-400 bg-red-900/20 p-4 rounded-xl text-sm">${escapeHtml(latex)}</pre>`;
                }
            } else {
                el.innerHTML = `<pre class="text-slate-400 italic">${latex ? escapeHtml(latex) : 'LaTeX ifadesi girilmedi.'}</pre>`;
            }
        } else {
            el.innerHTML = `<p class="text-xl leading-relaxed text-slate-600 dark:text-slate-300">${escapeHtml(block.content?.text)}</p>`;
        }

        container.appendChild(el);
        if (typeof renderMathInElement === 'function' && t !== 'Math' && t !== 'Code') {
            try {
                renderMathInElement(el, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false
                });
            } catch (e) { /* silent */ }
        }
    });
    if (window.lucide) window.lucide.createIcons();
}

function renderGridPreview(container, block) {
    const c = block.content || {};
    const cols = c.columns || [1, 1];
    const colBlocks = c.columnBlocks || [];
    const isMatrix = c.layout === 'matrix2x2';
    const isWideBottom = c.layout === 'top-two-bottom-wide';
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/50 w-full min-w-0 overflow-hidden';
    gridDiv.style.gridTemplateColumns = (isMatrix || isWideBottom) ? '1fr 1fr' : cols.map(v => `${v}fr`).join(' ');
    gridDiv.style.display = 'grid';
    colBlocks.forEach((blocks, idx) => {
        const colDiv = document.createElement('div');
        colDiv.className = 'grid-col';
        if (isWideBottom && idx === 2) {
            colDiv.style.gridColumn = '1 / -1';
        }
        const innerContainer = document.createElement('div');
        renderPreviewBlocks(innerContainer, blocks);
        colDiv.appendChild(innerContainer);
        gridDiv.appendChild(colDiv);
    });
    container.appendChild(gridDiv);
}

// --- Drag & Drop ---

let _draggedBlockType = null;
let _draggedGridContent = null;
let _draggedBlockTempId = null;
let _dropTargetInfo = null;

function normalizeContainerOrder(container) {
    if (!Array.isArray(container)) return;
    container.forEach((block, index) => {
        block.order = index + 1;
    });
}

function moveBlockTo(tempId, targetTempId, position = 'before') {
    const source = findBlockContainer(tempId);
    const target = findBlockContainer(targetTempId);
    if (!source || !target) return;

    const moving = source.container[source.index];
    if (!moving) return;

    source.container.splice(source.index, 1);
    normalizeContainerOrder(source.container);

    let insertIndex = target.index + (position === 'after' ? 1 : 0);
    if (source.container === target.container && source.index < insertIndex) {
        insertIndex -= 1;
    }

    target.container.splice(insertIndex, 0, moving);
    normalizeContainerOrder(target.container);
    renderBlocks();
}

function initDragDrop() {
    document.querySelectorAll('.sidebar-block-item[draggable]').forEach(el => {
        el.addEventListener('dragstart', onSidebarDragStart);
        el.addEventListener('dragend', onSidebarDragEnd);
    });

    document.querySelectorAll('.grid-layout-card[draggable]').forEach(el => {
        el.addEventListener('dragstart', onGridShapeDragStart);
        el.addEventListener('dragend', onGridShapeDragEnd);
    });

    document.querySelectorAll('.block-drag-handle[draggable]').forEach(el => {
        el.addEventListener('dragstart', onBlockDragStart);
        el.addEventListener('dragend', onBlockDragEnd);
    });

    document.querySelectorAll('.block-wrapper').forEach(el => {
        el.addEventListener('dragover', onBlockWrapperDragOver);
        el.addEventListener('dragleave', onBlockWrapperDragLeave);
        el.addEventListener('drop', onBlockWrapperDrop);
    });

    const blockList = document.getElementById('blockList');
    if (blockList) {
        blockList.addEventListener('dragover', onMainDropZoneOver);
        blockList.addEventListener('dragleave', onMainDropZoneLeave);
        blockList.addEventListener('drop', onMainDropZoneDrop);
    }

    document.querySelectorAll('.grid-column').forEach(el => {
        el.addEventListener('dragover', onGridColumnDragOver);
        el.addEventListener('dragleave', onGridColumnDragLeave);
        el.addEventListener('drop', onGridColumnDrop);
    });
}

function onSidebarDragStart(e) {
    _draggedBlockType = e.target.closest('.sidebar-block-item')?.dataset.blockType || null;
    if (!_draggedBlockType) return;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', _draggedBlockType);
    e.target.closest('.sidebar-block-item')?.classList.add('dragging');
}

function onSidebarDragEnd(e) {
    e.target.closest('.sidebar-block-item')?.classList.remove('dragging');
    document.querySelectorAll('.drop-zone, .block-list, .grid-column, .block-wrapper').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function onGridShapeDragStart(e) {
    const btn = e.currentTarget;
    const content = btn.dataset.gridContent;
    if (!content) return;
    _draggedBlockType = 'Grid';
    _draggedGridContent = JSON.parse(content);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', 'Grid');
    btn.classList.add('dragging');
}

function onGridShapeDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    _draggedGridContent = null;
    document.querySelectorAll('.drop-zone, .block-list, .grid-column, .block-wrapper').forEach(el => {
        el.classList.remove('drag-over');
    });
}

function onBlockDragStart(e) {
    const handle = e.currentTarget;
    const wrapper = handle.closest('.block-wrapper');
    const tempId = wrapper?.dataset.tempId;
    if (!tempId) return;
    _draggedBlockTempId = tempId;
    _draggedBlockType = null;
    _draggedGridContent = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tempId);
    wrapper.classList.add('dragging');
}

function onBlockDragEnd(e) {
    const wrapper = e.currentTarget.closest('.block-wrapper');
    if (wrapper) wrapper.classList.remove('dragging');
    _draggedBlockTempId = null;
    _dropTargetInfo = null;
    document.querySelectorAll('.drop-zone, .block-list, .grid-column, .block-wrapper').forEach(el => {
        el.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    });
}

function onMainDropZoneOver(e) {
    if (e.target.closest('.grid-column')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = _draggedBlockTempId ? 'move' : 'copy';
    e.currentTarget.classList.add('drag-over');
}

function onMainDropZoneLeave(e) {
    if (e.target.closest('.grid-column')) return;
    e.currentTarget.classList.remove('drag-over');
}

function onMainDropZoneDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (e.target.closest('.grid-column')) return;
    if (_draggedBlockTempId) {
        const source = findBlockContainer(_draggedBlockTempId);
        if (source) {
            const moving = source.container[source.index];
            source.container.splice(source.index, 1);
            blocks.push(moving);
            normalizeContainerOrder(source.container);
            normalizeContainerOrder(blocks);
            renderBlocks();
        }
        _draggedBlockTempId = null;
        return;
    }
    const type = _draggedBlockType || e.dataTransfer.getData('text/plain');
    if (!type) return;
    const content = (type === 'Grid' && _draggedGridContent) ? _draggedGridContent : null;
    addBlock(type, content);
    _draggedGridContent = null;
}

function onGridColumnDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = _draggedBlockTempId ? 'move' : 'copy';
    e.currentTarget.classList.add('drag-over');
}

function onGridColumnDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function onGridColumnDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    const gridTempId = e.currentTarget.querySelector('.grid-column-blocks')?.dataset.grid;
    const colIdx = parseInt(e.currentTarget.dataset.col);
    if (_draggedBlockTempId && gridTempId && !isNaN(colIdx)) {
        const source = findBlockContainer(_draggedBlockTempId);
        const gridBlock = findBlockByTempId(gridTempId);
        const targetContainer = gridBlock?.content?.columnBlocks?.[colIdx];
        if (source && targetContainer) {
            const moving = source.container[source.index];
            source.container.splice(source.index, 1);
            normalizeContainerOrder(source.container);
            targetContainer.push(moving);
            normalizeContainerOrder(targetContainer);
            renderBlocks();
        }
        _draggedBlockTempId = null;
        return;
    }
    const type = _draggedBlockType || e.dataTransfer.getData('text/plain');
    if (!type) return;
    if (gridTempId && !isNaN(colIdx)) {
        const content = (type === 'Grid' && _draggedGridContent) ? _draggedGridContent : null;
        addBlock(type, content, gridTempId, colIdx);
        _draggedGridContent = null;
    }
}

function onBlockWrapperDragOver(e) {
    if (!_draggedBlockTempId && !_draggedBlockType) return;
    if (e.target.closest('textarea, input, button, [contenteditable]')) return;
    e.preventDefault();
    const wrapper = e.currentTarget;
    const rect = wrapper.getBoundingClientRect();
    const isAfter = (e.clientY - rect.top) > rect.height / 2;
    wrapper.classList.add('drag-over');
    wrapper.classList.toggle('drag-over-before', !isAfter);
    wrapper.classList.toggle('drag-over-after', isAfter);
    _dropTargetInfo = { tempId: wrapper.dataset.tempId, position: isAfter ? 'after' : 'before' };
    e.dataTransfer.dropEffect = _draggedBlockTempId ? 'move' : 'copy';
}

function onBlockWrapperDragLeave(e) {
    const wrapper = e.currentTarget;
    wrapper.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
}

function onBlockWrapperDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = e.currentTarget;
    wrapper.classList.remove('drag-over', 'drag-over-before', 'drag-over-after');
    const targetTempId = wrapper.dataset.tempId;
    if (_draggedBlockTempId && targetTempId && _draggedBlockTempId !== targetTempId) {
        moveBlockTo(_draggedBlockTempId, targetTempId, _dropTargetInfo?.position || 'before');
        _draggedBlockTempId = null;
        _dropTargetInfo = null;
        return;
    }
    const type = _draggedBlockType || e.dataTransfer.getData('text/plain');
    if (!type) return;
    const target = findBlockContainer(targetTempId);
    if (!target) return;
    const content = (type === 'Grid' && _draggedGridContent) ? _draggedGridContent : null;
    const insertIndex = _dropTargetInfo?.position === 'after' ? target.index + 1 : target.index;
    addBlock(type, content, target.parentInfo?.gridTempId || null, target.parentInfo?.columnIndex ?? null, insertIndex);
    _draggedGridContent = null;
    _dropTargetInfo = null;
}

// Re-init drag-drop after render and trigger math previews
const _origRenderBlocks = renderBlocks;
renderBlocks = function() {
    if (window.GifPlayer) window.GifPlayer.stopAll();
    _origRenderBlocks();
    initDragDrop();
    document.querySelectorAll('.math-textarea[data-tempid]').forEach(ta => {
        renderMathPreview(ta.dataset.tempid);
    });
    document.querySelectorAll('[contenteditable][data-tempid]').forEach(el => {
        renderInlineMath(el);
    });
    document.querySelectorAll('.gif-canvas[data-gif-tempid]').forEach(canvas => {
        renderGifPreview(canvas.dataset.gifTempid);
    });
};
