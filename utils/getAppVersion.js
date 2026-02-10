import ChromeSamples from "./ChromeSamples.js";
import { brUuid } from "../utils/constants.js";

export const getAppVersion = (service) => {
  return new Promise((resolve, reject) => {
    service
      .getCharacteristic(brUuid[9])
      .then((chrc) => {
        ChromeSamples.log("アプリバージョンを読み込み中...");
        return chrc.readValue();
      })
      .then((value) => {
        let enc = new TextDecoder("utf-8");
        let app_ver = enc.decode(value);
        resolve(app_ver);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default getAppVersion;
