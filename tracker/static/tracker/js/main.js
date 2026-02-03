(function () {
  const choices = window.__INITIAL_CHOICES__ || {};
  const csrfToken = window.__CSRF_TOKEN__;
  const grid = document.getElementById('grid');
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalCancel = document.getElementById('modal-cancel');
  const optionButtons = document.querySelectorAll('.modal__option');

  let currentSquareId = null;

  function getSquareEl(squareId) {
    return document.querySelector(`[data-square-id="${squareId}"]`);
  }

  function applyChoiceToSquare(squareId, option) {
    const el = getSquareEl(squareId);
    if (!el) return;
    el.classList.add('grid__square--selected');
    el.textContent = option;
  }

  function openModal(squareId) {
    currentSquareId = squareId;
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    currentSquareId = null;
  }

  function saveChoice(squareId, option) {
    fetch('/api/choice/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ square_id: squareId, option: option }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Request failed');
          return data;
        });
      })
      .then(function () {
        choices[squareId] = option;
        applyChoiceToSquare(squareId, option);
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

  optionButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (currentSquareId === null) return;
      const option = parseInt(btn.dataset.option, 10);
      saveChoice(currentSquareId, option);
    });
  });

  Object.keys(choices).forEach(function (squareId) {
    applyChoiceToSquare(parseInt(squareId, 10), choices[squareId]);
  });
})();
