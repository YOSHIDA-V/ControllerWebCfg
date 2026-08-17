import { brUuid, cfg_cmd_sys_factory } from "../utils/constants.js";

export function setFactoryReset(brService) {
    var cmd = new Uint8Array(1);
    return brService
      .getCharacteristic(brUuid[7])
      .then((chrc) => {
        cmd[0] = cfg_cmd_sys_factory;
        return chrc.writeValue(cmd);
      });
}

export default setFactoryReset;
