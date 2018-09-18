var fs = require('fs');
var path = require('path');
var HashMap = require('hashmap');
var express = require('express');
var vhost = require('vhost');

var modules = new HashMap();

var flubber = {};

flubber.Middleware = express.Router();

flubber.setup = (setupPath) => {
	var tempModules = new HashMap();

	var folders = fs.readdirSync(setupPath);
	folders.forEach(folder => {
		var module = require(path.join(setupPath, folder));
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
	tempModules.values().forEach(mod => {
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
	modules.forEach((value, key) => {
		if(value.router != null) {
			flubber.use(vhost(value.domain, value.router));
		}
	});
}

flubber.Module = (packageName) => {
	return {
		name: "Flubber module",
		package: packageName,
		domain: "*",
		mainRoute: "/",
		router: null,
		_outlets: [],
		outlet: (name, cb) => {
			 _outlets.push({
				name: name,
				function: cb
			});
		},
		initialize: undefined,
		start: undefined,
		dependencies: [],
		methods: (name) => {
			var retVal;
			modules.forEach((value, key) => {
				value._outlets.forEach(outlet => {
					if(outlet.name == name) {
						retVal = outlet.function;
					}
				});
			});
			return retVal;
		}
	};
}

module.exports = flubber;
