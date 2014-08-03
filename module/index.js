'use strict';
var fs = require('fs')
  , genBase = require('../genBase')
  , path = require('path')
  , utils = require('../utils');


var Generator = module.exports = genBase.extend();

Generator.prototype.initialize = function initialize() {
  this.module = this.name;
};

Generator.prototype.writing = function writing() {
  this.context = this.getConfig();

  // if moduleName ends with a slash remove it
  if (this.module.charAt(this.module.length-1) === '/' || this.module.charAt(this.module.length-1) === '\\') {
    this.module = this.module.slice(0, this.module.length-1);
  }

  this.context.moduleName = path.basename(this.module);
  this.context.hyphenModule = utils.hyphenName(this.context.moduleName);
  this.context.upperModule = utils.upperCamel(this.context.moduleName);
  this.context.parentModuleName = null;
  this.context.templateUrl = path.join(this.module).replace(/\\/g, '/');

  // create new module directory
  this.mkdir(path.join('app', this.module));

  var filePath, file;

  // check if path and moduleName are the same
  // if yes - get root app.js to prepare adding dep
  // else - get parent app.js to prepare adding dep
  if (this.context.moduleName === this.module) {
    filePath = path.join(this.config.path, '../app/app.js');
  } else {
    var parentDir = path.resolve(path.join('app', this.module), '..');

    // for templating to create a parent.child module name
    this.context.parentModuleName = path.basename(parentDir);

    filePath = path.join(parentDir, this.context.parentModuleName + '.js');
  }

  file = fs.readFileSync(filePath, 'utf8');

  // save modifications
  var depName = (this.context.parentModuleName) ? this.context.parentModuleName + '.' : '';
  depName += this.context.moduleName;
  fs.writeFileSync(filePath, utils.addDependency(file, depName));

  // create app.js
  this.template('_app.js', path.join('app', this.module, this.context.moduleName + '.js'), this.context);


  // config for e2e test templates
  var config = {
    hyphenName: utils.hyphenName(this.context.moduleName),
    humanName: utils.humanName(this.context.moduleName),
    lowerCamel: utils.lowerCamel(this.context.moduleName),
    upperCamel: utils.upperCamel(this.context.moduleName),
    ctrlName: utils.ctrlName(this.context.moduleName)
  };

  // e2e testing
  // create page object model
  this.sourceRoot(path.join(__dirname, '../route/templates/'));
  this.template('page.po.' + this.context.testScript,
    path.join('e2e', config.hyphenName, config.hyphenName + '.po.' + this.context.testScript), config);
  // create test
  this.template('page_test.' + this.context.testScript,
    path.join('e2e', config.hyphenName, config.hyphenName + '_test.' + this.context.testScript), config);
};

Generator.prototype.end = function end() {
  this.invoke('ng-poly:controller', {
    args: [this.context.moduleName],
    options: {
      options: {
        module: this.module
      }
    }
  });
  this.invoke('ng-poly:view', {
    args: [this.context.moduleName],
    options: {
      options: {
        module: this.module
      }
    }
  });
};