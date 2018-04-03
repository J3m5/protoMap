let map;
let coords = [];
let driverPath;
const socket = io.connect("https://coda-jr.com:6060");
// const socket = io.connect("localhost:6060");


const updatePostions = (map, driverPath) => {
    socket.on("update", function(data) {
        let position = JSON.parse(data.message.payload);
        console.log(position);
        const lat = position.data.pos.lat;
        const long = position.data.pos.long;
        $("tbody").prepend(
            `<tr>
        <td>${position.data.id}</td>
        <td>${lat}</td>
        <td>${long}</td>
    </tr>`
        );
        map.panTo({lat: lat, lng: long});
        let path = driverPath.getPath();
        path.push(new google.maps.LatLng(lat, long));
        driverPath.setPath(path);
        if (driverPath.getPath().length === 1) {
            map.setZoom(18);
        }
    });
};




const initPolyline = () => {
    driverPath = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    driverPath.setMap(map);
};

function initMap() {
    map = new google.maps.Map($(".map")[0], {
        center: {lat: 44.05255, lng: 4.137},
        zoom: 8
    });
    initPolyline(map, driverPath);
}

const emptyHtmlNode = (node) => {
    node = $(node)[0];
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
};

const getPositions = () => {
    $.get("localhost:6060/request")
        .done(function(data) {
            emptyHtmlNode("tbody");
            data.forEach(el => {
                coords.push({lat: el.position.lat, lng: el.position.long});
                $("tbody").append(
                    `<tr>
                        <td>${el.id}</td>
                        <td>${el.position.lat}</td>
                        <td>${el.position.long}</td>
                    </tr>`
                );
            });
            console.log(data);
        })
        .fail(function(err) {
            console.log(err);
        });
};

const postPositionsOnCLick = () => {
    $(".startInsert").click(function() {
        console.log("click");
        socket.emit("startInsert");
    });
};

const resetPostionsTable = () => {
    socket.on('tablePositionReseted', data => {
        console.log(data);
        if(data.positions.length === 0){
            emptyHtmlNode("tbody");
            driverPath.getPath().clear();
        }

    })
};

const deletePositionsOnCLick = () => {
    $(".deleteData").click(() => {
        console.log("click");
        socket.emit("resetTablePosition");
    });
    resetPostionsTable();
};

const stopPositionsOnCLick = () => {
    $(".stopInsert").click(() => {
        console.log("click");
        socket.emit("stopInsert");

    });
};

$(function() {
    updatePostions(map, driverPath);
    postPositionsOnCLick();
    stopPositionsOnCLick();
    deletePositionsOnCLick();

});

// AIzaSyCEH43Unag1nRoqq2v4aiYAfAjOCJ_Q2ig
