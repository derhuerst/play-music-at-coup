'use strict'

const esc = require('ansi-escapes')
const ansiDiffStream = require('ansi-diff-stream')
const windowSize = require('window-size')
const chalk = require('chalk')

const listenForKeys = require('./listen-for-keys')

const showUI = (device) => {
	const out = ansiDiffStream()
	out.pipe(process.stdout)

	const state = {}

	const beep = () => {
		process.stdout.write(esc.beep)
	}

	const onRawKey = (key) => {
		if (!state.readyToPlay) return beep()

		if (/^\d$/.test(key.raw)) {
			const newPosition = state.duration * parseInt(key.raw) / 10
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else beep()
		// todo
	}

	const onAction = (action) => {
		if (action === 'abort') {
			out.unpipe(process.stdout)
			stopListening()
			return
		}
		if (!state.readyToPlay) return beep()

		const srubStep = Math.sqrt(state.duration / 10)
		if (action === 'left') {
			if (state.position === 0) return beep()

			const newPosition = state.position - srubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (action === 'right') {
			if (state.position === state.duration) return beep()

			const newPosition = state.position + srubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (action === 'pause') {
			if (state.paused) {
				device.resume(() => {
					state.paused = false
					render()
				})
			} else {
				device.pause(() => {
					state.paused = true
					render()
				})
			}
		}
		// todo
	}

	const render = () => {
		if (!state.readyToPlay) return 'loading'
		const width = windowSize.get().width
		const curPos = Math.round(state.position / state.duration * width)

		// todo: what is readyToPlayMs?
		const res = [
			chalk.blue('='.repeat(curPos)),
			state.paused ? chalk.red('|') : chalk.green('|'),
			chalk.gray('-'.repeat(width - curPos - 2))
		]

		return res.join('')
	}

	device.on('playbackInfo', (playbackInfo) => {
		Object.assign(state, playbackInfo)
		out.write(render())
	})

	const stopListening = listenForKeys(process.stdin, onRawKey, onAction)
	process.stdout.write(esc.cursorHide)
	render()
}

module.exports = showUI