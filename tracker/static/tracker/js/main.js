(function () {
  const choices = window.__INITIAL_CHOICES__ || {};
  const rawList = window.__POKEMON_LIST__;
  const pokemonList = Array.isArray(rawList) ? rawList : [];
  const csrfToken = window.__CSRF_TOKEN__;
  const grid = document.getElementById('grid');
  const searchInput = document.getElementById('search-input');
  const searchCount = document.getElementById('search-count');
  const generationSelect = document.getElementById('generation-select');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');
  const modalOptionsView = document.getElementById('modal-options-view');
  const modalOptionsCheckboxes = document.getElementById('modal-options-checkboxes');
  const modalEditBtn = document.getElementById('modal-edit-btn');
  const modalSaveView = document.getElementById('modal-save-view');
  const modalCancelView = document.getElementById('modal-cancel-view');
  const modalOptionsEdit = document.getElementById('modal-options-edit');
  const modalOptionsEditList = document.getElementById('modal-options-edit-list');
  const modalAddOptionBtn = document.getElementById('modal-add-option-btn');

  let currentSquareId = null;
  let nextOptionKeySeed = 0;

  var fuse = null;
  if (typeof Fuse !== 'undefined' && pokemonList.length > 0) {
    try {
      fuse = new Fuse(pokemonList, {
        keys: ['name'],
        threshold: 0.4,
        ignoreLocation: true,
      });
    } catch (e) {
      console.warn('Fuse.js init failed', e);
    }
  }

  function getSquareEl(squareId) {
    return grid ? document.querySelector('[data-square-id="' + squareId + '"]') : null;
  }

  function getBadgesEl(squareId) {
    return document.getElementById('badges-' + squareId);
  }

  function getDefinitions(squareId) {
    const c = choices[squareId];
    const defs = (c && c.option_definitions) ? c.option_definitions : [];
    return Array.isArray(defs) ? defs : [];
  }

  function getSelectedIds(squareId) {
    const c = choices[squareId];
    const ids = (c && c.available_options) ? c.available_options : [];
    return Array.isArray(ids) ? ids : [];
  }

  function updateBadges(squareId) {
    const badgesEl = getBadgesEl(squareId);
    if (!badgesEl) return;
    const defs = getDefinitions(squareId);
    const selectedIds = getSelectedIds(squareId);
    const selectedSet = {};
    selectedIds.forEach(function (id) { selectedSet[id] = true; });
    const labels = defs.filter(function (d) { return d && selectedSet[d.id]; }).map(function (d) { return d.label || d.id; });
    badgesEl.textContent = labels.join(', ');
    badgesEl.classList.toggle('grid__badges--on', labels.length > 0);
  }

  function getCurrentOptions(squareId) {
    const defs = getDefinitions(squareId);
    const selectedIds = getSelectedIds(squareId);
    const selectedSet = {};
    selectedIds.forEach(function (id) { selectedSet[id] = true; });
    return defs.map(function (d) {
      return { key: d.id, label: d.label || d.id };
    });
  }

  function openModal(squareId) {
    currentSquareId = squareId;
    const square = getSquareEl(squareId);
    modalTitle.textContent = square ? square.getAttribute('title') + ' – Options' : 'Options';
    const defs = getDefinitions(squareId);
    const selectedIds = getSelectedIds(squareId);
    const selectedSet = {};
    selectedIds.forEach(function (id) { selectedSet[id] = true; });
    modalOptionsCheckboxes.innerHTML = '';
    if (defs.length === 0) {
      const p = document.createElement('p');
      p.className = 'modal__options-list-empty';
      p.textContent = 'No options yet. Click Edit options to add some.';
      modalOptionsCheckboxes.appendChild(p);
    } else {
      defs.forEach(function (d) {
        const id = d.id;
        const label = d.label || id;
        const labelEl = document.createElement('label');
        labelEl.className = 'modal__checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.optionId = id;
        input.checked = !!selectedSet[id];
        labelEl.appendChild(input);
        labelEl.appendChild(document.createTextNode(' ' + label));
        modalOptionsCheckboxes.appendChild(labelEl);
      });
    }
    modalOptionsView.setAttribute('aria-hidden', 'false');
    modalOptionsEdit.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    currentSquareId = null;
  }

  function switchToEditMode() {
    const optionRows = getCurrentOptions(currentSquareId);
    nextOptionKeySeed = 0;
    optionRows.forEach(function (row) {
      var m = /^option_(\d+)$/.exec(row.key);
      if (m) nextOptionKeySeed = Math.max(nextOptionKeySeed, parseInt(m[1], 10));
    });
    modalOptionsView.setAttribute('aria-hidden', 'true');
    modalOptionsEdit.setAttribute('aria-hidden', 'false');
    renderEditOptionsList(optionRows);
  }

  function switchToViewMode() {
    openModal(currentSquareId);
  }

  function nextOptionKey() {
    nextOptionKeySeed += 1;
    return 'option_' + nextOptionKeySeed;
  }

  function renderEditOptionsList(optionRows) {
    modalOptionsEditList.innerHTML = '';
    optionRows.forEach(function (row) {
      addEditOptionRow(row.key, row.label);
    });
  }

  function addEditOptionRow(key, label) {
    const row = document.createElement('div');
    row.className = 'modal__option-row';
    row.dataset.optionKey = key;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = label || '';
    input.placeholder = 'Option label';
    input.className = 'modal__option-input';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'modal__option-remove';
    removeBtn.addEventListener('click', function () {
      row.remove();
    });
    row.appendChild(input);
    row.appendChild(removeBtn);
    modalOptionsEditList.appendChild(row);
  }

  function getEditedOptions() {
    const rows = modalOptionsEditList.querySelectorAll('.modal__option-row');
    const arr = [];
    rows.forEach(function (row) {
      const key = row.dataset.optionKey;
      const input = row.querySelector('.modal__option-input');
      const label = (input && input.value) ? input.value.trim() : '';
      if (key && label) arr.push({ key: key, label: label });
    });
    return arr.map(function (o) {
      const obj = {};
      obj[o.key] = o.label;
      return obj;
    });
  }

  function getGenerationForDex(dex) {
    for (var i = 0; i < pokemonList.length; i++) {
      if (pokemonList[i].dex === dex) return pokemonList[i].generation || 1;
    }
    return 1;
  }

  function getCheckedIdsFromView() {
    if (!modalOptionsCheckboxes) return [];
    const inputs = modalOptionsCheckboxes.querySelectorAll('input[type="checkbox"][data-option-id]');
    const ids = [];
    inputs.forEach(function (input) {
      if (input.checked && input.dataset.optionId) ids.push(input.dataset.optionId);
    });
    return ids;
  }

  function saveViewChoice() {
    if (currentSquareId === null) return;
    const selectedIds = getCheckedIdsFromView();
    const payload = {
      square_id: currentSquareId,
      available_options: selectedIds,
      generation: getGenerationForDex(currentSquareId),
    };
    fetch('/api/choice/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Request failed');
          return data;
        });
      })
      .then(function () {
        var c = choices[currentSquareId] || {};
        c.available_options = selectedIds;
        if (!c.option_definitions) c.option_definitions = getDefinitions(currentSquareId);
        choices[currentSquareId] = c;
        updateBadges(currentSquareId);
        closeModal();
      })
      .catch(function (err) {
        console.error(err);
        alert(err.message || 'Failed to save');
      });
  }

  function saveChoice() {
    if (currentSquareId === null) return;
    const edited = getEditedOptions();
    const option_definitions = edited.map(function (o) {
      var k = Object.keys(o)[0];
      return { id: k, label: o[k] || k };
    });
    const available_options = option_definitions.map(function (d) { return d.id; });
    const payload = {
      square_id: currentSquareId,
      option_definitions: option_definitions,
      available_options: available_options,
      generation: getGenerationForDex(currentSquareId),
    };
    fetch('/api/choice/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Request failed');
          return data;
        });
      })
      .then(function () {
        choices[currentSquareId] = { option_definitions: option_definitions, available_options: available_options };
        updateBadges(currentSquareId);
        switchToViewMode();
      })
      .catch(function (err) {
        console.error(err);
        alert(err.message || 'Failed to save');
      });
  }

  function getSelectedGeneration() {
    if (!generationSelect) return null;
    var val = generationSelect.value;
    if (val === '') return null;
    var num = parseInt(val, 10);
    return isNaN(num) ? null : num;
  }

  function nameMatchesQuery(name, query) {
    if (!query) return true;
    if (!name) return false;
    return name.toLowerCase().indexOf(query.toLowerCase()) !== -1;
  }

  function getMatchingDexFromFuse(query) {
    var matchDex = {};
    if (!fuse || !query) return matchDex;
    try {
      var results = fuse.search(query);
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var item = r && (r.item !== undefined ? r.item : r);
        if (item && item.dex !== undefined) matchDex[item.dex] = true;
      }
    } catch (e) {
      console.warn('Fuse search failed', e);
    }
    return matchDex;
  }

  function getMatchingDexFromIncludes(query) {
    var matchDex = {};
    if (!query) return matchDex;
    var q = query.toLowerCase();
    for (var j = 0; j < pokemonList.length; j++) {
      var p = pokemonList[j];
      if (p.name && p.name.toLowerCase().indexOf(q) !== -1) matchDex[p.dex] = true;
    }
    return matchDex;
  }

  function applyFilters() {
    if (!grid) return;
    var selectedGen = getSelectedGeneration();
    var q = (searchInput && searchInput.value) ? searchInput.value.trim() : '';
    var matchDex = {};
    if (q) {
      if (fuse) {
        matchDex = getMatchingDexFromFuse(q);
      } else {
        matchDex = getMatchingDexFromIncludes(q);
      }
    }
    var squares = grid.querySelectorAll('.grid__square');
    var visible = 0;
    for (var i = 0; i < squares.length; i++) {
      var el = squares[i];
      var gen = parseInt(el.getAttribute('data-generation'), 10) || 1;
      var dex = parseInt(el.dataset.squareId, 10);
      var name = el.getAttribute('data-name') || '';
      var genMatch = selectedGen === null || gen === selectedGen;
      var searchMatch = !q || !!matchDex[dex] || nameMatchesQuery(name, q);
      var show = genMatch && searchMatch;
      el.classList.toggle('grid__square--hidden', !show);
      if (show) visible++;
    }
    if (searchCount) {
      if (q) {
        searchCount.textContent = visible + ' Pokémon found';
      } else {
        searchCount.textContent = '';
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('search', applyFilters);
  }
  if (generationSelect) {
    generationSelect.addEventListener('change', applyFilters);
  }

  grid.addEventListener('click', function (e) {
    const square = e.target.closest('.grid__square');
    if (!square) return;
    const squareId = parseInt(square.dataset.squareId, 10);
    openModal(squareId);
  });

  modalBackdrop.addEventListener('click', closeModal);
  if (modalSaveView) modalSaveView.addEventListener('click', saveViewChoice);
  if (modalCancelView) modalCancelView.addEventListener('click', closeModal);
  if (modalEditBtn) modalEditBtn.addEventListener('click', switchToEditMode);
  if (modalAddOptionBtn) {
    modalAddOptionBtn.addEventListener('click', function () {
      addEditOptionRow(nextOptionKey(), 'New option');
    });
  }
  if (modalCancel) modalCancel.addEventListener('click', function () {
    if (modalOptionsEdit && modalOptionsEdit.getAttribute('aria-hidden') === 'false') {
      switchToViewMode();
    } else {
      closeModal();
    }
  });
  if (modalSave) modalSave.addEventListener('click', saveChoice);

  Object.keys(choices).forEach(function (squareId) {
    updateBadges(parseInt(squareId, 10));
  });

  applyFilters();

  // --- Add Pokémon modal ---
  const addModal = document.getElementById('add-modal');
  const addModalBackdrop = document.getElementById('add-modal-backdrop');
  const addModalCancel = document.getElementById('add-modal-cancel');
  const addForm = document.getElementById('add-pokemon-form');
  const addFormError = document.getElementById('add-form-error');
  const addSlugFromName = document.getElementById('add-slug-from-name');

  function slugFromName(name) {
    if (!name || typeof name !== 'string') return '';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function openAddModal() {
    if (addModal) {
      addFormError.textContent = '';
      addForm.reset();
      addModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeAddModal() {
    if (addModal) addModal.setAttribute('aria-hidden', 'true');
  }

  if (addSlugFromName) {
    addSlugFromName.addEventListener('click', function () {
      const nameEl = document.getElementById('add-name');
      if (nameEl) document.getElementById('add-slug').value = slugFromName(nameEl.value);
    });
  }

  if (document.getElementById('add-pokemon-btn')) {
    document.getElementById('add-pokemon-btn').addEventListener('click', openAddModal);
  }
  if (addModalBackdrop) addModalBackdrop.addEventListener('click', closeAddModal);
  if (addModalCancel) addModalCancel.addEventListener('click', closeAddModal);

  if (addForm) {
    addForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addFormError.textContent = '';
      const dexVal = document.getElementById('add-dex').value;
      const nameVal = (document.getElementById('add-name').value || '').trim();
      const slugVal = (document.getElementById('add-slug').value || '').trim();
      const genVal = document.getElementById('add-generation').value;
      const addOpt1 = document.getElementById('add-opt1');
      const addOpt2 = document.getElementById('add-opt2');
      const addOpt3 = document.getElementById('add-opt3');
      if (!dexVal || !nameVal || !slugVal || !genVal) {
        addFormError.textContent = 'Please fill Dex, Name, Slug and Generation.';
        return;
      }
      const dex = parseInt(dexVal, 10);
      if (isNaN(dex) || dex < 1) {
        addFormError.textContent = 'Dex must be a positive number.';
        return;
      }
      const gen = parseInt(genVal, 10);
      if (isNaN(gen) || gen < 1 || gen > 9) {
        addFormError.textContent = 'Generation must be between 1 and 9.';
        return;
      }
      const available_options = [];
      if (addOpt1 && addOpt1.checked) available_options.push({ option_1: 'Option 1' });
      if (addOpt2 && addOpt2.checked) available_options.push({ option_2: 'Option 2' });
      if (addOpt3 && addOpt3.checked) available_options.push({ option_3: 'Option 3' });
      fetch('/api/pokemon/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          dex: dex,
          name: nameVal,
          slug: slugVal,
          generation: gen,
          available_options: available_options,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
          });
        })
        .then(function () {
          closeAddModal();
          window.location.reload();
        })
        .catch(function (err) {
          addFormError.textContent = err.message || 'Failed to add Pokémon';
        });
    });
  }
})();
