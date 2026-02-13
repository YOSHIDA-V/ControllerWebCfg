// Base on https://www.html5rocks.com/en/tutorials/file/dndfiles//

import { brUuid, cfg_cmd_get_file, cfg_cmd_open_dir, cfg_cmd_close_dir, cfg_cmd_del_file } from './utils/constants.js';
import { getLatestRelease } from './utils/getLatestRelease.js';
import { getAppVersion } from './utils/getAppVersion.js';
import { getBdAddr } from './utils/getBdAddr.js';
import { getGameName } from './utils/getGameName.js';

var bluetoothDevice;
var bdaddr = '';
var app_ver = '';
var latest_ver = '';
var name = '';
let brService = null;
let fileList = [];
let gidList = [];

function deleteFileCmd(filename) {
    return new Promise((resolve, reject) => {
        var cmd = new Uint8Array(1);
        brService.getCharacteristic(brUuid[7])
        .then((chrc) => {
            cmd[0] = cfg_cmd_del_file;
            let enc = new TextEncoder();
            let file = enc.encode(filename);
            let combined = new Uint8Array([
                ...cmd,
                ...file,
            ]);
            return chrc.writeValue(combined);
        })
        .then((_) => {
            resolve();
        })
        .catch((error) => {
            reject(error);
        });
    });
}

function readFileRecursive(chrc) {
    return new Promise(function (resolve, reject) {
      chrc.readValue()
        .then((value) => {
          if (value.byteLength > 0) {
            let enc = new TextDecoder("utf-8");
            let filename = enc.decode(value);
            fileList.push(filename);
            getGameName(filename)
              .then((gamename) => {
                gidList.push(gamename);
                resolve(readFileRecursive(chrc));
              });
          }
          else {
            resolve();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
};

function getFiles() {
    return new Promise((resolve, reject) => {
        var cmd = new Uint8Array(1);
        var cmd_chrc;
        brService.getCharacteristic(brUuid[7])
        .then((chrc) => {
            cmd_chrc = chrc;
            cmd[0] = cfg_cmd_open_dir;
            return cmd_chrc.writeValue(cmd);
        })
        .then((_) => {
            cmd[0] = cfg_cmd_get_file;
            return cmd_chrc.writeValue(cmd);
        })
        .then((_) => {
            return readFileRecursive(cmd_chrc);
        })
        .then((_) => {
            cmd[0] = cfg_cmd_close_dir;
            return cmd_chrc.writeValue(cmd);
        })
        .then((_) => {
            resolve();
        })
        .catch((error) => {
            reject(error);
        });
    });
}

function deleteFile() {
    let div = this.parentNode;
    this.remove();
    let filename = div.innerText;
    div.remove();
    deleteFileCmd(filename);
}

function initFile() {
    var divFile = document.getElementById("divFile");

    divFile.innerHTML = '';

    let header = document.createElement("h2");
    header.style.margin = 0;
    header.innerText = 'ファイル一覧';

    divFile.appendChild(header);

    for (let i = 0; i < fileList.length; i++) {
        let div = document.createElement("div");
        let button = document.createElement("button");
        button.id = i;
        button.innerText = '削除'
        button.addEventListener('click', deleteFile)
        div.append(button);
        div.append(' ' + fileList[i]);
        div.title = gidList[i];
        divFile.append(div);
    }
}

function onDisconnected() {
    log('> Bluetooth デバイスが切断されました');
    document.getElementById("divBtConn").style.display = 'block';
    document.getElementById("divInfo").style.display = 'none';
    document.getElementById("divFile").style.display = 'none';
}

export function setDeepSleepEvent() {
    setDeepSleep(brService);
}

export function setResetEvent() {
    setReset(brService);
}

export function setFactoryResetEvent() {
    setFactoryReset(brService);
}

export function btConn() {
    log('Bluetooth デバイスを要求しています...');
    navigator.bluetooth.requestDevice(
        {
        // Filter so that only VS-C4 devices are shown in the chooser
        filters: [{namePrefix: 'VS-C4'}],
        optionalServices: [brUuid[0]]})
    .then(device => {
        log('GATT サーバーに接続しています...');
        log('デバイス名: ' + device.name);
        log('デバイスID: ' + device.id);
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
    .catch(error => {
        if (error.name == 'NotFoundError'
          || error.name == 'NotSupportedError') {
            return '';
        }
        throw error;
    })
    .then(value => {
        app_ver = value;
        return getFiles();
    })
    .then(_ => {
        initFile();
        document.getElementById("divInfo").innerHTML = '接続先: ' + name + ' (' + bdaddr + ') [' + app_ver + ']';
        try {
            if (app_ver.indexOf(latest_ver) == -1) {
                document.getElementById("divInfo").innerHTML += '<br><br>最新FW ' + latest_ver + ' を <a href=\'https://github.com/darthcloud/BlueRetro/releases\'>GitHub</a>からダウンロードしてください';
            }
        }
        catch (e) {
            // Just move on
        }
        log('設定UIを初期化中...');
        document.getElementById("divBtConn").style.display = 'none';
        document.getElementById("divInfo").style.display = 'block';
        document.getElementById("divFile").style.display = 'block';
    })
    .catch(error => {
        log('エラー: ' + error);
    });
}
