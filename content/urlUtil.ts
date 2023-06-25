export abstract class UrlUtil {
  public static extractFileNameFromUrl(url: URL): string | null {
    // Keeps the last token of the pathname supposing it is filename, eg
    // https://example.com/path/<filename.pdf>?params
    return url.pathname.split('/').pop() || null
  }
}
