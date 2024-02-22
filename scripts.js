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
  "esri/geometry/geometryEngine",
  "esri/layers/GraphicsLayer",
  "esri/widgets/Sketch",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/views/View",
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
  Zoom,
  geometryEngine,
  GraphicsLayer,
  Sketch,
  SketchViewModel,
  View
) {
  // Key to check in sessionStorage
  const key = "condos";
  const key2 = "No geometry"; // no condos default

  // Check if the key exists in sessionStorage
  if (sessionStorage.getItem(key) === null) {
    // If the key doesn't exist, set it to "none"
    sessionStorage.setItem(key, "no");
  } else {
  }

  if (sessionStorage.getItem(key2) === null) {
    // If the key doesn't exist, set it to "none"
    sessionStorage.setItem(key2, "yes");
  } else {
  }

  const searchGraphicsLayers = new GraphicsLayer();
  const sketchGL = new GraphicsLayer();

  const webmap = new WebMap({
    portalItem: {
      id: "6448b08504de4244973a28305b18271f",
    },
    layers: [searchGraphicsLayers],
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

  view.popupEnabled = true;
  view.on("click", (event) => {
    view.openPopup({
      title: "popup",
      // Set properties for the manually opened popup
    });
  });

  webmap.add(sketchGL);
  const sketchWidget = document.getElementById("sketch-widget");

  view.when(() => {
    const sketch = new Sketch({
      layer: searchGraphicsLayers,
      view: view,
      container: sketchWidget,
      visibleElements: {
        createTools: {
          point: false,
          circle: false,
          rectangle: false,
          polygon: false,
          polyline: false,
          select: false,
        },
        creationMode: "single",

        selectionTools: {
          "lasso-selection": true,
          "rectangle-selection": false,
          "circle-selection": false,
          "feature-selection": false,
          "toggle-selection": false,
          "clear-selection": false,
          "undo-selection": false,
          "selection-clear": false,
        },
        settingsMenu: false,
        undoRedoMenu: false,
        sketchPanel: false,
      },
      // Default Value:["point", "polyline", "polygon", "rectangle", "circle"]
      // graphic will be selected as soon as it is created
      creationMode: "update",
    });
    // Hide the Sketch widget's default UI
    // sketch.container.style.display = "none";

    // console.log(sketch.selectionTools);

    // view.ui.add(sketch, sketchWidget);
  });

  let runQuerySearchTerm;
  let clickedToggle;
  let detailSelected = [];
  let firstList = [];
  let detailsGeometry;
  let CondoBuffer = false;
  let targetExtent;
  let queryUnits = "feet";
  let exportResults;
  let highlightResponse;
  let searchResults;
  let lasso = false;
  let bufferGraphicId;
  let polygonGraphics;
  let noCondosParcelGeom;
  let isGisLink;

  let value = document.getElementById("buffer-value");
  const clearBtn = document.getElementById("clear-btn");

  let noCondosLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_NOCONDOS/FeatureServer/0",
    visible: false,
    popupEnabled: true,

    defaultPopupTemplateEnabled: true,
  });

  noCondosLayer.renderer = {
    type: "simple", // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill", // autocasts as new SimpleMarkerSymbol()
      color: [255, 255, 255, 0],
      outline: {
        // autocasts as new SimpleLineSymbol()
        width: 1,
        color: [169, 169, 169, 1],
      },
    },
  };

  // let CondosLayer = new FeatureLayer({
  //   url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/Washington_Just_Condos/FeatureServer/0",
  //   visible: false,
  //   popupEnabled: true,
  // });

  let CondosLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/ArcGIS/rest/services/CT_Washington_Adv_Viewer_Parcels_CONDOS/FeatureServer/0",
    visible: false,
    popupEnabled: true,
  });

  CondosLayer.renderer = {
    type: "simple", // autocasts as new SimpleRenderer()
    symbol: {
      type: "simple-fill", // autocasts as new SimpleMarkerSymbol()
      color: [255, 255, 255, 0],
      outline: {
        // autocasts as new SimpleLineSymbol()
        width: 1,
        color: [169, 169, 169, 1],
      },
    },
  };

  const CondosTable = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_CONDOS/FeatureServer/1",
  });

  const noCondosTable = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_NOCONDOS/FeatureServer/1",
  });

  webmap.add(noCondosLayer);
  webmap.add(CondosLayer);

  CondosTable.load().then(() => {
    webmap.tables.add(CondosTable);
  });
  noCondosTable.load().then(() => {
    webmap.tables.add(noCondosTable);
  });

  function clearContents(e) {
    // console.log(e.target.value);
    noCondosLayer.visible = false;
    CondosLayer.visible = false;
    $("#searchInput ul").remove();
    $("#searchInput").val = "";
    // $("#side-Exp2").addClass("disabled");

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
    $("#results-div").css("left", "0px");
    $("#sidebar2").css("left", "-350px");
    $("#right-arrow-2").show();
    $("#left-arrow-2").hide();
    $("#abutters-content").hide();
    $("#selected-feature").empty();
    $("#parcel-feature").empty();
    $("#backButton").hide();
    $("#exportResults").hide();
    $("#exportSearch").hide();
    // $("#details-conetnt").hide();

    let suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";
    $("#featureWid").empty();

    view.graphics.removeAll();

    if (lasso || e === "select") {
      return;
    } else {
      view.goTo(webmap.portalItem.extent);
    }
    lasso = false;
  }

  function buildResultsPanel(features, polygonGraphics) {
    $("status-loader").show();
    features.forEach(function (feature) {
      // PUT BACK TO FILTER OUT EMPTY OWNERS
      if (feature.attributes.Owner === "" || null || undefined) {
        return;
      } else {
        // secondList.push(feature.attributes["Uniqueid"]);
        // console.log("Detailed feature:", feature.attributes.Location);
        // let uid = feature.uid;
        let objectId = feature.attributes["OBJECTID"];
        let locationVal = feature.attributes.Location;
        let locationUniqueId = feature.attributes["Uniqueid"];
        let locationGISLINK = feature.attributes["GIS_LINK"];
        let locationCoOwner = feature.attributes["Co_Owner"];
        let locationOwner = feature.attributes["Owner"];
        let locationMBL = feature.attributes["MBL"];
        let locationGeom = feature.geometry;
        let mailingAddress = feature.attributes["Mailing_Address_1"];
        let mailingAddress2 = feature.attributes["Mailing_Address_2"];
        let Mailing_City = feature.attributes["Mailing_City"];
        let Mail_State = feature.attributes["Mail_State"];
        let Mailing_Zip = feature.attributes["Mailing_Zip"];
        let Total_Acres = feature.attributes["Total_Acres"];
        let Parcel_Primary_Use = feature.attributes["Parcel_Primary_Use"];
        let Building_Use_Code = feature.attributes["Building_Use_Code"];
        let Parcel_Type = feature.attributes["Parcel_Type"];
        let Design_Type = feature.attributes["Design_Type"];
        let Zoning = feature.attributes["Zoning"];
        let Neighborhood = feature.attributes["Neighborhood"];
        let Land_Type_Rate = feature.attributes["Land_Type_Rate"];
        let Functional_Obs = feature.attributes["Functional_Obs"];
        let External_Obs = feature.attributes["External_Obs"];
        let Sale_Date = feature.attributes["Sale_Date"];
        let Sale_Price = feature.attributes["Sale_Price"];
        let Vol_Page = feature.attributes["Vol_Page"];
        let Assessed_Total = feature.attributes["Assessed_Total"];
        let Appraised_Total = feature.attributes["Appraised_Total"];
        let Influence_Factor = feature.attributes["Influence_Factor"];
        let Influence_Type = feature.attributes["Influence_Type"];
        let Land_Type = feature.attributes["Land_Type"];
        let geometry = feature.attributes["geometry"];

        firstList.push(
          new Parcel(
            objectId,
            locationVal,
            locationMBL,
            locationUniqueId,
            locationCoOwner,
            locationOwner,
            locationGISLINK,
            locationGeom,
            mailingAddress,
            mailingAddress2,
            Mailing_City,
            Mail_State,
            Mailing_Zip,
            Total_Acres,
            Parcel_Primary_Use,
            Building_Use_Code,
            Parcel_Type,
            Design_Type,
            Zoning,
            Neighborhood,
            Land_Type_Rate,
            Functional_Obs,
            External_Obs,
            Sale_Date,
            Sale_Price,
            Vol_Page,
            Assessed_Total,
            Appraised_Total,
            Influence_Factor,
            Influence_Type,
            Land_Type,
            geometry
          )
        );
      }
    });
    // console.log(firstList);

    let seenIds = new Set();
    let seenUID = new Set();

    // Step 1: Filter for unique objectid with geometry
    let uniqueArray = firstList.filter((obj) => {
      // const isNewId = !seenIds.has(obj.uniqueId) && obj.geometry;
      if (obj.geometry) {
        seenIds.add(obj.uniqueId);
        return true;
      }
      return false;
    });

    // Step 2: Filter remaining items for unique uniqueId
    firstList.forEach((obj) => {
      const isNewuid = !seenIds.has(obj.uniqueId);
      if (isNewuid) {
        seenUID.add(obj.uniqueId);
        uniqueArray.push(obj);
      }
    });

    // console.log(firstList);
    // console.log(uniqueArray);

    uniqueArray.sort((a, b) =>
      a.owner.toLowerCase().localeCompare(b.owner.toLowerCase())
    );
    const featureWidDiv = document.getElementById("featureWid");
    const listGroup = document.createElement("ul");

    uniqueArray.forEach(function (feature) {
      console.log(feature);
      searchResults = uniqueArray.length;
      let objectID = feature.objectid;
      console.log(objectID);
      let locationVal = feature.location;
      let locationUniqueId =
        feature.uniqueId === undefined ? feature.GIS_LINK : feature.uniqueId;
      // let Mail_State =
      // matchedObject.Mail_State === undefined ? "" : matchedObject.Mail_State;
      let locationGISLINK = feature.GIS_LINK;
      let locationCoOwner = feature.coOwner;
      let locationOwner = feature.owner;
      let locationMBL = feature.MBL;
      let locationGeom = feature.geometry;

      const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
      // const featureWidDiv = document.getElementById("featureWid");
      // const listGroup = document.createElement("ul");
      listGroup.classList.add("row");
      listGroup.classList.add("list-group");

      const listItem = document.createElement("li");
      const imageDiv = document.createElement("li");
      imageDiv.innerHTML = `<img src="${imageUrl}" alt="Image of ${locationUniqueId}" >`;
      listItem.classList.add("list-group-item", "col-9");
      listItem.classList.add("search-list");

      imageDiv.classList.add("image-div", "col-3");

      $(document).ready(function () {
        $("#total-results").show();
        $("#total-results").html(searchResults + " results returned");
      });

      let listItemHTML;
      let displayNoGeometry;

      if (sessionStorage.getItem(key2) === "yes") {
        displayNoGeometry = true;
      } else {
        displayNoGeometry = false;
      }

      if (!locationCoOwner && locationGeom) {
        listItemHTML = ` ${locationVal} <br> ${locationUniqueId}  ${locationMBL} <br>  ${locationOwner}`;
      } else if (!locationGeom && displayNoGeometry) {
        listItemHTML = `  ${locationVal} <br>  ${locationUniqueId}  ${locationMBL} <br> ${locationOwner}<div style="position: absolute; color: red; right: 0; padding-right: 5px";>No Geometry</div>`;
      } else {
        listItemHTML = ` ${locationVal} <br> ${locationUniqueId}  ${locationMBL} <br>  ${locationOwner} & ${locationCoOwner}`;
      }
      // } else if (!locationGeom && !locationCoOwner) {
      //   listItemHTML = `<div style="color: red";>No Geometry</div> ${locationVal} <br>  ${locationUniqueId}  ${locationMBL} <br> ${locationOwner}`;
      // } else {
      //   listItemHTML = `${locationVal} <br>  ${locationUniqueId}  ${locationMBL} <br> ${locationOwner} & ${locationCoOwner}`;
      // }

      // Append the new list item to the list
      listItem.innerHTML += listItemHTML;
      listItem.setAttribute("object-id", objectID);
      listItem.setAttribute("data-id", locationGISLINK);

      listGroup.appendChild(imageDiv);
      listGroup.appendChild(listItem);
      // featureWidDiv.appendChild(listGroup);

      $("#detailsButton").hide();
      $("#featureWid").show();
      $("#result-btns").show();
      $("#details-btns").hide();
      $("#detail-content").empty();
      $("#dropdown").toggleClass("expanded");
      $("status-loader").hide();
      $("#dropdown").show();
      $("#sidebar2").css("left", "0px");
      $("#results-div").css("left", "350px");
      $("#left-arrow-2").show();
      $("#right-arrow-2").hide();
      $("#results-div").css("height", "200px");
      $("#exportSearch").show();
    });

    listGroup.addEventListener("click", function (event) {
      // Check if the clicked element is an li or a descendant of an li
      let targetElement = event.target.closest("li");

      // If it's not an li, exit the handler
      if (!targetElement) return;

      // Now you can handle the click event as you would in the individual event listener
      let itemId = targetElement.getAttribute("data-id");
      let objectID = targetElement.getAttribute("object-id");

      zoomToFeature(objectID, polygonGraphics, itemId);
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#abutters-content").hide();
      $("#details-btns").show();
      $("#detailBox").show();
      $("#backButton").show();
      $("#detailsButton").hide();
      $("#detail-content").empty();
      $("#selected-feature").empty();
      $("#exportSearch").hide();
      $("#results-div").css("height", "150px");
      $("#backButton-div").css("padding-top", "0px");
      buildDetailsPanel(objectID, itemId);
    });
    featureWidDiv.appendChild(listGroup);
  }

  let features;

  function addPolygons(polygonGeometries, graphicsLayer) {
    let bufferGraphicId = "addPolygons";
    features = polygonGeometries.features;
    console.log(features);
    var fillSymbol = {
      type: "simple-fill",
      color: [0, 255, 255, 0.25],
      outline: {
        color: [102, 235, 235, 0.6],
        width: 2,
      },
    };

    // Map each geometry to a graphic
    polygonGraphics = features
      .map(function (feature) {
        // console.log(feature);
        // console.log(feature.geometry);
        if (!feature.geometry) {
          console.error("Feature does not have geometry:", feature);
          return null; // Skip this feature as it has no geometry
        }
        return new Graphic({
          geometry: feature.geometry,
          symbol: fillSymbol,
          id: bufferGraphicId,
        });
      })
      .filter((graphic) => graphic !== null);

    graphicsLayer.addMany(polygonGraphics);
  }

  let sketch = new SketchViewModel({
    view: view,
    layer: sketchGL,
    defaultCreateOptions: {
      mode: "freehand",
    },

    polygonSymbol: {
      type: "simple-fill",
      style: "cross",
      color: "#17a2b8",
      outline: {
        width: 3,
        style: "solid",
        color: "#514644",
      },
    },

    defaultUpdateOptions: { tool: "reshape", toggleToolOnClick: false },
  });

  function highlightLasso(lasso) {
    let results = [];
    let features = [];
    let totalResults = [];
    let graphicsLayer = view.graphics;

    function runCondoQuery() {
      let query2 = CondosLayer.createQuery();
      query2.geometry = lasso;
      query2.distance = 1;
      query2.units = "feet";
      query2.spatialRelationship = "intersects";
      query2.returnGeometry = true;
      query2.outFields = ["*"];

      CondosLayer.queryFeatures(query2).then(function (response) {
        totalResults = response.features;
        addResultGraphics(totalResults);
      });
    }

    function runNoCondosQuery() {
      let query = noCondosLayer.createQuery();
      query.geometry = lasso;
      query.distance = 1;
      query.units = "feet";
      query.spatialRelationship = "intersects";
      query.returnGeometry = true;
      query.outFields = ["*"];

      noCondosLayer.queryFeatures(query).then(function (response) {
        totalResults = response.features;
        addResultGraphics(totalResults);
      });
    }

    if (sessionStorage.getItem(key) == "no") {
      runNoCondosQuery();
    } else {
      runCondoQuery();
    }

    function addResultGraphics(finalResults) {
      var fillSymbol = {
        type: "simple-fill",
        color: [0, 255, 255, 0.25],
        outline: {
          color: [102, 235, 235, 0.6],
          width: 2,
        },
      };

      // Map each geometry to a graphic
      polygonGraphics = finalResults
        .map(function (feature) {
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
      sketchGL.removeAll();
      buildResultsPanel(finalResults, polygonGraphics);
    }
  }

  $("#lasso").on("click", function (e) {
    lasso = true;
    // console.log(e.target);
    clearContents(e);
    sketchGL.removeAll();

    // Check if the key exists in sessionStorage
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }

    // CondosLayer.visible = true;
    // noCondosLayer.visible = true;
    sketch.create("polygon");
  });

  // listen to create event, only respond when event's state changes to complete
  sketch.on("create", function (event) {
    if (event.state === "complete") {
      sketchGL.remove(event.graphic);
      sketchGL.add(event.graphic);
      highlightLasso(event.graphic.geometry);
    }
  });

  $("#select-button").on("click", function (e) {
    clearContents("select");
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }

    lasso = false;
    sketch.cancel();
  });

  $("#home").on("click", function (e) {
    view.goTo(webmap.portalItem.extent);
  });

  class Parcel {
    constructor(
      objectid,
      location,
      MBL,
      uniqueId,
      coOwner,
      owner,
      gisLink,
      geometry,
      mailingAddress,
      mailingAddress2,
      Mailing_City,
      Mail_State,
      Mailing_Zip,
      Total_Acres,
      Parcel_Primary_Use,
      Building_Use_Code,
      Parcel_Type,
      Design_Type,
      Zoning,
      Neighborhood,
      Land_Type_Rate,
      Functional_Obs,
      External_Obs,
      Sale_Date,
      Sale_Price,
      Vol_Page,
      Assessed_Total,
      Appraised_Total,
      Influence_Factor,
      Influence_Type,
      Land_Type
    ) {
      this.objectid = objectid;
      this.location = location;
      this.MBL = MBL;
      this.uniqueId = uniqueId;
      this.coOwner = coOwner;
      this.owner = owner;
      this.GIS_LINK = gisLink;
      this.geometry = geometry;
      this.mailingAddress = mailingAddress;
      this.mailingAddress2 = mailingAddress2;
      this.Mailing_City = Mailing_City;
      this.Mail_State = Mail_State;
      this.Mailing_Zip = Mailing_Zip;
      this.Total_Acres = Total_Acres;
      this.Parcel_Primary_Use = Parcel_Primary_Use;
      this.Building_Use_Code = Building_Use_Code;
      this.Parcel_Type = Parcel_Type;
      this.Design_Type = Design_Type;
      this.Zoning = Zoning;
      this.Neighborhood = Neighborhood;
      this.Land_Type_Rate = Land_Type_Rate;
      this.Functional_Obs = Functional_Obs;
      this.External_Obs = External_Obs;
      this.Sale_Date = Sale_Date;
      this.Sale_Price = Sale_Price;
      this.Vol_Page = Vol_Page;
      this.Assessed_Total = Assessed_Total;
      this.Appraised_Total = Appraised_Total;
      this.Influence_Factor = Influence_Factor;
      this.Influence_Type = Influence_Type;
      this.Land_Type = Land_Type;
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

  // view
  //   .when()
  //   .then(() => {
  //     return noCondosLayer.when();
  //   })
  //   .then((layer) => {
  //     // const renderer = layer.renderer.clone();
  //     // renderer.symbol.width = 1;
  //     // renderer.symbol.color = [128, 128, 128, 1];
  //     // renderer.symbol.outline = { color: [0, 0, 0, 0.5], width: 0.5 };
  //     // layer.renderer = renderer;

  //     // Set up an event handler for pointer-down (mobile)
  //     // and pointer-move events (mouse)
  //     // and retrieve the screen x, y coordinates

  //     return view.whenLayerView(layer);
  //   })
  //   .then((layerView) => {
  //     view.on("pointer-move", eventHandler);
  //     view.on("pointer-down", eventHandler);
  //     // view.on("pointer-down", eventHandler);

  //     function eventHandler(event) {
  //       // only include graphics from hurricanesLayer in the hitTest
  //       const opts = {
  //         include: noCondosLayer,
  //       };
  //       // the hitTest() checks to see if any graphics from the hurricanesLayer
  //       // intersect the x, y coordinates of the pointer
  //       view.hitTest(event, opts).then(getGraphics);
  //     }

  //     let highlight;

  //     function getGraphics(response) {
  //       // the topmost graphic from the hurricanesLayer
  //       // and display select attribute values from the
  //       // graphic to the user
  //       if (response.results.length) {
  //         const graphic = response.results[0].graphic;
  //         console.log(graphic.attributes);

  //         const uniqueid = graphic.attributes.uniqueId;
  //         const GIS_LINK = graphic.attributes.GIS_LINK;

  //         const id = graphic.attributes.OBJECTID;

  //         if (
  //           highlight
  //           // (currentName !== name || currentYear !== year)
  //         ) {
  //           highlight.remove();
  //           highlight = null;
  //           return;
  //         }

  //         const query = layerView.createQuery();
  //         query.where = "OBJECTID = " + id + "";
  //         layerView.queryObjectIds(query).then((ids) => {
  //           if (highlight) {
  //             highlight.remove();
  //           }
  //           highlight = layerView.highlight(ids);
  //         });
  //       } else {
  //         // remove the highlight if no features are
  //         // returned from the hitTest
  //         if (highlight) {
  //           highlight.remove();
  //           highlight = null;
  //         }
  //       }
  //     }
  //   });

  clearBtn.addEventListener("click", function () {
    clearContents();
  });

  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      runQuerySearchTerm = e.target.value.toUpperCase();
    });

  function queryRelatedRecords(searchTerm) {
    // console.log(firstList);
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

    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.queryFeatures(query).then(function (result) {
        console.log(`no condos result: ${result}`);
        // view.goTo(result.features);
        if (result.features.length > 2) {
          view.goTo(result.features);
          console.log(result.features);
        } else {
          console.log(result);
          console.log(result.features);
          view.goTo({
            target: result.features,
            zoom: 16,
          });
        }

        noCondosParcelGeom = result.features;
        addPolygons(result, view.graphics);
        buildResultsPanel(result.features);
      });
    } else {
      CondosLayer.queryFeatures(query2).then(function (result) {
        if (result.features) {
          console.log(`condos result: ${result}`);
          // addCondoPolygons(result);
          if (result.features.length > 2) {
            view.goTo(result.features);
          } else {
            view.goTo({
              target: result.features,
              zoom: 16,
            });
          }
          addPolygons(result, view.graphics);
          buildResultsPanel(result.features);
        }
      });
    }
  }

  view.on("click", function (event) {
    // event is the event handle returned after the event fires.
    console.log(event);

    let query2 = CondosLayer.createQuery();
    query2.geometry = event.mapPoint;
    query2.distance = 1;
    query2.units = "feet";
    query2.spatialRelationship = "within";
    query2.returnGeometry = true;
    query2.outFields = ["*"];

    CondosLayer.queryFeatures(query2).then(function (response) {
      totalResults = response.features;
      console.log(totalResults);
      addPolygons(response, view.graphics);
      buildResultsPanel(totalResults);
      // addResultGraphics(totalResults);
    });
  });

  $(document).ready(function () {
    $("#backButton").on("click", function () {
      $("#detailBox").hide();
      $("#featureWid").show();
      $("#result-btns").show();
      $("#total-results").show();
      $("#details-btns").hide();
      $("#detail-content").empty();
      $("#backButton").hide();
      $("#detailsButton").hide();
      $("#abutters-content").hide();
      $("#selected-feature").empty();
      $("#parcel-feature").empty();
      $("#exportResults").hide();
      $("#exportSearch").show();
      $("#results-div").css("height", "200px");
      view.graphics.removeAll();
      const existingBufferGraphicIndex = view.graphics.items.findIndex(
        (g) => g.id === bufferGraphicId
      );
      if (existingBufferGraphicIndex > -1) {
        view.graphics.removeAt(existingBufferGraphicIndex);
      }
      view.graphics.addMany(polygonGraphics);
      view.goTo(polygonGraphics);
      // polygonGraphics
    });
  });

  $(document).ready(function () {
    $("#detailsButton").on("click", function () {
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#details-btns").show();
      $("#detail-content").show();
      $("#detailBox").show();
      $("#backButton").show();
      $("#detailsButton").hide();
      $("#abutters-content").hide();
      $("#selected-feature").empty();
      $("#parcel-feature").empty();
      $("#exportResults").hide();
      $("#exportSearch").hide();
      $("#abutters-title").html(`Abutting Parcels (0)`);
      $("#backButton-div").css("padding-top", "0px");
      $("#results-div").css("height", "150px");
      // Find and remove the existing buffer graphic
      const existingBufferGraphicIndex = view.graphics.items.findIndex(
        (g) => g.id === bufferGraphicId
      );
      if (existingBufferGraphicIndex > -1) {
        view.graphics.removeAt(existingBufferGraphicIndex);
      }
    });
  });

  $(document).ready(function () {
    $("#abutters").on("click", function (e) {
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#details-btns").hide();
      $("#exportSearch").hide();
      $("#abutters-content").show();
      $("#selected-feature").empty();
      $("#backButton").show();
      $("#detailsButton").show();
      $("#parcel-feature").empty();
      $("#backButton-div").css("padding-top", "78px");
      $("#abutters-title").html(`Abutting Parcels (0)`);
      buildAbuttersPanel(e);
      value.value = 100;
      runBuffer("100");
    });
  });

  $(document).ready(function () {
    $("#exportSearch").on("click", function () {
      ExportDetails("search");
    });
  });

  // EXPORT RESULTS
  $(document).ready(function () {
    $("#exportResults").on("click", function () {
      ExportDetails("details");
    });
  });

  // ABUTTERS WIDGET
  $(document).ready(function () {
    $("#buffer-value").on("change", function (e) {
      e.stopPropagation();
      currentVal = value.value = parseInt(value.value);
      $("#parcel-feature").empty();
      bufferPush();
    });

    $("#increase").on("click", function (e) {
      e.stopPropagation();
      currentVal = value.value = parseInt(value.value) + 1;
      $("#parcel-feature").empty();
      bufferPush();
    });

    $("#decrease").on("click", function (e) {
      e.stopPropagation();
      currentVal = value.value = parseInt(value.value) - 1;
      $("#parcel-feature").empty();
      bufferPush();
    });

    $("#submit").on("click", function (e) {
      e.stopPropagation();
      currentVal = value.value = parseInt(value.value);
      $("#parcel-feature").empty();
      bufferPush();
    });

    let debounceTimer;
    function bufferPush() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        runBuffer(currentVal);
      }, 200);
    }

    $(".units").on("click", function (e) {
      if (e.target.value == "feet") {
        queryUnits = "feet";
        $("#unitSelector").html(queryUnits);
      } else {
        queryUnits = "meters";
        $("#unitSelector").html(queryUnits);
      }
    });
  });

  // UNCOMMENT TO HIGHLIGHT PARCELS OR USE LOGIC
  // TO HIGHLIGHT ON MOUSEOVER
  // ALSO HIGHLIGHTS DETIAL PANE RESULTS

  // view
  //   .when()
  //   .then(() => {
  //     return noCondosLayer.when();
  //   })
  //   .then((layer) => {
  //     return view.whenLayerView(layer);
  //   })
  //   .then((layerView) => {
  //     // $(document).ready(function () {
  //     view.on("pointer-move", function (event) {
  //       let query = noCondosLayer.createQuery();
  //       query.geometry = view.toMap(event); // the point location of the pointer
  //       query.distance = 1;
  //       query.units = "feet";
  //       query.spatialRelationship = "intersects"; // this is the default
  //       query.returnGeometry = true;
  //       query.outFields = ["*"];

  //       layerView.queryFeatures(query).then(function (response) {
  //         let responseObj = response.features;
  //         let responseVal = responseObj[0].attributes.OBJECTID;
  //         highlightResponse = responseVal;
  //         // console.log(responseVal);

  //         layerView.highlightOptions = {
  //           color: [222, 49, 99],
  //           // color: [252, 216, 13], orange
  //           haloOpacity: 1,
  //           haloSize: 2,
  //           fillOpacity: 0,
  //         };

  //         if (highlight) {
  //           highlight.remove();
  //         }

  //         highlight = layerView.highlight(responseVal);

  //         $("li").css("border-color", "white");
  //         if (responseVal) {
  //           $("li")
  //             .filter('[object-id="' + responseVal + '"]')
  //             .css("border-color", "red");
  //           highlightResponse = false;
  //         }

  //         view.on("pointer-leave", function (event) {
  //           $("li")
  //             .filter('[object-id="' + responseVal + '"]')
  //             .css("border-color", "white");
  //         });
  //       });
  //     });

  //     if (highlight) {
  //       highlight.remove();
  //     }
  //   });
  function ExportDetails(type) {
    var listItems;
    if (type === "search") {
      listItems = document.querySelectorAll(".search-list");
    } else {
      listItems = document.querySelectorAll(".abutters-group-item");
    }
    // Extract all list items from the provided HTML structure.

    var transformedContent = "<ul class='label-list'>";
    listItems.forEach(function (item) {
      transformedContent += "<li>" + item.innerHTML.trim() + "</li>"; // Trim to remove any extra whitespace
    });
    transformedContent += "</ul>";

    var style = "<style>";
    style += "body { margin: 0; padding: 0; font-size: 10pt; }";
    style +=
      ".label-list { list-style-type: none; margin: 0; padding: 0; display: flex; align-items: center; text-align: center; flex-wrap: wrap; justify-content: space-between; }";
    style +=
      ".label-list li { box-sizing: border-box; width: 2.225in; height: 1in; margin-bottom: 0.0in; padding: 0.1in; display: flex; align-items: center; justify-content: center; font-size: 8pt; }"; // Updated for centering text
    style += "@media print {";
    style += "  body { margin: 0.0in 0.1875in; }"; // Adjusted body margin for print
    style += "  .label-list { padding: 0; }";
    style += "  .label-list li { margin-right: 0in; margin-bottom: 0; }"; // Remove right margin on labels
    style +=
      "  @page { margin-top: 0.5in; margin-bottom: 0.5in; margin-left: 0.25in; margin-right: 0.25in }"; // Adjust as needed for your printer
    style += "}";
    style += "</style>";

    var win = window.open(
      "",
      "print",
      "left=0,top=0,width=800,height=600,toolbar=0,status=0"
    );

    win.document.write("<!DOCTYPE html><html><head>");
    win.document.write("<title>Print Labels</title>");
    win.document.write(style);
    win.document.write("</head><body>");
    win.document.write(transformedContent);
    win.document.write("</body></html>");
    win.document.close(); // Close the document
    console.log(win.document);

    setTimeout(() => {
      win.print(); // Print the document
      win.close(); // Close the window after printing
    }, 250); // Delay to ensure rendering is complete
  }

  // THIS IS WHERE YOU WOULD MAKE UNITS A VARIABLE FOR USER SELECTION
  function queryDetailsBuffer(geometry) {
    // Loader.open();
    let bothResults = [];

    const abuttersDiv = document.getElementById("parcel-feature");
    abuttersDiv.innerHTML = "";

    const parcelQuery = {
      spatialRelationship: "intersects", // Relationship operation to apply
      geometry: geometry, // The sketch feature geometry
      outFields: ["*"], // Attributes to return
      returnGeometry: true,
      units: queryUnits,
    };

    exportResults = [];

    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.queryFeatures(parcelQuery).then((results) => {
        bothResults = [...results.features];

        const seenLocations = new Set();

        let noDupBothResults = bothResults.filter((item) => {
          if (seenLocations.has(item.attributes.OBJECTID)) {
            return false;
          }
          seenLocations.add(item.attributes.OBJECTID);
          return true;
        });

        // console.log(noDupBothResults);
        // console.log(seenLocations);

        let foundLocs = bothResults.filter((element) =>
          seenLocations.has(element.attributes.OBJECTID)
        );

        totalResults = bothResults.length;
        let noResultDups = bothResults;

        let finalResults = noResultDups.filter(
          (item, index) => noResultDups.indexOf(item) === index
        );

        lastResults = finalResults;
        console.log(lastResults);

        exportResults = bothResults;
        console.log(exportResults);

        let listItemHTML = "";
        // console.log(lastResults);
        foundLocs.forEach(function (feature) {
          let locationGISLINK = feature.attributes["GIS_LINK"];
          let objectID = feature.attributes["OBJECTID"];
          let owner = feature.attributes["Owner"];
          let coOwner = feature.attributes["Co_Owner"];
          let mailingAddress = feature.attributes["Mailing_Address_1"];
          let mailingAddress2 = feature.attributes["Mailing_Address_2"];
          let Mailing_City = feature.attributes["Mailing_City"];
          let Mail_State = feature.attributes["Mail_State"];
          let Mailing_Zip = feature.attributes["Mailing_Zip"];

          const listGroup = document.createElement("ul");
          listGroup.classList.add("row");
          listGroup.classList.add("list-group");
          listGroup.classList.add("abutters-list");

          const listItem = document.createElement("li");
          listItem.classList.add("abutters-group-item", "col-12");

          let listItemHTML = "";

          listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

          // Append the new list item to the list
          listItem.innerHTML += listItemHTML;

          listItem.setAttribute("data-id", locationGISLINK);
          listItem.setAttribute("object-id", objectID);

          listGroup.appendChild(listItem);
          abuttersDiv.appendChild(listGroup);

          $("#abutters-title").html(`Abutting Parcels (${totalResults})`);
        });
      });
    } else {
      CondosLayer.queryFeatures(parcelQuery).then((results2) => {
        bothResults = [...results2.features];

        const seenLocations = new Set();

        let noDupBothResults = bothResults.filter((item) => {
          if (seenLocations.has(item.attributes.OBJECTID)) {
            return false;
          }
          seenLocations.add(item.attributes.OBJECTID);
          return true;
        });

        let foundLocs = bothResults.filter((element) =>
          seenLocations.has(element.attributes.OBJECTID)
        );

        totalResults = bothResults.length;
        let noResultDups = bothResults;

        let finalResults = noResultDups.filter(
          (item, index) => noResultDups.indexOf(item) === index
        );

        lastResults = finalResults;
        // console.log(lastResults);

        exportResults = bothResults;
        // console.log(exportResults);

        let listItemHTML = "";

        foundLocs.forEach(function (feature) {
          let locationGISLINK = feature.attributes["GIS_LINK"];
          let objectID = feature.attributes["OBJECTID"];
          let owner = feature.attributes["Owner"];
          let coOwner = feature.attributes["Co_Owner"];
          let mailingAddress = feature.attributes["Mailing_Address_1"];
          let mailingAddress2 = feature.attributes["Mailing_Address_2"];
          let Mailing_City = feature.attributes["Mailing_City"];
          let Mail_State = feature.attributes["Mail_State"];
          let Mailing_Zip = feature.attributes["Mailing_Zip"];

          const listGroup = document.createElement("ul");
          listGroup.classList.add("row");
          listGroup.classList.add("list-group");
          listGroup.classList.add("abutters-list");

          const listItem = document.createElement("li");
          listItem.classList.add("abutters-group-item", "col-12");

          let listItemHTML = "";

          listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

          // Append the new list item to the list
          listItem.innerHTML += listItemHTML;

          listItem.setAttribute("data-id", locationGISLINK);
          listItem.setAttribute("object-id", objectID);

          listGroup.appendChild(listItem);
          abuttersDiv.appendChild(listGroup);

          $("#abutters-title").html(`Abutting Parcels (${totalResults})`);
        });
      });
    }
    $("#results-div").css("height", "200px");
    $("#exportResults").show();
  }

  function addOrUpdateBufferGraphic(bufferResults) {
    bufferGraphicId = "BufferGraphicId";

    let fillSymbol = {
      type: "simple-fill",
      color: [51, 51, 204, 0.1],
      style: "forward-diagonal",
      outline: {
        color: "#FF7900",
        width: 4,
      },
    };

    // Find and remove the existing buffer graphic
    const existingBufferGraphicIndex = view.graphics.items.findIndex(
      (g) => g.id === bufferGraphicId
    );
    if (existingBufferGraphicIndex > -1) {
      view.graphics.removeAt(existingBufferGraphicIndex);
    }

    // Add new buffer graphic
    let newBufferGraphic = new Graphic({
      geometry: bufferResults,
      symbol: fillSymbol,
      id: bufferGraphicId, // Assigning the unique ID
    });
    view.graphics.add(newBufferGraphic);
    view.goTo(newBufferGraphic);
  }

  function runBuffer(value) {
    // console.log(detailsGeometry);
    let buffer = value;
    let unit = queryUnits;
    let bufferResults;

    if (
      sessionStorage.getItem(key) == "no" &&
      isGisLink.length >= 1 &&
      CondoBuffer == false
    ) {
      bufferResults = geometryEngine.buffer(targetExtent, buffer, unit);
      console.log(`no condos buffer run`);
    } else {
      bufferResults = geometryEngine.buffer(detailsGeometry, buffer, unit);
      console.log(`condos buffer run`);
    }

    addOrUpdateBufferGraphic(bufferResults);
    queryDetailsBuffer(bufferResults);
  }

  function buildDetailsPanel(objectId, itemId) {
    detailSelected = [objectId, itemId];

    var matchedObject;

    matchedObject = firstList.find(function (item) {
      return item.objectid === parseInt(objectId);
    });

    if (!matchedObject) {
      matchedObject = firstList.find(function (item) {
        return item.GIS_LINK === itemId || item.uniqueId === itemId;
      });
    }

    // let locationVal =
    //   matchedObject.location === undefined ? "" : matchedObject.location;

    let locationUniqueId =
      matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;

    // let locationGISLINK =
    //   matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;
    let locationCoOwner =
      matchedObject.coOwner === undefined ? "" : matchedObject.coOwner;
    let locationOwner =
      matchedObject.owner === undefined ? "" : matchedObject.owner;
    let locationMBL = matchedObject.MBL === undefined ? "" : matchedObject.MBL;
    let mailingAddress =
      matchedObject.mailingAddress === undefined
        ? ""
        : matchedObject.mailingAddress;
    let mailingAddress2 =
      matchedObject.mailingAddress2 === undefined
        ? ""
        : matchedObject.mailingAddress2;
    let Mailing_City =
      matchedObject.Mailing_City === undefined
        ? ""
        : matchedObject.Mailing_City + ", ";
    let Mail_State =
      matchedObject.Mail_State === undefined ? "" : matchedObject.Mail_State;
    let Mailing_Zip =
      matchedObject.Mailing_Zip === undefined ? "" : matchedObject.Mailing_Zip;
    let Total_Acres =
      matchedObject.Total_Acres === undefined ? "" : matchedObject.Total_Acres;
    let Parcel_Primary_Use =
      matchedObject.Parcel_Primary_Use === undefined
        ? ""
        : matchedObject.Parcel_Primary_Use;
    let Building_Use_Code =
      matchedObject.Building_Use_Code === undefined
        ? ""
        : matchedObject.Building_Use_Code;
    let Parcel_Type =
      matchedObject.Parcel_Type === undefined ? "" : matchedObject.Parcel_Type;
    let Design_Type =
      matchedObject.Design_Type === undefined ? "" : matchedObject.Design_Type;
    let Zoning = matchedObject.Zoning === undefined ? "" : matchedObject.Zoning;
    let Neighborhood =
      matchedObject.Neighborhood === undefined
        ? ""
        : matchedObject.Neighborhood;
    let Land_Type_Rate =
      matchedObject.Land_Type_Rate === undefined
        ? ""
        : matchedObject.Land_Type_Rate;
    let Functional_Obs =
      matchedObject.Functional_Obs === undefined
        ? ""
        : matchedObject.Functional_Obs;
    let External_Obs =
      matchedObject.External_Obs === undefined
        ? ""
        : matchedObject.External_Obs;
    let Sale_Date =
      matchedObject.Sale_Date === undefined ? "" : matchedObject.Sale_Date;
    let Sale_Price =
      matchedObject.Sale_Price === undefined ? "" : matchedObject.Sale_Price;
    let Vol_Page =
      matchedObject.Vol_Page === undefined ? "" : matchedObject.Vol_Page;
    let Assessed_Total =
      matchedObject.Assessed_Total === undefined
        ? ""
        : matchedObject.Assessed_Total;
    let Appraised_Total =
      matchedObject.Appraised_Total === undefined
        ? ""
        : matchedObject.Appraised_Total;
    // let Influence_Factor =
    //   matchedObject.Influence_Factor === undefined
    //     ? ""
    //     : matchedObject.Influence_Factor;
    // let Influence_Type =
    //   matchedObject.Influence_Type === undefined
    //     ? ""
    //     : matchedObject.Influence_Type;
    // let Land_Type =
    //   matchedObject.Land_Type === undefined ? "" : matchedObject.Land_Type;

    const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
    // console.log(matchedObject);

    const detailsDiv = document.getElementById("detail-content");

    const details = document.createElement("div");
    details.innerHTML = "";
    details.classList.add("details");

    details.innerHTML = `
          <div>
              <p>
                  <span style="font-size:9pt;">Owners:&nbsp;</span><br>
                  <span style="font-size:9pt;"><strong>${locationOwner} & ${locationCoOwner}</strong></span><br>
                  <span style="font-size:9pt;">Unique ID: <strong>${locationUniqueId}</strong></span><br>
                  <span style="font-size:9pt;">MBL: <strong>${locationMBL}</strong></span><br>
                  <span style="font-size:9pt;">Mailing Address:&nbsp;</span><br>
                  <span style="font-size:9pt;"><strong>${mailingAddress}</strong></span><br>
                  <span style="font-size:9pt;"><strong>${Mailing_City}${Mail_State} ${Mailing_Zip}</strong></span>
              </p>
          </div>
          <div>
              <img src="${imageUrl}"alt="Image of ${locationUniqueId}">
          </div>
          <div>
              <span style="font-size:9pt;">Total Acres: <strong>${Total_Acres}</strong></span><br>
              <span style="font-size:9pt;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span><br>
              <span style="font-size:9pt;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>
              <span style="font-size:9pt;">Parcel Type: <strong>${Parcel_Type}</strong></span><br>
              <span style="font-size:9pt;">Design Type: <strong>${Design_Type}</strong></span><br>
              <span style="font-size:9pt;">Zone: <strong>${Zoning}</strong></span><br>
              <span style="font-size:9pt;">Nhbd: <strong>${Neighborhood}</strong></span><br>
              <span style="font-size:9pt;">Land Rate: <strong>${Land_Type_Rate}</strong></span><br>
              <span style="font-size:9pt;">Functional Obsolescence: <strong>${Functional_Obs}</strong></span><br>
              <span style="font-size:9pt;">External Obsolescence: <strong>${External_Obs}</strong></span><br>
              &nbsp;
          </div>
          
          <div>
              <span style="font-size:9pt;">Latest Qualified Sale:&nbsp;</span><br>
              <span style="font-size:9pt;">Sold on: <strong>${Sale_Date}</strong></span><br>
              <span style="font-size:9pt;">Sale Price: <strong>${Sale_Price}</strong></span><br>
              <span style="font-size:9pt;">Volume/Page: <strong>${Vol_Page}</strong></span><br>
              &nbsp;
          </div>
        
          <div>
              <span style="font-size:9pt;">Valuations:&nbsp;</span><br>
              <span style="font-size:9pt;">Asssessment: <strong>${Assessed_Total}</strong></span><br>
              <span style="font-size:9pt;">Appraised: <strong>${Appraised_Total}</strong></span><br>
              &nbsp;
          </div>
         
        `;

    // <div>
    //     <span style="font-size:9pt;">Influence Info: Influence Factor / Influence Type / Land Type&nbsp;</span><br>
    //     <span style="font-size:9pt;"><strong>{expression/expression1}</strong></span><br>
    //     &nbsp;
    // </div>

    detailsDiv.appendChild(details);
  }

  function zoomToFeature(objectid, polygonGraphics, gisLink) {
    isGisLink = [];
    let bufferGraphicId = "uniqueBufferGraphicId";

    view.graphics.removeAll(polygonGraphics);

    const existingBufferGraphicIndex = view.graphics.items.findIndex(
      (g) => g.id === bufferGraphicId
    );

    if (existingBufferGraphicIndex > -1) {
      view.graphics.removeAt(existingBufferGraphicIndex);
    }

    isGisLink = firstList.filter((obj) => obj.GIS_LINK == gisLink);

    // if "no condos" and GIS_LINK is equal to firstlist(means its searched by GIS_LINK)
    // and GIS_LINK > 1( not searched on one uniqueid w/ no geometry) or will error
    if (
      sessionStorage.getItem(key) == "no" &&
      isGisLink.length == firstList.length &&
      isGisLink.length > 1
    ) {
      if (noCondosParcelGeom[0].geometry) {
        CondoBuffer = false;
        targetExtent = noCondosParcelGeom[0].geometry;
        const fillSymbol = {
          type: "simple-fill",
          color: [0, 0, 0, 0.1],
          outline: {
            color: [255, 0, 0, 1],
            width: 3,
          },
        };

        const polygonGraphic = new Graphic({
          geometry: targetExtent,
          symbol: fillSymbol,
          id: bufferGraphicId,
        });

        view.graphics.addMany([polygonGraphic]);
        view.goTo({
          target: polygonGraphic,
          zoom: 15,
        });
      } else {
        console.log(`issue getting targetExtent geometry`);
      }
    } else {
      CondoBuffer = true;
      let matchingObject = firstList.filter((obj) => obj.objectid == objectid);

      if (matchingObject) {
        // matchingObject.forEach(function (feature) {
        // console.log(feature);
        if (
          matchingObject[0].geometry != null &&
          matchingObject[0].geometry != ""
        ) {
          detailsGeometry = matchingObject[0].geometry;
          // condoGeo = detailsGeometry;
          // view.goTo(detailsGeometry, );

          view.goTo({
            target: detailsGeometry,
            zoom: 15,
          });
          console.log(detailsGeometry);

          const fillSymbol = {
            type: "simple-fill",
            color: [0, 0, 0, 0.1],
            outline: {
              color: [255, 0, 0, 1],
              width: 3,
            },
          };

          const polygonGraphic = new Graphic({
            geometry: detailsGeometry,
            symbol: fillSymbol,
            id: bufferGraphicId,
          });
          view.graphics.addMany([polygonGraphic]);
        } else {
          CondoBuffer = false;
          let whereClause = `GIS_LINK = '${matchingObject[0].GIS_LINK}'`;
          let query = noCondosLayer.createQuery();
          query.where = whereClause;
          query.returnGeometry = true;
          query.returnHiddenFields = true; // Adjust based on your needs
          query.outFields = ["*"];

          noCondosLayer.queryFeatures(query).then((response) => {
            let feature = response;
            let geometry = feature.features[0].geometry;
            console.log(response);
            console.log(geometry);

            targetExtent = geometry;

            view.goTo({
              target: geometry,
              zoom: 15,
            });

            // view.goTo(geometry);
            console.log(geometry);
            const fillSymbol = {
              type: "simple-fill",
              color: [0, 0, 0, 0.1],
              outline: {
                color: [255, 0, 0, 1],
                width: 3,
              },
            };

            const polygonGraphic = new Graphic({
              geometry: targetExtent,
              symbol: fillSymbol,
              id: bufferGraphicId,
            });
            view.graphics.addMany([polygonGraphic]);
          });
        }
        // });
      }
    }
  }

  const buildAbuttersPanel = function (e) {
    $("#abutters-title").html("Abutters");
    let itemSelected = detailSelected;

    var matchedObject = firstList.find(function (item) {
      return (
        (item.uniqueId === itemSelected[1] &&
          item.objectid === Number(itemSelected[0])) ||
        (item.GIS_LINK === itemSelected[1] &&
          item.objectid === Number(itemSelected[0]))
      );
    });

    let locationMaillingAddress =
      matchedObject.mailingAddress === undefined
        ? ""
        : matchedObject.mailingAddress;

    let locationUniqueId =
      matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;

    let locationGISLINK =
      matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;

    let locationOwner =
      matchedObject.owner === undefined ? "" : matchedObject.owner;

    let locationMBL = matchedObject.MBL === undefined ? "" : matchedObject.MBL;

    const abuttersDiv = document.getElementById("selected-feature");
    // console.log("After selecting: ", featureWidDiv);

    const listGroup = document.createElement("ul");
    listGroup.classList.add("row");
    listGroup.classList.add("list-group");

    const listItem = document.createElement("li");
    listItem.classList.add("abutters-group-item", "col-12");

    let listItemHTML;

    listItemHTML = ` ${locationMaillingAddress} <br> ${locationUniqueId}  ${locationMBL} <br>  ${locationOwner}`;

    // Append the new list item to the list
    listItem.innerHTML += listItemHTML;

    listItem.setAttribute("data-id", locationGISLINK);

    listGroup.appendChild(listItem);
    abuttersDiv.appendChild(listGroup);

    // $("#selected-feature").html = "Abutters";
  };

  // LOGIC FOR SEARCH OF FEATURE LAYERS AND RELATED RECORDS

  const runQuery = (e) => {
    firstList = [];

    // Check if the key exists in sessionStorage
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }

    // noCondosLayer.visible = true;
    // CondosLayer.visible = true;
    let suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";

    let features;

    if (clickedToggle) {
      runQuerySearchTerm = e;
    }

    let searchTerm = runQuerySearchTerm;

    if (searchTerm.length < 3) {
      return;
    } else {
      $("#dropdown").toggleClass("expanded");
      $("#details-btns").hide();
      $("#result-btns").hide();
      $("#backButton").hide();
      $("#detailsButton").hide();
      $("#featureWid").empty();
      $("#exportSearch").hide();

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
      query.returnHiddenFields = true; // Adjust based on your needs
      query.outFields = ["*"];

      noCondosTable
        .queryFeatures(query)
        .then((response) => {
          console.log(response);

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
                let locationGeom = feature.geometry;
                let mailingAddress = feature.attributes["Mailing_Address_1"];
                let mailingAddress2 = feature.attributes["Mailing_Address_2"];
                let Mailing_City = feature.attributes["Mailing_City"];
                let Mail_State = feature.attributes["Mail_State"];
                let Mailing_Zip = feature.attributes["Mailing_Zip"];
                let Total_Acres = feature.attributes["Total_Acres"];
                let Parcel_Primary_Use =
                  feature.attributes["Parcel_Primary_Use"];
                let Building_Use_Code = feature.attributes["Building_Use_Code"];
                let Parcel_Type = feature.attributes["Parcel_Type"];
                let Design_Type = feature.attributes["Design_Type"];
                let Zoning = feature.attributes["Zoning"];
                let Neighborhood = feature.attributes["Neighborhood"];
                let Land_Type_Rate = feature.attributes["Land_Type_Rate"];
                let Functional_Obs = feature.attributes["Functional_Obs"];
                let External_Obs = feature.attributes["External_Obs"];
                let Sale_Date = feature.attributes["Sale_Date"];
                let Sale_Price = feature.attributes["Sale_Price"];
                let Vol_Page = feature.attributes["Vol_Page"];
                let Assessed_Total = feature.attributes["Assessed_Total"];
                let Appraised_Total = feature.attributes["Appraised_Total"];
                let Influence_Factor = feature.attributes["Influence_Factor"];
                let Influence_Type = feature.attributes["Influence_Type"];
                let Land_Type = feature.attributes["Land_Type"];

                firstList.push(
                  new Parcel(
                    objectId,
                    locationVal,
                    locationMBL,
                    locationUniqueId,
                    locationCoOwner,
                    locationOwner,
                    locationGISLINK,
                    locationGeom,
                    mailingAddress,
                    mailingAddress2,
                    Mailing_City,
                    Mail_State,
                    Mailing_Zip,
                    Total_Acres,
                    Parcel_Primary_Use,
                    Building_Use_Code,
                    Parcel_Type,
                    Design_Type,
                    Zoning,
                    Neighborhood,
                    Land_Type_Rate,
                    Functional_Obs,
                    External_Obs,
                    Sale_Date,
                    Sale_Price,
                    Vol_Page,
                    Assessed_Total,
                    Appraised_Total,
                    Influence_Factor,
                    Influence_Type,
                    Land_Type
                  )
                );
              }
            });
            // console.log(whereClause);
            queryRelatedRecords(runQuerySearchTerm);
          }
        })
        .catch((error) => {
          console.error("Error querying for details:", error);
        });
    }
  };

  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      firstList = [];
      $("#sidebar2").css("left", "-350px");
      $("#results-div").css("left", "0px");
      $("#dropdown").toggleClass("expanded");
      $("#dropdown").hide();
      $("#result-btns").hide();
      $("#details-btns").hide();

      var searchTerm = e.target.value.toUpperCase();

      if (searchTerm.length < 2) {
        CondosLayer.visible = false;
        noCondosLayer.visible = false;

        firstList = [];
        secondList = [];
        $("#searchInput ul").remove();
        $("#suggestions").hide();
        $("#featureWid").empty();
        $("#dropdown").removeClass("expanded");
        $("#dropdown").hide();
        $("#result-btns").hide();
        $("#details-btns").hide();
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide();
        $("#abutters-content").hide();
        $("#abutters-content").hide();
        $("#selected-feature").empty();
        $("#parcel-feature").empty();
        $("#backButton").hide();
        $("#detailBox").hide();
        $("#exportSearch").hide();

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
        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = ""; // Clear previous suggestions

        response.features.forEach((feature) => {
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
            if (
              value &&
              value.includes(searchTerm) &&
              !uniqueSuggestions.has(value)
            ) {
              let suggestionDiv = document.createElement("div");
              suggestionDiv.className = "list-group-item";
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

  // Attach event listener to the search input
  document
    .querySelector(".form-inline")
    .addEventListener("submit", function (e) {
      // Check if the key exists in sessionStorage
      if (sessionStorage.getItem(key) === "no") {
        noCondosLayer.visible = true;
      } else {
        CondosLayer.visible = true;
      }
      firstList = [];
      view.graphics.removeAll();

      e.preventDefault();
      $("#featureWid").empty();
      $("#selected-feature").empty();
    });

  // Hide suggestions when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.id !== "searchInput") {
      document.getElementById("suggestions").style.display = "none";
    }
  });

  document
    .getElementById("searchButton")
    .addEventListener("click", function () {
      $("#sidebar2").css("left", "-350px");
      $("#results-div").css("left", "0px");
      view.graphics.removeAll();
      // Check if the key exists in sessionStorage
      if (sessionStorage.getItem(key) === "no") {
        noCondosLayer.visible = true;
      } else {
        CondosLayer.visible = true;
      }
      $("dropdown").empty();
      $("#featureWid").empty();
      $("#abutters-content").hide();
      $("#selected-feature").empty();
      $("#parcel-feature").empty();
      $("#total-results").show();
      $("#backButton").hide();
      $("#detailsButton").hide();
      $("#detailBox").hide();
      $("#result-btns").hide();
      $("#details-btns").hide();
      $("#exportResults").hide();
      $("#exportSearch").show();
      $("#abutters-title").html(`Abutting Parcels (0)`);

      runQuery();
    });

  $(document).ready(function () {
    $("#side-Exp").on("click", function () {
      $("#sidebar").toggleClass("collapsed");
      if ($("#sidebar").hasClass("collapsed")) {
        $("#small-div").css("right", "0px");
        $("#right-arrow").hide();
        $("#left-arrow").show();
      } else {
        $("#small-div").css("right", "250px");
        $("#left-arrow").hide();
        $("#right-arrow").show();
      }
    });
  });

  $(document).ready(function () {
    $("#side-Exp2").on("click", function () {
      $("#sidebar2").toggleClass("collapsed");

      if ($("#sidebar2").hasClass("collapsed")) {
        $("#results-div").css("left", "0px");
        $("#sidebar2").css("left", "-350px");
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide();
      } else {
        $("#results-div").css("left", "350px");
        $("#sidebar2").css("left", "0px");
        $("#left-arrow-2").show();
        $("#right-arrow-2").hide();
      }
    });
  });
});
