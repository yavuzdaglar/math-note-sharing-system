let blocks = [];
let noteTitle = "";

function applyTemplate() {
    blocks = [];
    addBlock('Heading', { text: "Özet Anlatım", level: 2 });
    addBlock('Paragraph', { text: "Bu döküman dersin akademik derinliğini ve temel uygulamalarını analiz etmektedir. Aşağıdaki bölümlerde konuya ait görsel materyaller ve video özetleri yer almaktadır." });
    addBlock('Heading', { text: "Video Anlatımı İzle", level: 3 });
    addBlock('Video', { url: "https://www.youtube.com/watch?v=sample" });
    addBlock('Heading', { text: "Konu Grafikleri ve Görseller", level: 3 });
    addBlock('Image', { url: "https://via.placeholder.com/800x400", caption: "Konu Görseli" });
    addBlock('ImportantNote', { text: "Önemli Bilgi" });
    addBlock('Paragraph', { text: "Daha fazla kaynak için kütüphane bölümünü ziyaret etmeyi unutmayın." });
    renderBlocks();
}

function addBlock(type, content = null) {
    const tempId = Math.random().toString(36).substr(2, 9);
    const newBlock = {
        tempId: tempId,
        type: type, 
        content: content || getDefaultContent(type),
        order: blocks.length + 1
    };
    blocks.push(newBlock);
    renderBlocks();
}

function getDefaultContent(type) {
    switch (type) {
        case 'Heading': return { text: "", level: 2 };
        case 'Paragraph': return { text: "" };
        case 'ImportantNote': return { text: "" };
        case 'Image': return { url: "", caption: "" };
        case 'Video': return { url: "" };
        case 'Code': return { code: "", language: "javascript" };
        case 'Quote': return { text: "", author: "" };
        case 'List': return { items: [""] };
        default: return {};
    }
}

function renderBlocks() {
    const list = document.getElementById('blockList');
    list.innerHTML = "";
    
    blocks.sort((a, b) => a.order - b.order).forEach((block, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = `block-wrapper block-${block.type.toLowerCase()}`;
        wrapper.dataset.tempId = block.tempId;
        
        wrapper.innerHTML = `
            <div class="block-header">
                <span class="block-type-badge">${block.type}</span>
                <div class="block-actions flex space-x-1">
                    <button type="button" onclick="moveBlock('${block.tempId}', -1)" class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal"><i data-lucide="chevron-up" class="w-4 h-4"></i></button>
                    <button type="button" onclick="moveBlock('${block.tempId}', 1)" class="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-brand-teal"><i data-lucide="chevron-down" class="w-4 h-4"></i></button>
                    <button type="button" onclick="deleteBlock('${block.tempId}')" class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
            <div class="block-content">
                ${renderBlockEditor(block)}
            </div>
        `;
        list.appendChild(wrapper);
    });
    lucide.createIcons();
    setTimeout(() => {
        document.querySelectorAll('textarea').forEach(autoResize);
    }, 50);
}

function renderBlockEditor(block) {
    if (['Heading', 'Paragraph', 'ImportantNote', 'Quote'].includes(block.type)) {
        return `<textarea oninput="onTextareaInput(this, '${block.tempId}', 'text')" placeholder="Buraya yazın..." rows="1">${block.content.text || ''}</textarea>`;
    }
    if (block.type === 'Image') {
        return `
            <div class="space-y-2">
                <div class="flex gap-2">
                    <input type="text" class="flex-1 p-2 border rounded text-sm" oninput="updateBlockContent('${block.tempId}', 'url', this.value)" placeholder="Resim URL'si" value="${block.content.url || ''}" id="url-${block.tempId}" />
                    <label class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer text-sm font-bold transition-colors">
                        <i data-lucide="upload" class="w-4 h-4 inline mr-1"></i> Yükle
                        <input type="file" class="hidden" onchange="handleFileUpload('${block.tempId}', this.files[0])" accept="image/*" />
                    </label>
                </div>
                <input type="text" class="w-full p-2 border rounded text-xs text-gray-500" oninput="updateBlockContent('${block.tempId}', 'caption', this.value)" placeholder="Açıklama (Opsiyonel)" value="${block.content.caption || ''}" />
            </div>
        `;
    }
    if (block.type === 'Video') {
        return `<input type="text" class="w-full p-2 border rounded text-sm" oninput="updateBlockContent('${block.tempId}', 'url', this.value)" placeholder="YouTube URL'si" value="${block.content.url || ''}" />`;
    }
    if (block.type === 'Code') {
        return `<textarea class="w-full font-mono text-sm" oninput="onTextareaInput(this, '${block.tempId}', 'code')" placeholder="Kod..." rows="5">${block.content.code || ''}</textarea>`;
    }
    return `<div>Desteklenmeyen blok tipi</div>`;
}

