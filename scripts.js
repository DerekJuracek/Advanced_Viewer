require([
  "esri/WebMap",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Search",
  "esri/widgets/Features",
  "esri/rest/support/Query",
  "esri/popup/content/RelationshipContent",
  "esri/core/reactiveUtils",
  "esri/Graphic",
  "esri/widgets/Zoom",
], function (
  WebMap,
  MapView,
  FeatureLayer,
  Search,
  Features,
  Query,
  RelationshipContent,
  reactiveUtils,
  Graphic,
  Zoom
) {
  const webmap = new WebMap({
    portalItem: {
      id: "6448b08504de4244973a28305b18271f",
    },
  });

  var view = new MapView({
    container: "viewDiv",
    map: webmap,
    zoom: 12,
    popupEnabled: false,
    ui: {
      components: ["attribution"],
    },
  });

  // console.log(webmap);

  const noCondosLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_NOCONDOS/FeatureServer/1",
    defaultpopupTemplateEnabled: true,
  });

  const CondosLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_CONDOS/FeatureServer/1",
  });

  const CondosTable = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_Washington_Adv_Viewer_Parcels_CONDOS/FeatureServer/0",
  });

  const noCondosTable = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_Washington_Adv_Viewer_Parcels_NOCONDOS/FeatureServer/0",
  });

  // var flLayerView;
  // var fl2LayerView;

  // view.whenLayerView(noCondosLayer).then(function (layerView) {
  //   // Store the LayerView in a variable
  //   flLayerView = layerView;
  // });

  class CondoTableElements {
    constructor(
      objectid,
      location,
      MBL,
      uniqueId,
      coOwner,
      owner,
      gisLink,
      geometry
    ) {
      this.objectid = objectid;
      this.location = location;
      this.MBL = MBL;
      this.uniqueId = uniqueId;
      this.coOwner = coOwner;
      this.owner = owner;
      this.GIS_LINK = gisLink;
      this.geometry = geometry;
    }
  }

  // Wait until the view is loaded
  view.when(function () {
    // Set up the event listener for the zoom in button
    document.getElementById("zoom-in").onclick = function () {
      view.zoom += 1; // Increase the zoom level by 1
    };

    // Set up the event listener for the zoom out button
    document.getElementById("zoom-out").onclick = function () {
      view.zoom -= 1; // Decrease the zoom level by 1
    };
  });

  let runQuerySearchTerm;
  let clickedToggle;
  let handle1;
  let handle2;
  let firstList = [];
  let secondList = [];

  // Filtering out items from secondList that exist in firstList

  const clearBtn = document.getElementById("clear-btn");

  clearBtn.addEventListener("click", function () {
    $("#searchInput ul").remove();
    $("#searchInput").val = "";
    // Get a reference to the search input field
    const searchInput = document.getElementById("searchInput");

    // To clear the text in the input field, set its value to an empty string
    searchInput.value = "";
    runQuerySearchTerm = "";
    searchTerm = "";
    firstList = [];
    secondList = [];

    $("#result-btns").hide();
    $("#details-btns").hide();
    $("#dropdown").toggleClass("expanded");
    $("#dropdown").hide();

    let suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";
    $("#featureWid").empty();
    view.graphics.removeAll();

    view.goTo(webmap.portalItem.extent);
  });

  // view.ui.add(clearBtn, "top-left");
  webmap.add(noCondosLayer);
  webmap.add(CondosLayer);
  CondosTable.load().then(() => {
    webmap.tables.add(CondosTable);
  });
  noCondosTable.load().then(() => {
    webmap.tables.add(noCondosTable);
  });

  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      runQuerySearchTerm = e.target.value.toUpperCase();
    });

  function queryRelatedRecords(searchTerm) {
    console.log(searchTerm);
    // const uniqueID = screenPoint;

    let whereClause = `
    Street_Name LIKE '%${searchTerm}%' OR 
    MBL LIKE '%${searchTerm}%' OR 
    Location LIKE '%${searchTerm}%' OR 
    Co_Owner LIKE '%${searchTerm}%' OR 
    Uniqueid LIKE '%${searchTerm}%' OR 
    Owner LIKE '%${searchTerm}%' OR 
    GIS_LINK LIKE '%${searchTerm}%'
`;

    let query = noCondosLayer.createQuery();
    query.where = whereClause;
    query.returnGeometry = true; // Adjust based on your needs
    query.outFields = ["*"];

    let query2 = CondosLayer.createQuery();
    query2.where = whereClause;
    query2.returnGeometry = true; // Adjust based on your needs
    query2.outFields = ["*"];

    function addPolygons(polygonGeometries, graphicsLayer) {
      const features = polygonGeometries.features;
      console.log(polygonGeometries);
      console.log(graphicsLayer);

      // Define the symbol for the polygons
      var fillSymbol = {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        color: [0, 255, 255, 0.25], // Light, semi-transparent blue (cyan)
        outline: {
          // autocasts as new SimpleLineSymbol()
          color: [102, 235, 235, 0.6], // More opaque for the outline
          width: 2, // You can adjust the width as needed
        },
      };

      // Map each geometry to a graphic
      var polygonGraphics = features
        .map(function (feature) {
          console.log(feature.geometry);
          console.log(feature.geometry);
          if (!feature.geometry) {
            console.error("Feature does not have geometry:", feature);
            return null; // Skip this feature as it has no geometry
          }
          return new Graphic({
            geometry: feature.geometry,
            symbol: fillSymbol,
          });
        })
        .filter((graphic) => graphic !== null);

      // Add all polygon graphics to the graphics layer
      graphicsLayer.addMany(polygonGraphics);
      console.log(polygonGraphics);
    }

    noCondosLayer.queryFeatures(query).then(function (result) {
      console.log(result);
      console.log(result.features);
      if (result.features.length > 0) {
        view.goTo(result.features);
        addPolygons(result, view.graphics);
        // console.log(` No condos layer is highlighted`);
        // view.whenLayerView(noCondosLayer).then(function (layerView) {
        //   handle1 = layerView.highlight(result.features);
        // });
      } else {
        // result.features.forEach(function (feature) {
        CondosLayer.queryFeatures(query2).then(function (result) {
          console.log(result);
          console.log(result.features);
          if (result.features) {
            view.goTo(result.features);
            addPolygons(result, view.graphics);
          }
        });
      }

      const features = result.features;
      features.forEach(function (feature) {
        console.log(feature);

        // PUT BACK TO FILTER OUT EMPTY OWNERS
        if (feature.attributes.Owner === "" || null || undefined) {
          return;
        } else {
          // secondList.push(feature.attributes["Uniqueid"]);
          console.log("Detailed feature:", feature.attributes.Location);
          let objectId = feature.attributes["OBJECTID"];
          let locationVal = feature.attributes.Location;
          let locationUniqueId = feature.attributes["Uniqueid"];
          let locationGISLINK = feature.attributes["GIS_LINK"];
          let locationCoOwner = feature.attributes["Co_Owner"];
          let locationOwner = feature.attributes["Owner"];
          let locationMBL = feature.attributes["MBL"];
          let locationGeom = feature.geometry;

          firstList.push(
            new CondoTableElements(
              objectId,
              locationVal,
              locationMBL,
              locationUniqueId,
              locationCoOwner,
              locationOwner,
              locationGISLINK,
              locationGeom
            )
          );
        }
      });
      console.log(firstList);

      let seenIds = new Set();
      let uniqueArray = firstList.filter((obj) => {
        if (!seenIds.has(obj.uniqueId)) {
          seenIds.add(obj.uniqueId);
          return true; // Include the object in uniqueArray
        }
        return false; // Do not include the object in uniqueArray
      });

      // console.log(uniqueArray);

      uniqueArray.forEach(function (feature) {
        let locationVal = feature.location;
        let locationUniqueId = feature.uniqueId;
        let locationGISLINK = feature.GIS_LINK;
        let locationCoOwner = feature.Co_Owner;
        let locationOwner = feature.owner;
        let locationMBL = feature.MBL;

        const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;

        const featureWidDiv = document.getElementById("featureWid");
        // console.log("After selecting: ", featureWidDiv);

        const listGroup = document.createElement("ul");
        listGroup.classList.add("row");
        listGroup.classList.add("list-group");

        const listItem = document.createElement("li");
        const imageDiv = document.createElement("li");
        imageDiv.innerHTML = `<img src="${imageUrl}" alt="Image of ${locationUniqueId}" >`;
        listItem.classList.add("list-group-item", "col-9");
        imageDiv.classList.add("image-div", "col-3");

        let listItemHTML;

        if (!locationCoOwner) {
          listItemHTML = ` ${locationVal} <br> ${locationUniqueId}  ${locationMBL} <br>  ${locationOwner}`;
        } else {
          listItemHTML = `${locationVal} <br>  ${locationUniqueId}  ${locationMBL} <br> ${locationOwner} & ${locationCoOwner}`;
        }

        // Append the new list item to the list
        listItem.innerHTML += listItemHTML;

        listItem.setAttribute("data-id", locationGISLINK);
        listItem.setAttribute("location", locationVal);

        listGroup.appendChild(imageDiv);
        listGroup.appendChild(listItem);
        featureWidDiv.appendChild(listGroup);
        $("#featureWid").show();

        $("#result-btns").show();
        $("#details-btns").hide();
        $("#dropdown").toggleClass("expanded");
        $("#dropdown").show();
      });

      $(document).ready(function () {
        $("li").on("click", function (e) {
          console.log(e);
          let itemId = e.target.getAttribute("data-id");
          zoomToFeature(itemId);
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#details-btns").show();
          $("#detailBox").show();
          populateCondo(e);
        });
      });

      $(document).ready(function () {
        $("#backButton").on("click", function () {
          $("#detailBox").hide();
          $("#featureWid").show();
          $("#result-btns").show();
          $("#details-btns").hide();
          $("#detail-content").empty();
        });
      });

      function populateCondo(e) {
        let itemId = e.target.getAttribute("data-id");
        let location = e.target.getAttribute("location");

        console.log(itemId);

        // Find the object in the data array that has this uniqueId
        var matchedObject = firstList.find(function (item) {
          return item.uniqueId === itemId || item.GIS_LINK === itemId;
        });

        let locationVal = matchedObject.location;
        let locationUniqueId = matchedObject.uniqueId;
        let locationGISLINK = matchedObject.GIS_LINK;
        let locationCoOwner = matchedObject.Co_Owner;
        let locationOwner = matchedObject.owner;
        let locationMBL = matchedObject.MBL;

        const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
        console.log(matchedObject);

        const detailsDiv = document.getElementById("detail-content");

        const details = document.createElement("div");
        details.classList.add("details");

        if (!locationCoOwner) {
          details.innerHTML = `<img src="${imageUrl}"alt="Image of ${locationUniqueId}"> <br>  ${locationVal} <br>  ${locationUniqueId} <br>  ${locationGISLINK}<br>  No co-owners <br>  ${locationOwner} <br>  ${locationMBL} <br`;
        } else {
          details.innerHTML = `<img src="${imageUrl}"alt="Image of ${locationUniqueId}"> <br>  ${locationVal} <br>  ${locationUniqueId} <br>  ${locationGISLINK}<br>  ${locationCoOwner} <br>  ${locationOwner} <br>  ${locationMBL} <br`;
        }

        detailsDiv.appendChild(details);
        // const listGroup = document.createElement("div");
      }

      function zoomToFeature(itemId) {
        console.log(itemId);
        let matchingObject = firstList.filter(
          (obj) => obj.GIS_LINK == itemId || obj.Uniqueid == itemId
        );

        // maybe pursue the obj.geometry

        // let matchingObject = firstList.filter(
        //   (obj) => obj.GIS_LINK == itemId || obj.Uniqueid == itemId && obj.geometry
        // );
        if (matchingObject) {
          matchingObject.forEach(function (feature) {
            console.log(feature);
            let geometry = feature["geometry"];
            // Use the geometry to zoom to the feature.
            view.goTo(geometry);

            // fl2LayerView.highlight(feature["objectid"]);
            // flLayerView.highlight(feature["objectid"]);

            // Create a symbol for rendering the graphic
            const fillSymbol = {
              type: "simple-fill", // autocasts as new SimpleFillSymbol()
              color: [222, 49, 99, 0.7],
              outline: {
                // autocasts as new SimpleLineSymbol()
                color: [255, 255, 255],
                width: 2,
              },
            };

            // Add the geometry and symbol to a new graphic
            const polygonGraphic = new Graphic({
              geometry: geometry,
              symbol: fillSymbol,
            });

            // Add the graphics to the view's graphics layer
            view.graphics.addMany([polygonGraphic]);

            console.log(view.graphics);
          });
        }
      }
    });
  }

  const runQuery = (e) => {
    let suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";
    // console.log(e);
    let features;

    if (clickedToggle) {
      runQuerySearchTerm = e;
    }

    // console.log(event.srcElement.innerText);
    let searchTerm = runQuerySearchTerm;

    if (searchTerm.length < 3) {
      return;
    } else {
      $("#dropdown").toggleClass("expanded");
      $("#details-btns").hide();
      $("#result-btns").hide();

      let whereClause = `
              Street_Name LIKE '%${searchTerm}%' OR 
              MBL LIKE '%${searchTerm}%' OR 
              Location LIKE '%${searchTerm}%' OR 
              Co_Owner LIKE '%${searchTerm}%' OR 
              Uniqueid LIKE '%${searchTerm}%' OR 
              Owner LIKE '%${searchTerm}%' OR
              GIS_LINK LIKE '%${searchTerm}%'
          `;

      // let outFields = [
      //   "Street_Name",
      //   "MBL",
      //   "Location",
      //   "Co_Owner",
      //   "Uniqueid",
      //   "Owner",
      // "GIS_LINK",
      // ];

      let query = noCondosTable.createQuery();
      query.where = whereClause;
      query.returnGeometry = false; // Adjust based on your needs
      query.outFields = [
        "Street_Name",
        "MBL",
        "Location",
        "Co_Owner",
        "Uniqueid",
        "Owner",
        "GIS_LINK",
      ];
      console.log(query);

      noCondosTable
        .queryFeatures(query)
        .then((response) => {
          // console.log(response);

          if (response.features.length > 0) {
            features = response.features;
            features.forEach(function (feature) {
              if (feature.attributes.Owner === "" || null || undefined) {
                return;
              } else {
                let objectId = feature.attributes["OBJECTID"];
                let locationVal = feature.attributes.Location;
                let locationUniqueId = feature.attributes["Uniqueid"];
                let locationGISLINK = feature.attributes["GIS_LINK"];
                let locationCoOwner = feature.attributes["Co_Owner"];
                let locationOwner = feature.attributes["Owner"];
                let locationMBL = feature.attributes["MBL"];

                firstList.push(
                  new CondoTableElements(
                    objectId,
                    locationVal,
                    locationMBL,
                    locationUniqueId,
                    locationCoOwner,
                    locationOwner,
                    locationGISLINK
                  )
                );
              }
            });

            console.log(firstList);
          }
        })
        .catch((error) => {
          console.error("Error querying for details:", error);
        });
    }

    // Now query the related records based on this objectId
    queryRelatedRecords(runQuerySearchTerm);
  };

  // first function run from user typing in search input field
  // Attach event listener to the search input
  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      // $("#result-btns").toggleClass();
      $("#dropdown").toggleClass("expanded");
      $("#dropdown").hide();
      $("#result-btns").hide();
      $("#details-btns").hide();

      var searchTerm = e.target.value.toUpperCase();

      if (searchTerm.length < 2) {
        firstList = [];
        secondList = [];
        $("#searchInput ul").remove();
        $("#suggestions").hide();
        $("#featureWid").empty();
        $("#dropdown").removeClass("expanded");
        $("#dropdown").hide();
        $("#result-btns").hide();
        $("#details-btns").hide();
        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";
        $("#featureWid").empty();

        view.graphics.removeAll();

        view.goTo(webmap.portalItem.extent);

        return;
      }

      // Construct your where clause
      let whereClause = `
            Street_Name LIKE '%${searchTerm}%' OR 
            MBL LIKE '%${searchTerm}%' OR 
            Location LIKE '%${searchTerm}%' OR 
            Co_Owner LIKE '%${searchTerm}%' OR 
            Uniqueid LIKE '%${searchTerm}%' OR 
            Owner LIKE '%${searchTerm}%' OR
            GIS_LINK LIKE '%${searchTerm}%'
        `;

      let query = noCondosTable.createQuery();
      query.where = whereClause;
      query.returnGeometry = false;
      query.outFields = [
        "Street_Name",
        "MBL",
        "Location",
        "Co_Owner",
        "Uniqueid",
        "Owner",
        "GIS_LINK",
      ];

      let uniqueSuggestions = new Set();

      noCondosTable.queryFeatures(query).then((response) => {
        // console.log(response);
        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = ""; // Clear previous suggestions

        response.features.forEach((feature) => {
          // console.log("Processing feature:", feature);
          [
            "Street_Name",
            "MBL",
            "Location",
            "Co_Owner",
            "Uniqueid",
            "Owner",
            "GIS_LINK",
          ].forEach((fieldName) => {
            // console.log("Processing field:", fieldName);
            let value = feature.attributes[fieldName];

            // NEEDS TO RETURN NAME OF FIELDS SEARCHED
            //SO LIKE 289 TUNNEL Rd, 14 Tunnel Rd etc....
            if (
              value &&
              value.includes(searchTerm) &&
              !uniqueSuggestions.has(value)
            ) {
              let suggestionDiv = document.createElement("div");
              suggestionDiv.className = "list-group-item"; // Using Bootstrap's class for list items
              suggestionDiv.innerText = `${value}`;

              suggestionsContainer.appendChild(suggestionDiv);

              // Add the value to the Set
              uniqueSuggestions.add(value);
              suggestionsContainer.style.display = "block";

              suggestionDiv.addEventListener("click", function (e) {
                clickedToggle = true;
                runQuery(e.target.innerHTML);
                clickedToggle = false;
              });
            }
          });
        });
      });
    });

  // Prevent form submission (page reload) when the search button is clicked
  document
    .querySelector(".form-inline")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // You can handle the search action here, for instance, if you want to fetch more details based on a selected suggestion or search term
    });

  // Hide suggestions when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.id !== "searchInput") {
      document.getElementById("suggestions").style.display = "none";
    }
  });

  document.getElementById("searchButton").addEventListener("click", runQuery);

  $(document).ready(function () {
    $("#dropdownMenuButton").on("click", function () {
      $("#dropdown").toggleClass("expanded");
      if ($("#dropdown").hasClass("expanded")) {
        $("#up-arrow").show();
        $("#down-arrow").hide(); // Hide left arrow
        // Show right arrow
      } else {
        $("#down-arrow").show(); // Show left arrow
        $("#up-arrow").hide(); // Hide right arrow
      }
    });

    $(document).ready(function () {
      $("#side-Exp").on("click", function () {
        $("#sidebar").toggleClass("collapsed");

        // Check if the sidebar has the class 'collapsed' and adjust the 'right' property of #small-div accordingly
        // Toggle the 'right' CSS property for #small-div
        if ($("#sidebar").hasClass("collapsed")) {
          $("#small-div").css("right", "0px");
          $("#right-arrow").hide();
          $("#left-arrow").show(); // Hide left arrow
          // Show right arrow
        } else {
          $("#small-div").css("right", "250px");
          $("#left-arrow").hide(); // Show left arrow
          $("#right-arrow").show(); // Hide right arrow
        }
      });
    });
  });
});
