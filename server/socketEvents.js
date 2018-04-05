const socketEvents = async (socket, db, coordinates) => {

    const insert = (() => {
        let i = 0;
        let intervalId = 0;

        const start = (db, coordinates) => {
            console.log(!intervalId);
            intervalId =  !intervalId && i <= 100 ? setInterval( async () => {

                await db.one('INSERT INTO positions(pos) VALUES($1) RETURNING id',
                    ['{"lat": ' + coordinates[i][1] + ', "long": ' + coordinates[i][0] + '}']);
                ++i;

                if (i === 100) {
                    stop();
                }
            }, 1000) : intervalId;

        };

        const stop = () => {
            clearInterval(intervalId);
            intervalId = false;
        };

        const reset = () => {
            i = 0;
        };

        return {
            start,
            stop,
            reset
        }
    })();

    socket.on('stopInsert', () => {
        insert.stop();
    });

    socket.on('startInsert', () => {
        try {
            insert.start(db, coordinates)
        }
        catch (err) {
            console.log(err);
        }
    });

    socket.on('resetTablePosition', async () => {
        try {
            const result = await db.any("TRUNCATE TABLE positions RESTART IDENTITY;");
            insert.reset();
            socket.emit('tablePositionReseted', { positions: result });
        }
        catch (err) {
            console.log(err);
        }
    });
};

module.exports = socketEvents;