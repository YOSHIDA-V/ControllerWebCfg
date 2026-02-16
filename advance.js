import { brUuid, labelName, btnList, systemCfg,
    multitapCfg, inquiryMode, devCfg, accCfg, turboMask,
    scaling, diagScaling, maxMainInput, maxOutput,
    maxMax, maxThres }
    from './utils/constants.js';
import { saveGlobalCfg } from './utils/saveGlobalCfg.js'
import { saveOutputCfg } from './utils/saveOutputCfg.js'
import { getLatestRelease } from './utils/getLatestRelease.js';
import { getAppVersion } from './utils/getAppVersion.js';
import { getBdAddr } from './utils/getBdAddr.js';
import { getApiVersion } from './utils/getApiVersion.js';
import { getGameId } from './utils/getGameId.js';
import { getGameName } from './utils/getGameName.js';
import { getCfgSrc } from './utils/getCfgSrc.js';
import { setDefaultCfg } from './utils/setDefaultCfg.js';
import { setGameIdCfg } from './utils/setGameIdCfg.js';

var apiVersion = 0;
var bluetoothDevice;
var maxMapping = 255;
var nbMapping = 1;
let brService = null;
var mappingElement = null;
var srcLabel = 0;
var destLabel = 0;
var bdaddr = '';
var app_ver = '';
var latest_ver = '';
var name = '';
var gameid = '';
var gamename = '';
var current_cfg = 0;

const customUi = {
    allowedSystems: [11, 17],
    hideMultitap: true,
    hideOutputSelect: true,
    allowedOutputModes: [0],
    allowedAccessories: [0, 2],
    allowedDestLabelNames: ['PSX / PS2'],
    allowedScalingIdx: [0, 5],
    hideMappingFields: {
        destId: true,
        max: true,
        thres: true,
        turbo: true,
        scalingDiag: true,
    },
};

const destLabelAllowedIdx = customUi.allowedDestLabelNames
    ? customUi.allowedDestLabelNames
        .map((name) => labelName.indexOf(name))
        .filter((idx) => idx >= 0)
    : [];

const text = {
    headerGlobal: 'グローバル設定',
    wikiGlobal: 'グローバル設定のWiki',
    labelSystem: 'システム: ',
    labelMultitap: 'マルチタップ: ',
    labelInquiry: 'ペアリングモード: ',
    labelBank: 'メモリーカードバンク: ',
    btnSave: '保存',
    noticeGlobal: '設定を保存しました。反映にはBlueRetroの再起動が必要です。',
    headerOutput: '出力設定',
    wikiOutput: '出力設定のWiki',
    labelSelectOutput: '出力を選択: ',
    labelMode: 'モード',
    labelAccessories: 'アクセサリ',
    noticeOutput: '設定を保存しました。モード変更を反映するにはBlueRetroの再起動が必要です。',
    noticeOutputMouse: 'マウスモードでは<Default Mouse>プリセットの設定が必要です。',
    headerMapping: 'マッピング設定',
    wikiMapping: 'マッピング設定のWiki',
    labelSelectDevice: 'Bluetoothデバイスを選択: ',
    labelSrcType: '入力コントローラタイプ: ',
    labelDstType: '出力コントローラタイプ: ',
    labelSrc: '入力',
    labelDst: '出力',
    labelDstId: '出力ID',
    labelMax: '最大',
    labelThres: 'しきい値',
    labelDeadzone: 'デッドゾーン',
    labelTurbo: 'ターボ',
    labelScaling: 'スケーリング',
    labelDiag: '斜め補正',
    btnAdd: '+',
    noticeMapping: '設定を保存しました。マッピングは即時反映されます。',
    cfgSelectionHeader: '設定選択',
    cfgSelectionNotice: 'VS-C4 は常にグローバル設定を使用します。',
    logRequestDevice: 'Bluetoothデバイスを要求中...',
    logConnectGatt: 'GATTサーバーへ接続中...',
    logGetService: 'VS-C4のサービスを取得中...',
    logCannotConnect: 'VS-C4に接続できませんでした',
    logInitCfg: '設定画面を初期化中...',
    logLoadMapping: 'マッピング読み込み: ',
    logSaveGlobal: 'グローバル設定を保存しました',
    logSaveOutput: '出力設定を保存しました',
    logSaveInput: '入力設定を保存しました',
    infoConnectedPrefix: '接続先情報: ',
    infoCurrentGame: '現在のゲームモード: ',
    infoUpdate: '最新FW ',
    infoUpdateSuffix: ' を GitHub からダウンロード',
};

