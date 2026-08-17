import { brUuid, cfg_cmd_sys_reset } from "../utils/constants.js";

export function setReset(brService) {
    var cmd = new Uint8Array(1);
    return brService
      .getCharacteristic(brUuid[7])
      .then((chrc) => {
        cmd[0] = cfg_cmd_sys_reset;
        return chrc.writeValue(cmd);
      });
}

export default setReset;
