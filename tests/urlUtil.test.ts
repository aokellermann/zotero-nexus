/* eslint-disable @typescript-eslint/no-unused-expressions */
import { UrlUtil } from '../content/urlUtil'
import { expect } from 'chai'

describe('UrlUtil test', () => {
  describe('extractFileNameFromUrl', () => {
    it('returns the last part of the path', () => {
      const url = new URL('https://example.com/long/ass/path/filename.pdf?param=val#section')
      const filename = UrlUtil.extractFileNameFromUrl(url)
      expect(filename).to.equal('filename.pdf')
    })

    it('is undefined if no filename is present', () => {
      const url = new URL('https://example.com')
      const filename = UrlUtil.extractFileNameFromUrl(url)
      expect(filename).to.be.null
    })
  })
})
