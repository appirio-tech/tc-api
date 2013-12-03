fs   = require 'fs'
path = require 'path'

try
  helpers = require 'iced-coffee-script/lib/coffee-script/helpers'
  coffee  = require 'iced-coffee-script'
catch e
  helpers = require 'coffee-script/lib/coffee-script/helpers'
  coffee  = require 'coffee-script'

throw new Error '`coffee-errors` expects `[iced-]coffee-script@~1.6.2`' if parseInt(coffee.VERSION.replace /\D+/g, '') < 162

compile    = coffee.compile
patched    = false
extensions = ['.coffee', '.litcoffee', '.coffee.md']

# Map of filenames -> sourceMap object.
sourceMaps = {}

patchStackTrace = ->
  return if patched
  patched = true

  oldPrepareStackTrack = Error.prepareStackTrace

  # (Assigning to a property of the Module object in the normal module cache is
  # unsuitable, because node deletes those objects from the cache if an
  # exception is thrown in the module body.)

  Error.prepareStackTrace = (err, stack) ->
    try
      sourceFiles = {}

      getSourceMapping = (filename, line, column) ->
        sourceMap = getSourceMap filename
        answer = sourceMap.sourceLocation [line - 1, column - 1] if sourceMap
        if answer then [answer[0] + 1, answer[1] + 1] else null

      frames = for frame in stack
        break if frame.getFunction() is coffee.run
        "  at #{formatSourcePosition frame, getSourceMapping}"

      "#{err.name}: #{err.message ? ''}\n#{frames.join '\n'}\n"
    catch e
      Error.prepareStackTrace = oldPrepareStackTrack
      "`coffee-errors` failed during stack parsing, falling back onto the previous parser. " + err.stack
      err.stack

# Based on http://v8.googlecode.com/svn/branches/bleeding_edge/src/messages.js
# Modified to handle sourceMap
formatSourcePosition = (frame, getSourceMapping) ->
  fileName = undefined
  fileLocation = ''

  if frame.isNative()
    fileLocation = "native"
  else
    if frame.isEval()
      fileName = frame.getScriptNameOrSourceURL()
      fileLocation = "#{frame.getEvalOrigin()}, " unless fileName
    else
      fileName = frame.getFileName()

    fileName or= "<anonymous>"

    line = frame.getLineNumber()
    column = frame.getColumnNumber()

    # Check for a sourceMap position
    source = getSourceMapping fileName, line, column

    fileLocation =
      if source
        "#{fileName}:#{source[0]}:#{source[1]}" #, <js>:#{line}:#{column}"
      else
        "#{fileName}:#{line}:#{column}"

  functionName = frame.getFunctionName()
  isConstructor = frame.isConstructor()
  isMethodCall = not (frame.isToplevel() or isConstructor)

  if isMethodCall
    methodName = frame.getMethodName()
    typeName = frame.getTypeName()

    if functionName
      tp = as = ''
      if typeName and functionName.indexOf typeName
        tp = "#{typeName}."
      if methodName and functionName.indexOf(".#{methodName}") isnt functionName.length - methodName.length - 1
        as = " [as #{methodName}]"

      "#{tp}#{functionName}#{as} (#{fileLocation})"
    else
      "#{typeName}.#{methodName or '<anonymous>'} (#{fileLocation})"
  else if isConstructor
    "new #{functionName or '<anonymous>'} (#{fileLocation})"
  else if functionName
    "#{functionName} (#{fileLocation})"
  else
    fileLocation

compileFile = (filename, sourceMap) ->
  raw = fs.readFileSync filename, 'utf8'
  stripped = if raw.charCodeAt(0) is 0xFEFF then raw.substring 1 else raw

  try
    answer = compile(stripped, {filename, sourceMap, literate: helpers.isLiterate filename})
  catch err
    # As the filename and code of a dynamically loaded file will be different
    # from the original file compiled with CoffeeScript.run, add that
    # information to error so it can be pretty-printed later.
    err.filename = filename
    err.code = stripped
    throw err

  answer

getSourceMap = (filename) ->
  return sourceMaps[filename] if sourceMaps[filename]
  return unless path.extname(filename) in extensions
  answer = compileFile filename, true
  sourceMaps[filename] = answer.sourceMap

# Load and run a CoffeeScript file for Node, stripping any `BOM`s.
loadFile = (module, filename) ->
  answer = compileFile filename, false
  module._compile answer, filename

# If the installed version of Node supports `require.extensions`, register
# CoffeeScript as an extension.
if require.extensions
  for ext in extensions
    require.extensions[ext] = loadFile

patchStackTrace()
