let map;
let coords = [];
let flightPath;
const socket = io.connect('https://coda-jr.com:3000');

socket.on('update', function (data) {
    let position = JSON.parse(data.message.payload);
    console.log(position);
    $('tbody').prepend(
        `<tr>
            <td>${position.data.id}</td>
            <td>${position.data.pos.lat}</td>
            <td>${position.data.pos.long}</td>
        </tr>`);
    map.panTo({lat : position.data.pos.lat, lng: position.data.pos.long});
    let path = flightPath.getPath();
    path.push(new google.maps.LatLng(position.data.pos.lat, position.data.pos.long));
    flightPath.setPath(path);
    if(flightPath.getPath().length === 1){
        map.setZoom(18);
    }
});

function initMap() {
    map = new google.maps.Map($('.map')[0], {
        center: {lat: 44.05255, lng: 4.137},
        zoom: 8
    });
    flightPath = new google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    flightPath.setMap(map);
}

const emptyNode = (node) => {
    node = $(node)[0];
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
};

const getPositions = () => {

    $.get('https://coda-jr.com:3000/request')
        .done(function (data) {
            emptyNode('tbody');
            data.forEach((el) => {
                coords.push({lat: el.position.lat, lng: el.position.long});
                $('tbody').append(
                    `<tr>
                        <td>${el.id}</td>
                        <td>${el.position.lat}</td>
                        <td>${el.position.long}</td>
                    </tr>`)
            });
            console.log(data);
        })
        .fail(function (err) {
            console.log(err);
        })
};

const getPositionsOnCLick = () => {
    $(".btn.getPositions").click(function () {
        console.log('click');
        getPositions();
    })
};

const postPositionsOnCLick = () => {
    $(".btn.startInsert").click(function () {
        console.log('click');
        $.post('https://coda-jr.com:3000/startInsert')
            .done( (status) => {
                console.log(status);
            })
            .fail( (err) => {
                console.log(err);
            })
    })
};

const deletePositionsOnCLick = () => {
    $(".btn.deleteData").click(function () {
        console.log('click');
        $.post('https://coda-jr.com:3000/delete_data')
            .done( () => {
                emptyNode('tbody');
                flightPath.getPath().clear();
            })
            .fail( (err) => {
                console.log(err);
            })
    })
};

$(function () {

    getPositionsOnCLick();
    postPositionsOnCLick();
    deletePositionsOnCLick();
});

// AIzaSyCEH43Unag1nRoqq2v4aiYAfAjOCJ_Q2ig