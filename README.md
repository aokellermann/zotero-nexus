# Zotero Nexus

Inspired by [Zotero Scihub](https://github.com/ethanwillis/zotero-scihub).

This is an add-on for [Zotero](https://www.zotero.org/) and [Juris-M](https://juris-m.github.io/) that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install

This plugin supports both the stable version (6) and the beta version (7) of Zotero! Plugin installation files don't
work for both, so there are separate downloads depending on your Zotero version.
If you are perusing the releases page, `0.x.x` releases are for Zotero 6 and `1.x.x` releases are for Zotero 7.

Installation instructions:
- If you are using Zotero 6 (stable version), right click [this link](https://github.com/aokellermann/zotero-nexus/releases/download/0.1.0-beta.3/zotero-nexus-0.1.0-beta.3.xpi), click "Save Link As" and save to your computer.
- If you are using Zotero 7 (beta version), right click [this link](https://github.com/aokellermann/zotero-nexus/releases/download/1.0.0-beta.0/zotero-nexus-1.0.0-beta.0.xpi), click "Save Link As" and save to your computer.
- In Zotero click "Tools" in the top menu bar and then click "Addons"
- Go to the Extensions page and then click the gear icon in the top right.
- Select Install Add-on from file.
- Browse to where you downloaded the .xpi file and select it.

#### Usage

This plugin hooks into Zotero's built-in PDF resolver by looking up papers by the DOI field on items.
Zotero will first check for open-access versions of the PDF, and will try Nexus last. Since it tries
many different sources before trying Nexus, it may take some time to complete the download.

## Building

1. Pre-requisite is to have [node.js](https://nodejs.org) installed
2. Install dependencies `npm install`
3. Build `npm run build`

## Disclaimer

Use this code at your own peril. No warranties are provided. Keep the laws of your locality in mind!
