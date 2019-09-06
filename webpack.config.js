const path = require('path')

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.ts/,
                loader: 'babel-loader'
            }
        ]
    },
    devtool: 'source-map'
}
