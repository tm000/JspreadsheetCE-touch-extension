var touchPlugin = (() => {
	// Create a div as the selection & resize handle
	const selHandleTL = document.createElement('div');
	const selHandleBR = document.createElement('div');
	const rszHandle = document.createElement('div');
	selHandleTL.setAttribute('id', 'selHandleTL');
	selHandleBR.setAttribute('id', 'selHandleBR');
	rszHandle.setAttribute('id', 'rszHandle');
	selHandleTL.style.position = selHandleBR.style.position = rszHandle.style.position = 'absolute';
	rszHandle.style.border = 'none';
	selHandleTL.style.zIndex = selHandleBR.style.zIndex = rszHandle.style.zIndex = 9999;

	// Define variables to control the state
	var orginx, orginy;
	var jexcelCurrent, isTouch = false;
	const RESIZE_HANDLE_BASE_SIZE = 30;

	// Option setting defaults
	const defaultOptions = {
		contextMenuMode: 'icon',
		contextMenuShowDelay: 500,
		iconSize: 32,
		handleSize: RESIZE_HANDLE_BASE_SIZE,
		selectionHandleColor: 'white',
		selectionHandleBorder: 'black 1px solid',
	};

	// Defining default icons using Material Icons
	const defaultIcon = new Map();
	defaultIcon.set(jSuites.translate('Insert a new column before'), '<span class="material-symbols-outlined">&#xf425</span>');	// add_column_left
	defaultIcon.set(jSuites.translate('Insert a new column after'), '<span class="material-symbols-outlined">&#xf424</span>');	// add_column_right
	defaultIcon.set(jSuites.translate('Delete selected columns'), '<span class="material-symbols-outlined">&#xf82e</span>');	// cell_merge
	defaultIcon.set(jSuites.translate('Rename this column'), '<span class="material-symbols-outlined">&#xf88d</span>');	// edit_square
	defaultIcon.set(jSuites.translate('Order ascending'), '<span class="material-symbols-outlined">&#xe164</span>');	// sort
	defaultIcon.set(jSuites.translate('Order descending'), '<span class="material-symbols-outlined">&#xe94b</span>');	// segment
	defaultIcon.set(jSuites.translate('Insert a new row before'), '<span class="material-symbols-outlined">&#xf423</span>');	// add_row_above
	defaultIcon.set(jSuites.translate('Insert a new row after'), '<span class="material-symbols-outlined">&#xf422</span>');	// add_row_below
	defaultIcon.set(jSuites.translate('Delete selected rows'), '<span class="material-symbols-outlined">&#xf51c</span>');	// variable_remove
	defaultIcon.set(jSuites.translate('Add comments'), 'notes');
	defaultIcon.set(jSuites.translate('Edit comments'), 'edit_note');
	defaultIcon.set(jSuites.translate('Clear comments'), 'clear_all');
	defaultIcon.set(jSuites.translate('Copy'), 'content_copy');
	defaultIcon.set(jSuites.translate('Paste'), 'content_paste');
	defaultIcon.set(jSuites.translate('Save as'), 'save');
	defaultIcon.set(jSuites.translate('About'), 'info');

	var tex = {};

	tex.plugin = function(optVal = {}) {
		var options = {
			...defaultOptions, ...optVal
		};

		function showSelectionHandle() {
			if (!jexcel.current.selectedCell) return;
			const cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
			const contentRect = jexcel.current.content.getBoundingClientRect();
			const scrollTop = jexcel.current.content.scrollTop;
			const scrollLeft = jexcel.current.content.scrollLeft;

			// Get visible column ID excluding hidden columns
			let col1 = parseInt(jexcel.current.selectedCell[0]);
			let col2 = parseInt(jexcel.current.selectedCell[2]);
			while (jexcel.current.cols[col1].colElement.style.display == 'none') col1++;
			while (jexcel.current.cols[col2].colElement.style.display == 'none') col2--;

			const cellTL = jexcel.current.getCellFromCoords(col1, jexcel.current.selectedCell[1]);
			const cellBR = jexcel.current.getCellFromCoords(col2, jexcel.current.selectedCell[3]);
			const infoTL = cellTL.getBoundingClientRect();
			const infoBR = cellBR.getBoundingClientRect();
			if (cornerCell.left >= 0) {
				selHandleTL.style.left = (infoTL.left - cornerCell.left - options.handleSize / 2) + 'px';
				selHandleBR.style.left = (infoBR.right - cornerCell.left - options.handleSize / 2) + 'px';
			} else {
				selHandleTL.style.left = (infoTL.left + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
				selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
			}
			selHandleTL.style.top = (infoTL.top - cornerCell.top + scrollTop - options.handleSize / 2) + 'px';
			selHandleBR.style.top = (infoBR.bottom - cornerCell.top + scrollTop - options.handleSize / 2) + 'px';
			selHandleTL.style.display = 'block';
			selHandleBR.style.display = 'block';
		}

		function showResizeHandle() {
			if (!jexcel.current.selectedCell || (jexcel.current.selectedRow === false && jexcel.current.selectedHeader === false)) return;
			const cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
			const contentRect = jexcel.current.content.getBoundingClientRect();
			const scrollTop = jexcel.current.content.scrollTop;
			const scrollLeft = jexcel.current.content.scrollLeft;

			if (jexcel.current.selectedRow != null && jexcel.current.selectedCell[1] == jexcel.current.selectedCell[3]) {
				// Get visible column ID excluding hidden columns
				let col = 0;
				while (jexcel.current.cols[col].colElement.style.display == 'none') col++;

				const cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
				const info = cell.getBoundingClientRect();
				rszHandle.style.left = ((cornerCell.width - RESIZE_HANDLE_BASE_SIZE) / 2) + 'px';
				rszHandle.style.top = (info.bottom- cornerCell.top + scrollTop - RESIZE_HANDLE_BASE_SIZE / 2 + 2) + 'px';
				rszHandle.classList.add('rotate90');
				rszHandle.style.display = 'block';
			} else if (jexcel.current.selectedHeader != null && jexcel.current.selectedCell[0] == jexcel.current.selectedCell[2]) {
				const cell = jexcel.current.getCellFromCoords(jexcel.current.selectedHeader, 0);
				const info = cell.getBoundingClientRect();
				if (cornerCell.left >= 0) {
					rszHandle.style.left = (info.right - cornerCell.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
				} else {
					rszHandle.style.left = (info.right + scrollLeft - contentRect.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
				}
				rszHandle.style.top = ((scrollTop + cornerCell.height - RESIZE_HANDLE_BASE_SIZE) / 2 + 2) + 'px';
				rszHandle.classList.remove('rotate90');
				rszHandle.style.display = 'block';
			}
		}

		function hideHandles() {
			selHandleTL.style.display = 'none';
			selHandleBR.style.display = 'none';
			rszHandle.style.display = 'none';
		}

		function showContextMenu(e, x, y) {
			if (jexcel.current.parent.contextMenu) {
				// Clear any time control
				if (jexcel.timeControl_tex) {
					clearTimeout(jexcel.timeControl_tex);
					jexcel.timeControl_tex = null;
				}
				jexcel.timeControl_tex = setTimeout(function() {
					if (jexcel.current && jexcel.current.parent.contextMenu) {
						jexcel.current.parent.contextMenu.contextmenu.close();

						// Hold the touched coordinates
						const el = jexcel.current.parent.contextMenu;
						el.dataset.x = e.changedTouches[0].clientX;
						el.dataset.y = e.changedTouches[0].clientY;

						if (options.contextMenuMode == 'expand') {
							var items = [{
								title:'･･･',
								onclick:function() {
									// Trigger a contextmenu event
									const cmevent = new Event('contextmenu', { bubbles: true });
									jexcel.current.getCellFromCoords(x, y).dispatchEvent(cmevent);
								}
							}];
							jexcel.current.parent.contextMenu.contextmenu.open(e, items);
							// Reduce the size of the popup
							const div = el.children[1];
							div.style.width = 'inherit';
							div.style.paddingLeft = window.getComputedStyle(div).getPropertyValue('padding-right');	
						} else {
							// Trigger a contextmenu event
							const cmevent = new Event('contextmenu', { bubbles: true });
							jexcel.current.getCellFromCoords(x, y).dispatchEvent(cmevent);
						}
					}
				}, options.contextMenuShowDelay);
			}
		}

		function selHandleTouchstart(which, e) {
			// Clear any time control
			if (jexcel.timeControl_tex) {
				clearTimeout(jexcel.timeControl_tex);
				jexcel.timeControl_tex = null;
			}
			if (jexcel.current.options.contextMenu) {
				jexcel.current.contextMenu.contextmenu.close();
			}
			if (which == 'TL') {
				orginx = jexcel.current.selectedCell[0];
				orginy = jexcel.current.selectedCell[1];
			} else {
				orginx = jexcel.current.selectedCell[2];
				orginy = jexcel.current.selectedCell[3];
			}
			jexcel.isMouseAction = true;
		}

		function selHandleTouchend(e) {
			let x = jexcel.current.selectedCell[0];
			let y = jexcel.current.selectedCell[1];
			showSelectionHandle();
			showContextMenu(e, x, y);
		}

		function selHandleTouchmove(which, e) {
			hideHandles();
			let col1 = jexcel.current.selectedCell[0];
			let row1 = jexcel.current.selectedCell[1];
			let col2 = jexcel.current.selectedCell[2];
			let row2 = jexcel.current.selectedCell[3];
			let selectedCell = jexcel.current.getCellFromCoords(orginx, orginy);
			let cellTL = jexcel.current.getCellFromCoords(col1, row1);
			let cellBR = jexcel.current.getCellFromCoords(col2, row2);
			let selectedInfo = selectedCell?.getBoundingClientRect();
			let infoTL = cellTL.getBoundingClientRect();
			let infoBR = cellBR.getBoundingClientRect();
			let touch = e.touches[0];
			const colsize = jexcel.current.options.columns.length;
			const rowsize = jexcel.current.options.data.length;
			if (col1 > 0 && touch.clientX < (infoTL.left - options.handleSize)) {
				col1--;
				orginx = col1;
			} else if (col2 < (colsize-1) && touch.clientX > (infoBR.right + options.handleSize)) {
				col2++;
				orginx = col2;
			} else if (touch.clientX > selectedInfo?.right && touch.clientX < infoBR.right) {
				col1++;
				orginx = col1;
			} else if (infoTL.left < touch.clientX && touch.clientX < selectedInfo?.left) {
				col2--;
				orginx = col2;
			}
			if (row1 > 0 && touch.clientY < (infoTL.top - options.handleSize)) {
				row1--;
				orginy = row1;
			} else if (row2 < (rowsize-1) && touch.clientY > (infoBR.bottom + options.handleSize)) {
				row2++;
				orginy = row2;
			} else if (touch.clientY > selectedInfo?.bottom && touch.clientY < infoBR.bottom) {
				row1++;
				orginy = row1;
			} else if (infoTL.top < touch.clientY && touch.clientY < selectedInfo?.top) {
				row2--;
				orginy = row2;
			}
			jexcel.current.updateSelectionFromCoords(col1, row1, col2, row2);
			e.preventDefault();
		}
		selHandleTL.addEventListener('touchstart', (e) => selHandleTouchstart('TL', e));
		selHandleTL.addEventListener('touchend', selHandleTouchend);
		selHandleTL.addEventListener('touchcancel', selHandleTouchend);
		selHandleTL.addEventListener('touchmove', (e) => selHandleTouchmove('TL', e));
		selHandleBR.addEventListener('touchstart', (e) => selHandleTouchstart('BR', e));
		selHandleBR.addEventListener('touchend', selHandleTouchend);
		selHandleBR.addEventListener('touchcancel', selHandleTouchend);
		selHandleBR.addEventListener('touchmove', (e) => selHandleTouchmove('BR', e));

		function rszHandleTouchStart(e) {
			let touch = e.touches[0];
			if (jexcel.current.selectedRow || jexcel.current.selectedRow === 0) {
				let rowId = jexcel.current.selectedRow;
				let x = 0;
				while (jexcel.current.cols[x].colElement.style.display == 'none') x++;
				let cell = jexcel.current.getCellFromCoords(x, rowId);
				let info = cell.getBoundingClientRect();
				// Resize helper
				jexcel.current.resizing = {
					element: cell.parentNode,
					mousePosition: touch.clientY,
					row: rowId,
					height: info.height,
				};
				// Border indication
				cell.parentNode.classList.add('resizing');
			} else if (jexcel.current.selectedHeader) {
				let columnId = jexcel.current.selectedHeader;
				let cell = jexcel.current.getCellFromCoords(columnId, 0);
				let info = cell.getBoundingClientRect();
				// Resize helper
				jexcel.current.resizing = {
					mousePosition: touch.clientX,
					column: columnId,
					width: info.width,
				};
				// Border indication
				jexcel.current.headers[columnId].classList.add('resizing');
				for (var i = 0; i < jexcel.current.records.length; i++) {
					if (jexcel.current.records[i][columnId]) {
						jexcel.current.records[i][columnId].element.classList.add('resizing');
					}
				}
			}

			jexcel.isMouseAction = true;
		}

		function rszHandleTouchend(e) {
			jexcel.isMouseAction = false;
		}

		function rszHandleTouchmove(e) {
			if (jexcel.current) {
				// Resizing is ongoing
				if (jexcel.current.resizing) {
					let touch = e.touches[0];
					let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
					let contentRect = jexcel.current.content.getBoundingClientRect();
					const scrollTop = jexcel.current.content.scrollTop;
					const scrollLeft = jexcel.current.content.scrollLeft;
					if (jexcel.current.resizing.column) {
						var width = touch.clientX - jexcel.current.resizing.mousePosition;

						if (jexcel.current.resizing.width + width > 0) {
							var tempWidth = jexcel.current.resizing.width + width;
							jexcel.current.setWidth(jexcel.current.resizing.column, tempWidth);
							let cell = jexcel.current.getCellFromCoords(jexcel.current.selectedHeader, 0);
							let info = cell.getBoundingClientRect();
							if (cornerCell.left >= 0) {
								rszHandle.style.left = (info.right - cornerCell.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
							} else {
								rszHandle.style.left = (info.right + scrollLeft - contentRect.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
							}
						}
					} else {
						var height = touch.clientY - jexcel.current.resizing.mousePosition;

						if (jexcel.current.resizing.height + height > 0) {
							var tempHeight = jexcel.current.resizing.height + height;
							jexcel.current.setHeight(jexcel.current.resizing.row, tempHeight);
							// Get visible column ID excluding hidden columns
							let col = 0;
							while (jexcel.current.cols[col].colElement.style.display == 'none') col++;

							let cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
							let info = cell.getBoundingClientRect();
							rszHandle.style.top = (info.bottom- cornerCell.top + scrollTop - RESIZE_HANDLE_BASE_SIZE / 2 + 2) + 'px';
						}
					}
					// Get visible column ID excluding hidden columns
					let col = parseInt(jexcel.current.selectedCell[2]);
					while (jexcel.current.cols[col].colElement.style.display == 'none') col--;

					let cellBR = jexcel.current.getCellFromCoords(col, jexcel.current.selectedCell[3]);
					let infoBR = cellBR.getBoundingClientRect();
					if (cornerCell.left >= 0) {
						selHandleBR.style.left = (infoBR.right - cornerCell.left - options.handleSize / 2) + 'px';
					} else {
						selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
					}
					selHandleBR.style.top = (infoBR.bottom - cornerCell.top + scrollTop - options.handleSize / 2) + 'px';
					e.preventDefault();
				}
			}
		}

		rszHandle.addEventListener('touchstart', rszHandleTouchStart);
		rszHandle.addEventListener('touchend', rszHandleTouchend);
		rszHandle.addEventListener('touchcancel', rszHandleTouchend);
		rszHandle.addEventListener('touchmove', rszHandleTouchmove);

		function customizeWorksheetFunction(ws) {
			ws.content.addEventListener("touchstart", (e) => {
				isTouch = true;
				if (jexcel.current && !jexcel.current.edition) {
					showSelectionHandle();
					var x = e.target.getAttribute('data-x');
					var y = e.target.getAttribute('data-y');
					if (x && y) {
						showContextMenu(e, x, y);
					}
				}
			});
			ws.content.addEventListener("touchend", (e) => {
				if (jexcel.current && !jexcel.current.edition) {
					// For when mouse events do not occur and only touch events occur
					showSelectionHandle();
				}
			});
			ws.content.addEventListener("mousedown", (e) => {
				if (!isTouch) {
					hideHandles();
				}
			});
			ws.content.addEventListener("mouseup", (e) => {
				if (isTouch && jexcel.current && !jexcel.current.edition) {
					showSelectionHandle();
					if ((jexcel.current.options.columnResize != 0 && jexcel.current.selectedHeader != null) ||
						(jexcel.current.options.rowResize != 0 && jexcel.current.selectedRow != null)) {
						showResizeHandle();
					}
				}
				isTouch = false;
			});
			ws.content.addEventListener("scroll", e => {
				let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
				let contentRect = jexcel.current.content.getBoundingClientRect();
				const scrollTop = jexcel.current.content.scrollTop;
				const scrollLeft = jexcel.current.content.scrollLeft;

				if (jexcel.current.selectedRow && jexcel.current.selectedCell[1] == jexcel.current.selectedCell[3]) {
					// Get visible column ID excluding hidden columns
					let col = 0;
					while (jexcel.current.cols[col].colElement.style.display == 'none') col++;

					let cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
					let info = cell.getBoundingClientRect();
					rszHandle.style.left = ((cornerCell.width - RESIZE_HANDLE_BASE_SIZE) / 2) + 'px';
					rszHandle.style.top = (info.bottom- cornerCell.top + scrollTop - RESIZE_HANDLE_BASE_SIZE / 2 + 2) + 'px';
					rszHandle.classList.add('rotate90');
					rszHandle.style.display = 'block';
				} else if (jexcel.current.selectedHeader && jexcel.current.selectedCell[0] == jexcel.current.selectedCell[2]) {
					let cell = jexcel.current.getCellFromCoords(jexcel.current.selectedHeader, 0);
					let info = cell.getBoundingClientRect();
					if (cornerCell.left >= 0) {
						rszHandle.style.left = (info.right - cornerCell.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
					} else {
						rszHandle.style.left = (info.right + scrollLeft - contentRect.left - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
					}
					rszHandle.style.top = ((scrollTop + cornerCell.height - RESIZE_HANDLE_BASE_SIZE) / 2 + 2) + 'px';
					rszHandle.classList.remove('rotate90');
					rszHandle.style.display = 'block';
				} else if (jexcel.current.selectedCell[0] <= jexcel.current.options.freezeColumns) {
					showSelectionHandle();
				}
			});

			const defaultResetSelection = ws.resetSelection;
			ws.resetSelection = function(blur) {
				defaultResetSelection(blur);
				hideHandles();
			}
			const defaultUpdateFreezePosition = ws.updateFreezePosition;
			ws.updateFreezePosition = function() {
				defaultUpdateFreezePosition();
				if (selHandleTL.style.display == 'block') {
					showSelectionHandle();
				}
			}
			const defaultOpenEditor = ws.openEditor;
			ws.openEditor = function(cell, empty, e) {
				// Clear any time control
				if (jexcel.timeControl_tex) {
					clearTimeout(jexcel.timeControl_tex);
					jexcel.timeControl_tex = null;
				}
				if (jexcel.current.parent.contextMenu) {
					jexcel.current.parent.contextMenu.contextmenu.close();
				}
				defaultOpenEditor(cell, empty, e);
			}
			const defaultScrollControls = ws.scrollControls;
			ws.scrollControls = function(e) {
				if (!rszHandle.classList.contains('rotate90')) {
					rszHandle.style.top = jexcel.current.content.scrollTop + 'px';
				}
				defaultScrollControls(e);
			}
			const defaultCreateWorksheet = ws.createWorksheet;
			ws.createWorksheet = function(e) {
				defaultCreateWorksheet(e);
				const newWorksheet = ws.parent.worksheets.slice(-1)[0];
				customizeWorksheetFunction(ws.parent, newWorksheet);
			}
		}

		function setup() {
			if (typeof jexcel === 'undefined') jexcel = jspreadsheet;

			const spreadsheet = jexcel.spreadsheet.slice(-1)[0];
			const contextMenu = spreadsheet.contextMenu;

			const defaultContextMenuOpen = contextMenu.contextmenu.open;
			contextMenu.contextmenu.open = function(e, items) {
				defaultContextMenuOpen(e, items);
				let visible = false;
				if (options.contextMenuMode == 'icon') {
					contextMenu.style.display = 'none';
					contextMenu.style.flexDirection = 'row';
					contextMenu.style.gap = '5px';
					contextMenu.style.width = 'inherit';
					contextMenu.style.height = (options.iconSize + 4) + 'px';
					contextMenu.style.padding = '4px';
					contextMenu.style.overflow = 'hidden';
					contextMenu.style.animation = 'none';
					[].slice.call(contextMenu.children).forEach((elm, i) => {
						if (i > 0) {	// Ignore first row header
							elm.style.display = 'grid'
							elm.innerHTML = elm.dataset.icon;
							if (elm.innerText) visible = true;
							elm.dataset.icon = ''
							elm.style.fontFamily = 'Material Icons';
							elm.style.fontSize = options.iconSize + 'px';
							elm.style.width = (options.iconSize + 4) + 'px';
							//elm.style.height = (options.iconSize + 12) + 'px';
							elm.style.padding = '0';
							elm.style.textAlign = 'center';
							elm.style.borderBottom = 'none';
							if (elm.children.length > 0) {
								// Set styles for child element (span)
								elm.children[0].style.marginRight = '0';
								elm.children[0].style.fontSize = options.iconSize + 'px';
								elm.children[0].style.display = 'block';
							}
						}
					});
					visible && (contextMenu.style.display = 'flex');
				}
				if (visible || options.contextMenuMode != 'icon' ) {
					// Adjust context menu coordinates
					let tx = contextMenu.dataset.x;
					let ty = contextMenu.dataset.y;
					if (tx && ty) {
						let left = parseInt(tx);
						let top = parseInt(ty);
						delete contextMenu.dataset.x;
						delete contextMenu.dataset.y;
						const rect = contextMenu.getBoundingClientRect();
						if (window.innerHeight < top + rect.height) {
							top = Math.max(window.innerHeight - rect.height, 0);
						}
						if (window.innerWidth < left + rect.width) {
							left = window.innerWidth - rect.width;
						}
						contextMenu.style.cssText += ` top:${top}px !important; left:${left}px !important;`;
					}
				}
			}

			const defaultContextMenuClose = contextMenu.contextmenu.close;
			contextMenu.contextmenu.close = function() {
				const el = document.getElementsByClassName('jcontextmenu-focus')[0];
				if (el) {
					// In icon mode, delete display style to hide context menu.
					el.style.display = '';
				}
				defaultContextMenuClose();
			}

			spreadsheet.worksheets.forEach(ws => customizeWorksheetFunction(ws));
		}

		return () => {
			// Plugin object
			let plugin = {
				onevent : function(event, a, b, c, d) {
					switch (event) {
						case 'onbeforeselection':
							if (!jexcelCurrent || jexcelCurrent != a || !rszHandle.parentNode.parentNode.classList.contains('jtabs-selected')) {
								jexcelCurrent = a;
								// Applying option settings to handles
								selHandleTL.style.width = selHandleBR.style.width = options.handleSize + 'px';
								selHandleTL.style.height = selHandleBR.style.height = options.handleSize + 'px';
								selHandleTL.style.border = selHandleBR.style.border = options.selectionHandleBorder;
								selHandleTL.style.borderRadius = selHandleBR.style.borderRadius = options.handleSize + 'px';
								selHandleTL.style.backgroundColor = selHandleBR.style.backgroundColor = options.selectionHandleColor;
								rszHandle.style.setProperty('--rszHandleZoom', options.handleSize / 30);
								// Move handle to the active sheet
								a.content.appendChild(rszHandle);
								a.content.appendChild(selHandleTL);
								a.content.appendChild(selHandleBR);
							}
							break;
						case 'onbeforepaste':
							return b;
						case 'onload':
							setup();
							break;
					}
				},
				contextMenu : function(jxls, x, y, e, items) {
					if (options.contextMenuMode == 'icon') {
						items = items.filter(item => !item.type || item.type != 'line' )
							.map(item => {
								if (!item.icon) {
									item.icon = defaultIcon.get(item.title) ?? defaultIcon.get(item.title.replace('...', ''));
								}
								item.title = '';
								item.shortcut = '';
								return item;
							}).concat({
								title:'',
								icon: 'close',
								onclick: function(item) {}
							});
					}
					return items;
				}
			};

			return plugin;
		};
	};

	return tex;
})();
