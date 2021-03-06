const ServiceDispatcher = require('appcd-dispatcher').ServiceDispatcher;
const uuid = require('uuid');

class TimeService extends ServiceDispatcher {
	onCall(ctx) {
		ctx.response = new Date().toISOString();
	}

	onSubscribe({ publish }) {
		console.log('Starting interval');
		this.timer = setInterval(() => {
			publish({
				time: new Date().toISOString()
			});
		}, 1000);
	}

	onUnsubscribe() {
		console.log('Stopping interval');
		clearInterval(this.timer);
	}
}

function sleep() {
	return new Promise(resolve => setTimeout(resolve, 1000));
}

module.exports = {
	activate() {
		appcd.register('/reverse', ctx => {
			console.log('Reversing string: %s', ctx.request.data.str);
			ctx.response = ctx.request.data.str.split('').reverse().join('');
		});

		appcd.register('/time', new TimeService());

		// appcd.register('/uuid', ctx => {
		// 	const uuids = [ uuid.v4(), uuid.v4(), uuid.v4() ];
		// 	return uuids.reduce((p, v) => {
		// 		ctx.response.write({ uuid: uuid.v4() });
		// 		return p.then(() => sleep());
		// 	}, Promise.resolve());
		// });
		//
		// appcd.register('/friend-time', ctx => {
		// 	return appcd.call(`/${friend}/1.0.0/time`)
		// 		.then(({ response }) => {
		// 			ctx.response = response;
		// 		});
		// });
	}
};
