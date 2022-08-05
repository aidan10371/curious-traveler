// Styling JS
// Main Elements
const formScreen = $(".form-cont"); 
const loadScreen = $(".loading-cont");
const errorScreen = $(".error-cont");
const errorMessage = $(".error-msg");
const responseScreen = $(".response-cont");

// Some Styling
const bgImg = $("<img width='100%' id='bg-img' src='./imgs/1.jpg'>");
const viewportHeight = window.innerHeight;
const viewportWidth = window.innerWidth;
if (viewportWidth < 500) {
  const landscapeNotice = $("<div class='notice'><p>Tip: Turn your phone to landscape for a better experience</p></div>");
  $("#form").append(landscapeNotice);
}
if (viewportHeight < 400) {
  bgImg.attr("height", "400px");
} else {
  bgImg.attr("height", viewportHeight);
}
$(".bg-img-cont").append(bgImg);
loadScreen.css("height", viewportHeight);
errorScreen.css("height", viewportHeight);
$("#mapid").css("height", viewportHeight * 0.75);

// Screen Functionality
function screen(
  type,
  message = "<div>:(</div>An error occurred, please try again later."
) {
  switch (type) {
    case "loading":
      formScreen.css("display", "none");
      loadScreen.css("display", "block");
      break;
    case "error":
      loadScreen.css("display", "none");
      responseScreen.css("display", "none");
      errorScreen.css("display", "block");
      errorMessage.html(message);
      break;
    case "success":
      loadScreen.css("display", "none");
      responseScreen.css("display", "block");
  }
}

// Functionality
const status = $("#notice");

function checkGeoStatus() {
  if (!navigator.geolocation) {
    status.html(
      "<i class='fa fa-times'></i><p>Location is not supported by your browser</p>"
    );
  } else {
    navigator.geolocation.getCurrentPosition(success, error);
    function success() {
      status.html(
        "<i class='fa fa-check'></i><p>You have location enabled</p>"
      );
      checkForm(); // Now that location enabled start checking form for input
    }
    function error() {
      status.html(
        "<i class='fa fa-times'></i><p>You don't have location services enabled</p><div><p>Enable them for this site to continue</p></div>"
      );
    }
  }
}
checkGeoStatus();

function checkForm() {
  $(document).on("click keydown", () => {
    if (
      $("#start").val().trim() !== "" &&
      $("#destination").val().trim() !== ""
    ) {
      $("#submit").removeAttr("disabled"); // If there is input in both fields make the submit button appear
    } else {
      $("#submit").attr("disabled", "disabled"); // Always reset to disabled if false in case user deletes typing
    }
  });
}

// Mapbox Key
const key =
  "pk.eyJ1IjoiZGV2MTMwOTg0MDYiLCJhIjoiY2txOXEzcG4wMDJnZTJvcWVreGcyemwyMyJ9.353_jrl_p_GDH837cDYuVg";

// Get geolocation and generate map function on click of submit (once enabled ^)
$("#submit").on("click", mapMe);

function mapMe(event) {
  event.preventDefault();

  if (!navigator.geolocation) {
    screen(
      "error",
      "<div>:(</div>Sorry, geolocation is not supported by your browser."
    );
  } else {
    screen("loading");
    navigator.geolocation.getCurrentPosition(success, error);
  }

  function success(position) {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    console.log(lat, long);
    const start = $("#start").val().trim();
    const end = $("#destination").val().trim();
    genMap(lat, long, start, end);
  }

  function error() {
    screen(
      "error",
      "<div>:(</div><div>You don't have location services enabled</div><div>Enable them for this site to continue</div>"
    );
  }
}

