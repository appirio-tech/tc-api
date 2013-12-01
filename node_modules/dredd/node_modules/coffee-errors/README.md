# coffee-errors

Patches error stack to display correct line numbers. CoffeeScript has built in support for this, but it only
works when the script is executed through the `coffee` command. If you are running mocha, node-dev, jasmine
or any other method, the functionality isn't on.

This is a pretty much straight copy of the original source, except it doesn't compile the source maps until
necessary therefore speeding up the initial bootup process.

The package reuses `coffee-script` or `iced-coffee-script` in your module.

## Installation

    npm install coffee-errors

## Usage

    require 'coffee-errors'

## Results

    Error: Hello error
      at Context.<anonymous> (/coffee-errors/test/coffee-errors.spec.coffee:9:17)
      at Test.Runnable.run (/coffee-errors/node_modules/mocha/lib/runnable.js:213:32)
      at Runner.runTest (/coffee-errors/node_modules/mocha/lib/runner.js:351:10)
      at /coffee-errors/node_modules/mocha/lib/runner.js:397:12
      at next (/coffee-errors/node_modules/mocha/lib/runner.js:277:14)
      at /coffee-errors/node_modules/mocha/lib/runner.js:286:7
      at next (/coffee-errors/node_modules/mocha/lib/runner.js:234:23)
      at Object._onImmediate (/coffee-errors/node_modules/mocha/lib/runner.js:254:5)
      at processImmediate [as _immediateCallback] (timers.js:317:15)