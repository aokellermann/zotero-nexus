import type { IZotero } from '../typings/zotero'
declare const Zotero: IZotero

class PrefPane {
  public initPreferences(): void {
    const automaticPdfDownloadCheckbox = document.getElementById('id-zoteronexus-automatic-pdf-download') as HTMLInputElement
    automaticPdfDownloadCheckbox.checked = Zotero.Nexus.isAutomaticPdfDownload()
  }
}

export { PrefPane }
