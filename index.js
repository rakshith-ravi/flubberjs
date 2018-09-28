var fs = require('fs');
var path = require('path');
var express = require('express');
var vhost = require('vhost');

var modules = new Map();

var flubber = {};

flubber.Middleware = express.Router();

flubber.setup = (setupPath) => {
	var tempModules = new Map();

	var folders = fs.readdirSync(setupPath);
	folders.forEach(folder => {
		var module = require(path.join(setupPath, folder));

		if(module == undefined)
			return;
		// Account for ES5 Modules
		module = module.default || module;

		if(module.init && module.init != null)
			module.init();
		
		if(tempModules.has(module.package)) {
			console.error(
				`Error: Module ${module.package} already exists`
			);
			return;
		}
		tempModules.set(module.package, module);
	});

	var satisfied = true;
	tempModules.forEach(mod => {
		mod.dependencies.forEach(dependency => {
			if(tempModules.has(dependency)) {
				return;
			}
			console.error(
				`Error: Dependencies not satisfied. Module "${dependency}", required by "${mod.package}" not found!`
			);
			satisfied = false;
		});
	});
	if(!satisfied) {
		console.error("Flubber not initialised");
		return false;
	}
	modules = tempModules;
	modules.forEach(value => {
		if(value.router && value.router != null && value.domain) {
			value.domain.forEach(domain => {
				flubber.Middleware.use(vhost(domain, value.router));
			});
		}
	});
}

class FlubberModule {
	constructor(packageName) {
		this.name = "Flubber module";
		this.package = packageName;
		this.domain = ["*"];
		this.mainRoute = "/";
		this.router = null;
		this.initialize;
		this.start;
		this.dependencies = [];
		this._outlets = [];
	}
	
	outlet(name, cb) {
		this._outlets.push({
			name: name,
			function: cb
		});
	}
	
	methods(name) {
		var retVal;
		modules.forEach((value) => {
			value._outlets.forEach(outlet => {
				if (outlet.name == name) {
					retVal = outlet.function;
				}
			});
		});
		return retVal;
	}
}

flubber.Module = (packageName) => {
	return new FlubberModule(packageName);
}

module.exports = flubber;
