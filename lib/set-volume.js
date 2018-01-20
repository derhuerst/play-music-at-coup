#!/usr/bin/env node
'use strict'

const create = require('./send-rtsp-request')

const createSetVolume = (socket) => {
	const sendRtspRequest = create(socket)

	const setVolume = (volume, cb) => {
		sendRtspRequest('SET_PARAMETER', {}, 'volume: ' + volume, (err, res) => {
			if (err) cb(err)
			else if (res.statusCode < 200 || res.statusCode >= 300) {
				const err = new Error(res.statusMessage)
				err.statusCode = res.statusCode
				cb(err)
			} else cb()
		})
	}
	return setVolume
}

module.exports = createSetVolume
