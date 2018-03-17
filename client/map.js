let map;
let coords = [];
let driverPath;
const socket = io.connect("https://coda-jr.com:6060");

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
  let path = flightPath.getPath();
  path.push(new google.maps.LatLng(lat, long));
  flightPath.setPath(path);
  if (flightPath.getPath().length === 1) {
    map.setZoom(18);
  }
});

function initMap() {
  map = new google.maps.Map($(".map")[0], {
    center: {lat: 44.05255, lng: 4.137},
    zoom: 8
  });
  initPolyline(map, driverPath);
}

const initPolyline = () => {
  driverPath = new google.maps.Polyline({
    path: [],
    geodesic: true,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  driverPath.setMap(map);
}

const emptyHtmlNode = (node) => {
  node = $(node)[0];
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

const getPositions = () => {
  $.get("https://coda-jr.com:6060/request")
    .done(function(data) {
      emptyNode("tbody");
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

const getPositionsOnCLick = () => {
  $(".btn.getPositions").click(function() {
    console.log("click");
    getPositions();
  });
};

const postPositionsOnCLick = () => {
  $(".btn.startInsert").click(function() {
    console.log("click");
    $.post("https://coda-jr.com:6060/startInsert")
      .done(status => {
        console.log(status);
      })
      .fail(err => {
        console.log(err);
      });
  });
};

const deletePositionsOnCLick = () => {
  $(".btn.deleteData").click(function() {
    console.log("click");
    $.post("https://coda-jr.com:6060/delete_data")
      .done(() => {
        emptyNode("tbody");
        driverPath.getPath().clear();
      })
      .fail(err => {
        console.log(err);
      });
  });
};

$(function() {
  getPositionsOnCLick();
  postPositionsOnCLick();
  deletePositionsOnCLick();
});

// AIzaSyCEH43Unag1nRoqq2v4aiYAfAjOCJ_Q2ig
