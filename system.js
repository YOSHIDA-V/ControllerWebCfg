// Base on https://www.html5rocks.com/en/tutorials/file/dndfiles//

import { brUuid } from './utils/constants.js';
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
        {filters: [{namePrefix: 'BlueRetro'}],
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
            if (app_ver.indexOf(latest_ver) == -1) {
                document.getElementById("divInfo").innerHTML += '<br><br>最新FW ' + latest_ver + ' を <a href=\'https://github.com/darthcloud/BlueRetro/releases\'>GitHub</a>';
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
