(function () {
  const choices = window.__INITIAL_CHOICES__ || {};
  const csrfToken = window.__CSRF_TOKEN__;
  const grid = document.getElementById('grid');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');
  const opt1 = document.getElementById('opt1');
  const opt2 = document.getElementById('opt2');
  const opt3 = document.getElementById('opt3');

  let currentSquareId = null;

  function getSquareEl(squareId) {
    return document.querySelector('[data-square-id="' + squareId + '"]');
  }

  function getBadgesEl(squareId) {
    return document.getElementById('badges-' + squareId);
  }

  function updateBadges(squareId) {
    const c = choices[squareId];
    const badgesEl = getBadgesEl(squareId);
    if (!badgesEl) return;
    const active = [];
    if (c && c.option_1) active.push(1);
    if (c && c.option_2) active.push(2);
    if (c && c.option_3) active.push(3);
    badgesEl.textContent = active.length ? active.join(' ') : '';
    badgesEl.classList.toggle('grid__badges--on', active.length > 0);
  }

  function openModal(squareId) {
    currentSquareId = squareId;
    const square = getSquareEl(squareId);
    modalTitle.textContent = square ? square.getAttribute('title') + ' – Choose options' : 'Choose options';
    const c = choices[squareId] || {};
    opt1.checked = !!c.option_1;
    opt2.checked = !!c.option_2;
    opt3.checked = !!c.option_3;
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    currentSquareId = null;
  }

  function saveChoice() {
    if (currentSquareId === null) return;
    const payload = {
      square_id: currentSquareId,
      option_1: opt1.checked,
      option_2: opt2.checked,
      option_3: opt3.checked,
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
        choices[currentSquareId] = {
          option_1: payload.option_1,
          option_2: payload.option_2,
          option_3: payload.option_3,
        };
        updateBadges(currentSquareId);
        closeModal();
      })
      .catch(function (err) {
        console.error(err);
        alert(err.message || 'Failed to save');
      });
  }

  grid.addEventListener('click', function (e) {
    const square = e.target.closest('.grid__square');
    if (!square) return;
    const squareId = parseInt(square.dataset.squareId, 10);
    openModal(squareId);
  });

  modalBackdrop.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveChoice);

  Object.keys(choices).forEach(function (squareId) {
    updateBadges(parseInt(squareId, 10));
  });
})();
