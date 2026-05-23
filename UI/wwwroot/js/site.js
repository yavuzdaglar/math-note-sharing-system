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
	};

	const showNote = () => {
		if (!noteState || !homeState) return;
		noteState.classList.remove("hidden");
		homeState.classList.add("hidden");
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
		if (!noteId) return;
		setLoading(true);
		setHomeButtonState(false);
		try {
			const response = await fetch(`https://localhost:7078/api/notes/${noteId}`);
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
			const response = await fetch(`https://localhost:7078/api/notes/course/${normalizedCourseId}`);
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

	const renderBlocksPublic = (blocks) => {
		const area = document.getElementById("note-content-area");
		if (!area) return;
		area.innerHTML = "";

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
					importantnote: 2,
					video: 3,
					image: 4,
					doubleimage: 5,
					code: 6,
					quote: 7,
					list: 8
				};
				return map[normalized] ?? 0;
			}
			return 0;
		};

		blocks.sort((a, b) => a.order - b.order).forEach(block => {
			const el = document.createElement("div");
			el.className = "mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700";

			const blockType = normalizeBlockType(block.type);
			switch(blockType) {
				case 0: // Paragraph
				case 7: // Quote
					el.innerHTML = `<p class="text-xl leading-relaxed text-slate-600 dark:text-slate-300 font-medium">${block.content.text}</p>`;
					break;
				case 1: // Heading
					const level = block.content.level || 2;
					el.innerHTML = `<h${level} class="text-3xl font-black text-brand-navy dark:text-white mt-12 mb-6 tracking-tight uppercase border-l-4 border-brand-teal pl-6">${block.content.text}</h${level}>`;
					break;
				case 2: // ImportantNote
					el.innerHTML = `
						<div class="p-8 rounded-[2.5rem] bg-brand-teal text-white shadow-2xl shadow-brand-teal/20 backdrop-blur-sm border border-white/10">
							<div class="flex items-center gap-3 mb-3">
								<i data-lucide="info" class="w-6 h-6"></i>
								<h4 class="font-black text-xl italic underline underline-offset-8">Önemli Bilgi</h4>
							</div>
							<p class="text-lg opacity-90 leading-relaxed font-bold">${block.content.text}</p>
						</div>`;
					break;
				case 3: // Video
					let videoId = "";
					const url = block.content.url;
					if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
					else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
					
					el.innerHTML = `
						<div class="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-black">
							<iframe class="w-full h-full" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
						</div>
						<p class="text-xs text-center mt-4 text-slate-400 font-bold uppercase tracking-widest">Video İçeriği</p>`;
					break;
				case 4: // Image
					el.innerHTML = `
						<div class="group relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5">
							<img src="${block.content.url}" class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" alt="Görsel" />
							${block.content.caption ? `<div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent text-white font-bold text-sm">${block.content.caption}</div>` : ""}
						</div>`;
					break;
				case 6: // Code
					el.innerHTML = `
						<div class="p-8 rounded-[2.5rem] bg-slate-900 border border-white/10 shadow-2xl">
							<pre class="text-brand-teal-light font-mono text-sm overflow-x-auto"><code>${block.content.code}</code></pre>
						</div>`;
					break;
				case 8: // List
					const items = block.content.items.map(i => `<li class="mb-2">${i}</li>`).join("");
					el.innerHTML = `<ul class="list-disc pl-8 text-xl text-slate-600 dark:text-slate-300 space-y-2 font-medium">${items}</ul>`;
					break;
			}
			area.appendChild(el);
		});
		updateIcons();
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
		homeButton.addEventListener("click", () => setSelectedNote(null));
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

	const urlParams = new URLSearchParams(window.location.search);
	const courseIdParam = urlParams.get('courseId');
	if (courseIdParam) {
		setSelectedCourse(courseIdParam);
	} else {
		setSelectedNote(null);
	}
	
	updateIcons();
});