async function handleFileUpload(tempId, file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await fetch('https://localhost:7078/api/media/upload', { method: 'POST', body: formData });
        if (response.ok) {
            const data = await response.json();
            updateBlockContent(tempId, 'url', data.url);
            const input = document.getElementById(`url-${tempId}`);
            if (input) input.value = data.url;
        }
    } catch (e) { console.error(e); }
}

function updateBlockContent(tempId, property, value) {
    const block = blocks.find(b => b.tempId === tempId);
    if (block) { block.content[property] = value; }
}

function onTextareaInput(el, tempId, property) {
    updateBlockContent(tempId, property, el.value);
    autoResize(el);
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function moveBlock(tempId, direction) {
    const index = blocks.findIndex(b => b.tempId === tempId);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const currentOrder = blocks[index].order;
    blocks[index].order = blocks[newIndex].order;
    blocks[newIndex].order = currentOrder;
    renderBlocks();
}

function deleteBlock(tempId) {
    blocks = blocks.filter(b => b.tempId !== tempId);
    renderBlocks();
}

function openPublishModal() { document.getElementById('publishModal').classList.remove('hidden'); }
function closePublishModal() { document.getElementById('publishModal').classList.add('hidden'); }

function confirmPublish() {
    const courseId = document.getElementById('courseSelect').value;
    saveNote(true, courseId);
}

async function saveNote(publish, selectedCourseId = null) {
    const title = document.getElementById('noteTitle').value;
    if (publish && !selectedCourseId) {
        openPublishModal();
        return;
    }
    if (!title) return;

    const payload = {
        title: title,
        courseId: selectedCourseId ? parseInt(selectedCourseId) : null,
        publish: !!publish,
        blocks: blocks.map((b, i) => ({
            type: getNoteBlockTypeEnumValue(b.type),
            order: i + 1,
            content: b.content
        }))
    };

    console.log("Saving Note Payload:", payload);

    const method = noteId > 0 ? 'PUT' : 'POST';
    const url = noteId > 0 ? `https://localhost:7078/api/admin/notes/${noteId}` : 'https://localhost:7078/api/admin/notes';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            if (publish && payload.courseId) {
                window.location.href = '/?courseId=' + payload.courseId;
            } else {
                window.location.href = '/Admin';
            }
        }
    } catch (e) { console.error("Save Error:", e); }
}

async function loadNote(id) {
    const response = await fetch(`https://localhost:7078/api/admin/notes/${id}`);
    const data = await response.json();
    document.getElementById('noteTitle').value = data.title;
    blocks = data.blocks.map(b => ({
        tempId: Math.random().toString(36).substr(2, 9),
        type: getNoteBlockTypeEnumString(b.type),
        content: b.content, // API'den zaten obje olarak geliyor
        order: b.order
    }));
    renderBlocks();
}

function getNoteBlockTypeEnumValue(typeString) {
    const map = { 'Paragraph': 0, 'Heading': 1, 'ImportantNote': 2, 'Video': 3, 'Image': 4, 'DoubleImage': 5, 'Code': 6, 'Quote': 7, 'List': 8 };
    return map[typeString];
}

function getNoteBlockTypeEnumString(value) {
    const val = parseInt(value);
    const map = { 0: 'Paragraph', 1: 'Heading', 2: 'ImportantNote', 3: 'Video', 4: 'Image', 5: 'DoubleImage', 6: 'Code', 7: 'Quote', 8: 'List' };
    return map[val] || 'Paragraph';
}
