#!/usr/bin/env node
'use strict'

const http = require('http')
// const create = require('./lib/send-rtsp-request')
const createSetVolume = require('./lib/set-volume')

const hostname = '192.168.3.11'
const port = 7000

const agent = new http.Agent({keepAlive: true, maxSockets: 1})

const populateSocket = (agent, cb) => {
	http.request({hostname, port, agent}, (res) => {
		res.on('data', () => {})
		res.once('end', () => {
			setTimeout(cb, 500)
		})
	}).end()
}

populateSocket(agent, () => {
	const key = agent.getName({
		host: hostname, // is this a bug in node? shoudn't it be `hostname`?
		// https://github.com/nodejs/node/blob/e1c29f2c529ffdbf9cf8f05d4ed27ccfcede2719/lib/_http_agent.js#L117
		port
	})
	const socket = agent.freeSockets[key][0]
	if (!socket) return console.error('no socket available') // todo

	const setVolume = createSetVolume(socket)
	setVolume(-11, (err) => {
		if (err) console.error(err)
	})
})
