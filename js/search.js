// 선생님이 본인 이름을 검색했을 때 일정을 필터링하고 리스트를 렌더링하는 파일입니다.

async function checkDates() {
    let searchedName = document.getElementById('teacherName').value.trim();
    if (!searchedName) { alert('이름을 입력해주세요.'); return; }
    
    showLoading(true);
    try {
        await initSupervisorData();
        // searchDataByMonth가 정의되지 않았을 경우를 대비해 초기화
        if (typeof searchDataByMonth === 'undefined') window.searchDataByMonth = {};
        for (let m = 1; m <= 12; m++) searchDataByMonth[m] = [];
        let foundAny = false;

        for (let i = 1; i < globalSheetData.length; i++) {
            const row = globalSheetData[i];
            if (!row || row.length === 0) continue;
            let dateStr = row[0] ? row[0] : '';
            let month = extractMonth(dateStr);
            let sagamName = ''; let floorGroups = {};

            for (let k = 1; k < globalHeaders.length; k++) {
                let locHeader = globalHeaders[k] ? globalHeaders[k].trim() : '';
                let tName = row[k] ? row[k].trim() : '';
                if (locHeader.includes('사감') && tName) sagamName = tName;
                else if (tName && !locHeader.includes('비고')) {
                    let baseLoc = locHeader; let timeMark = '';
                    if (locHeader.includes('2층')) { baseLoc = '2층'; timeMark = locHeader.replace('2층', '').replace(/[\(\)]/g, '').trim(); }
                    else if (locHeader.includes('3층')) { baseLoc = '3층'; timeMark = locHeader.replace('3층', '').replace(/[\(\)]/g, '').trim(); }
                    else if (locHeader.includes('4층')) { baseLoc = '4층'; timeMark = locHeader.replace('4층', '').replace(/[\(\)]/g, '').trim(); }
                    
                    if (['2층', '3층', '4층'].includes(baseLoc)) {
                        if (!floorGroups[baseLoc]) floorGroups[baseLoc] = [];
                        floorGroups[baseLoc].push(timeMark ? `${tName}(${timeMark})` : tName);
                    }
                }
            }

            let floorInfoArr = [];
            ['2층', '3층', '4층'].forEach(fl => { if (floorGroups[fl]) floorInfoArr.push(`<span style="color:#d35400;">${fl}</span> ${floorGroups[fl].join(', ')}`); });
            let floorStr = floorInfoArr.join(' | ');

            for (let j = 1; j < row.length; j++) {
                if (row[j] && row[j].replace(/\s/g, '').includes(searchedName.replace(/\s/g, ''))) {
                    let day = ''; let location = globalHeaders[j] ? globalHeaders[j].trim() : j + '열';
                    if (j >= 2 && row[1] && row[1].length <= 3) day = row[1];

                    let locColor = '#555'; 
                    if (location.includes('2층')) locColor = 'black'; else if (location.includes('3층')) locColor = '#0056b3';
                    else if (location.includes('4층')) locColor = '#198754'; 
                    else if (location.includes('사감')) locColor = 'black'; // ★ 보라색(#8e44ad)에서 검정색(black)으로 수정 완료!
                    else if (location.includes('비고')) locColor = '#dc3545';

                    let displayText = dateStr + (day ? ' (' + day + ')' : '');

                    if (location.includes('사감')) {
                        let displayLocation = `${location} (${sagamName})`; 
                        if (floorStr) displayText += ` <br>➡️ <span style="font-size: 13.5px; color: #2c3e50; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #bdc3c7;">[ ${floorStr} ]</span> ➡️ <span style="color: ${locColor}; font-weight: bold; font-size:16px;">${displayLocation}</span>`;
                        else displayText += ` ➡️ <span style="color: ${locColor}; font-weight: bold;">${displayLocation}</span>`;
                    } else {
                        displayText += ` ➡️ <span style="color: ${locColor}; font-weight: bold;">${location}</span>`;
                        if (sagamName) displayText += ` <span style="color: #7f8c8d; font-size: 13.5px; margin-left: 6px;">(사감: <b>${sagamName}</b>)</span>`;
                    }

                    if (month >= 1 && month <= 12) { searchDataByMonth[month].push(displayText); foundAny = true; }
                    break; 
                }
            }
        }

        document.getElementById('resultTitle').innerText = searchedName + ' 선생님 일정';

        if (foundAny) {
            // ★ 달력 스와이프 기능과 연동하기 위해 검색된 모든 월의 데이터를 렌더링합니다. (화면 노출은 index.html에서 제어함)
            let allMonths = [];
            for (let m = 1; m <= 12; m++) { if (searchDataByMonth[m].length > 0) allMonths.push(m); }
            renderSearchResults(allMonths, '');
            
            // ★ 달력의 현재 월을 감지하여 2개월치만 보여주도록 자동 동기화
            if (typeof updateMyScheduleDisplay === 'function') {
                updateMyScheduleDisplay();
            }
        } else {
            document.getElementById('resultsContainer').innerHTML = '<p class="error-text">검색된 감독 일정이 없습니다.</p>';
        }
        switchScreen('resultScreen');
    } catch (error) { alert('오류 발생: ' + error.message); } finally { showLoading(false); }
}

function filterByMonth(month) {
    document.querySelectorAll('.month-btn').forEach(btn => btn.classList.remove('active'));
    let btn = document.getElementById('btn-month-' + month);
    if(btn) btn.classList.add('active');
    renderSearchResults([month], month + '월에는 배정된 일정이 없습니다.');
}

function renderSearchResults(monthsArray, emptyMsg) {
    let html = '';
    monthsArray.forEach(m => {
        if (searchDataByMonth[m] && searchDataByMonth[m].length > 0) {
            html += '<div class="month-section"><div class="month-title">' + m + '월</div><ul class="date-list">';
            searchDataByMonth[m].forEach(item => { html += '<li>' + item + '</li>'; });
            html += '</ul></div>';
        }
    });
    document.getElementById('resultsContainer').innerHTML = html || '<p style="color:#7f8c8d; text-align:center; padding: 20px 0;">' + emptyMsg + '</p>';
}

function extractMonth(dateStr) {
    if (!dateStr) return -1;
    let m = dateStr.replace(/\s/g, '').match(/^(\d+)[/\.월]/);
    return m ? parseInt(m[1], 10) : -1;
}