function genMap(lat, long, start, end) {
  var startPlace;
  var endPlace;
  const startUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${start}.json?type=address&limit=1&access_token=${key}`;
  const endUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${end}.json?type=address&limit=1&access_token=${key}`;
  const revGeoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?type=locality&access_token=${key}`;

  // Get Coordinates of User End/Start
  $.when(
    $.ajax({ url: startUrl, method: "GET" }),
    $.ajax({ url: endUrl, method: "GET" }),
    $.ajax({ url: revGeoUrl, method: "GET" })
  )
    .done(function (startRes, endRes, revGeoRes) {
      screen("success"); // Show response screen once AJAX calls are done
      startPos = startRes[0].features[0].center;
      endPos = endRes[0].features[0].center;
      if (revGeoRes[0].features[3].place_type == "place") {
        revGeoPos = revGeoRes[0].features[3].place_name;
      } else {
        revGeoPos = revGeoRes[0].features[0].place_name;
      }

      // Start Creating Map
      const map = L.map("mapid").setView([lat, long], 6);

      // Main Map
      L.tileLayer(
        "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
        {
          attribution:
            'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 20,
          id: "mapbox/satellite-streets-v11", // Map Kind (Satellite Streets)
          tileSize: 512,
          zoomOffset: -1,
          accessToken: key,
        }
      ).addTo(map);

      // Start/End Markers
      const startMarker = L.marker([startPos[1], startPos[0]]).addTo(map);
      const endMarker = L.marker([endPos[1], endPos[0]]).addTo(map);

      // Approximate Straight Path
      const straightPath = L.polyline(
        [
          [startPos[1], startPos[0]],
          [endPos[1], endPos[0]],
        ],
        { color: "rgb(124, 196, 255)", weight: "2", dashArray: "8, 10" }
      ).addTo(map);

      // User Location Marker
      var myIcon = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      var myMarkerPopup = L.popup().setContent(
        `<div>You are currently traveling over/through:</div><div>${revGeoPos}<div>`
      );
      var myMarker = L.marker([lat, long], { icon: myIcon })
        .addTo(map)
        .bindPopup(myMarkerPopup)
        .openPopup();

      function rerenderMyMarker() {
        navigator.geolocation.getCurrentPosition(success, error);
        let newLat;
        let newLong;
        function success(position) {
          myMarker.remove(); // Remove old marker if can get new position
          newLat = position.coords.latitude;
          newLong = position.coords.longitude;
          myMarker = L.marker([newLat, newLong], { icon: myIcon }).addTo(map);
        }
        function error() {}
      }

      function setRenderInterval() {
        setInterval(rerenderMyMarker, 2000);
      }

      setTimeout(setRenderInterval, 8000);

      placeImage(revGeoPos); // Call once (See function below)
    })
    .fail(
      () => {
        screen("error");
      } // If cannot complete AJAX call way above ^^ show error screen
    );
}

// Filter Query, Find Place, Filter Results, and then Prepend it
function placeImage(imageQuery) {
    console.log(imageQuery);
  const stateLongs = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];
  const stateShorts = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
  ];

  // Filter Image Query
  if (imageQuery.includes("United States")) {
    var newImgQuery = imageQuery.replace(", United States", "");
    stateLongs.forEach((long, i) => {
      if (newImgQuery.includes(long)) {
        newImgQuery = newImgQuery.replace(long, stateShorts[i]);
      }
    });
  } else {
      newImgQuery = imageQuery;
  }

  // Image Query Settings
  const imgSettings = {
    async: true,
    crossDomain: true,
    url: `https://bing-image-search1.p.rapidapi.com/images/search?q=${newImgQuery}%20Image&count=6`,
    method: "GET",
    headers: {
      "x-rapidapi-key": "1febfcc404msh9d910e1ceb99b7ep142839jsn8098ff821fe8",
      "x-rapidapi-host": "bing-image-search1.p.rapidapi.com",
    },
  };

  // Do Image Query AJAX and filter results to not include top stock sites
  $.ajax(imgSettings).done(function (res) {
    const dissallowedDomains = [
      "shutterstock",
      "fotolia",
      "dreamstime",
      "getty",
      "istock",
      "stocksy",
      "crestock",
      "bigstock",
      "123rf",
      "alamy",
      "adobe",
      "pixabay",
    ];
    let i = 0;
    let done = false;
    while (!done && i < 6) {
      let dissallowed = false;
      dissallowedDomains.forEach((domain) => {
        if (res.value[i].contentUrl.includes(domain)) {
          dissallowed = true;
        }
      });
      if (!dissallowed) {
        const today = new Date();
        let time = "";
        if (today.getHours() > 12) {
            time = today.getHours() - 12;
        } else {
            time = today.getHours();
        }
        let minutes = "";
        const minute = today.getMinutes();
        if (minute.toString().length < 2) {
            minutes = `0${minute}`;
        } else {
            minutes = minute;
        }
        time += ":" + minutes + " ";
        if (today.getHours() >= 12) {
            time += "PM";
        } else {
            time += "AM";
        }
        const source = res.value[i].contentUrl;
        const creditName = res.value[i].hostPageDomainFriendlyName;
        const creditUrl = res.value[i].hostPageUrl;
        console.log(res);

        const img = $("<img>").attr("src", source);
        const title = $(`<div><p>At ${time} you traveled through/over ${newImgQuery}:</p></div>`)
        const attribution = $(`<div class="attribution">Credit (via Bing Image Search): <a href="${creditUrl}">${creditName}</a></div>`);
        img.attr("width", "100%");
        $("#place-info").prepend(title, img, attribution); // !!!
        // Don't look any further into results:
        done = true;
      } else {
        i += 1;
      }
    }
  });
}

// Gets new Reverse Geo Position and Initiates Place Image Function ^
function newImage() {
  navigator.geolocation.getCurrentPosition(success, error);

  function error() {
    screen(
      "error",
      "<div>:(</div><div>Couldn't reconnect to location services</div><div>Enable them for this site to continue</div>"
    );
  }

  function success(position) {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;

    const revGeoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?type=locality&access_token=${key}`;
    $.ajax({ url: revGeoUrl, method: "GET" })
      .done(function (revGeoRes) {
        if (revGeoRes.features[3].place_type == "place") {
          placeImage(revGeoRes.features[3].place_name);
        } else {
          placeImage(revGeoRes.features[0].place_name);
        }
      })
      .fail(() => {
        screen("error");
      });
  }
  restrictRefresh(); // Doesn't allow button to be clicked again for 1 minute
  alert(
    "Notice: Now that you have refreshed Place Info, you must wait at least 1 minute before refreshing agian."
  );
}
$("#newPlaceInfo").on("click", () => {
  newImage();
});

// Refresh 1 min restricting function
function restrictRefresh() {
  const btn = $("#newPlaceInfo");
  btn.attr("disabled", "disabled");
  setTimeout(unrestrictRefresh, 60000);
  function unrestrictRefresh() {
    btn.removeAttr("disabled");
  }
}

// Footer
$("#currentYear").text(new Date().getFullYear());
$("#reportBugWithRef").attr("href", "https://aidandigital.com/report-bug?ref=" + window.location.href);
$("#reportCopyrightInfringementWithRef").attr("href", "https://aidandigital.com/copyright-infringement?ref=" + window.location.href);