// 시스템 전반에서 공통으로 사용되는 핵심 설정값과 변수들을 모아둔 파일입니다.

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzFpsT0mfZD0L6lTlLajcafYNari4oP2ILK45i4LNT5CvDE-WimIHXqbi2m7qtDaP8/exec'; 
const SHEET_ID = '1Y7cCXkLzGLbpy4RqYXljIy5a7RnWzYgp_J_ydatJiA4';
const API_KEY = 'AIzaSyBzE09gR37WosPsArNy-IXhwsgUWqtEu7M'; 

let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth() + 1;

let globalSheetData = null; 
let globalHeaders = null;
let globalAdminData = []; 

let searchDataByMonth = {}; 
let currentLoggedInAdmin = ''; 
let isSuperAdmin = false;
