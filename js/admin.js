// 최고관리자, 드래그 앤 드롭 로직, 시트 저장 등 보안 및 편집 기능을 총괄하는 파일입니다.

async function adminLogin() {
    const adminId = document.getElementById('adminId').value.trim();
    const adminPw = document.getElementById('adminPw').value.trim();
    if (!adminId || !adminPw) { alert('이름과 비밀번호를 모두 입력해주세요.'); return; }

    showLoading(true);
    try {
        globalAdminData = await fetchSpecificSheet('관리자');
        let isSuccess = false;
        isSuperAdmin = false;
        
        for (let i = 1; i < globalAdminData.length; i++) {
            if (!globalAdminData[i] || globalAdminData[i].length === 0) continue;
            
            let sheetId = (globalAdminData[i][0] || '').toString().trim();
            let sheetPw = (globalAdminData[i][1] || '').toString().trim();
            
            if (sheetId === adminId && sheetPw === adminPw) {
                isSuccess = true; 
                currentLoggedInAdmin = sheetId;
                if (i === 1) isSuperAdmin = true;
                break;
            }
        }
        
        if (isSuccess) {
            alert(`환영합니다, ${currentLoggedInAdmin} 관리자님!${isSuperAdmin ? ' (최고관리자 권한 활성화)' : ''}`);
            document.getElementById('adminId').value = ''; 
            document.getElementById('adminPw').value = '';
            
            document.getElementById('superAdminBtn').style.display = isSuperAdmin ? 'inline-block' : 'none';
            initCalendar(true); 
        } else { alert('이름 또는 비밀번호가 일치하지 않습니다.'); }
    } catch (error) { alert('오류 발생: ' + error.message); } finally { showLoading(false); }
}

function openSuperAdminMenu() {
    renderAdminList();
    switchScreen('superAdminScreen');
}

function renderAdminList() {
    let tbody = document.getElementById('adminListBody');
    tbody.innerHTML = '';
    for (let i = 1; i < globalAdminData.length; i++) {
        let row = globalAdminData[i];
        if (!row || row.length === 0) continue;
        let id = row[0] || ''; 
        let isSuper = (i === 1);
        
        // ★ 화면에 비밀번호가 노출되지 않도록 마스킹(********) 처리합니다.
        let pwDisplay = '********'; 
        
        // ★ 최고관리자는 본인 권한 수정 불가, 일반 관리자는 [비번초기화]와 [삭제] 버튼 제공
        let btnHtml = isSuper ? 
            `<span style="color:#7f8c8d; font-weight:bold;">관리 불가 (최고관리자)</span>` : 
            `<button class="save-btn" style="background-color: #f39c12; width: auto; padding: 6px 12px; font-size: 13px; margin: 0 5px 0 0;" onclick="resetAdminPassword(${i})">🔄 비번초기화</button>` +
            `<button class="del-btn" onclick="deleteAdmin(${i})">🗑️ 삭제</button>`;
            
        tbody.innerHTML += `<tr><td style="font-weight:bold;">${id} ${isSuper ? '👑' : ''}</td><td>${pwDisplay}</td><td>${btnHtml}</td></tr>`;
    }
}

// ★ 비밀번호 초기화 (12345678) 함수 추가
function resetAdminPassword(index) {
    let adminName = globalAdminData[index][0];
    if (!confirm(`'${adminName}' 관리자의 비밀번호를 '12345678'로 초기화하시겠습니까?`)) return;
    
    globalAdminData[index][1] = "12345678";
    renderAdminList();
    alert(`'${adminName}' 관리자의 비밀번호가 '12345678'로 초기화되었습니다.\n(반드시 우측 상단의 [💾 시트에 최종 저장] 버튼을 눌러야 반영됩니다!)`);
}

function addNewAdmin() {
    let newId = document.getElementById('newAdminId').value.trim();
    // ★ 새 관리자 추가 시 초기 비밀번호를 12345678 로 하드코딩 고정합니다.
    let newPw = "12345678"; 
    
    if (!newId) { alert('관리자 이름을 입력해주세요.'); return; }
    for (let i = 1; i < globalAdminData.length; i++) {
        if (globalAdminData[i] && globalAdminData[i][0] === newId) { alert('이미 존재하는 관리자 이름입니다.'); return; }
    }
    globalAdminData.push([newId, newPw]);
    document.getElementById('newAdminId').value = ''; 
    renderAdminList();
    alert(`'${newId}' 관리자가 성공적으로 추가되었습니다. (초기 비밀번호: 12345678)\n(반드시 [💾 시트에 최종 저장] 버튼을 눌러야 반영됩니다!)`);
}

function deleteAdmin(index) {
    if (!confirm(`'${globalAdminData[index][0]}' 관리자를 정말 삭제하시겠습니까?`)) return;
    globalAdminData.splice(index, 1);
    renderAdminList();
}

