# Zotero Nexus

Inspired by [Zotero Scihub](https://github.com/ethanwillis/zotero-scihub).

This is an add-on for [Zotero](https://www.zotero.org/) and [Juris-M](https://juris-m.github.io/) that enables automatic download of PDFs for items with a DOI.

# Quick Start Guide

#### Install

- Download the latest release (.xpi file) from the [Releases Page](https://github.com/aokellermann/zotero-nexus/releases)
  _Note_ If you're using Firefox as your browser, right-click the xpi and select "Save As..."
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
