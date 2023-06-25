import type { ZoteroItem, IZotero, ZoteroObserver } from '../typings/zotero'
import { ItemPane } from './itemPane'
import { ToolsPane } from './toolsPane'
import { PrefPane } from './prefPane'
import { ZoteroUtil } from './zoteroUtil'

declare const Zotero: IZotero
declare const window

class ItemObserver implements ZoteroObserver {
  // Called when a new item is added to the library
  public async notify(event: string, _type: string, ids: [number], _extraData: Record<string, any>) {
    const automaticPdfDownload = Zotero.Nexus.isAutomaticPdfDownload()

    if (event === 'add' && automaticPdfDownload) {
      const items = await Zotero.Items.getAsync(ids)
      await Zotero.Nexus.updateItems(items)
    }
  }
}

class Nexus {
  // TOOD: only bulk-update items which are missing paper attachement
  private static readonly CAR_URL = 'https://bafyb4iee27p2wdqsorvj7gquitwuti3sfeepdvx2p3feao2dqri37fm3yy.ipfs.dweb.link'
  private static readonly DEFAULT_AUTOMATIC_PDF_DOWNLOAD = true
  private observerId: number | null = null
  private initialized = false
  public ItemPane: ItemPane
  public PrefPane: PrefPane
  public ToolsPane: ToolsPane

  constructor() {
    this.ItemPane = new ItemPane()
    this.PrefPane = new PrefPane()
    this.ToolsPane = new ToolsPane()
  }

  public getNexusUrl(doi: string): URL {
    Zotero.debug(`doi: ${doi}`)
    return new URL(`${Nexus.CAR_URL}/${encodeURIComponent(encodeURIComponent(doi))}.pdf`)
  }

  public isAutomaticPdfDownload(): boolean {
    if (Zotero.Prefs.get('zoteronexus.automatic_pdf_download') === undefined) {
      Zotero.Prefs.set('zoteronexus.automatic_pdf_download', Nexus.DEFAULT_AUTOMATIC_PDF_DOWNLOAD)
    }

    return Zotero.Prefs.get('zoteronexus.automatic_pdf_download') as boolean
  }

  public load(): void {
    // Register the callback in Zotero as an item observer
    if (this.initialized) return
    this.observerId = Zotero.Notifier.registerObserver(new ItemObserver(), ['item'], 'Nexus')
    this.initialized = true
  }

  public unload(): void {
    if (this.observerId) {
      Zotero.Notifier.unregisterObserver(this.observerId)
    }
  }

  public async updateItems(items: ZoteroItem[]): Promise<void> {
    // WARN: Sequentially go through items, parallel will fail due to rate-limiting
    for (const item of items) {
      // Skip items which are not processable
      if (!item.isRegularItem() || item.isCollection()) { continue }

      // Skip items without DOI or if URL generation had failed
      const nexusUrl = this.generateNexusItemUrl(item)
      if (!nexusUrl) {
        ZoteroUtil.showPopup('DOI is missing', item.getField('title'), true)
        Zotero.debug(`nexus: failed to generate URL for "${item.getField('title')}"`)
        continue
      }

      try {
        await this.updateItem(nexusUrl, item)
      } catch (error) {
        // Do not stop traversing items if PDF is missing for one of them
        ZoteroUtil.showPopup('PDF not available', `Try again later.\n"${item.getField('title')}"`, true)
      }
    }
  }

  private async updateItem(nexusUrl: URL, item: ZoteroItem) {
    ZoteroUtil.showPopup('Fetching PDF', item.getField('title'))
    await ZoteroUtil.attachRemotePDFToItem(nexusUrl, item)
  }

  private getDoi(item: ZoteroItem): string | null {
    const doiField = item.getField('DOI')
    const doiFromExtra = this.getDoiFromExtra(item)
    const doiFromUrl = this.getDoiFromUrl(item)
    const doi = doiField ?? doiFromExtra ?? doiFromUrl

    if (doi && doi.length > 0) {
      return doi
    }
    return null
  }

  private getDoiFromExtra(item: ZoteroItem): string | null {
    // For books "extra" field might contain DOI instead
    // values in extra are <key>: <value> separated by newline
    const extra = item.getField('extra')
    const match = extra?.match(/^DOI: (.+)$/m)
    if (match) {
      return match[1]
    }
    return null
  }

  private getDoiFromUrl(item: ZoteroItem): string | null {
    // If item was added by the doi.org url it can be extracted from its pathname
    const url = item.getField('url')
    const isDoiOrg = url?.match(/\bdoi\.org\b/i)
    if (isDoiOrg) {
      const doiPath = new URL(url).pathname
      return decodeURIComponent(doiPath).replace(/^\//, '')
    }
    return null
  }

  private generateNexusItemUrl(item: ZoteroItem): URL | null {
    const doi = this.getDoi(item)
    if (doi) {
      return this.getNexusUrl(doi)
    }
    return null
  }
}

Zotero.Nexus = new Nexus()

// Check fails in testing environment
if (typeof window !== 'undefined') {
  window.addEventListener('load', _ => {
    Zotero.Nexus.load()
  }, false)
  window.addEventListener('unload', _ => {
    Zotero.Nexus.unload()
  }, false)
}

export { Nexus }
