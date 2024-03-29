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
  "esri/widgets/DistanceMeasurement2D",
  "esri/widgets/AreaMeasurement2D",
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
  View,
  DistanceMeasurement2D,
  AreaMeasurement2D
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
    zoom: 12.5,
    popupEnabled: false,
    ui: {
      components: ["attribution"],
    },
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
      creationMode: "update",
    });
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
  let uniqueArray;
  let highlightResponse;
  let searchResults;
  let lasso = false;
  let select = false;
  let bufferGraphicId;
  let polygonGraphics;
  let noCondosParcelGeom;
  let isGisLink;
  let isClickEvent = false;
  let detailsChanged = {
    isChanged: false,
    item: "",
  };
  let DetailsHandle;
  let clickHandle;
  let removeFromList;
  let regSearch = false;

  let value = document.getElementById("buffer-value");
  const clearBtn = document.getElementById("clear-btn");

  let oldExtent = view.extent;
  let oldScale = view.scale;
  let oldZoom = view.zoom;
  let valueToRemove;
  let handleUsed;
  let detailsHandleUsed;

  reactiveUtils.watch(
    () => [view.zoom, view.extent, view.scale],
    ([zoom, extent, scale], [wasStationary]) => {
      if (zoom) {
        if (zoom !== oldZoom) {
          oldZoom = zoom;

          console.log(`old zoom is: ${oldZoom} and new ${zoom}`);
          // currScaleLabel.innerHTML =
          //   `<span class="title">Current Scale</span><b>` + (Math.round(scale * 100) / 100).toFixed(4) + `</b>`;
        }

        if (!noCondosLayer.visible && !CondosLayer.visible) {
          if (Number(zoom) > 15) {
            if (sessionStorage.getItem(key) === "no") {
              noCondosLayer.visible = true;
            } else {
              CondosLayer.visible = true;
            }

            if (DetailsHandle) {
              DetailsHandle.remove();
            }
            if (clickHandle) {
              clickHandle.remove();
            }

            if (
              handleUsed == "click" ||
              handleUsed == "details" ||
              handleUsed == "none yet"
            ) {
              $("#select-button").removeClass("btn-warning");
              return;
            } else {
              clickHandle = view.on("click", handleClick);
              $("#lasso").removeClass("btn-warning");
              $("#select-button").addClass("btn-warning");
              select = true;
            }

            // if (sessionStorage.getItem(key) === "no") {
            //   noCondosLayer.visible = true;
            // } else {
            //   CondosLayer.visible = true;
            // }
            // $("#lasso").removeClass("btn-warning");
            // $("#select-button").addClass("btn-warning");
            // select = true;
          }
        }
        // if (extent !== oldExtent) {
        //   console.log(
        //     `old extent is: ${oldExtent} and new extent is: ${extent}`
        //   );

        // }
      } else if (wasStationary) {
        oldExtent = extent;
        oldScale = scale;
        oldZoom = zoom;
      }
      return "";
    }
  );

  let measureContainer = document.getElementById("topbar");
  view.ui.add(measureContainer, "bottom-right");

  let activeWidget1 = null;
  document
    .getElementById("distanceButton")
    .addEventListener("click", function () {
      setActiveWidget(null);
      if (!this.classList.contains("active")) {
        setActiveWidget("distance");
        // $("#distanceButton").addClass("btn-warning");
      } else {
        setActiveButton(null);
        // $("#distanceButton").removeClass("btn-warning");
      }
    });

  document.getElementById("areaButton").addEventListener("click", function () {
    setActiveWidget(null);
    if (!this.classList.contains("active")) {
      setActiveWidget("area");
      // $("#areaButton").addClass("btn-warning");
    } else {
      setActiveButton(null);
      // $("#areaButton").removeClass("btn-warning");
    }
  });

  function setActiveWidget(type) {
    switch (type) {
      case "distance":
        activeWidget1 = new DistanceMeasurement2D({
          view: view,
          unit: "feet",
        });
        // skip the initial 'new measurement' button
        activeWidget1.viewModel.start();

        if (!DetailsHandle && !clickHandle) {
          handleUsed = "none yet";
        }

        if (DetailsHandle) {
          try {
            handleUsed = "details";
            DetailsHandle.remove();
            console.log(handleUsed);
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        if (clickHandle) {
          try {
            handleUsed = "click";
            clickHandle.remove();
            console.log(handleUsed);
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        if (detailsHandleUsed == "detailClick") {
          handleUsed = "details";
        }

        // handleUsed = "none yet";

        if (activeWidget1 && activeWidget1.viewModel) {
          // Listen for the "measure-end" event on the viewModel
          activeWidget1.viewModel.watch("state", function (state) {
            if (state === "measured") {
              if (handleUsed == "click") {
                clickHandle = view.on("click", handleClick);
              } else if (handleUsed == "details") {
                DetailsHandle = view.on("click", handleDetailsClick);
                detailsHandleUsed == "";
              } else {
              }
              // The measurement is complete
              console.log("Measurement completed");

              // Your custom logic here
              // For example, you could display the measurement result in a custom UI element,
              // log it, or store it for further processing.
            }
          });
        }

        view.ui.add(activeWidget1, "bottom-right");
        setActiveButton(document.getElementById("distanceButton"));
        break;
      case "area":
        activeWidget1 = new AreaMeasurement2D({
          view: view,
          unit: "square-us-feet",
        });

        activeWidget1.viewModel.start();

        if (!DetailsHandle && !clickHandle) {
          handleUsed = "none yet";
        }
        if (DetailsHandle) {
          try {
            handleUsed = "details";
            DetailsHandle.remove();
            console.log(handleUsed);
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        if (clickHandle) {
          try {
            handleUsed = "click";
            clickHandle.remove();
            console.log(handleUsed);
          } catch (error) {
            console.error("Failed to remove DetailsHandle", error);
          }
        }

        if (detailsHandleUsed == "detailClick") {
          handleUsed = "details";
        }

        // handleUsed = "none yet";

        // Assuming activeWidget1 is an instance of DistanceMeasurement2D or AreaMeasurement2D
        if (activeWidget1 && activeWidget1.viewModel) {
          // Listen for the "measure-end" event on the viewModel
          activeWidget1.viewModel.watch("state", function (state) {
            if (state === "measured") {
              if (handleUsed == "click") {
                clickHandle = view.on("click", handleClick);
              } else if (handleUsed == "details") {
                DetailsHandle = view.on("click", handleDetailsClick);
                detailsHandleUsed == "";
              } else {
              }
              // The measurement is complete
              console.log("Measurement completed");

              // Your custom logic here
              // For example, you could display the measurement result in a custom UI element,
              // log it, or store it for further processing.
            }
          });
        }
        // detailsHandleUsed == "";
        view.ui.add(activeWidget1, "bottom-right");

        setActiveButton(document.getElementById("areaButton"));
        break;
      case null:
        if (activeWidget1) {
          view.ui.remove(activeWidget1);
          activeWidget1.destroy();
          activeWidget1 = null;
          detailsHandleUsed == "";
        }
        break;
    }
  }

  function setActiveButton(selectedButton) {
    // focus the view to activate keyboard shortcuts for sketching
    view.focus();
    // detailsHandleUsed == "";
    let elements = Array.from(document.getElementsByClassName("active"));
    for (let i = 0; i < elements.length; i++) {
      elements[i].classList.remove("active", "btn-warning");
      // elements[i].classList.remove("btn-warning");
      elements[i].classList.add("bg-info");
    }
    if (selectedButton) {
      selectedButton.classList.add("active", "btn-warning");
      selectedButton.classList.remove("bg-info");
      // selectedButton.classList.add("btn-warning");
    }
  }

  let noCondosLayer = new FeatureLayer({
    url: "https://services1.arcgis.com/j6iFLXhyiD3XTMyD/arcgis/rest/services/CT_Washington_Adv_Viewer_Parcels_NOCONDOS/FeatureServer/0",
    visible: false,
    popupEnabled: true,

    defaultPopupTemplateEnabled: true,
  });

  noCondosLayer.renderer = {
    type: "simple",
    symbol: {
      type: "simple-fill",
      color: [255, 255, 255, 0],
      outline: {
        width: 1,
        color: [169, 169, 169, 1],
      },
    },
  };

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

  // Updated function to add a layer to the pick list with click event handling
  function addLayerToPickList(layer, container) {
    // Assuming the icon is initially set to "plus" for all items

    if (
      layer.type === "graphics" ||
      layer.title == "Tax Map Annotation" ||
      layer.title == "Road Centerline"
    ) {
      return;
    } else {
      var icon = "plus";

      // Create the pick list item and action for each layer
      var item =
        $(`<calcite-pick-list-item label="${layer.title}" value="${layer.id}" description="${layer.type}">
      <calcite-action id="action-${layer.id}" slot="actions-end" icon="${icon}" text="${layer.title}"></calcite-action>
    </calcite-pick-list-item>`);

      // Append the item to the specified container
      container.append(item);

      // Add click event listener for the action
      // $(`#action-${layer.id}`).on("click", function () {
      //   // Toggle visibility
      //   layer.visible = !layer.visible;

      //   // Swap the icon based on the new visibility state
      //   var newIcon = layer.visible ? "minus" : "plus";
      //   $(this).attr("icon", newIcon);

      // });
    }
  }

  // Function to process and add layers, including handling group layers
  function processLayers(layers, container) {
    layers.forEach(function (layer) {
      if (layer.type === "group") {
        // For group layers, create a calcite-pick-list-group
        var groupTitle = layer.title || "Industry"; // Default title or layer title
        var groupContainer = $(
          `<calcite-pick-list-group group-title="${groupTitle}"></calcite-pick-list-group>`
        );

        // Recursively process sublayers, adding them to this group
        processLayers(layer.layers.items, groupContainer);

        // Append the group container to the main container
        container.append(groupContainer);
      } else {
        // For non-group layers, directly add them to the pick list or current group
        addLayerToPickList(layer, container);
      }
    });
  }

  function toggleLayerVisibility(layerId, actionElement) {
    // Find the layer in the webmap
    let layer = webmap.findLayerById(layerId);

    if (layer) {
      // Toggle the layer's visibility
      layer.visible = !layer.visible;

      // If the layer is part of a group layer, you might need to toggle each sublayer
      if (layer.type === "group") {
        layer.layers.forEach((subLayer) => {
          subLayer.visible = layer.visible;
        });
      }

      // Update the action icon based on the new visibility state
      actionElement.attr("icon", layer.visible ? "minus" : "plus");

      // Optionally, refresh the layer or the view if necessary
      // view.refresh(); // Uncomment if needed
    }
  }

  $("#layerList").on("click", "calcite-action", function (event) {
    // Prevent the default action
    event.preventDefault();

    // Get the layer ID stored in the value of the pick-list-item
    let layerId = $(this).closest("calcite-pick-list-item").attr("value");

    // Toggle the layer visibility and icon
    toggleLayerVisibility(layerId, $(this));
  });

  // Assuming your webmap is loaded and the view is ready
  view.when(function () {
    // Assuming you have a <calcite-pick-list> with an id="layerList"
    var pickListContainer = $("#layerList");

    // Get the layers from the webmap, might be different based on your actual map setup
    var layers = webmap.layers.items; // Assuming webmap is your WebMap instance

    // Process each layer and add it to the pick list
    processLayers(layers, pickListContainer);
  });

  // view.when(() => {
  //   // Wait for the map to load
  //   const layers = webmap.layers.toArray();

  //   layers.forEach((layer) => {
  //     // For each layer in the web map, create a new pick list item
  //     const item = $(`
  //     <calcite-pick-list-item label="${layer.title}" description="${layer.id}" value="${layer.id}">
  //       <calcite-action slot="actions-end" icon="layer" text="Mountain layer"></calcite-action>
  //     </calcite-pick-list-item>
  //   `);

  //     $("#layerList").append(item);
  //   });
  // });
  // });

  //   let whereClause = `
  //   1=1

  // `;

  function generateFilters() {
    let query = noCondosLayer.createQuery();
    query.where = `1=1`;
    query.returnDistinctValues = true;
    query.returnGeometry = false; // Adjust based on your needs
    query.outFields = ["Street_Name"];

    CondosLayer.queryFeatures(query).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#streetFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Street_Name; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        // Create a new Calcite ComboBox item
        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });

    let query2 = noCondosLayer.createQuery();
    query2.where = `1=1`;
    query2.returnDistinctValues = true;
    query2.returnGeometry = false; // Adjust based on your needs
    query2.outFields = ["Owner"];

    CondosLayer.queryFeatures(query2).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#ownerFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Owner; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });

    let query3 = noCondosLayer.createQuery();
    query3.where = `1=1`;
    query3.returnDistinctValues = true;
    query3.returnGeometry = false; // Adjust based on your needs
    query3.outFields = ["Parcel_Type"];

    CondosLayer.queryFeatures(query3).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#propertyFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Parcel_Type; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });

    let query4 = noCondosLayer.createQuery();
    query4.where = `1=1`;
    query4.returnDistinctValues = true;
    query4.returnGeometry = false; // Adjust based on your needs
    query4.outFields = ["Building_Type"];

    CondosLayer.queryFeatures(query4).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#buildingFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Building_Type; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        // Create a new Calcite ComboBox item
        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });

    let query5 = noCondosLayer.createQuery();
    query5.where = `1=1`;
    query5.returnDistinctValues = true;
    query5.returnGeometry = false; // Adjust based on your needs
    query5.outFields = ["Building_Use_Code"];

    CondosLayer.queryFeatures(query5).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#buildingUseFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Building_Use_Code; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });

    let query6 = noCondosLayer.createQuery();
    query6.where = `1=1`;
    query6.returnDistinctValues = true;
    query6.returnGeometry = false; // Adjust based on your needs
    query6.outFields = ["Design_Type"];

    CondosLayer.queryFeatures(query6).then(function (response) {
      console.log(response);

      var features = response.features;
      var comboBox = $("#designTypeFilter");

      // let streetFilteEle = $("#streetFilter");
      features.forEach(function (feature) {
        var name = feature.attributes.Design_Type; // Assuming 'Name' is the field you want to display
        // var id = feature.attributes.OBJECTID; // Assuming 'Id' is the value you want to use

        var newItem;
        if (name == "" || null || undefined) {
          return;
        } else {
          // Create a new Calcite ComboBox item
          newItem = $(
            '<calcite-combobox-item value="' +
              name +
              '" text-label="' +
              name +
              '"></calcite-combobox-item>'
          );
        }

        // Append the new item to the ComboBox
        comboBox.append(newItem);
      });
    });
  }

  generateFilters();

  // totalResults = response.features;
  // addResultGraphics(totalResults);

  function clearContents(e, string) {
    // console.log(e.target.value);
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }
    if (DetailsHandle) {
      try {
        DetailsHandle.remove();
      } catch (error) {
        console.error("Failed to remove DetailsHandle", error);
      }
    }
    // $("#lasso").removeClass("btn-warning");
    // $("#select-button").removeClass("btn-warning");
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
    // $("#select-button").prop("disabled", false);

    // To disable
    // $("#select-button").prop("disabled", false);
    // $("#lasso").prop("disabled", false);
    // $("#select-button").removeClass("disabled");
    $("#select-button").attr("title", "Add to Selection Enabled");

    // $("#details-conetnt").hide();

    let suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";

    // sketch.cancel();
    $("#featureWid").empty();

    view.graphics.removeAll();
    polygonGraphics = [];
  }

  function buildResultsPanel(
    features,
    polygonGraphics,
    e,
    pointGraphic,
    pointLocation,
    pointGisLink
  ) {
    $("status-loader").show();
    $("#featureWid").empty();

    let seenIds = new Set();
    let seenUID = new Set();

    // Step 1: Filter for unique objectid with geometry
    uniqueArray = firstList.filter((obj) => {
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

    uniqueArray.sort((a, b) =>
      a.owner.toLowerCase().localeCompare(b.owner.toLowerCase())
    );

    function removeDups(pointGraphic, pointLocation, pointGisLink) {
      uniqueArray = uniqueArray.filter((item) => item.objectid != pointGraphic);
      uniqueArray = uniqueArray.filter(
        (item) => item.location != pointLocation
      );
      firstList = firstList.filter((item) => item.objectid != pointGraphic);
      firstList = firstList.filter((item) => item.location != pointLocation);

      $(`li[object-id="${pointGraphic}"]`).remove();

      if (sessionStorage.getItem(key) == "no") {
        firstList = firstList.filter((item) => item.GIS_LINK != pointGisLink);
        uniqueArray = uniqueArray.filter(
          (item) => item.GIS_LINK != pointGisLink
        );
        $(`li[data-id="${pointGisLink}"]`).remove();
      }
    }

    removeDups(pointGraphic, pointLocation, pointGisLink);

    const featureWidDiv = document.getElementById("featureWid");
    const listGroup = document.createElement("ul");

    uniqueArray.forEach(function (feature) {
      // console.log(feature);

      let objectID = feature.objectid;
      let locationVal = feature.location;
      let locationUniqueId =
        feature.uniqueId === undefined ? feature.GIS_LINK : feature.uniqueId;
      let locationGISLINK = feature.GIS_LINK;
      let locationCoOwner = feature.coOwner;
      let locationOwner = feature.owner;
      let locationMBL = feature.MBL;
      let locationGeom = feature.geometry;

      const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;

      listGroup.classList.add("row");
      listGroup.classList.add("list-group");

      const listItem = document.createElement("li");
      const imageDiv = document.createElement("li");
      imageDiv.innerHTML = `<img object-id="${objectID}" src="${imageUrl}" alt="Image of ${locationUniqueId}" >`;
      listItem.classList.add("list-group-item", "col-9");
      listItem.classList.add("search-list");
      imageDiv.setAttribute("object-id", objectID);
      imageDiv.setAttribute("data-id", locationGISLINK);

      imageDiv.classList.add("image-div", "col-3");

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
        listItemHTML = `  ${locationVal} <br>  ${locationUniqueId}  ${locationMBL} <br> ${locationOwner}<div class="removable-div"; style="position: absolute; color: red; right: 0; padding-right: 5px";>No Geometry</div>`;
      } else {
        listItemHTML = ` ${locationVal} <br> ${locationUniqueId}  ${locationMBL} <br>  ${locationOwner} & ${locationCoOwner}`;
      }

      // Append the new list item to the list
      listItem.innerHTML += listItemHTML;
      listItem.setAttribute("object-id", objectID);
      listItem.setAttribute("data-id", locationGISLINK);

      listGroup.appendChild(imageDiv);
      listGroup.appendChild(listItem);
    });

    searchResults = uniqueArray.length;

    $(document).ready(function () {
      $("#total-results").show();
      $("#total-results").html(searchResults + " results returned");
    });

    // createExportList();

    $("#backButton").hide();
    $("#detailsButton").hide();
    $("#filterDiv").hide();
    $("#layerListDiv").hide();
    $("#result-btns").hide();
    $("#details-btns").hide();
    $("#featureWid").show();
    $("#detail-content").empty();
    $("#dropdown").toggleClass("expanded");
    $("status-loader").hide();
    $("#dropdown").show();
    $("#sidebar2").css("left", "0px");
    $("#results-div").css("left", "350px");
    $("#left-arrow-2").show();
    $("#right-arrow-2").hide();
    $("#results-div").css("height", "200px");
    // valueToRemove = 0;

    if (uniqueArray.length < 1) {
      $("#exportSearch").hide();
    } else {
      $("#exportSearch").show();
    }

    $("#exportResults").hide();

    $(".spinner-container").hide();
    $(`li[object-id="${pointGraphic}"]`).remove();
    // $("#select-button").addClass("disabled");
    // if (select) {
    //   $("#select-button").prop("disabled", false);
    // } else {
    //   $("#select-button").prop("disabled", true);
    // }

    // $("#lasso").prop("disabled", false);

    listGroup.addEventListener("click", function (event) {
      console.log(`list group clicked`);
      if (clickHandle) {
        clickHandle.remove();
      }

      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      $("#select-button").attr("title", "Select Enabled");
      // clickHandle.remove();
      // Check if the clicked element is an li or a descendant of an li
      let targetElement = event.target.closest("li");

      // If it's not an li, exit the handler
      if (!targetElement) return;

      // Now you can handle the click event as you would in the individual event listener
      let itemId = targetElement.getAttribute("data-id");
      let objectID = targetElement.getAttribute("object-id");
      // buildZoomToFeature(objectID, polygonGraphics, itemId);
      zoomToFeature(objectID, polygonGraphics, itemId);
      // DetailsHandle = view.on("click", handleDetailsClick);
      // clickHandle.remove();
      $("#details-spinner").show();
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
      $("#exportResults").hide();
      $("#results-div").css("height", "150px");
      $("#backButton-div").css("padding-top", "0px");

      buildDetailsPanel(objectID, itemId);
    });
    featureWidDiv.appendChild(listGroup);
  }

  function processFeatures(features, polygonGraphics, e, removeFromList) {
    let pointGraphic;
    let pointLocation;
    let pointGisLink;
    // console.log(firstList);
    function createList(features) {
      features.forEach(function (feature) {
        // PUT BACK TO FILTER OUT EMPTY OWNERS
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

          let Prior_Assessment_Year =
            feature.attributes["Prior_Assessment_Year"];
          let Prior_Assessed_Total = feature.attributes["Prior_Assessed_Total"];
          let Prior_Appraised_Total =
            feature.attributes["Prior_Appraised_Total"];
          firstList.push(
            new Parcel(
              objectId,
              locationVal,
              locationUniqueId,
              locationGISLINK,
              locationCoOwner,
              locationOwner,
              locationMBL,
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
              Prior_Assessment_Year,
              Prior_Assessed_Total,
              Prior_Appraised_Total
            )
          );
        }
      });
    }

    if (e) {
      // if (features.length <= 1) {
      pointGraphic = features[0].attributes.OBJECTID;
      pointLocation = features[0].attributes.Location;
      pointGisLink = features[0].attributes.GIS_LINK;

      const count = firstList.filter((g) => g.objectid === pointGraphic).length;

      if (count >= 1) {
        buildResultsPanel(
          features,
          polygonGraphics,
          e,
          pointGraphic,
          pointLocation,
          pointGisLink
        );
      } else {
        createList(features);
        buildResultsPanel(features);
      }
    } else {
      if (!features) {
        buildResultsPanel("", polygonGraphics, e, pointGraphic);
        // removeDups(pointGraphic)
      } else if (features.length > 1) {
        if (!lasso) {
          features = features.filter(
            (item) => item.attributes.ACCOUNT_TYPE != "CONDOMAIN"
          );
        }
        createList(features);
      } else {
        createList(features);
      }
    }

    if (e) {
      return;
    } else {
      buildResultsPanel(
        features,
        polygonGraphics,
        e,
        pointGraphic,
        pointLocation,
        pointGisLink
      );
    }
  }

  let features;

  function addPolygons(
    polygonGeometries,
    graphicsLayer,
    ClickEvent,
    tableSearch
  ) {
    let count;
    let countCondos;

    // formats of queries from table and feature layer different
    if (tableSearch) {
      features = polygonGeometries;
    } else {
      features = polygonGeometries.features;
    }

    let polygonGraphics2 = [];
    let bufferGraphicId;
    let pointGisLink;

    var fillSymbol = {
      type: "simple-fill",
      color: [0, 255, 255, 0.25],
      outline: {
        color: [102, 235, 235, 0.6],
        width: 2,
      },
    };

    // means its been a click event
    // triggers when details or click handle selected and used to select parcels
    // this only runs on click handle, shouldn't be used for details?
    // removed from details handle logic for now
    // they run separate logic
    if (ClickEvent) {
      // goes through and creates a graphic on clicked polygon
      // then removes duplicate if a user clicked on an existing polygon
      // then at the end adds it back
      // really just concerned with click logic

      let array = [];
      console.log(polygonGeometries.features[0].attributes.OBJECTID);
      bufferGraphicId = polygonGeometries.features[0].attributes.OBJECTID;
      pointGisLink = features[0].attributes.GIS_LINK;

      const graphic = new Graphic({
        geometry: features[0].geometry,
        symbol: fillSymbol,
        id: bufferGraphicId,
      });

      polygonGraphics2.push(graphic);

      // somethings not write here
      // maybe not getting removed from firstList
      // so if you remove graphic and click again, firstList still has it
      // so count > 1 and removes its again not adding

      // getting added to list first now
      // so its finding the same value that its trying to add as a graphic
      // this logic wont work as is it will always keep removing graphic
      // maybe use graphic instead of firstList here

      countCondos = firstList.filter((g) => g.GIS_LINK === pointGisLink).length;

      // count = view.graphics.findIndex((g) => g.id === bufferGraphicId);

      count = view.graphics.some((g) => g.id === bufferGraphicId);

      if (count) {
        const firstIndex = view.graphics.findIndex(
          (g) => g.id === bufferGraphicId
        );

        view.graphics.removeAt(firstIndex);

        const graphicIndex = polygonGraphics.findIndex(
          (g) => g.id === bufferGraphicId
        );

        // polygonGraphics.slice(graphicIndex, 1);
        polygonGraphics.splice(graphicIndex, 1);
        // console.log(polygonGraphics);

        // will zoom to extent of adding and deselecting
        // view.goTo(polygonGraphics);
      } else {
        // let id = polygonGraphics2[0].id;
        console.log(polygonGraphics);
        graphicsLayer.addMany(polygonGraphics2);
        // if (polygonGraphics.length >= 1) {
        //   polygonGraphics = [...polygonGraphics, polygonGraphics2[0]];
        // }
      }
      // will zoom to extent of adding and deselecting
      // view.goTo(polygonGraphics);
    } else {
      // no a click event
      // search with only something in table
      // bufferGraphicId = "addPolygons";

      if (tableSearch) {
        // First, filter out features without geometry
        const featuresWithGeometry = features.filter(
          (feature) => feature.geometry
        );

        // Now, map each feature with geometry to a new graphic and add it to the polygonGraphics2 array
        featuresWithGeometry.forEach((feature) => {
          const bufferGraphicId = feature.attributes.OBJECTID;

          const graphic = new Graphic({
            geometry: feature.geometry,
            symbol: fillSymbol,
            id: bufferGraphicId,
          });

          polygonGraphics2.push(graphic);
        });

        if (polygonGraphics2.length >= 1) {
          graphicsLayer.addMany(polygonGraphics2);
        }
        view.goTo(polygonGraphics);
      } else {
        regSearch = true;
        // regular search polygons added here
        features
          .map(function (feature) {
            bufferGraphicId = feature.attributes.OBJECTID;
            if (!feature.geometry || tableSearch) {
              console.error("Feature does not have geometry:", feature);
              return null; // Skip this feature as it has no geometry
            }
            const graphic = new Graphic({
              geometry: feature.geometry,
              symbol: fillSymbol,
              id: bufferGraphicId,
            });
            polygonGraphics2.push(graphic);
          })
          .filter((graphic) => graphic !== null);

        if (polygonGraphics2.length >= 1) {
          graphicsLayer.addMany(polygonGraphics2);
        }

        view.goTo(polygonGraphics);
      }
    }

    // if (polygonGraphics2.length >= 1) {
    //   graphicsLayer.addMany(polygonGraphics2);
    // }

    // if (!polygonGraphics && !ClickEvent) {
    //   polygonGraphics = polygonGraphics2;
    // } else {
    //   polygonGraphics = polygonGraphics2;
    // }

    if (!polygonGraphics) {
      polygonGraphics = polygonGraphics2;
    }

    if (ClickEvent && !count) {
      let id = polygonGraphics2[0].id;
      polygonGraphics = [...polygonGraphics, polygonGraphics2[0]];
      removeFromList = id;
    }
    if (regSearch) {
      polygonGraphics = polygonGraphics2;
    }
    count = false;
    regSearch = false;
    // count = 0;
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
    // $("#select-button").prop("disabled", true);
    // $("#select-button").addClass("disabled");

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
            id: feature.attributes.OBJECTID,
          });
        })
        .filter((graphic) => graphic !== null);

      // Add all polygon graphics to the graphics layer
      graphicsLayer.addMany(polygonGraphics);
      sketchGL.removeAll();
      processFeatures(finalResults, polygonGraphics);
      lasso = false;
    }
  }

  $("#lasso").on("click", function (e) {
    lasso = !lasso;
    select = false;
    $("#select-button").removeClass("btn-warning");
    $("#select-button").prop("disabled", false);

    if (lasso && !select) {
      sketch.create("polygon");

      $("#select-button").removeClass("btn-warning");
      $("#lasso").addClass("btn-warning");
    } else {
      sketch.cancel();
      $("#lasso").removeClass("btn-warning");
      $("#lasso").addClass("btn-info");
      $("#select-button").removeClass("btn-warning");
      $("#select-button").addClass("btn-info");
    }

    clearContents(e, "no");
    sketchGL.removeAll();

    // Check if the key exists in sessionStorage
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }
    // if (lasso) {
    //   sketch.create("polygon");
    // } else {
    //   sketch.cancel();
    // }
  });

  // listen to create event, only respond when event's state changes to complete
  sketch.on("create", function (event) {
    if (event.state === "complete") {
      sketchGL.remove(event.graphic);
      sketchGL.add(event.graphic);
      highlightLasso(event.graphic.geometry);
      // lasso = true;
      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      if (clickHandle) {
        clickHandle.remove();
      }

      clickHandle = view.on("click", handleClick);
      $("#lasso").removeClass("btn-warning");
      $("#lasso").addClass("btn-info");
      $("#select-button").addClass("btn-warning");
    }
  });

  $("#select-button").on("click", function (e) {
    sketch.cancel();
    select = !select;
    if (!select) {
      clearContents();
    }
    lasso = false;

    if (select && !lasso) {
      // $("#select-button").removeClass("btn-info");
      // $("#lasso").removeClass("btn-info");

      $("#lasso").removeClass("btn-warning");
      $("#select-button").addClass("btn-warning");
    } else {
      $("#select-button").removeClass("btn-warning");
    }

    // $("#lasso").removeClass("btn-warning");
    // $("#select-button").addClass("btn-warning");
    // $("#lasso").prop("disabled", true);

    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }

    // works for search and in details page
    if (select && !lasso) {
      if (clickHandle) {
        try {
          clickHandle.remove();
        } catch (error) {
          console.error("Failed to remove clickHandle", error);
        }
      }
      if (DetailsHandle) {
        try {
          DetailsHandle.remove();
        } catch (error) {
          console.error("Failed to remove DetailsHandle", error);
        }
      }
      // DetailsHandle = view.on("click", handleDetailsClick);
      clickHandle = view.on("click", handleClick);
    } else if (select && lasso) {
      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      if (clickHandle) {
        clickHandle.remove();
      }
      clickHandle = view.on("click", handleClick);
    } else {
      if (clickHandle) {
        try {
          clickHandle.remove();
        } catch (error) {
          console.error("Failed to remove clickHandle", error);
        }
      }
      if (DetailsHandle) {
        try {
          DetailsHandle.remove();
        } catch (error) {
          console.error("Failed to remove DetailsHandle", error);
        }
      }
    }
  });

  $("#home").on("click", function (e) {
    view.goTo(webmap.portalItem.extent);
  });

  class Parcel {
    constructor(
      objectid,
      location,
      uniqueId,
      gisLink,
      coOwner,
      owner,
      MBL,
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
      Land_Type,
      Prior_Assessment_Year,
      Prior_Assessed_Total,
      Prior_Appraised_Total
    ) {
      this.objectid = objectid;
      this.location = location;
      this.uniqueId = uniqueId;
      this.GIS_LINK = gisLink;
      this.coOwner = coOwner;
      this.owner = owner;
      this.MBL = MBL;
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
      this.Prior_Assessment_Year = Prior_Assessment_Year;
      this.Prior_Assessed_Total = Prior_Assessed_Total;
      this.Prior_Appraised_Total = Prior_Appraised_Total;
    }
  }

  // Wait until the view is loaded
  view.when(function () {
    document.getElementById("zoom-in").onclick = function () {
      view.zoom += 1;
    };

    // Set up the event listener for the zoom out button
    document.getElementById("zoom-out").onclick = function () {
      view.zoom -= 1;
    };
  });

  clearBtn.addEventListener("click", function () {
    clearContents();
  });

  document
    .getElementById("searchInput")
    .addEventListener("input", function (e) {
      runQuerySearchTerm = e.target.value.toUpperCase();
    });

  function queryRelatedRecords(searchTerm) {
    $(".spinner-container").show();
    const tableSearch = true;
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

    let GISLINK;

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
        // console.log(`no condos result: ${result.features}`);
        // view.goTo(result.features);
        if (result.features.length >= 1) {
          noCondosParcelGeom = result.features;
          addPolygons(result, view.graphics);
          processFeatures(result.features);

          if (result.features.length == 1) {
            view.goTo({
              target: result.features,
              // zoom: 15,
            });
          } else {
            view.goTo({
              target: result.features,
            });
          }
        } else if (result.features.length === 1 && firstList.length > 2) {
          // console.log(result.features[0].attributes);

          const firstQuery = noCondosTable.createQuery();
          firstQuery.where = whereClause;
          firstQuery.returnGeometry = false;
          firstQuery.outFields = ["*"];

          noCondosTable.queryFeatures(firstQuery).then(function (result) {
            addPolygons(result.features, "", "", tableSearch);
            processFeatures();
          });

          // addPolygons(firstList, view.graphics);
          // processFeatures(firstList);
        } else {
          const firstQuery = noCondosTable.createQuery();
          firstQuery.where = whereClause;
          firstQuery.returnGeometry = false;
          firstQuery.outFields = ["*"];

          if (result.features.length == 0) {
            noCondosTable
              .queryFeatures(firstQuery)
              .then(function (result) {
                GISLINK = result.features[0].attributes.GIS_LINK;
              })
              .then(function (result) {
                const newQuery = noCondosLayer.createQuery();
                newQuery.where = `GIS_LINK = '${GISLINK}'`;
                newQuery.returnGeometry = true;
                newQuery.outFields = ["*"];

                noCondosLayer.queryFeatures(newQuery).then(function (result) {
                  console.log(result);

                  view.goTo({
                    target: result.features,
                    // zoom: 15,
                  });

                  noCondosParcelGeom = result.features;
                  addPolygons(result, view.graphics);
                  processFeatures(result.features);
                });
              });
          }
        }
      });
    } else {
      CondosLayer.queryFeatures(query2).then(function (result) {
        if (result.features) {
          // console.log(`condos result: ${result}`);
          if (result.features.length > 2) {
            view.goTo(result.features);
          } else {
            view.goTo({
              target: result.features,
              // zoom: 15,
            });
          }
          addPolygons(result, view.graphics);
          processFeatures(result.features);
        }
      });
    }
    // mapHandle = view.on("click", mapDetailsClick);
    if (clickHandle) {
      clickHandle.remove();
    }
    if (DetailsHandle) {
      DetailsHandle.remove();
    }
    DetailsHandle = view.on("click", handleDetailsClick);
    lasso = false;
    select = false;
  }

  // var clickHandle = view.on("click", handleClick);
  // var DetailsHandle = view.on("click", handleDetailsClick);
  // mapHandle = view.on("click", mapDetailsClick);

  // function that will by pass search and polygongraphics
  // might need to add polygongraphics from here

  // function mapDetailsClick(event) {
  //   console.log("map Details getting clicked");

  //   zoomToFeature(objectID, polygonGraphics, itemId);
  //   buildDetailsPanel(objectID, itemId);

  // }
  function handleDetailsClick(event) {
    if (clickHandle) {
      clickHandle.remove();
    }
    $("#details-spinner").show();
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

    // isClickEvent = true;

    if (sessionStorage.getItem(key) === "no") {
      let query = CondosLayer.createQuery();
      query.geometry = event.mapPoint;
      query.distance = 1;
      query.units = "feet";
      query.spatialRelationship = "within";
      query.returnGeometry = true;
      query.outFields = ["*"];

      noCondosLayer.queryFeatures(query).then(function (response) {
        totalResults = response.features;
        let objID = response.features[0].attributes.OBJECTID;
        let geom = response.features[0].geometry;
        let item = response.features[0];
        // console.log(totalResults);

        zoomToDetail(objID, geom, item);
        clickDetailsPanel(totalResults);
      });
    } else {
      let query2 = CondosLayer.createQuery();
      query2.geometry = event.mapPoint;
      query2.distance = 1;
      query2.units = "feet";
      query2.spatialRelationship = "within";
      query2.returnGeometry = true;
      query2.outFields = ["*"];

      CondosLayer.queryFeatures(query2).then(function (response) {
        totalResults = response.features;
        let objID = response.features[0].attributes.OBJECTID;
        let geom = response.features[0].geometry;
        let item = response.features[0];

        zoomToDetail(objID, geom, item);
        clickDetailsPanel(totalResults);
      });
    }
  }

  function handleClick(event) {
    detailsHandleUsed = "click";
    // console.log(event);

    isClickEvent = true;
    if (DetailsHandle) {
      DetailsHandle.remove();
    }

    if (sessionStorage.getItem(key) === "no") {
      let query = CondosLayer.createQuery();
      query.geometry = event.mapPoint;
      query.distance = 1;
      query.units = "feet";
      query.spatialRelationship = "within";
      query.returnGeometry = true;
      query.outFields = ["*"];

      noCondosLayer.queryFeatures(query).then(function (response) {
        totalResults = response.features;
        console.log(totalResults);
        processFeatures(totalResults, "", event);
        addPolygons(response, view.graphics, isClickEvent);
      });
    } else {
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

        // gets added to firstList in processFeatures
        // so when you splice it, it will be right back every click
        // logic needs to be different
        processFeatures(totalResults, "", event);
        addPolygons(response, view.graphics, isClickEvent);

        // processFeatures(totalResults, "", event, removeFromList);
      });
    }
  }

  // items on the left panel

  $(document).ready(function () {
    $("#backButton").on("click", function () {
      // clickHandle = view.on("click", handleClick);
      if (!lasso && !select) {
        // add details and remove when search and no lasso
        if (DetailsHandle) {
          DetailsHandle.remove();
        }

        if (clickHandle) {
          clickHandle.remove();
        }

        if (clickHandle && select) {
          clickHandle.remove();
        }
        $("#select-button").removeClass("btn-warning");
        DetailsHandle = view.on("click", handleDetailsClick);
      } else if ((!lasso && select) || (!select && lasso)) {
        if (clickHandle) {
          clickHandle.remove();
        }
        if (DetailsHandle) {
          DetailsHandle.remove();
        }
        $("#select-button").addClass("btn-warning");
        clickHandle = view.on("click", handleClick);
      } else if (lasso && !select) {
        if (clickHandle) {
          clickHandle.remove();
        }
        if (DetailsHandle) {
          DetailsHandle.remove();
        }
        clickHandle = view.on("click", handleClick);
        $("#select-button").addClass("btn-warning");
      } else {
        // else add the select click, not the details
        // DetailsHandle = view.on("click", handleDetailsClick);
        if (clickHandle) {
          clickHandle.remove();
        }
        if (DetailsHandle) {
          DetailsHandle.remove();
        }
        $("#select-button").addClass("btn-warning");
        clickHandle = view.on("click", handleClick);
      }
      $("#select-button").prop("disabled", false);
      $("#detailBox").hide();
      $("#filterDiv").hide();
      $("#layerListDiv").hide();
      $("#featureWid").show();
      // $("#result-btns").show();
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

      view.graphics.addMany(polygonGraphics);
      // if (polygonGraphics.length > 1) {
      //   view.goTo({
      //     target: polygonGraphics,
      //     zoom: oldZoom,
      //   });

      //   console.log(`more than 1`);
      // } else {
      //   view.goTo({
      //     target: polygonGraphics,
      //     zoom: oldZoom,
      //   });
      // }
    });
  });

  $(document).ready(function () {
    $("#detailsButton").on("click", function () {
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#filterDiv").hide();
      $("#layerListDiv").hide();
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
      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      DetailsHandle = view.on("click", handleDetailsClick);
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
      // clickHandle.remove();
      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      if (clickHandle) {
        clickHandle.remove();
      }
      $("#exportResults").hide();
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#details-btns").hide();
      $("#exportSearch").hide();
      $("#filterDiv").hide();
      $("#layerListDiv").hide();
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
    $("#filterButton").on("click", function () {
      $("#exportResults").hide();
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#details-btns").hide();
      $("#exportSearch").hide();
      $("#abutters-content").hide();
      $("#layerListDiv").hide();
      $("#selected-feature").empty();
      $("#backButton").hide();
      $("#detailsButton").hide();
      $("#dropdown").show();
      $("#filterDiv").show();
      $("#dropdown").toggleClass("expanded");
      $("#sidebar2").css("left", "0px");
      $("#results-div").css("left", "350px");
      $("#left-arrow-2").show();
      $("#right-arrow-2").hide();
      $("#results-div").css("height", "200px");
      $("#parcel-feature").empty();
      $("#backButton").show();
      $("#backButton-div").css("padding-top", "78px");
      $("#abutters-title").html(`Abutting Parcels (0)`);
    });
  });

  $(document).ready(function () {
    $("#layerListBtn").on("click", function () {
      $("#exportResults").hide();
      $("#detailBox").hide();
      $("#featureWid").hide();
      $("#result-btns").hide();
      $("#total-results").hide();
      $("#details-btns").hide();
      $("#exportSearch").hide();
      $("#abutters-content").hide();
      $("#selected-feature").empty();
      $("#backButton").hide();
      $("#detailsButton").hide();
      $("#dropdown").show();
      $("#filterDiv").hide();
      $("#backButton").show();
      $("#dropdown").toggleClass("expanded");
      $("#sidebar2").css("left", "0px");
      $("#results-div").css("left", "350px");
      $("#left-arrow-2").show();
      $("#right-arrow-2").hide();
      $("#results-div").css("height", "200px");
      $("#layerListDiv").show();
      // $("#detailsButton").show();
      $("#parcel-feature").empty();
      $("#backButton-div").css("padding-top", "78px");
      $("#abutters-title").html(`Abutting Parcels (0)`);
    });
  });

  $("#layerListDiv").hide();

  $(document).ready(function () {
    $("#exportSearch").on("click", function (e) {
      e.stopPropagation();

      const printContainer = document.createElement("div");

      // Optionally, make this container invisible
      printContainer.style.visibility = "hidden";
      document.body.appendChild(printContainer);

      const resultsListGroup = document.createElement("ul");

      uniqueArray.forEach(function (feature) {
        let objectID = feature.objectid;
        let owner = feature.owner;
        let coOwner = feature.coOwner;
        let mailingAddress = feature.mailingAddress;
        let mailingAddress2 = feature.mailingAddress2;
        let Mailing_City = feature.Mailing_City;
        let Mail_State = feature.Mail_State;
        let Mailing_Zip = feature.Mailing_Zip;

        const listItem = document.createElement("li");
        listItem.classList.add("export-search-list");

        let listItemHTML;

        listItemHTML = ` ${owner} ${coOwner} <br> ${mailingAddress} ${mailingAddress2} <br> ${Mailing_City}, ${Mail_State} ${Mailing_Zip}`;

        listItem.innerHTML += listItemHTML;
        listItem.setAttribute("object-id", objectID);

        resultsListGroup.appendChild(listItem);
      });

      // Append the list to the print container
      printContainer.appendChild(resultsListGroup);

      ExportDetails("search");
      document.body.removeChild(printContainer);
    });
  });

  // EXPORT RESULTS
  $(document).ready(function () {
    $("#exportResults").on("click", function (e) {
      e.stopPropagation();
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
      e.preventDefault();
      currentVal = value.value = parseInt(value.value);
      $("#parcel-feature").empty();
      bufferPush();
    });

    // Handler for keypress event on the input field
    $("#buffer-value").on("keypress", function (e) {
      // Replace 'yourInputFieldId' with the actual ID of your input field
      if (e.which == 13) {
        currentVal = value.value = parseInt(value.value); // 13 is the Enter key
        e.preventDefault(); // Prevent the default form submission
        bufferPush();
      }
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
      listItems = document.querySelectorAll(".export-search-list");
    } else {
      listItems = document.querySelectorAll(".abutters-group-item");
    }

    const originalContents = [];

    document.querySelectorAll(".search-list").forEach(function (li, index) {
      // Store the original HTML of each list item
      originalContents[index] = li.innerHTML;
    });

    document.querySelectorAll(".removable-div").forEach(function (div) {
      div.parentNode.removeChild(div); // Remove the div from its parent
    });
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
    win.document.close();
    console.log(win.document);

    setTimeout(() => {
      win.print();
      win.close();
      document.querySelectorAll(".search-list").forEach(function (li, index) {
        if (originalContents[index]) {
          li.innerHTML = originalContents[index];
        }
      });
    }, 250);
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
          $("#abutters-spinner").hide();
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
          $("#abutters-spinner").hide();
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
    view.goTo({
      target: newBufferGraphic,
      zoom: oldZoom,
    });
  }

  function runBuffer(value) {
    $("#abutters-spinner").show();
    // console.log(detailsGeometry);
    let buffer = value;
    let unit = queryUnits;
    let bufferResults;

    if (sessionStorage.getItem(key) == "no" && CondoBuffer == false) {
      bufferResults = geometryEngine.buffer(targetExtent, buffer, unit);
      // console.log(`no condos buffer run`);
    } else {
      bufferResults = geometryEngine.buffer(detailsGeometry, buffer, unit);
      // console.log(`condos buffer run`);
    }

    addOrUpdateBufferGraphic(bufferResults);
    queryDetailsBuffer(bufferResults);
  }

  function clickDetailsPanel(item) {
    $("#select-button").prop("disabled", true);
    $("#select-button").removeClass("btn-warning");
    detailsHandleUsed = "detailClick";
    $("#detail-content").empty();
    $("#selected-feature").empty();
    let features = item[0].attributes;
    // console.log(features);
    let Location = features.Location === undefined ? "" : features.Location;
    let locationUniqueId =
      features.Uniqueid === undefined ? "" : features.Uniqueid;
    let locationCoOwner =
      features.Co_Owner === undefined ? "" : features.Co_Owner;
    let locationOwner = features.Owner === undefined ? "" : features.Owner;
    let locationMBL = features.MBL === undefined ? "" : features.MBL;
    let mailingAddress =
      features.Mailing_Address_1 === undefined
        ? ""
        : features.Mailing_Address_1;
    let Mailing_City =
      features.Mailing_City === undefined ? "" : features.Mailing_City + ", ";
    let Mail_State =
      features.Mail_State === undefined ? "" : features.Mail_State;
    let Mailing_Zip =
      features.Mailing_Zip === undefined ? "" : features.Mailing_Zip;
    let Total_Acres =
      features.Total_Acres === undefined ? "" : features.Total_Acres;
    let Parcel_Primary_Use =
      features.Parcel_Primary_Use === undefined
        ? ""
        : features.Parcel_Primary_Use;
    let Building_Use_Code =
      features.Building_Use_Code === undefined
        ? ""
        : features.Building_Use_Code;
    let Parcel_Type =
      features.Parcel_Type === undefined ? "" : features.Parcel_Type;
    let Design_Type =
      features.Design_Type === undefined ? "" : features.Design_Type;
    let Zoning = features.Zoning === undefined ? "" : features.Zoning;
    let Neighborhood =
      features.Neighborhood === undefined ? "" : features.Neighborhood;
    let Land_Type_Rate =
      features.Land_Type_Rate === undefined ? "" : features.Land_Type_Rate;
    let Functional_Obs =
      features.Functional_Obs === undefined ? "" : features.Functional_Obs;
    let External_Obs =
      features.External_Obs === undefined ? "" : features.External_Obs;
    let Sale_Date = features.Sale_Date === undefined ? "" : features.Sale_Date;
    let Sale_Price =
      features.Sale_Price === undefined ? "" : features.Sale_Price;
    let Vol_Page = features.Vol_Page === undefined ? "" : features.Vol_Page;
    let Assessed_Total =
      features.Assessed_Total === undefined ? "" : features.Assessed_Total;
    let Appraised_Total =
      features.Appraised_Total === undefined ? "" : features.Appraised_Total;
    let Prior_Appraised_Total =
      features.Prior_Appraised_Total === undefined
        ? ""
        : features.Prior_Appraised_Total;
    let Prior_Assessed_Total =
      features.Prior_Assessed_Total === undefined
        ? ""
        : features.Prior_Assessed_Total;
    let Prior_Assessment_Year =
      features.Prior_Assessment_Year === undefined
        ? ""
        : features.Prior_Assessment_Year;

    const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
    // console.log(matchedObject);

    const detailsDiv = document.getElementById("detail-content");

    const details = document.createElement("div");
    details.innerHTML = "";
    details.classList.add("details");

    details.innerHTML = `
        <p>
        <span style="font-family:Tahoma;font-size:14px;"><strong>${Location}</strong></span> <br>
        </p>

        <div>
        <img src=https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg alt="Building Photo" width="200" height="100"><br>
        </div>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${locationOwner} ${locationCoOwner}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${mailingAddress}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"><strong>${Mailing_City} ${Mail_State} ${Mailing_Zip}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;">Unique ID: <strong>${locationUniqueId}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">MBL: <strong>${locationMBL}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Total Acres: <strong>${Total_Acres}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>Latest Qualified Sale:</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Sold on: <strong>${Sale_Date}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Sale Price: <strong>${Sale_Price}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Volume/Page: <strong>${Vol_Page}</strong></span><br>

        </p>
        <p>
        <span style="font-family:Tahoma;font-size:12px;"><strong>Valuations:</strong></span><br>
        <span style="font-family:Tahoma;font-size:12px;">GL Year: <strong>${Prior_Assessment_Year}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Assessment: <strong>${Prior_Assessed_Total}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;">Appraised: <strong>${Prior_Appraised_Total}</strong></span> <br>
        <span style="font-family:Tahoma;font-size:12px;"></span>
        </p>
        <p>
        <a target="_blank" rel="noopener noreferrer" href=https://www.propertyrecordcards.com/PropertyResults.aspx?towncode=150&amp;uniqueid=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/CT_Washington/Quick_Maps/QM_${locationUniqueId}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Parcel Map</strong></span></a><span style="font-family:Tahoma;font-size:12px;"> </span><br>
        <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/CT_Washington/Tax_Maps/TaxMap_{Map}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Tax map</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://www.mytaxbill.org/inet/bill/parcel.do?town=washington&amp;uniqueId=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/CT_Town_Profiles/Washington_Demographics_2023.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Demographics Profile</strong></span></a><br>
        <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/CT_Town_Profiles/Washington_Housing_2022.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Housing Profile</strong></span></a><br>
              
        `;
    $("#details-spinner").hide();
    detailsDiv.appendChild(details);
  }

  function buildDetailsPanel(objectId, itemId) {
    $("#select-button").prop("disabled", true);
    $("#select-button").removeClass("btn-warning");

    if (clickHandle) {
      clickHandle.remove();
    }

    detailsHandleUsed = "detailClick";
    $("#exportResults").hide();
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
    let Location =
      matchedObject.location === undefined ? "" : matchedObject.location;
    let locationUniqueId =
      matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;
    let locationCoOwner =
      matchedObject.coOwner === undefined ? "" : matchedObject.coOwner;
    let locationOwner =
      matchedObject.owner === undefined ? "" : matchedObject.owner;
    let locationMBL = matchedObject.MBL === undefined ? "" : matchedObject.MBL;
    let mailingAddress =
      matchedObject.mailingAddress === undefined
        ? ""
        : matchedObject.mailingAddress;
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

    let Prior_Appraised_Total =
      matchedObject.Prior_Appraised_Total === undefined
        ? ""
        : matchedObject.Prior_Appraised_Total;
    let Prior_Assessed_Total =
      matchedObject.Prior_Assessed_Total === undefined
        ? ""
        : matchedObject.Prior_Assessed_Total;
    let Prior_Assessment_Year =
      matchedObject.Prior_Assessment_Year === undefined
        ? ""
        : matchedObject.Prior_Assessment_Year;

    const imageUrl = `https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg`;
    const detailsDiv = document.getElementById("detail-content");
    const details = document.createElement("div");

    details.innerHTML = "";
    details.classList.add("details");

    details.innerHTML = `
    <p>
    <span style="font-family:Tahoma;font-size:14px;"><strong>${Location}</strong></span> <br>
    </p>

    <div>
    <img src=https://publicweb-gis.s3.amazonaws.com/Images/Bldg_Photos/Washington_CT/${locationUniqueId}.jpg alt="Building Photo" width="200" height="100"><br>
    </div>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${locationOwner} ${locationCoOwner}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${mailingAddress}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"><strong>${Mailing_City} ${Mail_State} ${Mailing_Zip}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;">Unique ID: <strong>${locationUniqueId}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">MBL: <strong>${locationMBL}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Total Acres: <strong>${Total_Acres}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Primary Use: <strong>${Parcel_Primary_Use}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Primary Bldg Use: <strong>${Building_Use_Code}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>Latest Qualified Sale:</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Sold on: <strong>${Sale_Date}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Sale Price: <strong>${Sale_Price}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Volume/Page: <strong>${Vol_Page}</strong></span><br>

    </p>
    <p>
    <span style="font-family:Tahoma;font-size:12px;"><strong>Valuations:</strong></span><br>
    <span style="font-family:Tahoma;font-size:12px;">GL Year: <strong>${Prior_Assessment_Year}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Assessment: <strong>${Prior_Assessed_Total}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;">Appraised: <strong>${Prior_Appraised_Total}</strong></span> <br>
    <span style="font-family:Tahoma;font-size:12px;"></span>
    </p>
    <p>
    <a target="_blank" rel="noopener noreferrer" href=https://www.propertyrecordcards.com/PropertyResults.aspx?towncode=150&amp;uniqueid=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Property Card</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/CT_Washington/Quick_Maps/QM_${locationUniqueId}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Parcel Map</strong></span></a><span style="font-family:Tahoma;font-size:12px;"> </span><br>
    <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/PDFs/CT_Washington/Tax_Maps/TaxMap_{Map}.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Tax map</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://www.mytaxbill.org/inet/bill/parcel.do?town=washington&amp;uniqueId=${locationUniqueId}><span style="font-family:Tahoma;font-size:12px;"><strong>Tax Bills</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/CT_Town_Profiles/Washington_Demographics_2023.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Demographics Profile</strong></span></a><br>
    <a target="_blank" rel="noopener noreferrer" href=https://publicweb-gis.s3.amazonaws.com/CT_Town_Profiles/Washington_Housing_2022.pdf><span style="font-family:Tahoma;font-size:12px;"><strong>Housing Profile</strong></span></a><br>
          
    `;

    $("#details-spinner").hide();
    detailsDiv.appendChild(details);
  }

  function zoomToDetail(objectid, geom, item) {
    detailsChanged = {
      isChanged: true,
      item: item,
    };
    let bufferGraphicId = "uniqueBufferGraphicId";

    view.graphics.removeAll(polygonGraphics);

    const fillSymbol = {
      type: "simple-fill",
      color: [0, 0, 0, 0.1],
      outline: {
        color: [255, 0, 0, 1],
        width: 3,
      },
    };

    // if (sessionStorage.getItem(key) == "no") {
    // if (noCondosParcelGeom) {
    // CondoBuffer = false;
    targetExtent = geom;
    detailsGeometry = geom;

    const polygonGraphic = new Graphic({
      geometry: targetExtent,
      symbol: fillSymbol,
      id: bufferGraphicId,
    });

    view.graphics.addMany([polygonGraphic]);
    view.goTo({
      target: polygonGraphic,
      zoom: oldZoom,
      // zoom: 15,
    });

    // buildZoomToFeature(polygonGraphic);
    // }
    // } else {
    // }
  }

  function zoomToFeature(objectid, notPolygonGraphics, gisLink) {
    detailsChanged = {
      isChanged: false,
      item: "",
    };
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
      if (noCondosParcelGeom) {
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
          zoom: oldZoom,
        });
      } else {
        let whereClause = `GIS_LINK = '${gisLink}'`;
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
            zoom: oldZoom,
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

          view.goTo({
            target: detailsGeometry,
            zoom: oldZoom,
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
              zoom: oldZoom,
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
    if (clickHandle) {
      clickHandle.remove();
    }
    if (DetailsHandle) {
      DetailsHandle.remove();
    }
    DetailsHandle = view.on("click", handleDetailsClick);
  }

  const buildAbuttersPanel = function (e, b) {
    $("#abutters-title").html("Abutters");

    let itemSelected = detailSelected;

    let locationMaillingAddress;
    let locationUniqueId;
    let locationGISLINK;
    let locationOwner;
    let locationMBL;

    if (detailsChanged.isChanged) {
      console.log(e);
      locationMaillingAddress =
        detailsChanged.item.attributes.Mailing_Address_1;
      locationUniqueId = detailsChanged.item.attributes.Uniqueid;
      locationGISLINK = detailsChanged.item.attributes.GIS_LINK;
      locationOwner = detailsChanged.item.attributes.Owner;
      locationMBL = detailsChanged.item.attributes.MBL;
    } else {
      var matchedObject = firstList.find(function (item) {
        return (
          (item.uniqueId === itemSelected[1] &&
            item.objectid === Number(itemSelected[0])) ||
          (item.GIS_LINK === itemSelected[1] &&
            item.objectid === Number(itemSelected[0]))
        );
      });

      locationMaillingAddress =
        matchedObject.mailingAddress === undefined
          ? ""
          : matchedObject.mailingAddress;

      locationUniqueId =
        matchedObject.uniqueId === undefined ? "" : matchedObject.uniqueId;

      locationGISLINK =
        matchedObject.GIS_LINK === undefined ? "" : matchedObject.GIS_LINK;

      locationOwner =
        matchedObject.owner === undefined ? "" : matchedObject.owner;

      locationMBL = matchedObject.MBL === undefined ? "" : matchedObject.MBL;
    }

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
    $("#abutters-spinner").hide();
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

    if (searchTerm.length < 3 || !searchTerm) {
      clearContents();
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
                let Prior_Assessment_Year =
                  feature.attributes["Prior_Assessment_Year"];
                let Prior_Assessed_Total =
                  feature.attributes["Prior_Assessed_Total"];
                let Prior_Appraised_Total =
                  feature.attributes["Prior_Appraised_Total"];

                firstList.push(
                  new Parcel(
                    objectId,
                    locationVal,
                    locationUniqueId,
                    locationGISLINK,
                    locationCoOwner,
                    locationOwner,
                    locationMBL,
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
                    Prior_Assessment_Year,
                    Prior_Assessed_Total,
                    Prior_Appraised_Total
                  )
                );
              }
            });

            // let debounceTimer;
            // function bufferQuery() {
            //   clearTimeout(debounceTimer);
            //   debounceTimer = setTimeout(() => {
            //     queryRelatedRecords(runQuerySearchTerm);
            //   }, 300);
            // }
            // bufferQuery();
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
        //CondosLayer.visible = false;
        //noCondosLayer.visible = false;

        firstList = [];
        secondList = [];
        polygonGraphics = [];
        $("#select-button").removeClass("btn-warning");
        // $("#lasso").prop("disabled", false);
        // select = true;
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
        if (DetailsHandle) {
          DetailsHandle.remove();
        }

        if (clickHandle) {
          clickHandle.remove();
        }

        let suggestionsContainer = document.getElementById("suggestions");
        suggestionsContainer.innerHTML = "";
        $("#featureWid").empty();

        view.graphics.removeAll();

        // view.goTo(webmap.portalItem.extent);

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
      polygonGraphics = [];

      e.preventDefault();
      $("#featureWid").empty();
      $("#selected-feature").empty();
      // $("#exportSearch").show();
      if (DetailsHandle) {
        DetailsHandle.remove();
      }
      if (clickHandle) {
        clickHandle.remove();
      }
    });

  // Hide suggestions when clicking outside
  document.addEventListener("click", function (e) {
    if (e.target.id !== "searchInput") {
      document.getElementById("suggestions").style.display = "none";
    }
  });

  let debounceTimer2;

  function hitQuery() {
    // console.log(`getting hit`);
    // $("#sidebar2").css("left", "-350px");
    // $("#results-div").css("left", "0px");
    if (sessionStorage.getItem(key) === "no") {
      noCondosLayer.visible = true;
    } else {
      CondosLayer.visible = true;
    }

    $("#lasso").removeClass("btn-warning");
    $("#select-button").removeClass("btn-warning");
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
    // $("#exportResults").hide();
    // $("#exportSearch").show();
    $("#abutters-title").html(`Abutting Parcels (0)`);
    polygonGraphics = [];
    view.graphics.removeAll();
    if (DetailsHandle) {
      DetailsHandle.remove();
    }
    if (clickHandle) {
      clickHandle.remove();
    }

    runQuery();
  }

  document
    .getElementById("searchButton")
    .addEventListener("click", function () {
      $("#sidebar2").css("left", "-350px");
      $("#results-div").css("left", "0px");
      $("#exportResults").hide();
      // let debounceTimer;
      function throttleQuery() {
        clearTimeout(debounceTimer2);
        debounceTimer2 = setTimeout(() => {
          hitQuery();
        }, 300);
      }
      throttleQuery();
    });

  $(document).ready(function () {
    let queryParameters = {
      streetName: null,
      owner: null,
      appraisedValueMin: null,
      appraisedValueMax: null,
      assessedValueMin: null,
      assessedValueMax: null,
      propertyType: null,
      buildingType: null,
      buildingUseType: null,
      designType: null,
      acresValueMin: null,
      acresValueMax: null,
      soldOnMin: null,
      soldOnMax: null,
      soldPMin: null,
      soldPMax: null,
    };

    function updateQuery() {
      let queryParts = [];
      if (
        queryParameters.streetName !== null &&
        queryParameters.streetName.length > 1
      ) {
        if (Array.isArray(queryParameters.streetName)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const streetNameParts = queryParameters.streetName.map(
            (name) => `Street_Name LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${streetNameParts.join(" OR ")})`);
        } else {
          queryParts.push(
            `(Street_Name LIKE '%${queryParameters.streetName.trim()}%')`
          );
        }
      }
      if (queryParameters.owner !== null && queryParameters.owner.length > 1) {
        if (Array.isArray(queryParameters.owner)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const ownerParts = queryParameters.owner.map(
            (name) => `Owner LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${ownerParts.join(" OR ")})`);
        } else {
          queryParts.push(`(Owner LIKE '%${queryParameters.owner.trim()}%')`);
        }
      }

      if (
        queryParameters.appraisedValueMin !== null &&
        queryParameters.appraisedValueMax !== null
      ) {
        queryParts.push(
          `Appraised_Total BETWEEN ${queryParameters.appraisedValueMin} AND ${queryParameters.appraisedValueMax}`
        );
      }

      if (
        queryParameters.assessedValueMin !== null &&
        queryParameters.assessedValueMax !== null
      ) {
        queryParts.push(
          `Assessed_Total BETWEEN ${queryParameters.assessedValueMin} AND ${queryParameters.assessedValueMax}`
        );
      }
      if (
        queryParameters.propertyType !== null &&
        queryParameters.propertyType.length > 1
      ) {
        if (Array.isArray(queryParameters.propertyType)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const PropertyParts = queryParameters.propertyType.map(
            (name) => `Parcel_Type LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${PropertyParts.join(" OR ")})`);
        } else {
          queryParts.push(
            `(Parcel_Type LIKE '%${queryParameters.propertyType.trim()}%')`
          );
        }
      }

      if (
        queryParameters.buildingType !== null &&
        queryParameters.buildingType.length > 1
      ) {
        if (Array.isArray(queryParameters.buildingType)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const BuildingParts = queryParameters.buildingType.map(
            (name) => `Building_Type LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${BuildingParts.join(" OR ")})`);
        } else {
          queryParts.push(
            `(Building_Type LIKE '%${queryParameters.buildingType.trim()}%')`
          );
        }
      }

      if (
        queryParameters.buildingUseType !== null &&
        queryParameters.buildingUseType.length > 1
      ) {
        if (Array.isArray(queryParameters.buildingUseType)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const BuildingUseParts = queryParameters.buildingUseType.map(
            (name) => `Building_Use_Type LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${BuildingUseParts.join(" OR ")})`);
        } else {
          queryParts.push(
            `(Building_Use_Type LIKE '%${queryParameters.buildingUseType.trim()}%')`
          );
        }
      }

      if (
        queryParameters.designType !== null &&
        queryParameters.designType.length > 1
      ) {
        if (Array.isArray(queryParameters.designType)) {
          // Map each name in the array to a LIKE query part with % wildcards
          const DesignParts = queryParameters.designType.map(
            (name) => `Design_Type LIKE '%${name.trim()}%'`
          );
          // Join these parts with OR
          queryParts.push(`(${DesignParts.join(" OR ")})`);
        } else {
          queryParts.push(
            `(Design_Type LIKE '%${queryParameters.designType.trim()}%')`
          );
        }
      }

      if (
        queryParameters.acresValueMin !== null &&
        queryParameters.acresValueMax !== null
      ) {
        queryParts.push(
          `Total_Acres BETWEEN ${queryParameters.acresValueMin} AND ${queryParameters.acresValueMin}`
        );
      }

      if (
        queryParameters.soldOnMin !== null &&
        queryParameters.soldOnMax !== null
      ) {
        queryParts.push(
          `Sale_Date BETWEEN ${queryParameters.soldOnMin} AND ${queryParameters.soldOnMax}`
        );
      }

      if (
        queryParameters.soldPMin !== null &&
        queryParameters.soldPMax !== null
      ) {
        queryParts.push(
          `Sale_Price BETWEEN ${queryParameters.soldPMin} AND ${queryParameters.soldPMax}`
        );
      }

      let queryString = queryParts.join(" AND ");

      let query = noCondosLayer.createQuery();
      query.where = queryString;
      query.returnDistinctValues = false;
      query.returnGeometry = true;
      query.outFields = ["*"];

      CondosLayer.queryFeatures(query).then(function (response) {
        clearContents();
        addPolygons(response, view.graphics);
        processFeatures(response.features);
        function clearQueryParameters() {
          Object.keys(queryParameters).forEach((key) => {
            queryParameters[key] = null;
          });

          // $("#app-val-min").value()

          $("#streetFilter").value = "";
        }

        clearQueryParameters();
      });

      console.log(`Query: ${queryString}`);

      // Here, you can use this query string to fetch data from your feature service
    }

    $("#streetFilter").on("calciteComboboxChange", function (e) {
      // value = e.target.value;
      queryParameters.streetName = e.target.value;
      console.log(queryParameters.streetName);

      // console.log(`street filter is: ${value}`);
    });

    $("#ownerFilter").on("calciteComboboxChange", function (e) {
      queryParameters.owner = e.target.value;
      console.log(queryParameters.owner);
    });

    $("#app-val-slider").on("calciteSliderChange", function (e) {
      value = e.target.value;
      minVal = value[0];
      maxVal = value[1];

      queryParameters.appraisedValueMin = minVal;
      $("#app-val-min").val(minVal);
      queryParameters.appraisedValueMax = maxVal;
      $("#app-val-max").val(maxVal);
      // console.log(`appraised value is: ${value}`);
    });

    // Listen for input event on the input elements
    $("#app-val-min, #app-val-max").on("input", function () {
      // Get the values from the input elements
      var minVal = parseInt($("#app-val-min").val());
      var maxVal = parseInt($("#app-val-max").val());

      // Update the slider values
      $("#app-val-slider").calciteSlider("update", [minVal, maxVal]);
    });

    $("#assess-val-slider").on("calciteSliderChange", function (e) {
      value = e.target.value;
      minVal = value[0];
      maxVal = value[1];

      queryParameters.assessedValueMin = minVal;
      $("#assess-val-min").val(minVal);
      queryParameters.assessedValueMax = maxVal;
      $("#assess-val-max").val(maxVal);

      // console.log(`assessed value slider is: ${value}`);
    });

    $("#propertyFilter").on("calciteComboboxChange", function (e) {
      queryParameters.propertyType = e.target.value;
      // console.log(`property filter: ${value}`);
    });

    $("#buildingFilter").on("calciteComboboxChange", function (e) {
      queryParameters.buildingType = e.target.value;
      // console.log(`building filter is: ${value}`);
    });

    $("#buildingUseFilter").on("calciteComboboxChange", function (e) {
      queryParameters.buildingUseType = e.target.value;
      // console.log(`building use filter is: ${value}`);
    });

    $("#designTypeFilter").on("calciteComboboxChange", function (e) {
      queryParameters.designType = e.target.value;
      // console.log(`design type filter is: ${value}`);
    });

    $("#acres-val-slider").on("calciteSliderChange", function (e) {
      value = e.target.value;
      minVal = value[0];
      maxVal = value[1];

      queryParameters.acresValueMin = minVal;
      $("#acres-val-min").val(minVal);
      queryParameters.acresValueMax = maxVal;
      $("#acres-val-max").val(maxVal);
      // console.log(`acres slider is: ${value}`);
    });

    $("#soldon-val-slider").on("calciteSliderChange", function (e) {
      value = e.target.value;
      minVal = value[0];
      maxVal = value[1];

      queryParameters.soldOnMin = minVal;
      $("#sold-val-min").val(minVal);

      queryParameters.soldOnMax = maxVal;
      $("#sold-val-max").val(maxVal);

      // console.log(`sold on slider is: ${value}`);
    });

    $("#saleP-val-slider").on("calciteSliderChange", function (e) {
      value = e.target.value;
      minVal = value[0];
      maxVal = value[1];

      queryParameters.soldPMin = minVal;
      $("#saleP-val-min").val(minVal);

      queryParameters.soldPMax = maxVal;
      $("#saleP-val-max").val(maxVal);

      // console.log(`sale price slider is: ${value}`);
    });

    $("#submitFilter").on("click", function () {
      updateQuery();
    });
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
    $("#Basemap-selector").on("click", function () {
      $("#rightPanel").hide();
      $("#BookmarksDiv").hide();
      $("#PrintDiv").hide();
      $("#Right-Btn-div").show();
      $("#BasemapDiv").show();
      $("#group-container-right").show();
    });

    $("#Bookmarks-selector").on("click", function () {
      $("#rightPanel").hide();
      $("#BasemapDiv").hide();
      $("#PrintDiv").hide();
      $("#Right-Btn-div").show();
      $("#BookmarksDiv").show();
      $("#group-container-right").show();
    });

    $("#Print-selector").on("click", function () {
      $("#rightPanel").hide();
      $("#BookmarksDiv").hide();
      $("#BasemapDiv").hide();
      $("#Right-Btn-div").show();
      $("#PrintDiv").show();
      $("#group-container-right").show();
    });

    $("#right-btn-back").on("click", function () {
      $("#group-container-right").hide();
      $("#PrintDiv").hide();
      $("#BookmarksDiv").hide();
      $("#BasemapDiv").hide();
      $("#Right-Btn-div").hide();
      $("#rightPanel").show();
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
