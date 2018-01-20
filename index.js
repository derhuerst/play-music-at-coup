'use strict'

const AirPlay = require('airplay-protocol')

const ADDRESS = 'Apple-TV-3rd-floor.local'

const play = (audioUrl, cb) => {
	const device = new AirPlay(ADDRESS)

	const getInfo = () => {
		device.playbackInfo((err, res, playbackInfo) => {
			setTimeout(getInfo, 100)

			if (err) return device.emit('error', err)
			device.emit('playbackInfo', playbackInfo)
		})
	}

	device.play(audioUrl, (err) => {
		if (err) return cb(err)

		const waitForPlay = () => {
			device.playbackInfo((err, res, playbackInfo) => {
				if (err) return cb(err)

				if (playbackInfo && playbackInfo.readyToPlay) {
					getInfo()
					cb()
				} else setTimeout(waitForPlay, 500)
			})
		}
		waitForPlay()
	})

	return device
}

module.exports = play
