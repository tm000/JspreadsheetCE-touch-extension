var touchExtension = (() => {
	if (typeof jexcel === 'undefined') jexcel = jspreadsheet;
	// Create a div as the selection & resize handle
	var selHandleTL = document.createElement('div');
	var selHandleBR = document.createElement('div');
	var rszHandle = document.createElement('div');
	selHandleTL.setAttribute('id', 'selHandleTL');
	selHandleBR.setAttribute('id', 'selHandleBR');
	rszHandle.setAttribute('id', 'rszHandle');
	selHandleTL.style.position = selHandleBR.style.position = rszHandle.style.position = 'absolute';
	rszHandle.style.border = 'none';
	selHandleTL.style.zIndex = selHandleBR.style.zIndex = rszHandle.style.zIndex = 9999;

	// Define variables to control the state
	var orginx, orginy;
	const RESIZE_HANDLE_BASE_SIZE = 30;
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

	// Option setting defaults
	var options = {
		contextMenuMode: 'icon',
		contextMenuShowDelay: 500,
		iconSize: 32,
		handleSize: 30,
		selectionHandleColor: 'white',
		selectionHandleBorder: 'black 1px solid',
	};

	function showSelectionHandle() {
		if (!jexcel.current.selectedCell) return;
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		let contentRect = jexcel.current.content.getBoundingClientRect();
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft;

		// Get visible column ID excluding hidden columns
		let col1 = parseInt(jexcel.current.selectedCell[0]);
		let col2 = parseInt(jexcel.current.selectedCell[2]);
		while (jexcel.current.colgroup[col1].style.display == 'none') col1++;
		while (jexcel.current.colgroup[col2].style.display == 'none') col2--;

		let cellTL = jexcel.current.getCellFromCoords(col1, jexcel.current.selectedCell[1]);
		let cellBR = jexcel.current.getCellFromCoords(col2, jexcel.current.selectedCell[3]);
		let infoTL = cellTL.getBoundingClientRect();
		let infoBR = cellBR.getBoundingClientRect();
		if (cornerCell.left >= 0) {
			selHandleTL.style.left = (infoTL.left - cornerCell.left - options.handleSize / 2) + 'px';
			selHandleBR.style.left = (infoBR.right - cornerCell.left - options.handleSize / 2) + 'px';
		} else {
			selHandleTL.style.left = (infoTL.left + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
			selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
		}
		selHandleTL.style.top = (infoTL.top - contentRect.top + scrollTop - options.handleSize / 2) + 'px';
		selHandleBR.style.top = (infoBR.bottom - contentRect.top + scrollTop - options.handleSize / 2) + 'px';
		selHandleTL.style.display = 'block';
		selHandleBR.style.display = 'block';
	}

	function showResizeHandle() {
		if (!jexcel.current.selectedCell) return;
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		let contentRect = jexcel.current.content.getBoundingClientRect();
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft;

		if (jexcel.current.selectedRow && jexcel.current.selectedCell[1] == jexcel.current.selectedCell[3]) {
			// Get visible column ID excluding hidden columns
			let col = 0;
			while (jexcel.current.colgroup[col].style.display == 'none') col++;

			let cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
			let info = cell.getBoundingClientRect();
			rszHandle.style.left = ((cornerCell.width - RESIZE_HANDLE_BASE_SIZE) / 2) + 'px';
			rszHandle.style.top = (info.bottom- contentRect.top + scrollTop - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
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
		}
	}

	function hideHandles() {
		selHandleTL.style.display = 'none';
		selHandleBR.style.display = 'none';
		rszHandle.style.display = 'none';
	}

	function showContextMenuButton(e, x, y) {
		if (jexcel.current.options.contextMenu) {
			// Clear any time control
			if (jexcel.timeControl_tex) {
				clearTimeout(jexcel.timeControl_tex);
				jexcel.timeControl_tex = null;
			}
			jexcel.timeControl_tex = setTimeout(function() {
				if (jexcel.current && jexcel.current.contextMenu) {
					jexcel.current.contextMenu.contextmenu.close();

					// Hold the touched coordinates
					const el = document.getElementsByClassName('jcontextmenu')[0];
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
						jexcel.current.contextMenu.contextmenu.open(e, items);
						// Reduce the size of the popup
						const div = el.children[1];
						div.style.width = 'inherit';
						div.style.paddingLeft  = window.getComputedStyle(div).getPropertyValue('padding-right');	
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
		showContextMenuButton(e, x, y);
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
		if (col1 > 0 && touch.clientX < (infoTL.left-handlesize)) {
			col1--;
			orginx = col1;
		} else if (col2 < (colsize-1) && touch.clientX > (infoBR.right+handlesize)) {
			col2++;
			orginx = col2;
		} else if (touch.clientX > selectedInfo?.right && touch.clientX < infoBR.right) {
			col1++;
			orginx = col1;
		} else if (infoTL.left < touch.clientX && touch.clientX < selectedInfo?.left) {
			col2--;
			orginx = col2;
		}
		if (row1 > 0 && touch.clientY < (infoTL.top-handlesize)) {
			row1--;
			orginy = row1;
		} else if (row2 < (rowsize-1) && touch.clientY > (infoBR.bottom+handlesize)) {
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
	selHandleTL.addEventListener('touchmove', (e) =>  selHandleTouchmove('TL', e));
	selHandleBR.addEventListener('touchstart', (e) => selHandleTouchstart('BR', e));
	selHandleBR.addEventListener('touchend', selHandleTouchend);
	selHandleBR.addEventListener('touchcancel', selHandleTouchend);
	selHandleBR.addEventListener('touchmove', (e) => selHandleTouchmove('BR', e));

	function rszHandleTouchStart(e) {
		let touch = e.touches[0];
		if (jexcel.current.selectedRow) {
			let rowId = jexcel.current.selectedRow;
			let cell = jexcel.current.getCellFromCoords(0, rowId);
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
					jexcel.current.records[i][columnId].classList.add('resizing');
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
						jexcel.current.colgroup[jexcel.current.resizing.column].setAttribute('width', tempWidth);

						jexcel.current.updateCornerPosition();
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
						jexcel.current.rows[jexcel.current.resizing.row].setAttribute('height', tempHeight);
						jexcel.current.rows[jexcel.current.resizing.row].style.height = '';

						jexcel.current.updateCornerPosition();
						// Get visible column ID excluding hidden columns
						let col = 0;
						while (jexcel.current.colgroup[col].style.display == 'none') col++;

						let cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
						let info = cell.getBoundingClientRect();
						rszHandle.style.top = (info.bottom- contentRect.top + scrollTop - RESIZE_HANDLE_BASE_SIZE / 2) + 'px';
					}
				}
				// Get visible column ID excluding hidden columns
				let col = parseInt(jexcel.current.selectedCell[2]);
				while (jexcel.current.colgroup[col].style.display == 'none') col++;

				let cellBR = jexcel.current.getCellFromCoords(col, jexcel.current.selectedCell[3]);
				let infoBR = cellBR.getBoundingClientRect();
				if (cornerCell.left >= 0) {
					selHandleBR.style.left = (infoBR.right - cornerCell.left - options.handleSize / 2) + 'px';
				} else {
					selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - options.handleSize / 2) + 'px';
				}
				selHandleBR.style.top = (infoBR.bottom - contentRect.top + scrollTop - options.handleSize / 2) + 'px';
				e.preventDefault();
			}
		}
	}

	rszHandle.addEventListener('touchstart', rszHandleTouchStart);
	rszHandle.addEventListener('touchend', rszHandleTouchend);
	rszHandle.addEventListener('touchcancel', rszHandleTouchend);
	rszHandle.addEventListener('touchmove', rszHandleTouchmove);

	// Customize default event handling
	var isTouch = false;
	var root = jexcel.current.options.root ? jexcel.current.options.root : document;
	root.removeEventListener("touchstart", jexcel.touchStartControls);
	root.removeEventListener("mousedown", jexcel.mouseDownControls);

	root.addEventListener("touchstart", (e) => {
		isTouch = true;
		jexcel.touchStartControls(e);
		if (jexcel.current && !jexcel.current.edition) {
			var x = e.target.getAttribute('data-x');
			var y = e.target.getAttribute('data-y');
			if (x && y) {
				showContextMenuButton(e, x, y);
			}
		}
	});
	root.addEventListener("touchend", (e) => {
		if (jexcel.current && !jexcel.current.edition) {
			// For when mouse events do not occur and only touch events occur
			showSelectionHandle();
		}
	});
	root.addEventListener("mousedown", (e) => {
		if (!isTouch) {
			hideHandles();
		}
	});
	root.addEventListener("mousedown", jexcel.mouseDownControls);
	root.addEventListener("mouseup", (e) => {
		if (isTouch && jexcel.current && !jexcel.current.edition) {
			showSelectionHandle();
			if ((jexcel.current.options.columnResize == true && jexcel.current.selectedHeader) ||
				(jexcel.current.options.rowResize == true && jexcel.current.selectedRow)) {
				showResizeHandle();
			}
		}
		isTouch = false;
	});

	const defaultResetSelection = jexcel.current.resetSelection;
	jexcel.current.resetSelection = function(blur) {
		defaultResetSelection(blur);
		hideHandles();
	}
	const defaultUpdateFreezePosition = jexcel.current.updateFreezePosition;
	jexcel.current.updateFreezePosition = function() {
		defaultUpdateFreezePosition();
		if (selHandleTL.style.display == 'block') {
			showSelectionHandle();
		}
	}
	const defaultOpenEditor = jexcel.current.openEditor;
	jexcel.current.openEditor = function(cell, empty, e) {
		// Clear any time control
		if (jexcel.timeControl_tex) {
			clearTimeout(jexcel.timeControl_tex);
			jexcel.timeControl_tex = null;
		}
		if (jexcel.current.options.contextMenu) {
			jexcel.current.contextMenu.contextmenu.close();
		}
		defaultOpenEditor(cell, empty, e);
	}
	const defaultScrollControls = jexcel.current.scrollControls;
	jexcel.current.scrollControls = function(e) {
		if (!rszHandle.classList.contains('rotate90')) {
			rszHandle.style.top = jexcel.current.content.scrollTop + 'px';
		}
		defaultScrollControls(e);
	}
	const defaultContextMenuOpen = jexcel.current.contextMenu.contextmenu.open;
	jexcel.current.contextMenu.contextmenu.open = function(e, items) {
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
		defaultContextMenuOpen(e, items);
		let visible = false;
		const el = document.getElementsByClassName('jcontextmenu')[0];
		switch (options.contextMenuMode) {
			case 'normal':
				visible = true;
				break;
			case 'expand':
				break;
			case 'icon':
				el.style.display = 'none';
				el.style.flexDirection = 'row';
				el.style.gap = '5px';
				el.style.width = 'inherit';
				el.style.height = (options.iconSize + 4) + 'px';
				el.style.padding = '4px';
				el.style.overflow = 'hidden';
				el.style.animation = 'none';
				[].slice.call(el.children).forEach((elm, i) => {
					if (i > 0) {	// Ignore first row header
						elm.style.display = 'grid'
						elm.innerHTML = elm.dataset.icon;
						if (elm.innerText) visible = true;
						elm.dataset.icon = ''
						elm.style.fontFamily = 'Material Icons';
						elm.style.fontSize = options.iconSize + 'px';
						elm.style.width = (options.iconSize + 4) + 'px';
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
				visible && (el.style.display = 'flex');
				break;
		}
		if (visible) {
			// Adjust context menu coordinates
			let tx = el.dataset.x;
			let ty = el.dataset.y;
			if (tx && ty) {
				let left = parseInt(tx);
				let top = parseInt(ty);
				delete el.dataset.x;
				delete el.dataset.y;
				const rect = el.getBoundingClientRect();
				if (window.innerHeight < top + rect.height) {
					top = Math.max(window.innerHeight - rect.height, 0);
				}
				if (window.innerWidth < left + rect.width) {
					left = window.innerWidth - rect.width;
				}
				el.style.cssText += ` top:${top}px !important; left:${left}px !important;`;
			}
		}
	}
	const defaultContextMenuClose = jexcel.current.contextMenu.contextmenu.close;
	jexcel.current.contextMenu.contextmenu.close = function() {
		const el = document.getElementsByClassName('jcontextmenu-focus')[0];
		if (el) {
			// In icon mode, delete display style to hide context menu.
			el.style.display = '';
		}
		defaultContextMenuClose();
	}

	var tex = {};

	tex.options = function(newval) {
		options = {...options, ...newval};
		selHandleTL.style.width = selHandleBR.style.width = options.handleSize + 'px';
		selHandleTL.style.height = selHandleBR.style.height = options.handleSize + 'px';
		selHandleTL.style.border = selHandleBR.style.border = options.selectionHandleBorder;
		selHandleTL.style.borderRadius = selHandleBR.style.borderRadius = options.handleSize + 'px';
		selHandleTL.style.backgroundColor = selHandleBR.style.backgroundColor = options.selectionHandleColor;
		rszHandle.style.setProperty('--rszHandleZoom', options.handleSize / 30);
		return this;
	}
	tex.options({});
	
	// Add handles as part of a spreadsheet
	jexcel.current.content.appendChild(rszHandle);
	jexcel.current.content.appendChild(selHandleTL);
	jexcel.current.content.appendChild(selHandleBR);
	handlesize = selHandleTL.getBoundingClientRect().width;
	hideHandles();

	return tex;
})();
