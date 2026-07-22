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
    
    let html = '<table class="calendar-table">';
    html += '<colgroup><col style="width: 10%;"><col style="width: 16%;"><col style="width: 16%;"><col style="width: 16%;"><col style="width: 16%;"><col style="width: 16%;"><col style="width: 10%;"></colgroup>';
    html += '<tr><th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th></tr><tr>';

    let dayCount = 1;
    let i = 0;
    
    // ★ 빈 줄 생성 원천 차단: while문으로 해당 월이 끝나면 즉시 표 그리기를 종료합니다.
    while (true) {
        if (i > 0 && i % 7 === 0) {
            if (dayCount > daysInMonth) break; // 이번 달 날짜가 다 끝났다면 새 줄을 만들지 않고 즉시 탈출
            html += '</tr><tr>';
        }
        
        if (i < firstDay || dayCount > daysInMonth) {
            html += '<td></td>';
        } else {
            const dayDataHtml = findDataForCalendar(rows, month, dayCount, headers, isAdmin);
            html += `<td>${dayDataHtml}</td>`;
            dayCount++;
        }
        i++;
    }
    
    return html + '</tr></table>';
}

function findDataForCalendar(rows, month, day, headers, isAdmin) {
    let result = '';
    let bigoStr = ''; 
    
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
                    // 비고 내용만 수집하고 선생님 숫자는 올리지 않습니다.
                    if (loc.includes('비고')) {
                        bigoList.push(row[j]);
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
                        totalTeacherCount++; // 진짜 선생님이 있을 때만 카운트 증가
                    }
                }
            }
            
            if (bigoList.length > 0) {
                bigoStr = `<span style="color: #e74c3c; font-size: 13.5px; font-weight: bold; margin-left: 6px; word-break: keep-all;">${bigoList.join(', ')}</span>`;
            }

            // ★ 선생님이 0명이면 이 안의 블록 생성 로직이 아예 실행되지 않습니다.
            if (totalTeacherCount > 0) {
                // ★ 실제 '오후', '야간' 같은 시간대 데이터가 배열에 존재할 때만 공간을 엽니다.
                let showTimeHeaders = (dayTimeMarks.length > 0); 
                
                if (showTimeHeaders) {
                    let topHeaderHtml = `<div style="display: flex; justify-content: center; align-items: flex-end; margin-bottom: 3px; min-height: 14px;">`;
                    topHeaderHtml += `<div style="display:flex; gap:5px; justify-content:center;">`;
                    dayTimeMarks.forEach(tm => { 
                        let tmColor = '#555'; 
                        if (tm.includes('오후')) tmColor = '#0056b3'; 
                        else if (tm.includes('야간')) tmColor = '#198754'; 
                        
                        topHeaderHtml += `<div style="width:55px; text-align:center; font-size:11.5px; color:${tmColor}; font-weight:bold;">${tm}</div>`; 
                    });
                    topHeaderHtml += `</div></div>`;
                    result += topHeaderHtml;
                }
                // showTimeHeaders가 false이면 불필요한 빈 공간(여백) 태그를 전혀 넣지 않습니다.

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
                    
                    let namesHtml = `<div class="drop-zone" data-loc="${baseLoc}" data-month="${month}" data-day="${day}" style="justify-content:center; width:100%; min-height:20px; gap:3px;">`;

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
                                namesHtml += `<div style="width:55px; text-align:center; font-weight:bold; font-size:12px;">${displayStr}</div>`;
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
                                    namesHtml += `<span style="font-weight:bold; font-size:12px; margin-right:4px;">${displayStr}</span>`;
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
    
    return `<div class="cal-date" style="display: flex; align-items: center; margin-bottom: 4px;"><span style="font-size: 15px;">${day}</span>${bigoStr}</div>` + result;
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