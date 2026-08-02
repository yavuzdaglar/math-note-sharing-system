document.addEventListener("DOMContentLoaded", () => {
	const html = document.documentElement;
	const darkToggles = document.querySelectorAll("[data-theme-toggle]");
	const sidebarToggle = document.getElementById("sidebar-toggle");
		const globalThemeToggle = document.getElementById("global-theme-toggle");
		const toastContainer = document.getElementById("toast-container");
	const sidebar = document.getElementById("sidebar");
	const mainContent = document.getElementById("main-content");
	const homeButton = document.getElementById("home-button");
	const loadingState = document.getElementById("loading-state");
	const noteState = document.getElementById("note-state");
	const homeState = document.getElementById("home-state");
	const noteButtons = document.querySelectorAll("[data-note]");
	const noteTitleEls = document.querySelectorAll("[data-note-title]");
	const noteCourseEls = document.querySelectorAll("[data-note-course]");
	const categoryButtons = document.querySelectorAll("[data-category-button]");
	const adminLoginOpen = document.getElementById("admin-login-open");
	const adminLoginModal = document.getElementById("admin-login-modal");
	const adminLoginBackdrop = document.getElementById("admin-login-backdrop");
	const adminLoginCloseButtons = document.querySelectorAll("[data-admin-login-close]");

	let isDark = false;
	let sidebarOpen = true;
	let selectedNote = null;
	let loadingTimer = null;

	const API_BASE_URL = window.API_BASE_URL || 'https://localhost:7078';
	const normalizeMediaUrl = (url) => {
		if (!url) return '';
		if (/^https?:\/\//i.test(url)) return url;
		if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
		return url;
	};

	const updateIcons = () => {
		if (window.lucide) {
			window.lucide.createIcons();
		}
	};

	const setDarkMode = (value) => {
		isDark = value;
		if (isDark) {
			html.classList.add("dark");
		} else {
			html.classList.remove("dark");
		}

		darkToggles.forEach((toggle) => {
			if (isDark) {
				toggle.className = "fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border bg-brand-navy border-brand-teal text-amber-400 hover:scale-105 active:scale-95 shadow-sm";
				toggle.innerHTML = '<i data-lucide="sun" class="w-4 h-4"></i><span class="text-sm font-semibold">Aydınlık</span>';
			} else {
				toggle.className = "fixed top-4 right-4 z-[9999] flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border bg-white/10 border-white/20 text-blue-200 hover:scale-105 active:scale-95 shadow-sm";
				toggle.innerHTML = '<i data-lucide="moon" class="w-4 h-4"></i><span class="text-sm font-semibold">Karanlık</span>';
			}
		});

		try {
			localStorage.setItem("theme", isDark ? "dark" : "light");
		} catch { }
		updateIcons();
	};

	const showToast = (message, type = "info") => {
		const container = toastContainer || (() => {
			const el = document.createElement("div");
			el.id = "toast-container";
			el.className = "fixed bottom-4 right-4 z-[9999] flex flex-col gap-2";
			document.body.appendChild(el);
			return el;
		})();

		const toast = document.createElement("div");
		const base = "px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border backdrop-blur";
		const styles = {
			success: "bg-emerald-500/90 text-white border-emerald-400/40",
			error: "bg-red-500/90 text-white border-red-400/40",
			warning: "bg-amber-500/90 text-white border-amber-400/40",
			info: "bg-slate-900/90 text-white border-slate-700/50"
		};
		toast.className = `${base} ${styles[type] || styles.info}`;
		toast.textContent = message;
		container.appendChild(toast);

		setTimeout(() => {
			toast.remove();
		}, 3500);
	};

	window.showToast = showToast;

	const setSidebarOpen = (value) => {
		sidebarOpen = value;
		if (!sidebar || !mainContent) return;

		if (sidebarOpen) {
			sidebar.classList.remove("-translate-x-full");
			sidebar.classList.add("translate-x-0");
			mainContent.classList.add("pl-64");
			mainContent.classList.remove("pl-0");
			if (sidebarToggle) sidebarToggle.title = "Kenar çubuğunu gizle";
		} else {
			sidebar.classList.add("-translate-x-full");
			sidebar.classList.remove("translate-x-0");
			mainContent.classList.remove("pl-64");
			mainContent.classList.add("pl-0");
			if (sidebarToggle) sidebarToggle.title = "Kenar çubuğunu göster";
		}
	};

	const setLoading = (value) => {
		if (!loadingState || !noteState || !homeState) return;
		if (value) {
			loadingState.classList.remove("hidden");
			noteState.classList.add("hidden");
			homeState.classList.add("hidden");
		} else {
			loadingState.classList.add("hidden");
		}
	};

	const showHome = () => {
		if (!noteState || !homeState) return;
		noteState.classList.add("hidden");
		homeState.classList.remove("hidden");
		const zoom = document.getElementById('zoom-controls');
		if (zoom) zoom.style.display = 'none';
	};

	const showNote = () => {
		if (!noteState || !homeState) return;
		noteState.classList.remove("hidden");
		homeState.classList.add("hidden");
		const zoom = document.getElementById('zoom-controls');
		if (zoom) zoom.style.display = 'flex';
	};

	const updateNoteText = (note) => {
		noteTitleEls.forEach((el) => {
			el.textContent = note;
		});
	};

	const updateCourseText = (courseName) => {
		const label = courseName ? `Ders: ${courseName}` : "Akademik Notlar";
		noteCourseEls.forEach((el) => {
			el.textContent = label;
		});
	};

	const setHomeButtonState = (active) => {
		if (!homeButton) return;
		const activeClasses = ["bg-brand-teal", "text-white", "font-bold", "shadow-lg", "shadow-brand-teal/20"];
		const inactiveClasses = ["text-slate-300", "hover:bg-white/5", "hover:text-white"];

		if (active) {
			homeButton.classList.remove(...inactiveClasses);
			homeButton.classList.add(...activeClasses);
		} else {
			homeButton.classList.remove(...activeClasses);
			homeButton.classList.add(...inactiveClasses);
		}
	};

	const setNoteButtonState = (button, active) => {
		const activeClasses = ["bg-brand-teal", "text-white", "font-medium"];
		const inactiveClasses = ["text-slate-400", "hover:text-white", "hover:bg-white/5"];

		if (active) {
			button.classList.remove(...inactiveClasses);
			button.classList.add(...activeClasses);
		} else {
			button.classList.remove(...activeClasses);
			button.classList.add(...inactiveClasses);
		}
	};

	const setAdminLoginOpen = (value) => {
		if (!adminLoginModal) return;
		adminLoginModal.classList.toggle("hidden", !value);
		adminLoginModal.setAttribute("aria-hidden", (!value).toString());
		document.body.classList.toggle("overflow-hidden", value);
		updateIcons();
	};

	const setSelectedNote = async (noteId) => {
		if (!noteId) {
			showHome();
			setHomeButtonState(true);
			return;
		}
		setLoading(true);
		setHomeButtonState(false);
		try {
			const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`);
			if (response.ok) {
				const note = await response.json();
				updateNoteText(note.title);
				updateCourseText(note.courseName);
				renderBlocksPublic(note.blocks);
				showNote();
			}
		} catch (e) { console.error(e); }
		finally { setLoading(false); }
	};

	const setSelectedCourse = async (courseId) => {
		if (loadingTimer) { clearTimeout(loadingTimer); loadingTimer = null; }
		if (!courseId || courseId === "HOME") {
			setLoading(false);
			showHome();
			setHomeButtonState(true);
			return;
		}

		const normalizedCourseId = courseId.toString().replace(/^course-/, "");

		setLoading(true);
		setHomeButtonState(false);

		try {
			const response = await fetch(`${API_BASE_URL}/api/notes/course/${normalizedCourseId}`);
			if (response.ok) {
				const note = await response.json();
				updateNoteText(note.title);
				updateCourseText(note.courseName);
				renderBlocksPublic(note.blocks);
				showNote();
			} else {
				showHome();
			}
		} catch (e) {
			console.error(e);
			showHome();
		} finally {
			setLoading(false);
		}

		noteButtons.forEach((button) => {
			const buttonId = button.getAttribute("data-note-id");
			const normalizedButtonId = buttonId ? buttonId.toString().replace(/^course-/, "") : null;
			setNoteButtonState(button, normalizedButtonId === normalizedCourseId);
		});
	};

	function renderBlocksIntoContainer(container, blocks) {
		const normalizeBlockType = (value) => {
			if (value === null || value === undefined) return 0;
			if (typeof value === "number") return value;
			if (typeof value === "string") {
				const numeric = parseInt(value, 10);
				if (!Number.isNaN(numeric)) return numeric;
				const normalized = value.trim().toLowerCase();
				const map = {
					paragraph: 0,
					heading: 1,
					subheading: 9,
					importantnote: 2,
					video: 3,
					image: 4,
					doubleimage: 5,
					code: 6,
					quote: 7,
					list: 8,
				grid: 10,
				math: 11,
				gif: 12
			};
				return map[normalized] ?? 0;
			}
			return 0;
		};

		const getYoutubeId = (url) => {
			if (!url) return "";
			const val = url.toString();
			if (val.includes("v=")) return val.split("v=")[1].split("&")[0];
			if (val.includes("youtu.be/")) return val.split("youtu.be/")[1].split("?")[0];
			return "";
		};

		blocks.sort((a, b) => a.order - b.order).forEach(block => {
			const el = document.createElement("div");
			const isTopLevel = container.id === "note-content-area";
			const _isDark = document.documentElement.classList.contains('dark');
			el.className = isTopLevel ? "mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700" : "mb-4";

			const blockType = normalizeBlockType(block.type);
			switch(blockType) {
				case 0: { // Paragraph
					const pHtml = block.content.html || block.content.text || "";
					el.innerHTML = `<div class="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 shadow-sm text-lg leading-relaxed text-slate-700 dark:text-slate-300 break-words">${pHtml}</div>`;
					break;
				}
				case 7: { // Quote
					const qHtml = block.content.text || block.content.html || "";
					el.innerHTML = `<div class="p-6 rounded-2xl border-l-4 border-brand-teal bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm text-lg leading-relaxed italic text-slate-600 dark:text-slate-300">${qHtml}</div>`;
					break;
				}
				case 1: { // Heading
					const level = block.content.level || 2;
					const textColor = { black: _isDark ? '#e2e8f0' : '#162d42', blue:'#2563eb', red:'#dc2626' }[block.content?.color] || (_isDark ? '#e2e8f0' : '#162d42');
					el.innerHTML = `<h${level} class="text-4xl font-black mt-12 mb-6 tracking-tight uppercase border-l-4 border-brand-teal pl-6" style="color:${textColor}">${block.content.html || block.content.text || ''}</h${level}>`;
					break;
				}
				case 9: { // Subheading
					const shColor = { black: _isDark ? '#e2e8f0' : '#162d42', blue:'#2563eb', red:'#dc2626' }[block.content?.color] || (_isDark ? '#e2e8f0' : '#162d42');
					el.innerHTML = `<h3 class="text-2xl font-bold mt-6 mb-3 tracking-tight" style="color:${shColor}"><span class="subheading-dash">- </span>${block.content.html || block.content.text || ''}</h3>`;
					break;
				}
				case 2: // ImportantNote
					el.innerHTML = `
						<div class="p-8 rounded-[2.5rem] text-white shadow-2xl shadow-brand-teal/20 backdrop-blur-sm border border-white/10" style="background:#2d7a6f">
							<div class="flex items-center gap-3 mb-3">
								<i data-lucide="info" class="w-6 h-6"></i>
								<h4 class="font-black text-xl italic underline underline-offset-8">Önemli Bilgi</h4>
							</div>
							<p class="text-lg leading-relaxed font-bold">${block.content.html || block.content.text || ''}</p>
						</div>`;
					break;
				case 3: { // Video
					const url = normalizeMediaUrl(block.content.url || "");
					const mediaScale = Math.max(28, Math.min(100, Number(block.content?.mediaScale ?? 100)));
					const vId = getYoutubeId(url);
					const caption = block.content.caption || "";
					if (vId) {
						el.innerHTML = `
							<div class="media-preview-frame" style="width:${mediaScale}%;margin:0 auto;"><iframe class="media-video-frame" src="https://www.youtube.com/embed/${vId}" frameborder="0" allowfullscreen></iframe></div>
							<p class="text-xs text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">${caption || "Video İçeriği"}</p>`;
					} else {
						el.innerHTML = `
							<div class="media-preview-frame" style="width:${mediaScale}%;margin:0 auto;">
								<video class="media-asset" controls>
									<source src="${url}" />
								</video>
							</div>
							<p class="text-xs text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">${caption || "Yüklenen Video"}</p>`;
					}
					break;
				}
				case 4: // Image
					el.innerHTML = `
						<div class="group relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
							<div class="media-preview-frame" style="width:${Math.max(28, Math.min(100, Number(block.content?.mediaScale ?? 100)))}%;margin:0 auto;"><img src="${normalizeMediaUrl(block.content.url)}" class="media-asset transition-transform duration-700 group-hover:scale-105" alt="Görsel" /></div>
							${block.content.caption ? `<div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white font-bold text-sm">${block.content.caption}</div>` : ""}
						</div>`;
					break;
				case 5: { // DoubleImage
					const urls = block.content?.urls || [];
					const dCap = block.content?.caption || '';
					const imgs = urls.map(u => `<div class="rounded-2xl overflow-hidden shadow-md"><div class="media-preview-frame"><img src="${normalizeMediaUrl(u || '')}" class="media-asset" onerror="this.src='https://via.placeholder.com/400x200?text=Gecersiz+URL'" /></div></div>`).join('');
					el.innerHTML = `<div class="grid grid-cols-2 gap-4">${imgs}</div>${dCap ? `<p class="text-xs text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">${dCap}</p>` : ''}`;
					break;
				}
				case 6: // Code
					el.innerHTML = `
						<div class="p-8 rounded-[2.5rem] bg-slate-900 border border-white/10 shadow-2xl">
							<pre class="text-brand-teal-light font-mono text-sm whitespace-pre-wrap break-words"><code>${block.content.code}</code></pre>
						</div>`;
					break;
				case 8: { // List
					const intro = block.content?.intro || '';
					const items = (block.content.items || []).filter(i => i.trim()).map(i => `<li class="mb-2">${i.trim()}</li>`).join("");
					const introHtml = intro ? `<p class="text-lg text-slate-600 dark:text-slate-300 mb-3">${intro}</p>` : '';
					el.innerHTML = `${introHtml}<ol class="list-decimal pl-8 text-xl text-slate-600 dark:text-slate-300 space-y-2">${items}</ol>`;
					break;
				}
				case 10: { // Grid
					const cols = block.content.columns || [1, 1];
					const colBlocks = block.content.columnBlocks || [];
					const layout = block.content.layout || '';
					const isMatrix = layout === 'matrix2x2';
					const isWideBottom = layout === 'top-two-bottom-wide';
					const total = cols.reduce((a, b) => a + b, 0);
					const gridWrapper = document.createElement('div');
					gridWrapper.className = 'grid gap-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50 shadow-inner';
					gridWrapper.style.gridTemplateColumns = (isMatrix || isWideBottom) ? '1fr 1fr' : cols.map(v => `${(v / total) * 100}%`).join(' ');
					colBlocks.forEach((subBlocks, idx) => {
						const col = document.createElement('div');
						col.className = 'grid-col space-y-4';
						if (isWideBottom && idx === 2) {
							col.style.gridColumn = '1 / -1';
						}
						renderBlocksIntoContainer(col, subBlocks);
						gridWrapper.appendChild(col);
					});
					el.appendChild(gridWrapper);
					break;
				}
			case 11: { // Math
				const latex = block.content.latex || '';
				const display = block.content.display !== false;
				const mathWrapper = document.createElement('div');
				mathWrapper.className = 'math-rendered-block';
				if (latex.trim() && typeof katex !== 'undefined') {
					try {
						katex.render(latex, mathWrapper, { displayMode: display, throwOnError: false });
					} catch {
						mathWrapper.textContent = latex;
					}
				} else {
					mathWrapper.textContent = latex || 'LaTeX ifadesi girilmedi.';
					mathWrapper.className = 'text-slate-400 italic';
				}
				el.appendChild(mathWrapper);
				break;
			}
			case 12: { // Gif
				const gUrl = normalizeMediaUrl(block.content.url || "");
				const gScale = Math.max(28, Math.min(100, Number(block.content?.mediaScale ?? 100)));
				const gSpeed = Number(block.content?.speed ?? 1);
				const gCap = block.content.caption || "";
				el.innerHTML = `
					<div class="gif-block">
						<div class="media-preview-frame" style="width:${gScale}%;margin:0 auto;">
							<canvas class="gif-canvas-public" data-gif-url="${gUrl}" data-gif-speed="${gSpeed}" style="width:100%;height:auto;border-radius:0.75rem;background:transparent;display:block;"></canvas>
						</div>
						<div class="gif-speed-control" style="width:${gScale}%;margin:0 auto;">
							<span>Hız</span>
							<input type="range" min="0.25" max="4" step="0.25" value="${gSpeed}" class="media-size-slider" />
							<strong>${Number(gSpeed).toFixed(1)}x</strong>
						</div>
						${gCap ? `<p class="text-xs text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">${gCap}</p>` : ""}
					</div>`;
				break;
			}
			}
			container.appendChild(el);
		});
	}

	const normalizeBlocksForPublic = (blockArray) => {
		if (!blockArray) return;
		blockArray.forEach(b => {
			if (typeof b.type === 'number' || (typeof b.type === 'string' && /^\d+$/.test(b.type))) {
				const numMap = { 0:'Paragraph',1:'Heading',2:'ImportantNote',3:'Video',4:'Image',5:'DoubleImage',6:'Code',7:'Quote',8:'List',9:'Subheading',10:'Grid',11:'Math',12:'Gif' };
				const n = typeof b.type === 'number' ? b.type : parseInt(b.type, 10);
				b.type = numMap[n] || 'Paragraph';
			} else if (typeof b.type === 'string') {
				const strMap = { paragraph:'Paragraph',heading:'Heading',subheading:'Subheading',importantnote:'ImportantNote',video:'Video',image:'Image',doubleimage:'DoubleImage',code:'Code',quote:'Quote',list:'List',grid:'Grid',math:'Math',gif:'Gif' };
				b.type = strMap[b.type.trim().toLowerCase()] || 'Paragraph';
			} else {
				b.type = 'Paragraph';
			}
			if (b.content && b.content.columnBlocks && Array.isArray(b.content.columnBlocks)) {
				b.content.columnBlocks.forEach(col => normalizeBlocksForPublic(col));
			}
		});
	};

	const renderMathInContainerPublic = (container) => {
		if (!container || typeof katex === 'undefined') return;
		if (!container.textContent || !container.textContent.includes('$')) return;

		const tempRoot = document.createElement(container.tagName || 'div');
		tempRoot.innerHTML = container.innerHTML;
		const walker = document.createTreeWalker(tempRoot, NodeFilter.SHOW_TEXT, null, false);
		const textNodes = [];
		while (walker.nextNode()) textNodes.push(walker.currentNode);

		textNodes.forEach(node => {
			if (!node.textContent.includes('$')) return;
			const text = node.textContent;
			const regex = /\$\$([\s\S]*?)\$\$|\$([^\n$]+?)\$/g;
			const parts = [];
			let lastIndex = 0;
			let match;
			while ((match = regex.exec(text)) !== null) {
				if (match.index > lastIndex) parts.push(document.createTextNode(text.slice(lastIndex, match.index)));
				const latex = match[1] ?? match[2];
				const display = Boolean(match[1]);
				const span = document.createElement('span');
				span.className = display ? 'math-inline math-display' : 'math-inline';
				try { span.innerHTML = katex.renderToString(latex, { displayMode: display, throwOnError: false }); }
				catch { span.textContent = match[0]; }
				parts.push(span);
				lastIndex = match.index + match[0].length;
			}
			if (parts.length > 0) {
				if (lastIndex < text.length) parts.push(document.createTextNode(text.slice(lastIndex)));
				const fragment = document.createDocumentFragment();
				parts.forEach(part => fragment.appendChild(part));
				node.parentNode.replaceChild(fragment, node);
			}
		});

		container.innerHTML = tempRoot.innerHTML;
	};

	const renderBlocksPublic = (blocks) => {
		const area = document.getElementById("note-content-area");
		if (!area) return;
		area.innerHTML = "";
		normalizeBlocksForPublic(blocks);
		renderBlocksIntoContainer(area, blocks);
		renderMathInContainerPublic(area);
		updateIcons();
		if (window.GifPlayer) {
			window.GifPlayer.stopAll();
			area.querySelectorAll('.gif-canvas-public').forEach((canvas) => {
				window.GifPlayer.play(canvas, canvas.dataset.gifUrl || '', Number(canvas.dataset.gifSpeed || 1));
			});
			area.querySelectorAll('.gif-speed-control').forEach((control) => {
				const slider = control.querySelector('input[type="range"]');
				const valueEl = control.querySelector('strong');
				const canvas = control.closest('.gif-block')?.querySelector('.gif-canvas-public');
				if (!slider) return;
				slider.addEventListener('input', () => {
					const v = parseFloat(slider.value);
					if (valueEl) valueEl.textContent = `${v.toFixed(1)}x`;
					if (canvas) window.GifPlayer.setSpeed(canvas, v);
				});
			});
		}
	};

	const toggleCategory = (button) => {
		const categoryId = button.getAttribute("data-category-id");
		if (!categoryId) return;

		const panel = document.querySelector(`[data-category-panel="${categoryId}"]`);
		const isOpen = button.getAttribute("aria-expanded") === "true";
		button.setAttribute("aria-expanded", (!isOpen).toString());

		if (isOpen) {
			button.classList.remove("bg-brand-teal/30", "text-brand-teal-light");
			button.classList.add("hover:bg-white/5", "text-slate-300", "hover:text-white");
		} else {
			button.classList.add("bg-brand-teal/30", "text-brand-teal-light");
			button.classList.remove("hover:bg-white/5", "text-slate-300", "hover:text-white");
		}

		if (panel) {
			panel.classList.toggle("hidden", isOpen);
		}

		const chevron = button.querySelector("[data-chevron]");
		if (chevron) {
			chevron.setAttribute("data-lucide", isOpen ? "chevron-right" : "chevron-down");
			updateIcons();
		}
	};

	darkToggles.forEach((toggle) => {
		toggle.addEventListener("click", () => setDarkMode(!isDark));
	});



	const storedTheme = (() => {
		try { return localStorage.getItem("theme"); } catch { return null; }
	})();
	setDarkMode(storedTheme === "dark");

	if (sidebarToggle) {
		sidebarToggle.addEventListener("click", () => setSidebarOpen(!sidebarOpen));
	}

	if (homeButton) {
		homeButton.addEventListener("click", () => {
			setSelectedNote(null);
			showHome();
			setHomeButtonState(true);
		});
	}

	noteButtons.forEach((button) => {
		const noteId = button.getAttribute("data-note-id");
		if (!noteId) return;
		button.addEventListener("click", () => setSelectedCourse(noteId));
	});

	categoryButtons.forEach((button) => {
		button.addEventListener("click", () => toggleCategory(button));
	});

	if (adminLoginOpen) {
		adminLoginOpen.addEventListener("click", () => setAdminLoginOpen(true));
	}

	if (adminLoginBackdrop) {
		adminLoginBackdrop.addEventListener("click", () => setAdminLoginOpen(false));
	}

	adminLoginCloseButtons.forEach((button) => {
		button.addEventListener("click", () => setAdminLoginOpen(false));
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && adminLoginModal && !adminLoginModal.classList.contains("hidden")) {
			setAdminLoginOpen(false);
		}
	});

	let zoomLevel = 100;
	const zoomArea = document.getElementById('note-content-area');
	const zoomDisplay = document.getElementById('zoom-level');

	window.zoomIn = () => {
		zoomLevel = Math.min(zoomLevel + 10, 200);
		applyZoom();
	};
	window.zoomOut = () => {
		zoomLevel = Math.max(zoomLevel - 10, 50);
		applyZoom();
	};
	window.zoomAuto = () => {
		zoomLevel = 100;
		applyZoom();
	};
	function applyZoom() {
		if (zoomArea) zoomArea.style.zoom = zoomLevel / 100;
		if (zoomDisplay) zoomDisplay.textContent = zoomLevel + '%';
	}

	const urlParams = new URLSearchParams(window.location.search);
	const courseIdParam = urlParams.get('courseId');
	if (courseIdParam) {
		setSelectedCourse(courseIdParam);
	} else {
		setSelectedNote(null);
	}
	
	// Triple-click logo to open admin login
	let _logoClickCount = 0;
	let _logoTimer = null;
	window.handleLogoClick = () => {
		_logoClickCount++;
		if (_logoClickCount >= 3) {
			_logoClickCount = 0;
			if (_logoTimer) clearTimeout(_logoTimer);
			const modal = document.getElementById('admin-login-modal');
			if (modal) {
				modal.classList.remove('hidden');
				modal.setAttribute('aria-hidden', 'false');
				document.body.classList.add('overflow-hidden');
				updateIcons();
			}
			return;
		}
		if (_logoTimer) clearTimeout(_logoTimer);
		_logoTimer = setTimeout(() => { _logoClickCount = 0; }, 800);
	};

	updateIcons();
});
