/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect } from 'chai'
import { spy, FakeXMLHttpRequest, fakeServer } from 'sinon'
// DOMParser is requited to support sinon fake xhr document parser
import { JSDOM } from 'jsdom'
globalThis.DOMParser = new JSDOM().window.DOMParser

import { Zotero, progressWindowSpy } from './zotero.mock'
import { collectionItem, itemWithoutDOI, regularItem1, DOIinExtraItem, DOIinUrlItem } from './zoteroItem.mock'
globalThis.Zotero = Zotero
// Since there is catch-all in the code which raises alerts
globalThis.alert = m => { throw new Error(m) }

import { Nexus } from '../content/nexus'
Zotero.Nexus = new Nexus()

describe('Nexus test', () => {
  describe('updateItems', () => {
    let attachmentSpy
    let server

    beforeEach(() => {
      attachmentSpy = spy(Zotero.Attachments, 'importFromURL')

      // Allows sinon to enable FakeXHR module, since xhr is not available otherwise
      globalThis.XMLHttpRequest = FakeXMLHttpRequest
      server = fakeServer.create({ respondImmediately: true })
      server.respondWith('GET', 'https://sci-hub.ru/10.1037/a0023781', [
        200, { 'Content-Type': 'text/html+xml' },
        '<html><body><iframe id="pdf" src="http://example.com/regular_item_1.pdf" /></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/10.1029/2018JA025877', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><iframe id="pdf" src="https://example.com/doi_in_extra_item.pdf?param=val#tag" /></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/10.1080/00224490902775827', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body><embed id="pdf" src="http://example.com/doi_in_url_item.pdf"></embed></body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/captcha', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body>Captcha is required</body></html>',
      ])
      server.respondWith('GET', 'https://sci-hub.ru/42.0/69', [
        200, { 'Content-Type': 'application/xml' },
        '<html><body>Please try to search again using DOI</body></html>',
      ])
      server.respondWith([
        200, { 'Content-Type': 'application/xml' },
        '   '])
    })

    afterEach(() => {
      attachmentSpy.restore()
      server.restore()
      progressWindowSpy.resetHistory()
    })

    it('does nothing if there is no items to update', async () => {
      await Zotero.Nexus.updateItems([])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('skips collection items', async () => {
      await Zotero.Nexus.updateItems([collectionItem])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('skips items without DOI', async () => {
      await Zotero.Nexus.updateItems([itemWithoutDOI])
      expect(attachmentSpy.notCalled).to.be.true
    })

    it('attaches PDFs to items it processes', async () => {
      await Zotero.Nexus.updateItems([regularItem1, DOIinExtraItem, DOIinUrlItem])

      expect(attachmentSpy.callCount).to.equals(3)

      expect(attachmentSpy.firstCall.args[0].url).to.equal('https://bafyb4iee27p2wdqsorvj7gquitwuti3sfeepdvx2p3feao2dqri37fm3yy.ipfs.dweb.link/10.1037%252Fa0023781.pdf')
      expect(attachmentSpy.firstCall.args[0].fileBaseName).to.equal('10.1037%252Fa0023781.pdf')
      expect(attachmentSpy.firstCall.args[0].title).to.equal('regularItemTitle1')

      // expect(attachmentSpy.secondCall.args[0].url).to.equal('https://example.com/doi_in_extra_item.pdf?param=val#tag')
      // expect(attachmentSpy.secondCall.args[0].fileBaseName).to.equal('doi_in_extra_item.pdf')
      // expect(attachmentSpy.secondCall.args[0].title).to.equal('DOIinExtraItemTitle')
      //
      // expect(attachmentSpy.thirdCall.args[0].url).to.equal('https://example.com/doi_in_url_item.pdf')
      // expect(attachmentSpy.thirdCall.args[0].fileBaseName).to.equal('doi_in_url_item.pdf')
      // expect(attachmentSpy.thirdCall.args[0].title).to.equal('DOIinUrlItemTitle')
    })

    // it('unavailable item shows popup and continues execution', async () => {
    //   // regularItem2 has no PDF available
    //   await Zotero.Nexus.updateItems([regularItem2, regularItem1])
    //
    //   expect(progressWindowSpy.calledWith('Error')).to.be.true
    //   expect(attachmentSpy.calledOnce).to.be.true
    // })
    //
    // it('unavailable item with rich error message shows popup and continues execution', async () => {
    //   // unavailableItem has no PDF available, but reports different error
    //   await Zotero.Nexus.updateItems([unavailableItem, regularItem1])
    //
    //   expect(progressWindowSpy.calledWith('Error')).to.be.true
    //   expect(attachmentSpy.calledOnce).to.be.true
    // })
  })
})
