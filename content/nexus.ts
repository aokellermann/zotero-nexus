import type { ZoteroItem, IZotero, ZoteroObserver } from '../typings/zotero'
import { ItemPane } from './itemPane'
import { ToolsPane } from './toolsPane'
import { PrefPane } from './prefPane'
import { ZoteroUtil } from './zoteroUtil'

declare const Zotero: IZotero
declare const window

enum HttpCodes {
  DONE = 200,
}

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
  private static readonly DEFAULT_AUTOMATIC_PDF_DOWNLOAD = true
  private static readonly DEFAULT_IPFS_RPC_URL = new URL('http://127.0.0.1:5001')
  private static readonly DEFAULT_IPFS_GATEWAY_URL = new URL('http://127.0.0.1:8080')
  private static readonly INTERNET_IPFS_GATEWAY_URL = new URL('https://dweb.link')
  private static readonly HUB_DOMAIN = 'hub-standard--template--construct-org'
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

  public getIpfsRpcUrl(): URL {
    const setting = 'zoteronexus.ipfs_rpc_url'

    if (Zotero.Prefs.get(setting) === undefined) {
      Zotero.Prefs.set(setting, Nexus.DEFAULT_IPFS_RPC_URL.href)
    }

    return new URL(Zotero.Prefs.get(setting) as string)
  }

  public getLocalIpfsGatewayUrl(): URL {
    const setting = 'zoteronexus.ipfs_gateway_url'

    if (Zotero.Prefs.get(setting) === undefined) {
      Zotero.Prefs.set(setting, Nexus.DEFAULT_IPFS_GATEWAY_URL.href)
    }

    let url = Zotero.Prefs.get(setting) as string
    url = url.replace('127.0.0.1', 'localhost')
    return new URL(url)
  }

  public async localGatewayAccessible(): Promise<boolean> {
    const url = this.getIpfsRpcUrl()
    url.pathname = 'api/v0/swarm/peers'

    let xhr
    try {
      xhr = await Zotero.HTTP.request('POST', url.href, {
        responseType: 'json',
        timeout: 2500,
        headers: {
          Origin: url.origin,
        },
      })
    } catch (err) {
      Zotero.debug('local ipfs gateway unreachable')
      return false
    }

    if (xhr.status === HttpCodes.DONE) {
      const res = xhr.response
      const peers = res.Peers.length
      Zotero.debug(`ipfs peers: ${peers}`)
      return peers > 0
    }
    Zotero.debug('local ipfs gateway unreachable')
    return false
  }

  public getNexusUrl(doi: string, useLocalGateway: boolean): URL {
    Zotero.debug(`doi: ${doi}`)

    const host = useLocalGateway ? this.getLocalIpfsGatewayUrl() : Nexus.INTERNET_IPFS_GATEWAY_URL
    const baseUrl = new URL(`${host.protocol}//${Nexus.HUB_DOMAIN}.ipns.${host.host}`)
    const url = new URL(`${encodeURIComponent(encodeURIComponent(doi))}.pdf`, baseUrl)

    Zotero.debug(`url: ${url.href}`)

    return url
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
    const useLocalGateway = await this.localGatewayAccessible()

    if (useLocalGateway) {
      // if local gateway we don't care about rate limiting
      await Promise.all(items.map(item => this.updateItem(item, useLocalGateway)))
    } else {
      // if internet gateway we care about rate limiting
      for (const item of items) {
        await this.updateItem(item, useLocalGateway)
      }
    }
  }

  private async updateItem(item: ZoteroItem, useLocalGateway: boolean) {
    // Skip items which are not processable
    if (!item.isRegularItem() || item.isCollection()) return

    // Skip items without DOI or if URL generation had failed
    const nexusUrl = this.generateNexusItemUrl(item, useLocalGateway)
    if (!nexusUrl) {
      ZoteroUtil.showPopup('DOI is missing', item.getField('title'), true)
      Zotero.debug(`nexus: failed to generate URL for "${item.getField('title')}"`)
      return
    }

    try {
      ZoteroUtil.showPopup('Fetching PDF', item.getField('title'))
      await ZoteroUtil.attachRemotePDFToItem(nexusUrl, item)
    } catch (error) {
      // Do not stop traversing items if PDF is missing for one of them
      ZoteroUtil.showPopup('PDF not available', `Try again later.\n"${item.getField('title')}"`, true)
    }
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

  private generateNexusItemUrl(item: ZoteroItem, useLocalGateway: boolean): URL | null {
    const doi = this.getDoi(item)
    if (doi) {
      return this.getNexusUrl(doi, useLocalGateway)
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
