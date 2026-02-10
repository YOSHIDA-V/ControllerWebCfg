// Base on https://www.html5rocks.com/en/tutorials/file/dndfiles//

import { brUuid, cfg_cmd_get_fw_name, cfg_cmd_get_fw_ver } from './utils/constants.js';
import { getLatestRelease } from './utils/getLatestRelease.js';
import { getStringCmd } from './utils/getStringCmd.js';
import { getAppVersion } from './utils/getAppVersion.js';
import { getBdAddr } from './utils/getBdAddr.js';
import { otaWriteFirmware } from './utils/otaWriteFirmware.js';

var bluetoothDevice;
let brService = null;
var reader;
var progress = document.querySelector('.percent');
var cancel = 0;
var bdaddr = '';
var app_ver = '';
var app_name = '';
var latest_ver = '';
var name = '';
let cur_fw_is_hw2 = 0;

export function abortFwUpdate() {
    cancel = 1;
}

function setProgress(percent) {
    progress.style.width = percent + '%';
    progress.textContent = percent + '%';
}

function errorHandler(evt) {
    switch(evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
            log('ファイルが見つかりません');
            break;
        case evt.target.error.NOT_READABLE_ERR:
            log('ファイルを読み取れません');
            break;
        case evt.target.error.ABORT_ERR:
            break; // noop
        default:
            log('ファイル読み込み中にエラーが発生しました');
    };
}

function updateProgress(total, loaded) {
    var percentLoaded = Math.round((loaded / total) * 100);
    // Increase the progress bar length.
    if (percentLoaded < 100) {
        progress.style.width = percentLoaded + '%';
        progress.textContent = percentLoaded + '%';
    }
}

export function firmwareUpdate(evt) {
    // Reset progress indicator on new file selection.
    progress.style.width = '0%';
    progress.textContent = '0%';

    reader = new FileReader();
    reader.onerror = errorHandler;
    reader.onabort = function(e) {
        log('ファイル読み込みをキャンセルしました');
    };
    reader.onload = function(e) {
        var decoder = new TextDecoder("utf-8");
        var header = decoder.decode(reader.result.slice(0, 256));
        let new_fw_is_hw2 = (header.indexOf('hw2') != -1);

        log("HW2判定(new_fw): " + new_fw_is_hw2);

        if (cur_fw_is_hw2 == new_fw_is_hw2) {
            writeFirmware(reader.result, 0);
        }
        else {
            log("ハードウェアとファームウェアが一致しません");
        }
    }

    let file = document.getElementById("fwFile").value;
    let ext = file.match(/\.[0-9a-z]+$/i);

    if (ext[0] == '.bin') {
        // Read in the image file as a binary string.
        reader.readAsArrayBuffer(document.getElementById("fwFile").files[0]);
    }
    else {
        log("ファイル形式が対応している形式ではありません。zipを展開してから指定してください");
    }
}

function writeFirmware(data) {
    document.getElementById('progress_bar').className = 'loading';
    document.getElementById("divBtConn").style.display = 'none';
    document.getElementById("divInfo").style.display = 'block';
    document.getElementById("divFwSelect").style.display = 'none';
    document.getElementById("divFwUpdate").style.display = 'block';
    otaWriteFirmware(brService, data, setProgress, cancel)
    .catch(error => {
        log('エラー:' + error);
        document.getElementById("divBtConn").style.display = 'none';
        document.getElementById("divInfo").style.display = 'block';
        document.getElementById("divFwSelect").style.display = 'block';
        document.getElementById("divFwUpdate").style.display = 'none';
    });
}

function onDisconnected() {
    log('> Bluetooth デバイスが切断されました');
    cancel = 0;
    document.getElementById("divBtConn").style.display = 'block';
    document.getElementById("divInfo").style.display = 'none';
    document.getElementById("divFwSelect").style.display = 'none';
    document.getElementById("divFwUpdate").style.display = 'none';
}

export function btConn() {
    log('Bluetooth デバイスを要求しています...');
    navigator.bluetooth.requestDevice(
        {filters: [{namePrefix: 'BlueRetro'}],
        オプションalServices: [brUuid[0]]})
    .then(device => {
        log('GATT サーバーに接続しています...');
        name = device.name;
        bluetoothDevice = device;
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        return bluetoothDevice.gatt.connect();
    })
    .then(server => {
        log('VS-C4 サービスを取得しています...');
        return server.getPrimaryService(brUuid[0]);
    })
    .catch(error => {
        log(error.name);
        throw 'VS-C4 に接続できませんでした';
    })
    .then(service => {
        brService = service;
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
        let app_ver_is_18x = (app_ver.indexOf('v1.8') != -1);
        let app_ver_bogus = (app_ver.indexOf('v') == -1);
        if (app_ver_is_18x || app_ver_bogus) {
            return '';
        }
        else {
            return getStringCmd(brService, cfg_cmd_get_fw_name);
        }
    })
    .catch(error => {
        if (error.name == 'NotFoundError'
          || error.name == 'NotSupportedError') {
            return '';
        }
        throw error;
    })
    .then(value => {
        app_name = value;
        document.getElementById("divInfo").innerHTML = '接続先: ' + name + ' (' + bdaddr + ') [' + app_ver + ']';
        try {
            if (app_ver.indexOf(latest_ver) == -1) {
                document.getElementById("divInfo").innerHTML += '<br><br>最新FW ' + latest_ver + ' を <a href=\'https://github.com/darthcloud/BlueRetro/releases\'>GitHub</a>';
            }
        }
        catch (e) {
            // Just move on
        }
        cur_fw_is_hw2 = 0;
        let app_ver_is_hw2 = (app_ver.indexOf('hw2') != -1);
        let app_name_is_hw2 = (app_name.indexOf('hw2') != -1);
        log("HW2判定(app_ver): " + app_ver_is_hw2 + " HW2判定(app_name): " + app_name_is_hw2);
        if (app_ver_is_hw2 || app_name_is_hw2) {
            cur_fw_is_hw2 = 1;
        }
        log('設定UIを初期化中...');
        document.getElementById("divBtConn").style.display = 'none';
        document.getElementById("divInfo").style.display = 'block';
        document.getElementById("divFwSelect").style.display = 'block';
        document.getElementById("divFwUpdate").style.display = 'none';
    })
    .catch(error => {
        log('エラー:' + error);
    });
}
