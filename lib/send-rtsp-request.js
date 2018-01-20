'use strict'

const rtsp = require('rtsp-stream')

const createSend = (socket) => {
	let cSeq = 1

	const decoder = new rtsp.Decoder()
	const encoder = new rtsp.Encoder()
	encoder.pipe(socket).pipe(decoder)

	const sendRtspRequest = (method, additionalHeaders, body, cb) => {
		const thisCSeq = cSeq++
		let done = false
		socket.ref()

		const stop = () => {
			done = true
			decoder.removeListener('response', onResponse)
			decoder.removeListener('error', onError)
			decoder.removeListener('end', onEnd)
			socket.unref()
		}

		const onResponse = (res) => {
			const h = res.headers
			if (!h.cseq || parseInt(h.cseq) !== thisCSeq || done) return null
			stop()
			cb(null, res)
		}
		decoder.on('response', onResponse)

		const onError = (err) => {
			if (done) return null
			stop()
			cb(err)
		}
		decoder.on('error', onError)

		const onEnd = () => {
			if (done) return null
			stop()
			cb(new Error('no response received'))
		}
		decoder.on('end', onEnd)

		const req = {
			method,
			headers: Object.assign({
				'Content-Type': 'text/parameters',
				// 'User-Agent': 'iTunes/10.6 (Macintosh; Intel Mac OS X 10.7.3) AppleWebKit/535.18.5',
				// 'Client-Instance': '56B29BB6CB904862',
				// 'DACP-ID': '56B29BB6CB904862'
			}, additionalHeaders, {
				CSeq: thisCSeq,
				'Content-Length': body.length
			}),
			body
		}
		console.error(req)
		encoder.request(req)
	}
	return sendRtspRequest
}

module.exports = createSend
