// 전체 감독표를 달력 형태로 그려주는 시각화 알고리즘 파일입니다.

async function initCalendar(isAdmin) {
    currentCalYear = new Date().getFullYear(); currentCalMonth = new Date().getMonth() + 1;
    await loadAndRenderCalendar(isAdmin);
}

async function changeMonth(delta, isAdmin) {
    currentCalMonth += delta;
    if (currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; } else if (currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; }
    await loadAndRenderCalendar(isAdmin);
}

async function loadAndRenderCalendar(isAdmin) {
    showLoading(true);
    try {
        await initSupervisorData();
        const calendarHtml = buildCalendarHTML(currentCalYear, currentCalMonth, globalSheetData, globalHeaders, isAdmin);
        
        if (isAdmin) {
            document.getElementById('adminCalendarTitle').innerText = currentCalYear + '년 ' + currentCalMonth + '월';
            document.getElementById('adminCalendarContainer').innerHTML = calendarHtml;
            setupDragAndDrop(); 
            switchScreen('adminScreen');
        } else {
            document.getElementById('calendarTitle').innerText = currentCalYear + '년 ' + currentCalMonth + '월';
            document.getElementById('calendarContainer').innerHTML = calendarHtml;
            switchScreen('calendarScreen');
        }
    } catch (error) { alert('오류 발생: ' + error.message); } finally { showLoading(false); }
}

function buildCalendarHTML(year, month, rows, headers, isAdmin) {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate(); 
    let html = '<table class="calendar-table"><tr><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th></tr><tr>';

    let dayCount = 1;
    for (let i = 0; i < 42; i++) {
        if (i < firstDay || dayCount > daysInMonth) html += '<td></td>';
        else {
            const dayDataHtml = findDataForCalendar(rows, month, dayCount, headers, isAdmin);
            html += `<td><div class="cal-date">${dayCount}</div>${dayDataHtml}</td>`;
            dayCount++;
        }
        if ((i + 1) % 7 === 0) html += '</tr><tr>';
    }
    return html + '</tr></table>';
}

