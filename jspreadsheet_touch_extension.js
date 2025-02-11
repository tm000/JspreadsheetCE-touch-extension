(() => {
	if (typeof jexcel === 'undefined') jexcel = jspreadsheet;
	// Create a div as the selection & resize handle
	var selHandleTL = document.createElement('div');
	var selHandleBR = document.createElement('div');
	var rszHandle = document.createElement('div');
	selHandleTL.setAttribute('id', 'selHandleTL');
	selHandleBR.setAttribute('id', 'selHandleBR');
	rszHandle.setAttribute('id', 'rszHandle');
	selHandleTL.style.position = selHandleBR.style.position = rszHandle.style.position = 'absolute';
	selHandleTL.style.width = selHandleBR.style.width = rszHandle.style.width = '30px';
	selHandleTL.style.height = selHandleBR.style.height = rszHandle.style.height = '30px';
	selHandleTL.style.border = selHandleBR.style.border = 'black 1px solid';
	selHandleTL.style.borderRadius = selHandleBR.style.borderRadius = '30px';
	selHandleTL.style.backgroundColor = selHandleBR.style.backgroundColor = 'white';
	rszHandle.style.border = 'none';
	selHandleTL.style.zIndex = selHandleBR.style.zIndex = rszHandle.style.zIndex = 9999;

	// Define variables to control the state
	var orginx, orginy;

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
			selHandleTL.style.left = (infoTL.left - cornerCell.left - handlesize / 2) + 'px';
			selHandleBR.style.left = (infoBR.right - cornerCell.left - handlesize / 2) + 'px';
		} else {
			selHandleTL.style.left = (infoTL.left + scrollLeft - contentRect.left - handlesize / 2) + 'px';
			selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - handlesize / 2) + 'px';
		}
		selHandleTL.style.top = (infoTL.top - contentRect.top + scrollTop - handlesize / 2) + 'px';
		selHandleBR.style.top = (infoBR.bottom - contentRect.top + scrollTop - handlesize / 2) + 'px';
		selHandleTL.style.display = 'block';
		selHandleBR.style.display = 'block';
	}

	function showResizeHandle() {
		if (!jexcel.current.selectedCell) return;
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		let contentRect = jexcel.current.content.getBoundingClientRect();
		let headerHeight = jexcel.current.headerContainer.getBoundingClientRect().height;
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft;

		if (jexcel.current.selectedRow && jexcel.current.selectedCell[1] == jexcel.current.selectedCell[3]) {
			// Get visible column ID excluding hidden columns
			let col = 0;
			while (jexcel.current.colgroup[col].style.display == 'none') col++;

			let cell = jexcel.current.getCellFromCoords(col, jexcel.current.selectedRow);
			let info = cell.getBoundingClientRect();
			rszHandle.style.left = ((cornerCell.width - handlesize) / 2) + 'px';
			rszHandle.style.top = (info.bottom- contentRect.top + scrollTop - handlesize / 2) + 'px';
			rszHandle.classList.add('rotate90');
			rszHandle.style.display = 'block';
		} else if (jexcel.current.selectedHeader && jexcel.current.selectedCell[0] == jexcel.current.selectedCell[2]) {
			let cell = jexcel.current.getCellFromCoords(jexcel.current.selectedHeader, 0);
			let info = cell.getBoundingClientRect();
			if (cornerCell.left >= 0) {
				rszHandle.style.left = (info.right - cornerCell.left - handlesize / 2) + 'px';
			} else {
				rszHandle.style.left = (info.right + scrollLeft - contentRect.left - handlesize / 2) + 'px';
			}
			rszHandle.style.top = scrollTop + 'px';
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
					var items = [{
						title:'･･･',
						onclick:function() {
							var items = jexcel.current.options.contextMenu(jexcel.current, x, y, e);
							jexcel.current.contextMenu.contextmenu.open(e, items);
						}
					}];
					jexcel.current.contextMenu.contextmenu.open(e, items);
					// Reduce the size of the popup
					const div = document.getElementsByClassName('jexcel_contextmenu')[0].children[1];
					div.style.width = 'inherit';
					div.style.paddingLeft  = window.getComputedStyle(div).getPropertyValue('padding-right');
				}
			}, 1000);
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
				let headerHeight = jexcel.current.headerContainer.getBoundingClientRect().height;
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
							rszHandle.style.left = (info.right - cornerCell.left - handlesize / 2) + 'px';
						} else {
							rszHandle.style.left = (info.right + scrollLeft - contentRect.left - handlesize / 2) + 'px';
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
						rszHandle.style.top = (info.bottom- contentRect.top + scrollTop - handlesize / 2) + 'px';
					}
				}
				// Get visible column ID excluding hidden columns
				let col = parseInt(jexcel.current.selectedCell[2]);
				while (jexcel.current.colgroup[col].style.display == 'none') col++;

		                let cellBR = jexcel.current.getCellFromCoords(col, jexcel.current.selectedCell[3]);
				let infoBR = cellBR.getBoundingClientRect();
				if (cornerCell.left >= 0) {
					selHandleBR.style.left = (infoBR.right - cornerCell.left - handlesize / 2) + 'px';
				} else {
					selHandleBR.style.left = (infoBR.right + scrollLeft - contentRect.left - handlesize / 2) + 'px';
				}
				selHandleBR.style.top = (infoBR.bottom - contentRect.top + scrollTop - handlesize / 2) + 'px';
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

	// Add handles as part of a spreadsheet
	jexcel.current.content.appendChild(rszHandle);
	jexcel.current.content.appendChild(selHandleTL);
	jexcel.current.content.appendChild(selHandleBR);
	handlesize = selHandleTL.getBoundingClientRect().width;
	hideHandles();
})();
