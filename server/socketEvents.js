const socketEvents = async (socket, db, coordinates) => {
    let stopInsert = false;
    let inserting = false;
    let i = 0;

    socket.on('stopInsert', () => {
        stopInsert = true;
    });

    socket.on('startInsert', async () => {
        try {
            if(!inserting){
                stopInsert = false;
                inserting = true;
                console.log("Insertion starting");
                let interval = setInterval(() => {

                    db.one('INSERT INTO positions(pos) VALUES($1) RETURNING id', ['{"lat": ' + coordinates[i][1] + ', "long": ' + coordinates[i][0] + '}']);
                    ++i;
                    console.log(stopInsert);
                    if (i === 100) {
                        i = 0;
                    }
                    if (i === 100 || stopInsert) {

                        clearInterval(interval);
                        console.log(stopInsert);
                        stopInsert = false;
                        inserting = false;
                        console.log("Insertion end");
                    }

                }, 1000);
            }

        }
        catch (err) {
            console.log(err);
        }
    });

    socket.on('resetTablePosition', async () => {
        try {
            const result = await db.any("TRUNCATE TABLE positions RESTART IDENTITY;");
            console.log(result);
            socket.emit('tablePositionReseted', { positions: result });
            i = 0;
        }
        catch (err) {
            console.log(err);
        }
    });
};

module.exports = socketEvents;