function initGlobalCfg() {
    var divGlobalCfg = document.getElementById("divGlobalCfg");

    divGlobalCfg.innerHTML = '';

    let header = document.createElement("h2");
    header.style.margin = 0;
    header.innerText = text.headerGlobal;

    divGlobalCfg.appendChild(header);

    divGlobalCfg.innerHTML += `<a href="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#22---global-config" target="_blank">${text.wikiGlobal}</a><br><br>`;

    var div = document.createElement("div");

    /* System */
    var label = document.createElement("label");
    label.innerText = text.labelSystem;
    label.setAttribute("for", "systemCfg");

    var sel = document.createElement("select");
    for (var i = 0; i < systemCfg.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = systemCfg[i];
        sel.add(option);
    }
    sel.id = "systemCfg";
    div.appendChild(label);
    div.appendChild(sel);

    divGlobalCfg.appendChild(div);

    div = document.createElement("div");

    /* Multitap */
    label = document.createElement("label");
    label.innerText = text.labelMultitap;
    label.setAttribute("for", "multitapCfg");

    sel = document.createElement("select");
    for (var i = 0; i < multitapCfg.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = multitapCfg[i];
        sel.add(option);
    }
    sel.id = "multitapCfg";
    div.appendChild(label);
    div.appendChild(sel);

    divGlobalCfg.appendChild(div);

    if (apiVersion > 0) {
        div = document.createElement("div");

        /* Inquiry mode */
        label = document.createElement("label");
        label.innerText = text.labelInquiry;
        label.setAttribute("for", "inquiryMode");

        sel = document.createElement("select");
        for (var i = 0; i < inquiryMode.length; i++) {
            var option  = document.createElement("option");
            option.value = i;
            option.text = inquiryMode[i];
            sel.add(option);
        }
        sel.id = "inquiryMode";
        div.appendChild(label);
        div.appendChild(sel);

        divGlobalCfg.appendChild(div);
    }

    if (apiVersion > 1) {
        div = document.createElement("div");

        /* Banksel */
        label = document.createElement("label");
        label.innerText = text.labelBank;
        label.setAttribute("for", "banksel");

        sel = document.createElement("select");
        for (var i = 0; i < 4; i++) {
            var option  = document.createElement("option");
            option.value = i;
            option.text = 'Bank ' + eval(i + 1);
            sel.add(option);
        }
        var option  = document.createElement("option");
        option.value = 0xDB;
        option.text = 'Debug mode';
        sel.add(option);
        sel.id = "banksel";
        div.appendChild(label);
        div.appendChild(sel);

        divGlobalCfg.appendChild(div);
    }

    div = document.createElement("div");

    var btn = document.createElement("button");
    btn.id = "globalSave";
    btn.innerText = text.btnSave;
    btn.addEventListener("click", saveGlobal);
    div.appendChild(btn);
    div.setAttribute("style", "margin-top:1em;");

    divGlobalCfg.appendChild(div);

    div = document.createElement("div");
    div.id = "globalSaveText";
    div.setAttribute("style", "display:none;margin-top:1em;");
    var p = document.createElement("p");
    p.setAttribute("style", "font-style:italic;font-size:small;color:red;");
    p.innerText = text.noticeGlobal;

    div.appendChild(p);
    divGlobalCfg.appendChild(div);

    applyGlobalUiFilters();
}

function initOutputSelect() {
    var divOutputCfg = document.getElementById("divOutputCfg");

    divOutputCfg.innerHTML = '';

    let header = document.createElement("h2");
    header.style.margin = 0;
    header.innerText = text.headerOutput;

    divOutputCfg.appendChild(header);

    divOutputCfg.innerHTML += `<a href="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#23---output-config" target="_blank">${text.wikiOutput}</a><br><br>`;

    var div = document.createElement("div");

    /* Output select */
    var label = document.createElement("label");
    label.innerText = text.labelSelectOutput;
    label.setAttribute("for", "outputSelect");

    var main = document.createElement("select");
    for (var i = 0; i < maxOutput; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = "Output " + (i + 1);
        main.add(option);
    }
    main.id = "outputSelect";
    main.addEventListener("change", selectOutput);
    div.appendChild(label);
    div.appendChild(main);

    divOutputCfg.appendChild(div);

    applyOutputSelectFilter();
}

function initOutputMode() {
    var div = document.createElement("div");
    div.setAttribute("style", "margin-top:1em;");

    /* Output mode */
    var span = document.createElement("span");
    span.setAttribute("style", "display:inline-block;");
    var label = document.createElement("label");
    label.innerText = text.labelMode;
    label.setAttribute("for", "outputMode");
    label.setAttribute("style", "display:block;");

    var main = document.createElement("select");
    for (var i = 0; i < devCfg.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = devCfg[i];
        main.add(option);
    }
    main.id = "outputMode";
    span.appendChild(label);
    span.appendChild(main);
    div.appendChild(span);

    /* Output acessories */
    span = document.createElement("span");
    span.setAttribute("style", "display:inline-block;");
    label = document.createElement("label");
    label.innerText = text.labelAccessories;
    label.setAttribute("for", "outputAcc");
    label.setAttribute("style", "display:block;");

    main = document.createElement("select");
    for (var i = 0; i < accCfg.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = accCfg[i];
        main.add(option);
    }
    main.id = "outputAcc";
    span.appendChild(label);
    span.appendChild(main);
    div.appendChild(span);

    var divOutputCfg = document.getElementById("divOutputCfg");
    divOutputCfg.appendChild(div);

    div = document.createElement("div");

    var btn = document.createElement("button");
    btn.id = "outputSave";
    btn.innerText = text.btnSave;
    btn.addEventListener("click", saveOutput);
    div.appendChild(btn);
    div.setAttribute("style", "margin-top:1em;");

    divOutputCfg.appendChild(div);

    div = document.createElement("div");
    div.id = "outputSaveText";
    div.setAttribute("style", "display:none;margin-top:1em;");
    var p = document.createElement("p");
    p.setAttribute("style", "font-style:italic;font-size:small;color:red;");
    p.innerText = text.noticeOutput;

    div.appendChild(p);
    divOutputCfg.appendChild(div);

    div = document.createElement("div");
    div.id = "outputSaveMouse";
    div.setAttribute("style", "display:none;margin-top:1em;");
    var p = document.createElement("p");
    p.setAttribute("style", "font-style:italic;font-size:small;color:orange;");
    p.innerText = text.noticeOutputMouse;

    div.appendChild(p);
    divOutputCfg.appendChild(div);

    applyOutputModeFilters();
}

