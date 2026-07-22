// 화면 전환, 로딩 스피너 등 사용자 인터페이스(UX/UI)를 제어하는 파일입니다.

window.onload = function() { 
    buildMonthButtons(); 
};

function buildMonthButtons() {
    const order = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
    let html = '';
    order.forEach(m => { html += `<button class="month-btn" id="btn-month-${m}" onclick="filterByMonth(${m})">${m}월</button>`; });
    document.getElementById('monthFilterContainer').innerHTML = html;
}

function showLoading(show) { 
    document.getElementById('loading').style.display = show ? 'block' : 'none'; 
}

function switchScreen(screenId) {
    ['loginScreen', 'resultScreen', 'calendarScreen', 'adminLoginScreen', 'adminScreen', 'superAdminScreen'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

function goBack() {
    document.getElementById('teacherName').value = ''; 
    document.getElementById('adminId').value = ''; 
    document.getElementById('adminPw').value = '';
    currentLoggedInAdmin = ''; 
    isSuperAdmin = false;
    switchScreen('loginScreen');
}
