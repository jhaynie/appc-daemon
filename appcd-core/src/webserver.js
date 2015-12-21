import { EventEmitter } from 'events';
import helmet from 'koa-helmet';
import Koa from 'koa';
import path from 'path';
import send from 'koa-send';
import { Server as WebSocketServer } from 'ws';

export default class WebServer extends EventEmitter {
	constructor(opts = {}) {
		super();

		this.hostname = opts.hostname || '127.0.0.1';
		this.port     = opts.port || 1732;
		this.server   = null;

		// init the Koa app with helmet and a simple request logger
		this.app = new Koa()
			.use(helmet())
			.use((ctx, next) => {
				const start = new Date;
				return next().then(() => {
					console.info('%s %s %s %s',
						ctx.method,
						ctx.url,
						console.chalk[ctx.status < 400 ? 'green' : ctx.status < 500 ? 'yellow' : 'red'](ctx.status),
						console.chalk.cyan((new Date - start) + 'ms')
					);
				});
			});
	}

	use(middleware) {
		this.app.use(middleware);
		return this;
	}

	listen() {
		// make sure that if there is a previous websocket server, it's shutdown to free up the port
		this.close();

		// static file serving middleware
		this.app.use(async (ctx) => {
			await send(ctx, ctx.path, { root: path.resolve(__dirname, '..', 'public') });
		});

		// create the websocket server and start listening
		this.server = new WebSocketServer({
			server: this.app.listen(this.port, this.hostname, () => {
				console.info('Server listening on port ' + console.chalk.cyan(this.port));
			})
		});

		this.server.on('connection', ws => {
			ws.on('message', message => {
				let done = false;

				try {
					const req = JSON.parse(message);
					if (req && typeof req === 'object' && req.version && req.url && req.id) {
						this.emit('dispatch', req, (payload) => {
							if (!done) {
								done = true;
								ws.send(JSON.stringify({
									id: req.id,
									data: payload
								}));
							}
						});
					}
				} catch (e) {
					console.error('Failed to parse request:', e);
				}

				ws.on('close', () => {
					// client hung up
					done = true;
				});
			});
		});

		return this;
	}

	close() {
		if (this.server) {
			this.server.close();
			this.server = null;
		}

		return this;
	}
}

		// this.server.on('connection', ws => {
		// 	var id = setInterval(function() {
		// 		ws.send(JSON.stringify(process.memoryUsage()), function() { /* ignore errors */ });
		// 	}, 500);
		//
		// 	ws.on('message', function incoming(message) {
		// 	    console.log('received: %s', message);
		// 	  });
		//
		// 	console.log('started client interval');
		//
		// 	ws.on('close', function() {
		// 		console.log('stopping client interval');
		// 		clearInterval(id);
		// 	});
		// });