function initInputSelect() {
    var divInputCfg = document.getElementById("divInputCfg");

    divInputCfg.innerHTML = '';

    let header = document.createElement("h2");
    header.style.margin = 0;
    header.innerText = text.headerMapping;

    divInputCfg.appendChild(header);

    divInputCfg.innerHTML += `<a href="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#24---mapping-config" target="_blank">${text.wikiMapping}</a><br><br>`;

    var div = document.createElement("div");
    div.setAttribute("style", "margin-bottom:1em;");

    /* Input select */
    var label = document.createElement("label");
    label.innerText = text.labelSelectDevice;
    label.setAttribute("for", "inputSelect");

    var main = document.createElement("select");
    for (var i = 0; i < maxMainInput; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = "Device " + (i + 1);
        main.add(option);
    }
    main.id = "inputSelect";
    main.addEventListener("change", selectInput);
    div.appendChild(label);
    div.appendChild(main);

    divInputCfg.appendChild(div);

    applyInputSelectionUiFilters();
}

function initLabelSelect() {
    var div = document.createElement("div");

    var label = document.createElement("label");
    label.innerText = text.labelSrcType;
    label.setAttribute("for", "srcLabel");

    var main = document.createElement("select");
    for (var i = 0; i < labelName.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = labelName[i];
        main.add(option);
    }
    main.id = "srcLabel";
    main.addEventListener("change", changeSrcLabel);
    div.appendChild(label);
    div.appendChild(main);

    var divInputCfg = document.getElementById("divInputCfg");
    divInputCfg.appendChild(div);

    var div = document.createElement("div");
    div.setAttribute("style", "margin-bottom:1em;");

    label = document.createElement("label");
    label.innerText = text.labelDstType;
    label.setAttribute("for", "dstLabel");

    main = document.createElement("select");
    for (var i = 0; i < labelName.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = labelName[i];
        main.add(option);
    }
    main.id = "dstLabel";
    main.addEventListener("change", changeDstLabel);
    div.appendChild(label);
    div.appendChild(main);

    divInputCfg.appendChild(div);

    applyLabelFilters();
}

function initFirstOutputMapping() {
    mappingElement = document.createElement("div");

    /* Src */
    var span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "This is the source button/axis on the Bluetooth controller";
    var label = document.createElement("label");
    label.innerText = text.labelSrc;
    label.setAttribute("style", "display:block;");

    var src = document.createElement("select");
    for (var i = 0; i < btnList.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = btnList[i][srcLabel];
        src.add(option);
    }
    src.setAttribute("class", "src");
    span.appendChild(label);
    span.appendChild(src);
    mappingElement.appendChild(span);

    /* Dest */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "This is the destination button/axis on the wired interface.";
    label = document.createElement("label");
    label.innerText = text.labelDst;
    label.setAttribute("style", "display:block;");

    var dest = src.cloneNode(true);
    dest.setAttribute("class", "dest");
    span.appendChild(label);
    span.appendChild(dest);
    mappingElement.appendChild(span);

    /* Dest ID */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "This is the ID of the wired interface.";
    label = document.createElement("label");
    label.innerText = text.labelDstId;
    label.setAttribute("style", "display:block;");

    var destId = document.createElement("select");
    for (var i = 0; i < maxOutput; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = "Output " + (i + 1);
        destId.add(option);
    }
    destId.setAttribute("class", "destId");
    span.appendChild(label);
    span.appendChild(destId);
    mappingElement.appendChild(span);

    /* Max */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "If source & destination is an axis then this is the scaling factor base on the destination maximum. If source is a button & destination is an axis then this is the value base on destination maximum that the axis will be set.";
    label = document.createElement("label");
    label.innerText = text.labelMax;
    label.setAttribute("style", "display:block;");

    var max = document.createElement("select");
    for (var i = 0; i <= maxMax; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i + "%";
        max.add(option);
    }
    max.setAttribute("class", "max");
    max.value = 100;
    span.appendChild(label);
    span.appendChild(max);
    mappingElement.appendChild(span);

    /* Threshold */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "If source is an axis and destination is a button, this is the threshold requires on the source axis before the button is pressed.";
    label = document.createElement("label");
    label.innerText = text.labelThres;
    label.setAttribute("style", "display:block;");

    var thres = document.createElement("select");
    for (var i = 0; i <= maxThres; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i + "%";
        thres.add(option);
    }
    thres.setAttribute("class", "thres");
    thres.value = 50;
    span.appendChild(label);
    span.appendChild(thres);
    mappingElement.appendChild(span);

    /* Deadone */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "This is the axis dead zone around reset value.";
    label = document.createElement("label");
    label.innerText = text.labelDeadzone;
    label.setAttribute("style", "display:block;");

    var dz = document.createElement("select");
    for (var i = 0; i <= maxMax; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i/10000 + "%";
        dz.add(option);
    }
    dz.setAttribute("class", "dz");
    dz.value = 135;
    span.appendChild(label);
    span.appendChild(dz);
    mappingElement.appendChild(span);

    /* Turbo */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "Turbo function base on the system frame rate.";
    label = document.createElement("label");
    label.innerText = text.labelTurbo;
    label.setAttribute("style", "display:block;");

    var turbo = document.createElement("select");
    for (var key in turboMask) {
        var option  = document.createElement("option");
        option.value = turboMask[key];
        option.text = key;
        turbo.add(option);
    }
    turbo.setAttribute("class", "turbo");
    span.appendChild(label);
    span.appendChild(turbo);
    mappingElement.appendChild(span);

    /* Scaling */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "Various response curve for scaling. (Only Passthrough and Linear, others TBD)";
    label = document.createElement("label");
    label.innerText = text.labelScaling;
    label.setAttribute("style", "display:block;");

    var sca = document.createElement("select");
    for (var i = 0; i < scaling.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = scaling[i];
        sca.add(option);
    }
    sca.setAttribute("class", "scaling");
    span.appendChild(label);
    span.appendChild(sca);
    mappingElement.appendChild(span);

    /* Scaling diag */
    span = document.createElement("span");
    span.setAttribute("style", "max-width:10%;display:inline-block;");
    span.title = "Diagonal scaling options between joystick type. (TBD Not implemented yet)";
    label = document.createElement("label");
    label.innerText = text.labelDiag;
    label.setAttribute("style", "display:block;");

    var diag = document.createElement("select");
    diag.setAttribute("style", "max-width:100%;");
    for (var i = 0; i < diagScaling.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = diagScaling[i];
        diag.add(option);
    }
    diag.setAttribute("class", "diag");
    span.appendChild(label);
    span.appendChild(diag);
    mappingElement.appendChild(span);

    customizeMappingRow(mappingElement);

    /* Add button */
    var addButton = document.createElement("button");
    addButton.innerText = text.btnAdd;
    addButton.addEventListener("click", addInput);

    /* Save */
    var divSave = document.createElement("div");

    var btn = document.createElement("button");
    btn.id = "inputSave";
    btn.innerText = text.btnSave;
    btn.addEventListener("click", saveInput);
    divSave.appendChild(btn);
    divSave.setAttribute("style", "margin-top:1em;");

    var div = document.createElement("div");
    div.id = "inputSaveText";
    div.setAttribute("style", "display:none;margin-top:1em;");
    var p = document.createElement("p");
    p.setAttribute("style", "font-style:italic;font-size:small;color:green;");
    p.innerText = text.noticeMapping;

    div.appendChild(p);
    divSave.appendChild(div);

    /* Append first cfg */
    var divMappingGrp = document.createElement("div");
    var divMapping = document.createElement("div");
    divMapping.appendChild(mappingElement);
    divMapping.id = "divMapping";
    var divInputCfg = document.getElementById("divInputCfg");
    divMappingGrp.appendChild(divMapping);
    divMappingGrp.appendChild(addButton);
    divMappingGrp.appendChild(divSave);
    divInputCfg.appendChild(divMappingGrp);
}

