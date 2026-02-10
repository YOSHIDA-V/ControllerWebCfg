import { brUuid } from '../utils//constants.js';
import ChromeSamples from "../utils/ChromeSamples.js"

export const saveOutputCfg = (brService, data, cfgId) => {
    return new Promise((resolve, reject) => {
      ChromeSamples.log("出力 " + cfgId + " CTRL CHRC...");
      brService
        .getCharacteristic(brUuid[2])
        .then((chrc) => {
          ChromeSamples.log("Set Output " + cfgId + " on CTRL chrc...");
          var outputCtrl = new Uint16Array(1);
          outputCtrl[0] = Number(cfgId);
          return chrc.writeValue(outputCtrl);
        })
        .then((_) => {
          ChromeSamples.log("出力 " + cfgId + " DATA CHRC を取得中...");
          return brService.getCharacteristic(brUuid[3]);
        })
        .then((chrc) => {
          ChromeSamples.log("出力 " + cfgId + " 設定を書き込み中...");
          return chrc.writeValue(data);
        })
        .then((_) => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  export default saveOutputCfg