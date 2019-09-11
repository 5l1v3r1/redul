'use strict'

let Reax = null

if (process.env.NODE_ENV === 'production') {
    Reax = require('./build/reax.production')
} else {
    Reax = require('./build/reax.development')
}

module.exports = Reax.default || Reax
