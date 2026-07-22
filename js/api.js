// 구글 스프레드시트와 데이터를 주고받는 통신 기능을 담당하는 파일입니다.

async function fetchSpecificSheet(sheetName) {
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}!A:Z?key=${API_KEY}`;
    const response = await fetch(dataUrl);
    const json = await response.json();
    if (!json.values) throw new Error(`'${sheetName}' 시트의 데이터를 불러올 수 없습니다.`);
    return json.values;
}

async function initSupervisorData() {
    if (!globalSheetData) {
        const data = await fetchSpecificSheet('감독표');
        globalHeaders = data[0];
        globalSheetData = data;
    }
}
