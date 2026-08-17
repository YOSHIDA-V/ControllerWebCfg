// Base on https://www.html5rocks.com/en/tutorials/file/dndfiles//

import { brUuid, showLatestFirmwareNotice } from './utils/constants.js';
import { getLatestRelease } from './utils/getLatestRelease.js';
import { getAppVersion } from './utils/getAppVersion.js';
import { getBdAddr } from './utils/getBdAddr.js';
import { setDeepSleep } from './utils/setDeepSleep.js';
import { setReset } from './utils/setReset.js';
import { setFactoryReset } from './utils/setFactoryReset.js';

var bluetoothDevice;
var bdaddr = '';
var app_ver = '';
var latest_ver = '';
var name = '';
let brService = null;

function onDisconnected() {
    log('> Bluetooth デバイスが切断されました');
    document.getElementById("divBtConn").style.display = 'block';
    document.getElementById("divInfo").style.display = 'none';
    document.getElementById("divSleep").style.display = 'none';
    document.getElementById("divReset").style.display = 'none';
    document.getElementById("divFactory").style.display = 'none';
}

function executeSystemAction(buttonId, confirmMessage, actionName, action) {
    if (!window.confirm(confirmMessage)) {
        log(actionName + 'をキャンセルしました');
        return Promise.resolve(false);
    }

    const button = document.getElementById(buttonId);
    button.disabled = true;
    log(actionName + 'を実行しています...');

    return action(brService)
      .then(() => {
          log(actionName + 'を実行しました');
          return true;
      })
      .catch(error => {
          log(actionName + 'に失敗しました: ' + error);
          return false;
      })
      .finally(() => {
          button.disabled = false;
      });
}

export function setDeepSleepEvent() {
    return executeSystemAction(
      'btnSleep',
      'VS-C4をDeep Sleepにします。実行しますか？',
      'Deep Sleep',
      setDeepSleep
    );
}

export function setResetEvent() {
    return executeSystemAction(
      'btnReset',
      'VS-C4をリセットします。実行しますか？',
      'リセット',
      setReset
    );
}

export function setFactoryResetEvent() {
    return executeSystemAction(
      'btnFactory',
      'VS-C4を出荷時リセットします。保存済み設定は消去されます。実行しますか？',
      '出荷時リセット',
      setFactoryReset
    );
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
        log('アドレス: ' + service);
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
        document.getElementById("divInfo").innerHTML = '接続先: ' + name + ' (' + bdaddr + ') [' + app_ver + ']';
        try {
            if (showLatestFirmwareNotice && app_ver.indexOf(latest_ver) == -1) {
                document.getElementById("divInfo").innerHTML += '<br><br>最新FW ' + latest_ver + ' を <a href=\'https://github.com/YOSHIDA-V/blueretro-vs-c4-firmware/releases\'>GitHub</a>';
            }
        }
        catch (e) {
            // Just move on
        }
        log('設定UIを初期化中...');
        document.getElementById("divBtConn").style.display = 'none';
        document.getElementById("divInfo").style.display = 'block';
        document.getElementById("divSleep").style.display = 'block';
        document.getElementById("divReset").style.display = 'block';
        document.getElementById("divFactory").style.display = 'block';
    })
    .catch(error => {
        log('エラー:' + error);
    });
}
