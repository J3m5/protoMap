const app = require('express')();
const fs = require('fs');
const appRoot = process.cwd();
const options = {
    key: fs.readFileSync(appRoot + '/privkey.pem'),
    cert: fs.readFileSync(appRoot + '/fullchain.pem')
};

const server = require('https').createServer(options, app);
const pgp = require('pg-promise')();
const io = require('socket.io').listen(server);
const positionsJson = require('./latlong.json');
const coordinates = positionsJson.features[0].geometry.coordinates;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.enable('trust proxy');

server.listen(6060, () => console.log('Example app listening on port 6060!'));

const connection = {
    user: 'aqeynyrq',
    host: 'packy.db.elephantsql.com',
    database: 'aqeynyrq',
    password: 'QYp4irxpPwmB8Q3iWhgqWqIrJCTW1P5c',
    port: 5432,
};

const db = pgp(connection);

db.none(`CREATE OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
            DECLARE
                data json;
                notification json;
            BEGIN

                data = row_to_json(NEW);
                notification = json_build_object(
                  'table',TG_TABLE_NAME,
                  'action', TG_OP,
                  'data', data);
                PERFORM pg_notify('watchers', notification::text );
                RETURN NULL;
            END;
        $$ LANGUAGE plpgsql;`)
    .then(() => {
        // success;
        console.log('success')
    })
    .catch(error => {
        // error;
        console.log(error);
    });

db.any('select tgname from pg_trigger;')
    .then((data) => {
        // success;
        console.log(data);
        if (data.length === 0 || typeof data[0].tgname !== "string" ||  data[0].tgname !== "watched_table_trigger") {
            db.none(`CREATE TRIGGER watched_table_trigger AFTER INSERT ON positions
                        FOR EACH ROW EXECUTE PROCEDURE notify_trigger();`)
                .then(() => {
                    // success;
                    console.log('success')
                })
                .catch(error => {
                    // error;
                    console.log(error);
                });
        }
    })
    .catch(error => {
        // error;
        console.log(error);
    });


const dbNotifToClient = async () => {

    const sco = await db.connect({direct: true});
    const watch = (sco) => {
        io.on('connection', socket => {
            console.log(socket.id + 'connected');
            console.log("connected clients count : " + io.engine.clientsCount);
            sco.client.on('notification', data => {
                socket.emit('update', {message: data});
                // data.payload = 'my payload string'
            });
        });
        return sco.none('LISTEN $1~', 'watchers');
    };
};
    dbNotifToClient();

// db.connect({direct: true})
//     .then((sco) => {
//         io.on('connection', socket => {
//             console.log(socket.id + 'connected');
//             console.log("connected clients count : " + io.engine.clientsCount);
//             sco.client.on('notification', data => {
//                 socket.emit('update', { message: data });
//                 // data.payload = 'my payload string'
//             });
//         });
//         return sco.none('LISTEN $1~', 'watchers');
//     })
//     .catch(error => {
//         console.log('Error:', error);
//     });


app.get('/', (req, res) => res.send('Hello World!'));

app.get('/request', async (req, res) => {
    try {
        const result = await db.any("SELECT id AS ID, pos AS position FROM positions");
        console.log(result);
        res.send(result);
    }
    catch (err) {
        console.log(err);
    }
});

app.post('/delete_data', async (req, res) => {
    try {
        const result = await db.any("TRUNCATE TABLE positions RESTART IDENTITY;");
        console.log(result);
        res.send(result);
    }
    catch (err) {
        console.log(err);
    }
});


app.post('/startInsert', (req, res) => {
    let i = 0;
    console.log("Insertion start");
    let interval = setInterval(async function () {

        try {
            const result = await db.one('INSERT INTO positions(pos) VALUES($1) RETURNING id', ['{"lat": ' + coordinates[i][1] + ', "long": ' + coordinates[i][0] + '}']);
            ++i;
            if (i === 100) {
                clearInterval(interval);
                res.send("insert done");
                console.log("Insertion end");
            }
        }
        catch (err) {
            console.log(err);
        }
    }, 1000);
});
