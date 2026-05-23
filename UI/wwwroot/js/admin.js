document.addEventListener('DOMContentLoaded', function () {
    const apiBase = "https://localhost:7078/api";
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
            const response = await fetch(`${apiBase}/admin/notes?search=${searchTerm}`);
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

                const courseInfo = note.courseName
                    ? `<div class="font-bold text-slate-800">${note.courseName}</div><div class="text-xs text-slate-500">${note.courseCategoryName || 'Kategorisiz'}</div>`
                    : '<span class="text-slate-400 italic">Derse bağlanmamış</span>';

                const row = `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-8 py-5">
                            <div class="font-bold text-slate-800 text-base">${note.title}</div>
                            <div class="text-sm text-slate-500">${note.blockCount} blok</div>
                        </td>
                        <td class="px-8 py-5">${statusBadge}</td>
                        <td class="px-8 py-5">${courseInfo}</td>
                        <td class="px-8 py-5 text-right">
                            <a href="/Notes/Edit/${note.id}" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-lg transition-colors">Düzenle</a>
                            <button onclick="deleteNote(${note.id}, '${note.title}')" class="ml-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors">Sil</button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });

            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-8 text-red-500">${error.message}</td></tr>`;
        }
    }

    // Not silme fonksiyonu
    window.deleteNote = async function (id, title) {
        if (!confirm(`'${title}' başlıklı notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

        try {
            const response = await fetch(`https://localhost:7078/api/admin/notes/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadNotes(document.getElementById('searchInput').value);
            } else {
                if (window.showToast) {
                    window.showToast('Not silinirken bir hata oluştu.', 'error');
                }
            }
        } catch (error) {
            if (window.showToast) {
                window.showToast('Bir hata oluştu: ' + error.message, 'error');
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
        await fetch(`${apiBase}/CourseCategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        location.reload();
    };

    window.deleteCategory = async function (id) {
        await fetch(`${apiBase}/CourseCategories/${id}`, { method: 'DELETE' });
        location.reload();
    };

    window.saveCourse = async function () {
        const name = document.getElementById('courseName').value;
        const categoryId = document.getElementById('courseCatSelect').value;
        if (!name || !categoryId) return;
        await fetch(`${apiBase}/Courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, courseCategoryId: parseInt(categoryId) })
        });
        location.reload();
    };

    window.deleteCourse = async function (id) {
        await fetch(`${apiBase}/Courses/${id}`, { method: 'DELETE' });
        location.reload();
    };

    // Başlangıçta notları yükle
    loadNotes();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
