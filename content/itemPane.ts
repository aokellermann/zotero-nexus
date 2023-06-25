import type { IZotero, IZoteroPane } from '../typings/zotero'
declare const ZoteroPane: IZoteroPane
declare const Zotero: IZotero

class ItemPane {
  public async updateSelectedEntity(libraryId: string): Promise<void> {
    Zotero.debug(`nexus: updating items in entity ${libraryId}`)
    if (!ZoteroPane.canEdit()) {
      ZoteroPane.displayCannotEditLibraryMessage()
      return
    }

    const collection = ZoteroPane.getSelectedCollection(false)
    if (collection) {
      const items = collection.getChildItems(false, false)
      await Zotero.Nexus.updateItems(items)
    }
  }

  public async updateSelectedItems(): Promise<void> {
    Zotero.debug('nexus: updating selected items')
    const items = ZoteroPane.getSelectedItems()
    await Zotero.Nexus.updateItems(items)
  }
}

export { ItemPane }
