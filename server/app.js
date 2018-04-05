const app = require('express')();
const server = require('./serverConfiguration.js')(app, process.argv[2]);
const pgp = require('pg-promise')();
const io = require('socket.io').listen(server);
const positionsJson = require('./latlong.json');
const coordinates = positionsJson.features[0].geometry.coordinates;
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
//
// app.enable('trust proxy');

server.listen(6060, () => console.log('Real-time map tracking app listening on port 6060!'));

const connection = {
    user: 'aqeynyrq',
    host: 'packy.db.elephantsql.com',
    database: 'aqeynyrq',
    password: 'QYp4irxpPwmB8Q3iWhgqWqIrJCTW1P5c',
    port: 5432,
};

const db = pgp(connection);

db.task('my-es7-task', async t => {
    try {
        await t.none(`CREATE OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
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
        $$ LANGUAGE plpgsql;`);

        const trigger = await t.any('select tgname from pg_trigger;');

        if (trigger.length === 0 || typeof trigger[0].tgname !== "string" || trigger[0].tgname !== "watched_table_trigger") {
            t.none(`CREATE TRIGGER watched_table_trigger AFTER INSERT ON positions
                        FOR EACH ROW EXECUTE PROCEDURE notify_trigger();`)
        }
    }
    catch(error) {
        // error;
        console.log(error);
    }
});


const dbNotifToClient = (sco) => {
    try {
        sco.client.on('notification', data => {
            console.log('position notification');
            io.sockets.emit('update', { message: data });
        });

        return sco.none('LISTEN $1~', 'watchers');
    }
    catch(error) {
        console.log(error);
    }
};

(async () => {

    const socketEvents = require('./socketEvents');
    const sco = await db.connect({direct: true});
    io.on('connect', (socket) => {
        console.log(`client n° ${io.engine.clientsCount}, id: ${socket.id} connected`);
        socketEvents(socket, db, coordinates);

    });
    dbNotifToClient(sco);
})();

// app.get('/request', async (req, res) => {
//     try {
//         const result = await db.any("SELECT id AS ID, pos AS position FROM positions");
//         console.log(result);
//         res.send(result);
//     }
//     catch (err) {
//         console.log(err);
//     }
// });