function findDataForCalendar(rows, month, day, headers, isAdmin) {
    let result = '';
    const searchStr1 = month + '/' + day; const searchStr2 = month + '.' + day;
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]; if (!row || !row[0]) continue;
        const sheetDate = row[0].replace(/\s/g, ''); 
        
        if (sheetDate === searchStr1 || sheetDate === searchStr2 || sheetDate.includes(month + '월' + day + '일')) {
            
            let groups = { '2층': [], '3층': [], '4층': [], '사감': [] }; 
            
            let bigoList = []; 
            let dayTimeMarks = [];
            let totalTeacherCount = 0; 

            for (let j = 2; j < row.length; j++) {
                if (row[j] && row[j].trim() !== '') {
                    let loc = headers[j] ? headers[j].trim() : '기타';
                    if (loc.includes('비고')) {
                        bigoList.push(row[j]);
                        totalTeacherCount++;
                    }
                    else {
                        let baseLoc = loc; let timeMark = '';
                        if (loc.includes('2층')) { baseLoc = '2층'; timeMark = loc.replace('2층', '').replace(/[\(\)]/g, '').trim(); }
                        else if (loc.includes('3층')) { baseLoc = '3층'; timeMark = loc.replace('3층', '').replace(/[\(\)]/g, '').trim(); }
                        else if (loc.includes('4층')) { baseLoc = '4층'; timeMark = loc.replace('4층', '').replace(/[\(\)]/g, '').trim(); }
                        else if (loc.includes('사감')) { baseLoc = '사감'; timeMark = loc.replace('사감', '').replace(/[\(\)]/g, '').trim(); }
                        
                        if (timeMark && !dayTimeMarks.includes(timeMark)) dayTimeMarks.push(timeMark);
                        
                        if (!groups[baseLoc]) groups[baseLoc] = []; 
                        groups[baseLoc].push({ name: row[j].trim(), timeMark: timeMark });
                        totalTeacherCount++;
                    }
                }
            }

            if (totalTeacherCount > 0) {
                let showTimeHeaders = Object.values(groups).some(g => g.length >= 2);
                
                let topHeaderHtml = `<div style="position: relative; display: flex; justify-content: center; align-items: flex-end; margin-bottom: 5px; min-height: 16px;">`;
                
                // ★ 비고 텍스트 색상을 분홍색(#e83e8c)으로 변경
                if (bigoList.length > 0) {
                    topHeaderHtml += `<div style="position: absolute; left: 2px; bottom: 0; color: #e83e8c; font-size: 13px; font-weight: bold; white-space: nowrap;">${bigoList.join(', ')}</div>`;
                }

                // ★ 시간대 헤더 색상 조건별 변경 (오후: 붉은색, 야간: 회색)
                if (showTimeHeaders) {
                    topHeaderHtml += `<div style="display:flex; gap:5px; justify-content:center;">`;
                    dayTimeMarks.forEach(tm => { 
                        let tmColor = '#555'; // 기본 색상
                        if (tm.includes('오후')) tmColor = '#e74c3c'; // 붉은색
                        else if (tm.includes('야간')) tmColor = '#7f8c8d'; // 회색
                        
                        topHeaderHtml += `<div style="width:55px; text-align:center; font-size:11.5px; color:${tmColor}; font-weight:bold;">${tm}</div>`; 
                    });
                    topHeaderHtml += `</div>`;
                }
                topHeaderHtml += `</div>`;

                result += topHeaderHtml;

                const locOrder = ['2층', '3층', '4층', '사감'];
                const sortedLocs = locOrder.concat(Object.keys(groups).filter(l => !locOrder.includes(l)));

                for (let baseLoc of sortedLocs) {
                    let group = groups[baseLoc];
                    let textColor = '#333'; let bgColor = '#f8f9fa'; let borderColor = '#ccc';
                    
                    if (baseLoc === '2층') { textColor = 'black'; bgColor = '#fdfdfd'; borderColor = '#333'; } 
                    else if (baseLoc === '3층') { textColor = '#0056b3'; bgColor = '#e3f2fd'; borderColor = '#0056b3'; } 
                    else if (baseLoc === '4층') { textColor = '#198754'; bgColor = '#e8f5e9'; borderColor = '#198754'; }
                    else if (baseLoc === '사감') { textColor = '#8e44ad'; bgColor = '#f4ecf7'; borderColor = '#8e44ad'; }

                    result += `<div class="cal-item" style="color: ${textColor}; background-color: ${bgColor}; border-left-color: ${borderColor};">`;
                    
                    let namesHtml = `<div class="drop-zone" data-loc="${baseLoc}" data-month="${month}" data-day="${day}" style="justify-content:center; width:100%; min-height:25px; gap:5px;">`;

                    if (showTimeHeaders) {
                        dayTimeMarks.forEach(tm => {
                            let person = group.find(g => g.timeMark === tm);
                            let rawName = person ? person.name : '';
                            let displayStr = rawName;
                            if (baseLoc === '사감' && displayStr) displayStr = `사감 ${displayStr}`;
                            
                            if(isAdmin && displayStr) {
                                let itemId = `drag-${month}-${day}-${baseLoc}-${tm}-${rawName}`;
                                namesHtml += `<div style="width:55px; text-align:center;"><span class="draggable-name" draggable="true" id="${itemId}" data-tm="${tm}" data-name="${rawName}">${displayStr}</span></div>`;
                            } else {
                                namesHtml += `<div style="width:55px; text-align:center; font-weight:bold; font-size:12.5px;">${displayStr}</div>`;
                            }
                        });
                    } else {
                        if (group.length > 0) {
                            group.forEach((g, idx) => {
                                let rawName = g.name;
                                let displayStr = baseLoc === '사감' ? `사감 ${rawName}` : rawName;
                                if(isAdmin) {
                                    let tm = g.timeMark || '';
                                    let itemId = `drag-${month}-${day}-${baseLoc}-${idx}-${rawName}`;
                                    namesHtml += `<span class="draggable-name" draggable="true" id="${itemId}" data-tm="${tm}" data-name="${rawName}">${displayStr}</span>`;
                                } else {
                                    namesHtml += `<span style="font-weight:bold; font-size:12.5px; margin-right:5px;">${displayStr}</span>`;
                                }
                            });
                        }
                    }
                    result += namesHtml + `</div></div>`;
                }
            }
            break; 
        }
    }
    return result;
}

function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-name');
    const dropZones = document.querySelectorAll('.drop-zone');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', draggable.id);
            setTimeout(() => draggable.style.display = 'none', 0);
        });
        draggable.addEventListener('dragend', () => { draggable.style.display = 'inline-block'; });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
        zone.addEventListener('dragleave', () => { zone.classList.remove('over'); });
        zone.addEventListener('drop', (e) => {
            e.preventDefault(); zone.classList.remove('over');
            const id = e.dataTransfer.getData('text/plain');
            const draggableElement = document.getElementById(id);
            
            if (draggableElement) {
                if(e.target.tagName === 'DIV' && e.target.parentElement.classList.contains('drop-zone')) {
                     e.target.innerHTML = ''; 
                     e.target.appendChild(draggableElement);
                } else if (e.target.classList.contains('drop-zone')) {
                    zone.appendChild(draggableElement);
                }
            }
        });
    });
}