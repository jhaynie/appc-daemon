import { createInstanceWithDefaults, Format, StdioStream } from 'appcd-logger';

const instance = createInstanceWithDefaults()
	.snoop()
	.config({
		maxBufferSize: 250,
		minBrightness: 80,
		maxBrightness: 210,
		theme: 'detailed'
	})
	.enable(process.env.SNOOPLOGG || process.env.DEBUG);

export default instance;

export { StdioStream };

export function logcat(stream) {
	const formatter = new Format();
	instance.pipe(formatter, { flush: true });
	formatter.pipe(stream);
}
