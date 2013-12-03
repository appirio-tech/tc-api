chai   = require 'chai'
assets = require '../coffee-errors'

expect = chai.expect

describe 'coffee-errors', ->
  it 'patches the error', ->
    try
      throw new Error 'Hello error'
    catch err
      expect(err.stack).to.contain 'coffee-errors.spec.coffee:9:17'

