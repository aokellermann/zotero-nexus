interface IZoteroPane {
    canEdit: () => boolean
    displayCannotEditLibraryMessage: () => void
    getSelectedCollection: (asID: boolean) => ZoteroCollection | null
    getSelectedItems: () => [ZoteroItem]
}

interface ZoteroCollection {
    getChildItems: (asIDs: boolean, includeDeleted: boolean) => [ZoteroItem]
}

interface ZoteroObserver {
    notify: (event: string, type: string, ids: [number], extraData: Record<string, any>) => Promise<void>
}

interface ZoteroItem {
    id: string
    libraryID: string
    getField: (field: string, unformatted?: boolean, includeBaseMapped?: boolean) => string
    isRegularItem: () => boolean
    isCollection: () => boolean
    getExtraField: (field: string) => string
}

interface ZoteroResolver {
    url?: string,
    pageURL?: string
    articleVersion?: string
    accessMethod?: string
    version?: string
    referrer?: string
}

interface ProgressWindow {
    changeHeadline: (headline: string, icon?: string, postText?: string) => void
    addDescription: (body: string) => void
    startCloseTimer: (millis: number) => void
    show: () => void
}

interface URL {
    spec: string
}

interface IServices {
    io: {
        newURI: (v1: string, v2?: null, v3?: string | URL) => URL
    }
}

interface IZotero {
    Nexus: import('../content/nexus').Nexus

    debug: (msg: string | unknown, code?: number | undefined) => void
    logError: (err: Error | string) => void
    launchURL: (url: string) => void

    Notifier: {
        registerObserver: (observer: ZoteroObserver, types: string[], id: string, priority?: number) => number // any => ZoteroObserver
        unregisterObserver: (id: number) => void
    }

    Prefs: {
        get: (pref: string) => string | number | boolean
        set: (pref: string, value: string | number | boolean) => any
    }

    Items: {
        getAsync: (ids: number | number[]) => Promise<any | any[]>
        getAll: () => Promise<ZoteroItem[]>
    }

    HTTP: {
        request: (method: string, url: string, options?: {
            body?: string,
            responseType?: XMLHttpRequestResponseType,
            headers?: Record<string, string>,
            timeout?: number
        }) => Promise<XMLHttpRequest>
    }

    Attachments: {
        importFromURL: (options: Record<string, any>) => Promise<ZoteroItem>
        getPDFResolvers: (item: ZoteroItem, methods: string[], automatic: boolean) => any[]
    }

    Utilities: {
        cleanDOI: (doi: string) => string
        cleanURL: (url: string) => string
        Internal: {
            getOpenAccessPDFURLs: (doi: string) => Promise<ZoteroResolver[]>
        }
    }

    Libraries: {
        isEditable: (libraryId: string) => boolean
    }

    ProgressWindow: {
        new(): ProgressWindow
    }
}

export {ZoteroItem, ZoteroObserver, IZotero, IZoteroPane, ProgressWindow, ZoteroResolver, IServices}