function initOutputMapping() {
    mappingElement = document.createElement("div");

    /* Src */
    var src = document.createElement("select");
    src.setAttribute("style", "max-width:10%;");
    src.title = "This is the source button/axis on the Bluetooth controller";
    for (var i = 0; i < btnList.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = btnList[i][srcLabel];
        src.add(option);
    }
    src.setAttribute("class", "src");
    mappingElement.appendChild(src);

    /* Dest */
    var dest = src.cloneNode(true);
    dest.setAttribute("class", "dest");
    dest.title = "This is the destination button/axis on the wired interface.";
    mappingElement.appendChild(dest);

    /* Dest ID */
    var destId = document.createElement("select");
    destId.setAttribute("style", "max-width:10%;");
    destId.title = "This is the ID of the wired interface.";
    for (var i = 0; i < maxOutput; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = "Output " + (i + 1);
        destId.add(option);
    }
    destId.setAttribute("class", "destId");
    mappingElement.appendChild(destId);

    /* Max */
    var max = document.createElement("select");
    max.setAttribute("style", "max-width:10%;");
    max.title = "If source & destination is an axis then this is the scaling factor base on the destination maximum. If source is a button & destination is an axis then this is the value base on destination maximum that the axis will be set.";
    for (var i = 0; i <= maxMax; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i + "%";
        max.add(option);
    }
    max.setAttribute("class", "max");
    max.value = 100;
    mappingElement.appendChild(max);

    /* Threshold */
    var thres = document.createElement("select");
    thres.setAttribute("style", "thres-width:10%;");
    thres.title = "If source is an axis and destination is a button, this is the threshold requires on the source axis before the button is pressed.";
    for (var i = 0; i <= maxThres; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i + "%";
        thres.add(option);
    }
    thres.setAttribute("class", "thres");
    thres.value = 50;
    mappingElement.appendChild(thres);

    /* Deadone */
    var dz = document.createElement("select");
    dz.setAttribute("style", "dz-width:10%;");
    dz.title = "This is the axis dead zone around reset value.";
    for (var i = 0; i <= maxMax; i += 5) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = i/10000 + "%";
        dz.add(option);
    }
    dz.setAttribute("class", "dz");
    dz.value = 135;
    mappingElement.appendChild(dz);

    /* Turbo */
    var turbo = document.createElement("select");
    turbo.setAttribute("style", "max-width:10%;");
    turbo.title = "Turbo function base on the system frame rate.";
    for (var key in turboMask) {
        var option  = document.createElement("option");
        option.value = turboMask[key];
        option.text = key;
        turbo.add(option);
    }
    turbo.setAttribute("class", "turbo");
    mappingElement.appendChild(turbo);

    /* Scaling */
    var sca = document.createElement("select");
    sca.setAttribute("style", "max-width:10%;");
    sca.title = "Various response curve for scaling. (Only Passthrough and Linear, others TBD)";
    for (var i = 0; i < scaling.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = scaling[i];
        sca.add(option);
    }
    sca.setAttribute("class", "scaling");
    mappingElement.appendChild(sca);

    /* Scaling diag */
    var diag = document.createElement("select");
    diag.setAttribute("style", "max-width:10%;");
    diag.title = "Diagonal scaling options between joystick type. (TBD Not implemented yet)";
    for (var i = 0; i < diagScaling.length; i++) {
        var option  = document.createElement("option");
        option.value = i;
        option.text = diagScaling[i];
        diag.add(option);
    }
    diag.setAttribute("class", "diag");
    mappingElement.appendChild(diag);
}

function initBlueRetroCfg() {
    initGlobalCfg();
    initOutputSelect();
    initOutputMode();
    initInputSelect();
    initLabelSelect();
    initFirstOutputMapping();
    initOutputMapping();
    initCfgSelection();
    nbMapping = 1;
}

