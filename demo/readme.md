# PhaserLE Alpha

PhaserLE is a level editor available on the desktop for Linux, Mac OSX and Windows operating systems that increases the productivity of game developers.

## Installing

### Node.js and Grunt

You will need to first install [Node.js](https://nodejs.org/download/) and the grunt-cli: `npm install -g grunt-cli`.

## Setup Your Project

Download and unpack The Phaser Level Editor. Next, inside the project, you need to install the project's various NPM dependencies:

    npm install

And you should now be ready to spin up a development build of your new project:

    grunt

Using the default settings, you can access the editor on [http://localhost:3020/editor/](http://localhost:3020/editor/)

## Developing

Your first port of call will likely be to customise the properties found in `package.json` and `src/js/game/properties.js`.

All of the files required to run the game will live in the `src` folder, this will include any JavaScript, images, HTML ([Jade](http://jade-lang.com/)), and CSS ([Stylus](http://learnboost.github.io/stylus/)). When the default grunt task is invoked, these files are compiled to a `build` directory.

Files in the `build` directory will always be generated and excluded from Git by the `.gitignore`, as such these will removed without warning and should generally not be edited.

## Recommendations

* Use relative file paths for any assets loaded by your HTML or JavaScript. This will negate any potential path issues when the game is later uploaded to a webserver.
* If you intend to store development assets (i.e PSD's, Texture Packer files, etc) inside your project, store them outside of the `src` directory to avoid bloating your builds with them.
* Borwserify is crazy powerful. I'm not going to quote Spiderman, but you should definitely check out [Substack's Browserify Handbook](https://github.com/substack/browserify-handbook).
* Linting is disabled by default, if you'd like to enforce it for production builds update the `.jshintrc` with rules for your coding style and remove the comment block from jshint directive in the gruntfile's build task.

## Updating or Adding Libraries

The project comes with an unminified version of Phaser with arcade physics, this can be replaced if you require updates or one of the alternate physics engines.

When adding new libraries that aren't CommonJS compatible, you'll have to update the [Browserify Shim configuration](https://github.com/thlorenz/browserify-shim#3-provide-browserify-shim-config).

## Coding Style and Linting

The project follows [Ben Gourley's JavaScript Style Guide](https://github.com/bengourley/js-style-guide).
