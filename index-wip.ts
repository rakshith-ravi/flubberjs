import { readdirSync } from 'fs';
import { join } from 'path';
import { Router } from 'express';
import vhost from 'vhost';

var modules = new Map<string, FlubberModule>();

export let Middleware = Router();

export function setup(setupPath: string) {
	var tempModules = new Map<string, FlubberModule>();

	var folders = readdirSync(setupPath);
	folders.forEach(folder => {
		var module = require(join(setupPath, folder));
		if (module.init && module.init != null)
			module.init();
		if (tempModules.has(module.package)) {
			console.error(
				`Error: Module ${module.package} already exists`
			);
			return;
		}
		tempModules.set(module.package, module);
	});

	var satisfied = true;
	tempModules.forEach((mod: FlubberModule) => {
		mod.dependencies.forEach(dependency => {
			if (tempModules.has(dependency)) {
				return;
			}
			console.error(
				`Error: Dependencies not satisfied. Module "${dependency}", required by "${mod.package}" not found!`
			);
			satisfied = false;
		});
	});
	if (!satisfied) {
		console.error("Flubber not initialised");
		return false;
	}
	modules = tempModules;
	modules.forEach((value: FlubberModule) => {
		if (value.router != null) {
			value.domain.forEach(domain => {
				Middleware.use((req, res, next) => {
					vhost(domain, value.router)(req, res, next)
				});
			});
		}
	});
}

interface FlubberOutlet {

}

interface EmptyFunctionHandler {
	(): void
}

class FlubberModule {
	public name: string = "Flubber module";
	public readonly package: string;
	public domain: string[] = ["*"];
	public mainRoute: string = "/";
	public router: Router = null;	
	public initialize: EmptyFunctionHandler;
	public start: EmptyFunctionHandler;
	public dependencies: string[] = [];

	private _outlets: any[];

	constructor(packageName: string) {
		this.package = packageName;
	}
	
	outlet(name: string, cb: any): void {
		this._outlets.push({
			name: name,
			function: cb
		});
	}
	
	methods(name: string): () => Function {
		var retVal;
		modules.forEach((value: FlubberModule, _key) => {
			value._outlets.forEach(outlet => {
				if (outlet.name == name) {
					retVal = outlet.function;
				}
			});
		});
		return retVal;
	}
}

export function Module(packageName: string) {
	return new FlubberModule(packageName);
}