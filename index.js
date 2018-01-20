'use strict'

const AirPlay = require('airplay-protocol')

const createSetVolume = require('./lib/set-volume')

const ADDRESS = 'Apple-TV-3rd-floor.local'

const play = (audioUrl, cb) => {
	const device = new AirPlay(ADDRESS)

	const getInfo = () => {
		device.playbackInfo((err, res, playbackInfo) => {
			setTimeout(getInfo, 2000)

			if (err) return device.emit('error', err)
			device.emit('playbackInfo', playbackInfo)
		})
	}

	device.play(audioUrl, (err, res, body) => {
		if (err) return cb(err)

		// wat
		const a = device._agent
		const key = a.getName({host: device.host, port: device.port})
		const socket = (
			a.freeSockets[key] && a.freeSockets[key][0] ||
			a.sockets[key] && a.sockets[key][0]
		)
		const setVolume = createSetVolume(socket)
		setTimeout(() => {
			setVolume(-20, (err) => {
				if (err) console.error(err) // todo
			})
		}, 300)

		// const waitForPlay = () => {
		// 	device.playbackInfo((err, res, playbackInfo) => {
		// 		if (err) return cb(err)

		// 		if (playbackInfo && playbackInfo.readyToPlay) {
		// 			getInfo()
		// 			cb()
		// 		} else setTimeout(waitForPlay, 500)
		// 	})
		// }
		// waitForPlay()
	})

	return device
}

module.exports = play
