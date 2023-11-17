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
    $("#results-div").css("left", "0px");
    $("#sidebar2").css("left", "-350px");
    // $("#right-arrow").show();
    // $("#left-arrow").hide();
    $("#right-arrow-2").show();
    $("#left-arrow-2").hide();
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

        $("#featureWid").show();
        $("#result-btns").show();
        $("#details-btns").hide();
        // $("#abutters-content").hide();
        $("#dropdown").toggleClass("expanded");
        $("#dropdown").show();
        $("#sidebar2").css("left", "0px");
        $("#results-div").css("left", "350px");
        // $("#left-arrow").show();
        // $("#right-arrow").hide();
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
          $("#detail-content").empty();
          $("#backButton-div").css("padding-top", "0px");
          // $("#dropdown").css("height", "55%");
          populateCondo(e);
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
          $("#abutters-content").hide();
          // $("#dropdown").css("height", "85%");
        });
      });

      $(document).ready(function () {
        $("#abutters").on("click", function () {
          $("#detailBox").hide();
          $("#featureWid").hide();
          $("#result-btns").hide();
          $("#total-results").hide();
          $("#details-btns").hide();
          $("#abutters-content").show();

          $("#backButton").show();
          $("#backButton-div").css("padding-top", "78px");

          buildAbuttersPanel();
          // $("#backButton").css("margin-top", "110px");
        });
      });

      let value = document.getElementById("buffer-value");

      $("#increase").on("click", function () {
        value.value = parseInt(value.value) + 1;
        console.log(value.innerHTML);
        // $("#buffer-value").innerHTML = valueElement.textContent;
      });

      $("#decrease").on("click", function () {
        value.value = parseInt(value.value) - 1;
        console.log(value.innerHTML);
        // valueElement.textContent = parseInt(valueElement.textContent) - 1;
        // $("#buffer-value").innerHTML = valueElement.textContent;
      });

      function populateCondo(e) {
        let itemId = e.target.getAttribute("data-id");
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
                  <span style="font-size:8pt;"><strong>${locationVal} ${locationCoOwner}</strong></span><br>
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
            let geometry = feature["geometry"];
            view.goTo(geometry);

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
              geometry: geometry,
              symbol: fillSymbol,
            });

            view.graphics.addMany([polygonGraphic]);

            console.log(view.graphics);
          });
        }
      }
    });
  }

  const buildAbuttersPanel = function () {
    $("#selected-feature").html = "Abutters";
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
        $("#results-div").css("left", "0px");
        $("#sidebar2").css("left", "-350px");
        // $("#right-arrow").show();
        // $("#left-arrow").hide();
        // $("#right-arrow").hide();
        // $("#left-arrow").show();
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide();
        // $("#abutters-content").hide();
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
      // You can handle the search action here, for instance, if you want to fetch more details based on a selected suggestion or search term
    });

  // Hide suggestions when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.id !== "searchInput") {
      document.getElementById("suggestions").style.display = "none";
    }
    // $("#featureWid").empty();
  });

  document
    .getElementById("searchButton")
    .addEventListener("click", function () {
      $("#featureWid").empty();
      runQuery();
    });

  // $(document).ready(function () {
  // $("#dropdownMenuButton").on("click", function () {
  //   $("#dropdown").toggleClass("expanded");
  //   if ($("#dropdown").hasClass("expanded")) {
  //     $("#up-arrow").show();
  //     $("#down-arrow").hide();
  //   } else {
  //     $("#down-arrow").show();
  //     $("#up-arrow").hide();
  //   }
  // });

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

  $(document).ready(function () {
    $("#side-Exp2").on("click", function () {
      $("#sidebar2").toggleClass("collapsed");

      // Check if the sidebar has the class 'collapsed' and adjust the 'right' property of #small-div accordingly
      // Toggle the 'right' CSS property for #small-div
      if ($("#sidebar2").hasClass("collapsed")) {
        $("#results-div").css("left", "0px");
        $("#sidebar2").css("left", "-350px");
        $("#right-arrow-2").show();
        $("#left-arrow-2").hide(); // Hide left arrow
        // Show right arrow
      } else {
        $("#results-div").css("left", "350px");
        $("#sidebar2").css("left", "0px");
        $("#left-arrow-2").show(); // Show left arrow
        $("#right-arrow-2").hide();
        // $(".sidebar2").show(); // Hide right arrow
      }
    });
  });
  // });
});
