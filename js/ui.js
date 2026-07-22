// 화면 전환 및 UI 상태를 제어하는 파일입니다.

function switchScreen(screenId) {
    // 앱에서 사용하는 전체 화면 ID 목록
    const screens = ['loginScreen', 'resultScreen', 'calendarScreen', 'adminLoginScreen', 'adminScreen', 'superAdminScreen'];
    
    screens.forEach(id => {
        const el = document.getElementById(id);
        // ★ 핵심 안전장치: HTML에 해당 요소가 실제로 존재할 때만 style을 변경합니다. (null 에러 완벽 차단)
        if (el) {
            el.style.display = 'none';
        }
    });
    
    const targetEl = document.getElementById(screenId);
    if (targetEl) {
        targetEl.style.display = 'block';
    }
}

function showLoading(isLoading) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.style.display = isLoading ? 'block' : 'none';
    }
}

function goBack() {
    switchScreen('loginScreen');
    
    // 뒤로 가기 시 검색창을 깔끔하게 비워주는 센스!
    const teacherNameInput = document.getElementById('teacherName');
    if (teacherNameInput) {
        teacherNameInput.value = '';
    }
}