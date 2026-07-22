// 화면 전환 및 UI 상태를 제어하는 파일입니다.

function switchScreen(screenId) {
    // 앱에서 사용하는 전체 화면 ID 목록 (과거의 calendarScreen도 에러 방지를 위해 남겨둠)
    const screens = ['loginScreen', 'resultScreen', 'calendarScreen', 'adminLoginScreen', 'adminScreen', 'superAdminScreen'];
    
    screens.forEach(id => {
        const el = document.getElementById(id);
        // ★ 핵심 방어코드: HTML에 해당 요소가 존재할(true) 때만 style을 숨깁니다.
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
    
    const teacherNameInput = document.getElementById('teacherName');
    if (teacherNameInput) {
        teacherNameInput.value = '';
    }
}