// Original page calculations/filter behavior, externalized for the SPA.
export function mountLockedBehavior(screen, api, route, toast, record) {
if (screen === 'bookings') {

    // Live filter chips and search functionality
    (() => {
      const chips = document.querySelectorAll('.filter-chip');
      const rows = document.querySelectorAll('#bookingsTableBody tr.ledger-row');
      const searchInput = document.getElementById('bookingSearchInput');

      function filterRows() {
        const activeChip = document.querySelector('.filter-chip.active');
        const filterVal = activeChip ? activeChip.getAttribute('data-filter') : 'all';
        const query = searchInput.value.toLowerCase().trim();

        rows.forEach(row => {
          const status = row.getAttribute('data-status') || '';
          const guest = (row.getAttribute('data-guest') || '').toLowerCase();
          const contract = (row.getAttribute('data-contract') || '').toLowerCase();

          const matchesFilter = filterVal === 'all' || status.includes(filterVal);
          const matchesQuery = !query || row.textContent.toLowerCase().includes(query);

          if (matchesFilter && matchesQuery) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      }

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          filterRows();
        });
      });

      if (searchInput) {
        searchInput.addEventListener('input', filterRows);
      }
    })();
}
if (screen === 'payments') {

    (() => {
      const chips = document.querySelectorAll('.filter-chip');
      const rows = document.querySelectorAll('#paymentsTableBody tr.ledger-row');
      const search = document.getElementById('paymentSearch');
      const methodSelect = document.getElementById('methodSelect');

      function filter() {
        const activeChip = document.querySelector('.filter-chip.active');
        const typeFilter = activeChip ? activeChip.getAttribute('data-filter') : 'all';
        const method = methodSelect.value;
        const q = search.value.toLowerCase().trim();

        rows.forEach(r => {
          const rType = r.getAttribute('data-type');
          const rMethod = r.getAttribute('data-method');
          const text = r.textContent.toLowerCase();

          const matchType = typeFilter === 'all' || rType === typeFilter;
          const matchMethod = method === 'all' || rMethod === method;
          const matchQ = !q || text.includes(q);

          if (matchType && matchMethod && matchQ) {
            r.style.display = '';
          } else {
            r.style.display = 'none';
          }
        });
      }

      chips.forEach(c => {
        c.addEventListener('click', () => {
          chips.forEach(x => x.classList.remove('active'));
          c.classList.add('active');
          filter();
        });
      });

      search.addEventListener('input', filter);
      methodSelect.addEventListener('change', filter);
    })();
}
if (screen === 'edit-booking') {

    // Live calculation script
    (() => {
      const hallInput = document.getElementById('lineHall');
      const discountInput = document.getElementById('lineDiscount');
      const paidSoFar = record.paid;

      const checkCovers = document.getElementById('checkCovers');
      const priceCovers = document.getElementById('priceCovers');
      const checkProjector = document.getElementById('checkProjector');
      const priceProjector = document.getElementById('priceProjector');
      const checkAudio = document.getElementById('checkAudio');
      const priceAudio = document.getElementById('priceAudio');
      const checkBar = document.getElementById('checkBar');
      const priceBar = document.getElementById('priceBar');
      const checkSecurity = document.getElementById('checkSecurity');
      const priceSecurity = document.getElementById('priceSecurity');

      const container = document.getElementById('customExtrasContainer');
      const btnAdd = document.getElementById('btnAddCustomExtra');

      const displayNewTotal = document.getElementById('displayNewTotal');
      const displayBalanceAfter = document.getElementById('displayBalanceAfter');
      const creditBanner = document.getElementById('creditWarningBanner');
      const creditAmountText = document.getElementById('creditAmountText');

      function syncCheck(check, input, defaultPrice) {
        check.addEventListener('change', () => {
          input.disabled = !check.checked;
          if (!check.checked) {
            input.dataset.prev = input.value;
            input.value = '0.00';
          } else {
            input.value = input.dataset.prev || defaultPrice;
          }
          recalculate();
        });
      }

      syncCheck(checkCovers, priceCovers, api.intakeRates.covers.toFixed(2));
      syncCheck(checkProjector, priceProjector, api.intakeRates.projector.toFixed(2));
      syncCheck(checkAudio, priceAudio, api.intakeRates.audio.toFixed(2));
      syncCheck(checkBar, priceBar, api.intakeRates.bar.toFixed(2));
      syncCheck(checkSecurity, priceSecurity, api.intakeRates.security.toFixed(2));

      function recalculate() {
        let total = parseFloat(hallInput.value) || 0;
        if (checkCovers.checked) total += parseFloat(priceCovers.value) || 0;
        if (checkProjector.checked) total += parseFloat(priceProjector.value) || 0;
        if (checkAudio.checked) total += parseFloat(priceAudio.value) || 0;
        if (checkBar.checked) total += parseFloat(priceBar.value) || 0;
        if (checkSecurity.checked) total += parseFloat(priceSecurity.value) || 0;

        document.querySelectorAll('.custom-extra-row').forEach(row => {
          const amtInput = row.querySelector('.custom-amount');
          if (amtInput) {
            total += parseFloat(amtInput.value) || 0;
          }
        });

        const discount = parseFloat(discountInput.value) || 0;
        total = Math.max(0, total - discount);

        displayNewTotal.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const balance = total - paidSoFar;
        if (balance >= 0) {
          displayBalanceAfter.textContent = '$' + balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          displayBalanceAfter.style.color = balance > 0 ? 'var(--warning-text)' : 'var(--success-text)';
          creditBanner.style.display = 'none';
        } else {
          displayBalanceAfter.textContent = '$0.00';
          creditBanner.style.display = 'flex';
          creditAmountText.textContent = '$' + Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }

      [hallInput, priceCovers, priceProjector, priceAudio, priceBar, priceSecurity, discountInput].forEach(inp => {
        inp.addEventListener('input', recalculate);
      });

      // Add custom extra
      btnAdd.addEventListener('click', () => {
        const rows = container.querySelectorAll('.custom-extra-row');
        if (rows.length + ['Covers','Projector','Audio','Bar','Security'].filter(k => document.getElementById('check'+k).checked).length >= 10) {
          toast('Maximum of 10 total extras reached.');
          return;
        }
        const newRow = document.createElement('div');
        newRow.className = 'custom-extra-row';
        newRow.innerHTML = `
          <input type="text" class="form-input custom-label" placeholder="Extra description" maxlength="60" required style="min-height: 36px; font-size: 12px;">
          <input type="number" class="form-input custom-amount" placeholder="Amount" value="${api.newExtraAmount.toFixed(2)}" step="0.01" min="0" required style="min-height: 36px; font-size: 12px;">
          <button type="button" class="btn btn-quiet btn-sm btn-remove-custom" style="color: var(--danger-text); padding: 4px 8px;" title="Remove this extra">&times;</button>
        `;
        container.appendChild(newRow);
        newRow.querySelector('.custom-amount').addEventListener('input', recalculate);
        newRow.querySelector('.custom-label').focus();
        recalculate();
      });

      // Remove custom extra
      container.addEventListener('click', (e) => {
        if (e.target.closest('.btn-remove-custom')) {
          e.target.closest('.custom-extra-row').remove();
          recalculate();
        }
      });

      recalculate();
    })();
}
if (screen === 'record-payment') {

    (() => {
      const currentBalance = record.balance;
      const amtInput = document.getElementById('paymentAmount');
      const btnFull = document.getElementById('btnPayFullBalance');
      const displayPaymentAmt = document.getElementById('displayPaymentAmt');
      const displayRemainingAfter = document.getElementById('displayRemainingAfter');

      function updateRemaining() {
        const amt = parseFloat(amtInput.value) || 0;
        displayPaymentAmt.textContent = '-$' + amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const remaining = currentBalance - amt;

        if (remaining <= 0) {
          displayRemainingAfter.textContent = '$0.00 (Paid in full ✓)';
          displayRemainingAfter.style.color = 'var(--success-text)';
        } else {
          displayRemainingAfter.textContent = '$' + remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' due';
          displayRemainingAfter.style.color = 'var(--warning-text)';
        }
      }

      amtInput.addEventListener('input', updateRemaining);

      btnFull.addEventListener('click', () => {
        amtInput.value = currentBalance.toFixed(2);
        updateRemaining();
      });

      updateRemaining();
    })();
}
if (screen === 'new-booking') {

    (() => {
      const step1 = document.getElementById('step1Section');
      const step2 = document.getElementById('step2Section');
      const stepInd1 = document.getElementById('stepIndicator1');
      const stepInd2 = document.getElementById('stepIndicator2');

      const btnContinue = document.getElementById('btnContinueStep2');
      const btnBack = document.getElementById('btnBackStep1');

      btnContinue.addEventListener('click', () => {
        const guestName = document.getElementById('guestName').value.trim();
        const guestPhone = document.getElementById('guestPhone').value.trim();
        if (!guestName || !guestPhone) {
          toast('Please enter primary guest name and phone number.');
          return;
        }
        step1.style.display = 'none';
        step2.style.display = 'block';
        stepInd1.classList.remove('active');
        stepInd2.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      btnBack.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
        stepInd2.classList.remove('active');
        stepInd1.classList.add('active');
      });

      // Live Calculation in Step 2
      const hallInput = document.getElementById('newHallPrice');
      const coversCheck = document.getElementById('extraCovers');
      const projectorCheck = document.getElementById('extraProjector');
      const audioCheck = document.getElementById('extraAudio');
      const securityCheck = document.getElementById('extraSecurity');
      const initialPaidInput = document.getElementById('initialPaid');

      const displayAgreed = document.getElementById('newAgreedTotal');
      const displayPaid = document.getElementById('newPaidPreview');
      const displayRemaining = document.getElementById('newRemainingBalance');

      function calculateNewTotal() {
        let total = parseFloat(hallInput.value) || 0;
        if (coversCheck.checked) total += api.intakeRates.covers;
        if (projectorCheck.checked) total += api.intakeRates.projector;
        if (audioCheck.checked) total += api.intakeRates.audio;
        if (securityCheck.checked) total += api.intakeRates.security;

        const paid = parseFloat(initialPaidInput.value) || 0;
        const balance = Math.max(0, total - paid);

        displayAgreed.textContent = '$' + total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        displayPaid.textContent = '$' + paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        displayRemaining.textContent = '$' + balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      [hallInput, coversCheck, projectorCheck, audioCheck, securityCheck, initialPaidInput].forEach(elem => {
        elem.addEventListener('input', calculateNewTotal);
        elem.addEventListener('change', calculateNewTotal);
      });

      calculateNewTotal();
    })();
}
}
