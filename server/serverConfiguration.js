const fs = require('fs');

const serverConf = (app, arg)=> {
    if (arg === 'dev') {
       return require('http').createServer(app);
    } else if (arg === 'prod'){
        const appRoot = process.cwd();
        const options = {
            key: fs.readFileSync(appRoot + '/privkey.pem'),
            cert: fs.readFileSync(appRoot + '/fullchain.pem')
        };
        return require('https').createServer(options, app);
    } else {
        throw new Error("You must give 'dev' or 'prod' as parameter.")
    }
};

module.exports = serverConf;