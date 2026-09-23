const CHUNK_SIZE = 2000; // 1回あたりのコピー文字数目安

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const openBtn = document.getElementById('openBtn');
const viewerSection = document.getElementById('viewerSection');
const dropZoneParent = dropZone.parentElement;
const fileNameEl = document.getElementById('fileName');
const copyAllBtn = document.getElementById('copyAllBtn');
const splitContainer = document.getElementById('splitContainer');
const toast = document.getElementById('toast');

let currentText = '';

// ファイル選択ボタン
openBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// ドラッグ＆ドロップ
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

dropZone.addEventListener('click', () => fileInput.click());

// ファイル読み込み処理
function handleFile(file) {
    fileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        displayTextContent(e.target.result);
    };
    reader.onerror = () => {
        showToast('ファイルの読み込みに失敗しました');
    };
    reader.readAsText(file);
}

// テキスト表示と分割フォームの生成
function displayTextContent(text) {
    currentText = text;
    dropZone.style.display = 'none';
    viewerSection.style.display = 'flex';
    
    splitContainer.innerHTML = '';
    
    if (text.length === 0) {
        splitContainer.innerHTML = '<p style="color:var(--text-light); text-align:center;">空のファイルです</p>';
        return;
    }

    // テキストを分割してカードを作成
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    chunks.forEach((chunk, index) => {
        const card = document.createElement('div');
        card.className = 'chunk-card';

        const header = document.createElement('div');
        header.className = 'chunk-header';
        header.innerHTML = `<span>パート ${index + 1} / ${chunks.length} (${chunk.length}文字)</span>`;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn secondary';
        copyBtn.style.padding = '0.2rem 0.5rem';
        copyBtn.style.fontSize = '0.75rem';
        copyBtn.textContent = 'このパートをコピー';
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(chunk);
        });
        header.appendChild(copyBtn);

        const textarea = document.createElement('textarea');
        textarea.className = 'chunk-textarea';
        textarea.value = chunk;
        textarea.readOnly = true;

        card.appendChild(header);
        card.appendChild(textarea);
        splitContainer.appendChild(card);
    });
}

// 一括コピー
copyAllBtn.addEventListener('click', () => {
    if (!currentText) return;
    copyTextToClipboard(currentText);
});

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('クリップボードにコピーしました');
    }).catch(err => {
        console.error('Copy failed', err);
        showToast('コピーに失敗しました');
    });
}

// トースト表示
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// 共有ターゲット（Web Share Target API）からの起動時処理やクエリパラメータ対応
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedText = urlParams.get('text');
    const sharedTitle = urlParams.get('title');
    
    if (sharedText) {
        fileNameEl.textContent = sharedTitle || '共有されたテキスト';
        displayTextContent(sharedText);
    }
});