async function saveSuperAdminChanges() {
    if (!confirm('현재 화면에 보이는 관리자 목록으로 구글 시트를 업데이트하시겠습니까?')) return;
    showLoading(true);
    try {
        let submitData = globalAdminData.map(row => [row[0] || '', row[1] || '']);
        const payload = { action: 'saveAdmins', sheetId: SHEET_ID, data: submitData };
        const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === 'success') alert('관리자 계정 목록이 성공적으로 저장되었습니다!');
        else throw new Error(result.message);
    } catch (error) { alert('저장 중 오류가 발생했습니다: ' + error.message); } finally { showLoading(false); }
}

async function changeAdminPassword() {
    if (!currentLoggedInAdmin) { alert('다시 로그인 해주세요.'); return; }
    const newPw = prompt(`[${currentLoggedInAdmin}] 관리자님의 새로운 비밀번호를 입력하세요.\n(취소하려면 내용 없이 확인을 누르세요)`);
    if (!newPw) return; 
    const confirmPw = prompt('비밀번호 확인을 위해 다시 한번 입력해주세요.');
    if (newPw !== confirmPw) { alert('입력하신 두 비밀번호가 일치하지 않습니다.'); return; }

    showLoading(true);
    try {
        const payload = { action: 'changePassword', sheetId: SHEET_ID, adminId: currentLoggedInAdmin, newPassword: newPw };
        const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (result.status === 'success') {
            alert('비밀번호가 성공적으로 변경되었습니다!');
            for (let i = 1; i < globalAdminData.length; i++) {
                if (globalAdminData[i] && globalAdminData[i][0] === currentLoggedInAdmin) globalAdminData[i][1] = newPw;
            }
        } else throw new Error(result.message);
    } catch (error) { alert('비밀번호 변경 오류: ' + error.message); } finally { showLoading(false); }
}

async function saveAdminChanges() {
    if (!confirm(`현재 화면에 보이는 ${currentCalMonth}월의 배치 상태를 구글 시트에 저장하시겠습니까?\n(다른 달의 데이터는 그대로 안전하게 유지됩니다.)`)) return;
    showLoading(true);
    try {
        const freshSheetData = await fetchSpecificSheet('감독표');
        let newData = JSON.parse(JSON.stringify(freshSheetData));
        const maxCols = globalHeaders.length; 

        for (let i = 0; i < newData.length; i++) {
            if (newData[i].length > maxCols) newData[i] = newData[i].slice(0, maxCols);
            while (newData[i].length < maxCols) newData[i].push('');
            
            if (i > 0) {
                let dateStr = newData[i][0] ? newData[i][0].replace(/\s/g, '') : '';
                let match = dateStr.match(/^(\d+)[/\.월]/);
                let rowMonth = match ? parseInt(match[1], 10) : -1;

                if (rowMonth === currentCalMonth) {
                    for (let j = 2; j < maxCols; j++) {
                        if (globalHeaders[j] && !globalHeaders[j].includes('비고')) {
                            newData[i][j] = ''; 
                        }
                    }
                }
            }
        }

        const draggables = document.querySelectorAll('.draggable-name');
        draggables.forEach(el => {
            const dropZone = el.closest('.drop-zone');
            if (!dropZone) return;

            const month = dropZone.getAttribute('data-month');
            const day = dropZone.getAttribute('data-day');
            const loc = dropZone.getAttribute('data-loc'); 
            const tm = el.getAttribute('data-tm'); 
            const rawName = el.getAttribute('data-name'); 

            let rowIdx = -1;
            for (let i = 1; i < newData.length; i++) {
                let dateStr = newData[i][0] ? newData[i][0].replace(/\s/g, '') : '';
                if (dateStr === month+'/'+day || dateStr === month+'.'+day || dateStr.includes(`${month}월${day}일`)) {
                    rowIdx = i; break;
                }
            }

            let colIdx = -1;
            for (let j = 2; j < maxCols; j++) {
                let header = globalHeaders[j] ? globalHeaders[j].replace(/\s/g, '') : '';
                if (header.includes(loc)) {
                    if (tm) { 
                        if (header.includes(tm)) { colIdx = j; break; }
                        else if (tm === '야간' && !header.includes('오후')) { colIdx = j; break; }
                    } 
                    else { colIdx = j; break; }
                }
            }

            if (rowIdx !== -1 && colIdx !== -1) {
                if (newData[rowIdx][colIdx]) newData[rowIdx][colIdx] += ', ' + rawName; 
                else newData[rowIdx][colIdx] = rawName;
            }
        });

        const payload = { action: 'saveSchedule', sheetId: SHEET_ID, sheetName: '감독표', data: newData };
        const response = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert(`${currentCalMonth}월 데이터 저장이 완료되었습니다!`);
            globalSheetData = newData;
        } else throw new Error(result.message);

    } catch (error) { alert('저장 중 오류가 발생했습니다: ' + error.message); } finally { showLoading(false); }
}