'use strict'

const esc = require('ansi-escapes')
const ansiDiffStream = require('ansi-diff-stream')
const windowSize = require('window-size')
const chalk = require('chalk')
const flattenRanges = require('flatten-overlapping-ranges')

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

		const scrubStep = Math.sqrt(state.duration / 5)
		if (action === 'scrub-left') {
			if (state.position === 0) return beep()

			const newPosition = state.position - scrubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (action === 'scrub-right') {
			if (state.position === state.duration) return beep()

			const newPosition = state.position + scrubStep
			device.scrub(newPosition, () => {
				state.position = newPosition
				render()
			})
		} else if (action === 'pause') {
			if (state.rate === 0) {
				device.resume()
			} else {
				device.pause(() => {
					state.rate = 0
					render()
				})
			}
		}
		// todo
	}

	const render = () => {
		if (!state.readyToPlay) return out.write('loading')
		const width = windowSize.get().width - 3
		const res = [
			!state.playbackLikelyToKeepUp ? '😢' : '😊',
			' '
		]
		const curPos = Math.round(state.position / state.duration * width)
		const isPlaying = state.rate === 0

		const ranges = []
		if (Array.isArray(state.loadedTimeRanges)) {
			let i = 0
			for (let range of state.loadedTimeRanges) {
				ranges.push([
					'buffering',
					Math.round(range.start / state.duration * width),
					Math.round(range.duration / state.duration * width)
				])
			}
		}
		if (curPos > 0) ranges.push(['played', 0, curPos])
		ranges.push(['cursor', curPos, 1])

		const bars = flattenRanges(ranges)
		for (let [l, states] of bars) {
			if (states.includes('cursor')) {
				res.push(isPlaying ? chalk.red('●') : chalk.green('●'))
			} else if (states.includes('played')) {
				const s = '='.repeat(l)
				res.push(isPlaying ? chalk.red(s) : chalk.green(s))
			} else if (states.includes('buffering')) {
				res.push(chalk.gray('-'.repeat(l)))
			}
		}
		// todo: what is readyToPlayMs?

		out.write(res.join(''))
	}

	device.on('playbackInfo', (playbackInfo) => {
		Object.assign(state, playbackInfo)
		render()
	})

	const stopListening = listenForKeys(process.stdin, onRawKey, onAction)
	process.stdout.write(esc.cursorHide)
	setImmediate(render)
}

module.exports = showUI
