import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { getPref, setPref } from "../utils/prefs";

export class Preferences {
  static register() {
    const prefOptions = {
      pluginID: config.addonID,
      src: rootURI + "chrome/content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${config.addonRef}/content/icons/favicon.png`,
      defaultXUL: true,
    };
    ztoolkit.PreferencePane.register(prefOptions);

    if (getPref(`extensions.zotero.${config.addonRef}.automatic-pdf-download`) === undefined) {
      setPref(`extensions.zotero.${config.addonRef}.automatic-pdf-download`, true)
    }
  }
}
