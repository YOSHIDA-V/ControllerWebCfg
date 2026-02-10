import ChromeSamples from "./ChromeSamples.js";

export function presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc) {
    return new Promise((resolve, reject) => {
      ChromeSamples.log("入力 CTRL CHRC を設定... " + inputCtrl[1]);
      ctrl_chrc
        .writeValue(inputCtrl)
        .then((_) => {
          ChromeSamples.log("入力データ CHRC を書き込み中...");
          var tmpViewSize = cfg.byteLength - inputCtrl[1];
          if (tmpViewSize > 512) {
            tmpViewSize = 512;
          }
          var tmpView = new DataView(cfg.buffer, inputCtrl[1], tmpViewSize);
          return data_chrc.writeValue(tmpView);
        })
        .then((_) => {
          ChromeSamples.log("入力データを書き込みました");
          inputCtrl[1] += Number(512);
          if (inputCtrl[1] < cfg.byteLength) {
            resolve(presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc));
          } else {
            resolve();
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  export default presetWriteRecursive;