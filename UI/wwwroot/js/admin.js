function showConfirm(message, confirmText = 'Sil', cancelText = 'İptal') {
    return new Promise(resolve => {
        const isDark = document.documentElement.classList.contains('dark');
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding-top:100px;opacity:0;transition:opacity 0.25s ease';
        const card = document.createElement('div');
        card.style.cssText = `background:${isDark?'#0f172a':'white'};border-radius:1.5rem;padding:2rem;max-width:420px;width:90%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.3);transform:translateY(-30px);transition:transform 0.3s ease;border:1px solid ${isDark?'#334155':'#e2e8f0'}`;
        const safeMessage = escapeHtml(message);
        card.innerHTML = `
            <p style="font-size:1.05rem;font-weight:700;color:${isDark?'#e2e8f0':'#162d42'};margin:0 0 1.5rem;line-height:1.6">${safeMessage}</p>
            <div style="display:flex;gap:0.75rem;justify-content:flex-end">
                <button id="confirm-cancel" style="padding:0.75rem 1.5rem;border-radius:0.75rem;border:1px solid ${isDark?'#334155':'#e2e8f0'};background:${isDark?'#1e293b':'white'};color:${isDark?'#94a3b8':'#64748b'};font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s">${escapeHtml(cancelText)}</button>
                <button id="confirm-ok" style="padding:0.75rem 1.5rem;border-radius:0.75rem;border:none;background:#ef4444;color:white;font-weight:700;font-size:0.9rem;cursor:pointer;transition:all 0.15s">${escapeHtml(confirmText)}</button>
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

function escapeHtml(v) {
    return (v === null || v === undefined ? '' : String(v)).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeForAttr(v) {
    return escapeHtml(v).replace(/\n/g, '&#10;');
}

document.addEventListener('DOMContentLoaded', function () {
    const apiBase = (window.API_BASE_URL || 'https://localhost:7078') + '/api';
    const apiToken = window.API_TOKEN || '';
    const apiFetch = (url, options = {}) => {
        const headers = new Headers(options.headers || {});
        if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);
        return fetch(url, { ...options, headers });
    };
    const apiFetchJson = (url, options = {}) => {
        const headers = new Headers((options || {}).headers || {});
        headers.set('Content-Type', 'application/json');
        if (apiToken) headers.set('Authorization', `Bearer ${apiToken}`);
        return fetch(url, { ...(options || {}), headers });
    };
    const handleAuthError = (response) => {
        if (response.status === 401) {
            window.location.href = '/';
            return true;
        }
        return false;
    };

    // Sekme değiştirme işlevselliği
    window.switchTab = function (tabName) {
        // Tüm tab içeriklerini gizle
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        // Tüm tab butonlarının aktif stilini kaldır
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('text-slate-500', 'hover:bg-slate-50');
        });

        // İlgili tab içeriğini göster
        document.getElementById('content-' + tabName).classList.remove('hidden');
        // İlgili tab butonunu aktif yap
        const activeButton = document.getElementById('tab-' + tabName);
        activeButton.classList.add('active');
        activeButton.classList.remove('text-slate-500', 'hover:bg-slate-50');

        if (tabName === 'notes') {
            loadNotes(searchInput ? searchInput.value : '');
        }
    };

    // Notları yükleme fonksiyonu
    async function loadNotes(searchTerm = '') {
        const tableBody = document.getElementById('notesTableBody');
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-8">Yükleniyor...</td></tr>';

        try {
            const response = await apiFetch(`${apiBase}/admin/notes?search=${encodeURIComponent(searchTerm)}`);
            if (handleAuthError(response)) return;
            if (!response.ok) throw new Error('Notlar yüklenemedi.');

            const result = await response.json();
            const notes = result.items;

            if (notes.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-8">Gösterilecek not bulunamadı.</td></tr>';
                return;
            }

            tableBody.innerHTML = '';
            notes.forEach(note => {
                const isPublished = note.status === 1 || note.status === "Published";
                const statusBadge = isPublished
                    ? '<span class="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full">Yayınlandı</span>'
                    : '<span class="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Taslak</span>';

                const titleSafe = escapeHtml(note.title);
                const courseNameSafe = escapeHtml(note.courseName);
                const courseCatSafe = escapeHtml(note.courseCategoryName);
                const titleAttr = escapeForAttr(note.title);

                const courseInfo = note.courseName
                    ? `<div class="font-bold text-slate-800">${courseNameSafe}</div><div class="text-xs text-slate-500">${courseCatSafe || 'Kategorisiz'}</div>`
                    : '<span class="text-slate-400 italic">Derse bağlanmamış</span>';

                const row = `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-8 py-5">
                            <div class="font-bold text-slate-800 text-base">${titleSafe}</div>
                            <div class="text-sm text-slate-500">${escapeHtml(note.blockCount)} blok</div>
                        </td>
                        <td class="px-8 py-5">${statusBadge}</td>
                        <td class="px-8 py-5">${courseInfo}</td>
                        <td class="px-8 py-5 text-right">
                            <a href="/Notes/Edit/${escapeForAttr(note.id)}" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-lg transition-colors">Düzenle</a>
                            <button onclick="deleteNote(${escapeForAttr(note.id)}, '${titleAttr}')" class="ml-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors">Sil</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-red-500">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    // Not silme fonksiyonu
    window.deleteNote = async function (id, title) {
        const confirmed = await showConfirm(`<strong>${escapeHtml(title)}</strong> başlıklı notu silmek istediğinizden emin misiniz?<br><span style="font-size:0.85rem;font-weight:400;color:#94a3b8">Bu işlem geri alınamaz.</span>`);
        if (!confirmed) return;

        try {
            const response = await apiFetch(`${apiBase}/admin/notes/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            if (handleAuthError(response)) return;

            if (response.ok) {
                loadNotes(document.getElementById('searchInput').value);
            } else {
                if (window.showToast) {
                    window.showToast('Not silinirken bir hata oluştu.', 'error');
                }
            }
        } catch (error) {
            if (window.showToast) {
                window.showToast('Bir hata oluştu: ' + escapeHtml(error.message), 'error');
            }
        }
    };

    // Arama inputu
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadNotes(e.target.value);
            }, 300);
        });
    }

    // Modal ve katalog işlemleri
    window.openCategoryModal = function () { document.getElementById('catModal').classList.remove('hidden'); };
    window.closeCatModal = function () { document.getElementById('catModal').classList.add('hidden'); };
    window.openCourseModal = function () { document.getElementById('courseModal').classList.remove('hidden'); };
    window.closeCourseModal = function () { document.getElementById('courseModal').classList.add('hidden'); };

    window.saveCategory = async function () {
        const name = document.getElementById('catName').value;
        if (!name) return;
        await apiFetchJson(`${apiBase}/CourseCategories`, {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        location.reload();
    };

    window.deleteCategory = async function (id) {
        const confirmed = await showConfirm('Bu kategoriyi silmek istediğinizden emin misiniz?<br><span style="font-size:0.85rem;font-weight:400;color:#94a3b8">Kategoriye bağlı dersler etkilenebilir.</span>');
        if (!confirmed) return;
        const response = await apiFetch(`${apiBase}/CourseCategories/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (handleAuthError(response)) return;
        location.reload();
    };

    window.saveCourse = async function () {
        const name = document.getElementById('courseName').value;
        const categoryId = document.getElementById('courseCatSelect').value;
        if (!name || !categoryId) return;
        await apiFetchJson(`${apiBase}/Courses`, {
            method: 'POST',
            body: JSON.stringify({ name, courseCategoryId: parseInt(categoryId) })
        });
        location.reload();
    };

    window.deleteCourse = async function (id) {
        const confirmed = await showConfirm('Bu dersi silmek istediğinizden emin misiniz?<br><span style="font-size:0.85rem;font-weight:400;color:#94a3b8">Derse bağlı notlar yayından kalkabilir.</span>');
        if (!confirmed) return;
        const response = await apiFetch(`${apiBase}/Courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (handleAuthError(response)) return;
        location.reload();
    };

    // Admin yönetimi
    window.openAdminModal = function () {
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminModal').classList.remove('hidden');
    };
    window.closeAdminModal = function () { document.getElementById('adminModal').classList.add('hidden'); };

    async function loadAdmins() {
        const tableBody = document.getElementById('adminsTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center p-8">Yükleniyor...</td></tr>';
        try {
            const response = await apiFetch(`${apiBase}/admin/manage`);
            if (handleAuthError(response)) return;
            const admins = await response.json();
            if (admins.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" class="text-center p-8">Henüz admin bulunamadı.</td></tr>';
                return;
            }
            tableBody.innerHTML = '';
            admins.forEach(a => {
                tableBody.innerHTML += `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-8 py-5"><div class="font-bold text-slate-800">${escapeHtml(a.username)}</div></td>
                        <td class="px-8 py-5 text-slate-500">${new Date(a.createdAtUtc).toLocaleDateString('tr-TR')}</td>
                        <td class="px-8 py-5 text-right">
                            <button onclick="deleteAdmin(${escapeForAttr(a.id)})" class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors">Sil</button>
                        </td>
                    </tr>`;
            });
            if (window.lucide) window.lucide.createIcons();
        } catch (e) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-red-500">${escapeHtml(e.message)}</td></tr>`;
        }
    }

    window.saveAdmin = async function () {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        if (!username || !password) { alert('Kullanıcı adı ve şifre gerekli.'); return; }
        const response = await apiFetchJson(`${apiBase}/admin/manage`, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (handleAuthError(response)) return;
        if (response.ok) {
            closeAdminModal();
            loadAdmins();
        } else {
            const err = await response.json();
            alert(err.message || 'Admin oluşturulamadı.');
        }
    };

    window.deleteAdmin = async function (id) {
        const confirmed = await showConfirm('Bu admini silmek istediğinizden emin misiniz?<br><span style="font-size:0.85rem;font-weight:400;color:#94a3b8">Bu işlem geri alınamaz.</span>');
        if (!confirmed) return;
        const response = await apiFetch(`${apiBase}/admin/manage/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (handleAuthError(response)) return;
        loadAdmins();
    };

    // Sekme değiştiğinde adminleri yükle
    const origSwitchTab = window.switchTab;
    window.switchTab = function (tabName) {
        if (tabName === 'admins') loadAdmins();
        origSwitchTab(tabName);
    };

    // Başlangıçta notları yükle
    loadNotes();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
