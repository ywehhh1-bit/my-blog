// '다른 지역 신청하기' 팝업
// 신청 내용을 에어테이블 API로 보내 '블로그 지역 신청' 표에 한 줄로 저장한다.
// 설정(베이스·표·칸 ID, 토큰)은 페이지의 window.REQUEST_CONFIG 에서 읽는다 (src/templates.js 참고).
(() => {
  const cfg = window.REQUEST_CONFIG || {};
  const dlg = document.getElementById('requestDialog');
  const openBtn = document.getElementById('openRequest');
  if (!dlg || !openBtn) return;

  const form = document.getElementById('requestForm');
  const statusEl = document.getElementById('requestStatus');
  const submitBtn = document.getElementById('requestSubmit');
  const done = document.getElementById('requestDone');

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.className = isError ? 'req-status error' : 'req-status';
  }

  openBtn.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    done.hidden = true;
    setStatus('');
    dlg.showModal();
  });
  document.getElementById('closeRequest').addEventListener('click', () => dlg.close());
  document.getElementById('doneClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = {};
    for (const [k, v] of new FormData(form)) values[k] = String(v).trim();

    const empty = [...form.elements].find((el) => el.name && !values[el.name]);
    if (empty) { setStatus('모든 칸을 채워 주세요.', true); empty.focus(); return; }
    if (!form.elements.email.checkValidity()) {
      setStatus('이메일 주소를 다시 확인해 주세요.', true);
      form.elements.email.focus();
      return;
    }
    if (!cfg.token) { setStatus('신청 기능을 준비하고 있어요. 잠시 후 다시 시도해 주세요.', true); return; }

    const f = cfg.fields;
    const fields = {
      [f.region]: values.region,
      [f.nickname]: values.nickname,
      [f.email]: values.email,
      [f.request]: values.request,
      [f.status]: '접수',
    };

    submitBtn.disabled = true;
    setStatus('보내는 중…');
    try {
      const res = await fetch(`https://api.airtable.com/v0/${cfg.baseId}/${cfg.tableId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.hidden = true;
      done.hidden = false;
    } catch (err) {
      console.error('신청 전송 실패:', err);
      setStatus('전송에 실패했어요. 잠시 후 다시 시도해 주세요.', true);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
