var zoomToFullLayerExtent;
require(["esri/Map", 
            "esri/layers/GeoJSONLayer", 
            "esri/views/MapView",
            "esri/widgets/BasemapGallery", 
            "esri/widgets/LayerList",
            "esri/widgets/Expand",
            "esri/layers/FeatureLayer",
            "esri/core/watchUtils",
            "esri/config",
            
            ], function (
      Map,
      GeoJSONLayer,
      MapView,
      BasemapGallery,
      LayerList,
      Expand,
      FeatureLayer,
      watchUtils,
      esriConfig
    ) {
      // If GeoJSON files are not on the same domain as your website, a CORS enabled server
      // or a proxy is required.
      esriConfig.request.trustedServers.push("*");
      
      const layerList = [];
      let isFirstLayer = true;
      var firstLayer;
      function addGifAreas(path,name,labelFieldname,outlineColor,fillColor,isFeatureService){
        const gif_dir = 'https://storage.googleapis.com/lcms-gifs/';
        const template = {
          title: null,
          content:  [{
            // The following creates a piechart in addition to an image. The chart is
            // also set  up to work with related tables.
            // Autocasts as new MediaContent()
            type: "media",
            // Autocasts as array of MediaInfo objects
            mediaInfos: [ 
            {
              title: null,
              type: "image", // Autocasts as new ImageMediaInfo object
              // Autocasts as new ImageMediaInfoValue object
              value: {
                "sourceURL": gif_dir+'{GIFNAMECHANGE}',
                "linkURL":  gif_dir+'{GIFNAMECHANGE}',
              }
            },
            {
              title: null,
              type: "image", // Autocasts as new ImageMediaInfo object
              // Autocasts as new ImageMediaInfoValue object
              value: {
                "sourceURL":  gif_dir+'{GIFNAMELANDCOVER}',
                "linkURL":  gif_dir+'{GIFNAMELANDCOVER}',
              }
            },
            {
              title: null,
              type: "image", // Autocasts as new ImageMediaInfo object
              // Autocasts as new ImageMediaInfoValue object
              value: {
                "sourceURL": gif_dir+'{GIFNAMELANDUSE}',
                "linkURL":  gif_dir+'{GIFNAMELANDUSE}',
              }
            }
            ]
          }]
          
        };

        var renderer = {
            type: "simple",  // autocasts as new SimpleRenderer()
            symbol: {
              type: "simple-fill",  // autocasts as new SimpleFillSymbol()
              color: fillColor,
              outline: {  // autocasts as new SimpleLineSymbol()
                width: 0.8,
                color: outlineColor
              }
            }
          };

        const labelClass = {  // autocasts as new LabelClass()
                            symbol: {
                              type: "text",  // autocasts as new TextSymbol()
                              color: "#B2ECE4",
                              haloColor:  "#372E2C",
                              haloSize: 0.8,
                              font: {  // autocast as new Font()
                                 family: "Ubuntu Mono",
                                 size: 12,
                                 // weight: "bold"
                               }
                            },
                            // labelPlacement: "above-right",
                            labelExpressionInfo: {
                              expression: "$feature."+labelFieldname
                            },
                            // maxScale: 0,
                            // minScale: 30000000,
                            
                          };

        if(isFeatureService){
        var layer = new FeatureLayer({
          url: path,
          title: name,
          visible:isFirstLayer,
          copyright: "USFS LCMS",
          popupTemplate: template,
          legendEnabled:true,
          renderer: renderer, //optional
          labelingInfo: [labelClass]
        });
      }else{
        var layer = new GeoJSONLayer({
          url: path,
          title: name,
          visible:isFirstLayer,
          copyright: "USFS LCMS",
          popupTemplate: template,
          legendEnabled:true,
          renderer: renderer, //optional
          labelingInfo: [labelClass]
      
      })};

        layerList.push(layer);
        if(isFirstLayer){
          firstLayer = layer;
        }
        isFirstLayer = false;
      };

      addGifAreas('https://storage.googleapis.com/lcms-gifs/usfs_boundaries.geojson','USFS Forests','FORESTNAME','#1B1716',[ 0, 122, 0, 0.5 ],false);
      addGifAreas('https://storage.googleapis.com/lcms-gifs/usfs_district_boundaries.geojson','USFS Districts','districtna','#1B171A',[ 0, 122, 122, 0.5 ],false);
      // addGifAreas('https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_ForestSystemBoundaries_01/MapServer','USFS Forests','FORESTNAME','#1B1716',[ 0, 122, 0, 0.5 ],true);
      // addGifAreas('https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RangerDistricts_01/MapServer','USFS Districts','DISTRICTNAME','#1B171A',[ 0, 122, 122, 0.5 ],true);
      
      const map = new Map({
        basemap: "hybrid",
        layers: layerList
      });

      const view = new MapView({
        container: "viewDiv",
        map: map
      });


      view.when(()=>{

          if(localStorage.initView !== undefined && localStorage.initView !== null && localStorage.initView !== 'null'){
            view.goTo(JSON.parse(localStorage.initView));
          }

          

          firstLayer.when(()=>{
            zoomToFullLayerExtent = function(){
                view.extent = firstLayer.fullExtent;
            }
            if(localStorage.initView === undefined || localStorage.initView === null || localStorage.initView === 'null'){
                console.log('setting extent');
              zoomToFullLayerExtent();
            }
            watchUtils.whenTrue(view, "stationary",function(evt){
              console.log('stationary');
              localStorage.initView = JSON.stringify({center:[view.center.longitude,view.center.latitude],zoom:view.zoom})
            })

          })
            
            
          // });
          var basemapGallery = new Expand({
            content:new BasemapGallery({
              view: view
            }),
            view:view,
            expanded :false
          })
          // Add widget to the top right corner of the view
          view.ui.add(basemapGallery, {
            position: "top-left"
          });

          var layerList = new LayerList({
          view: view,
          listItemCreatedFunction: function (event) {

                        // The event object contains an item property.
                        // is is a ListItem referencing the associated layer
                        // and other properties. You can control the visibility of the
                        // item, its title, and actions using this object.

                        var item = event.item;



                        // An array of objects defining actions to place in the LayerList.
                        // By making this array two-dimensional, you can separate similar
                        // actions into separate groups with a breaking line.

                        item.actionsSections = [

                            [{
                                title: "Increase opacity ",
                                className: "esri-icon-up",
                                id: "increase-opacity"
                            }, {
                                title: "Decrease opacity",
                                className: "esri-icon-down",
                                id: "decrease-opacity"
                            }]
                        ];


                    }
                
        });
      // Event listener that fires each time an action is triggered

        layerList.on("trigger-action", function (event) {
            console.log(event)
            // The layer visible in the view at the time of the trigger.
            var visibleLayer = event.item.layer;

            //.visible ?
            //USALayer : censusLayer;

            // Capture the action id.
            var id = event.action.id;

            if (id === "increase-opacity") {

                // if the increase-opacity action is triggered, then
                // increase the opacity of the GroupLayer by 0.25

                if (visibleLayer.opacity < 1) {
                    visibleLayer.opacity += 0.25;

                }
            } else if (id === "decrease-opacity") {

                // if the decrease-opacity action is triggered, then
                // decrease the opacity of the GroupLayer by 0.25

                if (visibleLayer.opacity > 0) {
                    visibleLayer.opacity -= 0.25;
                }
            }
        });
    
      var bgExpand = new Expand({
        view: view,
        content: layerList,
        expanded :false
      });
    
      // Add the expand instance to the ui
      view.ui.add(bgExpand, "top-left");


      })
    });

    
