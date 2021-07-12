const path = require( 'path' );

module.exports = {

    // bundling mode
    mode: 'development',

    // entry files
    entry: './clientjs/main.ts',

    // output bundles (location)
    output: {
        path: path.resolve( __dirname, 'build/clientjs' ),
        filename: 'main.js',
    },

    // file resolutions
    resolve: {
        extensions: [ '.ts', '.js' ],
    },

    // loaders
    module: {
        rules: [
            {
                test: /\.tsx?/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ]
    }
};