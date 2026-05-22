(function () {
  const params = new URLSearchParams(window.location.search);
  const previewEnabled = params.get('preview') === '1';

  function makePreviewUrl(enabled) {
    const next = new URL(window.location.href);
    if (enabled) {
      next.searchParams.set('preview', '1');
    }
    else {
      next.searchParams.delete('preview');
    }
    return next.pathname + next.search + next.hash;
  }

  function addPreviewLink() {
    const conn = document.getElementById('divBtConn');
    if (!conn) {
      return;
    }

    const bar = document.createElement('div');
    bar.className = 'preview-actions';

    const link = document.createElement('a');
    link.className = 'preview-button';
    link.href = makePreviewUrl(!previewEnabled);
    link.textContent = previewEnabled ? '通常表示に戻る' : '接続なしで画面確認';
    bar.appendChild(link);
    conn.appendChild(bar);
  }

  function fillOptions(select, labels) {
    labels.forEach((label, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function labeledSelect(labelText, className, labels) {
    const wrap = document.createElement('span');
    const label = document.createElement('label');
    const select = document.createElement('select');

    label.textContent = labelText;
    select.className = className || '';
    fillOptions(select, labels);
    wrap.appendChild(label);
    wrap.appendChild(select);
    return wrap;
  }

  function makeMappingRow(input, output) {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    row.appendChild(labeledSelect('入力', 'src', [input, 'A', 'B', 'Home', 'star']));
    row.appendChild(labeledSelect('出力', 'dest', [output, 'Square', 'Circle', 'X', 'Triangle']));
    row.appendChild(labeledSelect('デッドゾーン', 'dz', ['0.0135%', '0.05%', '0.1%']));
    row.appendChild(labeledSelect('スケーリング', 'scaling', ['リニア', 'パススルー']));

    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '削除';
    row.appendChild(del);
    return row;
  }

  function showInfo() {
    const info = document.getElementById('divInfo');
    if (!info) {
      return;
    }
    info.style.display = 'block';
    info.textContent = 'プレビュー表示: VS-C4未接続でもレイアウト確認中';
  }

  function previewAdvance() {
    showInfo();

    const cfg = document.getElementById('divCfgSel');
    if (cfg) {
      cfg.style.display = 'block';
      cfg.innerHTML = '<h2>設定選択</h2><p>グローバル設定を使用</p>';
    }

    const global = document.getElementById('divGlobalCfg');
    if (global) {
      global.style.display = 'block';
      global.innerHTML = '<h2>グローバル設定</h2>';
      global.appendChild(labeledSelect('システム', '', ['SPI2 / PSX', 'SPI3 / PS2']));
      global.appendChild(labeledSelect('ペアリングモード', '', ['Auto', 'ボタンペアリング']));
      const save = document.createElement('button');
      save.type = 'button';
      save.textContent = 'グローバル設定を保存';
      global.appendChild(save);
    }

    const output = document.getElementById('divOutputCfg');
    if (output) {
      output.style.display = 'block';
      output.innerHTML = '<h2>出力設定</h2>';
      output.appendChild(labeledSelect('モード', '', ['GamePad']));
      output.appendChild(labeledSelect('アクセサリ', '', ['なし', '振動']));
      const save = document.createElement('button');
      save.type = 'button';
      save.textContent = '出力設定を保存';
      output.appendChild(save);
    }

    const input = document.getElementById('divInputCfg');
    if (input) {
      input.style.display = 'block';
      input.innerHTML = '<h2>マッピング設定</h2>';
      input.appendChild(labeledSelect('入力コントローラ タイプ', '', ['8bitdo Pro2/Pro3']));
      input.appendChild(labeledSelect('出力コントローラタイプ', '', ['PSX / PS2']));

      const map = document.createElement('div');
      map.id = 'divMapping';
      map.appendChild(makeMappingRow('Y', 'Square'));
      map.appendChild(makeMappingRow('A', 'Circle'));
      map.appendChild(makeMappingRow('Home', 'Square / Circle / X / Triangle'));
      input.appendChild(map);

      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'mapping-add-button';
      add.textContent = 'マッピングを追加';
      input.appendChild(add);

      const save = document.createElement('button');
      save.type = 'button';
      save.textContent = 'マッピングを保存';
      input.appendChild(save);
    }
  }

  function previewPresets() {
    showInfo();

    const cfg = document.getElementById('divCfgSel');
    if (cfg) {
      cfg.style.display = 'block';
      cfg.innerHTML = '<h2>設定選択</h2><p>グローバル設定を使用</p>';
    }

    const input = document.getElementById('divInputCfg');
    if (input) {
      input.style.display = 'block';
      input.innerHTML = '<h2>プリセット設定</h2><p id="desc">プリセットの選択画面を確認中</p>';
      const group = document.createElement('outputandconsole');
      group.appendChild(labeledSelect('書き込み先', '', ['Output 3']));
      group.appendChild(labeledSelect('本体', '', ['All', 'PSX / PS2']));
      group.appendChild(labeledSelect('プリセット', '', ['8bitdo Pro2/Pro3 -> PSX / PS2']));
      input.appendChild(group);

      const save = document.createElement('button');
      save.type = 'button';
      save.textContent = 'プリセットを書き込む';
      input.appendChild(save);
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    addPreviewLink();

    if (!previewEnabled) {
      return;
    }

    document.body.classList.add('preview-mode');
    if (location.pathname.endsWith('advance.html')) {
      previewAdvance();
    }
    else if (location.pathname.endsWith('presets.html')) {
      previewPresets();
    }
  });
}());
