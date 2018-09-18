import { Router, NextFunction } from 'express';

export interface Module {
	name: string;
	package: string;
	domain: string;
	mainRoute: string;
	router: Router;
	outlet: Function;
	initialize: Function,
	start: Function,
	dependencies: string[],
	methods: Function
}

export function setup(dir: string);

export = NextFunction;