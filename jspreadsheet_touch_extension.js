(() => {
	if (typeof jexcel === 'undefined') jexcel = jspreadsheet;
	// Create a div as the selection handle
	var handleTL = document.createElement('div');
	var handleBR = document.createElement('div');
	handleTL.setAttribute('id', 'handleTL');
	handleBR.setAttribute('id', 'handleBR');
	handleTL.style.position = handleBR.style.position = 'absolute';
	handleTL.style.width = handleBR.style.width = '30px';
	handleTL.style.height = handleBR.style.height = '30px';
	handleTL.style.border = handleBR.style.border = 'black 1px solid';
	handleTL.style.borderRadius = handleBR.style.borderRadius = '30px';
	handleTL.style.backgroundColor = handleBR.style.backgroundColor = 'white';
	handleTL.style.zIndex = handleBR.style.zIndex = 9999;

	// Define variables to control the state
	var handlesize;
	var orginx, orginy;

	function showSelectionHandle() {
		if (!jexcel.current.selectedCell) return;
		let cornerCell = jexcel.current.headerContainer.children[0].getBoundingClientRect();
		const scrollTop = jexcel.current.content.scrollTop;
		const scrollLeft = jexcel.current.content.scrollLeft + (document.documentElement.scrollLeft || document.body.scrollLeft);

		let cellTL = jexcel.current.getCellFromCoords(jexcel.current.selectedCell[0], jexcel.current.selectedCell[1]);
		let cellBR = jexcel.current.getCellFromCoords(jexcel.current.selectedCell[2], jexcel.current.selectedCell[3]);
		let infoTL = cellTL.getBoundingClientRect();
		let infoBR = cellBR.getBoundingClientRect();
		if (cornerCell.left >= 0) {
			handleTL.style.left = (infoTL.left - cornerCell.left - handlesize / 2) + 'px';
			handleBR.style.left = (infoBR.right - cornerCell.left - handlesize / 2) + 'px';
		} else {
			handleTL.style.left = (infoTL.left + scrollLeft - cornerLeft - handlesize / 2) + 'px';
			handleBR.style.left = (infoBR.right + scrollLeft - cornerLeft - handlesize / 2) + 'px';
		}
		handleTL.style.top = (infoTL.top - cornerCell.top + scrollTop - handlesize / 2) + 'px';
		handleBR.style.top = (infoBR.bottom - cornerCell.top + scrollTop - handlesize / 2) + 'px';
		handleTL.style.display = 'block';
		handleBR.style.display = 'block';
	}

	function hideSelectionHandle() {
		handleTL.style.display = 'none';
		handleBR.style.display = 'none';
	}

	function showContextMenuButton(e, x, y) {
		if (jexcel.current.options.contextMenu) {
			// Clear any time control
			if (jexcel.timeControl_jce) {
				clearTimeout(jexcel.timeControl_jce);
				jexcel.timeControl_jce = null;
			}
			jexcel.timeControl_jce = setTimeout(function() {
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

	function handleTouchstart(which, e) {
		// Clear any time control
		if (jexcel.timeControl_jce) {
			clearTimeout(jexcel.timeControl_jce);
			jexcel.timeControl_jce = null;
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

	function handleTouchend(e) {
		jexcel.isMouseAction = false;
		let x = jexcel.current.selectedCell[0];
		let y = jexcel.current.selectedCell[1];
		showSelectionHandle();
		showContextMenuButton(e, x, y);
	}

	function handleTouchmove(which, e) {
		hideSelectionHandle();
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
	handleTL.addEventListener('touchstart', (e) => handleTouchstart('TL', e));
	handleTL.addEventListener('touchend', handleTouchend);
	handleTL.addEventListener('touchcancel', handleTouchend);
	handleTL.addEventListener('touchmove', (e) =>  handleTouchmove('TL', e));
	handleBR.addEventListener('touchstart', (e) => handleTouchstart('BR', e));
	handleBR.addEventListener('touchend', handleTouchend);
	handleBR.addEventListener('touchcancel', handleTouchend);
	handleBR.addEventListener('touchmove', (e) => handleTouchmove('BR', e));

	// Customize default event handling
	var isTouch = false;
	var root = jexcel.current.options.root ? jexcel.current.options.root : document;
	root.removeEventListener("touchstart", jexcel.touchStartControls);
	root.removeEventListener("mousedown", jexcel.mouseDownControls);
	root.addEventListener("touchstart", (e) => {
		isTouch = true;
		jexcel.touchStartControls(e);
		if (jexcel.current) {
			if (! jexcel.current.edition) {
				showSelectionHandle();
				var x = e.target.getAttribute('data-x');
				var y = e.target.getAttribute('data-y');
				if (x && y) {
					showContextMenuButton(e, x, y);
				}
			}
		} else {
			hideSelectionHandle();
		}
	});
	root.addEventListener("mousedown", (e) => {
		if (!isTouch) {
			hideSelectionHandle();
		}
		isTouch = false;
		jexcel.mouseDownControls(e);
	});

	const defaultUpdateSelectionFromCoords = jexcel.current.updateSelectionFromCoords;
	jexcel.current.updateSelectionFromCoords = function(x1, y1, x2, y2, origin) {
		defaultUpdateSelectionFromCoords(x1, y1, x2, y2, origin);
		if (handleTL.style.display == 'block') {
			showSelectionHandle();
		}
	}

	// Adding a handle as part of a spreadsheet
	jexcel.current.content.appendChild(handleTL);
	jexcel.current.content.appendChild(handleBR);
	handlesize = handleTL.getBoundingClientRect().width;
	hideSelectionHandle();
	// コーナーの位置を保持
	cornerLeft = jexcel.current.headerContainer.children[0].getBoundingClientRect().left + (document.documentElement.scrollLeft || document.body.scrollLeft);
})();
