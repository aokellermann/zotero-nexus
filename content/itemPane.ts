import type { IZotero, IZoteroPane } from '../typings/zotero'
declare const ZoteroPane: IZoteroPane
declare const Zotero: IZotero

class ItemPane {
  // eslint-disable-next-line @typescript-eslint/require-await
  public async updateSelectedEntity(libraryId: string): Promise<void> {
    Zotero.debug(`nexus: updating items in entity ${libraryId}`)
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage()
      return
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async updateSelectedItems(): Promise<void> {
    Zotero.debug('nexus: updating selected items')
  }
}

export { ItemPane }
