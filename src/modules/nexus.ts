import UrlResolver = _ZoteroTypes.Attachments.UrlResolver;
import { config } from "../../package.json";
import { apply } from "jspath";

export class Nexus {
  static load() {
    Zotero.Attachments.getPDFResolvers = (item, methods, automatic) => {
      if (!methods) {
        methods = ["doi", "url", "oa", "custom"];
      }

      const useDOI = methods.includes("doi");
      const useURL = methods.includes("url");
      const useOA = methods.includes("oa");
      const useCustom = methods.includes("custom");

      const resolvers: any[] = [];
      let doi = item.getField("DOI") || item.getExtraField("DOI");
      doi = Zotero.Utilities.cleanDOI(doi) || doi;

      if (useDOI && doi) {
        doi = Zotero.Utilities.cleanDOI(doi) ?? doi;
        if (doi) {
          resolvers.push({
            pageURL: `https://doi.org/${doi}`,
            accessMethod: "doi"
          });
        }
      }

      if (useURL) {
        let url = item.getField("url");
        if (url) {
          url = Zotero.Utilities.cleanURL(url);
          if (url) {
            resolvers.push({
              pageURL: url,
              accessMethod: "url"
            });
          }
        }
      }

      if (useOA && doi) {
        resolvers.push(async () => {
          const urls = Zotero.Utilities.Internal.getOpenAccessPDFURLs(doi);
          return urls.map(o => ({
            url: o.url,
            pageURL: o.pageURL,
            articleVersion: o.version,
            accessMethod: "oa"
          } as UrlResolver));
        });
      }

      if (useCustom && doi) {
        let customResolvers;
        try {
          customResolvers = Zotero.Prefs.get("findPDFs.resolvers") as string;
          if (customResolvers) {
            customResolvers = JSON.parse(customResolvers);
          }
        } catch (e) {
          Zotero.debug("Error parsing custom PDF resolvers", 2);
          Zotero.debug(e, 2);
        }

        if (customResolvers) {
          // Handle single object instead of array
          if (!Array.isArray(customResolvers) && customResolvers.method) {
            customResolvers = [customResolvers];
          }
          if (Array.isArray(customResolvers)) {
            const setting = `extensions.zotero.${config.addonRef}.automatic-pdf-download`;
            if (Zotero.Prefs.get(setting) === undefined) {
              Zotero.Prefs.set(setting, true);
            }

            customResolvers.push(
              {
                name: "Nexus",
                method: "GET",
                url: "https://hub.libstc.cc/{doi}.pdf",
                mode: "pdf",
                selector: "#pdf",
                attribute: "src",
                automatic: Zotero.Prefs.get(setting) as boolean,
                timeout: 30000
              });
            // Only include resolvers that have opted into automatic processing
            if (automatic) {
              customResolvers = customResolvers.filter(r => r.automatic);
            }

            for (const resolver of customResolvers) {
              try {
                const {
                  name,
                  method,
                  mode,
                  selector,
                  timeout,

                  // HTML
                  attribute,
                  index,

                  // JSON
                  mappings
                } = resolver;
                let { url } = resolver;
                if (!name) {
                  throw new Error("'name' not provided");
                }
                if (!["GET", "POST"].includes(method.toUpperCase())) {
                  throw new Error("'method' must be 'GET' or 'POST'");
                }
                if (!url) {
                  throw new Error("'url' not provided");
                }
                if (!url.includes("{doi}")) {
                  throw new Error("'url' must include '{doi}'");
                }
                if (!["html", "json", "pdf"].includes(mode.toLowerCase())) {
                  throw new Error("'mode' must be 'html' or 'json'");
                }
                if (!selector && mode !== "pdf") {
                  throw new Error("'selector' not provided");
                }

                url = url.replace(/\{doi}/, doi);

                resolvers.push(async () => {
                  Zotero.debug(`Looking for PDFs for ${doi} via ${name}`);

                  const req = await Zotero.HTTP.request(
                    method.toUpperCase(),
                    url,
                    {
                      responseType: mode === "json" ? "json" : "document",
                      timeout
                    }
                  );

                  if (mode === "pdf") {
                    return [{
                      accessMethod: name,
                      url,
                      referrer: url
                    }];
                  } else if (mode === "html") {
                    const doc = req.response;
                    const elem = index
                      ? doc.querySelectorAll(selector).item(index)
                      : doc.querySelector(selector);
                    if (!elem) return [];
                    let val = attribute
                      ? elem.getAttribute(attribute)
                      : elem.textContent;
                    if (!val) return [];

                    // Handle relative paths
                    val = Services.io.newURI(
                      val, null, Services.io.newURI(url)
                    ).spec;

                    return [{
                      accessMethod: name,
                      url: val,
                      referrer: url
                    }];
                  } else if (mode === "json") {
                    const json = req.response;
                    let results = apply(selector, json);
                    // If mappings for 'url' and 'pageURL' are supplied,
                    // extract properties from each object in the array
                    if (mappings) {
                      const mappedResults: any[] = [];
                      for (const result of results) {
                        if (typeof result != "object") continue;
                        const mappedResult: any = {};
                        for (const field in mappings) {
                          if (!["url", "pageURL"].includes(field)) continue;

                          if (result[mappings[field]]) {
                            mappedResult[field] = result[mappings[field]];
                          }
                        }
                        mappedResults.push(mappedResult);
                      }
                      results = mappedResults;
                    } else {
                      results = results
                        .filter(x => typeof x == "string")
                        .map(x => ({ url: x }));
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return results.map(o => Object.assign(
                      o,
                      {
                        accessMethod: name,
                        referrer: url
                      } as UrlResolver
                    ));
                  }
                });
              } catch (e) {
                Zotero.debug("Error parsing PDF resolver", 2);
                Zotero.debug(e, 2);
                Zotero.debug(resolver, 2);
              }
            }
          }
        }
      }

      return resolvers;
    };
  }
}