function loadGlobalCfg() {
    return new Promise(function(resolve, reject) {
        log('グローバル設定CHRCを取得中...');
        brService.getCharacteristic(brUuid[1])
        .then(chrc => {
            log('グローバル設定を読み込み中...');
            return chrc.readValue();
        })
        .then(value => {
            log('グローバル設定サイズ: ' + value.byteLength);
            document.getElementById("systemCfg").value = value.getUint8(0);
            document.getElementById("multitapCfg").value = value.getUint8(1);
            if (apiVersion > 0) {
                document.getElementById("inquiryMode").value = value.getUint8(2);
            }
            if (apiVersion > 1) {
                document.getElementById("banksel").value = value.getUint8(3);
            }
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function loadOutputCfg(cfgId) {
    return new Promise(function(resolve, reject) {
        log('出力 ' + cfgId + ' のCTRL CHRCを取得中...');
        brService.getCharacteristic(brUuid[2])
        .then(chrc => {
            log('出力 ' + cfgId + ' をCTRL CHRCへ設定中...');
            var outputCtrl = new Uint16Array(1);
            outputCtrl[0] = Number(cfgId);
            return chrc.writeValue(outputCtrl);
        })
        .then(_ => {
            log('出力 ' + cfgId + ' のDATA CHRCを取得中...');
            return brService.getCharacteristic(brUuid[3]);
        })
        .then(chrc => {
            log('出力 ' + cfgId + ' の設定を読み込み中...');
            return chrc.readValue();
        })
        .then(value => {
            log('出力 ' + cfgId + ' 設定サイズ: ' + value.byteLength);
            document.getElementById("outputMode").value = value.getUint8(0);
            document.getElementById("outputAcc").value = value.getUint8(1);
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function writeReadRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc) {
    return new Promise(function(resolve, reject) {
        log('入力CTRL CHRCを設定中... ' + inputCtrl[1]);
        ctrl_chrc.writeValue(inputCtrl)
        .then(_ => {
            log('入力DATA CHRCを読み込み中...');
            return data_chrc.readValue();
        })
        .then(value => {
            log('入力DATA取得: ' + value.byteLength);
            var tmp = new Uint8Array(value.buffer);
            cfg.set(tmp, inputCtrl[1]);
            log('入力DATA取得: ' + cfg[2] + ' ' + value.getUint8(2));
            if (value.byteLength == 512) {
                inputCtrl[1] += Number(512);
                resolve(writeReadRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc));
            }
            else {
                resolve(cfg);
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

function readInputCfg(cfgId, cfg) {
    return new Promise(function(resolve, reject) {
        let ctrl_chrc = null;
        let data_chrc = null;
        brService.getCharacteristic(brUuid[4])
        .then(chrc => {
            ctrl_chrc = chrc;
            return brService.getCharacteristic(brUuid[5])
        })
        .then(chrc => {
            var inputCtrl = new Uint16Array(2);
            inputCtrl[0] = Number(cfgId);
            inputCtrl[1] = 0;
            data_chrc = chrc;
            return writeReadRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc);
        })
        .then(value => {
            log('入力 ' + cfgId + ' 設定サイズ: ' + cfg.byteLength);
            resolve(cfg);
        })
        .catch(error => {
            reject(error);
        });
    });
}

function loadInputCfg(cfgId) {
    return new Promise(function(resolve, reject) {
        var cfg = new Uint8Array(2051);
        log('入力 ' + cfgId + ' 設定のCHRCを取得中...');
        readInputCfg(cfgId, cfg)
        .then(value => {
            log('入力 ' + cfgId + ' 設定サイズ: ' + value.byteLength);
            //document.getElementById("mainInput").value = value[0];
            //document.getElementById("subInput").value = value[1];

            var div = document.getElementById("divMapping");
            if (value[2] < nbMapping) {
                var range = nbMapping - value[2];
                for (var i = 0; i < range; i++) {
                    div.removeChild(div.lastChild);
                }
            }
            else if (value[2] > nbMapping) {
                var range = value[2] - nbMapping;
                for (var i = 0; i < range; i++) {
                    addInput();
                }
            }
            nbMapping = value[2];
            var src = document.getElementsByClassName("src");
            var dest = document.getElementsByClassName("dest");
            var destId = document.getElementsByClassName("destId");
            var max = document.getElementsByClassName("max");
            var thres = document.getElementsByClassName("thres");
            var dz = document.getElementsByClassName("dz");
            var turbo = document.getElementsByClassName("turbo");
            var scaling = document.getElementsByClassName("scaling");
            var diag = document.getElementsByClassName("diag");

            log(text.logLoadMapping + src.length + ' / nbMapping: ' + nbMapping + ' / cfg: ' + value[2]);

            var j = 3;
            for (var i = 0; i < nbMapping; i++) {
                src[i].value = value[j++];
                dest[i].value = value[j++];
                destId[i].value = value[j++];
                max[i].value = value[j++];
                thres[i].value = value[j++];
                dz[i].value = value[j++];
                turbo[i].value = value[j++];
                scaling[i].value = value[j] & 0xF;
                diag[i].value = value[j++] >> 4;
            }
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function saveGlobal() {
    document.getElementById("globalSaveText").style.display = 'none';
    if (apiVersion > 1) {
        var data = new Uint8Array(4);
    }
    else if (apiVersion > 0) {
        var data = new Uint8Array(3);
    }
    else {
        var data = new Uint8Array(2);
    }
    data[0] = document.getElementById("systemCfg").value;
    data[1] = document.getElementById("multitapCfg").value;
    if (apiVersion > 0) {
        data[2] = document.getElementById("inquiryMode").value;
    }
    if (apiVersion > 1) {
        data[3] = document.getElementById("banksel").value;
    }
    return new Promise(function(resolve, reject) {
        saveGlobalCfg(brService, data)
        .then(_ => {
            document.getElementById("globalSaveText").style.display = 'block';
            log(text.logSaveGlobal);
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function saveOutput() {
    document.getElementById("outputSaveText").style.display = 'none';
    document.getElementById("outputSaveMouse").style.display = 'none';
    var data = new Uint8Array(2);
    data[0] = document.getElementById("outputMode").value;
    data[1] = document.getElementById("outputAcc").value;
    var cfgId = document.getElementById("outputSelect").value;
    return new Promise(function(resolve, reject) {
        saveOutputCfg(brService, data, cfgId)
        .then(_ => {
            document.getElementById("outputSaveText").style.display = 'block';
            if (data[0] == 3) {
                document.getElementById("outputSaveMouse").style.display = 'block';
            }
            log('出力 ' + cfgId + ' の設定を保存しました');
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function writeWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc) {
    return new Promise(function(resolve, reject) {
        log('入力CTRL CHRCを設定中... ' + inputCtrl[1]);
        ctrl_chrc.writeValue(inputCtrl)
        .then(_ => {
            log('入力DATA CHRCへ書き込み中...');
            var tmpViewSize = cfg.byteLength - inputCtrl[1];
            if (tmpViewSize > 512) {
                tmpViewSize = 512;
            }
            var tmpView = new DataView(cfg.buffer, inputCtrl[1], tmpViewSize);
            return data_chrc.writeValue(tmpView);
        })
        .then(_ => {
            log('入力DATAを書き込みました');
            inputCtrl[1] += Number(512);
            if (inputCtrl[1] < cfg.byteLength) {
                resolve(writeWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc));
            }
            else {
                resolve();
            }
        })
        .catch(error => {
            reject(error);
        });
    });
}

function writeInputCfg(cfgId, cfg) {
    return new Promise(function(resolve, reject) {
        let ctrl_chrc = null;
        let data_chrc = null;
        brService.getCharacteristic(brUuid[4])
        .then(chrc => {
            ctrl_chrc = chrc;
            return brService.getCharacteristic(brUuid[5])
        })
        .then(chrc => {
            var inputCtrl = new Uint16Array(2);
            inputCtrl[0] = Number(cfgId);
            inputCtrl[1] = 0;
            data_chrc = chrc;
            return writeWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc);
        })
        .then(_ => {
            resolve(cfg);
        })
        .catch(error => {
            reject(error);
        });
    });
}

function saveInput() {
    document.getElementById("inputSaveText").style.display = 'none';
    var cfgSize = nbMapping*8 + 3;
    var cfg = new Uint8Array(cfgSize);
    var cfgId = document.getElementById("inputSelect").value;

    var src = document.getElementsByClassName("src");
    var dest = document.getElementsByClassName("dest");
    var destId = document.getElementsByClassName("destId");
    var max = document.getElementsByClassName("max");
    var thres = document.getElementsByClassName("thres");
    var dz = document.getElementsByClassName("dz");
    var turbo = document.getElementsByClassName("turbo");
    var scaling = document.getElementsByClassName("scaling");
    var diag = document.getElementsByClassName("diag");

    var j = 0;
    cfg[j++] = 0;//document.getElementById("mainInput").value;
    cfg[j++] = 0;//document.getElementById("subInput").value;
    cfg[j++] = nbMapping;

    for (var i = 0; i < nbMapping; i++) {
        cfg[j++] = src[i].value;
        cfg[j++] = dest[i].value;
        cfg[j++] = destId[i].value;
        cfg[j++] = max[i].value;
        cfg[j++] = thres[i].value;
        cfg[j++] = dz[i].value;
        cfg[j++] = turbo[i].value;
        cfg[j++] = Number(scaling[i].value) | (Number(diag[i].value) << 4);
    }

    return new Promise(function(resolve, reject) {
        writeInputCfg(cfgId, cfg)
        .then(_ => {
            document.getElementById("inputSaveText").style.display = 'block';
            log('入力 ' + cfgId + ' の設定を保存しました');
            resolve();
        })
        .catch(error => {
            reject(error);
        });
    });
}

function onDisconnected() {
    log('> Bluetoothデバイスが切断されました');
    document.getElementById("divBtConn").style.display = 'block';
    document.getElementById("divInfo").style.display = 'none';
    document.getElementById("divCfgSel").style.display = 'none';
    //document.getElementById("divBtDisconn").style.display = 'none';
    document.getElementById("divGlobalCfg").style.display = 'none';
    document.getElementById("divOutputCfg").style.display = 'none';
    document.getElementById("divInputCfg").style.display = 'none';
}

function swGameIdCfg() {
    setGameIdCfg(brService)
    .then(_ => {
        return getCfgSrc(brService);
    })
    .then(value => {
        current_cfg = value;
        initBlueRetroCfg();
        return loadGlobalCfg();
    })
    .then(() => {
        return loadOutputCfg(0);
    })
    .then(() => {
        return loadInputCfg(0);
    })
}

function swDefaultCfg() {
    setDefaultCfg(brService)
    .then(_ => {
        return getCfgSrc(brService);
    })
    .then(value => {
        current_cfg = value;
        initBlueRetroCfg();
        return loadGlobalCfg();
    })
    .then(() => {
        return loadOutputCfg(0);
    })
    .then(() => {
        return loadInputCfg(0);
    })
}

function initCfgSelection() {
    let divCfgSel = document.getElementById("divCfgSel");
    let cfgSw = document.createElement("div");
    let cfgBtn = document.createElement("button");

    divCfgSel.innerHTML = '';

    let header = document.createElement("h2");
    header.style.margin = 0;
    header.innerText = text.cfgSelectionHeader;

    divCfgSel.appendChild(header);

    divCfgSel.innerHTML += `<a href="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#21---config-selection" target="_blank">${text.wikiGlobal}</a><br><br>`;

    cfgBtn.id = "cfgSw";
    const cfgNotice = document.createElement("p");
    cfgNotice.style.marginTop = "0.5em";
    cfgNotice.innerText = text.cfgSelectionNotice;
    divCfgSel.appendChild(cfgNotice);

    if (current_cfg == 0) {
        cfgBtn.innerText += 'GameIDへ切替';
        cfgBtn.addEventListener("click", swGameIdCfg);
        divCfgSel.innerHTML += '現在の設定: グローバル';
        if (gameid.length) {
            cfgSw.appendChild(cfgBtn);
        }
    }
    else {
        cfgBtn.innerText = 'グローバルへ切替';
        cfgBtn.addEventListener("click", swDefaultCfg);
        divCfgSel.innerHTML += '現在の設定: GameID';
        cfgSw.appendChild(cfgBtn);
    }
    cfgSw.setAttribute("style", "margin-top:1em;");
    divCfgSel.append(cfgSw);
}

export function btConn() {
    log(text.logRequestDevice);
    navigator.bluetooth.requestDevice(
        {filters: [{namePrefix: 'VS-C4'}],
        optionalServices: [brUuid[0]]})
    .then(device => {
        log(text.logConnectGatt);
        name = device.name;
        bluetoothDevice = device;
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return bluetoothDevice.gatt.connect();
    })
    .then(server => {
        log(text.logGetService);
        return server.getPrimaryService(brUuid[0]);
    })
    .catch(error => {
        log(error.name);
        throw text.logCannotConnect;
    })
    .then(service => {
        brService = service;
        return getApiVersion(brService);
    })
    .then(value => {
        apiVersion = value;
        return getBdAddr(brService);
    })
    .then(value => {
        bdaddr = value;
        return getLatestRelease();
    })
    .then(value => {
        latest_ver = value;
        return getAppVersion(brService);
    })
    .then(value => {
        app_ver = value;
        return getGameId(brService);
    })
    .then(value => {
        gameid = value;
        return getGameName(gameid);
    })
    .then(value => {
        gamename = value;
        return getCfgSrc(brService);
    })
    .catch(error => {
        if (error.name == 'NotFoundError'
          || error.name == 'NotSupportedError') {
            return 0;
        }
        throw error;
    })
    .then(value => {
        current_cfg = value;
        log("ABI version: " + apiVersion);
        log(text.logInitCfg);
        initBlueRetroCfg();
        return loadGlobalCfg();
    })
    .then(() => {
        return loadOutputCfg(0);
    })
    .then(() => {
        return loadInputCfg(0);
    })
    .then(() => {
        document.getElementById("divInfo").innerHTML = text.infoConnectedPrefix + name + ' (' + bdaddr + ') [' + app_ver
            + ']<br>' + text.infoCurrentGame + gamename + ' (' + gameid + ')';
        try {
            if (app_ver.indexOf(latest_ver) == -1) {
                document.getElementById("divInfo").innerHTML += `<br><br>${text.infoUpdate}${latest_ver}${text.infoUpdateSuffix}`;
            }
        }
        catch (e) {
            // Just move on
        }
        document.getElementById("divBtConn").style.display = 'none';
        //document.getElementById("divBtDisconn").style.display = 'block';
        document.getElementById("divInfo").style.display = 'block';
        document.getElementById("divCfgSel").style.display = 'block';
        document.getElementById("divGlobalCfg").style.display = 'block';
        document.getElementById("divOutputCfg").style.display = 'block';
        document.getElementById("divInputCfg").style.display = 'block';
    })
    .catch(error => {
        log('エラー: ' + error);
    });
}

function applyGlobalUiFilters() {
    const systemSelect = document.getElementById("systemCfg");
    if (systemSelect && customUi.allowedSystems && customUi.allowedSystems.length) {
        restrictSelectByValue(systemSelect, customUi.allowedSystems.map(String));
    }
    if (customUi.hideMultitap) {
        const multitapSelect = document.getElementById("multitapCfg");
        if (multitapSelect) {
            const wrapper = multitapSelect.closest("div");
            if (wrapper) {
                wrapper.style.display = "none";
            }
            multitapSelect.value = multitapSelect.options.length ? multitapSelect.options[0].value : multitapSelect.value;
            multitapSelect.disabled = true;
        }
    }
}

function applyOutputSelectFilter() {
    const outputSelect = document.getElementById("outputSelect");
    if (!outputSelect) {
        return;
    }
    outputSelect.value = outputSelect.options.length ? outputSelect.options[0].value : outputSelect.value;
    outputSelect.disabled = true;
    if (customUi.hideOutputSelect) {
        const wrapper = outputSelect.closest("div");
        if (wrapper) {
            wrapper.style.display = "none";
        }
    }
}

function applyOutputModeFilters() {
    const outputMode = document.getElementById("outputMode");
    if (outputMode && customUi.allowedOutputModes && customUi.allowedOutputModes.length) {
        restrictSelectByValue(outputMode, customUi.allowedOutputModes.map(String));
        outputMode.disabled = true;
    }
    const outputAcc = document.getElementById("outputAcc");
    if (outputAcc && customUi.allowedAccessories && customUi.allowedAccessories.length) {
        restrictSelectByValue(outputAcc, customUi.allowedAccessories.map(String));
    }
}

function applyInputSelectionUiFilters() {
    const inputSelect = document.getElementById("inputSelect");
    if (inputSelect) {
        inputSelect.value = inputSelect.options.length ? inputSelect.options[0].value : inputSelect.value;
    }
}

function applyLabelFilters() {
    const destSelect = document.getElementById("dstLabel");
    if (destSelect && destLabelAllowedIdx.length) {
        restrictSelectByValue(destSelect, destLabelAllowedIdx.map(String));
        if (destSelect.value !== '' && Number(destSelect.value) !== destLabel) {
            destLabel = Number(destSelect.value);
            changeDstLabel.call(destSelect);
        }
    }
}

function customizeMappingRow(row) {
    if (!row) {
        return;
    }
    const srcSpan = row.querySelector(".src") ? row.querySelector(".src").parentElement : null;
    if (srcSpan) {
        srcSpan.style.maxWidth = "25%";
        srcSpan.style.minWidth = "220px";
    }
    const destSpan = row.querySelector(".dest") ? row.querySelector(".dest").parentElement : null;
    if (destSpan) {
        destSpan.style.maxWidth = "25%";
        destSpan.style.minWidth = "220px";
    }
    if (customUi.hideMappingFields?.destId) {
        hideFieldElement(row.querySelector(".destId"));
    }
    if (customUi.hideMappingFields?.max) {
        hideFieldElement(row.querySelector(".max"));
    }
    if (customUi.hideMappingFields?.thres) {
        hideFieldElement(row.querySelector(".thres"));
    }
    const deadzoneSpan = row.querySelector(".dz") ? row.querySelector(".dz").parentElement : null;
    if (deadzoneSpan) {
        deadzoneSpan.style.maxWidth = "15%";
    }
    const scalingSelect = row.querySelector(".scaling");
    if (scalingSelect && customUi.allowedScalingIdx && customUi.allowedScalingIdx.length) {
        restrictSelectByValue(scalingSelect, customUi.allowedScalingIdx.map(String), { preserveCurrent: true });
        const scalingSpan = scalingSelect.parentElement;
        if (scalingSpan) {
            scalingSpan.style.maxWidth = "15%";
        }
    }
    if (customUi.hideMappingFields?.turbo) {
        const turboSelect = row.querySelector(".turbo");
        if (turboSelect) {
            turboSelect.value = getTurboDisableValue(turboSelect);
            hideFieldElement(turboSelect);
        }
    }
    if (customUi.hideMappingFields?.scalingDiag) {
        const diagSelect = row.querySelector(".diag");
        if (diagSelect) {
            diagSelect.value = diagSelect.options.length ? diagSelect.options[0].value : diagSelect.value;
            hideFieldElement(diagSelect);
        }
    }
}

function hideFieldElement(element) {
    if (!element) {
        return;
    }
    const wrapper = element.closest("span") || element.parentElement;
    if (wrapper) {
        wrapper.style.display = "none";
    }
    else {
        element.style.display = "none";
    }
}

function restrictSelectByValue(select, allowedValues, options = {}) {
    if (!select || !allowedValues || !allowedValues.length) {
        return;
    }
    const preserveCurrent = options.preserveCurrent || false;
    const allowedSet = new Set(allowedValues.map(String));
    const currentValue = select.value;
    Array.from(select.options).forEach((option) => {
        if (allowedSet.has(option.value) || (preserveCurrent && option.value === currentValue)) {
            option.hidden = false;
            option.disabled = false;
        }
        else {
            option.hidden = true;
            option.disabled = true;
        }
    });
    if (!allowedSet.has(currentValue) && !preserveCurrent) {
        const firstAllowed = Array.from(select.options).find((option) => !option.disabled && allowedSet.has(option.value));
        if (firstAllowed) {
            select.value = firstAllowed.value;
        }
    }
}

function getTurboDisableValue(select) {
    if (!select) {
        return '';
    }
    if (select.options.length) {
        return select.options[0].value;
    }
    const turboValues = Object.values(turboMask || {});
    return turboValues.length ? turboValues[0] : '';
}

function addInput() {
    if (nbMapping < maxMapping){
        nbMapping++;
        var div = document.getElementById("divMapping");
        var newSubDiv = mappingElement.cloneNode(true);
        customizeMappingRow(newSubDiv);
        var newButton = document.createElement("button");
        newButton.innerText = '-';
        newButton.addEventListener("click", delInput);
        newSubDiv.appendChild(newButton);
        newSubDiv.querySelector('.max').value = 100;
        newSubDiv.querySelector('.thres').value = 50;
        newSubDiv.querySelector('.dz').value = 135;
        div.appendChild(newSubDiv);
    }
}

function delInput() {
    this.parentNode.remove();
    nbMapping--;
}

function selectOutput() {
    loadOutputCfg(this.value);
}

function selectInput() {
    loadInputCfg(this.value);
}

function changeSrcLabel() {
    var select = document.getElementsByClassName("src");
    var str = ""
    var tmp;

    srcLabel = this.value;

    for (var i = 0; i < btnList.length; i++) {
        str += "<option value=\"" + i + "\">" + btnList[i][srcLabel] + "</option>";
    }
    for (var i = 0; i < select.length; i++) {
        tmp = select[i].value;
        select[i].innerHTML = str;
        select[i].value = tmp;
    }
    if (mappingElement) {
        var tmplSrc = mappingElement.querySelector('.src');
        if (tmplSrc) {
            tmplSrc.innerHTML = str;
        }
    }
}

function changeDstLabel() {
    var select = document.getElementsByClassName("dest");
    var str = ""
    var tmp;

    destLabel = this.value;

    for (var i = 0; i < btnList.length; i++) {
        str += "<option value=\"" + i + "\">" + btnList[i][destLabel] + "</option>";
    }
    for (var i = 0; i < select.length; i++) {
        tmp = select[i].value;
        select[i].innerHTML = str;
        select[i].value = tmp;
    }
    if (mappingElement) {
        var tmplDest = mappingElement.querySelector('.dest');
        if (tmplDest) {
            tmplDest.innerHTML = str;
        }
    }
}
