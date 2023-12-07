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
  geometryEngine
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
  let detailSelected;
  let firstList = [];
  let secondList = [];
  let detailsGeometry;
  let queryUnits = "feet";
  let highlight;
  let exportResults;
  let highlightResponse;

  let value = document.getElementById("buffer-value");

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
    $("#results-div").css("left", "0px");
    $("#sidebar2").css("left", "-350px");
    $("#right-arrow-2").show();
    $("#left-arrow-2").hide();
    $("#abutters-content").hide();
    $("#selected-feature").empty();
    $("#parcel-feature").empty();
    // $("#abutters-content").hide();

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
      // console.log(polygonGeometries);
      // console.log(graphicsLayer);

      var fillSymbol = {
        type: "simple-fill",
        color: [0, 255, 255, 0.25],
        outline: {
          color: [102, 235, 235, 0.6],
          width: 2,
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
      if (result.features.length > 0) {
        view.goTo(result.features);
        addPolygons(result, view.graphics);
      } else {
        CondosLayer.queryFeatures(query2).then(function (result) {
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
      console.log(firstList);

      let seenIds = new Set();
      let uniqueArray = firstList.filter((obj) => {
        if (!seenIds.has(obj.uniqueId)) {
          seenIds.add(obj.uniqueId);
          return true; // Include the object in uniqueArray
        }
        return false; // Do not include the object in uniqueArray
      });

      uniqueArray.forEach(function (feature) {
        let totalResults = uniqueArray.length;
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

        $("#total-results").html(totalResults + " results returned");

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
        $("#detailsButton").hide();
        $("#featureWid").show();
        $("#result-btns").show();
        $("#details-btns").hide();
        $("#dropdown").toggleClass("expanded");
        $("#dropdown").show();
        $("#sidebar2").css("left", "0px");
        $("#results-div").css("left", "350px");
        $("#left-arrow-2").show();
        $("#right-arrow-2").hide();
      });

      $(document).ready(function () {
        $("li").on("click", function (e) {
          console.log(e);
          let itemId = e.target.getAttribute("data-id");
          zoomToFeature(itemId);
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
          $("#backButton-div").css("padding-top", "0px");
          buildDetailsPanel(e);
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
          $("#results-div").css("height", "150px");
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
          $("#backButton-div").css("padding-top", "0px");
          $("#results-div").css("height", "150px");
        });
      });

      $(document).ready(function () {
        $("#abutters").on("click", function (e) {
          value.value = 100;
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#details-btns").hide();
          $("#abutters-content").show();
          $("#selected-feature").empty();
          $("#backButton").show();
          $("#detailsButton").show();
          $("#backButton-div").css("padding-top", "78px");
          buildAbuttersPanel(e);
          runBuffer("100");
        });
      });

      $(document).ready(function () {});

      $(document).ready(function () {
        $("#exportResults").on("click", function () {
          ExportDetails();
        });
      });

      $(document).ready(function () {
        let currentName;

        $("#buffer-value").on("change", function (e) {
          currentVal = value.value = parseInt(value.value) + 1;
          $("#parcel-feature").empty();
          bufferPush();
          // runBuffer(currentVal);
        });

        $("#increase").on("click", function () {
          currentVal = value.value = parseInt(value.value) + 1;
          $("#parcel-feature").empty();
          bufferPush();
          // runBuffer(currentVal);
        });

        $("#decrease").on("click", function () {
          currentVal = value.value = parseInt(value.value) - 1;
          $("#parcel-feature").empty();
          bufferPush();
          // runBuffer(currentVal);
        });

        function bufferPush() {
          runBuffer(currentVal);
        }

        // $("#unitSelector").on("click", function (e) {
        //   const currentVal = (value.value = parseInt(value.value) - 1);
        //   $("#parcel-feature").empty();
        //   runBuffer(currentVal);
        // });

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

      function triggerHighlight(objectID) {
        view
          .whenLayerView(noCondosLayer)
          .then(function (layerView) {
            const opts = {
              include: noCondosLayer,
            };

            const query = layerView.createQuery();
            query.where = "OBJECTID = " + objectID + "";
            layerView.queryObjectIds(query).then((ids) => {
              layerView.highlightOptions = {
                color: [222, 49, 99],
                // color: [252, 216, 13], orange
                haloOpacity: 1,
                haloSize: 2,
                fillOpacity: 0,
              };

              if (highlight) {
                highlight.remove();
              }
              highlight = layerView.highlight(ids);
            });
          })
          .catch(function (error) {
            console.log(error);
          });
      }

      // THIS IS WHERE YOU WOULD MAKE UNITS A VARIABLE FOR USER SELECTION
      function queryDetailsBuffer(geometry) {
        const parcelQuery = {
          spatialRelationship: "intersects", // Relationship operation to apply
          geometry: geometry, // The sketch feature geometry
          outFields: ["*"], // Attributes to return
          returnGeometry: true,
          units: queryUnits,
        };

        noCondosLayer
          .queryFeatures(parcelQuery)
          .then((results) => {
            exportResults = results;
            console.log(results);
            results.features.forEach(function (feature) {
              let itemId = feature.attributes["GIS_LINK"];
              let locationVal = feature.attributes.Location;
              let locationUniqueId = feature.attributes["Uniqueid"];
              let locationGISLINK = feature.attributes["GIS_LINK"];
              let objectID = feature.attributes["OBJECTID"];

              let owner = feature.attributes["Owner"];
              let coOwner = feature.attributes["Co_Owner"];
              let mailingAddress = feature.attributes["Mailing_Address_1"];
              let mailingAddress2 = feature.attributes["Mailing_Address_2"];
              let Mailing_City = feature.attributes["Mailing_City"];
              let Mail_State = feature.attributes["Mail_State"];
              let Mailing_Zip = feature.attributes["Mailing_Zip"];

              let geometry = feature.geometry;

              const abuttersDiv = document.getElementById("parcel-feature");

              const listGroup = document.createElement("ul");
              listGroup.classList.add("row");
              listGroup.classList.add("list-group");

              const listItem = document.createElement("li");
              listItem.classList.add("abutters-group-item", "col-12");

              let listItemHTML;

              listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

              // listItemHTML = ` ${locationVal} <br> ${locationUniqueId} <br> ${locationGISLINK}`;

              // Append the new list item to the list
              listItem.innerHTML += listItemHTML;

              listItem.setAttribute("data-id", locationGISLINK);
              listItem.setAttribute("object-id", objectID);

              listGroup.appendChild(listItem);
              abuttersDiv.appendChild(listGroup);

              // UNCOMMENT TO HIGHLIGHT ON MOUSEOVER
              // & ZOOM TO MAP PARCELS ON HOVER

              // listItem.addEventListener("mouseover", function (e) {
              //   let itemId = e.target.getAttribute("data-id");
              //   listItem.style.borderColor = "rgba(222, 49, 99, 0.7)";

              //   view.goTo(geometry);

              //   listItem.style.borderColor = "rgba(222, 49, 99, 0.7)";
              //   triggerHighlight(objectID);

              // });

              // listItem.addEventListener("mouseout", function (e) {
              //   listItem.style.borderColor = "rgba(255, 255, 255, 1)";
              // });
            });
            console.log(results);
            console.log("Feature count: " + results.features.length);
            $("#results-div").css("height", "200px");
            $("#exportResults").show();

            // ExportDetails();
          })
          .catch((error) => {
            console.log(error);
          });
      }

      function ExportDetails() {
        console.log(exportResults);

        var content = document.getElementById("parcel-feature").innerHTML;

        // Transform the content: Merge all <ul> into a single <ul> with multiple <li>
        var transformedContent = content.replace(
          /<\/ul><ul class="row list-group">/g,
          ""
        );

        var style = "<style>";
        style += "body, ul { margin: 0; padding: 0; }";
        style += "ul { list-style-type: none; }";
        style +=
          "li { display: flex; align-items: center; justify-content: center; box-sizing: border-box; width: 2.625in; height: 1in; outline: solid 1px #DDD; padding: 0in; font-size: 12px; }";
        style += "@media print {";
        style +=
          "  body { width: 8.5in; height: 11in; padding-top: 0.5in; padding-left: 0.21975in; padding-right: 0.21975in; box-sizing: border-box; }";
        style +=
          "  ul { display: grid; grid-template-columns: repeat(3, 2.625in); gap: 0in 0.14in; grid-auto-rows: 1in;  }";
        style += "  li { page-break-inside: avoid; }";
        style += "}";
        style += "</style>";

        var win = window.open("", "", "left=0, top=0, height=1000,width=1000");

        win.document.write("<html><head>");
        win.document.write("<title>Mailing List</title>");
        win.document.write(style); // <title> FOR PDF HEADER.
        win.document.write("</head>");
        win.document.write("<body>");
        win.document.write(transformedContent);
        win.document.write("</body></html>");
        console.log(document.getElementById("parcel-feature").innerHTML);
        console.log(win.document);
        win.document.close(); // CLOSE THE CURRENT WINDOW.

        win.print(); // PRINT THE CONTENTS.
      }

      function runBuffer(value) {
        console.log(detailsGeometry);
        let buffer = value;
        let unit = queryUnits;
        let bufferGeometry = detailsGeometry;

        const bufferResults = geometryEngine.buffer(
          detailsGeometry,
          buffer,
          unit
        );

        console.log(bufferResults);

        let bufferGraphicId = "uniqueBufferGraphicId"; // Unique identifier for the buffer graphic

        function addOrUpdateBufferGraphic(bufferResults) {
          const fillSymbol = {
            type: "simple-fill",
            color: [55, 150, 240, 0],
            outline: {
              color: [144, 110, 230],
              width: 2,
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
        }

        // Usage
        addOrUpdateBufferGraphic(bufferResults);
        queryDetailsBuffer(bufferResults);
        // const fillSymbol = {
        //   type: "simple-fill",
        //   color: [55, 150, 240, 0],
        //   outline: {
        //     // autocasts as new SimpleLineSymbol()
        //     color: [255, 255, 255],
        //     width: 1,
        //   },
        // };

        // const bufferGraphic = new Graphic({
        //   geometry: bufferResults,
        //   symbol: fillSymbol,
        // });
      }

      // runBuffer("100");

      function buildDetailsPanel(e) {
        let itemId = e.target.getAttribute("data-id");
        detailSelected = itemId;
        let location = e.target.getAttribute("location");

        console.log(itemId);

        // Find the object in the data array that has this uniqueId
        var matchedObject = firstList.find(function (item) {
          return item.uniqueId === itemId || item.GIS_LINK === itemId;
        });

        // if (matchedObject.length > 0) {
        //   return matchedObject[0];
        // }

        let locationVal =
          matchedObject.location === undefined ? "" : matchedObject.location;

        let locationUniqueId =
          matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;

        let locationGISLINK =
          matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;
        let locationCoOwner =
          matchedObject.Co_Owner === undefined ? "" : matchedObject.Co_Owner;
        let locationOwner =
          matchedObject.owner === undefined ? "" : matchedObject.owner;
        let locationMBL =
          matchedObject.MBL === undefined ? "" : matchedObject.MBL;
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
          matchedObject.Mail_State === undefined
            ? ""
            : matchedObject.Mail_State;
        let Mailing_Zip =
          matchedObject.Mailing_Zip === undefined
            ? ""
            : matchedObject.Mailing_Zip;
        let Total_Acres =
          matchedObject.Total_Acres === undefined
            ? ""
            : matchedObject.Total_Acres;
        let Parcel_Primary_Use =
          matchedObject.Parcel_Primary_Use === undefined
            ? ""
            : matchedObject.Parcel_Primary_Use;
        let Building_Use_Code =
          matchedObject.Building_Use_Code === undefined
            ? ""
            : matchedObject.Building_Use_Code;
        let Parcel_Type =
          matchedObject.Parcel_Type === undefined
            ? ""
            : matchedObject.Parcel_Type;
        let Design_Type =
          matchedObject.Design_Type === undefined
            ? ""
            : matchedObject.Design_Type;
        let Zoning =
          matchedObject.Zoning === undefined ? "" : matchedObject.Zoning;
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
          matchedObject.Sale_Price === undefined
            ? ""
            : matchedObject.Sale_Price;
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
        let Influence_Factor =
          matchedObject.Influence_Factor === undefined
            ? ""
            : matchedObject.Influence_Factor;
        let Influence_Type =
          matchedObject.Influence_Type === undefined
            ? ""
            : matchedObject.Influence_Type;
        let Land_Type =
          matchedObject.Land_Type === undefined ? "" : matchedObject.Land_Type;

        const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
        console.log(matchedObject);

        const detailsDiv = document.getElementById("detail-content");

        const details = document.createElement("div");
        details.innerHTML = "";
        details.classList.add("details");

        details.innerHTML = `
          <div>
              <p>
                  <span style="font-size:8pt;">Owners:&nbsp;</span><br>
                  <span style="font-size:8pt;"><strong>${locationOwner} ${locationCoOwner}</strong></span><br>
                  <span style="font-size:8pt;">Unique ID: <strong>${locationUniqueId}</strong></span><br>
                  <span style="font-size:8pt;">MBL: <strong>${locationMBL}</strong></span><br>
                  <span style="font-size:8pt;">Mailing Address:&nbsp;</span><br>
                  <span style="font-size:8pt;"><strong>${mailingAddress}</strong></span><br>
                  <span style="font-size:8pt;"><strong>${Mailing_City}${Mail_State} ${Mailing_Zip}</strong></span>
              </p>
          </div>
          <div>
              <img src="${imageUrl}"alt="Image of ${locationUniqueId}">
          </div>
          <div>
              <span style="font-size:8pt;">Total Acres: <strong>${Total_Acres}</strong></span><br>
              <span style="font-size:8pt;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span><br>
              <span style="font-size:8pt;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>
              <span style="font-size:8pt;">Parcel Type: <strong>${Parcel_Type}</strong></span><br>
              <span style="font-size:8pt;">Design Type: <strong>${Design_Type}</strong></span><br>
              <span style="font-size:8pt;">Zone: <strong>${Zoning}</strong></span><br>
              <span style="font-size:8pt;">Nhbd: <strong>${Neighborhood}</strong></span><br>
              <span style="font-size:8pt;">Land Rate: <strong>${Land_Type_Rate}</strong></span><br>
              <span style="font-size:8pt;">Functional Obsolescence: <strong>${Functional_Obs}</strong></span><br>
              <span style="font-size:8pt;">External Obsolescence: <strong>${External_Obs}</strong></span><br>
              &nbsp;
          </div>
          
          <div>
              <span style="font-size:8pt;">Latest Qualified Sale:&nbsp;</span><br>
              <span style="font-size:8pt;">Sold on: <strong>${Sale_Date}</strong></span><br>
              <span style="font-size:8pt;">Sale Price: <strong>${Sale_Price}</strong></span><br>
              <span style="font-size:8pt;">Volume/Page: <strong>${Vol_Page}</strong></span><br>
              &nbsp;
          </div>
        
          <div>
              <span style="font-size:8pt;">Valuations:&nbsp;</span><br>
              <span style="font-size:8pt;">Asssessment: <strong>${Assessed_Total}</strong></span><br>
              <span style="font-size:8pt;">Appraised: <strong>${Appraised_Total}</strong></span><br>
              &nbsp;
          </div>
         
        `;

        // <div>
        //     <span style="font-size:8pt;">Influence Info: Influence Factor / Influence Type / Land Type&nbsp;</span><br>
        //     <span style="font-size:8pt;"><strong>{expression/expression1}</strong></span><br>
        //     &nbsp;
        // </div>

        detailsDiv.appendChild(details);
      }

      function zoomToFeature(itemId) {
        console.log(itemId);
        let matchingObject = firstList.filter(
          (obj) => obj.GIS_LINK == itemId || obj.Uniqueid == itemId
        );

        if (matchingObject) {
          matchingObject.forEach(function (feature) {
            console.log(feature);
            if (feature["geometry"] != null) {
              detailsGeometry = feature["geometry"];
              view.goTo(detailsGeometry);

              const fillSymbol = {
                type: "simple-fill",
                color: [222, 49, 99, 0.7],
                outline: {
                  // autocasts as new SimpleLineSymbol()
                  color: [255, 255, 255],
                  width: 2,
                },
              };

              const polygonGraphic = new Graphic({
                geometry: detailsGeometry,
                symbol: fillSymbol,
              });

              view.graphics.addMany([polygonGraphic]);

              console.log(view.graphics);
            }
          });
        }
      }
    });
  }

  const buildAbuttersPanel = function (e) {
    let itemSelected = detailSelected;

    var matchedObject = firstList.find(function (item) {
      return (
        detailSelected.uniqueId === itemSelected ||
        item.GIS_LINK === itemSelected
      );
    });

    // if (matchedObject.length > 0) {
    //   return matchedObject[0];
    // }

    // let locationVal =
    //   matchedObject.location === undefined ? "" : matchedObject.location;

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
    // listItem.setAttribute("location", locationVal);

    listGroup.appendChild(listItem);
    abuttersDiv.appendChild(listGroup);

    // $("#selected-feature").html = "Abutters";
  };

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
        $("#results-div").css("left", "0px");
        $("#sidebar2").css("left", "-350px");
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide();
        $("#abutters-content").hide();
        $("#abutters-content").hide();
        $("#selected-feature").empty();
        $("#parcel-feature").empty();
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
      $("#featureWid").empty();
      $("#abutters-content").hide();
      $("#selected-feature").empty();
      $("#parcel-feature").empty();
      $("#total-results").show();
      $("#backButton").hide();

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
  // });
});
