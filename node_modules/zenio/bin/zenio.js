#!/usr/bin/env node

const zenio = require('../lib/zenio')
const url = process.argv[2]

/**
 * zenio junyi.me
 */
zenio.get(url).then(console.log, console.error)

