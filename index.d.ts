import { Router, NextFunction, Request, Response } from 'express';

export interface Module {
	name: string;
	package: string;
	domain: string[];
	mainRoute: string;
	router: Router;
	outlet: Function;
	initialize: Function,
	start: Function,
	dependencies: string[],
	methods: Function
}

export function Module(name: string): Module;

export function setup(dir: string): void;

export function Middleware(req: Request, res: Response, next: NextFunction): void;